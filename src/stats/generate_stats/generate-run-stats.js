const getDiff = require('../diff');
const formatDiff = require('../format-diff');
const runTimeFormat = require('../output_formats/run-time-format.json');

const generateRunStats = (stats, run_time) => {
  for (const bench in stats.run_time) {
    stats.run_time[bench] = runTimeFormat;
    for (const diffName in stats.run_time[bench].diff) {
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
}

module.exports = generateRunStats;