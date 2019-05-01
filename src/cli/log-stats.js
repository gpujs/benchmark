const { NC, YELLOW_NO_UNDER, YELLOW_UNDER, GREEN_UNDER, GREEN_NO_UNDER, RED_NO_UNDER } = require('./colors'),
  { br } = require('./format');

const performerMap = {
  gpu: 'GPU',
  cpu: 'CPU',
  pipe: 'GPU(pipeline)'
},
benchMap = {
  mat_mult: 'Matrix Multiplication',
  mat_conv: 'Matrix Convolution'
}

const logRunTimeStats = ({run_time}) => {
  for (const bench in run_time) {
    console.log(`Benchmark: ${GREEN_UNDER}${benchMap[bench]}${NC}`);
    br();

    for (const diff in run_time[bench].diff) {
      const performers = diff.split('_'),
        { avg, min, max } = run_time[bench].diff[diff],
        percentage = {
          avg: run_time[bench].diff[diff].avg.percentage,
          min: run_time[bench].diff[diff].min.percentage,
          max: run_time[bench].diff[diff].max.percentage
        };
      
      if (percentage.min != -1 && percentage.max != -1 && percentage.avg != -1){
        console.log(`Performance Comparison between ${YELLOW_NO_UNDER}${performerMap[performers[0]]}${NC} and ${YELLOW_NO_UNDER}${performerMap[performers[1]]}${NC}:`);
        br();
        console.log(`Better Minimum Value Performer: ${YELLOW_NO_UNDER}${performerMap[min.winner]}${NC}, PERCENTAGE: ${YELLOW_UNDER}${percentage.min}${NC}%`);
        console.log(`Better Maximum Value Performer: ${YELLOW_NO_UNDER}${performerMap[max.winner]}${NC}, PERCENTAGE: ${YELLOW_UNDER}${percentage.max}${NC}%`);
        console.log(`Better Average Value Performer: ${YELLOW_NO_UNDER}${performerMap[avg.winner]}${NC}, PERCENTAGE: ${YELLOW_UNDER}${percentage.avg}${NC}%`);
        br();
      }
    }
    console.log(`${GREEN_NO_UNDER}Best Performer${NC}: ${YELLOW_NO_UNDER}${performerMap[run_time[bench].best_performer]}${NC}`);
    console.log(`${RED_NO_UNDER}Worst Performer${NC}: ${YELLOW_NO_UNDER}${performerMap[run_time[bench].worst_performer]}${NC}`);
    br(2);
  }
}

const logBuildTimeStats = ({build_time}) => {
  for (const bench in build_time) {
    const performers = ['gpu', 'pipe'];
    performers.splice(performers.indexOf(build_time[bench].diff.winner));
    console.log(`Benchmark: ${GREEN_UNDER}${benchMap[bench]}${NC}`);
    console.log(`${YELLOW_NO_UNDER}${performerMap[build_time[bench].diff.gpu_pipe.winner]}${NC} compiled ${YELLOW_UNDER}${build_time[bench].diff.gpu_pipe.percentage}${NC}% faster than ${YELLOW_NO_UNDER}${performerMap[performers[0]]}${NC}`);
    br(2);
  }
}

const logOverallStats = ({overall}) => {
  for (const bench in overall) {
    console.log(`Benchmark: ${GREEN_UNDER}${benchMap[bench]}${NC}`);
    br();
    console.log(`${GREEN_NO_UNDER}Best Performer${NC}: ${YELLOW_NO_UNDER}${performerMap[overall[bench].best_performer]}${NC}`);
    console.log(`${RED_NO_UNDER}Worst Performer${NC}: ${YELLOW_NO_UNDER}${performerMap[overall[bench].worst_performer]}${NC}`);
    console.log(`${YELLOW_NO_UNDER}${performerMap[overall[bench].best_performer]}${NC} was ${YELLOW_UNDER}${overall[bench].diff.percentage}${NC}% faster than ${YELLOW_NO_UNDER}${performerMap[overall[bench].worst_performer]}${NC}`);
    br(2);
  }
}

module.exports = {
  logRunTimeStats,
  logBuildTimeStats,
  logOverallStats,
  performerMap,
  benchMap
}