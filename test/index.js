const test = require('tape'),
  index = require('../src/index').benchmark;

test('index.js entry point test', t => {
  const expectedDefaults = {
      matrix_size: 512,
      num_benchmarks: 1
    },
    expectedNonDefaultOptions = {
      matrix_size: 1024,
      num_benchmarks: 5,
      logs: false,
      cpu_benchmark: false
    };

  const options = index().getDataField('options');
  const nonDefaultOptions = index(expectedNonDefaultOptions).getDataField('options');

  t.equal(options.matrix_size, expectedDefaults.matrix_size, 'Correct matrix_size default');
  t.equal(options.num_benchmarks, expectedDefaults.num_benchmarks, 'Correct num_benchmark default');
  t.true(options.logs, 'Correct logs default');
  t.true(options.cpu_benchmark, 'Correct cpu_benchmark default');

  t.equal(nonDefaultOptions.matrix_size, expectedNonDefaultOptions.matrix_size, 'Correct non-default matrix_size option loaded');
  t.equal(nonDefaultOptions.num_benchmarks, expectedNonDefaultOptions.num_benchmarks, 'Correct non-default num_benchmarks option loaded');
  t.true(!nonDefaultOptions.logs, 'Correct non-default logs option loaded');
  t.true(!nonDefaultOptions.cpu_benchmark, 'Correct non-default cpu_benchmark option loaded');
  
  t.end();
})