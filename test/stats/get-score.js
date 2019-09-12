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

  t.equals(score.gpu, 1000, 'Calculates expected score for GPU');
  t.equals(score.cpu, 250, 'Calculates expected score for CPU');

  t.end();
})