const { benchmark: bench, multipleBenchmark } = require('./src/index'),
  logMinMax = require('./src/cli/log-min-max'),
  { GREEN_NO_UNDER, NC, RED_FLASH, YELLOW_UNDER, YELLOW_NO_UNDER } = require('./src/cli/colors'),
  { br } = require('./src/cli/format'),
  fs = require('fs'),
  path = require('path'),
  { logRunTimeStats, logBuildTimeStats, logOverallStats } = require('./src/cli/log-stats');

let options,
  multiple = false;
br();

if (typeof process.argv[2] != 'undefined') {
  try {
    if (process.argv.includes('--multiple')) {
      multiple = true;
      if ((process.argv.find(opt => /^{.*}$/.test(opt))) !== undefined) options = JSON.parse(process.argv.find(opt => /^{.*}$/.test(opt)));
      else {
        options = {
          commonOptions: {
            cpu_benchmark: false,
            logs: true
          },
          range: {
            optionName: 'matrix_size',
            interval: [64, 512],
            commonRatio: 2
          }
        }
      }
    }
    else {
      if (process.argv.find(opt => /^{.*}$/.test(opt))) options = JSON.parse(process.argv.find(opt => /^{.*}$/.test(opt)));
      else options = {};
    }
  }
  catch (e) {
    console.log(`${RED_FLASH}Options argument is not a valid JSON string or contains errors, running benchmarks without any options${NC}`);
    br();
    options = {};
  }
}
else {
  options = {};
}
if (!multiple) {
  options.logs = true;

  br();
  console.log(`MATRIX SIZE: ${YELLOW_UNDER}${options.matrix_size || 512}${YELLOW_NO_UNDER}x${YELLOW_UNDER}${options.matrix_size || 512}${NC}`);
  br();

  const benchmarks = bench(options).getData();

  console.log(`matrix generation time: ${YELLOW_UNDER}${benchmarks.mat_gen}${NC} ms (generated 5 matrices)`);
  console.log(`matrix padding time: ${YELLOW_UNDER}${benchmarks.mat_pad}${NC} ms`);
  br(2);

  console.log(`${GREEN_NO_UNDER}COMPILE TIME:${NC}`);
  br();

  console.log(`matrix multiplication compile time: ${YELLOW_UNDER}${benchmarks.build_time.mat_mult.gpu}${NC} ms`);
  console.log(`matrix multiplication (pipeline) compile time: ${YELLOW_UNDER}${benchmarks.build_time.mat_mult.pipe}${NC} ms`);
  br();
  console.log(`matrix convolution compile time: ${YELLOW_UNDER}${benchmarks.build_time.mat_conv.gpu}${NC} ms`);
  br(2);

  console.log(`${GREEN_NO_UNDER}MATRIX MULTIPLICATION RUN TIME:${NC}`);
  br();
  logMinMax(benchmarks.run_time.mat_mult);
  br(2);

  console.log(`${GREEN_NO_UNDER}MATRIX CONVOLUTION RUN TIME:${NC}`);
  br();
  logMinMax(benchmarks.run_time.mat_conv);
  br();

  console.log(`${GREEN_NO_UNDER}PIPELINE BENCHMARK:${NC}`);
  br();
  logMinMax(benchmarks.run_time.pipe);
  br();

  console.log(`${GREEN_NO_UNDER}STATISTICS:${NC}`);
  br();

  console.log(`${GREEN_NO_UNDER}Run Time Statistics:${NC}`);
  br();
  logRunTimeStats(benchmarks.stats);

  console.log(`${GREEN_NO_UNDER}Build Time Statistics:${NC}`);
  br();
  logBuildTimeStats(benchmarks.stats);

  console.log(`${GREEN_NO_UNDER}Overall Statistics:${NC}`);
  br();
  logOverallStats(benchmarks.stats);

  console.log(`${GREEN_NO_UNDER}Score:${NC}`);
  br();
  console.log(`GPU: ${YELLOW_UNDER}${benchmarks.score.gpu}${NC}`);
  console.log(`CPU: ${YELLOW_UNDER}${benchmarks.score.cpu < 0 ? 'Not Benchmarked' : benchmarks.score.cpu}${NC}`);
  br();
}

else {
  const benchmark = multipleBenchmark(options);
  
  if (process.argv.includes('--returnJSON')){
    br();
    
    console.log(benchmark.getPlotlyJSON([{
      x: 'matrix_size',
      y: 'gpu_score'
    }]))
    
    br();
  }

  function writeFileSyncRecursive(filename, content) {
    const folders = filename.split(path.sep).slice(0, -1);
    if (folders.length > 0) {
      
      // create folder path if it doesn't exist
      folders.reduce((last, folder) => {
        if (!fs.existsSync(last)) {
          fs.mkdirSync(last);
        }
        const folderPath = last + path.sep + folder;
        
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
        }
        
        return folderPath;
      })
    }
    fs.writeFileSync(filename, content);
  }
  
  let saveOpt = process.argv.find(opt => /^--saveJsonToFile=/.test(opt));
  if (saveOpt !== undefined) {
    saveOpt = saveOpt.replace(/^--saveJsonToFile=/, '').replace(/.json$/, '');
    
    writeFileSyncRecursive(`${saveOpt}.json`, JSON.stringify(
      benchmark.getPlotlyJSON([
        {
          x: 'matrix_size',
          y: 'gpu_score'   
        },
        {
          x: 'matrix_size',
          y: 'gpu_run_time_mat_mult'
        },
        {
          x: 'matrix_size',
          y: 'cpu_score'   
        },
        {
          x: 'matrix_size',
          y: 'cpu_run_time_mat_mult'
        }
      ])
    ));
  }
}