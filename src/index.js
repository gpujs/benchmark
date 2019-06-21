const { GPU } = require('gpu.js'),
  run = require('./run'),
  getScore = require('./stats/getScore');

/**
 * @method benchmark
 * @description benchmarks gpu.js
 * @param {"Object"} options Optional options
 */
const benchmark = (options = {}) => {
  options.num_benchmarks = options.num_benchmarks || 1;

  options.matrix_size = options.matrix_size || 512;
  options.output = [options.matrix_size, options.matrix_size];

  options.logs = typeof options.logs != 'undefined' ? options.logs : true;
  options.cpu_benchmark = typeof options.cpu_benchmark != 'undefined' ? options.cpu_benchmark : true;

  options.gpu = options.gpu || new GPU();
  options.cpu = options.cpu || new GPU({mode: 'cpu'});

  const out = run(options);

  out.score = getScore(out, options.matrix_size);

  return out;
}

module.exports = benchmark;
