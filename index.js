const bench = require('./src/index'),
  logMinMax = require('./log-min-max');

const benchmarks = bench();

console.log(``);
console.log(`matrix generation time: ${benchmarks.mat_gen}ms`);
console.log(`matrix padding time: ${benchmarks.mat_pad}ms`);

console.log(`matrix multiplication compile time: ${benchmarks.build_time.mat_mult.gpu}ms`);
console.log(`matrix multiplication (pipeline) compile time: ${benchmarks.build_time.mat_mult.pipe}ms`);

console.log(``);

console.log(`MATRIX MULTIPLICATION RUN TIME:`);
logMinMax(benchmarks.run_time.mat_mult);

console.log(``);

console.log(`matrix convolution compile time: ${benchmarks.build_time.mat_conv.gpu}ms`);
console.log(`matrix convolution (pipeline) compile time: ${benchmarks.build_time.mat_conv.pipe}ms`);

console.log(``);

console.log(`MATRIX CONVOLUTION RUN TIME:`);
logMinMax(benchmarks.run_time.mat_conv)