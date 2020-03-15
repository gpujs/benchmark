const matMultFunc = function(a, b) {
  let sum = 0;
  for (let i = 0; i < this.output.x; i++) {
    sum += a[this.thread.y][i] * b[i][this.thread.x];
  }
  return sum;
}

/**
 * @method generateFuncs 
 * @description Generates matrix multiplication functions.
 * @param {"GPU"} gpu A GPU.js GPU object.
 * @param {"GPU"} cpu A GPU.js object with mode=cpu
 * @param {Float32Array|"Object"} output The output size
 * @return {"Object"}
 */
const generateFuncs = (gpu, cpu, output) => {
  return {
    gpu: gpu.createKernel(matMultFunc, {
      output
    }),
    pipe: gpu.createKernel(matMultFunc, {
      output,
      pipeline: true
    }),
    cpu: cpu.createKernel(matMultFunc, {
      output
    })
  }
}

module.exports = {
  generateFuncs,
  matMultFunc
}