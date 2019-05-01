const { NC, YELLOW_UNDER, RED_NO_UNDER, GREEN_NO_UNDER, RED_UNDER } = require('./colors'),
  { br } = require('./format');

const getVal = val => val == -1 ? `${YELLOW_UNDER}Not Benchmarked${NC}` : `${YELLOW_UNDER}val${NC} ms`

module.exports = minMax => {
  console.log(`GPU minimum: ${getVal(minMax.gpu.min)}`);
  console.log(`GPU maximum: ${getVal(minMax.gpu.max)}`);
  console.log(`GPU average: ${getVal(minMax.gpu.avg)}`);
  br();
  console.log(`GPU(pipeline) minimum: ${getVal(minMax.pipe.min)}`)
  console.log(`GPU(pipeline) maximum: ${getVal(minMax.pipe.max)}`)
  console.log(`GPU(pipeline) average: ${getVal(minMax.pipe.avg)}`)
  br();
  console.log(`CPU minimum: ${getVal(minMax.cpu.min)}`)
  console.log(`CPU maximum: ${getVal(minMax.cpu.max)}`)
  console.log(`CPU average: ${getVal(minMax.cpu.avg)}`)
}