const { YELLOW_UNDER, NC } = require('../cli/colors'),
  BenchmarkOut = require('./benchmark-out'),
  getDefaultOptions = require('./get-default-options'),
  run = require('../run'),
  { br } = require('../cli/format');
/**
 * @method multipleBenchmark
 * @description runs multiple GPU.js benchmarks each with different options
 * @param {"Object"} options array of optional options objects
 * @returns {"Object"}
 */
const multipleBenchmark = (options = {
  commonOptions: { // options common to all but can be overridden in range or in fullOptions, preference given to range
    cpu_benchmark: false
  },
  range: { // only one of this and fullOptions works
    optionName: 'matrix_size',
    interval: [128, 1024],
    step: 100 //(default 10) one of step or commonRatio can be used, preference given to step
    // commonRatio: 2 (G.P.: 128, 256, 512, 1024)
  },
  fullOptions: [
    {
      // array of options objects for each benchmark(only one of this and range works, preference given to range)
    }
  ]
}) => {
  const out = new BenchmarkOut();
  const commonBenchmarkOptions = getDefaultOptions(options.commonOptions);
  const benchmarkOptionsArr = [];

  if (options.range) {
    const interval = options.range.interval,
      optionName = options.range.optionName;

    if (options.range.step) {
      const step = options.range.step;

      for (let i = interval[0]; i <= interval[1]; i += step) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][optionName] = i;
      }
    }
    else if (options.range.commonRatio) {
      const commonRatio = options.range.commonRatio;

      for (let i = interval[0]; i <= interval[1]; i *= commonRatio) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][optionName] = Math.min(i, interval[1])
      }
    }
    else {
      const step = 10;

      for (let i = interval[0]; i <= interval[1]; i += step) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][optionName] = i;
      }
    }


  }
  else if (options.fullOptions) {
    options.fullOptions.forEach(optionSet => {
      benchmarkOptionsArr.push({
        ...commonBenchmarkOptions,
        ...optionSet
      })
    })
  }

  benchmarkOptionsArr.forEach((benchmarkOption, i) => {
    console.log(`Config ${YELLOW_UNDER}#${i}${NC}:`);

    console.log(`MATRIX_SIZE: ${YELLOW_UNDER}${benchmarkOption.matrix_size}${NC}`);
    console.log(`NUM_BENCHMARKS: ${YELLOW_UNDER}${benchmarkOption.num_benchmarks}${NC}`);
    console.log(`CPU_BENCHMARK: ${YELLOW_UNDER}${benchmarkOption.cpu_benchmark}${NC}`);
    br();

    out.addData(run(benchmarkOption));
    br();
    br();
  })

  return out;
}

module.exports = multipleBenchmark;
