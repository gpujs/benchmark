const test = require('tape'),
  getOptionsInput = require('../../cli/get-options');

test('getOptionsInput skips asking when already defined', t => {
  const matrix_size = 123;
  const num_iterations = 50;
  const cpu_benchmark = {};
  const options = getOptionsInput({
    matrix_size,
    num_iterations,
    cpu_benchmark
  });
  t.equals(options.matrix_size, matrix_size);
  t.equals(options.num_iterations, num_iterations);
  t.equals(options.cpu_benchmark, cpu_benchmark);
  t.end();
});