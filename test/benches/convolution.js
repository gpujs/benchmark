const test = require('tape'),
  { kernel, kernelX, kernelY, paddingX, paddingY, paddificate, generateFuncs } = require('../../src/benches/convolution'),
  { GPU } = require('gpu.js');

const gpu = new GPU({mode: 'gpu'});
const cpu = new GPU({mode: 'cpu'});

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
    ],
    expectedConvolvedArray = [
      [18, 23, 27],
      [34, 42, 52],
      [51, 65, 78]
    ]
  
  t.equal(kernelX, expectedKernelX, 'Correct kernel X width');
  t.equal(kernelY, expectedKernelY, 'Correct kernel Y height');
  
  t.equal(paddingX, expectedPaddingX, 'Correct padding X');
  t.equal(paddingY, expectedPaddingY, 'Correct padding Y');

  const paddedArray = paddificate(array, paddingX, paddingY);

  t.deepEqual(paddedArray, expectedPaddedArray, 'paddificate returns correctly padded array');

  const funcs = generateFuncs(gpu, cpu, [array.length, array.length]);

  const gpuConvolve = funcs.gpu(expectedPaddedArray, kernel);
    cpuConvolve = funcs.cpu(expectedPaddedArray, kernel);

  t.deepEqual(cpuConvolve, gpuConvolve, 'CPU and GPU kernels return the same output.');
  t.deepEqual(gpuConvolve, expectedConvolvedArray, 'GPU kernel works correctly.');
  t.deepEqual(cpuConvolve, expectedConvolvedArray, 'CPU kernel works correctly.');

  t.end();
})