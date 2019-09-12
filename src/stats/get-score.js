const getScore = (run_time, matrix_size) => {
  const score = {
    gpu: Math.floor((matrix_size / run_time.mat_mult.gpu.avg) * 1000),
    cpu: Math.floor((matrix_size / run_time.mat_mult.cpu.avg) * 1000)
  }

  return score;
}

module.exports = getScore;