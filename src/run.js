const benchIt = require('./util/bench-it'),
  generateMatrices = require('./benches/generate-matrices'),
  getMinMaxAvg = require('./util/get-min-max'),
  matMult = require('./benches/matrix-multiplication'),
  matConv = require('./benches/convolution'),
  { paddificate, paddingX, paddingY, kernel } = require('./benches/convolution'),
  { YELLOW_UNDER, GREEN_NO_UNDER, NC } = require('../cli/colors'),
  { generateStatsObj: generateStats } = require('./stats/get-stats'),
  getgetTextureKernel = require('./util/get-texture'),
  getScore = require('./stats/get-score');

/**
 * @method run
 * @param {Options} options
 * @return {"Object"}
 */
const run = options => {
  options.output = [options.matrix_size, options.matrix_size];
  
  const getTexture = getgetTextureKernel(options.gpu, options.matrix_size, options.matrix_size);
  const mat = benchIt(() => generateMatrices(options.matrix_size)),
    padded = benchIt(() => paddificate(mat.ret[0], paddingX, paddingY));
  
  getTexture.build(mat.ret[0]);
  const matrixTexs = mat.ret.map(arr => getTexture(arr));

  const funcs = {
    mat_mult: matMult.generateFuncs(options.gpu, options.cpu, options.output),
    mat_conv: matConv.generateFuncs(options.gpu, options.cpu, options.output)
  }

  const benchmarks = {
    mat_mult: {
      gpu: [],
      cpu: []
    },
    mat_conv: {
      gpu: [],
      cpu: []
    },
    pipe: {
      gpu: [],
      cpu: []
    }
  }

  const build_time = {
    mat_mult: {
      gpu: benchIt(() => {funcs.mat_mult.gpu.build(mat.ret[0], mat.ret[1])}).time,
      pipe: benchIt(() => {funcs.mat_mult.pipe.build(matrixTexs[0], matrixTexs[1])}).time
    },
    mat_conv: {
      gpu: benchIt(() => {funcs.mat_conv.gpu.build(padded.ret, kernel)}).time,
      pipe: benchIt(() => {funcs.mat_conv.pipe.build(padded.ret, kernel)}).time
    }
  }

  for (let i = 1; i <= options.num_benchmarks; i++) {
    benchmarks.mat_mult.gpu.push(
      benchIt(() => 
        {
          funcs.mat_mult.gpu.run(mat.ret[0], mat.ret[1]);
        }
      ).time
    )

    benchmarks.mat_conv.gpu.push(
      benchIt(() => 
        {
          funcs.mat_conv.gpu.run(padded.ret, kernel);
        }
      ).time
    )
    
    if (options.cpu_benchmark) {
      benchmarks.mat_mult.cpu.push(
        benchIt(() => 
          {
            funcs.mat_mult.cpu(mat.ret[0], mat.ret[1]);
          }
        ).time
      )
    }

    if (options.cpu_benchmark) {
      benchmarks.mat_conv.cpu.push(
        benchIt(() => 
          {
            funcs.mat_conv.cpu(padded.ret, kernel);
          }
        ).time
      )
    }

    const results = [];

    // For benchmarking pipeline and deleting the textures.
    const func = (mat1, mat2) => {
      const result = funcs.mat_mult.pipe(mat1, mat2);
      results.push(result);
      return result;
    }

    benchmarks.pipe.gpu.push(
      benchIt(() => {
        return func(func(func(func(matrixTexs[0], matrixTexs[1]), matrixTexs[2]), matrixTexs[3]), matrixTexs[4]).toArray();
      }).time
    )

    if (options.cpu_benchmark) {
      benchmarks.pipe.cpu.push(
        benchIt(() => {
          const func = funcs.mat_mult.cpu;

          func(func(func(func(mat.ret[0], mat.ret[1]), mat.ret[2]), mat.ret[3]), mat.ret[4]);
        }).time
      )
    }

    results.forEach(tex => tex.delete()) // Delete textures to free VRAM
    // matrixTexs.forEach(tex => tex.delete());
    
    if (options.logs) console.log(`Benchmark ${YELLOW_UNDER}${i}${NC} ${GREEN_NO_UNDER}completed${NC} ${GREEN_NO_UNDER}✔${NC}`);
  }
  
  for (let i in funcs) {
    funcs[i].gpu.destroy();
    funcs[i].pipe.destroy();
  }
  getTexture.destroy();

  const run_time = {
    mat_mult: {
      gpu: getMinMaxAvg(benchmarks.mat_mult.gpu),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.mat_mult.cpu) : {min: -1, avg: -1, max: -1, deviation: -1}
    },

    mat_conv: {
      gpu: getMinMaxAvg(benchmarks.mat_conv.gpu),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.mat_conv.cpu) : {min: -1, avg: -1, max: -1, deviation: -1}
    },

    pipe: {
      gpu: getMinMaxAvg(benchmarks.pipe.gpu),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.pipe.cpu) : {min: -1, avg: -1, max: -1, deviation: -1}
    }
  }
  
  const stats = generateStats(run_time, build_time);

  const benches = {
    mat_gen: mat.time,
    mat_pad: padded.time,

    build_time,
    run_time,

    stats,
    score: getScore(run_time, options.matrix_size),

    options
  }

  return benches;
}

module.exports = run;
