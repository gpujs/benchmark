module.exports = func => {
  const time = performance.now() * (-1)
  const ret = func()
  time += performance.now()

  return {
    ret,
    time
  }
}