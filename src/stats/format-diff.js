module.exports = (diff, contenders) => {
  if (diff.diff >= 100){
    contenders.splice(diff.greater, diff.greater + 1);

    return {
      percentage: -1,
      winner: contenders[0]
    }
  }
  
  return {
    percentage: diff.diff,
    winner: contenders[diff.greater]
  }
}