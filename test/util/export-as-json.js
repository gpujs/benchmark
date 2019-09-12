const test = require('tape'),
  { getPlotlyJSON } = require('../../src/util/export-as-json');

test('getPlotlyJSON util function test', t => {
  const data = [
    {
      options: {
      matrix_size: 512
      },
      score: {
        gpu: 1000
      }
    },
    {
      options: {
        matrix_size: 1024
      },
      score: {
        gpu: 1212
      }
    },
    {
      options: {
        matrix_size: 2048
      },
      score: {
        gpu: 8992
      }
    },
    {
      options: {
        matrix_size: 4096
      },
      score: {
        gpu: 9982
      }
    }
  ]
  
  const expectedOut = {
    x_series: [512, 1024, 2048, 4096],
    y_series: [1000, 1212, 8992, 9982]
  }

  const out = getPlotlyJSON(data, {
    x: 'matrix_size',
    y: 'gpu_score'
  })

  t.deepEqual(out, expectedOut, 'getPlotlyJSON returns correct JSON');

  t.end();
})