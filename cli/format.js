/**
 * @method br
 * @description Adds a line break in the console
 * @param numBreaks Number of line breaks to add. (Default 2)
 * @returns {Null}
 */
const br = (numBreaks = 1) => {for(let br = 0; br < numBreaks; br++) {console.log(``)}}

module.exports = {
  br
}