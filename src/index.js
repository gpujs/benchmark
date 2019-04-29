const { GPU } = require('gpu.js'),
  run = require('./run')

const benchmark = (options = {}) => {
  options.numBenchmarks = options.numBenchmarks || 1
  options.mult = options.mult || true
  options.convolution = options.convolution || true
  options.pipeline = options.pipeline || true

  options.matrixSize = options.matrixSize || 512
  options.kernelSIze = options.kernelSIze || 3

  options.gpu = options.gpu || new GPU({mode: 'gpu'})
  options.cpu = options.cpu || new GPU({mode: 'cpu'})

  return run(options)
}

module.exports = benchmark