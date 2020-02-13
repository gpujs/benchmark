const { GPU } = require('gpu.js'),
  defaults = require('./defaults.json')

/**
 * @param {...Options} options
 */
const getDefaultOptions = (options) => {
  options.num_benchmarks = options.num_benchmarks || defaults.num_benchmarks;

  options.matrix_size = options.matrix_size || defaults.matrix_size;

  options.logs = options.logs === undefined ? defaults.logs : options.logs == true;
  options.cpu_benchmark = options.cpu_benchmark === undefined ? defaults.cpu_benchmark : options.cpu_benchmark == true;

  options.gpu = options.gpu || new GPU({mode: 'gpu'});
  options.cpu = options.cpu || new GPU({mode: 'cpu'});

  return options;
}

module.exports = getDefaultOptions;