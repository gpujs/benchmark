const { GPU } = require('gpu.js'),
  { benchmark: bench, multipleBenchmark } = require('./src/index'),
  writeFileSyncRecursive = require('./cli/write-file-recursive'),
  getOptionsInput = require('./cli/get-options'),
  parseArgs = require('./cli/parse-args'),
  graphDefaults = require('./cli/graph-defaults.json'),
  multipleDefaults = require('./cli/multiple-defaults.json'),
  logMinMax = require('./cli/log-min-max'),
  { GREEN_NO_UNDER, NC, RED_FLASH, YELLOW_UNDER, YELLOW_NO_UNDER } = require('./cli/colors'),
  { br } = require('./cli/format'),
  { logRunTimeStats, logBuildTimeStats, logOverallStats } = require('./cli/log-stats');

let options = {
    gpu: new GPU(),
    cpu: new GPU({ mode: 'gpu' })
  },
  multiple = false;
const parsedArgs = parseArgs(process.argv);

br();

if (parsedArgs) {
  try {
    if (parsedArgs.multiple) {
      multiple = true;

      if (parsedArgs.options) options = JSON.parse(parsedArgs.options);
      else {
        options = {...multipleDefaults};
      }
    }
    else if (parsedArgs.options) options = JSON.parse(parsedArgs.options);
  }
  catch (e) {
    console.log(`${RED_FLASH}Options argument is not a valid JSON string or contains errors, running benchmarks with default options.${NC}`);
    options = {...multipleDefaults};
    br();
  }
}


if (!multiple) {
  options.logs = true;

  getOptionsInput(options);

  br();
  console.log(`MATRIX SIZE: ${YELLOW_UNDER}${options.matrix_size || 512}${YELLOW_NO_UNDER}x${YELLOW_UNDER}${options.matrix_size || 512}${NC}`);
  br();

  const benchmarks = bench(options).getData();
  const cpuBenched = benchmarks.options.cpu_benchmark;
  br(2);

  console.log(`Matrix Generation Time: ${YELLOW_UNDER}${benchmarks.mat_gen}${NC} ms (Generated 5 Matrices)`);
  console.log(`Matrix Padding Time: ${YELLOW_UNDER}${benchmarks.mat_pad}${NC} ms`);
  br(2);

  console.log(`${GREEN_NO_UNDER}COMPILE TIME:${NC}`);

  console.log(`Matrix Multiplication Compile Time: ${YELLOW_UNDER}${benchmarks.build_time.mat_mult.gpu}${NC} ms`);
  console.log(`Matrix Multiplication (Pipeline) Compile Time: ${YELLOW_UNDER}${benchmarks.build_time.mat_mult.pipe}${NC} ms`);
  console.log(`Matrix Convolution Compile Time: ${YELLOW_UNDER}${benchmarks.build_time.mat_conv.gpu}${NC} ms`);
  br(2);

  console.log(`${GREEN_NO_UNDER}MATRIX MULTIPLICATION RUN TIME:${NC}`);
  logMinMax(benchmarks.run_time.mat_mult);
  br(2);

  console.log(`${GREEN_NO_UNDER}MATRIX CONVOLUTION RUN TIME:${NC}`);
  logMinMax(benchmarks.run_time.mat_conv);
  br();

  console.log(`${GREEN_NO_UNDER}PIPELINE BENCHMARK:${NC}`);
  logMinMax(benchmarks.run_time.pipe);
  br();

  console.log(`${GREEN_NO_UNDER}STATISTICS:${NC}`);
  br();

  console.log(`${GREEN_NO_UNDER}Run Time Statistics:${NC}`);
  br();
  logRunTimeStats(benchmarks.stats, cpuBenched);

  console.log(`${GREEN_NO_UNDER}Build Time Statistics:${NC}`);
  br();
  logBuildTimeStats(benchmarks.stats, cpuBenched);

  console.log(`${GREEN_NO_UNDER}Overall Statistics:${NC}`);
  br();
  logOverallStats(benchmarks.stats, cpuBenched);

  console.log(`${GREEN_NO_UNDER}Score:${NC}`);
  br();
  console.log(`GPU: ${YELLOW_UNDER}${benchmarks.score.gpu}${NC}`);
  console.log(`CPU: ${YELLOW_UNDER}${benchmarks.score.cpu < 0 ? 'Not Benchmarked' : benchmarks.score.cpu}${NC}`);
  br();
}
else {
  const benchmark = multipleBenchmark(options);
  
  if (parsedArgs.returnPlotlyJSON){
    br();
    console.log('PLOTLY JSON:');
    br();
    
    console.log(benchmark.getPlotlyJSON([graphDefaults[0]]))
    
    br();
  }
  
  if (parsedArgs.returnChartistJSON){
    br();
    console.log('CHARTIST JSON:');
    br();
    
    console.log(benchmark.getChartistJSON([graphDefaults[0]]))
    
    br();
  }
  
  if (parsedArgs.plotlySavePath) {
    const path = parsedArgs.plotlySavePath.replace(/^--savePlotlyJSONToFile=/, '').replace(/.json$/, '');
    
    writeFileSyncRecursive(`${path}.json`, JSON.stringify(
      benchmark.getPlotlyJSON(graphDefaults)
    ))
  }
  
  if (parsedArgs.chartistSavePath) {
    const path = parsedArgs.chartistSavePath.replace(/^--saveChartistJSONToFile=/, '').replace(/.json$/, '');
    
    writeFileSyncRecursive(`${path}.json`, JSON.stringify(
      benchmark.getChartistJSON(graphDefaults)
    ))
  }
}