const { GPU } = require('gpu.js'),
  run = require('./run');

const benchmark = (options = {}) => {
  options.num_benchmarks = options.num_benchmarks || 1;

  options.matrix_size = options.matrix_size || 512;
  options.output = [options.matrix_size, options.matrix_size];

  options.logs = typeof options.logs != 'undefined' ? options.logs : true;
  options.cpu_benchmark = typeof options.cpu_benchmark != 'undefined' ? options.cpu_benchmark : true;

  options.gpu = options.gpu || new GPU();
  options.cpu = options.cpu || new GPU({mode: 'cpu'});

  return run(options);
}

module.exports = benchmark;
