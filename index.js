const bench = require('./src/index'),
  logMinMax = require('./src/cli/log-min-max'),
  { GREEN_NO_UNDER, NC, RED_FLASH, YELLOW_UNDER } = require('./src/cli/colors'),
  { br } = require('./src/cli/format');

let options;

if (typeof process.argv[2] != 'undefined') {
  try {
    options = JSON.parse(process.argv[2].toString());
  }
  catch (e) {
    console.log(`${RED_FLASH}Options argument is not a valid JSON string, running benchmarks without any options${NC}`);
    setTimeout(() => options = {}, 5000);
  }
}
else {
  options = {};
}
options.logs = true;
const benchmarks = bench(options);

br();
console.log(`matrix generation time: ${YELLOW_UNDER}${benchmarks.mat_gen}${NC} ms`);
console.log(`matrix padding time: ${YELLOW_UNDER}${benchmarks.mat_pad}${NC} ms`);
br(2);

console.log(`${GREEN_NO_UNDER}COMPILE TIME:${NC}`);
br();

console.log(`matrix multiplication compile time: ${YELLOW_UNDER}${benchmarks.build_time.mat_mult.gpu}${NC} ms`);
console.log(`matrix multiplication (pipeline) compile time: ${YELLOW_UNDER}${benchmarks.build_time.mat_mult.pipe}${NC} ms`);
br();
console.log(`matrix convolution compile time: ${YELLOW_UNDER}${benchmarks.build_time.mat_conv.gpu}${NC} ms`);
console.log(`matrix convolution (pipeline) compile time: ${YELLOW_UNDER}${benchmarks.build_time.mat_conv.pipe}${NC} ms`);
br(2);

console.log(`${GREEN_NO_UNDER}MATRIX MULTIPLICATION RUN TIME:${NC}`);
br();
logMinMax(benchmarks.run_time.mat_mult);
br(2);

console.log(`${GREEN_NO_UNDER}MATRIX CONVOLUTION RUN TIME:${NC}`);
br();
logMinMax(benchmarks.run_time.mat_conv);
br();