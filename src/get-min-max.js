module.exports = arr => {
  const avg = (arr.reduce((acc, val) => acc + val)) / arr.length,
    min = arr.reduce((min, val) => Math.min(min, val)),
    max = arr.reduce((max, val) => Math.max(max, val))

  return {
    avg,
    min,
    max
  }
}