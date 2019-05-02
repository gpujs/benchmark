const test = require('tape'),
  getDiff = require('../../src/stats/diff'),
  { formatDiff, generateStatsObj } = require('../../src/stats/getStats');

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
      pipe: {
        min: 5,
        max: 10,
        avg: 7.5
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
      pipe: {
        min: 9,
        max: 18,
        avg: 13.5
      },
      cpu: {
        min: 5,
        max: 10,
        avg: 7.5
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
          },
          gpu_pipe: {
            min: {
              percentage: 50,
              winner: 'pipe'
            },
            max: {
              percentage: 50,
              winner: 'pipe'
            },
            avg: {
              percentage: 50,
              winner: 'pipe'
            }
          },
          cpu_pipe: {
            min: {
              percentage: 75,
              winner: 'pipe'
            },
            max: {
              percentage: 66.66,
              winner: 'pipe'
            },
            avg: {
              percentage: 70,
              winner: 'pipe'
            }
          }
        },
        best_performer: 'pipe',
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
          },
          gpu_pipe: {
            min: {
              percentage: 11.11,
              winner: 'gpu'
            },
            max: {
              percentage: 33.33,
              winner: 'gpu'
            },
            avg: {
              percentage: 25.92,
              winner: 'gpu'
            }
          },
          cpu_pipe: {
            min: {
              percentage: 44.44,
              winner: 'cpu'
            },
            max: {
              percentage: 44.44,
              winner: 'cpu'
            },
            avg: {
              percentage: 44.44,
              winner: 'cpu'
            }
          }
        },
        best_performer: 'cpu',
        worst_performer: 'pipe'
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
        worst_performer: 'pipe',
        diff: {
          percentage: 80.51,
          winner: 'cpu'
        }
      }
    }
  }

  const stats = generateStatsObj(run_time, build_time);

  t.deepEqual(stats.run_time.mat_mult, expectedStats.run_time.mat_mult, 'generateStatsObj produces expected matrix multiplication run time stats');
  t.deepEqual(stats.run_time.mat_conv, expectedStats.run_time.mat_conv, 'generateStatsObj produces expected matrix convolution run time stats');
  
  t.deepEqual(stats.build_time.mat_mult, expectedStats.build_time.mat_mult, 'generateStatsObj produces expected matrix multiplication build time stats');
  t.deepEqual(stats.build_time.mat_conv, expectedStats.build_time.mat_conv, 'generateStatsObj produces expected matrix convolution build time stats');
  
  t.deepEqual(stats.overall.mat_mult, expectedStats.overall.mat_mult, 'generateStatsObj produces expected matrix multiplication overall stats');
  t.deepEqual(stats.overall.mat_conv, expectedStats.overall.mat_conv, 'generateStatsObj produces expected matrix matrix convolution stats');
  
  t.end();
})