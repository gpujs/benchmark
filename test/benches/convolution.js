const test = require('tape'),
  { kernelX, kernelY, paddingX, paddingY, paddificate } = require('../../src/benches/convolution');

test('matrix convolution benchmark test', t => {
  const expectedKernelX = 3,
    expectedKernelY = 3,
    expectedPaddingX = 1,
    expectedPaddingY = 1,
    array = [
      [1, 2, 1],
      [1, 3, 4],
      [5, 5, 8]
    ],
    expectedPaddedArray = [
      [1, 1, 2, 1, 1],
      [1, 1, 2, 1, 1],
      [1, 1, 3, 4, 4],
      [5, 5, 5, 8, 8],
      [5, 5, 5, 8, 8]
    ]
  
  t.equal(kernelX, expectedKernelX, 'Correct kernel X width');
  t.equal(kernelY, expectedKernelY, 'Correct kernel Y height');
  
  t.equal(paddingX, expectedPaddingX, 'Correct padding X');
  t.equal(paddingY, expectedPaddingY, 'Correct padding Y');

  const paddedArray = paddificate(array, paddingX, paddingY);

  t.deepEqual(paddedArray, expectedPaddedArray, 'paddificate returns correctly padded array');

  t.end();
})