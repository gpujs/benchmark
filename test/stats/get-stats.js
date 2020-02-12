const test = require('tape'),
  getDiff = require('../../src/stats/diff'),
  { generateStatsObj } = require('../../src/stats/get-stats'),
  formatDiff = require('../../src/stats/format-diff');

test('formatDiff stats function test', t => {
  const diff = getDiff(5, 10),
  nonBenchDiff = getDiff(-1, 999999),
  expected = {
    percentage: 50,
    winner: 'contender1'
  },
  expectedNonBenchDiff = {
    percentage: -1,
    winner: 'benchmarked'
  },
  contenders = ['contender1', 'contender2'],
  nonBenchContenders = ['non-benchmarked', 'benchmarked'];

  const formattedDiff = formatDiff(diff, contenders),
    formattedNonBenchDiff = formatDiff(nonBenchDiff, nonBenchContenders);

  t.deepEqual(formattedDiff, expected, 'formatDiff produces expected output');
  t.deepEqual(formattedNonBenchDiff, expectedNonBenchDiff, 'formatDiff produces expected output if the diff contains -1');

  t.end();
})

test('generateStatsObj stats function test', t => {
  const run_time = {
    mat_mult: {
      gpu: {
        min: 10,
        max: 20,
        avg: 15
      },
      cpu: {
        min: 20,
        max: 30,
        avg: 25
      }
    },
    mat_conv: {
      gpu: {
        min: 8,
        max: 12,
        avg: 10
      },
      cpu: {
        min: 5,
        max: 10,
        avg: 7.5
      }
    },
    pipe: {
      gpu: {
        min: 100,
        max: 120,
        avg: 110
      },
      cpu: {
        min: 2000,
        max: 4000,
        avg: 3000
      }
    }
  },
  build_time = {
    mat_mult: {
      gpu: 25,
      pipe: 30
    },
    mat_conv: {
      gpu: 20,
      pipe: 25
    }
  }

  const expectedStats = {
    run_time: {
      mat_mult: {
        diff: {
          cpu_gpu: {
            min: {
              percentage: 50,
              winner: 'gpu'
            },
            max: {
              percentage: 33.33,
              winner: 'gpu'
            },
            avg: {
              percentage: 40,
              winner: 'gpu'
            }
          }
        },
        best_performer: 'gpu',
        worst_performer: 'cpu'
      },
      mat_conv: {
        diff: {
          cpu_gpu: {
            min: {
              percentage: 37.5,
              winner: 'cpu'
            },
            max: {
              percentage: 16.66,
              winner: 'cpu'
            },
            avg: {
              percentage: 25,
              winner: 'cpu'
            }
          }
        },
        best_performer: 'cpu',
        worst_performer: 'gpu'
      },
      pipe: {
        diff: {
          cpu_gpu: {
            min: {
              percentage: 95,
              winner: 'gpu'
            },
            max: {
              percentage: 97,
              winner: 'gpu'
            },
            avg: {
              percentage: 96.33,
              winner: 'gpu'
            }
          }
        },
        best_performer: 'gpu',
        worst_performer: 'cpu'
      }
    },
    build_time: {
      mat_mult: {
        diff: {
          gpu_pipe: {
            percentage: 16.66,
            winner: 'gpu'
          }
        }
      },
      mat_conv: {
        diff: {
          gpu_pipe: {
            percentage: 20,
            winner: 'gpu'
          }
        }
      }
    },
    overall: {
      mat_mult: {
        best_performer: 'cpu',
        worst_performer: 'gpu',
        diff: {
          percentage: 37.5,
          winner: 'cpu'
        }
      },
      mat_conv: {
        best_performer: 'cpu',
        worst_performer: 'gpu',
        diff: {
          percentage: 75,
          winner: 'cpu'
        }
      }
    }
  }

  const stats = generateStatsObj(run_time, build_time);

  t.deepEqual(stats.run_time.mat_mult, expectedStats.run_time.mat_mult, 'generateStatsObj produces expected matrix multiplication run time stats');
  t.deepEqual(stats.run_time.mat_conv, expectedStats.run_time.mat_conv, 'generateStatsObj produces expected matrix convolution run time stats');
  t.deepEqual(stats.run_time.pipe, expectedStats.run_time.pipe, 'generateStatsObj produces expected pipelining run time stats');
  
  t.deepEqual(stats.build_time.mat_mult, expectedStats.build_time.mat_mult, 'generateStatsObj produces expected matrix multiplication build time stats');
  t.deepEqual(stats.build_time.mat_conv, expectedStats.build_time.mat_conv, 'generateStatsObj produces expected matrix convolution build time stats');
  
  t.deepEqual(stats.overall.mat_mult, expectedStats.overall.mat_mult, 'generateStatsObj produces expected matrix multiplication overall stats');
  t.deepEqual(stats.overall.mat_conv, expectedStats.overall.mat_conv, 'generateStatsObj produces expected matrix convolution stats');
  
  t.end();
})