/**
 * @method removeUnnecesasaryProps
 * @description removes unnecessary properties from the benchmarks object(to be stringified)
 * @param {"Object"} data The benchmark data
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
 */
const getBenchmarkJSON = (data) => {
  return JSON.stringify(removeUnnecessaryProps(data));
}

/**
 * @method getPlotlyJSON
 * @description returns multiple benchmarks as plotly format graph JSON string
 * @param {"Array"} dataArr An array of benchmarks
 * @param {"Object"} fields An object containing the fields for which graph data is to be generated
 */
const getPlotlyJSON = (dataArr, fields = {
  score: ['gpu', 'cpu']
}) => {

}

module.exports = {
  getBenchmarkJSON,
  getPlotlyJSON
}