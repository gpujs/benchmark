const benchIt = require('./benchIt'),
  generateMatrices = require('./generateMatrices'),
  { paddificate, matConvFunc, kernel } = require('./conv')

const run = (options) => {
  const matMultFunc = `function(a, b) {
    let sum = 0;
    for (let i = 0; i < 512; i++) {
      sum += a[this.thread.y][i] * b[i][this.thread.x];
    }
    return sum;
  }`

  const funcs = {
    matMult: options.gpu.createKernel(matMultFunc, {
      output: [options.matrixSize, options.matrixSize]
    }),

    matMultPipe: options.gpu.createKernel(matMultFunc, {
      output: [options.matrixSize, options.matrixSize],
      pipeline: true
    }),

    matMultCpu: options.cpu.createKernel(matMultFunc, {
      output: [options.matrixSize, options.matrixSize]
    }),

    matConv: options.gpu.createKernel(matMultFunc, {
      output: [options.matrixSize, options.matrixSize]
    }),

    matConvPipe: options.gpu.createKernel(matMultFunc, {
      output: [options.matrixSize, options.matrixSize],
      pipeline: true
    }),

    matConvCpu: options.cpu.createKernel(matMultFunc, {
      output: [options.matrixSize, options.matrixSize]
    }),
  }

  const mat = benchIt(() => generateMatrices(options.matrixSize))

  const benches = {
    matGen: mat.time,

    build_time: {
      matMult: {
        gpu: benchIt(() => {funcs.matMult.build(mat.ret[0], mat.ret[1])}).time,
        pipe: benchIt(() => {funcs.matMultPipe.build(mat.ret[0], mat.ret[1])}).time
      },
      matConv: {
        gpu: benchIt(() => {funcs.matConv.build(mat.ret[0], mat.ret[1])}).time,
        pipe: benchIt(() => {funcs.matConvPipe.build(mat.ret[0], mat.ret[1])}).time
      }
    },

    run_time: {
      matMult: {
        gpu: benchIt(() => funcs.matMult(mat.ret[0], mat.ret[1])).time,
        pipe: benchIt(() => funcs.matConvPipe(mat.ret[0], mat.ret[1])).time,
        cpu: benchIt(() => funcs.matMultCpu(mat.ret[0], mat.ret[1])).time
      },
      matConv: {
        gpu: benchIt(() => funcs.matConv(mat.ret[0], mat.ret[1])).time,
        pipe: benchIt(() => funcs.matConvPipe(mat.ret[0], mat.ret[1])).time,
        cpu: benchIt(() => funcs.matMultPipe(mat.ret[0], mat.ret[1])).time
      }
    }
  }

  return benches
}

module.exports = run