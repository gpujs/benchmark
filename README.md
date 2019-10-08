## Benchmark
**Benchmark** is a simple benchmarking tool for GPU.js. This tool works both in JavaScript and CLI.
This tool runs three benchmarks:
1. [Matrix Multiplication](#matrix-multiplication)
2. [Matrix Convolution](#matrix-convolution)
3. [Pipelining](#pipelining)

### Table of Contents
- [Installation](#installation)
- [Browser Usage](#browser-usage)
- [Usage](#usage)
- [Multiple Benchmarks](#multiple-benchmarks)
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
const benchmarks = benchmark.benchmark(options)
```
OR run [Multiple Benchmarks](#multiple-benchmarks)
```js
const benchmarks = benchmark.multipleBenchmark(options)
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
```sh
yarn start options
```
[options](#options) is a  stringified JSON object passed as an argument.
##### OR using `node`
```sh
node ./index.js options
```
Here, `options` is a stringified JSON object.

##### Example
```sh
yarn start '{"num_benchmarks": 4}'
```

#### Multiple Benchmarks in CLI
```sh
yarn start --multiple options
```
[options](#options) to the CLI are stored in a stringified JSON object passed as an argument.
More about [Multiple Benchmarks](#multiple-benchmarks).

#### Multiple Benchmarks
**Benchmark** allows you to run a sequence of benchmarks each with different custom options or each having number options like matrix size changed by a fixed amount.

```js
benchmark.multipleBenchmark(options);
```
Where options is an object with the following properties:
- `commonOptions`(*Object*): Options common to every benchmark in a sequence. (default: `{cpu_benchmark: false}`)
- `range`(*Object*): Define a range of option(number type) values, one for each benchmark in the sequence. *e.g.*: matrix_size: 512, 1024, 1536... or matrix_size: 512, 1024, 2048 ...
Here, the specified option can either be incremented by a fixed number(common difference) or multiplied by a fixed number(common factor).
- - `optionName`(*String*): The name of the option for which the range is to be set. *e.g.*: matrix_size (Default: `matrix_size`)
- - `interval`(*Array*): An array with upper and lower limits for the range. *e.g.*: [512, 2048] (Default: `[128, 1024]`)
- - `step`(*Number*): The fixed number which is to be added(common difference). (Default: `100`)
- - `commonRatio`(*Number*): The fixed number to be multiplied. (Default: none) 
###### NOTE: Only one of `step` and `commonRatio` can be used 
- `fullOptions`(*Array*): An array of objects specifying separate set of options for each benchmark in the sequence(commonOptions properties can be overridden here). (Default: none)
###### NOTE: Only one of `range` and `fullOptions` can be used

##### Examples
1. Range: 
```js
benchmark.multipleBenchmark({
  commonOptions: {
    cpu_benchmark: false,
    logs: false
  },
  range: {
    optionName: 'matrix_size',
    interval: [128, 2048],
    commonRatio: 2
  }
})
```
The above code runs a separate benchmark for the matrix sizes 128, 256, 512, 1024, 2048 which are in GP.

2. fullOptions:
```js
benchmark.multipleBenchmark({
  commonOptions: {
    logs: false,
    cpu_benchmark: false
  },
  fullOptions: [
    {
      logs: true, // override
      matrix_size: 2048
    },
    {
      cpu_benchmark: true, //override
      matrix_size: 128
    }
  ]
})
```

#### Saving Graphs as JSON
1. **Plotly Style JSON**
```sh
yarn start --multiple --returnPlotlyJSON
```
This will log to the console, [plotly.js](https://plot.ly/javascript/) style JSON which stores the graph data for GPU score v/s matrix size of each benchmark.

```sh
yarn start --multiple --savePlotlyJSONToFile=path/to/file.json
```
This saves the [plotly.js](https://plot.ly/javascript/) style JSON data for:
- GPU score v/s matrix size
- GPU matrix multiplication run time v/s matrix size
- CPU score v/s matrix size
- CPU matrix multiplication run time v/s matrix size

##### NOTE: If CPU is not benchmarked, CPU score and run time will have non-meaningful negative values which are to be ignored.
##### NOTE: Filename need not have a `.json` extension.

1. **Chartist Style JSON**
```sh
yarn start --multiple --returnChartistJSON
```
This will log to the console, [chartist.js](https://gionkunz.github.io/chartist-js/) style JSON which stores the graph data for GPU score v/s matrix size of each benchmark.

```sh
yarn start --multiple --saveChartistJSONToFile=path/to/file.json
```
This saves the [chartist.js](https://gionkunz.github.io/chartist-js/) style JSON data for:
- GPU score v/s matrix size
- GPU matrix multiplication run time v/s matrix size
- CPU score v/s matrix size
- CPU matrix multiplication run time v/s matrix size

##### NOTE: If CPU is not benchmarked, CPU score and run time will have non-meaningful negative values which are to be ignored.
##### NOTE: Filename need not have a `.json` extension.

##### NOTE: One or more of the above arguments for JSON output can be used with `--multiple`

### API

#### Output
The output of any benchmark(multiple or single) is a [`BenchmarkOut`](#benchmarkout) Object.

#### Options
The following options can be passed on to the `benchmark` or `multipleBenchmark` method.

1. `benchmark` options:
- `matrix_size`(*Integer*): The size of the uniform matrix used for benchmarking. (default: 512)
- `num_benchmarks`(*Integer*): The number of times the benchmark should be run. (default: 1)
- `logs`(*Boolean*): Toggles console logs by the library.
- `cpu_benchmark`(*Boolean*): Toggles the benchmarking of CPU. False is recommended to big matrix sizes. (default: true)
- `cpu`(*Object*): A custom `GPU({mode: 'cpu})` Object to benchmark specific versions of GPU.js(>= v2.0.0-rc.14). (default: The version shipped with benchmark)
- `gpu`(*Object*): A custom `GPU()` Object to benchmark specific versions of GPU.js(>= v2.0.0-rc.14). (default: The version shipped with benchmark)

2. `multipleBenchmark` options:
[Multiple Benchmark](#multiple-benchmarks) options have the following structure.
```json
{
  commonOptions: { // options common to all but can be overridden in range or in fullOptions, preference given to range
    cpu_benchmark: false
  },
  range: { // only one of this and fullOptions works
    optionName: 'matrix_size',
    interval: [128, 1024],
    step: 100 //(default 10)(A.P.: 128, 138, 148, 158) one of step or commonRatio can be used, preference given to step
    // commonRatio: 2 (G.P.: 128, 256, 512, 1024)
  },
  fullOptions: [
    {
      // array of options objects for each benchmark(only one of this and range works, preference given to range)
    }
  ]
}
```
- `commonOptions`(*Object*): Options common to all the benchmarks that are run. (Same as `benchmark` options).
- `range`(*Object*): Used to create a set of options using a set of rules, for each benchmark. (only one of range or fullOptions can be used)
  - `optionName`(*String*): The option for which the range is applied. This has to be of type Number. It can be one of `benchmark` options.
  - `interval`(*Array*): The upper and lower limits for the option.
  - `step`(*Number*): The common difference between each option value. All the options will be in an AP. (only one of `step` or `commonRatio` can be used, preference given to `step`)
  - `commonRatio`(*Number*): The common ratio between each option value. All the options will be in a GP. (only one of `step` or `commonRatio` can be used, preference given to `step`)
- `fullOptions`(*Array*): An array of options object, each one corresponding to one benchmark. Each object is the same as `benchmark` options. (only one of range or fullOptions can be used)

#### Stats
The [output](#output) contains a `stats` property which shows the overall stats of the benchmark:
- `run_time`: The run time stats
- - `mat_mult`, `mat_conv`, `pipe`(*Object*): These three objects contain the stats for each type of benchmark.
- - - `diff`: Has a single property which cotains performance comparison scores between CPU and GPU.
- - - - `cpu_gpu`:
- - - - - `min`, `max`, `avg`: The minimum, maximum and average time taken stats
- - - - - - `winner`(`gpu` | `cpu`): The better performer among the two.
- - - - - - `percentage`(*Number*): By how much percentage it is better.

- `build_time`: The build time stats
- - `mat_mult`, `mat_conv`: Built time stats for each benchmark.
- - - `diff`: Same as the diff object in `run_time` except that it compares GPU v/s GPU(pipeline mode) in the property `gpu_pipe`.

- `overall`: The overall stats
- - `mat_mult`, `mat_conv`: Overall stats for each benchmark
- - - `best_performer`(`gpu` | `cpu`): The best overall performer.
- - - `worst_performer`(`gpu` | `cpu`): The worst overall performer.
- - - `diff`: Same as the diff object in `run_time`

- `score`: The score object is a property of the main output object.
- - `gpu`, `cpu`(*Number*): The score is a number representing the overall normalized averge performance of the GPU or CPU. This score can be directly compared to other benchmarks or hardware.

#### BenchmarkOut
This object stores the output of **Benchmark**.

##### Methods
- `getDataField(field, index = 0)`(returns: ***): Gets any one of the output field(property).
- - `field`(*String*): The name of the field.
- - `index`(Number): The index of the benchmark if multiple benchmarks are run.
- `getPlotlyJSON(compareFields)`, `getChartistJSON(compareFields)`(Returns: *Array*): Returns plotly style JSON for charts. (only for multiple benchmarks)
- - `compareFields`: An array of objects having two properties `x` and `y` representing the data to be plotted on their respective axes.
- - - `x`, `y`(*String*): Can be one of:
- - - - `matrix_size`
- - - - `gpu_score`
- - - - `cpu_score`
- - - - `gpu_run_time_mat_mult`: GPU matrix multiplication run time
- - - - `cpu_run_time_mat_mult`: CPU matrix multiplication run time
- - - - `gpu_run_time_mat_conv`: GPU matrix convolution run time
- - - - `cpu_run_time_mat_conv`: CPU matrix convolution run time
- - - - `pipe_run_time`: GPU pipelining run time


#### Benchmarks

##### Matrix Multiplication
This benchmark [multiplies](https://www.mathsisfun.com/algebra/matrix-multiplying.html) two randomly generated uniform-sized matrices and benchmarks the GPU and CPU against the time taken by each.

##### Matrix Convolution
This benchmark [convolves](https://en.wikipedia.org/wiki/Kernel_(image_processing)#Convolution) a 3x3 [kernel](https://en.wikipedia.org/wiki/Kernel_(image_processing)) over a randomly generated uniform sized matrix.
The convolution kernel is
```
1 2 1
2 1 2
1 2 1
```

##### Pipelining
GPU.js supports a feature called [Pipelining](https://github.com/gpujs/gpu.js#pipelining) and this benchmark benchmarks this feature.
It runs three matrix multiplication benchmarks in a sequence while pipelining the output of the earlier benchmark to be used as an input to the next one. The benchmark is run both on the GPU and the CPU(without pipelining) and the time taken is compared.