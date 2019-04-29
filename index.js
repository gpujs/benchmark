const bench = require('./src/index')
const benchmarks = bench()

console.log(`matrix generation time: ${benchmarks.matGen}ms`)

console.log(`matrix multiplication compile time: ${benchmarks.build_time.matMult.gpu}ms`)
console.log(`matrix multiplication (pipeline) compile time: ${benchmarks.build_time.matMult.pipe}ms`)

console.log(``)

console.log(`matrix multiplication run time: ${benchmarks.run_time.matMult.gpu}ms`)
console.log(`matrix multiplication (pipeline) run time: ${benchmarks.run_time.matMult.pipe}ms`)