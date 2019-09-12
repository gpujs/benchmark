/**
 * @method generateMatrices
 * @description generates 5 matrices of uniform x and y length
 * @param size size of the matrices
 * @returns {Float32Array}
 */
module.exports = size => {
  const matrices = [[], [], [], [], []];

  for (let y = 0; y < size; y++){
    matrices[0].push([]);
    matrices[1].push([]);
    matrices[2].push([]);
    matrices[3].push([]);
    matrices[4].push([]);
    for (let x = 0; x < size; x++){
      matrices[0][y].push(Math.random());
      matrices[1][y].push(Math.random());
      matrices[2][y].push(Math.random());
      matrices[3][y].push(Math.random());
      matrices[4][y].push(Math.random());
    }
  }
  return matrices;
}
