const test = require('tape'),
  getMinMaxAvg = require('../../src/util/get-min-max');

test('getMinMaxAvg util function test', t => {
  const testArray = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    testArrayRecurring = [10, 20, 30, 40, 25, 25, 5],
    expected = {
      min: 10,
      max: 100,
      avg: 55
    },
    expectedRecurring = {
      min: 5,
      max: 40,
      avg: 22.14
    };

  const minMax = getMinMaxAvg(testArray),
    minMaxRecurring = getMinMaxAvg(testArrayRecurring);

  t.deepEqual(minMax, expected, 'getMinMaxAvg returns correct values');
  t.deepEqual(minMaxRecurring, expectedRecurring, 'getMinMaxAvg returns proper approximate values for recurring outputs');

  t.end();
})