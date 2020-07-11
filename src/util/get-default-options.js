const defaults = require('./defaults.json');

/**
 * @param {...Options} options
 */
const getDefaultOptions = (options) => {
  options.num_iterations = options.num_iterations || defaults.num_iterations;

  options.matrix_size = options.matrix_size || defaults.matrix_size;

  options.logs = options.logs === undefined ? defaults.logs : options.logs == true;
  options.cpu_benchmark = options.cpu_benchmark === undefined ? defaults.cpu_benchmark : options.cpu_benchmark == true;

  options.gpu = options.gpu;
  options.cpu = options.cpu;

  return options;
}

module.exports = getDefaultOptions;