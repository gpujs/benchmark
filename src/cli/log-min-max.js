const { NC, YELLOW_UNDER, RED_NO_UNDER, GREEN_NO_UNDER, RED_UNDER } = require('./colors'),
  { br } = require('./format');

module.exports = minMax => {
  console.log(`GPU minimum: ${YELLOW_UNDER}${minMax.gpu.min}${NC} ms`);
  console.log(`GPU maximum: ${YELLOW_UNDER}${minMax.gpu.max}${NC} ms`);
  console.log(`GPU average: ${YELLOW_UNDER}${minMax.gpu.avg}${NC} ms`);
  br();
  console.log(`GPU(pipeline) minimum: ${YELLOW_UNDER}${minMax.pipe.min}${NC} ms`)
  console.log(`GPU(pipeline) maximum: ${YELLOW_UNDER}${minMax.pipe.max}${NC} ms`)
  console.log(`GPU(pipeline) average: ${YELLOW_UNDER}${minMax.pipe.avg}${NC} ms`)
  br();
  console.log(`CPU minimum: ${YELLOW_UNDER}${minMax.cpu.min}${NC} ms`)
  console.log(`CPU maximum: ${YELLOW_UNDER}${minMax.cpu.max}${NC} ms`)
  console.log(`CPU average: ${YELLOW_UNDER}${minMax.cpu.avg}${NC} ms`)
}