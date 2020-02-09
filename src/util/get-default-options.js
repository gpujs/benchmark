const { GPU } = require('gpu.js');

/**
 * @param {...Options} options
 */
const getDefaultOptions = (options) => {
  options.num_benchmarks = options.num_benchmarks || 1;

  options.matrix_size = options.matrix_size || 512;

  options.logs = options.logs || true;
  options.cpu_benchmark = options.cpu_benchmark || true;

  options.gpu = options.gpu || new GPU({mode: 'gpu'});
  options.cpu = options.cpu || new GPU({mode: 'cpu'});

  return options;
}

module.exports = getDefaultOptions;