const fs = require('fs'),
  browserify = require('browserify'),
  minify = require('minify');

const createDist = () => {
  browserify('./src/index.js').bundle((err, buffer) => {
    if (err) throw err;

    fs.writeFileSync('./dist/benchmark.js', buffer);
    minify('./dist/benchmark.js').then((data) => fs.writeFileSync('./dist/benchmark.min.js', data));
  })
}

if (fs.existsSync('./dist')){
  createDist();
}
else {
  fs.mkdirSync('./dist');
  createDist();
}