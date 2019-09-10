const { GPU } = require('gpu.js'),
  run = require('./run'),
  getScore = require('./stats/getScore'),
  BenchmarkOut = require('./util/benchmarkOut');

/**
 * 
 * @param {"Object"} options 
 */
const getDefaultOptions = (options) => {
  options.num_benchmarks = options.num_benchmarks || 1;

  options.matrix_size = options.matrix_size || 512;

  options.logs = typeof options.logs != 'undefined' ? options.logs : true;
  options.cpu_benchmark = typeof options.cpu_benchmark != 'undefined' ? options.cpu_benchmark : true;

  options.gpu = options.gpu || new GPU({mode: 'gpu'});
  options.cpu = options.cpu || new GPU({mode: 'cpu'});

  return options;
}

/**
 * @method benchmark
 * @description benchmarks gpu.js
 * @param {"Object"} options Optional options
 */
const benchmark = (options = {}) => {

  options = getDefaultOptions(options);
  const out = new BenchmarkOut(true, run(options));
  out.setDataField('score', getScore(out.getDataField('run_time'), options.matrix_size));

  return out;
}

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
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][optionName] = i;
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
    out.addData(run(benchmarkOption));
    out.setDataField(
      'score',
      getScore(out.getDataField('run_time', i), benchmarkOption.matrix_size),
      i
    )
  })

  return out;
}

module.exports = {
  benchmark,
  multipleBenchmark
}
