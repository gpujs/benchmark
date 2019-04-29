const kernel = [
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1]
]
const kernelX = kernel[0].length,
  kernelY = kernel.length,
  paddingX = Math.floor(kernelX / 2),
  paddingY = Math.floor(kernelY / 2)

const paddificate = array => {
  let out = []

    for (var y = 0; y < array.length + paddingY * 2; y++){
      out.push([])
      for (var x = 0; x < array[0].length + paddingX * 2; x++){
        const positionX = Math.min(Math.max(x - paddingX, 0), array[0].length - 1);
        const positionY = Math.min(Math.max(y - paddingY, 0), array.length - 1);

        out[y].push(array[positionY][positionX])
      }
    }

    return out
}

const matConvFunc = `function (array, kernel) {
  let sum = 0;
  for (let i = 0; i < ${kernelX}; i++){
    for (let j = 0; j < ${kernelY}; j++){
      sum += kernel[j][i] * array[this.thread.y + j][this.thread.x + i];
    }
  }
  return sum;
}`;

module.exports = {
  kernel,
  kernelX,
  kernelY,
  paddingX,
  paddingY,
  paddificate,
  matConvFunc
}