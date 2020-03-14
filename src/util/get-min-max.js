module.exports = arr => {
  const avg = Math.floor(
      (
        arr.reduce((acc, val) => acc + val) / arr.length
      ) * 100
    ) / 100,
    min = arr.reduce((min, val) => Math.min(min, val)),
    max = arr.reduce((max, val) => Math.max(max, val)),
    deviation = Math.floor(
      (
        arr.reduce((difference, val) => difference + Math.abs(val - avg)) / avg
      ) * 100
    ) / 100;

  return {
    avg,
    min,
    max,
    deviation
  }
}