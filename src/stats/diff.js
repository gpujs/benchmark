const getDiff = (val1, val2) => Math.floor(
    ((val2 - val1) / val2) * 10000
  ) / 100

module.exports = (val1, val2) => val1 < val2 ? 
  {
    diff: getDiff(val1, val2), greater: 0
  } : 
  {
    diff: getDiff(val2, val1), greater: 1
  }