const { NC, YELLOW_UNDER } = require('./colors');

const getVal = val => val.avg == -1 ? 
  `${YELLOW_UNDER}Not Benchmarked${NC}` :
  `${YELLOW_UNDER}${val.avg}${NC} ms +- ${YELLOW_UNDER}${val.deviation}${NC}%`

module.exports = minMax => {
  console.log(`GPU average: ${getVal(minMax.gpu)}`);
  console.log(`CPU average: ${getVal(minMax.cpu)}`);
}