const findRunBestWorst = (stats, run_time) => {
  for (const bench in run_time) {
    let better_avg = Infinity,
      better_performer = '',
      worse_avg = 0,
      worse_performer = '';

    for (const performer in run_time[bench]) {
      if (better_avg > run_time[bench][performer].avg && run_time[bench][performer].avg != -1){
        better_performer = performer;
        better_avg = Math.min(run_time[bench][performer].avg, better_avg);
      }

      if (worse_avg < run_time[bench][performer].avg && run_time[bench][performer].avg != -1){
        worse_performer = performer;
        worse_avg = Math.max(run_time[bench][performer].avg, worse_avg);
      }

      if (run_time[bench][performer].avg == -1) better_avg = -1;
    }

    stats.run_time[bench].best_performer = better_performer;
    stats.run_time[bench].worst_performer = worse_performer;
  }
}

module.exports = findRunBestWorst;