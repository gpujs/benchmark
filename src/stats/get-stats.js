const stats = require('./output_formats/stats.json'); // Template

const generateBuildStats = require('./generate_stats/generate-build-stats'),
  generateRunStats = require('./generate_stats/generate-run-stats'),
  findRunBestWorst = require('./generate_stats/find-run-best-worst'),
  generateOverallStats = require('./generate_stats/generate-overall-stats');

const generateStatsObj = (run_time, build_time) => {
  generateRunStats(stats, run_time);
  generateBuildStats(stats, build_time);
  findRunBestWorst(stats, run_time);
  generateOverallStats(stats, run_time, build_time);
  
  return stats;
}

module.exports = {
  generateStatsObj
}