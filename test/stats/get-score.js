const test = require('tape'),
  getScore = require('../../src/stats/get-score');

test('getScore stats function test', t => {
  const matrix_size = 1024;
  const run_time = {
    mat_mult: {
      gpu: {avg: 1024},
      cpu: {avg: 4096}
    }
  }

  const score = getScore(run_time, matrix_size);

  t.equals(score.gpu, 10485, 'Calculates expected score for GPU');
  t.equals(score.cpu, 2621, 'Calculates expected score for CPU');

  t.end();
})