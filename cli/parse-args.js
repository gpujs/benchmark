/**
 * @description Parses all the CLI arguments
 * @param {Float32Array} args The user CLI arguments (Usually process.argv)
 */
function parseArgs(args) {
  if (args[2] !== undefined) {
    const multiple = args.includes('--multiple');
    const options = args.find(opt => /^{.*}$/.test(opt)) || false;

    const returnPlotlyJSON = args.includes('--returnPlotlyJSON');
    const returnChartistJSON = args.includes('--returnChartistJSON');
    
    const plotlySavePath = args.find(opt => /^--savePlotlyJSONToFile=/.test(opt)) || false;
    const chartistSavePath = args.find(opt => /^--saveChartistJSONToFile=/.test(opt)) || false;

    return {
      multiple,
      options,
      returnPlotlyJSON,
      returnChartistJSON,
      plotlySavePath,
      chartistSavePath
    }
  }
  else {
    return false;
  }
}

module.exports = parseArgs;