## Benchmark
**Benchmark** is a simple benchmarking tool for GPU.js. This tool works both in JavaScript and in CLI.
This tool runs two benchmarks:
1. [Matrix Multiplication](https://en.wikipedia.org/wiki/Matrix_multiplication)
2. [Matrix Convolution](https://en.wikipedia.org/wiki/Kernel_(image_processing))

### Table of Contents
- [Installation](#installation)
- [Browser Usage](#browser-usage)
- [Usage](#usage)
- [Output](#output)
- [Options](#options)
- [Stats](#stats)
- [Benchmarks](#benchmarks)

### Installation
We recommend you to install **benchmark** as a development dependency.
#### Using yarn
```sh
yarn add --dev @gpujs/benchmark
```
#### Using npm
```sh
npm install --save-dev @gpujs/benchmark
```
##### NOTE: If it asks for a GPU.js version, you can choose any version of your choice (>=v2.0.0-rc.10) but the provided dist files will have the version which was the latest during the release of the latest version of **benchmark**

### Browser Usage
#### Building
**NOTE**: The dist files are also included in the npm module and GitHub repository, skip this step if you are not running a modified script locally.
We use browserify and minify to build the distributable files `dist/benchmark.js` and `dist/benchmark.min.js`.
After running the setup script, run the following command
```sh
yarn build
```

#### Using
Include the benchmark dist file in the HTML file.
```html
<script src="path/to/dist/benchmark.min.js"></script>
```
or, from the npm module
```html
<script src="path/to/node_modules/@gpujs/benchmark/dist/benchmark.min.js"></script>
The function can be referred to in JS as `benchmark`
```js
const out = benchmark(options);
```

### Usage
#### Javascript
1. Import **Benchmark**.
```js
const benchmark = require('@gpujs/benchmark')
```
##### OR using ES6 syntax
```js
import benchmark from '@gpujs/benchmark'
```

2. Run it.
```js
const benchmarks = benchmark(options)
```
This returns the benchmarks in an Object. See [this](#output).
##### NOTE: Options are optional parameters. See [this](#options).

#### CLI
1. Clone the repository and open the directory.
```sh
git clone https://github.com/gpujs/benchmark
cd benchmark
```

2. Install `yarn`
We use [yarn](https://yarnpkg.com/en/) as our package manager. You will have to install that too, as a side effect. (If you have yarn installed, skip this step)
```sh
npm install -g yarn
```

3. Install the dependencies
```sh
yarn setup
```
##### NOTE: If it asks for a GPU.js version, you can choose any version of your choice (>=v2.0.0-rc.10) but the provided dist files will have the version which was the latest during the release of the latest version of **benchmark**

4. Run the tool in the CLI
```sh
yarn start
```
##### OR using `node`
```sh
node ./index.js
```
#### Using CLI with options
[options](#options) to the CLI are stored in stringified JSON object passed as an arguement.
```sh
yarn start options
```
##### OR using `node`
```sh
node ./index.js options
```
Here, `options` is a stringified JSON object.

##### Example
```sh
yarn start '{"num_benchmarks": 4}'
```

### Output
The returned output is a JavaScript `Object` with the following structure.
```js
{
  mat_gen: <Number>,
  mat_pad: <Number>,

  build_time: {
    mat_mult: {
      gpu: <Number>,
      pipe: <number>
    },
    mat_conv: <Object> // same as mat_mult
  },

  run_time: {
    mat_mult: {
      gpu: {
        min: <Number>,
        max: <Number>,
        avg: <Number>
      },
      cpu: {
        min: <Number>,
        max: <Number>,
        avg: <Number>
      }
    },
    mat_conv: <Object>, // same as mat_mult
    pipe: <Object> // same as mat_mult
  },

  stats: <Object>,

  score: {
    gpu: <Number>,
    cpu: <Number>
  },

  options: <Object>
}
```
- `mat_gen`: The matrix generation time in `ms` accurate upto 2 decimal places.
- `mat_pad`: The matrix padding time in `ms` accurate upto 2 decimal places.

1. `build_time`: Object containing kernel compilation times.
- `mat_mult`: Compilation times for matrix multiplication kernel.
- `mat_conv`: Compilation times for matrix convolution kernel.
- `gpu`: Compilation time of the GPU kernel.
- `pipe`: Compilation time of the GPU kernel with pipeline mode.

2. `run_time`: Run times of each of the benchmarks.
- `mat_mult`: Run times for [matrix multiplication benchmark](#matrix-multiplication).
- `mat_conv`: Run times for [matrix convolution benchmark](#matrix-convolution).
- `pipe`: Run times for the [pipelining benchmark](#pipelining).
- `gpu`: Run times for the GPU benchmark.
- `cpu`: Run times for the CPU benchmark.
- `min`: Minimum benchmark time in `ms` accurate up to 2 decimal places. (If multiple benchmarks are run)
- `max`: Maximum benchmark time in `ms` accurate up to 2 decimal places. (If multiple benchmarks are run)
- `avg`: Average benchmark time in `ms` accurate up to 2 decimal places. (If multiple benchmarks are run)

3. `stats`: An object which contains some statistics regarding the performances of different modes in different benchmarks. See [this](#stats)

4. `score`: The score for the CPU and GPU calculated depending upon the matrix size and time taken.

5. `options`: The original options Object. See [this](#options)

##### NOTE: If only a single benchmark is run, `min`, `max` and `avg` will have the same values

### Options
Options are optional parameters as a JavaScript `Object`.
#### Properties
1. `num_benchmarks`(Number): Number of times to run a benchmark. The output values will be `min`, `max` and `avg` of all the benchmarks. (default: `1`)
2. `matrix_size`(Number): Size of the benchmark matrix which is uniform i.e. equal number of comlumns and rows. (default: `512`)
3. `logs`(Boolean): Toggle non-CLI console logs. (default: `true`)
4. `cpu_benchmark`(Boolean): Toggle CPU benchmarks. The `min`, `max` and `avg` values are set to `-1` if this option is set to `false`. (default: `true`) 
5. `cpu`(Object): An optional custom `GPU` object with `{mode: 'cpu'}`(To use a specific version).
6. `gpu`(Object): An optional custom `GPU` object (To use a specific version but version has to be >= 2.0.0)

### Stats
`stats` is an `Object` with the following structure.
```js
{
  run_time: {
    mat_mult: {
      diff: {
        gpu_cpu: {
          avg: {
            percentage: <Number>,
            winner: <String>
          },
          min: {
            percentage: <Number>,
            winner: <String>
          },
          max: {
            percentage: <Number>,
            winner: <String>
          }
        }
      },
      best_performer: <String>,
      worst_performer: <String>
    },
    mat_conv: <Object>, // same as mat_mult
    pipe: <Object> // same as mat_mult
  },
  
  build_time: {
    mat_mult: {
      diff: {
        gpu_pipe: {
          percentage: <Number>,
          winner: <String>
        }
      }
    },
    mat_conv: <Object> // same as mat_mult
  },

  overall: {
    mat_mult: {
      best_performer: <String>,
      worst_performer: <String>,
      diff: {
        percentage: <Number>,
        winner: <Object>
      }
    }
    mat_conv: <Object> //same as mat_mult
  }
}
```

#### Properties
1. `run_time` (Object): An Object containing all the run time statistics.
- `mat_mult` (Object): An Object containing all the statistics for the matrix multiplication benchmark.
- `mat_conv` (Object): An Object containing all the statistics for the matrix convolution benchmark.
- `diff` (Object): An Object containing percentage difference in run time performance.
- `gpu_cpu` (Object): Performance comparison between the GPU and the CPU.
- `min` (Object): Performance comparison between the `min` values.
- `max` (Object): Performance comparison between the `max` values.
- `avg` (Object): Performance comparison between the `avg` values.
- `percentage` (Number): Percentage difference in the performance.
- `winner` (String): The best performer.
- `best_performer` (String): The best run time performer (considering the `avg` values).
- `worst_performer` (String): The worst run time performer (considering the `avg` values).

2. `build_time` (Object): An Object containing all the build time statistics.
- `mat_mult` (Object): An Object containing all the statistics for the [matrix multiplication](#matrix-multiplication) benchmark.
- `mat_conv` (Object): An Object containing all the statistics for the [matrix convolution](#matrix-convolution) benchmark.
- `pipe` (Object): An Object containing all the statistics for the [pipelining](#pipelining) benchmark.
- `diff` (Object): An Object containing percentage difference in compilation performance.
- `percentage` (Object): Percentage difference in the build time performance.
- `winner` (Object): The best performer.

3. `overall` (Object): An Object containing all the overall performance statistics i.e. build time and run time performance statistics (considering the `avg` values).
- `best_performer` (String): The best overall performer.
- `worst_performer` (String): The worst overall performer.
- `diff` (Object): An Object containing percentage difference in overall performance between the best and the worst performer.
- `percentage` (Number): Percentage difference in overall the performance between the best and the worst performer.
- `winner` (String): The best performer.

### Benchmarks
#### Matrix Multiplication
[Multiplies 2 matrices](https://en.wikipedia.org/wiki/Matrix_multiplication) of a given size and returns the time taken.

#### Matrix Convolution
[Convolves](https://en.wikipedia.org/wiki/Kernel_(image_processing)) a 3x3 kernel over the main matrix of a given size.
The kernel is
```
1 2 1
2 1 2
1 2 1
```

#### Pipelining
This benchmark benchmarks the [pipelining](https://github.com/gpujs/gpu.js/blob/develop/README.md#pipelining) feature of GPU.js.
It multiplies 5 matrices in sequence while the outputs are pipelined.