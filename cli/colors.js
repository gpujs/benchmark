// ESC is written \x1b rather than the legacy \033: '0'-prefixed octal escapes
// are illegal in strict mode and in ES modules, so a bundler parsing this as
// ESM rejects the file outright. Same byte either way (0o33 === 0x1b === 27).
module.exports = {
  RED_UNDER: '\x1b[1;31;4m', // underlined red
  RED_NO_UNDER: '\x1b[1;31m', // red without underline
  GREEN_UNDER: '\x1b[0;32;4m', // underlined green
  GREEN_NO_UNDER: '\x1b[0;32m', // green without underline
  YELLOW_UNDER: '\x1b[0;33;4m', // yellow underlined
  YELLOW_NO_UNDER: '\x1b[0;33m', // yellow without underlined
  BG_WHITE: '\x1b[47;30;1m', // white background
  RED_FLASH: '\x1b[1;31;5m', // flashing/blinking red text
  NC: '\x1b[0m' // no color(default)
}
