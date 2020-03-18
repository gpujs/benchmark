const test = require('tape'),
  index = require('../src/index').benchmark;

test('index.js entry point test', t => {
  const expectedDefaults = require('../src/util/defaults.json'),
    expectedNonDefaultOptions = {
      matrix_size: 1024,
      num_iterations: 5,
      logs: false,
      cpu_benchmark: false
    };

  const options = index().getDataField('options');
  const nonDefaultOptions = index(expectedNonDefaultOptions).getDataField('options');

  for (let def in expectedDefaults) {
    t.equal(options[def], expectedDefaults[def], `Correct ${def} default.`);
  }

  for (let def in expectedNonDefaultOptions) {
    t.equal(nonDefaultOptions[def], expectedNonDefaultOptions[def], `Correct ${def} non default.`);
  }
  
  t.end();
})