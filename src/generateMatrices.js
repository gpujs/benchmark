module.exports = size => {
  const matrices = [[], []]

  for (let y = 0; y < size; y++){
    matrices[0].push([])
    matrices[1].push([])
    for (let x = 0; x < size; x++){
      matrices[0][y].push(Math.random())
      matrices[1][y].push(Math.random())
    }
  }
  return matrices
}