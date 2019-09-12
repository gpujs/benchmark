const { multipleBenchmark } = require('./src/index')

console.log(
  multipleBenchmark({
    commonOptions: {
      cpu_benchmark: false
    },

    range: {
      interval: [128, 2048],
      commonRatio: 2,
      optionName: 'matrix_size'
    }
  }).getPlotlyJSON([
    {
      x: 'matrix_size',
      y: 'gpu_score'
    },
    {
      x: 'matrix_size',
      y: 'gpu_run_time_mat_mult'
    }
  ])
)