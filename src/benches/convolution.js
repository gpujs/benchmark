const kernel = [
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1]
]
const kernelX = kernel[0].length,
  kernelY = kernel.length,
  paddingX = Math.floor(kernelX / 2),
  paddingY = Math.floor(kernelY / 2);


/**
 * @method paddificate
 * @description Pads a JavaScript array.
 * @param {Float32Array} array Input array.
 * @param {Number} paddingX x-axis padding size.
 * @param {Number} paddingY y-axis padding size.
 * @returns {Float32Array}
 */
const paddificate = (array, paddingX, paddingY) => {
  let out = [];

    for (var y = 0; y < array.length + paddingY * 2; y++){
      out.push([]);
      for (var x = 0; x < array[0].length + paddingX * 2; x++){
        const positionX = Math.min(Math.max(x - paddingX, 0), array[0].length - 1);
        const positionY = Math.min(Math.max(y - paddingY, 0), array.length - 1);

        out[y].push(array[positionY][positionX]);
      }
    }
    return out;
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

/**
 * @method generateFuncs 
 * @description Generates kernel convolution functions.
 * @param {"GPU"} gpu A GPU.js GPU object.
 * @param {"GPU(mode=cpu)"} cpu A GPU.js object of mode=cpu
 * @param {Float32Array|"Object"} output The output size
 * @returns {"Object"}
 */
const generateFuncs = (gpu, cpu, output) => {
  return {
    gpu: gpu.createKernel(matConvFunc, {
      output
    }),
    pipe: gpu.createKernel(matConvFunc, {
      output,
      pipeline: true
    }),
    cpu: cpu.createKernel(matConvFunc, {
      output
    })
  }
}

module.exports = {
  kernel,
  kernelX,
  kernelY,
  paddingX,
  paddingY,
  paddificate,
  matConvFunc,
  generateFuncs
}
