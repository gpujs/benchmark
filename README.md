## Benchmark
**Benchmark** is a simple benchmarking tool for GPU.js. This tool works both in JavaScript and in CLI.
This tool runs two benchmarks:
1. [Matrix Multiplication](https://en.wikipedia.org/wiki/Matrix_multiplication)
2. [Matrix Convolution](https://en.wikipedia.org/wiki/Kernel_(image_processing))

### Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Output](#output)
- [Options](#options)

### Installation
We recommend you to install **Benchmark** as a development dependency.
#### Using yarn
```sh
yarn add --dev @gpujs/benchmark
```
#### Using npm
```sh
npm install --save-dev @gpujs/benchmark
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
We use [yarn](https://yarnpkg.com/en/) as our package manager. You will have to install that too, as a side effect.(If you have yarn installed, skip this step)
```sh
npm install -g yarn
```

3. Install the dependencies
```sh
yarn install
```

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
    mat_conv: {
      gpu: <Number>
      pipe: <Number>
    }
  },

  run_time: {
    mat_mult: {
      gpu: {
        min: <Number>,
        max: <Number>,
        avg: <Number>
      },
      pipe: {
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
    mat_conv: {
      gpu: {
        min: <Number>,
        max: <Number>,
        avg: <Number>
      },
      pipe: {
        min: <Number>,
        max: <Number>,
        avg: <Number>
      },
      cpu: {
        min: <Number>,
        max: <Number>,
        avg: <Number>
      }
    }
  }
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
- `mat_mult`: Run times for matrix multiplication benchmark.
- `mat_conv`: Run times for matrix convolution benchmark.
- `gpu`: Run times for the GPU benchmark.
- `pipe`: Run times for the GPU with pipeline mode benchmark.
- `cpu`: Run times for the CPU benchmark.
- `min`: Minimum benchmark time in `ms` accurate upto 2 decimal places.(If multiple benchmarks are run)
- `max`: Maximum benchmark time in `ms` accurate upto 2 decimal places.(If multiple benchmarks are run)
- `avg`: Average benchmark time in `ms` accurate upto 2 decimal places.(If multiple benchmarks are run)

##### NOTE: If only a single benchmark is run, `min`, `max` and `avg` will have the same values

### Options
Options are optional parameters as a JavaScript `Object`.
#### Properties
1. `num_benchmarks`(Number): Number of times to run a benchmark. The output values will be `min`, `max` and `avg` of all the benchmarks. (default: `1`)
2. `matrix_size`(Number): Size of the benchmark matrix which is uniform i.e. equal number of comlumns and rows. (default: `512`)
3. `logs`(Boolean): Whether to log to the console or not (In non-CLI mode). (default: `true`) 
4. `cpu`(Object): An optional custom `GPU` object with `{mode: 'cpu'}`(To use a specific version).
5. `gpu`(Object): An optional custom `GPU` object (To use a specific version but version has to be >= 2.0.0)