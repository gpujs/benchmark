const { NC, YELLOW_UNDER } = require('./colors'),
  { br } = require('./format');

const getVal = val => val == -1 ? `${YELLOW_UNDER}Not Benchmarked${NC}` : `${YELLOW_UNDER}${val}${NC} ms`

module.exports = minMax => {
  console.log(`GPU average: ${getVal(minMax.gpu.avg)}`);
  br();
  console.log(`CPU average: ${getVal(minMax.cpu.avg)}`);
}