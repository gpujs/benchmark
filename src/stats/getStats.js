const getDiff = require('./diff');
const formatDiff = (diff, contenders) => {
  return {
    percentage: diff.diff,
    winner: contenders[diff.greater]
  }        
}

const generateStatsObj = (run_time, build_time) => {
  const diff_obj = {
      cpu_gpu: {},
      gpu_pipe: {},
      cpu_pipe: {}
    },
    mat_mult = {
      diff: diff_obj
    },
    mat_conv = {
      diff: diff_obj
    };

  const stats = {
    run_time: {
      mat_mult,
      mat_conv
    },
    build_time: {
      mat_mult: {diff: {gpu_pipe: {}}},
      mat_conv: {diff: {gpu_pipe: {}}}
    }
  }

  for (const bench in stats.run_time) {
    for (const diffName in stats.run_time[bench].diff){
      const contenders = diffName.split('_');
      const rawDiffs = {
        avg: {},
        min: {},
        max: {}
      }

      for (const rawDiff in  rawDiffs) {
        rawDiffs[rawDiff] = getDiff(
          run_time[bench][contenders[0]][rawDiff],
          run_time[bench][contenders[1]][rawDiff]
        )
        if (run_time[bench][contenders[0]][rawDiff] == -1 || run_time[bench][contenders[1]][rawDiff] == -1) rawDiffs[rawDiff] = -1;
      }

      const diff = {
        avg: formatDiff(rawDiffs.avg, contenders),
        min: formatDiff(rawDiffs.min, contenders),
        max: formatDiff(rawDiffs.max, contenders)
      }

      stats.run_time[bench].diff[diffName] = diff;
    }
  }

  for (const bench in stats.build_time) {
    const rawDiff = getDiff(build_time[bench].gpu, build_time[bench].pipe);
    const diff = formatDiff(rawDiff, ['gpu', 'pipe']);

    stats.build_time[bench].diff.gpu_pipe = diff;
  }

  return stats;
}

module.exports = generateStatsObj;