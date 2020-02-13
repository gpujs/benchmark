const { YELLOW_UNDER, RED_FLASH, NC } = require('../../cli/colors'),
  BenchmarkOut = require('./benchmark-out'),
  getDefaultOptions = require('./get-default-options'),
  run = require('../run'),
  { br } = require('../../cli/format');

const defaultOptions = {
  common_options: { // options common to all but can be overridden in range or in full_options, preference given to range
    cpu_benchmark: false
  },
  range: { // only one of this and full_options works
    option_name: 'matrix_size',
    interval: [128, 1024],
    step: 100 //(default 10) one of step or common_ratio can be used, preference given to step
    // common_ratio: 2 (G.P.: 128, 256, 512, 1024)
  },
  full_options: [
    {
      // array of options objects for each benchmark(only one of this and range works, preference given to range)
    }
  ]
}
/**
 * @method multipleBenchmark
 * @description runs multiple GPU.js benchmarks each with different options
 * @param {"Object"} options array of optional options objects
 * @returns {"Object"}
 */
const multipleBenchmark = (options = defaultOptions) => {
  const out = new BenchmarkOut();
  const commonBenchmarkOptions = getDefaultOptions(options.common_options || defaultOptions.common_options);
  const benchmarkOptionsArr = [];

  if (options.range) {
    const interval = options.range.interval,
      option_name = options.range.option_name;

    if (options.range.step) {
      const step = options.range.step;

      for (let i = interval[0]; i <= interval[1]; i += step) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][option_name] = i;
      }
    }
    else if (options.range.common_ratio) {
      const common_ratio = options.range.common_ratio;

      for (let i = interval[0]; i <= interval[1]; i *= common_ratio) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][option_name] = Math.min(i, interval[1])
      }
    }
    else {
      const step = 10;

      for (let i = interval[0]; i <= interval[1]; i += step) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][option_name] = i;
      }
    }


  }
  else if (options.full_options) {
    options.full_options.forEach(optionSet => {
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

  if (benchmarkOptionsArr.length === 0) console.log(`${RED_FLASH}The Options are Invalid${NC}`);

  return out;
}

module.exports = multipleBenchmark;
