// const test = require('tape'),
//   { generateFuncs } = require('../../src/benches/convolution'),
//   { GPU } = require('gpu.js');

// const gpu = new GPU({mode: 'gpu'});
// const cpu = new GPU({mode: 'cpu'});

// test('matrix multiplication benchmark test', t => {
//   const array1 = [
//       [1, 2, 1],
//       [1, 3, 4],
//       [5, 5, 8]
//     ],
//     array2 = [
//       [1, 2, 1],
//       [9, 1, 2],
//       [1, 5, 3]
//     ],
//     expectedOutputArray = [
//       [20, 9, 8],
//       [32, 25, 19],
//       [58, 55, 39]
//     ]

//   const funcs = generateFuncs(gpu, cpu, [array1.length, array1.length]);

//   const gpuMult = funcs.gpu(array1, array2),
//     cpuMult = funcs.cpu(array1, array2);

//   // t.deepEqual(gpuMult, cpuMult, 'CPU and GPU kernels return the same output.');
//   // t.deepEqual(gpuMult, expectedOutputArray, 'GPU kernel works correctly.');
//   // t.deepEqual(cpuConvolve, expectedConvolvedArray, 'CPU kernel works correctly.');

//   t.end();
// })