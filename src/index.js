const run = require('./run'),
  BenchmarkOut = require('./util/benchmark-out'),
  getDefaultOptions = require('./util/get-default-options'),
  multipleBenchmark = require('./util/multi-bench');

/**
 * @method benchmark
 * @description benchmarks gpu.js
 * @param {...Options} options Optional options
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
