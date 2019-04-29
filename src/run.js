const benchIt = require('./benchIt'),
  generateMatrices = require('./generateMatrices')

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
    })
  }

  const mat = benchIt(() => generateMatrices(options.matrixSize))

  const benches = {
    matGen: mat.time,

    build_time: {
      matMult: {
        gpu: benchIt(() => {funcs.matMult.build(mat.ret[0], mat.ret[1])}).time,
        pipe: benchIt(() => {funcs.matMultPipe.build(mat.ret[0], mat.ret[1])}).time
      }
    },

    run_time: {
      matMult: {
        gpu: benchIt(() => funcs.matMult(mat.ret[0], mat.ret[1])).time,
        pipe: benchIt(() => funcs.matMult(mat.ret[0], mat.ret[1])).time,
        cpu: benchIt(() => funcs.matMultCpu(mat.ret[0], mat.ret[1])).time
      }
    }
  }

  return benches
}

module.exports = run