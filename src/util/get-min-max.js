module.exports = arr => {
  const avg = Math.floor(
      (
        arr.reduce((acc, val) => acc + val) / arr.length
      ) * 100
    ) / 100,
    min = arr.reduce((min, val) => Math.min(min, val)),
    max = arr.reduce((max, val) => Math.max(max, val));

  // Deviation Calculation
  let difference = 0;

  arr.forEach(val => difference += Math.abs(val - avg));

  const deviation = Math.floor(
    (
      difference / avg
    ) * 100
  ) / 100;

  return {
    avg,
    min,
    max,
    deviation
  }
}