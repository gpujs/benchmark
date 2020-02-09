const getDiff = require('../diff');
const formatDiff = require('../format-diff');
const buildTimeFormat = require('../output_formats/build-time-format.json');


const generateBuildStats = (stats, build_time) => {
  for (const bench in stats.build_time) {
    stats.build_time[bench] = buildTimeFormat;
    const rawDiff = getDiff(build_time[bench].gpu, build_time[bench].pipe);
    const diff = formatDiff(rawDiff, ['gpu', 'pipe']);

    stats.build_time[bench].diff.gpu_pipe = diff;
  }
}

module.exports = generateBuildStats;