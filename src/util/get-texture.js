/**
 * @method getgetTextureKernel
 * @param {"GPU"} gpu 
 * @param {Number} arrayX 
 * @param {Number} arrayY 
 */
const getgetTextureKernel = (gpu, arrayX, arrayY) => {
  return gpu.createKernel(function(array) {
    return array[this.thread.y][this.thread.x];
  },
  {
    output: [arrayX, arrayY],
    pipeline: true
  })
}

module.exports = getgetTextureKernel;