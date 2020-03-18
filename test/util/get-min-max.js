const test = require('tape'),
  getMinMaxAvg = require('../../src/util/get-min-max');

test('getMinMaxAvg util function test', t => {
  const testArray = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    expected = {
      min: 10,
      max: 100,
      avg: 55,
      deviation: 4.54
    };

  const minMax = getMinMaxAvg(testArray);
  
  for (let out in expected) {
    t.equal(minMax[out], expected[out], `${out} is correctly calculated.`)
  }

  t.deepEqual(minMax, expected, 'getMinMaxAvg returns correct values.');

  t.end();
})