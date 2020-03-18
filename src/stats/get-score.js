const getScore = (run_time, matrix_size) => {
  const score = {
    gpu: Math.floor((Math.pow(matrix_size, 3) / run_time.mat_mult.gpu.avg) / 100) ,
    cpu: Math.floor((Math.pow(matrix_size, 3) / run_time.mat_mult.cpu.avg) / 100)
  }

  return score;
}

module.exports = getScore;