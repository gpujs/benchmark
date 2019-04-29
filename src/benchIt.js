const now = require('performance-now')
module.exports = func => {

  let time = now() * (-1)
  const ret = func()
  time += now()
  time *= 100
  time = Math.floor(time) / 100

  return {
    ret,
    time
  }
}