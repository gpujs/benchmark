const bench = require('./src/index');
const benchmarks = bench();

console.log(``);
console.log(`matrix generation time: ${benchmarks.matGen}ms`);

console.log(`matrix multiplication compile time: ${benchmarks.build_time.matMult.gpu}ms`);
console.log(`matrix multiplication (pipeline) compile time: ${benchmarks.build_time.matMult.pipe}ms`);

console.log(``);

console.log(`matrix multiplication run time: ${benchmarks.run_time.matMult.gpu}ms`);
console.log(`matrix multiplication (pipeline) run time: ${benchmarks.run_time.matMult.pipe}ms`);

console.log(``);

console.log(`matrix convolution compile time: ${benchmarks.build_time.matConv.gpu}ms`);
console.log(`matrix convolution (pipeline) compile time: ${benchmarks.build_time.matConv.pipe}ms`);

console.log(``);

console.log(`matrix convolution run time: ${benchmarks.run_time.matConv.gpu}ms`);
console.log(`matrix convolution (pipeline) run time: ${benchmarks.run_time.matConv.pipe}ms`);
