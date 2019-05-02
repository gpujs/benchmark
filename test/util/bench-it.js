const test = require('tape'),
  benchIt = require('../../src/util/bench-it'),
  now = require('performance-now');

const pause = (milliseconds, cb) => {
    const ms = now();
    while ((now()) - ms <= milliseconds) {}
    return cb();
  },
  approx = (val, compare, margin = 30) => Math.abs(val - compare) <= margin;

test('benchIt util function test', t => {
  const out = benchIt(() => pause(1000, () => 'return'));

  t.true(out.hasOwnProperty('ret') && out.hasOwnProperty('time'), 'benchIt returns all values');
  t.equal(out.ret, 'return', 'benchIt returns the correct output');
  t.true(approx(out.time, 1000), 'benchIt measures accurately');

  t.end();
})