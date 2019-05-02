const test = require('tape'),
  generateMatrices = require('../../src/benches/generate-matrices');

test('generateMatrices function test', t => {
  const matrixSize = 3;
  
  const matrices = generateMatrices(matrixSize);

  t.equal(matrices.length, 2, 'generateMatrices produces 2 matrices')
  
  t.equal(matrices[0][0].length, 3, 'X width of matrix 1 is correct')
  t.equal(matrices[0].length, 3, 'Y height of matrix 1 is correct')
  
  t.equal(matrices[1][0].length, 3, 'X width of matrix 2 is correct')
  t.equal(matrices[1].length, 3, 'Y height of matrix 2 is correct')

  t.end();
})