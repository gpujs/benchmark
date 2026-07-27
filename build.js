const fs = require('fs'),
  { rolldown } = require('rolldown'),
  { minify } = require('terser');

const createDist = async () => {
  const bundle = await rolldown({
    input: './src/index.js',
    platform: 'browser',
  });

  // umd + name is browserify's `standalone`: it exposes the exports as a
  // global, without which the documented browser usage cannot work
  const { output } = await bundle.generate({
    format: 'umd',
    name: 'gpujsBenchmark',
  });
  await bundle.close();

  const code = output[0].code;
  fs.writeFileSync('./dist/benchmark.js', code);

  const minified = await minify(code, { sourceMap: false });
  fs.writeFileSync('./dist/benchmark.min.js', minified.code);
};

fs.mkdirSync('./dist', { recursive: true });

createDist().catch(error => {
  // the bundle callback used to throw from inside a stream, where nothing could
  // catch it and the process still exited 0
  console.error(error);
  process.exit(1);
});
