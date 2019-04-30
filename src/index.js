const { GPU } = require('gpu.js'),
  run = require('./run');

const benchmark = (options = {}) => {
  options.numBenchmarks = options.numBenchmarks || 1;

  options.matrixSize = options.matrixSize || 512;
  options.output = [options.matrixSize, options.matrixSize];
  options.kernelSIze = options.kernelSIze || 3;

  options.gpu = options.gpu || new GPU();
  options.cpu = options.cpu || new GPU({mode: 'cpu'});

  return run(options);
}

module.exports = benchmark;
