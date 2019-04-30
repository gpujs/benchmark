const benchIt = require('./bench-it'),
  generateMatrices = require('./generate-matrices'),
  { paddificate, matConvFunc, kernel } = require('./conv');

const run = options => {
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

    matConv: options.gpu.createKernel(matConvFunc, {
      output: [options.matrixSize, options.matrixSize]
    }),

    matConvPipe: options.gpu.createKernel(matConvFunc, {
      output: [options.matrixSize, options.matrixSize],
      pipeline: true
    }),

    matConvCpu: options.cpu.createKernel(matConvFunc, {
      output: [options.matrixSize, options.matrixSize]
    }),
  }

  const mat = benchIt(() => generateMatrices(options.matrixSize)),
    padded = benchIt(() => paddificate(mat.ret[0]))

  const benches = {
    matGen: mat.time,
    matPad: padded.time,

    build_time: {
      matMult: {
        gpu: benchIt(() => {funcs.matMult.build(mat.ret[0], mat.ret[1])}).time,
        pipe: benchIt(() => {funcs.matMultPipe.build(mat.ret[0], mat.ret[1])}).time
      },
      matConv: {
        gpu: benchIt(() => {funcs.matConv.build(padded.ret, kernel)}).time,
        pipe: benchIt(() => {funcs.matConvPipe.build(padded.ret, kernel)}).time
      }
    },

    run_time: {
      matMult: {
        gpu: benchIt(() => funcs.matMult(mat.ret[0], mat.ret[1])).time,
        pipe: benchIt(() => funcs.matConvPipe(mat.ret[0], mat.ret[1])).time,
        cpu: benchIt(() => funcs.matMultCpu(mat.ret[0], mat.ret[1])).time
      },
      matConv: {
        gpu: benchIt(() => funcs.matConv(padded.ret, kernel)).time,
        pipe: benchIt(() => funcs.matConvPipe(padded.ret, kernel)).time,
        cpu: benchIt(() => funcs.matMultPipe(padded.ret, kernel)).time
      }
    }
  }

  return benches;
}

module.exports = run;
