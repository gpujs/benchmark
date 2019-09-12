const { GPU } = require('gpu.js'),
  run = require('./run'),
  BenchmarkOut = require('./util/benchmark-out'),
  multipleBenchmark = require('./util/multi-bench');

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

  return out;
}

module.exports = {
  benchmark,
  multipleBenchmark
}
