const test = require('tape'),
  getDiff = require('../../src/stats/diff');

test('getDiff stats function test', t => {
  const vals = [100, 200],
    expected = {
      diff: 50,
      greater: 0
    };

  const diff = getDiff(vals[0], vals[1]);

  t.deepEqual(diff, expected, 'getDiff calculates correct diff');

  t.end();
})