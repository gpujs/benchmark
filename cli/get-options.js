const readlineSync = require('readline-sync'),
  defaultInputs = require('./default-options-input.json'),
  { YELLOW_UNDER, GREEN_NO_UNDER, NC } = require('./colors'),
  defaults = require('../src/util/defaults.json');

function getOptionsInput(options) {
  console.log(`${GREEN_NO_UNDER}OPTIONS:${NC} (Press Enter to Select the Default Value)`);
  defaultInputs.forEach(input => {
    options[input] = readlineSync.question(`${YELLOW_UNDER}${input}${NC} (${typeof defaults[input]})(default: ${defaults[input]}): `);
    if (options[input] === '') options[input] = defaults[input];
  })
}

module.exports = getOptionsInput;