const getDiff = require('../diff');
const formatDiff = require('../format-diff');

const generateOverallStats = (stats, run_time, build_time) => {
  for (const bench in stats.overall) {
    let better_total = Infinity,
      better_performer = '',
      worse_total = 0,
      worse_performer = '',
      performerNotBenched;

    for (const performer in run_time[bench]){

      const performer_build_time = performer == 'cpu' ? 0 : build_time[bench][performer],
        performer_run_time = run_time[bench][performer].avg,
        total_time = performer_build_time + performer_run_time;

      if (total_time < better_total && run_time[bench][performer].avg != -1){
        better_total = total_time;
        better_performer = performer;
      }

      performerNotBenched = (performerNotBenched || run_time[bench][performer].avg == -1);
        
      if (total_time > worse_total && run_time[bench][performer].avg != -1){
        worse_total = total_time;
        worse_performer = performer;
      }

    }

    if (performerNotBenched) worse_total = -1;

    stats.overall[bench].best_performer = better_performer;
    stats.overall[bench].worst_performer = worse_performer;
    stats.overall[bench].diff = formatDiff(getDiff(better_total, worse_total), [better_performer, worse_performer]);
  }
}

module.exports = generateOverallStats;