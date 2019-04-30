const bench = require('./src/index'),
  logMinMax = require('./src/cli/log-min-max');
let options;

if (typeof process.argv[2] != 'undefined') {
  try {
    options = JSON.parse(process.argv[2].toString());
  }
  catch (e) {
    console.log('Options argument is not a valid JSON string, running benchmarks without any options');
    setTimeout(() => options = {}, 5000);
  }
}
else {
  options = {};
}

const benchmarks = bench(options);

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