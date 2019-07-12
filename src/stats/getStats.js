const getDiff = require('./diff');
const formatDiff = (diff, contenders) => {
  if (diff.diff >= 100){
    contenders.splice(diff.greater, diff.greater + 1);

    return {
      percentage: -1,
      winner: contenders[0]
    }
  }
  return {
    percentage: diff.diff,
    winner: contenders[diff.greater]
  }
}

const generateStatsObj = (run_time, build_time) => {
  const 
    mat_mult = {
      diff: {
        cpu_gpu: {}
      },
      best_performer: '',
      worst_performer: ''
    },
    mat_conv = {
      diff: {
        cpu_gpu: {}
      },
      best_performer: '',
      worst_performer: ''
    },
    pipe = {
      diff: {
        cpu_gpu: {}
      },
      best_performer: '',
      worst_performer: ''
    };

  const stats = {
    run_time: {
      mat_mult,
      mat_conv,
      pipe
    },
    build_time: {
      mat_mult: {diff: {gpu_pipe: {}}},
      mat_conv: {diff: {gpu_pipe: {}}}
    },
    overall: {
      mat_mult: {
        best_performer: {},
        worst_performer: {},
        diff: {}
      },
      mat_conv: {
        best_performer: {},
        worst_performer: {},
        diff: {}
      }
    }
  }

  for (const bench in stats.run_time) {
    for (const diffName in stats.run_time[bench].diff){
      const contenders = diffName.split('_');
      const rawDiffs = {
        min: {},
        max: {},
        avg: {}
      }

      for (const rawDiff in  rawDiffs) {
        rawDiffs[rawDiff] = getDiff(
          run_time[bench][contenders[0]][rawDiff],
          run_time[bench][contenders[1]][rawDiff]
        )
        if (run_time[bench][contenders[0]][rawDiff] == -1 || run_time[bench][contenders[1]][rawDiff] == -1) rawDiffs[rawDiff].diff = -1;
      }

      const diff = {
        min: formatDiff(rawDiffs.min, contenders),
        max: formatDiff(rawDiffs.max, contenders),
        avg: formatDiff(rawDiffs.avg, contenders)
      }

      stats.run_time[bench].diff[diffName] = diff;
    }
  }

  for (const bench in stats.build_time) {
    const rawDiff = getDiff(build_time[bench].gpu, build_time[bench].pipe);
    const diff = formatDiff(rawDiff, ['gpu', 'pipe']);

    stats.build_time[bench].diff.gpu_pipe = diff;
  }

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

  for (const bench in stats.overall) {
    let better_total = Infinity,
      better_performer = '',
      worse_total = 0,
      worse_performer = '';
      let performerNotBenched;
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
  return stats;
}

module.exports = {
  generateStatsObj,
  formatDiff,
}