const benchIt = require('./util/bench-it'),
  generateMatrices = require('./benches/generate-matrices'),
  getMinMaxAvg = require('./util/get-min-max'),
  matMult = require('./benches/matrix-multiplication'),
  matConv = require('./benches/convolution'),
  { paddificate, paddingX, paddingY, kernel } = require('./benches/convolution'),
  { YELLOW_UNDER, GREEN_NO_UNDER, NC } = require('./cli/colors'),
  generateStats = require('./stats/getStats');

/**
 * @method run
 * @param {Options} options
 * @return {"Object"}
 */
const run = options => {
  const mat = benchIt(() => generateMatrices(options.matrix_size)),
    padded = benchIt(() => paddificate(mat.ret[0], paddingX, paddingY));

  const funcs = {
    mat_mult: matMult.generateFuncs(options.gpu, options.cpu, options.output),
    mat_conv: matConv.generateFuncs(options.gpu, options.cpu, options.output)
  }

  const benchmarks = {
    mat_mult: {
      gpu: [],
      pipe: [],
      cpu: []
    },
    mat_conv: {
      gpu: [],
      pipe: [],
      cpu: []
    }
  }

  const build_time = {
    mat_mult: {
      gpu: benchIt(() => {funcs.mat_mult.gpu.build(mat.ret[0], mat.ret[1])}).time,
      pipe: benchIt(() => {funcs.mat_mult.pipe.build(mat.ret[0], mat.ret[1])}).time
    },
    mat_conv: {
      gpu: benchIt(() => {funcs.mat_conv.gpu.build(padded.ret, kernel)}).time,
      pipe: benchIt(() => {funcs.mat_conv.pipe.build(padded.ret, kernel)}).time
    }
  }

  for (let i = 1; i <= options.num_benchmarks; i++){
    benchmarks.mat_mult.gpu.push(benchIt(() => funcs.mat_mult.gpu(mat.ret[0], mat.ret[1])).time);
    benchmarks.mat_mult.pipe.push(benchIt(() => funcs.mat_mult.pipe(mat.ret[0], mat.ret[1]).toArray()).time);
    if (options.cpu_benchmark) {benchmarks.mat_mult.cpu.push(benchIt(() => funcs.mat_mult.cpu(mat.ret[0], mat.ret[1])).time)}

    benchmarks.mat_conv.gpu.push(benchIt(() => funcs.mat_conv.gpu(padded.ret, kernel)).time);
    benchmarks.mat_conv.pipe.push(benchIt(() => funcs.mat_conv.pipe(padded.ret, kernel).toArray()).time);
    if (options.cpu_benchmark) {benchmarks.mat_conv.cpu.push(benchIt(() => funcs.mat_conv.cpu(padded.ret, kernel)).time)}

    if (options.logs) console.log(`Benchmark ${YELLOW_UNDER}${i}${NC} ${GREEN_NO_UNDER}completed${NC} ${GREEN_NO_UNDER}✔${NC}`);
  }

  const run_time = {
    mat_mult: {
      gpu: getMinMaxAvg(benchmarks.mat_mult.gpu),
      pipe: getMinMaxAvg(benchmarks.mat_mult.pipe),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.mat_mult.cpu) : {min: -1, avg: -1, max: -1}
    },

    mat_conv: {
      gpu: getMinMaxAvg(benchmarks.mat_conv.gpu),
      pipe: getMinMaxAvg(benchmarks.mat_conv.pipe),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.mat_conv.cpu) : {min: -1, avg: -1, max: -1}
    }
  }
  
  const stats = generateStats(run_time, build_time);

  const benches = {
    mat_gen: mat.time,
    mat_pad: padded.time,

    build_time,

    run_time,

    stats
  }

  return benches;
}

module.exports = run;
