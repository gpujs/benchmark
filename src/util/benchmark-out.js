const { getPlotlyJSON: convertToPlotlyJSON, getChartistJSON: convertToChartistJSON } = require('./export-as-json');

class BenchmarkOut {
  /**
   * @param {Boolean} [singleData] whether only a single data object is to be stored
   * @param {*} [initData] initialData
   * @returns {null}
   */
  constructor(singleData = false, initData) {
    this.singleData = singleData;

    if (singleData) {
      this.data = initData;
    }
    else {
      this.data = [];
      if (initData){
        this.data.push(initData)
      }
    }
  }

  /**
   * @method addData
   * @param {Object} newData new data object to be added to a multi-data array
   * @returns {null}
   */
  addData(newData) {
    if (!this.singleData) {
      this.data.push(newData)
    }
    else throw "Single Data"
  }

  /**
   * @method setDataField
   * @param {String} field the field name
   * @param {*} value the field value
   * @param {Number} [index=0] index of the data object in the multi-data array
   * @returns {null}
   */
  setDataField(field, value, index = 0) {
    if (this.singleData) {
      this.data[field] = value;
    }
    else {
      this.data[index][field] = value;
    }
  }

  /**
   * @method getDataField
   * @param {String} field the field name
   * @param {Number} [index=0] index of the data object in the multi-data array
   * @returns {*}
   */
  getDataField(field, index = 0) {
    if (this.singleData) {
      return this.data[field];
    }
    else {
      return this.data[index][field];
    }
  }

  /**
   * @method getData
   * @returns {Object}
   */
  getData() {
    return this.data;
  }

  /**
   * @description Returns a plotly style array of graphs
   * @param {Array} compare_fields
   */
  getPlotlyJSON(compare_fields = [
    {
      x: 'matrix_size',
      y: 'gpu_run_time_mat_mult'
    },
    {
      x: 'matrix_size',
      y: 'pipe_run_time'
    },
    {
      x: 'matrix_size',
      y: 'gpu_score'
    }
  ]) {
    if (!this.singleData){
      const retArr = [];
      compare_fields.forEach((compareField) => {
        retArr.push(convertToPlotlyJSON(this.data, {
          x: compareField.x,
          y: compareField.y
        }))
      })

      return retArr;
    }
    else throw "Only possible for multi-data arrays"
  }
  
  /**
   * @description Returns a plotly style array of graphs
   * @param {Array} compare_fields
   */
  getChartistJSON(compare_fields = [
    {
      x: 'matrix_size',
      y: 'gpu_run_time_mat_mult'
    },
    {
      x: 'matrix_size',
      y: 'pipe_run_time'
    },
    {
      x: 'matrix_size',
      y: 'gpu_score'
    }
  ]) {
    if (!this.singleData){
      const retArr = [];
      compare_fields.forEach((compareField) => {
        retArr.push(convertToChartistJSON(this.data, {
          x: compareField.x,
          y: compareField.y
        }))
      })

      return retArr;
    }
    else throw "Only possible for multi-data arrays"
  }
}

module.exports = BenchmarkOut;