const test = require('tape'),
  { GPU } = require('gpu.js'),
  run = require('../src/run');

test('run function test', t => {
  const options = {
    num_benchmarks: 1,
    matrix_size: 512,
    output: [512, 512],
    logs: false,
    cpu_benchmark: true,
    cpu: new GPU({mode: 'cpu'}),
    gpu: new GPU()
  }

  const out = run(options);

  t.true(out.hasOwnProperty('mat_gen'), 'return value contains mat_gen property');
  t.true(out.hasOwnProperty('mat_pad'), 'return value contains mat_pad property');

  t.true(out.hasOwnProperty('build_time'), 'return value contains build_time property');
  t.true(out.hasOwnProperty('run_time'), 'return value contains run_time property');

  t.true(out.hasOwnProperty('stats'), 'return value contains stats property');
  
  t.end();
})