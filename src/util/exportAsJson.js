/**
 * @method removeUnnecesasaryProps
 * @description removes unnecessary properties from the benchmarks object(to be stringified)
 * @param {"Object"} data The benchmark data
 * @returns {"Object"}
 */
const removeUnnecessaryProps = (data) => {
  data.options.gpu = "";
  data.options.cpu = "";

  return data
}

/**
 * @method getBenchmarkJSON
 * @description returns the benchmark data as a JSON string
 * @param {"Object"} data The benchmark data
 * @returns {"Object"}
 */
const getBenchmarkJSON = (data) => {
  return JSON.stringify(removeUnnecessaryProps(data));
}

/**
 * @method getPlotlyJSON
 * @description returns multiple benchmarks as plotly format graph JSON string
 * @param {"Array"} dataArr An array of benchmarks
 * @param {"Object"} axes An object containing x and y axis labels
 */
const getPlotlyJSON = (dataArr, axes = {x: '', y: ''}) => {
  const out = {x_series: [], y_series: []}
  const setVal = (input, data) => {
    let out;
    switch (input) {
      case 'matrix_size':
        out = data.options.matrix_size;
        break;

      case 'gpu_score':
        out = data.stats.score.gpu;
        break;
      case 'cpu_score': 
        out = data.stats.score.cpu;
        break;

      case 'gpu_run_time_mat_mult':
        out = data.run_time.mat_mult.gpu.avg;
        break;
      case 'gpu_run_time_mat_conv':
        out = data.run_time.mat_conv.gpu.avg;
        break;
      case 'cpu_run_time_mat_mult':
        out = data.run_time.mat_mult.cpu.avg;
        break;
      case 'cpu_run_time_mat_conv':
        out = data.run_time.mat_conv.cpu.avg;
        break;

      case 'pipe_run_time':
        out = data.run_time.pipe.gpu.avg;
        break;
    }
    return out;
  }

  if (axes.x && axes.y) {
    dataArr.forEach(data => {
      let x, y;
      x = setVal(axes.x, data);
      y = setVal(axes.y, data);

      out.x_series.push(x);
      out.y_series.push(y);
    })
  }
}

module.exports = {
  getBenchmarkJSON,
  getPlotlyJSON
}