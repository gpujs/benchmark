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
  options.output = [options.matrix_size, options.matrix_size];

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
  const out = new BenchmarkOut(run(options), true);
  out.setDataField('score', getScore(out.getDataField('run_time'), options.matrix_size));

  return out;
}

/**
 * @method multipleBenchmark
 * @description runs multiple GPU.js benchmarks each with different options
 * @param {"Array"} options array of optional options objects
 * @returns {"Object"}
 */
const multipleBenchmark = (options = [{}]) => {
  const initOptions = getDefaultOptions(options[0]);
  const out = new BenchmarkOut(run(initOptions));
  out.setDataField(
    'score',
    getScore(
      out.getDataField('run_time', 0),
      initOptions.matrix_size
    ),
    0
  )

  options.forEach((optionSet, i) => {
    if (i == 0) return;

    out.addData(
      run(getDefaultOptions(optionSet))
    )

    out.setDataField(
      'score',
      getScore(
        out.getDataField('run_time', i),
        optionSet.matrix_size
      ),
      i
    )
  })

  return out;
}

module.exports = {
  benchmark,
  multipleBenchmark
}
