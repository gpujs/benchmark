const convertToPlotlyJSON = require('./exportAsJson').getPlotlyJSON;
class BenchmarkOut {
  /**
   * 
   * @param {Boolean} [singleData] whether only a single data object is to be stored
   * @param {*} [initData] initialData
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
   * 
   * @param {*} newData new data object to be added to a multi-data array
   */
  addData(newData) {
    if (!this.singleData) {
      this.data.push(newData)
    }
    else throw "Single Data"
  }

  /**
   * 
   * @param {String} field the field name
   * @param {*} value the field value
   * @param {Number} [index=0] index of the data object in the multi-data array
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
   * 
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
   * @returns {"Object"}
   */
  getData() {
    return this.data;
  }

  /**
   * @description 
   * @param {"Array"} compareFields 
   */
  getPlotlyJSON(compareFields = [
    {
      x: 'matrix_size',
      y: 'gpu_run_time-mat_mult'
    },
    {
      x: 'matrix_size',
      y: 'pipe_run_time'
    },
    {
      x: 'matrix_size',
      y: 'score'
    }
  ]) {
    if (!this.singleData){
      const retArr = [];
      compareFields.forEach((compareField) => {
        retArr.push(convertToPlotlyJSON(this.data, {
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