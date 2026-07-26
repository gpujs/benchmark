const fs = require('fs'),
  browserify = require('browserify'),
  { minify } = require('terser');

const createDist = async () => {
  const buffer = await new Promise((resolve, reject) => {
    // standalone exposes the exports as a global; without it a browserify
    // bundle exposes nothing and the documented browser usage cannot work
    browserify('./src/index.js', { standalone: 'gpujsBenchmark' })
      .bundle((err, result) => err ? reject(err) : resolve(result));
  });

  fs.writeFileSync('./dist/benchmark.js', buffer);

  const { code } = await minify(buffer.toString(), { sourceMap: false });
  fs.writeFileSync('./dist/benchmark.min.js', code);
};

fs.mkdirSync('./dist', { recursive: true });

createDist().catch(error => {
  // the bundle callback used to throw from inside a stream, where nothing could
  // catch it and the process still exited 0
  console.error(error);
  process.exit(1);
});