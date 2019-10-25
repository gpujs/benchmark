(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (process,__filename){
/**
 * Module dependencies.
 */

var fs = require('fs'),
  path = require('path'),
  fileURLToPath = require('file-uri-to-path'),
  join = path.join,
  dirname = path.dirname,
  exists =
    (fs.accessSync &&
      function(path) {
        try {
          fs.accessSync(path);
        } catch (e) {
          return false;
        }
        return true;
      }) ||
    fs.existsSync ||
    path.existsSync,
  defaults = {
    arrow: process.env.NODE_BINDINGS_ARROW || ' → ',
    compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled',
    platform: process.platform,
    arch: process.arch,
    nodePreGyp:
      'node-v' +
      process.versions.modules +
      '-' +
      process.platform +
      '-' +
      process.arch,
    version: process.versions.node,
    bindings: 'bindings.node',
    try: [
      // node-gyp's linked version in the "build" dir
      ['module_root', 'build', 'bindings'],
      // node-waf and gyp_addon (a.k.a node-gyp)
      ['module_root', 'build', 'Debug', 'bindings'],
      ['module_root', 'build', 'Release', 'bindings'],
      // Debug files, for development (legacy behavior, remove for node v0.9)
      ['module_root', 'out', 'Debug', 'bindings'],
      ['module_root', 'Debug', 'bindings'],
      // Release files, but manually compiled (legacy behavior, remove for node v0.9)
      ['module_root', 'out', 'Release', 'bindings'],
      ['module_root', 'Release', 'bindings'],
      // Legacy from node-waf, node <= 0.4.x
      ['module_root', 'build', 'default', 'bindings'],
      // Production "Release" buildtype binary (meh...)
      ['module_root', 'compiled', 'version', 'platform', 'arch', 'bindings'],
      // node-qbs builds
      ['module_root', 'addon-build', 'release', 'install-root', 'bindings'],
      ['module_root', 'addon-build', 'debug', 'install-root', 'bindings'],
      ['module_root', 'addon-build', 'default', 'install-root', 'bindings'],
      // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
      ['module_root', 'lib', 'binding', 'nodePreGyp', 'bindings']
    ]
  };

/**
 * The main `bindings()` function loads the compiled bindings for a given module.
 * It uses V8's Error API to determine the parent filename that this function is
 * being invoked from, which is then used to find the root directory.
 */

function bindings(opts) {
  // Argument surgery
  if (typeof opts == 'string') {
    opts = { bindings: opts };
  } else if (!opts) {
    opts = {};
  }

  // maps `defaults` onto `opts` object
  Object.keys(defaults).map(function(i) {
    if (!(i in opts)) opts[i] = defaults[i];
  });

  // Get the module root
  if (!opts.module_root) {
    opts.module_root = exports.getRoot(exports.getFileName());
  }

  // Ensure the given bindings name ends with .node
  if (path.extname(opts.bindings) != '.node') {
    opts.bindings += '.node';
  }

  // https://github.com/webpack/webpack/issues/4175#issuecomment-342931035
  var requireFunc =
    typeof __webpack_require__ === 'function'
      ? __non_webpack_require__
      : require;

  var tries = [],
    i = 0,
    l = opts.try.length,
    n,
    b,
    err;

  for (; i < l; i++) {
    n = join.apply(
      null,
      opts.try[i].map(function(p) {
        return opts[p] || p;
      })
    );
    tries.push(n);
    try {
      b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
      if (!opts.path) {
        b.path = n;
      }
      return b;
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' &&
          e.code !== 'QUALIFIED_PATH_RESOLUTION_FAILED' &&
          !/not find/i.test(e.message)) {
        throw e;
      }
    }
  }

  err = new Error(
    'Could not locate the bindings file. Tried:\n' +
      tries
        .map(function(a) {
          return opts.arrow + a;
        })
        .join('\n')
  );
  err.tries = tries;
  throw err;
}
module.exports = exports = bindings;

/**
 * Gets the filename of the JavaScript file that invokes this function.
 * Used to help find the root directory of a module.
 * Optionally accepts an filename argument to skip when searching for the invoking filename
 */

exports.getFileName = function getFileName(calling_file) {
  var origPST = Error.prepareStackTrace,
    origSTL = Error.stackTraceLimit,
    dummy = {},
    fileName;

  Error.stackTraceLimit = 10;

  Error.prepareStackTrace = function(e, st) {
    for (var i = 0, l = st.length; i < l; i++) {
      fileName = st[i].getFileName();
      if (fileName !== __filename) {
        if (calling_file) {
          if (fileName !== calling_file) {
            return;
          }
        } else {
          return;
        }
      }
    }
  };

  // run the 'prepareStackTrace' function above
  Error.captureStackTrace(dummy);
  dummy.stack;

  // cleanup
  Error.prepareStackTrace = origPST;
  Error.stackTraceLimit = origSTL;

  // handle filename that starts with "file://"
  var fileSchema = 'file://';
  if (fileName.indexOf(fileSchema) === 0) {
    fileName = fileURLToPath(fileName);
  }

  return fileName;
};

/**
 * Gets the root directory of a module, given an arbitrary filename
 * somewhere in the module tree. The "root directory" is the directory
 * containing the `package.json` file.
 *
 *   In:  /home/nate/node-native-module/lib/index.js
 *   Out: /home/nate/node-native-module
 */

exports.getRoot = function getRoot(file) {
  var dir = dirname(file),
    prev;
  while (true) {
    if (dir === '.') {
      // Avoids an infinite loop in rare cases, like the REPL
      dir = process.cwd();
    }
    if (
      exists(join(dir, 'package.json')) ||
      exists(join(dir, 'node_modules'))
    ) {
      // Found the 'package.json' file or 'node_modules' dir; we're done
      return dir;
    }
    if (prev === dir) {
      // Got to the top
      throw new Error(
        'Could not find module root given file: "' +
          file +
          '". Do you have a `package.json` file? '
      );
    }
    // Try the parent dir next
    prev = dir;
    dir = join(dir, '..');
  }
};

}).call(this,require('_process'),"/node_modules/bindings/bindings.js")
},{"_process":154,"file-uri-to-path":6,"fs":4,"path":152}],3:[function(require,module,exports){
/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

"use strict"; "use restrict";

//Number of bits in an integer
var INT_BITS = 32;

//Constants
exports.INT_BITS  = INT_BITS;
exports.INT_MAX   =  0x7fffffff;
exports.INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
exports.sign = function(v) {
  return (v > 0) - (v < 0);
}

//Computes absolute value of integer
exports.abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
}

//Computes minimum of integers x and y
exports.min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
}

//Computes maximum of integers x and y
exports.max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
}

//Checks if a number is a power of two
exports.isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
}

//Computes log base 2 of v
exports.log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
}

//Computes log base 10 of v
exports.log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
}

//Counts number of bits
exports.popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
exports.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
exports.nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

//Rounds down to previous power of 2
exports.prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
}

//Computes parity of word
exports.parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
}

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
exports.reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
}

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
exports.interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

//Extracts the nth interleaved component
exports.deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
}


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
exports.interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
}

//Extracts nth interleaved component of a 3-tuple
exports.deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
}

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
exports.nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
}


},{}],4:[function(require,module,exports){

},{}],5:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":5,"ieee754":151}],6:[function(require,module,exports){

/**
 * Module dependencies.
 */

var sep = require('path').sep || '/';

/**
 * Module exports.
 */

module.exports = fileUriToPath;

/**
 * File URI to Path function.
 *
 * @param {String} uri
 * @return {String} path
 * @api public
 */

function fileUriToPath (uri) {
  if ('string' != typeof uri ||
      uri.length <= 7 ||
      'file://' != uri.substring(0, 7)) {
    throw new TypeError('must pass in a file:// URI to convert to a file path');
  }

  var rest = decodeURI(uri.substring(7));
  var firstSlash = rest.indexOf('/');
  var host = rest.substring(0, firstSlash);
  var path = rest.substring(firstSlash + 1);

  // 2.  Scheme Definition
  // As a special case, <host> can be the string "localhost" or the empty
  // string; this is interpreted as "the machine from which the URL is
  // being interpreted".
  if ('localhost' == host) host = '';

  if (host) {
    host = sep + sep + host;
  }

  // 3.2  Drives, drive letters, mount points, file system root
  // Drive letters are mapped into the top of a file URI in various ways,
  // depending on the implementation; some applications substitute
  // vertical bar ("|") for the colon after the drive letter, yielding
  // "file:///c|/tmp/test.txt".  In some cases, the colon is left
  // unchanged, as in "file:///c:/tmp/test.txt".  In other cases, the
  // colon is simply omitted, as in "file:///c/tmp/test.txt".
  path = path.replace(/^(.+)\|/, '$1:');

  // for Windows, we need to invert the path separators from what a URI uses
  if (sep == '\\') {
    path = path.replace(/\//g, '\\');
  }

  if (/^.+\:/.test(path)) {
    // has Windows drive at beginning of path
  } else {
    // unix path…
    path = sep + path;
  }

  return host + path;
}

},{"path":152}],7:[function(require,module,exports){
/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {IGLWiretapOptions} [options]
 * @returns {GLWiretapProxy}
 */
function glWiretap(gl, options = {}) {
  const {
    contextName = 'gl',
    throwGetError,
    useTrackablePrimitives,
    readPixelsFile,
    recording = [],
    variables = {},
    onReadPixels,
    onUnrecognizedArgumentLookup,
  } = options;
  const proxy = new Proxy(gl, { get: listen });
  const contextVariables = [];
  const entityNames = {};
  let imageCount = 0;
  let indent = '';
  let readPixelsVariableName;
  return proxy;
  function listen(obj, property) {
    switch (property) {
      case 'addComment': return addComment;
      case 'checkThrowError': return checkThrowError;
      case 'getReadPixelsVariableName': return readPixelsVariableName;
      case 'insertVariable': return insertVariable;
      case 'reset': return reset;
      case 'setIndent': return setIndent;
      case 'toString': return toString;
      case 'getContextVariableName': return getContextVariableName;
    }
    if (typeof gl[property] === 'function') {
      return function() { // need arguments from this, fyi
        switch (property) {
          case 'getError':
            if (throwGetError) {
              recording.push(`${indent}if (${contextName}.getError() !== ${contextName}.NONE) throw new Error('error');`);
            } else {
              recording.push(`${indent}${contextName}.getError();`); // flush out errors
            }
            return gl.getError();
          case 'getExtension': {
            const variableName = `${contextName}Variables${contextVariables.length}`;
            recording.push(`${indent}const ${variableName} = ${contextName}.getExtension('${arguments[0]}');`);
            const extension = gl.getExtension(arguments[0]);
            if (extension && typeof extension === 'object') {
              const tappedExtension = glExtensionWiretap(extension, {
                getEntity,
                useTrackablePrimitives,
                recording,
                contextName: variableName,
                contextVariables,
                variables,
                indent,
                onUnrecognizedArgumentLookup,
              });
              contextVariables.push(tappedExtension);
              return tappedExtension;
            } else {
              contextVariables.push(null);
            }
            return extension;
          }
          case 'readPixels':
            const i = contextVariables.indexOf(arguments[6]);
            let targetVariableName;
            if (i === -1) {
              const variableName = getVariableName(arguments[6]);
              if (variableName) {
                targetVariableName = variableName;
                recording.push(`${indent}${variableName}`);
              } else {
                targetVariableName = `${contextName}Variable${contextVariables.length}`;
                contextVariables.push(arguments[6]);
                recording.push(`${indent}const ${targetVariableName} = new ${arguments[6].constructor.name}(${arguments[6].length});`);
              }
            } else {
              targetVariableName = `${contextName}Variable${i}`;
            }
            readPixelsVariableName = targetVariableName;
            const argumentAsStrings = [
              arguments[0],
              arguments[1],
              arguments[2],
              arguments[3],
              getEntity(arguments[4]),
              getEntity(arguments[5]),
              targetVariableName
            ];
            recording.push(`${indent}${contextName}.readPixels(${argumentAsStrings.join(', ')});`);
            if (readPixelsFile) {
              writePPM(arguments[2], arguments[3]);
            }
            if (onReadPixels) {
              onReadPixels(targetVariableName, argumentAsStrings);
            }
            return gl.readPixels.apply(gl, arguments);
          case 'drawBuffers':
            recording.push(`${indent}${contextName}.drawBuffers([${argumentsToString(arguments[0], { contextName, contextVariables, getEntity, addVariable, variables, onUnrecognizedArgumentLookup } )}]);`);
            return gl.drawBuffers(arguments[0]);
        }
        let result = gl[property].apply(gl, arguments);
        switch (typeof result) {
          case 'undefined':
            recording.push(`${indent}${methodCallToString(property, arguments)};`);
            return;
          case 'number':
          case 'boolean':
            if (useTrackablePrimitives && contextVariables.indexOf(trackablePrimitive(result)) === -1) {
              recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
              contextVariables.push(result = trackablePrimitive(result));
              break;
            }
          default:
            if (result === null) {
              recording.push(`${methodCallToString(property, arguments)};`);
            } else {
              recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
            }

            contextVariables.push(result);
        }
        return result;
      }
    }
    entityNames[gl[property]] = property;
    return gl[property];
  }
  function toString() {
    return recording.join('\n');
  }
  function reset() {
    while (recording.length > 0) {
      recording.pop();
    }
  }
  function insertVariable(name, value) {
    variables[name] = value;
  }
  function getEntity(value) {
    const name = entityNames[value];
    if (name) {
      return contextName + '.' + name;
    }
    return value;
  }
  function setIndent(spaces) {
    indent = ' '.repeat(spaces);
  }
  function addVariable(value, source) {
    const variableName = `${contextName}Variable${contextVariables.length}`;
    recording.push(`${indent}const ${variableName} = ${source};`);
    contextVariables.push(value);
    return variableName;
  }
  function writePPM(width, height) {
    const sourceVariable = `${contextName}Variable${contextVariables.length}`;
    const imageVariable = `imageDatum${imageCount}`;
    recording.push(`${indent}let ${imageVariable} = ["P3\\n# ${readPixelsFile}.ppm\\n", ${width}, ' ', ${height}, "\\n255\\n"].join("");`);
    recording.push(`${indent}for (let i = 0; i < ${imageVariable}.length; i += 4) {`);
    recording.push(`${indent}  ${imageVariable} += ${sourceVariable}[i] + ' ' + ${sourceVariable}[i + 1] + ' ' + ${sourceVariable}[i + 2] + ' ';`);
    recording.push(`${indent}}`);
    recording.push(`${indent}if (typeof require !== "undefined") {`);
    recording.push(`${indent}  require('fs').writeFileSync('./${readPixelsFile}.ppm', ${imageVariable});`);
    recording.push(`${indent}}`);
    imageCount++;
  }
  function addComment(value) {
    recording.push(`${indent}// ${value}`);
  }
  function checkThrowError() {
    recording.push(`${indent}(() => {
${indent}const error = ${contextName}.getError();
${indent}if (error !== ${contextName}.NONE) {
${indent}  const names = Object.getOwnPropertyNames(gl);
${indent}  for (let i = 0; i < names.length; i++) {
${indent}    const name = names[i];
${indent}    if (${contextName}[name] === error) {
${indent}      throw new Error('${contextName} threw ' + name);
${indent}    }
${indent}  }
${indent}}
${indent}})();`);
  }
  function methodCallToString(method, args) {
    return `${contextName}.${method}(${argumentsToString(args, { contextName, contextVariables, getEntity, addVariable, variables, onUnrecognizedArgumentLookup })})`;
  }

  function getVariableName(value) {
    if (variables) {
      for (const name in variables) {
        if (variables[name] === value) {
          return name;
        }
      }
    }
    return null;
  }

  function getContextVariableName(value) {
    const i = contextVariables.indexOf(value);
    if (i !== -1) {
      return `${contextName}Variable${i}`;
    }
    return null;
  }
}

/**
 *
 * @param extension
 * @param {IGLExtensionWiretapOptions} options
 * @returns {*}
 */
function glExtensionWiretap(extension, options) {
  const proxy = new Proxy(extension, { get: listen });
  const extensionEntityNames = {};
  const {
    contextName,
    contextVariables,
    getEntity,
    useTrackablePrimitives,
    recording,
    variables,
    indent,
    onUnrecognizedArgumentLookup,
  } = options;
  return proxy;
  function listen(obj, property) {
    if (typeof obj[property] === 'function') {
      return function() {
        switch (property) {
          case 'drawBuffersWEBGL':
            recording.push(`${indent}${contextName}.drawBuffersWEBGL([${argumentsToString(arguments[0], { contextName, contextVariables, getEntity: getExtensionEntity, addVariable, variables, onUnrecognizedArgumentLookup })}]);`);
            return extension.drawBuffersWEBGL(arguments[0]);
        }
        let result = extension[property].apply(extension, arguments);
        switch (typeof result) {
          case 'undefined':
            recording.push(`${indent}${methodCallToString(property, arguments)};`);
            return;
          case 'number':
          case 'boolean':
            if (useTrackablePrimitives && contextVariables.indexOf(trackablePrimitive(result)) === -1) {
              recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
              contextVariables.push(result = trackablePrimitive(result));
            } else {
              recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
              contextVariables.push(result);
            }
            break;
          default:
            if (result === null) {
              recording.push(`${methodCallToString(property, arguments)};`);
            } else {
              recording.push(`${indent}const ${contextName}Variable${contextVariables.length} = ${methodCallToString(property, arguments)};`);
            }
            contextVariables.push(result);
        }
        return result;
      };
    }
    extensionEntityNames[extension[property]] = property;
    return extension[property];
  }

  function getExtensionEntity(value) {
    if (extensionEntityNames.hasOwnProperty(value)) {
      return `${contextName}.${extensionEntityNames[value]}`;
    }
    return getEntity(value);
  }

  function methodCallToString(method, args) {
    return `${contextName}.${method}(${argumentsToString(args, { contextName, contextVariables, getEntity: getExtensionEntity, addVariable, variables, onUnrecognizedArgumentLookup })})`;
  }

  function addVariable(value, source) {
    const variableName = `${contextName}Variable${contextVariables.length}`;
    contextVariables.push(value);
    recording.push(`${indent}const ${variableName} = ${source};`);
    return variableName;
  }
}

function argumentsToString(args, options) {
  const { variables, onUnrecognizedArgumentLookup } = options;
  return (Array.from(args).map((arg) => {
    const variableName = getVariableName(arg);
    if (variableName) {
      return variableName;
    }
    return argumentToString(arg, options);
  }).join(', '));

  function getVariableName(value) {
    if (variables) {
      for (const name in variables) {
        if (!variables.hasOwnProperty(name)) continue;
        if (variables[name] === value) {
          return name;
        }
      }
    }
    if (onUnrecognizedArgumentLookup) {
      return onUnrecognizedArgumentLookup(value);
    }
    return null;
  }
}

function argumentToString(arg, options) {
  const { contextName, contextVariables, getEntity, addVariable, onUnrecognizedArgumentLookup } = options;
  if (typeof arg === 'undefined') {
    return 'undefined';
  }
  if (arg === null) {
    return 'null';
  }
  const i = contextVariables.indexOf(arg);
  if (i > -1) {
    return `${contextName}Variable${i}`;
  }
  switch (arg.constructor.name) {
    case 'String':
      const hasLines = /\n/.test(arg);
      const hasSingleQuotes = /'/.test(arg);
      const hasDoubleQuotes = /"/.test(arg);
      if (hasLines) {
        return '`' + arg + '`';
      } else if (hasSingleQuotes && !hasDoubleQuotes) {
        return '"' + arg + '"';
      } else if (!hasSingleQuotes && hasDoubleQuotes) {
        return "'" + arg + "'";
      } else {
        return '\'' + arg + '\'';
      }
    case 'Number': return getEntity(arg);
    case 'Boolean': return getEntity(arg);
    case 'Array':
      return addVariable(arg, `new ${arg.constructor.name}([${Array.from(arg).join(',')}])`);
    case 'Float32Array':
    case 'Uint8Array':
    case 'Uint16Array':
    case 'Int32Array':
      return addVariable(arg, `new ${arg.constructor.name}(${JSON.stringify(Array.from(arg))})`);
    default:
      if (onUnrecognizedArgumentLookup) {
        const instantiationString = onUnrecognizedArgumentLookup(arg);
        if (instantiationString) {
          return instantiationString;
        }
      }
      throw new Error(`unrecognized argument type ${arg.constructor.name}`);
  }
}

function trackablePrimitive(value) {
  // wrapped in object, so track-able
  return new value.constructor(value);
}

if (typeof module !== 'undefined') {
  module.exports = { glWiretap, glExtensionWiretap };
}

if (typeof window !== 'undefined') {
  glWiretap.glExtensionWiretap = glExtensionWiretap;
  window.glWiretap = glWiretap;
}

},{}],8:[function(require,module,exports){
if (typeof WebGLRenderingContext !== 'undefined') {
  module.exports = require('./src/javascript/browser-index')
} else {
  module.exports = require('./src/javascript/node-index')
}

},{"./src/javascript/browser-index":10,"./src/javascript/node-index":19}],9:[function(require,module,exports){
module.exports={
  "name": "gl",
  "version": "4.4.0",
  "description": "Creates a WebGL context without a window",
  "main": "index.js",
  "directories": {
    "test": "test"
  },
  "browser": "browser_index.js",
  "engines": {
    "node": ">=8.0.0"
  },
  "scripts": {
    "test": "standard | snazzy && tape test/*.js | faucet",
    "rebuild": "node-gyp rebuild --verbose",
    "prebuild": "prebuild --all --strip",
    "install": "prebuild-install || node-gyp rebuild"
  },
  "dependencies": {
    "bindings": "^1.5.0",
    "bit-twiddle": "^1.0.2",
    "glsl-tokenizer": "^2.0.2",
    "nan": "^2.14.0",
    "node-gyp": "^4.0.0",
    "prebuild-install": "^5.1.0"
  },
  "devDependencies": {
    "angle-normals": "^1.0.0",
    "bunny": "^1.0.1",
    "faucet": "0.0.1",
    "gl-conformance": "^2.0.9",
    "prebuild": "^8.0.1",
    "snazzy": "^8.0.0",
    "standard": "^12.0.1",
    "tape": "^4.7.0"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/stackgl/headless-gl.git"
  },
  "keywords": [
    "webgl",
    "opengl",
    "gl",
    "headless",
    "server",
    "gpgpu"
  ],
  "author": "Mikola Lysenko",
  "license": "BSD-2-Clause",
  "gypfile": true
}

},{}],10:[function(require,module,exports){
function createContext (width, height, options) {
  width = width | 0
  height = height | 0
  if (!(width > 0 && height > 0)) {
    return null
  }

  const canvas = document.createElement('canvas')
  if (!canvas) {
    return null
  }
  let gl
  canvas.width = width
  canvas.height = height

  try {
    gl = canvas.getContext('webgl', options)
  } catch (e) {
    try {
      gl = canvas.getContext('experimental-webgl', options)
    } catch (e) {
      return null
    }
  }

  const _getExtension = gl.getExtension
  const extDestroy = {
    destroy: function () {
      const loseContext = _getExtension.call(gl, 'WEBGL_lose_context')
      if (loseContext) {
        loseContext.loseContext()
      }
    }
  }

  const extResize = {
    resize: function (w, h) {
      canvas.width = w
      canvas.height = h
    }
  }

  const _supportedExtensions = gl.getSupportedExtensions().slice()
  _supportedExtensions.push(
    'STACKGL_destroy_context',
    'STACKGL_resize_drawingbuffer')
  gl.getSupportedExtensions = function () {
    return _supportedExtensions.slice()
  }

  gl.getExtension = function (extName) {
    const name = extName.toLowerCase()
    if (name === 'stackgl_resize_drawingbuffer') {
      return extResize
    }
    if (name === 'stackgl_destroy_context') {
      return extDestroy
    }
    return _getExtension.call(gl, extName)
  }

  return gl || null
}

module.exports = createContext

},{}],11:[function(require,module,exports){
const { gl } = require('../native-gl')
const { vertexCount } = require('../utils')

class ANGLEInstancedArrays {
  constructor (ctx) {
    this.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = 0x88fe
    this.ctx = ctx

    this._drawArraysInstanced = gl._drawArraysInstanced.bind(ctx)
    this._drawElementsInstanced = gl._drawElementsInstanced.bind(ctx)
    this._vertexAttribDivisor = gl._vertexAttribDivisor.bind(ctx)
  }

  drawArraysInstancedANGLE (mode, first, count, primCount) {
    const { ctx } = this
    mode |= 0
    first |= 0
    count |= 0
    primCount |= 0
    if (first < 0 || count < 0 || primCount < 0) {
      ctx.setError(gl.INVALID_VALUE)
      return
    }
    if (!ctx._checkStencilState()) {
      return
    }
    const reducedCount = vertexCount(mode, count)
    if (reducedCount < 0) {
      ctx.setError(gl.INVALID_ENUM)
      return
    }
    if (!ctx._framebufferOk()) {
      return
    }
    if (count === 0 || primCount === 0) {
      return
    }
    let maxIndex = first
    if (count > 0) {
      maxIndex = (count + first - 1) >>> 0
    }
    if (this.checkInstancedVertexAttribState(maxIndex, primCount)) {
      return this._drawArraysInstanced(mode, first, reducedCount, primCount)
    }
  }

  drawElementsInstancedANGLE (mode, count, type, ioffset, primCount) {
    const { ctx } = this
    mode |= 0
    count |= 0
    type |= 0
    ioffset |= 0
    primCount |= 0

    if (count < 0 || ioffset < 0 || primCount < 0) {
      ctx.setError(gl.INVALID_VALUE)
      return
    }

    if (!ctx._checkStencilState()) {
      return
    }

    const elementBuffer = ctx._activeElementArrayBuffer
    if (!elementBuffer) {
      ctx.setError(gl.INVALID_OPERATION)
      return
    }

    // Unpack element data
    let elementData = null
    let offset = ioffset
    if (type === gl.UNSIGNED_SHORT) {
      if (offset % 2) {
        ctx.setError(gl.INVALID_OPERATION)
        return
      }
      offset >>= 1
      elementData = new Uint16Array(elementBuffer._elements.buffer)
    } else if (ctx._extensions.oes_element_index_uint && type === gl.UNSIGNED_INT) {
      if (offset % 4) {
        ctx.setError(gl.INVALID_OPERATION)
        return
      }
      offset >>= 2
      elementData = new Uint32Array(elementBuffer._elements.buffer)
    } else if (type === gl.UNSIGNED_BYTE) {
      elementData = elementBuffer._elements
    } else {
      ctx.setError(gl.INVALID_ENUM)
      return
    }

    let reducedCount = count
    switch (mode) {
      case gl.TRIANGLES:
        if (count % 3) {
          reducedCount -= (count % 3)
        }
        break
      case gl.LINES:
        if (count % 2) {
          reducedCount -= (count % 2)
        }
        break
      case gl.POINTS:
        break
      case gl.LINE_LOOP:
      case gl.LINE_STRIP:
        if (count < 2) {
          ctx.setError(gl.INVALID_OPERATION)
          return
        }
        break
      case gl.TRIANGLE_FAN:
      case gl.TRIANGLE_STRIP:
        if (count < 3) {
          ctx.setError(gl.INVALID_OPERATION)
          return
        }
        break
      default:
        ctx.setError(gl.INVALID_ENUM)
        return
    }

    if (!ctx._framebufferOk()) {
      return
    }

    if (count === 0 || primCount === 0) {
      this.checkInstancedVertexAttribState(0, 0)
      return
    }

    if ((count + offset) >>> 0 > elementData.length) {
      ctx.setError(gl.INVALID_OPERATION)
      return
    }

    // Compute max index
    let maxIndex = -1
    for (let i = offset; i < offset + count; ++i) {
      maxIndex = Math.max(maxIndex, elementData[i])
    }

    if (maxIndex < 0) {
      this.checkInstancedVertexAttribState(0, 0)
      return
    }

    if (this.checkInstancedVertexAttribState(maxIndex, primCount)) {
      if (reducedCount > 0) {
        this._drawElementsInstanced(mode, reducedCount, type, ioffset, primCount)
      }
    }
  }

  vertexAttribDivisorANGLE (index, divisor) {
    const { ctx } = this
    index |= 0
    divisor |= 0
    if (divisor < 0 ||
      index < 0 || index >= ctx._vertexAttribs.length) {
      ctx.setError(gl.INVALID_VALUE)
      return
    }
    const attrib = ctx._vertexAttribs[index]
    attrib._divisor = divisor
    this._vertexAttribDivisor(index, divisor)
  }

  checkInstancedVertexAttribState (maxIndex, primCount) {
    const { ctx } = this
    const program = ctx._activeProgram
    if (!program) {
      ctx.setError(gl.INVALID_OPERATION)
      return false
    }

    const attribs = ctx._vertexAttribs
    let hasZero = false
    for (let i = 0; i < attribs.length; ++i) {
      const attrib = attribs[i]
      if (attrib._isPointer) {
        const buffer = attrib._pointerBuffer
        if (program._attributes.indexOf(i) >= 0) {
          if (!buffer) {
            ctx.setError(gl.INVALID_OPERATION)
            return false
          }
          let maxByte = 0
          if (attrib._divisor === 0) {
            hasZero = true
            maxByte = attrib._pointerStride * maxIndex +
              attrib._pointerSize +
              attrib._pointerOffset
          } else {
            maxByte = attrib._pointerStride * (Math.ceil(primCount / attrib._divisor) - 1) +
              attrib._pointerSize +
              attrib._pointerOffset
          }
          if (maxByte > buffer._size) {
            ctx.setError(gl.INVALID_OPERATION)
            return false
          }
        }
      }
    }

    if (!hasZero) {
      ctx.setError(gl.INVALID_OPERATION)
      return false
    }

    return true
  }
}

function getANGLEInstancedArrays (ctx) {
  return new ANGLEInstancedArrays(ctx)
}

module.exports = { ANGLEInstancedArrays, getANGLEInstancedArrays }

},{"../native-gl":18,"../utils":20}],12:[function(require,module,exports){
class OESElementIndexUint {}

function getOESElementIndexUint (context) {
  let result = null
  const exts = context.getSupportedExtensions()

  if (exts && exts.indexOf('OES_element_index_uint') >= 0) {
    result = new OESElementIndexUint()
  }

  return result
}

module.exports = { getOESElementIndexUint, OESElementIndexUint }

},{}],13:[function(require,module,exports){
class OESTextureFloat {}

function getOESTextureFloat (context) {
  let result = null
  const exts = context.getSupportedExtensions()

  if (exts && exts.indexOf('OES_texture_float') >= 0) {
    result = new OESTextureFloat()
  }

  return result
}

module.exports = { getOESTextureFloat, OESTextureFloat }

},{}],14:[function(require,module,exports){
class STACKGLDestroyContext {
  constructor (ctx) {
    this.destroy = ctx.destroy.bind(ctx)
  }
}

function getSTACKGLDestroyContext (ctx) {
  return new STACKGLDestroyContext(ctx)
}

module.exports = { getSTACKGLDestroyContext, STACKGLDestroyContext }

},{}],15:[function(require,module,exports){
class STACKGLResizeDrawingBuffer {
  constructor (ctx) {
    this.resize = ctx.resize.bind(ctx)
  }
}

function getSTACKGLResizeDrawingBuffer (ctx) {
  return new STACKGLResizeDrawingBuffer(ctx)
}

module.exports = { getSTACKGLResizeDrawingBuffer, STACKGLResizeDrawingBuffer }

},{}],16:[function(require,module,exports){
const { gl } = require('../native-gl')

class WebGLDrawBuffers {
  constructor (ctx) {
    this.ctx = ctx
    const exts = ctx.getSupportedExtensions()

    if (exts && exts.indexOf('WEBGL_draw_buffers') >= 0) {
      Object.assign(this, ctx.extWEBGL_draw_buffers())
      this._buffersState = [ctx.BACK]
      this._maxDrawBuffers = ctx._getParameterDirect(this.MAX_DRAW_BUFFERS_WEBGL)
      this._ALL_ATTACHMENTS = []
      this._ALL_COLOR_ATTACHMENTS = []
      const allColorAttachments = [
        this.COLOR_ATTACHMENT0_WEBGL,
        this.COLOR_ATTACHMENT1_WEBGL,
        this.COLOR_ATTACHMENT2_WEBGL,
        this.COLOR_ATTACHMENT3_WEBGL,
        this.COLOR_ATTACHMENT4_WEBGL,
        this.COLOR_ATTACHMENT5_WEBGL,
        this.COLOR_ATTACHMENT6_WEBGL,
        this.COLOR_ATTACHMENT7_WEBGL,
        this.COLOR_ATTACHMENT8_WEBGL,
        this.COLOR_ATTACHMENT9_WEBGL,
        this.COLOR_ATTACHMENT10_WEBGL,
        this.COLOR_ATTACHMENT11_WEBGL,
        this.COLOR_ATTACHMENT12_WEBGL,
        this.COLOR_ATTACHMENT13_WEBGL,
        this.COLOR_ATTACHMENT14_WEBGL,
        this.COLOR_ATTACHMENT15_WEBGL
      ]
      while (this._ALL_ATTACHMENTS.length < this._maxDrawBuffers) {
        const colorAttachment = allColorAttachments.shift()
        this._ALL_ATTACHMENTS.push(colorAttachment)
        this._ALL_COLOR_ATTACHMENTS.push(colorAttachment)
      }
      this._ALL_ATTACHMENTS.push(
        gl.DEPTH_ATTACHMENT,
        gl.STENCIL_ATTACHMENT,
        gl.DEPTH_STENCIL_ATTACHMENT
      )
    }
  }

  drawBuffersWEBGL (buffers) {
    const { ctx } = this
    if (buffers.length < 1) {
      ctx.setError(gl.INVALID_OPERATION)
      return
    }
    if (buffers.length === 1 && buffers[0] === gl.BACK) {
      this._buffersState = buffers
      ctx.drawBuffersWEBGL([this.COLOR_ATTACHMENT0_WEBGL])
      return
    } else if (!ctx._activeFramebuffer) {
      if (buffers.length > 1) {
        ctx.setError(gl.INVALID_OPERATION)
        return
      }
      for (let i = 0; i < buffers.length; i++) {
        if (buffers[i] > gl.NONE) {
          ctx.setError(gl.INVALID_OPERATION)
          return
        }
      }
    }
    this._buffersState = buffers
    ctx.drawBuffersWEBGL(buffers)
  }
}

function getWebGLDrawBuffers (ctx) {
  const exts = ctx.getSupportedExtensions()

  if (exts && exts.indexOf('WEBGL_draw_buffers') >= 0) {
    return new WebGLDrawBuffers(ctx)
  } else {
    return null
  }
}

module.exports = {
  getWebGLDrawBuffers,
  WebGLDrawBuffers
}

},{"../native-gl":18}],17:[function(require,module,exports){
class Linkable {
  constructor (_) {
    this._ = _
    this._references = []
    this._refCount = 0
    this._pendingDelete = false
    this._binding = 0
  }

  _link (b) {
    this._references.push(b)
    b._refCount += 1
    return true
  }

  _unlink (b) {
    let idx = this._references.indexOf(b)
    if (idx < 0) {
      return false
    }
    while (idx >= 0) {
      this._references[idx] = this._references[this._references.length - 1]
      this._references.pop()
      b._refCount -= 1
      b._checkDelete()
      idx = this._references.indexOf(b)
    }
    return true
  }

  _linked (b) {
    return this._references.indexOf(b) >= 0
  }

  _checkDelete () {
    if (this._refCount <= 0 &&
      this._pendingDelete &&
      this._ !== 0) {
      while (this._references.length > 0) {
        this._unlink(this._references[0])
      }
      this._performDelete()
      this._ = 0
    }
  }

  _performDelete () {}
}

module.exports = { Linkable }

},{}],18:[function(require,module,exports){
(function (process){
const NativeWebGL = require('bindings')('webgl')
const { WebGLRenderingContext: NativeWebGLRenderingContext } = NativeWebGL
process.on('exit', NativeWebGL.cleanup)

const gl = NativeWebGLRenderingContext.prototype

// from binding.gyp
delete gl['1.0.0']

// from binding.gyp
delete NativeWebGLRenderingContext['1.0.0']

module.exports = { gl, NativeWebGL, NativeWebGLRenderingContext }

}).call(this,require('_process'))
},{"_process":154,"bindings":2}],19:[function(require,module,exports){
const bits = require('bit-twiddle')
const { WebGLContextAttributes } = require('./webgl-context-attributes')
const { WebGLRenderingContext, wrapContext } = require('./webgl-rendering-context')
const { WebGLTextureUnit } = require('./webgl-texture-unit')
const { WebGLVertexAttribute } = require('./webgl-vertex-attribute')

let CONTEXT_COUNTER = 0

function flag (options, name, dflt) {
  if (!options || !(typeof options === 'object') || !(name in options)) {
    return dflt
  }
  return !!options[name]
}

function createContext (width, height, options) {
  width = width | 0
  height = height | 0
  if (!(width > 0 && height > 0)) {
    return null
  }

  const contextAttributes = new WebGLContextAttributes(
    flag(options, 'alpha', true),
    flag(options, 'depth', true),
    flag(options, 'stencil', false),
    false, // flag(options, 'antialias', true),
    flag(options, 'premultipliedAlpha', true),
    flag(options, 'preserveDrawingBuffer', false),
    flag(options, 'preferLowPowerToHighPerformance', false),
    flag(options, 'failIfMajorPerformanceCaveat', false))

  // Can only use premultipliedAlpha if alpha is set
  contextAttributes.premultipliedAlpha =
    contextAttributes.premultipliedAlpha && contextAttributes.alpha

  let ctx
  try {
    ctx = new WebGLRenderingContext(
      1,
      1,
      contextAttributes.alpha,
      contextAttributes.depth,
      contextAttributes.stencil,
      contextAttributes.antialias,
      contextAttributes.premultipliedAlpha,
      contextAttributes.preserveDrawingBuffer,
      contextAttributes.preferLowPowerToHighPerformance,
      contextAttributes.failIfMajorPerformanceCaveat)
  } catch (e) {}
  if (!ctx) {
    return null
  }

  ctx.drawingBufferWidth = width
  ctx.drawingBufferHeight = height

  ctx._ = CONTEXT_COUNTER++

  ctx._contextAttributes = contextAttributes

  ctx._extensions = {}
  ctx._programs = {}
  ctx._shaders = {}
  ctx._buffers = {}
  ctx._textures = {}
  ctx._framebuffers = {}
  ctx._renderbuffers = {}

  ctx._activeProgram = null
  ctx._activeFramebuffer = null
  ctx._activeArrayBuffer = null
  ctx._activeElementArrayBuffer = null
  ctx._activeRenderbuffer = null

  // Initialize texture units
  const numTextures = ctx.getParameter(ctx.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
  ctx._textureUnits = new Array(numTextures)
  for (let i = 0; i < numTextures; ++i) {
    ctx._textureUnits[i] = new WebGLTextureUnit(i)
  }
  ctx._activeTextureUnit = 0
  ctx.activeTexture(ctx.TEXTURE0)

  ctx._errorStack = []

  // Initialize vertex attributes
  const numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS)
  ctx._vertexAttribs = new Array(numAttribs)
  for (let i = 0; i < numAttribs; ++i) {
    ctx._vertexAttribs[i] = new WebGLVertexAttribute(ctx, i)
  }

  // Store limits
  ctx._maxTextureSize = ctx.getParameter(ctx.MAX_TEXTURE_SIZE)
  ctx._maxTextureLevel = bits.log2(bits.nextPow2(ctx._maxTextureSize))
  ctx._maxCubeMapSize = ctx.getParameter(ctx.MAX_CUBE_MAP_TEXTURE_SIZE)
  ctx._maxCubeMapLevel = bits.log2(bits.nextPow2(ctx._maxCubeMapSize))

  // Unpack alignment
  ctx._unpackAlignment = 4
  ctx._packAlignment = 4

  // Allocate framebuffer
  ctx._allocateDrawingBuffer(width, height)

  const attrib0Buffer = ctx.createBuffer()
  ctx._attrib0Buffer = attrib0Buffer

  // Initialize defaults
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null)
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null)
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null)
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null)

  // Set viewport and scissor
  ctx.viewport(0, 0, width, height)
  ctx.scissor(0, 0, width, height)

  // Clear buffers
  ctx.clearDepth(1)
  ctx.clearColor(0, 0, 0, 0)
  ctx.clearStencil(0)
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT)

  return wrapContext(ctx)
}

module.exports = createContext

},{"./webgl-context-attributes":23,"./webgl-rendering-context":28,"./webgl-texture-unit":31,"./webgl-vertex-attribute":34,"bit-twiddle":3}],20:[function(require,module,exports){
(function (Buffer){
const { gl } = require('./native-gl')

const { WebGLUniformLocation } = require('./webgl-uniform-location')

function bindPublics (props, wrapper, privateInstance, privateMethods) {
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    const value = privateInstance[prop]
    if (typeof value === 'function') {
      if (privateMethods.indexOf(prop) === -1) {
        wrapper[prop] = value.bind(privateInstance)
      }
    } else {
      if (prop[0] === '_' ||
        prop[0] === '0' ||
        prop[0] === '1') {
        continue
      }
      wrapper[prop] = value
    }
  }
}

function checkObject (object) {
  return typeof object === 'object' ||
    (object === void 0)
}

function checkUniform (program, location) {
  return location instanceof WebGLUniformLocation &&
    location._program === program &&
    location._linkCount === program._linkCount
}

function isTypedArray (data) {
  return data instanceof Uint8Array ||
    data instanceof Uint8ClampedArray ||
    data instanceof Int8Array ||
    data instanceof Uint16Array ||
    data instanceof Int16Array ||
    data instanceof Uint32Array ||
    data instanceof Int32Array ||
    data instanceof Float32Array ||
    data instanceof Float64Array
}

// Don't allow: ", $, `, @, \, ', \0
function isValidString (str) {
  // Remove comments first
  const c = str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '')
  return !(/["$`@\\'\0]/.test(c))
}

function vertexCount (primitive, count) {
  switch (primitive) {
    case gl.TRIANGLES:
      return count - (count % 3)
    case gl.LINES:
      return count - (count % 2)
    case gl.LINE_LOOP:
    case gl.POINTS:
      return count
    case gl.TRIANGLE_FAN:
    case gl.LINE_STRIP:
      if (count < 2) {
        return 0
      }
      return count
    case gl.TRIANGLE_STRIP:
      if (count < 3) {
        return 0
      }
      return count
    default:
      return -1
  }
}

function typeSize (type) {
  switch (type) {
    case gl.UNSIGNED_BYTE:
    case gl.BYTE:
      return 1
    case gl.UNSIGNED_SHORT:
    case gl.SHORT:
      return 2
    case gl.UNSIGNED_INT:
    case gl.INT:
    case gl.FLOAT:
      return 4
  }
  return 0
}

function uniformTypeSize (type) {
  switch (type) {
    case gl.BOOL_VEC4:
    case gl.INT_VEC4:
    case gl.FLOAT_VEC4:
      return 4

    case gl.BOOL_VEC3:
    case gl.INT_VEC3:
    case gl.FLOAT_VEC3:
      return 3

    case gl.BOOL_VEC2:
    case gl.INT_VEC2:
    case gl.FLOAT_VEC2:
      return 2

    case gl.BOOL:
    case gl.INT:
    case gl.FLOAT:
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      return 1

    default:
      return 0
  }
}

function unpackTypedArray (array) {
  return (new Uint8Array(array.buffer)).subarray(
    array.byteOffset,
    array.byteLength + array.byteOffset)
}

function extractImageData (pixels) {
  if (typeof pixels === 'object' && typeof pixels.width !== 'undefined' && typeof pixels.height !== 'undefined') {
    if (typeof pixels.data !== 'undefined') {
      return pixels
    }

    let context = null

    if (typeof pixels.getContext === 'function') {
      context = pixels.getContext('2d')
    } else if (typeof pixels.src !== 'undefined' && typeof document === 'object' && typeof document.createElement === 'function') {
      const canvas = document.createElement('canvas')

      if (typeof canvas === 'object' && typeof canvas.getContext === 'function') {
        context = canvas.getContext('2d')

        if (context !== null) {
          context.drawImage(pixels, 0, 0)
        }
      }
    }

    if (context !== null) {
      return context.getImageData(0, 0, pixels.width, pixels.height)
    }
  }

  return null
}

function formatSize (internalFormat) {
  switch (internalFormat) {
    case gl.ALPHA:
    case gl.LUMINANCE:
      return 1
    case gl.LUMINANCE_ALPHA:
      return 2
    case gl.RGB:
      return 3
    case gl.RGBA:
      return 4
  }
  return 0
}

function convertPixels (pixels) {
  if (typeof pixels === 'object' && pixels !== null) {
    if (pixels instanceof ArrayBuffer) {
      return new Uint8Array(pixels)
    } else if (pixels instanceof Uint8Array ||
      pixels instanceof Uint16Array ||
      pixels instanceof Uint8ClampedArray ||
      pixels instanceof Float32Array) {
      return unpackTypedArray(pixels)
    } else if (pixels instanceof Buffer) {
      return new Uint8Array(pixels)
    }
  }
  return null
}

function checkFormat (format) {
  return (
    format === gl.ALPHA ||
    format === gl.LUMINANCE_ALPHA ||
    format === gl.LUMINANCE ||
    format === gl.RGB ||
    format === gl.RGBA)
}

function validCubeTarget (target) {
  return target === gl.TEXTURE_CUBE_MAP_POSITIVE_X ||
    target === gl.TEXTURE_CUBE_MAP_NEGATIVE_X ||
    target === gl.TEXTURE_CUBE_MAP_POSITIVE_Y ||
    target === gl.TEXTURE_CUBE_MAP_NEGATIVE_Y ||
    target === gl.TEXTURE_CUBE_MAP_POSITIVE_Z ||
    target === gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
}

module.exports = {
  bindPublics,
  checkObject,
  isTypedArray,
  isValidString,
  vertexCount,
  typeSize,
  uniformTypeSize,
  unpackTypedArray,
  extractImageData,
  formatSize,
  checkFormat,
  checkUniform,
  convertPixels,
  validCubeTarget
}

}).call(this,require("buffer").Buffer)
},{"./native-gl":18,"./webgl-uniform-location":33,"buffer":5}],21:[function(require,module,exports){
class WebGLActiveInfo {
  constructor (_) {
    this.size = _.size
    this.type = _.type
    this.name = _.name
  }
}
module.exports = { WebGLActiveInfo }

},{}],22:[function(require,module,exports){
const { Linkable } = require('./linkable')
const { gl } = require('./native-gl')

class WebGLBuffer extends Linkable {
  constructor (_, ctx) {
    super(_)
    this._ctx = ctx
    this._size = 0
    this._elements = new Uint8Array(0)
  }

  _performDelete () {
    const ctx = this._ctx
    delete ctx._buffers[this._ | 0]
    gl.deleteBuffer.call(ctx, this._ | 0)
  }
}

module.exports = { WebGLBuffer }

},{"./linkable":17,"./native-gl":18}],23:[function(require,module,exports){
class WebGLContextAttributes {
  constructor (
    alpha,
    depth,
    stencil,
    antialias,
    premultipliedAlpha,
    preserveDrawingBuffer,
    preferLowPowerToHighPerformance,
    failIfMajorPerformanceCaveat) {
    this.alpha = alpha
    this.depth = depth
    this.stencil = stencil
    this.antialias = antialias
    this.premultipliedAlpha = premultipliedAlpha
    this.preserveDrawingBuffer = preserveDrawingBuffer
    this.preferLowPowerToHighPerformance = preferLowPowerToHighPerformance
    this.failIfMajorPerformanceCaveat = failIfMajorPerformanceCaveat
  }
}

module.exports = { WebGLContextAttributes }

},{}],24:[function(require,module,exports){
class WebGLDrawingBufferWrapper {
  constructor (framebuffer, color, depthStencil) {
    this._framebuffer = framebuffer
    this._color = color
    this._depthStencil = depthStencil
  }
}

module.exports = { WebGLDrawingBufferWrapper }

},{}],25:[function(require,module,exports){
const { Linkable } = require('./linkable')
const { gl } = require('./native-gl')

class WebGLFramebuffer extends Linkable {
  constructor (_, ctx) {
    super(_)
    this._ctx = ctx
    this._binding = 0

    this._width = 0
    this._height = 0
    this._status = null

    this._attachments = {}
    this._attachments[gl.COLOR_ATTACHMENT0] = null
    this._attachments[gl.DEPTH_ATTACHMENT] = null
    this._attachments[gl.STENCIL_ATTACHMENT] = null
    this._attachments[gl.DEPTH_STENCIL_ATTACHMENT] = null

    this._attachmentLevel = {}
    this._attachmentLevel[gl.COLOR_ATTACHMENT0] = 0
    this._attachmentLevel[gl.DEPTH_ATTACHMENT] = 0
    this._attachmentLevel[gl.STENCIL_ATTACHMENT] = 0
    this._attachmentLevel[gl.DEPTH_STENCIL_ATTACHMENT] = 0

    this._attachmentFace = {}
    this._attachmentFace[gl.COLOR_ATTACHMENT0] = 0
    this._attachmentFace[gl.DEPTH_ATTACHMENT] = 0
    this._attachmentFace[gl.STENCIL_ATTACHMENT] = 0
    this._attachmentFace[gl.DEPTH_STENCIL_ATTACHMENT] = 0

    if (ctx._extensions.webgl_draw_buffers) {
      const { webgl_draw_buffers } = ctx._extensions // eslint-disable-line
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT1_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT2_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT3_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT4_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT5_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT6_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT7_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT8_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT9_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT10_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT11_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT12_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT13_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT14_WEBGL] = null
      this._attachments[webgl_draw_buffers.COLOR_ATTACHMENT15_WEBGL] = null
      this._attachments[gl.NONE] = null
      this._attachments[gl.BACK] = null

      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT1_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT2_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT3_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT4_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT5_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT6_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT7_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT8_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT9_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT10_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT11_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT12_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT13_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT14_WEBGL] = 0
      this._attachmentLevel[webgl_draw_buffers.COLOR_ATTACHMENT15_WEBGL] = 0
      this._attachmentLevel[gl.NONE] = null
      this._attachmentLevel[gl.BACK] = null

      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT1_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT2_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT3_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT4_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT5_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT6_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT7_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT8_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT9_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT10_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT11_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT12_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT13_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT14_WEBGL] = 0
      this._attachmentFace[webgl_draw_buffers.COLOR_ATTACHMENT15_WEBGL] = 0
      this._attachmentFace[gl.NONE] = null
      this._attachmentFace[gl.BACK] = null
    }
  }

  _clearAttachment (attachment) {
    const object = this._attachments[attachment]
    if (!object) {
      return
    }
    this._attachments[attachment] = null
    this._unlink(object)
  }

  _setAttachment (object, attachment) {
    const prevObject = this._attachments[attachment]
    if (prevObject === object) {
      return
    }

    this._clearAttachment(attachment)
    if (!object) {
      return
    }

    this._attachments[attachment] = object

    this._link(object)
  }

  _performDelete () {
    const ctx = this._ctx
    delete ctx._framebuffers[this._ | 0]
    gl.deleteFramebuffer.call(ctx, this._ | 0)
  }
}

module.exports = { WebGLFramebuffer }

},{"./linkable":17,"./native-gl":18}],26:[function(require,module,exports){
const { Linkable } = require('./linkable')
const { gl } = require('./native-gl')

class WebGLProgram extends Linkable {
  constructor (_, ctx) {
    super(_)
    this._ctx = ctx
    this._linkCount = 0
    this._linkStatus = false
    this._linkInfoLog = 'not linked'
    this._attributes = []
    this._uniforms = []
  }

  _performDelete () {
    const ctx = this._ctx
    delete ctx._programs[this._ | 0]
    gl.deleteProgram.call(ctx, this._ | 0)
  }
}

module.exports = { WebGLProgram }

},{"./linkable":17,"./native-gl":18}],27:[function(require,module,exports){
const { Linkable } = require('./linkable')
const { gl } = require('./native-gl')

class WebGLRenderbuffer extends Linkable {
  constructor (_, ctx) {
    super(_)
    this._ctx = ctx
    this._binding = 0
    this._width = 0
    this._height = 0
    this._format = 0
  }

  _performDelete () {
    const ctx = this._ctx
    delete ctx._renderbuffers[this._ | 0]
    gl.deleteRenderbuffer.call(ctx, this._ | 0)
  }
}

module.exports = { WebGLRenderbuffer }

},{"./linkable":17,"./native-gl":18}],28:[function(require,module,exports){
const bits = require('bit-twiddle')
const tokenize = require('glsl-tokenizer/string')
const HEADLESS_VERSION = require('../../package.json').version
const { gl, NativeWebGLRenderingContext, NativeWebGL } = require('./native-gl')
const { getANGLEInstancedArrays } = require('./extensions/angle-instanced-arrays')
const { getOESElementIndexUint } = require('./extensions/oes-element-index-unit')
const { getOESTextureFloat } = require('./extensions/oes-texture-float')
const { getSTACKGLDestroyContext } = require('./extensions/stackgl-destroy-context')
const { getSTACKGLResizeDrawingBuffer } = require('./extensions/stackgl-resize-drawing-buffer')
const { getWebGLDrawBuffers } = require('./extensions/webgl-draw-buffers')
const {
  bindPublics,
  checkObject,
  checkUniform,
  formatSize,
  isValidString,
  typeSize,
  uniformTypeSize,
  extractImageData,
  vertexCount,
  isTypedArray,
  unpackTypedArray,
  convertPixels,
  checkFormat,
  validCubeTarget } = require('./utils')

const { WebGLActiveInfo } = require('./webgl-active-info')
const { WebGLFramebuffer } = require('./webgl-framebuffer')
const { WebGLBuffer } = require('./webgl-buffer')
const { WebGLDrawingBufferWrapper } = require('./webgl-drawing-buffer-wrapper')
const { WebGLProgram } = require('./webgl-program')
const { WebGLRenderbuffer } = require('./webgl-renderbuffer')
const { WebGLShader } = require('./webgl-shader')
const { WebGLShaderPrecisionFormat } = require('./webgl-shader-precision-format')
const { WebGLTexture } = require('./webgl-texture')
const { WebGLUniformLocation } = require('./webgl-uniform-location')

// These are defined by the WebGL spec
const MAX_UNIFORM_LENGTH = 256
const MAX_ATTRIBUTE_LENGTH = 256

const DEFAULT_ATTACHMENTS = [
  gl.COLOR_ATTACHMENT0,
  gl.DEPTH_ATTACHMENT,
  gl.STENCIL_ATTACHMENT,
  gl.DEPTH_STENCIL_ATTACHMENT
]

const DEFAULT_COLOR_ATTACHMENTS = [gl.COLOR_ATTACHMENT0]

const availableExtensions = {
  angle_instanced_arrays: getANGLEInstancedArrays,
  oes_element_index_uint: getOESElementIndexUint,
  oes_texture_float: getOESTextureFloat,
  stackgl_destroy_context: getSTACKGLDestroyContext,
  stackgl_resize_drawingbuffer: getSTACKGLResizeDrawingBuffer,
  webgl_draw_buffers: getWebGLDrawBuffers
}

const privateMethods = [
  'resize',
  'destroy'
]

function wrapContext (ctx) {
  const wrapper = new WebGLRenderingContext()
  bindPublics(Object.keys(ctx), wrapper, ctx, privateMethods)
  bindPublics(Object.keys(ctx.constructor.prototype), wrapper, ctx, privateMethods)
  bindPublics(Object.getOwnPropertyNames(ctx), wrapper, ctx, privateMethods)
  bindPublics(Object.getOwnPropertyNames(ctx.constructor.prototype), wrapper, ctx, privateMethods)

  Object.defineProperties(wrapper, {
    drawingBufferWidth: {
      get () { return ctx.drawingBufferWidth },
      set (value) { ctx.drawingBufferWidth = value }
    },
    drawingBufferHeight: {
      get () { return ctx.drawingBufferHeight },
      set (value) { ctx.drawingBufferHeight = value }
    }
  })

  return wrapper
}

// We need to wrap some of the native WebGL functions to handle certain error codes and check input values
class WebGLRenderingContext extends NativeWebGLRenderingContext {
  _checkDimensions (
    target,
    width,
    height,
    level) {
    if (level < 0 ||
      width < 0 ||
      height < 0) {
      this.setError(gl.INVALID_VALUE)
      return false
    }
    if (target === gl.TEXTURE_2D) {
      if (width > this._maxTextureSize ||
        height > this._maxTextureSize ||
        level > this._maxTextureLevel) {
        this.setError(gl.INVALID_VALUE)
        return false
      }
    } else if (this._validCubeTarget(target)) {
      if (width > this._maxCubeMapSize ||
        height > this._maxCubeMapSize ||
        level > this._maxCubeMapLevel) {
        this.setError(gl.INVALID_VALUE)
        return false
      }
    } else {
      this.setError(gl.INVALID_ENUM)
      return false
    }
    return true
  }

  _checkLocation (location) {
    if (!(location instanceof WebGLUniformLocation)) {
      this.setError(gl.INVALID_VALUE)
      return false
    } else if (location._program._ctx !== this ||
      location._linkCount !== location._program._linkCount) {
      this.setError(gl.INVALID_OPERATION)
      return false
    }
    return true
  }

  _checkLocationActive (location) {
    if (!location) {
      return false
    } else if (!this._checkLocation(location)) {
      return false
    } else if (location._program !== this._activeProgram) {
      this.setError(gl.INVALID_OPERATION)
      return false
    }
    return true
  }

  _checkOwns (object) {
    return typeof object === 'object' &&
      object._ctx === this
  }

  _checkShaderSource (shader) {
    const source = shader._source
    const tokens = tokenize(source)

    let errorStatus = false
    const errorLog = []

    for (let i = 0; i < tokens.length; ++i) {
      const tok = tokens[i]
      switch (tok.type) {
        case 'ident':
          if (!this._validGLSLIdentifier(tok.data)) {
            errorStatus = true
            errorLog.push(tok.line + ':' + tok.column +
              ' invalid identifier - ' + tok.data)
          }
          break
        case 'preprocessor':
          const bodyToks = tokenize(tok.data.match(/^\s*#\s*(.*)$/)[1])
          for (let j = 0; j < bodyToks.length; ++j) {
            const btok = bodyToks[j]
            if (btok.type === 'ident' || btok.type === void 0) {
              if (!this._validGLSLIdentifier(btok.data)) {
                errorStatus = true
                errorLog.push(tok.line + ':' + btok.column +
                  ' invalid identifier - ' + btok.data)
              }
            }
          }
          break
        case 'keyword':
          switch (tok.data) {
            case 'do':
              errorStatus = true
              errorLog.push(tok.line + ':' + tok.column + ' do not supported')
              break
          }
          break
      }
    }

    if (errorStatus) {
      shader._compileInfo = errorLog.join('\n')
    }
    return !errorStatus
  }

  _checkStencilState () {
    if (this.getParameter(gl.STENCIL_WRITEMASK) !==
      this.getParameter(gl.STENCIL_BACK_WRITEMASK) ||
      this.getParameter(gl.STENCIL_VALUE_MASK) !==
      this.getParameter(gl.STENCIL_BACK_VALUE_MASK) ||
      this.getParameter(gl.STENCIL_REF) !==
      this.getParameter(gl.STENCIL_BACK_REF)) {
      this.setError(gl.INVALID_OPERATION)
      return false
    }
    return true
  }

  _checkTextureTarget (target) {
    const unit = this._getActiveTextureUnit()
    let tex = null
    if (target === gl.TEXTURE_2D) {
      tex = unit._bind2D
    } else if (target === gl.TEXTURE_CUBE_MAP) {
      tex = unit._bindCube
    } else {
      this.setError(gl.INVALID_ENUM)
      return false
    }
    if (!tex) {
      this.setError(gl.INVALID_OPERATION)
      return false
    }
    return true
  }

  _checkWrapper (object, Wrapper) {
    if (!this._checkValid(object, Wrapper)) {
      this.setError(gl.INVALID_VALUE)
      return false
    } else if (!this._checkOwns(object)) {
      this.setError(gl.INVALID_OPERATION)
      return false
    }
    return true
  }

  _checkValid (object, Type) {
    return object instanceof Type && object._ !== 0
  }

  _checkVertexAttribState (maxIndex) {
    const program = this._activeProgram
    if (!program) {
      this.setError(gl.INVALID_OPERATION)
      return false
    }
    const attribs = this._vertexAttribs
    for (let i = 0; i < attribs.length; ++i) {
      const attrib = attribs[i]
      if (attrib._isPointer) {
        const buffer = attrib._pointerBuffer
        if (!buffer) {
          this.setError(gl.INVALID_OPERATION)
          return false
        }
        if (program._attributes.indexOf(i) >= 0) {
          let maxByte = 0
          if (attrib._divisor) {
            maxByte = attrib._pointerSize +
              attrib._pointerOffset
          } else {
            maxByte = attrib._pointerStride * maxIndex +
              attrib._pointerSize +
              attrib._pointerOffset
          }
          if (maxByte > buffer._size) {
            this.setError(gl.INVALID_OPERATION)
            return false
          }
        }
      }
    }
    return true
  }

  _checkVertexIndex (index) {
    if (index < 0 || index >= this._vertexAttribs.length) {
      this.setError(gl.INVALID_VALUE)
      return false
    }
    return true
  }

  _computePixelSize (type, internalFormat) {
    const pixelSize = formatSize(internalFormat)
    if (pixelSize === 0) {
      this.setError(gl.INVALID_ENUM)
      return 0
    }
    switch (type) {
      case gl.UNSIGNED_BYTE:
        return pixelSize
      case gl.UNSIGNED_SHORT_5_6_5:
        if (internalFormat !== gl.RGB) {
          this.setError(gl.INVALID_OPERATION)
          break
        }
        return 2
      case gl.UNSIGNED_SHORT_4_4_4_4:
      case gl.UNSIGNED_SHORT_5_5_5_1:
        if (internalFormat !== gl.RGBA) {
          this.setError(gl.INVALID_OPERATION)
          break
        }
        return 2
      case gl.FLOAT:
        return 1
    }
    this.setError(gl.INVALID_ENUM)
    return 0
  }

  _computeRowStride (width, pixelSize) {
    let rowStride = width * pixelSize
    if (rowStride % this._unpackAlignment) {
      rowStride += this._unpackAlignment - (rowStride % this._unpackAlignment)
    }
    return rowStride
  }

  _fixupLink (program) {
    if (!super.getProgramParameter(program._, gl.LINK_STATUS)) {
      program._linkInfoLog = super.getProgramInfoLog(program)
      return false
    }

    // Record attribute attributeLocations
    const numAttribs = this.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    const names = new Array(numAttribs)
    program._attributes.length = numAttribs
    for (let i = 0; i < numAttribs; ++i) {
      names[i] = this.getActiveAttrib(program, i).name
      program._attributes[i] = this.getAttribLocation(program, names[i]) | 0
    }

    // Check attribute names
    for (let i = 0; i < names.length; ++i) {
      if (names[i].length > MAX_ATTRIBUTE_LENGTH) {
        program._linkInfoLog = 'attribute ' + names[i] + ' is too long'
        return false
      }
    }

    for (let i = 0; i < numAttribs; ++i) {
      super.bindAttribLocation(
        program._ | 0,
        program._attributes[i],
        names[i])
    }

    super.linkProgram(program._ | 0)

    const numUniforms = this.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    program._uniforms.length = numUniforms
    for (let i = 0; i < numUniforms; ++i) {
      program._uniforms[i] = this.getActiveUniform(program, i)
    }

    // Check attribute and uniform name lengths
    for (let i = 0; i < program._uniforms.length; ++i) {
      if (program._uniforms[i].name.length > MAX_UNIFORM_LENGTH) {
        program._linkInfoLog = 'uniform ' + program._uniforms[i].name + ' is too long'
        return false
      }
    }

    program._linkInfoLog = ''
    return true
  }

  _framebufferOk () {
    const framebuffer = this._activeFramebuffer
    if (framebuffer &&
      this._preCheckFramebufferStatus(framebuffer) !== gl.FRAMEBUFFER_COMPLETE) {
      this.setError(gl.INVALID_FRAMEBUFFER_OPERATION)
      return false
    }
    return true
  }

  _getActiveBuffer (target) {
    if (target === gl.ARRAY_BUFFER) {
      return this._activeArrayBuffer
    } else if (target === gl.ELEMENT_ARRAY_BUFFER) {
      return this._activeElementArrayBuffer
    }
    return null
  }

  _getActiveTextureUnit () {
    return this._textureUnits[this._activeTextureUnit]
  }

  _getActiveTexture (target) {
    const activeUnit = this._getActiveTextureUnit()
    if (target === gl.TEXTURE_2D) {
      return activeUnit._bind2D
    } else if (target === gl.TEXTURE_CUBE_MAP) {
      return activeUnit._bindCube
    }
    return null
  }

  _getAttachments () {
    return this._extensions.webgl_draw_buffers ? this._extensions.webgl_draw_buffers._ALL_ATTACHMENTS : DEFAULT_ATTACHMENTS
  }

  _getColorAttachments () {
    return this._extensions.webgl_draw_buffers ? this._extensions.webgl_draw_buffers._ALL_COLOR_ATTACHMENTS : DEFAULT_COLOR_ATTACHMENTS
  }

  _getParameterDirect (pname) {
    return super.getParameter(pname)
  }

  _getTexImage (target) {
    const unit = this._getActiveTextureUnit()
    if (target === gl.TEXTURE_2D) {
      return unit._bind2D
    } else if (validCubeTarget(target)) {
      return unit._bindCube
    }
    this.setError(gl.INVALID_ENUM)
    return null
  }

  _preCheckFramebufferStatus (framebuffer) {
    const attachments = framebuffer._attachments
    const width = []
    const height = []
    const depthAttachment = attachments[gl.DEPTH_ATTACHMENT]
    const depthStencilAttachment = attachments[gl.DEPTH_STENCIL_ATTACHMENT]
    const stencilAttachment = attachments[gl.STENCIL_ATTACHMENT]

    if ((depthStencilAttachment && (stencilAttachment || depthAttachment)) ||
      (stencilAttachment && depthAttachment)) {
      return gl.FRAMEBUFFER_UNSUPPORTED
    }

    const colorAttachments = this._getColorAttachments()
    let colorAttachmentCount = 0
    for (const attachmentEnum in attachments) {
      if (attachments[attachmentEnum] && colorAttachments.indexOf(attachmentEnum * 1) !== -1) {
        colorAttachmentCount++
      }
    }
    if (colorAttachmentCount === 0) {
      return gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT
    }

    if (depthStencilAttachment instanceof WebGLTexture) {
      return gl.FRAMEBUFFER_UNSUPPORTED
    } else if (depthStencilAttachment instanceof WebGLRenderbuffer) {
      if (depthStencilAttachment._format !== gl.DEPTH_STENCIL) {
        return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
      }
      width.push(depthStencilAttachment._width)
      height.push(depthStencilAttachment._height)
    }

    if (depthAttachment instanceof WebGLTexture) {
      return gl.FRAMEBUFFER_UNSUPPORTED
    } else if (depthAttachment instanceof WebGLRenderbuffer) {
      if (depthAttachment._format !== gl.DEPTH_COMPONENT16) {
        return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
      }
      width.push(depthAttachment._width)
      height.push(depthAttachment._height)
    }

    if (stencilAttachment instanceof WebGLTexture) {
      return gl.FRAMEBUFFER_UNSUPPORTED
    } else if (stencilAttachment instanceof WebGLRenderbuffer) {
      if (stencilAttachment._format !== gl.STENCIL_INDEX8) {
        return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
      }
      width.push(stencilAttachment._width)
      height.push(stencilAttachment._height)
    }

    let colorAttached = false
    for (let i = 0; i < colorAttachments.length; ++i) {
      const colorAttachment = attachments[colorAttachments[i]]
      if (colorAttachment instanceof WebGLTexture) {
        if (colorAttachment._format !== gl.RGBA ||
          !(colorAttachment._type === gl.UNSIGNED_BYTE || colorAttachment._type === gl.FLOAT)) {
          return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
        }
        colorAttached = true
        const level = framebuffer._attachmentLevel[gl.COLOR_ATTACHMENT0]
        width.push(colorAttachment._levelWidth[level])
        height.push(colorAttachment._levelHeight[level])
      } else if (colorAttachment instanceof WebGLRenderbuffer) {
        const format = colorAttachment._format
        if (format !== gl.RGBA4 &&
          format !== gl.RGB565 &&
          format !== gl.RGB5_A1) {
          return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
        }
        colorAttached = true
        width.push(colorAttachment._width)
        height.push(colorAttachment._height)
      }
    }

    if (!colorAttached &&
      !stencilAttachment &&
      !depthAttachment &&
      !depthStencilAttachment) {
      return gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT
    }

    if (width.length <= 0 || height.length <= 0) {
      return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
    }

    for (let i = 1; i < width.length; ++i) {
      if (width[i - 1] !== width[i] ||
        height[i - 1] !== height[i]) {
        return gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS
      }
    }

    if (width[0] === 0 || height[0] === 0) {
      return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT
    }

    framebuffer._width = width[0]
    framebuffer._height = height[0]

    return gl.FRAMEBUFFER_COMPLETE
  }

  _isConstantBlendFunc (factor) {
    return (
      factor === gl.CONSTANT_COLOR ||
      factor === gl.ONE_MINUS_CONSTANT_COLOR ||
      factor === gl.CONSTANT_ALPHA ||
      factor === gl.ONE_MINUS_CONSTANT_ALPHA)
  }

  _isObject (object, method, Wrapper) {
    if (!(object === null || object === void 0) &&
      !(object instanceof Wrapper)) {
      throw new TypeError(method + '(' + Wrapper.name + ')')
    }
    if (this._checkValid(object, Wrapper) && this._checkOwns(object)) {
      return true
    }
    return false
  }

  _resizeDrawingBuffer (width, height) {
    const prevFramebuffer = this._activeFramebuffer
    const prevTexture = this._getActiveTexture(gl.TEXTURE_2D)
    const prevRenderbuffer = this._activeRenderbuffer

    const contextAttributes = this._contextAttributes

    const drawingBuffer = this._drawingBuffer
    super.bindFramebuffer(gl.FRAMEBUFFER, drawingBuffer._framebuffer)
    const attachments = this._getAttachments()
    // Clear all attachments
    for (let i = 0; i < attachments.length; ++i) {
      super.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachments[i],
        gl.TEXTURE_2D,
        0,
        0)
    }

    // Update color attachment
    super.bindTexture(gl.TEXTURE_2D, drawingBuffer._color)
    const colorFormat = contextAttributes.alpha ? gl.RGBA : gl.RGB
    super.texImage2D(
      gl.TEXTURE_2D,
      0,
      colorFormat,
      width,
      height,
      0,
      colorFormat,
      gl.UNSIGNED_BYTE,
      null)
    super.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    super.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    super.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      drawingBuffer._color,
      0)

    // Update depth-stencil attachments if needed
    let storage = 0
    let attachment = 0
    if (contextAttributes.depth && contextAttributes.stencil) {
      storage = gl.DEPTH_STENCIL
      attachment = gl.DEPTH_STENCIL_ATTACHMENT
    } else if (contextAttributes.depth) {
      storage = 0x81A7
      attachment = gl.DEPTH_ATTACHMENT
    } else if (contextAttributes.stencil) {
      storage = gl.STENCIL_INDEX8
      attachment = gl.STENCIL_ATTACHMENT
    }

    if (storage) {
      super.bindRenderbuffer(
        gl.RENDERBUFFER,
        drawingBuffer._depthStencil)
      super.renderbufferStorage(
        gl.RENDERBUFFER,
        storage,
        width,
        height)
      super.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachment,
        gl.RENDERBUFFER,
        drawingBuffer._depthStencil)
    }

    // Restore previous binding state
    this.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer)
    this.bindTexture(gl.TEXTURE_2D, prevTexture)
    this.bindRenderbuffer(gl.RENDERBUFFER, prevRenderbuffer)
  }

  _restoreError (lastError) {
    const topError = this._errorStack.pop()
    if (topError === gl.NO_ERROR) {
      this.setError(lastError)
    } else {
      this.setError(topError)
    }
  }

  _saveError () {
    this._errorStack.push(this.getError())
  }

  _switchActiveBuffer (active, buffer) {
    if (active !== buffer) {
      if (active) {
        active._refCount -= 1
        active._checkDelete()
      }
      if (buffer) {
        buffer._refCount += 1
      }
    }
  }

  _switchActiveProgram (active) {
    if (active) {
      active._refCount -= 1
      active._checkDelete()
    }
  }

  _tryDetachFramebuffer (framebuffer, renderbuffer) {
    // FIXME: Does the texture get unbound from *all* framebuffers, or just the
    // active FBO?
    if (framebuffer && framebuffer._linked(renderbuffer)) {
      const attachments = this._getAttachments()
      const framebufferAttachments = Object.keys(framebuffer._attachments)
      for (let i = 0; i < framebufferAttachments.length; ++i) {
        if (framebuffer._attachments[attachments[i]] === renderbuffer) {
          this.framebufferTexture2D(
            gl.FRAMEBUFFER,
            attachments[i] | 0,
            gl.TEXTURE_2D,
            null)
        }
      }
    }
  }

  _updateFramebufferAttachments (framebuffer) {
    const prevStatus = framebuffer._status
    const attachments = this._getAttachments()
    framebuffer._status = this._preCheckFramebufferStatus(framebuffer)
    if (framebuffer._status !== gl.FRAMEBUFFER_COMPLETE) {
      if (prevStatus === gl.FRAMEBUFFER_COMPLETE) {
        for (let i = 0; i < attachments.length; ++i) {
          const attachmentEnum = attachments[i]
          super.framebufferTexture2D(
            gl.FRAMEBUFFER,
            attachmentEnum,
            framebuffer._attachmentFace[attachmentEnum],
            0,
            framebuffer._attachmentLevel[attachmentEnum])
        }
      }
      return
    }

    for (let i = 0; i < attachments.length; ++i) {
      const attachmentEnum = attachments[i]
      super.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachmentEnum,
        framebuffer._attachmentFace[attachmentEnum],
        0,
        framebuffer._attachmentLevel[attachmentEnum])
    }

    for (let i = 0; i < attachments.length; ++i) {
      const attachmentEnum = attachments[i]
      const attachment = framebuffer._attachments[attachmentEnum]
      if (attachment instanceof WebGLTexture) {
        super.framebufferTexture2D(
          gl.FRAMEBUFFER,
          attachmentEnum,
          framebuffer._attachmentFace[attachmentEnum],
          attachment._ | 0,
          framebuffer._attachmentLevel[attachmentEnum])
      } else if (attachment instanceof WebGLRenderbuffer) {
        super.framebufferRenderbuffer(
          gl.FRAMEBUFFER,
          attachmentEnum,
          gl.RENDERBUFFER,
          attachment._ | 0)
      }
    }
  }

  _validBlendFunc (factor) {
    return factor === gl.ZERO ||
      factor === gl.ONE ||
      factor === gl.SRC_COLOR ||
      factor === gl.ONE_MINUS_SRC_COLOR ||
      factor === gl.DST_COLOR ||
      factor === gl.ONE_MINUS_DST_COLOR ||
      factor === gl.SRC_ALPHA ||
      factor === gl.ONE_MINUS_SRC_ALPHA ||
      factor === gl.DST_ALPHA ||
      factor === gl.ONE_MINUS_DST_ALPHA ||
      factor === gl.SRC_ALPHA_SATURATE ||
      factor === gl.CONSTANT_COLOR ||
      factor === gl.ONE_MINUS_CONSTANT_COLOR ||
      factor === gl.CONSTANT_ALPHA ||
      factor === gl.ONE_MINUS_CONSTANT_ALPHA
  }

  _validBlendMode (mode) {
    return mode === gl.FUNC_ADD ||
      mode === gl.FUNC_SUBTRACT ||
      mode === gl.FUNC_REVERSE_SUBTRACT
  }

  _validCubeTarget (target) {
    return target === gl.TEXTURE_CUBE_MAP_POSITIVE_X ||
      target === gl.TEXTURE_CUBE_MAP_NEGATIVE_X ||
      target === gl.TEXTURE_CUBE_MAP_POSITIVE_Y ||
      target === gl.TEXTURE_CUBE_MAP_NEGATIVE_Y ||
      target === gl.TEXTURE_CUBE_MAP_POSITIVE_Z ||
      target === gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
  }

  _validFramebufferAttachment (attachment) {
    switch (attachment) {
      case gl.DEPTH_ATTACHMENT:
      case gl.STENCIL_ATTACHMENT:
      case gl.DEPTH_STENCIL_ATTACHMENT:
      case gl.COLOR_ATTACHMENT0:
        return true
    }

    if (this._extensions.webgl_draw_buffers) { // eslint-disable-line
      const { webgl_draw_buffers } = this._extensions; // eslint-disable-line
      return attachment < (webgl_draw_buffers.COLOR_ATTACHMENT0_WEBGL + webgl_draw_buffers._maxDrawBuffers) // eslint-disable-line
    }

    return false
  }

  _validGLSLIdentifier (str) {
    return !(str.indexOf('webgl_') === 0 ||
      str.indexOf('_webgl_') === 0 ||
      str.length > 256)
  }

  _validTextureTarget (target) {
    return target === gl.TEXTURE_2D ||
      target === gl.TEXTURE_CUBE_MAP
  }

  _verifyTextureCompleteness (target, pname, param) {
    const unit = this._getActiveTextureUnit()
    let texture = null
    if (target === gl.TEXTURE_2D) {
      texture = unit._bind2D
    } else if (this._validCubeTarget(target)) {
      texture = unit._bindCube
    }

    // oes_texture_float
    if (this._extensions.oes_texture_float && texture && texture._type === gl.FLOAT && (pname === gl.TEXTURE_MAG_FILTER || pname === gl.TEXTURE_MIN_FILTER) && (param === gl.LINEAR || param === gl.LINEAR_MIPMAP_NEAREST || param === gl.NEAREST_MIPMAP_LINEAR || param === gl.LINEAR_MIPMAP_LINEAR)) {
      texture._complete = false
      this.bindTexture(target, texture)
      return
    }

    if (texture && texture._complete === false) {
      texture._complete = true
      this.bindTexture(target, texture)
    }
  }

  _wrapShader (type, source) { // eslint-disable-line
    if (this._extensions.webgl_draw_buffers) { // eslint-disable-line
      return source
    }
    return this._extensions.webgl_draw_buffers ? source : '#define gl_MaxDrawBuffers 1\n' + source // eslint-disable-line
  }

  _beginAttrib0Hack () {
    super.bindBuffer(gl.ARRAY_BUFFER, this._attrib0Buffer._)
    super.bufferData(
      gl.ARRAY_BUFFER,
      this._vertexAttribs[0]._data,
      gl.STREAM_DRAW)
    super.enableVertexAttribArray(0)
    super.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0)
    super._vertexAttribDivisor(0, 1)
  }

  _endAttrib0Hack () {
    const attrib = this._vertexAttribs[0]
    if (attrib._pointerBuffer) {
      super.bindBuffer(gl.ARRAY_BUFFER, attrib._pointerBuffer._)
    } else {
      super.bindBuffer(gl.ARRAY_BUFFER, 0)
    }
    super.vertexAttribPointer(
      0,
      attrib._inputSize,
      attrib._pointerType,
      attrib._pointerNormal,
      attrib._inputStride,
      attrib._pointerOffset)
    super._vertexAttribDivisor(0, attrib._divisor)
    super.disableVertexAttribArray(0)
    if (this._activeArrayBuffer) {
      super.bindBuffer(gl.ARRAY_BUFFER, this._activeArrayBuffer._)
    } else {
      super.bindBuffer(gl.ARRAY_BUFFER, 0)
    }
  }

  activeTexture (texture) {
    texture |= 0
    const texNum = texture - gl.TEXTURE0
    if (texNum >= 0 && texNum < this._textureUnits.length) {
      this._activeTextureUnit = texNum
      return super.activeTexture(texture)
    }

    this.setError(gl.INVALID_ENUM)
  }

  attachShader (program, shader) {
    if (!checkObject(program) ||
      !checkObject(shader)) {
      throw new TypeError('attachShader(WebGLProgram, WebGLShader)')
    }
    if (!program || !shader) {
      this.setError(gl.INVALID_VALUE)
      return
    } else if (program instanceof WebGLProgram &&
      shader instanceof WebGLShader &&
      this._checkOwns(program) &&
      this._checkOwns(shader)) {
      if (!program._linked(shader)) {
        this._saveError()
        super.attachShader(
          program._ | 0,
          shader._ | 0)
        const error = this.getError()
        this._restoreError(error)
        if (error === gl.NO_ERROR) {
          program._link(shader)
        }
        return
      }
    }
    this.setError(gl.INVALID_OPERATION)
  }

  bindAttribLocation (program, index, name) {
    if (!checkObject(program) ||
      typeof name !== 'string') {
      throw new TypeError('bindAttribLocation(WebGLProgram, GLint, String)')
    }
    name += ''
    if (!isValidString(name) || name.length > MAX_ATTRIBUTE_LENGTH) {
      this.setError(gl.INVALID_VALUE)
    } else if (/^_?webgl_a/.test(name)) {
      this.setError(gl.INVALID_OPERATION)
    } else if (this._checkWrapper(program, WebGLProgram)) {
      return super.bindAttribLocation(
        program._ | 0,
        index | 0,
        name)
    }
  }

  bindFramebuffer (target, framebuffer) {
    if (!checkObject(framebuffer)) {
      throw new TypeError('bindFramebuffer(GLenum, WebGLFramebuffer)')
    }
    if (target !== gl.FRAMEBUFFER) {
      this.setError(gl.INVALID_ENUM)
      return
    }
    if (!framebuffer) {
      super.bindFramebuffer(
        gl.FRAMEBUFFER,
        this._drawingBuffer._framebuffer)
    } else if (framebuffer._pendingDelete) {
      return
    } else if (this._checkWrapper(framebuffer, WebGLFramebuffer)) {
      super.bindFramebuffer(
        gl.FRAMEBUFFER,
        framebuffer._ | 0)
    } else {
      return
    }
    const activeFramebuffer = this._activeFramebuffer
    if (activeFramebuffer !== framebuffer) {
      if (activeFramebuffer) {
        activeFramebuffer._refCount -= 1
        activeFramebuffer._checkDelete()
      }
      if (framebuffer) {
        framebuffer._refCount += 1
      }
    }
    this._activeFramebuffer = framebuffer
    if (framebuffer) {
      this._updateFramebufferAttachments(framebuffer)
    }
  }

  bindBuffer (target, buffer) {
    target |= 0
    if (!checkObject(buffer)) {
      throw new TypeError('bindBuffer(GLenum, WebGLBuffer)')
    }
    if (target !== gl.ARRAY_BUFFER &&
      target !== gl.ELEMENT_ARRAY_BUFFER) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (!buffer) {
      super.bindBuffer(target, 0)
    } else if (buffer._pendingDelete) {
      return
    } else if (this._checkWrapper(buffer, WebGLBuffer)) {
      if (buffer._binding && buffer._binding !== target) {
        this.setError(gl.INVALID_OPERATION)
        return
      }
      buffer._binding = target | 0

      super.bindBuffer(target, buffer._ | 0)
    } else {
      return
    }

    if (target === gl.ARRAY_BUFFER) {
      this._switchActiveBuffer(this._activeArrayBuffer, buffer)
      this._activeArrayBuffer = buffer
    } else {
      this._switchActiveBuffer(this._activeElementArrayBuffer, buffer)
      this._activeElementArrayBuffer = buffer
    }
  }

  bindRenderbuffer (target, object) {
    if (!checkObject(object)) {
      throw new TypeError('bindRenderbuffer(GLenum, WebGLRenderbuffer)')
    }

    if (target !== gl.RENDERBUFFER) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (!object) {
      super.bindRenderbuffer(
        target | 0,
        0)
    } else if (object._pendingDelete) {
      return
    } else if (this._checkWrapper(object, WebGLRenderbuffer)) {
      super.bindRenderbuffer(
        target | 0,
        object._ | 0)
    } else {
      return
    }
    const active = this._activeRenderbuffer
    if (active !== object) {
      if (active) {
        active._refCount -= 1
        active._checkDelete()
      }
      if (object) {
        object._refCount += 1
      }
    }
    this._activeRenderbuffer = object
  }

  bindTexture (target, texture) {
    target |= 0

    if (!checkObject(texture)) {
      throw new TypeError('bindTexture(GLenum, WebGLTexture)')
    }

    if (!this._validTextureTarget(target)) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    // Get texture id
    let textureId = 0
    if (!texture) {
      texture = null
    } else if (texture instanceof WebGLTexture &&
      texture._pendingDelete) {
      // Special case: error codes for deleted textures don't get set for some dumb reason
      return
    } else if (this._checkWrapper(texture, WebGLTexture)) {
      // Check binding mode of texture
      if (texture._binding && texture._binding !== target) {
        this.setError(gl.INVALID_OPERATION)
        return
      }
      texture._binding = target

      if (texture._complete) {
        textureId = texture._ | 0
      }
    } else {
      return
    }

    this._saveError()
    super.bindTexture(
      target,
      textureId)
    const error = this.getError()
    this._restoreError(error)

    if (error !== gl.NO_ERROR) {
      return
    }

    const activeUnit = this._getActiveTextureUnit()
    const activeTex = this._getActiveTexture(target)

    // Update references
    if (activeTex !== texture) {
      if (activeTex) {
        activeTex._refCount -= 1
        activeTex._checkDelete()
      }
      if (texture) {
        texture._refCount += 1
      }
    }

    if (target === gl.TEXTURE_2D) {
      activeUnit._bind2D = texture
    } else if (target === gl.TEXTURE_CUBE_MAP) {
      activeUnit._bindCube = texture
    }
  }

  blendColor (red, green, blue, alpha) {
    return super.blendColor(+red, +green, +blue, +alpha)
  }

  blendEquation (mode) {
    mode |= 0
    if (this._validBlendMode(mode)) {
      return super.blendEquation(mode)
    }
    this.setError(gl.INVALID_ENUM)
  }

  blendEquationSeparate (modeRGB, modeAlpha) {
    modeRGB |= 0
    modeAlpha |= 0
    if (this._validBlendMode(modeRGB) && this._validBlendMode(modeAlpha)) {
      return super.blendEquationSeparate(modeRGB, modeAlpha)
    }
    this.setError(gl.INVALID_ENUM)
  }

  createBuffer () {
    const id = super.createBuffer()
    if (id <= 0) return null
    const webGLBuffer = new WebGLBuffer(id, this)
    this._buffers[id] = webGLBuffer
    return webGLBuffer
  }

  createFramebuffer () {
    const id = super.createFramebuffer()
    if (id <= 0) return null
    const webGLFramebuffer = new WebGLFramebuffer(id, this)
    this._framebuffers[id] = webGLFramebuffer
    return webGLFramebuffer
  }

  createProgram () {
    const id = super.createProgram()
    if (id <= 0) return null
    const webGLProgram = new WebGLProgram(id, this)
    this._programs[id] = webGLProgram
    return webGLProgram
  }

  createRenderbuffer () {
    const id = super.createRenderbuffer()
    if (id <= 0) return null
    const webGLRenderbuffer = new WebGLRenderbuffer(id, this)
    this._renderbuffers[id] = webGLRenderbuffer
    return webGLRenderbuffer
  }

  createTexture () {
    const id = super.createTexture()
    if (id <= 0) return null
    const webGlTexture = new WebGLTexture(id, this)
    this._textures[id] = webGlTexture
    return webGlTexture
  }

  getContextAttributes () {
    return this._contextAttributes
  }

  getExtension (name) {
    const str = name.toLowerCase()
    if (str in this._extensions) {
      return this._extensions[str]
    }
    let ext = availableExtensions[str] ? availableExtensions[str](this) : null
    if (ext) {
      this._extensions[str] = ext
    }
    return ext
  }

  getSupportedExtensions () {
    const exts = [
      'ANGLE_instanced_arrays',
      'STACKGL_resize_drawingbuffer',
      'STACKGL_destroy_context'
    ]

    const supportedExts = super.getSupportedExtensions()

    if (supportedExts.indexOf('GL_OES_element_index_uint') >= 0) {
      exts.push('OES_element_index_uint')
    }

    if (supportedExts.indexOf('GL_OES_texture_float') >= 0) {
      exts.push('OES_texture_float')
    }

    if (supportedExts.indexOf('EXT_draw_buffers') >= 0) {
      exts.push('WEBGL_draw_buffers')
    }

    return exts
  }

  setError (error) {
    NativeWebGL.setError.call(this, error | 0)
  }

  blendFunc (sfactor, dfactor) {
    sfactor |= 0
    dfactor |= 0
    if (!this._validBlendFunc(sfactor) ||
      !this._validBlendFunc(dfactor)) {
      this.setError(gl.INVALID_ENUM)
      return
    }
    if (this._isConstantBlendFunc(sfactor) && this._isConstantBlendFunc(dfactor)) {
      this.setError(gl.INVALID_OPERATION)
      return
    }
    super.blendFunc(sfactor, dfactor)
  }

  blendFuncSeparate (
    srcRGB,
    dstRGB,
    srcAlpha,
    dstAlpha) {
    srcRGB |= 0
    dstRGB |= 0
    srcAlpha |= 0
    dstAlpha |= 0

    if (!(this._validBlendFunc(srcRGB) &&
      this._validBlendFunc(dstRGB) &&
      this._validBlendFunc(srcAlpha) &&
      this._validBlendFunc(dstAlpha))) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if ((this._isConstantBlendFunc(srcRGB) && this._isConstantBlendFunc(dstRGB)) ||
      (this._isConstantBlendFunc(srcAlpha) && this._isConstantBlendFunc(dstAlpha))) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    super.blendFuncSeparate(
      srcRGB,
      dstRGB,
      srcAlpha,
      dstAlpha)
  }

  bufferData (target, data, usage) {
    target |= 0
    usage |= 0
    if (usage !== gl.STREAM_DRAW &&
      usage !== gl.STATIC_DRAW &&
      usage !== gl.DYNAMIC_DRAW) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (target !== gl.ARRAY_BUFFER &&
      target !== gl.ELEMENT_ARRAY_BUFFER) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    const active = this._getActiveBuffer(target)
    if (!active) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (typeof data === 'object') {
      let u8Data = null
      if (isTypedArray(data)) {
        u8Data = unpackTypedArray(data)
      } else if (data instanceof ArrayBuffer) {
        u8Data = new Uint8Array(data)
      } else {
        this.setError(gl.INVALID_VALUE)
        return
      }

      this._saveError()
      super.bufferData(
        target,
        u8Data,
        usage)
      const error = this.getError()
      this._restoreError(error)
      if (error !== gl.NO_ERROR) {
        return
      }

      active._size = u8Data.length
      if (target === gl.ELEMENT_ARRAY_BUFFER) {
        active._elements = new Uint8Array(u8Data)
      }
    } else if (typeof data === 'number') {
      const size = data | 0
      if (size < 0) {
        this.setError(gl.INVALID_VALUE)
        return
      }

      this._saveError()
      super.bufferData(
        target,
        size,
        usage)
      const error = this.getError()
      this._restoreError(error)
      if (error !== gl.NO_ERROR) {
        return
      }

      active._size = size
      if (target === gl.ELEMENT_ARRAY_BUFFER) {
        active._elements = new Uint8Array(size)
      }
    } else {
      this.setError(gl.INVALID_VALUE)
    }
  }

  bufferSubData (target, offset, data) {
    target |= 0
    offset |= 0

    if (target !== gl.ARRAY_BUFFER &&
      target !== gl.ELEMENT_ARRAY_BUFFER) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (data === null) {
      return
    }

    if (!data || typeof data !== 'object') {
      this.setError(gl.INVALID_VALUE)
      return
    }

    const active = this._getActiveBuffer(target)
    if (!active) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (offset < 0 || offset >= active._size) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    let u8Data = null
    if (isTypedArray(data)) {
      u8Data = unpackTypedArray(data)
    } else if (data instanceof ArrayBuffer) {
      u8Data = new Uint8Array(data)
    } else {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (offset + u8Data.length > active._size) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (target === gl.ELEMENT_ARRAY_BUFFER) {
      active._elements.set(u8Data, offset)
    }

    super.bufferSubData(
      target,
      offset,
      u8Data)
  }

  checkFramebufferStatus (target) {
    if (target !== gl.FRAMEBUFFER) {
      this.setError(gl.INVALID_ENUM)
      return 0
    }

    const framebuffer = this._activeFramebuffer
    if (!framebuffer) {
      return gl.FRAMEBUFFER_COMPLETE
    }

    return this._preCheckFramebufferStatus(framebuffer)
  }

  clear (mask) {
    if (!this._framebufferOk()) {
      return
    }
    return super.clear(mask | 0)
  }

  clearColor (red, green, blue, alpha) {
    return super.clearColor(+red, +green, +blue, +alpha)
  }

  clearDepth (depth) {
    return super.clearDepth(+depth)
  }

  clearStencil (s) {
    return super.clearStencil(s | 0)
  }

  colorMask (red, green, blue, alpha) {
    return super.colorMask(!!red, !!green, !!blue, !!alpha)
  }

  compileShader (shader) {
    if (!checkObject(shader)) {
      throw new TypeError('compileShader(WebGLShader)')
    }
    if (this._checkWrapper(shader, WebGLShader) &&
      this._checkShaderSource(shader)) {
      const prevError = this.getError()
      super.compileShader(shader._ | 0)
      const error = this.getError()
      shader._compileStatus = !!super.getShaderParameter(
        shader._ | 0,
        gl.COMPILE_STATUS)
      shader._compileInfo = super.getShaderInfoLog(shader._ | 0)
      this.getError()
      this.setError(prevError || error)
    }
  }

  copyTexImage2D (
    target,
    level,
    internalFormat,
    x, y, width, height,
    border) {
    target |= 0
    level |= 0
    internalFormat |= 0
    x |= 0
    y |= 0
    width |= 0
    height |= 0
    border |= 0

    const texture = this._getTexImage(target)
    if (!texture) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (internalFormat !== gl.RGBA &&
      internalFormat !== gl.RGB &&
      internalFormat !== gl.ALPHA &&
      internalFormat !== gl.LUMINANCE &&
      internalFormat !== gl.LUMINANCE_ALPHA) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (level < 0 || width < 0 || height < 0 || border !== 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (level > 0 && !(bits.isPow2(width) && bits.isPow2(height))) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    this._saveError()
    super.copyTexImage2D(
      target,
      level,
      internalFormat,
      x,
      y,
      width,
      height,
      border)
    const error = this.getError()
    this._restoreError(error)

    if (error === gl.NO_ERROR) {
      texture._levelWidth[level] = width
      texture._levelHeight[level] = height
      texture._format = gl.RGBA
      texture._type = gl.UNSIGNED_BYTE
    }
  }

  copyTexSubImage2D (
    target,
    level,
    xoffset, yoffset,
    x, y, width, height) {
    target |= 0
    level |= 0
    xoffset |= 0
    yoffset |= 0
    x |= 0
    y |= 0
    width |= 0
    height |= 0

    const texture = this._getTexImage(target)
    if (!texture) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (width < 0 || height < 0 || xoffset < 0 || yoffset < 0 || level < 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    super.copyTexSubImage2D(
      target,
      level,
      xoffset,
      yoffset,
      x,
      y,
      width,
      height)
  }

  cullFace (mode) {
    return super.cullFace(mode | 0)
  }

  createShader (type) {
    type |= 0
    if (type !== gl.FRAGMENT_SHADER &&
      type !== gl.VERTEX_SHADER) {
      this.setError(gl.INVALID_ENUM)
      return null
    }
    const id = super.createShader(type)
    if (id < 0) {
      return null
    }
    const result = new WebGLShader(id, this, type)
    this._shaders[id] = result
    return result
  }

  deleteProgram (object) {
    return this._deleteLinkable('deleteProgram', object, WebGLProgram)
  }

  deleteShader (object) {
    return this._deleteLinkable('deleteShader', object, WebGLShader)
  }

  _deleteLinkable (name, object, Type) {
    if (!checkObject(object)) {
      throw new TypeError(name + '(' + Type.name + ')')
    }
    if (object instanceof Type &&
      this._checkOwns(object)) {
      object._pendingDelete = true
      object._checkDelete()
      return
    }
    this.setError(gl.INVALID_OPERATION)
  }

  deleteBuffer (buffer) {
    if (!checkObject(buffer) ||
      (buffer !== null && !(buffer instanceof WebGLBuffer))) {
      throw new TypeError('deleteBuffer(WebGLBuffer)')
    }

    if (!(buffer instanceof WebGLBuffer &&
      this._checkOwns(buffer))) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (this._activeArrayBuffer === buffer) {
      this.bindBuffer(gl.ARRAY_BUFFER, null)
    }
    if (this._activeElementArrayBuffer === buffer) {
      this.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
    }

    for (let i = 0; i < this._vertexAttribs.length; ++i) {
      const attrib = this._vertexAttribs[i]
      if (attrib._pointerBuffer === buffer) {
        attrib._pointerBuffer = null
        attrib._pointerStride = 0
        attrib._pointerOffset = 0
        attrib._pointerSize = 4
        buffer._refCount -= 1
      }
    }

    buffer._pendingDelete = true
    buffer._checkDelete()
  }

  deleteFramebuffer (framebuffer) {
    if (!checkObject(framebuffer)) {
      throw new TypeError('deleteFramebuffer(WebGLFramebuffer)')
    }

    if (!(framebuffer instanceof WebGLFramebuffer &&
      this._checkOwns(framebuffer))) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (this._activeFramebuffer === framebuffer) {
      this.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    framebuffer._pendingDelete = true
    framebuffer._checkDelete()
  }

  // Need to handle textures and render buffers as a special case:
  // When a texture gets deleted, we need to do the following extra steps:
  //  1. Is it bound to the current texture unit?
  //     If so, then unbind it
  //  2. Is it attached to the active fbo?
  //     If so, then detach it
  //
  // For renderbuffers only need to do second step
  //
  // After this, proceed with the usual deletion algorithm
  //
  deleteRenderbuffer (renderbuffer) {
    if (!checkObject(renderbuffer)) {
      throw new TypeError('deleteRenderbuffer(WebGLRenderbuffer)')
    }

    if (!(renderbuffer instanceof WebGLRenderbuffer &&
      this._checkOwns(renderbuffer))) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (this._activeRenderbuffer === renderbuffer) {
      this.bindRenderbuffer(gl.RENDERBUFFER, null)
    }

    const activeFramebuffer = this._activeFramebuffer

    this._tryDetachFramebuffer(activeFramebuffer, renderbuffer)

    renderbuffer._pendingDelete = true
    renderbuffer._checkDelete()
  }

  deleteTexture (texture) {
    if (!checkObject(texture)) {
      throw new TypeError('deleteTexture(WebGLTexture)')
    }

    if (texture instanceof WebGLTexture) {
      if (!this._checkOwns(texture)) {
        this.setError(gl.INVALID_OPERATION)
        return
      }
    } else {
      return
    }

    // Unbind from all texture units
    const curActive = this._activeTextureUnit

    for (let i = 0; i < this._textureUnits.length; ++i) {
      const unit = this._textureUnits[i]
      if (unit._bind2D === texture) {
        this.activeTexture(gl.TEXTURE0 + i)
        this.bindTexture(gl.TEXTURE_2D, null)
      } else if (unit._bindCube === texture) {
        this.activeTexture(gl.TEXTURE0 + i)
        this.bindTexture(gl.TEXTURE_CUBE_MAP, null)
      }
    }
    this.activeTexture(gl.TEXTURE0 + curActive)

    // FIXME: Does the texture get unbound from *all* framebuffers, or just the
    // active FBO?
    const ctx = this
    const activeFramebuffer = this._activeFramebuffer
    function tryDetach (framebuffer) {
      if (framebuffer && framebuffer._linked(texture)) {
        const attachments = ctx._getAttachments()
        for (let i = 0; i < attachments.length; ++i) {
          const attachment = attachments[i]
          if (framebuffer._attachments[attachment] === texture) {
            ctx.framebufferTexture2D(
              gl.FRAMEBUFFER,
              attachment,
              gl.TEXTURE_2D,
              null)
          }
        }
      }
    }

    tryDetach(activeFramebuffer)

    // Mark texture for deletion
    texture._pendingDelete = true
    texture._checkDelete()
  }

  depthFunc (func) {
    func |= 0
    switch (func) {
      case gl.NEVER:
      case gl.LESS:
      case gl.EQUAL:
      case gl.LEQUAL:
      case gl.GREATER:
      case gl.NOTEQUAL:
      case gl.GEQUAL:
      case gl.ALWAYS:
        return super.depthFunc(func)
      default:
        this.setError(gl.INVALID_ENUM)
    }
  }

  depthMask (flag) {
    return super.depthMask(!!flag)
  }

  depthRange (zNear, zFar) {
    zNear = +zNear
    zFar = +zFar
    if (zNear <= zFar) {
      return super.depthRange(zNear, zFar)
    }
    this.setError(gl.INVALID_OPERATION)
  }

  destroy () {
    super.destroy()
  }

  detachShader (program, shader) {
    if (!checkObject(program) ||
      !checkObject(shader)) {
      throw new TypeError('detachShader(WebGLProgram, WebGLShader)')
    }
    if (this._checkWrapper(program, WebGLProgram) &&
      this._checkWrapper(shader, WebGLShader)) {
      if (program._linked(shader)) {
        super.detachShader(program._, shader._)
        program._unlink(shader)
      } else {
        this.setError(gl.INVALID_OPERATION)
      }
    }
  }

  disable (cap) {
    cap |= 0
    super.disable(cap)
    if (cap === gl.TEXTURE_2D ||
      cap === gl.TEXTURE_CUBE_MAP) {
      const active = this._getActiveTextureUnit()
      if (active._mode === cap) {
        active._mode = 0
      }
    }
  }

  disableVertexAttribArray (index) {
    index |= 0
    if (index < 0 || index >= this._vertexAttribs.length) {
      this.setError(gl.INVALID_VALUE)
      return
    }
    super.disableVertexAttribArray(index)
    this._vertexAttribs[index]._isPointer = false
  }

  drawArrays (mode, first, count) {
    mode |= 0
    first |= 0
    count |= 0

    if (first < 0 || count < 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (!this._checkStencilState()) {
      return
    }

    const reducedCount = vertexCount(mode, count)
    if (reducedCount < 0) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (!this._framebufferOk()) {
      return
    }

    if (count === 0) {
      return
    }

    let maxIndex = first
    if (count > 0) {
      maxIndex = (count + first - 1) >>> 0
    }
    if (this._checkVertexAttribState(maxIndex)) {
      if (
        this._vertexAttribs[0]._isPointer || (
          this._extensions.webgl_draw_buffers &&
          this._extensions.webgl_draw_buffers._buffersState &&
          this._extensions.webgl_draw_buffers._buffersState.length > 0
        )
      ) {
        return super.drawArrays(mode, first, reducedCount)
      } else {
        this._beginAttrib0Hack()
        super._drawArraysInstanced(mode, first, reducedCount, 1)
        this._endAttrib0Hack()
      }
    }
  }

  drawElements (mode, count, type, ioffset) {
    mode |= 0
    count |= 0
    type |= 0
    ioffset |= 0

    if (count < 0 || ioffset < 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (!this._checkStencilState()) {
      return
    }

    const elementBuffer = this._activeElementArrayBuffer
    if (!elementBuffer) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    // Unpack element data
    let elementData = null
    let offset = ioffset
    if (type === gl.UNSIGNED_SHORT) {
      if (offset % 2) {
        this.setError(gl.INVALID_OPERATION)
        return
      }
      offset >>= 1
      elementData = new Uint16Array(elementBuffer._elements.buffer)
    } else if (this._extensions.oes_element_index_uint && type === gl.UNSIGNED_INT) {
      if (offset % 4) {
        this.setError(gl.INVALID_OPERATION)
        return
      }
      offset >>= 2
      elementData = new Uint32Array(elementBuffer._elements.buffer)
    } else if (type === gl.UNSIGNED_BYTE) {
      elementData = elementBuffer._elements
    } else {
      this.setError(gl.INVALID_ENUM)
      return
    }

    let reducedCount = count
    switch (mode) {
      case gl.TRIANGLES:
        if (count % 3) {
          reducedCount -= (count % 3)
        }
        break
      case gl.LINES:
        if (count % 2) {
          reducedCount -= (count % 2)
        }
        break
      case gl.POINTS:
        break
      case gl.LINE_LOOP:
      case gl.LINE_STRIP:
        if (count < 2) {
          this.setError(gl.INVALID_OPERATION)
          return
        }
        break
      case gl.TRIANGLE_FAN:
      case gl.TRIANGLE_STRIP:
        if (count < 3) {
          this.setError(gl.INVALID_OPERATION)
          return
        }
        break
      default:
        this.setError(gl.INVALID_ENUM)
        return
    }

    if (!this._framebufferOk()) {
      return
    }

    if (count === 0) {
      this._checkVertexAttribState(0)
      return
    }

    if ((count + offset) >>> 0 > elementData.length) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    // Compute max index
    let maxIndex = -1
    for (let i = offset; i < offset + count; ++i) {
      maxIndex = Math.max(maxIndex, elementData[i])
    }

    if (maxIndex < 0) {
      this._checkVertexAttribState(0)
      return
    }

    if (this._checkVertexAttribState(maxIndex)) {
      if (reducedCount > 0) {
        if (this._vertexAttribs[0]._isPointer) {
          return super.drawElements(mode, reducedCount, type, ioffset)
        } else {
          this._beginAttrib0Hack()
          super._drawElementsInstanced(mode, reducedCount, type, ioffset, 1)
          this._endAttrib0Hack()
        }
      }
    }
  }

  enable (cap) {
    cap |= 0
    super.enable(cap)
  }

  enableVertexAttribArray (index) {
    index |= 0
    if (index < 0 || index >= this._vertexAttribs.length) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    super.enableVertexAttribArray(index)

    this._vertexAttribs[index]._isPointer = true
  }

  finish () {
    return super.finish()
  }

  flush () {
    return super.flush()
  }

  framebufferRenderbuffer (
    target,
    attachment,
    renderbufferTarget,
    renderbuffer) {
    target = target | 0
    attachment = attachment | 0
    renderbufferTarget = renderbufferTarget | 0

    if (!checkObject(renderbuffer)) {
      throw new TypeError('framebufferRenderbuffer(GLenum, GLenum, GLenum, WebGLRenderbuffer)')
    }

    if (target !== gl.FRAMEBUFFER ||
      !this._validFramebufferAttachment(attachment) ||
      renderbufferTarget !== gl.RENDERBUFFER) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    const framebuffer = this._activeFramebuffer
    if (!framebuffer) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (renderbuffer && !this._checkWrapper(renderbuffer, WebGLRenderbuffer)) {
      return
    }

    framebuffer._setAttachment(renderbuffer, attachment)
    this._updateFramebufferAttachments(framebuffer)
  }

  framebufferTexture2D (
    target,
    attachment,
    textarget,
    texture,
    level) {
    target |= 0
    attachment |= 0
    textarget |= 0
    level |= 0
    if (!checkObject(texture)) {
      throw new TypeError('framebufferTexture2D(GLenum, GLenum, GLenum, WebGLTexture, GLint)')
    }

    // Check parameters are ok
    if (target !== gl.FRAMEBUFFER ||
      !this._validFramebufferAttachment(attachment)) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (level !== 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    // Check object ownership
    if (texture && !this._checkWrapper(texture, WebGLTexture)) {
      return
    }

    // Check texture target is ok
    if (textarget === gl.TEXTURE_2D) {
      if (texture && texture._binding !== gl.TEXTURE_2D) {
        this.setError(gl.INVALID_OPERATION)
        return
      }
    } else if (this._validCubeTarget(textarget)) {
      if (texture && texture._binding !== gl.TEXTURE_CUBE_MAP) {
        this.setError(gl.INVALID_OPERATION)
        return
      }
    } else {
      this.setError(gl.INVALID_ENUM)
      return
    }

    // Check a framebuffer is actually bound
    const framebuffer = this._activeFramebuffer
    if (!framebuffer) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    framebuffer._attachmentLevel[attachment] = level
    framebuffer._attachmentFace[attachment] = textarget
    framebuffer._setAttachment(texture, attachment)
    this._updateFramebufferAttachments(framebuffer)
  }

  frontFace (mode) {
    return super.frontFace(mode | 0)
  }

  generateMipmap (target) {
    return super.generateMipmap(target | 0) | 0
  }

  getActiveAttrib (program, index) {
    if (!checkObject(program)) {
      throw new TypeError('getActiveAttrib(WebGLProgram)')
    } else if (!program) {
      this.setError(gl.INVALID_VALUE)
    } else if (this._checkWrapper(program, WebGLProgram)) {
      const info = super.getActiveAttrib(program._ | 0, index | 0)
      if (info) {
        return new WebGLActiveInfo(info)
      }
    }
    return null
  }

  getActiveUniform (program, index) {
    if (!checkObject(program)) {
      throw new TypeError('getActiveUniform(WebGLProgram, GLint)')
    } else if (!program) {
      this.setError(gl.INVALID_VALUE)
    } else if (this._checkWrapper(program, WebGLProgram)) {
      const info = super.getActiveUniform(program._ | 0, index | 0)
      if (info) {
        return new WebGLActiveInfo(info)
      }
    }
    return null
  }

  getAttachedShaders (program) {
    if (!checkObject(program) ||
      (typeof program === 'object' &&
        program !== null &&
        !(program instanceof WebGLProgram))) {
      throw new TypeError('getAttachedShaders(WebGLProgram)')
    }
    if (!program) {
      this.setError(gl.INVALID_VALUE)
    } else if (this._checkWrapper(program, WebGLProgram)) {
      const shaderArray = super.getAttachedShaders(program._ | 0)
      if (!shaderArray) {
        return null
      }
      const unboxedShaders = new Array(shaderArray.length)
      for (let i = 0; i < shaderArray.length; ++i) {
        unboxedShaders[i] = this._shaders[shaderArray[i]]
      }
      return unboxedShaders
    }
    return null
  }

  getAttribLocation (program, name) {
    if (!checkObject(program)) {
      throw new TypeError('getAttribLocation(WebGLProgram, String)')
    }
    name += ''
    if (!isValidString(name) || name.length > MAX_ATTRIBUTE_LENGTH) {
      this.setError(gl.INVALID_VALUE)
    } else if (this._checkWrapper(program, WebGLProgram)) {
      return super.getAttribLocation(program._ | 0, name + '')
    }
    return -1
  }

  getParameter (pname) {
    pname |= 0
    switch (pname) {
      case gl.ARRAY_BUFFER_BINDING:
        return this._activeArrayBuffer
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        return this._activeElementArrayBuffer
      case gl.CURRENT_PROGRAM:
        return this._activeProgram
      case gl.FRAMEBUFFER_BINDING:
        return this._activeFramebuffer
      case gl.RENDERBUFFER_BINDING:
        return this._activeRenderbuffer
      case gl.TEXTURE_BINDING_2D:
        return this._getActiveTextureUnit()._bind2D
      case gl.TEXTURE_BINDING_CUBE_MAP:
        return this._getActiveTextureUnit()._bindCube
      case gl.VERSION:
        return 'WebGL 1.0 stack-gl ' + HEADLESS_VERSION
      case gl.VENDOR:
        return 'stack-gl'
      case gl.RENDERER:
        return 'ANGLE'
      case gl.SHADING_LANGUAGE_VERSION:
        return 'WebGL GLSL ES 1.0 stack-gl'

      case gl.COMPRESSED_TEXTURE_FORMATS:
        return new Uint32Array(0)

      // Int arrays
      case gl.MAX_VIEWPORT_DIMS:
      case gl.SCISSOR_BOX:
      case gl.VIEWPORT:
        return new Int32Array(super.getParameter(pname))

      // Float arrays
      case gl.ALIASED_LINE_WIDTH_RANGE:
      case gl.ALIASED_POINT_SIZE_RANGE:
      case gl.DEPTH_RANGE:
      case gl.BLEND_COLOR:
      case gl.COLOR_CLEAR_VALUE:
        return new Float32Array(super.getParameter(pname))

      case gl.COLOR_WRITEMASK:
        return super.getParameter(pname)

      case gl.DEPTH_CLEAR_VALUE:
      case gl.LINE_WIDTH:
      case gl.POLYGON_OFFSET_FACTOR:
      case gl.POLYGON_OFFSET_UNITS:
      case gl.SAMPLE_COVERAGE_VALUE:
        return +super.getParameter(pname)

      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.DEPTH_WRITEMASK:
      case gl.DITHER:
      case gl.POLYGON_OFFSET_FILL:
      case gl.SAMPLE_COVERAGE_INVERT:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
      case gl.UNPACK_FLIP_Y_WEBGL:
      case gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
        return !!super.getParameter(pname)

      case gl.ACTIVE_TEXTURE:
      case gl.ALPHA_BITS:
      case gl.BLEND_DST_ALPHA:
      case gl.BLEND_DST_RGB:
      case gl.BLEND_EQUATION_ALPHA:
      case gl.BLEND_EQUATION_RGB:
      case gl.BLEND_SRC_ALPHA:
      case gl.BLEND_SRC_RGB:
      case gl.BLUE_BITS:
      case gl.CULL_FACE_MODE:
      case gl.DEPTH_BITS:
      case gl.DEPTH_FUNC:
      case gl.FRONT_FACE:
      case gl.GENERATE_MIPMAP_HINT:
      case gl.GREEN_BITS:
      case gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS:
      case gl.MAX_CUBE_MAP_TEXTURE_SIZE:
      case gl.MAX_FRAGMENT_UNIFORM_VECTORS:
      case gl.MAX_RENDERBUFFER_SIZE:
      case gl.MAX_TEXTURE_IMAGE_UNITS:
      case gl.MAX_TEXTURE_SIZE:
      case gl.MAX_VARYING_VECTORS:
      case gl.MAX_VERTEX_ATTRIBS:
      case gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS:
      case gl.MAX_VERTEX_UNIFORM_VECTORS:
      case gl.PACK_ALIGNMENT:
      case gl.RED_BITS:
      case gl.SAMPLE_BUFFERS:
      case gl.SAMPLES:
      case gl.STENCIL_BACK_FAIL:
      case gl.STENCIL_BACK_FUNC:
      case gl.STENCIL_BACK_PASS_DEPTH_FAIL:
      case gl.STENCIL_BACK_PASS_DEPTH_PASS:
      case gl.STENCIL_BACK_REF:
      case gl.STENCIL_BACK_VALUE_MASK:
      case gl.STENCIL_BACK_WRITEMASK:
      case gl.STENCIL_BITS:
      case gl.STENCIL_CLEAR_VALUE:
      case gl.STENCIL_FAIL:
      case gl.STENCIL_FUNC:
      case gl.STENCIL_PASS_DEPTH_FAIL:
      case gl.STENCIL_PASS_DEPTH_PASS:
      case gl.STENCIL_REF:
      case gl.STENCIL_VALUE_MASK:
      case gl.STENCIL_WRITEMASK:
      case gl.SUBPIXEL_BITS:
      case gl.UNPACK_ALIGNMENT:
      case gl.UNPACK_COLORSPACE_CONVERSION_WEBGL:
        return super.getParameter(pname) | 0

      case gl.IMPLEMENTATION_COLOR_READ_FORMAT:
      case gl.IMPLEMENTATION_COLOR_READ_TYPE:
        return super.getParameter(pname)

      default:
        if (this._extensions.webgl_draw_buffers) {
          const ext = this._extensions.webgl_draw_buffers
          switch (pname) {
            case ext.DRAW_BUFFER0_WEBGL:
            case ext.DRAW_BUFFER1_WEBGL:
            case ext.DRAW_BUFFER2_WEBGL:
            case ext.DRAW_BUFFER3_WEBGL:
            case ext.DRAW_BUFFER4_WEBGL:
            case ext.DRAW_BUFFER5_WEBGL:
            case ext.DRAW_BUFFER6_WEBGL:
            case ext.DRAW_BUFFER7_WEBGL:
            case ext.DRAW_BUFFER8_WEBGL:
            case ext.DRAW_BUFFER9_WEBGL:
            case ext.DRAW_BUFFER10_WEBGL:
            case ext.DRAW_BUFFER11_WEBGL:
            case ext.DRAW_BUFFER12_WEBGL:
            case ext.DRAW_BUFFER13_WEBGL:
            case ext.DRAW_BUFFER14_WEBGL:
            case ext.DRAW_BUFFER15_WEBGL:
              if (ext._buffersState.length === 1 && ext._buffersState[0] === gl.BACK) {
                return gl.BACK
              }
              return super.getParameter(pname)
            case ext.MAX_DRAW_BUFFERS_WEBGL:
            case ext.MAX_COLOR_ATTACHMENTS_WEBGL:
              return super.getParameter(pname)
          }
        }
        this.setError(gl.INVALID_ENUM)
        return null
    }
  }

  getShaderPrecisionFormat (
    shaderType,
    precisionType) {
    shaderType |= 0
    precisionType |= 0

    if (!(shaderType === gl.FRAGMENT_SHADER ||
      shaderType === gl.VERTEX_SHADER) ||
      !(precisionType === gl.LOW_FLOAT ||
        precisionType === gl.MEDIUM_FLOAT ||
        precisionType === gl.HIGH_FLOAT ||
        precisionType === gl.LOW_INT ||
        precisionType === gl.MEDIUM_INT ||
        precisionType === gl.HIGH_INT)) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    const format = super.getShaderPrecisionFormat(shaderType, precisionType)
    if (!format) {
      return null
    }

    return new WebGLShaderPrecisionFormat(format)
  }

  getBufferParameter (target, pname) {
    target |= 0
    pname |= 0
    if (target !== gl.ARRAY_BUFFER &&
      target !== gl.ELEMENT_ARRAY_BUFFER) {
      this.setError(gl.INVALID_ENUM)
      return null
    }

    switch (pname) {
      case gl.BUFFER_SIZE:
      case gl.BUFFER_USAGE:
        return super.getBufferParameter(target | 0, pname | 0)
      default:
        this.setError(gl.INVALID_ENUM)
        return null
    }
  }

  getError () {
    return super.getError()
  }

  getFramebufferAttachmentParameter (target, attachment, pname) {
    target |= 0
    attachment |= 0
    pname |= 0

    if (target !== gl.FRAMEBUFFER ||
      !this._validFramebufferAttachment(attachment)) {
      this.setError(gl.INVALID_ENUM)
      return null
    }

    const framebuffer = this._activeFramebuffer
    if (!framebuffer) {
      this.setError(gl.INVALID_OPERATION)
      return null
    }

    const object = framebuffer._attachments[attachment]
    if (object === null) {
      if (pname === gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE) {
        return gl.NONE
      }
    } else if (object instanceof WebGLTexture) {
      switch (pname) {
        case gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME:
          return object
        case gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE:
          return gl.TEXTURE
        case gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL:
          return framebuffer._attachmentLevel[attachment]
        case gl.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE:
          const face = framebuffer._attachmentFace[attachment]
          if (face === gl.TEXTURE_2D) {
            return 0
          }
          return face
      }
    } else if (object instanceof WebGLRenderbuffer) {
      switch (pname) {
        case gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME:
          return object
        case gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE:
          return gl.RENDERBUFFER
      }
    }

    this.setError(gl.INVALID_ENUM)
    return null
  }

  getProgramParameter (program, pname) {
    pname |= 0
    if (!checkObject(program)) {
      throw new TypeError('getProgramParameter(WebGLProgram, GLenum)')
    } else if (this._checkWrapper(program, WebGLProgram)) {
      switch (pname) {
        case gl.DELETE_STATUS:
          return program._pendingDelete

        case gl.LINK_STATUS:
          return program._linkStatus

        case gl.VALIDATE_STATUS:
          return !!super.getProgramParameter(program._, pname)

        case gl.ATTACHED_SHADERS:
        case gl.ACTIVE_ATTRIBUTES:
        case gl.ACTIVE_UNIFORMS:
          return super.getProgramParameter(program._, pname)
      }
      this.setError(gl.INVALID_ENUM)
    }
    return null
  }

  getProgramInfoLog (program) {
    if (!checkObject(program)) {
      throw new TypeError('getProgramInfoLog(WebGLProgram)')
    } else if (this._checkWrapper(program, WebGLProgram)) {
      return program._linkInfoLog
    }
    return null
  }

  getRenderbufferParameter (target, pname) {
    target |= 0
    pname |= 0
    if (target !== gl.RENDERBUFFER) {
      this.setError(gl.INVALID_ENUM)
      return null
    }
    const renderbuffer = this._activeRenderbuffer
    if (!renderbuffer) {
      this.setError(gl.INVALID_OPERATION)
      return null
    }
    switch (pname) {
      case gl.RENDERBUFFER_INTERNAL_FORMAT:
        return renderbuffer._format
      case gl.RENDERBUFFER_WIDTH:
        return renderbuffer._width
      case gl.RENDERBUFFER_HEIGHT:
        return renderbuffer._height
      case gl.RENDERBUFFER_SIZE:
      case gl.RENDERBUFFER_RED_SIZE:
      case gl.RENDERBUFFER_GREEN_SIZE:
      case gl.RENDERBUFFER_BLUE_SIZE:
      case gl.RENDERBUFFER_ALPHA_SIZE:
      case gl.RENDERBUFFER_DEPTH_SIZE:
      case gl.RENDERBUFFER_STENCIL_SIZE:
        return super.getRenderbufferParameter(target, pname)
    }
    this.setError(gl.INVALID_ENUM)
    return null
  }

  getShaderParameter (shader, pname) {
    pname |= 0
    if (!checkObject(shader)) {
      throw new TypeError('getShaderParameter(WebGLShader, GLenum)')
    } else if (this._checkWrapper(shader, WebGLShader)) {
      switch (pname) {
        case gl.DELETE_STATUS:
          return shader._pendingDelete
        case gl.COMPILE_STATUS:
          return shader._compileStatus
        case gl.SHADER_TYPE:
          return shader._type
      }
      this.setError(gl.INVALID_ENUM)
    }
    return null
  }

  getShaderInfoLog (shader) {
    if (!checkObject(shader)) {
      throw new TypeError('getShaderInfoLog(WebGLShader)')
    } else if (this._checkWrapper(shader, WebGLShader)) {
      return shader._compileInfo
    }
    return null
  }

  getShaderSource (shader) {
    if (!checkObject(shader)) {
      throw new TypeError('Input to getShaderSource must be an object')
    } else if (this._checkWrapper(shader, WebGLShader)) {
      return shader._source
    }
    return null
  }

  getTexParameter (target, pname) {
    target |= 0
    pname |= 0

    if (!this._checkTextureTarget(target)) {
      return null
    }

    const unit = this._getActiveTextureUnit()
    if ((target === gl.TEXTURE_2D && !unit._bind2D) ||
      (target === gl.TEXTURE_CUBE_MAP && !unit._bindCube)) {
      this.setError(gl.INVALID_OPERATION)
      return null
    }

    switch (pname) {
      case gl.TEXTURE_MAG_FILTER:
      case gl.TEXTURE_MIN_FILTER:
      case gl.TEXTURE_WRAP_S:
      case gl.TEXTURE_WRAP_T:
        return super.getTexParameter(target, pname)
    }

    this.setError(gl.INVALID_ENUM)
    return null
  }

  getUniform (program, location) {
    if (!checkObject(program) ||
      !checkObject(location)) {
      throw new TypeError('getUniform(WebGLProgram, WebGLUniformLocation)')
    } else if (!program) {
      this.setError(gl.INVALID_VALUE)
      return null
    } else if (!location) {
      return null
    } else if (this._checkWrapper(program, WebGLProgram)) {
      if (!checkUniform(program, location)) {
        this.setError(gl.INVALID_OPERATION)
        return null
      }
      const data = super.getUniform(program._ | 0, location._ | 0)
      if (!data) {
        return null
      }
      switch (location._activeInfo.type) {
        case gl.FLOAT:
          return data[0]
        case gl.FLOAT_VEC2:
          return new Float32Array(data.slice(0, 2))
        case gl.FLOAT_VEC3:
          return new Float32Array(data.slice(0, 3))
        case gl.FLOAT_VEC4:
          return new Float32Array(data.slice(0, 4))
        case gl.INT:
          return data[0] | 0
        case gl.INT_VEC2:
          return new Int32Array(data.slice(0, 2))
        case gl.INT_VEC3:
          return new Int32Array(data.slice(0, 3))
        case gl.INT_VEC4:
          return new Int32Array(data.slice(0, 4))
        case gl.BOOL:
          return !!data[0]
        case gl.BOOL_VEC2:
          return [!!data[0], !!data[1]]
        case gl.BOOL_VEC3:
          return [!!data[0], !!data[1], !!data[2]]
        case gl.BOOL_VEC4:
          return [!!data[0], !!data[1], !!data[2], !!data[3]]
        case gl.FLOAT_MAT2:
          return new Float32Array(data.slice(0, 4))
        case gl.FLOAT_MAT3:
          return new Float32Array(data.slice(0, 9))
        case gl.FLOAT_MAT4:
          return new Float32Array(data.slice(0, 16))
        case gl.SAMPLER_2D:
        case gl.SAMPLER_CUBE:
          return data[0] | 0
        default:
          return null
      }
    }
    return null
  }

  getUniformLocation (program, name) {
    if (!checkObject(program)) {
      throw new TypeError('getUniformLocation(WebGLProgram, String)')
    }

    name += ''
    if (!isValidString(name)) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (this._checkWrapper(program, WebGLProgram)) {
      const loc = super.getUniformLocation(program._ | 0, name)
      if (loc >= 0) {
        let searchName = name
        if (/\[\d+\]$/.test(name)) {
          searchName = name.replace(/\[\d+\]$/, '[0]')
        }

        let info = null
        for (let i = 0; i < program._uniforms.length; ++i) {
          const infoItem = program._uniforms[i]
          if (infoItem.name === searchName) {
            info = {
              size: infoItem.size,
              type: infoItem.type,
              name: infoItem.name
            }
          }
        }
        if (!info) {
          return null
        }

        const result = new WebGLUniformLocation(
          loc,
          program,
          info)

        // handle array case
        if (/\[0\]$/.test(name)) {
          const baseName = name.replace(/\[0\]$/, '')
          const arrayLocs = []

          // if (offset < 0 || offset >= info.size) {
          //   return null
          // }

          this._saveError()
          for (let i = 0; this.getError() === gl.NO_ERROR; ++i) {
            const xloc = super.getUniformLocation(
              program._ | 0,
              baseName + '[' + i + ']')
            if (this.getError() !== gl.NO_ERROR || xloc < 0) {
              break
            }
            arrayLocs.push(xloc)
          }
          this._restoreError(gl.NO_ERROR)

          result._array = arrayLocs
        } else if (/\[(\d+)\]$/.test(name)) {
          const offset = +(/\[(\d+)\]$/.exec(name))[1]
          if (offset < 0 || offset >= info.size) {
            return null
          }
        }
        return result
      }
    }
    return null
  }

  getVertexAttrib (index, pname) {
    index |= 0
    pname |= 0
    if (index < 0 || index >= this._vertexAttribs.length) {
      this.setError(gl.INVALID_VALUE)
      return null
    }
    const attrib = this._vertexAttribs[index]

    const extInstancing = this._extensions.angle_instanced_arrays
    if (extInstancing) {
      if (pname === extInstancing.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE) {
        return attrib._divisor
      }
    }

    switch (pname) {
      case gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING:
        return attrib._pointerBuffer
      case gl.VERTEX_ATTRIB_ARRAY_ENABLED:
        return attrib._isPointer
      case gl.VERTEX_ATTRIB_ARRAY_SIZE:
        return attrib._inputSize
      case gl.VERTEX_ATTRIB_ARRAY_STRIDE:
        return attrib._inputStride
      case gl.VERTEX_ATTRIB_ARRAY_TYPE:
        return attrib._pointerType
      case gl.VERTEX_ATTRIB_ARRAY_NORMALIZED:
        return attrib._pointerNormal
      case gl.CURRENT_VERTEX_ATTRIB:
        return new Float32Array(attrib._data)
      default:
        this.setError(gl.INVALID_ENUM)
        return null
    }
  }

  getVertexAttribOffset (index, pname) {
    index |= 0
    pname |= 0
    if (index < 0 || index >= this._vertexAttribs.length) {
      this.setError(gl.INVALID_VALUE)
      return null
    }
    if (pname === gl.VERTEX_ATTRIB_ARRAY_POINTER) {
      return this._vertexAttribs[index]._pointerOffset
    } else {
      this.setError(gl.INVALID_ENUM)
      return null
    }
  }

  hint (target, mode) {
    target |= 0
    mode |= 0

    if (target !== gl.GENERATE_MIPMAP_HINT) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (mode !== gl.FASTEST &&
      mode !== gl.NICEST &&
      mode !== gl.DONT_CARE) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    return super.hint(target, mode)
  }

  isBuffer (object) {
    if (!this._isObject(object, 'isBuffer', WebGLBuffer)) return false
    return super.isBuffer(object._ | 0)
  }

  isFramebuffer (object) {
    if (!this._isObject(object, 'isFramebuffer', WebGLFramebuffer)) return false
    return super.isFramebuffer(object._ | 0)
  }

  isProgram (object) {
    if (!this._isObject(object, 'isProgram', WebGLProgram)) return false
    return super.isProgram(object._ | 0)
  }

  isRenderbuffer (object) {
    if (!this._isObject(object, 'isRenderbuffer', WebGLRenderbuffer)) return false
    return super.isRenderbuffer(object._ | 0)
  }

  isShader (object) {
    if (!this._isObject(object, 'isShader', WebGLShader)) return false
    return super.isShader(object._ | 0)
  }

  isTexture (object) {
    if (!this._isObject(object, 'isTexture', WebGLTexture)) return false
    return super.isTexture(object._ | 0)
  }

  isEnabled (cap) {
    return super.isEnabled(cap | 0)
  }

  lineWidth (width) {
    if (isNaN(width)) {
      this.setError(gl.INVALID_VALUE)
      return
    }
    return super.lineWidth(+width)
  }

  linkProgram (program) {
    if (!checkObject(program)) {
      throw new TypeError('linkProgram(WebGLProgram)')
    }
    if (this._checkWrapper(program, WebGLProgram)) {
      program._linkCount += 1
      program._attributes = []
      const prevError = this.getError()
      super.linkProgram(program._ | 0)
      const error = this.getError()
      if (error === gl.NO_ERROR) {
        program._linkStatus = this._fixupLink(program)
      }
      this.getError()
      this.setError(prevError || error)
    }
  }

  pixelStorei (pname, param) {
    pname |= 0
    param |= 0
    if (pname === gl.UNPACK_ALIGNMENT) {
      if (param === 1 ||
        param === 2 ||
        param === 4 ||
        param === 8) {
        this._unpackAlignment = param
      } else {
        this.setError(gl.INVALID_VALUE)
        return
      }
    } else if (pname === gl.PACK_ALIGNMENT) {
      if (param === 1 ||
        param === 2 ||
        param === 4 ||
        param === 8) {
        this._packAlignment = param
      } else {
        this.setError(gl.INVALID_VALUE)
        return
      }
    } else if (pname === gl.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
      if (!(param === gl.NONE || param === gl.BROWSER_DEFAULT_WEBGL)) {
        this.setError(gl.INVALID_VALUE)
        return
      }
    }
    return super.pixelStorei(pname, param)
  }

  polygonOffset (factor, units) {
    return super.polygonOffset(+factor, +units)
  }

  readPixels (x, y, width, height, format, type, pixels) {
    x |= 0
    y |= 0
    width |= 0
    height |= 0

    if (this._extensions.oes_texture_float && type === gl.FLOAT && format === gl.RGBA) {
    } else if (format === gl.RGB ||
      format === gl.ALPHA ||
      type !== gl.UNSIGNED_BYTE) {
      this.setError(gl.INVALID_OPERATION)
      return
    } else if (format !== gl.RGBA) {
      this.setError(gl.INVALID_ENUM)
      return
    } else if (
      width < 0 ||
      height < 0 ||
      !(pixels instanceof Uint8Array)) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (!this._framebufferOk()) {
      return
    }

    let rowStride = width * 4
    if (rowStride % this._packAlignment !== 0) {
      rowStride += this._packAlignment - (rowStride % this._packAlignment)
    }

    const imageSize = rowStride * (height - 1) + width * 4
    if (imageSize <= 0) {
      return
    }
    if (pixels.length < imageSize) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    // Handle reading outside the window
    let viewWidth = this.drawingBufferWidth
    let viewHeight = this.drawingBufferHeight

    if (this._activeFramebuffer) {
      viewWidth = this._activeFramebuffer._width
      viewHeight = this._activeFramebuffer._height
    }

    const pixelData = unpackTypedArray(pixels)

    if (x >= viewWidth || x + width <= 0 ||
      y >= viewHeight || y + height <= 0) {
      for (let i = 0; i < pixelData.length; ++i) {
        pixelData[i] = 0
      }
    } else if (x < 0 || x + width > viewWidth ||
      y < 0 || y + height > viewHeight) {
      for (let i = 0; i < pixelData.length; ++i) {
        pixelData[i] = 0
      }

      let nx = x
      let nWidth = width
      if (x < 0) {
        nWidth += x
        nx = 0
      }
      if (nx + width > viewWidth) {
        nWidth = viewWidth - nx
      }
      let ny = y
      let nHeight = height
      if (y < 0) {
        nHeight += y
        ny = 0
      }
      if (ny + height > viewHeight) {
        nHeight = viewHeight - ny
      }

      let nRowStride = nWidth * 4
      if (nRowStride % this._packAlignment !== 0) {
        nRowStride += this._packAlignment - (nRowStride % this._packAlignment)
      }

      if (nWidth > 0 && nHeight > 0) {
        const subPixels = new Uint8Array(nRowStride * nHeight)
        super.readPixels(
          nx,
          ny,
          nWidth,
          nHeight,
          format,
          type,
          subPixels)

        const offset = 4 * (nx - x) + (ny - y) * rowStride
        for (let j = 0; j < nHeight; ++j) {
          for (let i = 0; i < nWidth; ++i) {
            for (let k = 0; k < 4; ++k) {
              pixelData[offset + j * rowStride + 4 * i + k] =
                subPixels[j * nRowStride + 4 * i + k]
            }
          }
        }
      }
    } else {
      super.readPixels(
        x,
        y,
        width,
        height,
        format,
        type,
        pixelData)
    }
  }

  renderbufferStorage (
    target,
    internalFormat,
    width,
    height) {
    target |= 0
    internalFormat |= 0
    width |= 0
    height |= 0

    if (target !== gl.RENDERBUFFER) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    const renderbuffer = this._activeRenderbuffer
    if (!renderbuffer) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (internalFormat !== gl.RGBA4 &&
      internalFormat !== gl.RGB565 &&
      internalFormat !== gl.RGB5_A1 &&
      internalFormat !== gl.DEPTH_COMPONENT16 &&
      internalFormat !== gl.STENCIL_INDEX &&
      internalFormat !== gl.STENCIL_INDEX8 &&
      internalFormat !== gl.DEPTH_STENCIL) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    this._saveError()
    super.renderbufferStorage(
      target,
      internalFormat,
      width,
      height)
    const error = this.getError()
    this._restoreError(error)
    if (error !== gl.NO_ERROR) {
      return
    }

    renderbuffer._width = width
    renderbuffer._height = height
    renderbuffer._format = internalFormat

    const activeFramebuffer = this._activeFramebuffer
    if (activeFramebuffer) {
      let needsUpdate = false
      const attachments = this._getAttachments()
      for (let i = 0; i < attachments.length; ++i) {
        if (activeFramebuffer._attachments[attachments[i]] === renderbuffer) {
          needsUpdate = true
          break
        }
      }
      if (needsUpdate) {
        this._updateFramebufferAttachments(this._activeFramebuffer)
      }
    }
  }

  resize (width, height) {
    width = width | 0
    height = height | 0
    if (!(width > 0 && height > 0)) {
      throw new Error('Invalid surface dimensions')
    } else if (width !== this.drawingBufferWidth ||
      height !== this.drawingBufferHeight) {
      this._resizeDrawingBuffer(width, height)
      this.drawingBufferWidth = width
      this.drawingBufferHeight = height
    }
  }

  sampleCoverage (value, invert) {
    return super.sampleCoverage(+value, !!invert)
  }

  scissor (x, y, width, height) {
    return super.scissor(x | 0, y | 0, width | 0, height | 0)
  }

  shaderSource (shader, source) {
    if (!checkObject(shader)) {
      throw new TypeError('shaderSource(WebGLShader, String)')
    }
    if (!shader || (!source && typeof source !== 'string')) {
      this.setError(gl.INVALID_VALUE)
      return
    }
    source += ''
    if (!isValidString(source)) {
      this.setError(gl.INVALID_VALUE)
    } else if (this._checkWrapper(shader, WebGLShader)) {
      super.shaderSource(shader._ | 0, this._wrapShader(shader._type, source)) // eslint-disable-line
      shader._source = source
    }
  }

  stencilFunc (func, ref, mask) {
    return super.stencilFunc(func | 0, ref | 0, mask | 0)
  }

  stencilFuncSeparate (face, func, ref, mask) {
    return super.stencilFuncSeparate(face | 0, func | 0, ref | 0, mask | 0)
  }

  stencilMask (mask) {
    return super.stencilMask(mask | 0)
  }

  stencilMaskSeparate (face, mask) {
    return super.stencilMaskSeparate(face | 0, mask | 0)
  }

  stencilOp (fail, zfail, zpass) {
    return super.stencilOp(fail | 0, zfail | 0, zpass | 0)
  }

  stencilOpSeparate (face, fail, zfail, zpass) {
    return super.stencilOpSeparate(face | 0, fail | 0, zfail | 0, zpass | 0)
  }

  texImage2D (
    target,
    level,
    internalFormat,
    width,
    height,
    border,
    format,
    type,
    pixels) {
    if (arguments.length === 6) {
      pixels = border
      type = height
      format = width

      pixels = extractImageData(pixels)

      if (pixels == null) {
        throw new TypeError('texImage2D(GLenum, GLint, GLenum, GLint, GLenum, GLenum, ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement)')
      }

      width = pixels.width
      height = pixels.height
      pixels = pixels.data
    }

    target |= 0
    level |= 0
    internalFormat |= 0
    width |= 0
    height |= 0
    border |= 0
    format |= 0
    type |= 0

    if (typeof pixels !== 'object' && pixels !== void 0) {
      throw new TypeError('texImage2D(GLenum, GLint, GLenum, GLint, GLint, GLint, GLenum, GLenum, Uint8Array)')
    }

    if (!checkFormat(format) || !checkFormat(internalFormat)) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (type === gl.FLOAT && !this._extensions.oes_texture_float) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    const texture = this._getTexImage(target)
    if (!texture || format !== internalFormat) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    const pixelSize = this._computePixelSize(type, format)
    if (pixelSize === 0) {
      return
    }

    if (!this._checkDimensions(
      target,
      width,
      height,
      level)) {
      return
    }

    const data = convertPixels(pixels)
    const rowStride = this._computeRowStride(width, pixelSize)
    const imageSize = rowStride * height

    if (data && data.length < imageSize) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (border !== 0 ||
      (validCubeTarget(target) && width !== height)) {
      this.setError(gl.INVALID_VALUE)
      return
    }
    // Need to check for out of memory error
    this._saveError()
    super.texImage2D(
      target,
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      data)
    const error = this.getError()
    this._restoreError(error)
    if (error !== gl.NO_ERROR) {
      return
    }

    // Save width and height at level
    texture._levelWidth[level] = width
    texture._levelHeight[level] = height
    texture._format = format
    texture._type = type

    const activeFramebuffer = this._activeFramebuffer
    if (activeFramebuffer) {
      let needsUpdate = false
      const attachments = this._getAttachments()
      for (let i = 0; i < attachments.length; ++i) {
        if (activeFramebuffer._attachments[attachments[i]] === texture) {
          needsUpdate = true
          break
        }
      }
      if (needsUpdate) {
        this._updateFramebufferAttachments(this._activeFramebuffer)
      }
    }
  }

  texSubImage2D (
    target,
    level,
    xoffset,
    yoffset,
    width,
    height,
    format,
    type,
    pixels) {
    if (arguments.length === 7) {
      pixels = format
      type = height
      format = width

      pixels = extractImageData(pixels)

      if (pixels == null) {
        throw new TypeError('texSubImage2D(GLenum, GLint, GLint, GLint, GLenum, GLenum, ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement)')
      }

      width = pixels.width
      height = pixels.height
      pixels = pixels.data
    }

    if (typeof pixels !== 'object') {
      throw new TypeError('texSubImage2D(GLenum, GLint, GLint, GLint, GLint, GLint, GLenum, GLenum, Uint8Array)')
    }

    target |= 0
    level |= 0
    xoffset |= 0
    yoffset |= 0
    width |= 0
    height |= 0
    format |= 0
    type |= 0

    const texture = this._getTexImage(target)
    if (!texture) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    if (type === gl.FLOAT && !this._extensions.oes_texture_float) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    const pixelSize = this._computePixelSize(type, format)
    if (pixelSize === 0) {
      return
    }

    if (!this._checkDimensions(
      target,
      width,
      height,
      level)) {
      return
    }

    if (xoffset < 0 || yoffset < 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    const data = convertPixels(pixels)
    const rowStride = this._computeRowStride(width, pixelSize)
    const imageSize = rowStride * height

    if (!data || data.length < imageSize) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    super.texSubImage2D(
      target,
      level,
      xoffset,
      yoffset,
      width,
      height,
      format,
      type,
      data)
  }

  texParameterf (target, pname, param) {
    target |= 0
    pname |= 0
    param = +param
    if (this._checkTextureTarget(target)) {
      this._verifyTextureCompleteness(target, pname, param)
      switch (pname) {
        case gl.TEXTURE_MIN_FILTER:
        case gl.TEXTURE_MAG_FILTER:
        case gl.TEXTURE_WRAP_S:
        case gl.TEXTURE_WRAP_T:
          return super.texParameterf(target, pname, param)
      }

      this.setError(gl.INVALID_ENUM)
    }
  }

  texParameteri (target, pname, param) {
    target |= 0
    pname |= 0
    param |= 0

    if (this._checkTextureTarget(target)) {
      this._verifyTextureCompleteness(target, pname, param)
      switch (pname) {
        case gl.TEXTURE_MIN_FILTER:
        case gl.TEXTURE_MAG_FILTER:
        case gl.TEXTURE_WRAP_S:
        case gl.TEXTURE_WRAP_T:
          return super.texParameteri(target, pname, param)
      }

      this.setError(gl.INVALID_ENUM)
    }
  }

  useProgram (program) {
    if (!checkObject(program)) {
      throw new TypeError('useProgram(WebGLProgram)')
    } else if (!program) {
      this._switchActiveProgram(this._activeProgram)
      this._activeProgram = null
      return super.useProgram(0)
    } else if (this._checkWrapper(program, WebGLProgram)) {
      if (this._activeProgram !== program) {
        this._switchActiveProgram(this._activeProgram)
        this._activeProgram = program
        program._refCount += 1
      }
      return super.useProgram(program._ | 0)
    }
  }

  validateProgram (program) {
    if (this._checkWrapper(program, WebGLProgram)) {
      super.validateProgram(program._ | 0)
      const error = this.getError()
      if (error === gl.NO_ERROR) {
        program._linkInfoLog = super.getProgramInfoLog(program._ | 0)
      }
      this.getError()
      this.setError(error)
    }
  }

  vertexAttribPointer (
    index,
    size,
    type,
    normalized,
    stride,
    offset) {
    if (stride < 0 || offset < 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    index |= 0
    size |= 0
    type |= 0
    normalized = !!normalized
    stride |= 0
    offset |= 0

    if (stride < 0 ||
      offset < 0 ||
      index < 0 || index >= this._vertexAttribs.length ||
      !(size === 1 || size === 2 || size === 3 || size === 4)) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    if (this._activeArrayBuffer === null) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    // fixed, int and unsigned int aren't allowed in WebGL
    const byteSize = typeSize(type)
    if (byteSize === 0 ||
      type === gl.INT ||
      type === gl.UNSIGNED_INT) {
      this.setError(gl.INVALID_ENUM)
      return
    }

    if (stride > 255 || stride < 0) {
      this.setError(gl.INVALID_VALUE)
      return
    }

    // stride and offset must be multiples of size
    if ((stride % byteSize) !== 0 ||
      (offset % byteSize) !== 0) {
      this.setError(gl.INVALID_OPERATION)
      return
    }

    // Call vertex attrib pointer
    super.vertexAttribPointer(index, size, type, normalized, stride, offset)

    // Save attribute pointer state
    const attrib = this._vertexAttribs[index]

    if (attrib._pointerBuffer &&
      attrib._pointerBuffer !== this._activeArrayBuffer) {
      attrib._pointerBuffer._refCount -= 1
      attrib._pointerBuffer._checkDelete()
    }

    this._activeArrayBuffer._refCount += 1
    attrib._pointerBuffer = this._activeArrayBuffer
    attrib._pointerSize = size * byteSize
    attrib._pointerOffset = offset
    attrib._pointerStride = stride || (size * byteSize)
    attrib._pointerType = type
    attrib._pointerNormal = normalized
    attrib._inputStride = stride
    attrib._inputSize = size
  }

  viewport (x, y, width, height) {
    return super.viewport(x | 0, y | 0, width | 0, height | 0)
  }

  _allocateDrawingBuffer (width, height) {
    this._drawingBuffer = new WebGLDrawingBufferWrapper(
      super.createFramebuffer(),
      super.createTexture(),
      super.createRenderbuffer())

    this._resizeDrawingBuffer(width, height)
  }

  isContextLost () {
    return false
  }

  compressedTexImage2D () {
    // TODO not yet implemented
  }

  compressedTexSubImage2D () {
    // TODO not yet implemented
  }

  _checkUniformValid (location, v0, name, count, type) {
    if (!checkObject(location)) {
      throw new TypeError(`${name}(WebGLUniformLocation, ...)`)
    } else if (!location) {
      return false
    } else if (this._checkLocationActive(location)) {
      const utype = location._activeInfo.type
      if (utype === gl.SAMPLER_2D || utype === gl.SAMPLER_CUBE) {
        if (count !== 1) {
          this.setError(gl.INVALID_VALUE)
          return
        }
        if (type !== 'i') {
          this.setError(gl.INVALID_OPERATION)
          return
        }
        if (v0 < 0 || v0 >= this._textureUnits.length) {
          this.setError(gl.INVALID_VALUE)
          return false
        }
      }
      if (uniformTypeSize(utype) > count) {
        this.setError(gl.INVALID_OPERATION)
        return false
      }
      return true
    }
    return false
  }

  _checkUniformValueValid (location, value, name, count, type) {
    if (!checkObject(location) ||
      !checkObject(value)) {
      throw new TypeError(`${name}v(WebGLUniformLocation, Array)`)
    } else if (!location) {
      return false
    } else if (!this._checkLocationActive(location)) {
      return false
    } else if (typeof value !== 'object' || !value || typeof value.length !== 'number') {
      throw new TypeError(`Second argument to ${name} must be array`)
    } else if (uniformTypeSize(location._activeInfo.type) > count) {
      this.setError(gl.INVALID_OPERATION)
      return false
    } else if (value.length >= count && value.length % count === 0) {
      if (location._array) {
        return true
      } else if (value.length === count) {
        return true
      } else {
        this.setError(gl.INVALID_OPERATION)
        return false
      }
    }
    this.setError(gl.INVALID_VALUE)
    return false
  }

  uniform1f (location, v0) {
    if (!this._checkUniformValid(location, v0, 'uniform1f', 1, 'f')) return
    super.uniform1f(location._ | 0, v0)
  }
  uniform1fv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform1fv', 1, 'f')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && i < value.length; ++i) {
        const loc = locs[i]
        super.uniform1f(loc, value[i])
      }
      return
    }
    super.uniform1f(location._ | 0, value[0])
  }
  uniform1i (location, v0) {
    if (!this._checkUniformValid(location, v0, 'uniform1i', 1, 'i')) return
    super.uniform1i(location._ | 0, v0)
  }
  uniform1iv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform1iv', 1, 'i')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && i < value.length; ++i) {
        const loc = locs[i]
        super.uniform1i(loc, value[i])
      }
      return
    }
    this.uniform1i(location, value[0])
  }

  uniform2f (location, v0, v1) {
    if (!this._checkUniformValid(location, v0, 'uniform2f', 2, 'f')) return
    super.uniform2f(location._ | 0, v0, v1)
  }
  uniform2fv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform2fv', 2, 'f')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && 2 * i < value.length; ++i) {
        const loc = locs[i]
        super.uniform2f(loc, value[2 * i], value[(2 * i) + 1])
      }
      return
    }
    super.uniform2f(location._ | 0, value[0], value[1])
  }
  uniform2i (location, v0, v1) {
    if (!this._checkUniformValid(location, v0, 'uniform2i', 2, 'i')) return
    super.uniform2i(location._ | 0, v0, v1)
  }
  uniform2iv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform2iv', 2, 'i')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && 2 * i < value.length; ++i) {
        const loc = locs[i]
        super.uniform2i(loc, value[2 * i], value[2 * i + 1])
      }
      return
    }
    this.uniform2i(location, value[0], value[1])
  }

  uniform3f (location, v0, v1, v2) {
    if (!this._checkUniformValid(location, v0, 'uniform3f', 3, 'f')) return
    super.uniform3f(location._ | 0, v0, v1, v2)
  }
  uniform3fv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform3fv', 3, 'f')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && 3 * i < value.length; ++i) {
        const loc = locs[i]
        super.uniform3f(loc, value[3 * i], value[3 * i + 1], value[3 * i + 2])
      }
      return
    }
    super.uniform3f(location._ | 0, value[0], value[1], value[2])
  }
  uniform3i (location, v0, v1, v2) {
    if (!this._checkUniformValid(location, v0, 'uniform3i', 3, 'i')) return
    super.uniform3i(location._ | 0, v0, v1, v2)
  }
  uniform3iv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform3iv', 3, 'i')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && 3 * i < value.length; ++i) {
        const loc = locs[i]
        super.uniform3i(loc, value[3 * i], value[3 * i + 1], value[3 * i + 2])
      }
      return
    }
    this.uniform3i(location, value[0], value[1], value[2])
  }

  uniform4f (location, v0, v1, v2, v3) {
    if (!this._checkUniformValid(location, v0, 'uniform4f', 4, 'f')) return
    super.uniform4f(location._ | 0, v0, v1, v2, v3)
  }
  uniform4fv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform4fv', 4, 'f')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && 4 * i < value.length; ++i) {
        const loc = locs[i]
        super.uniform4f(loc, value[4 * i], value[4 * i + 1], value[4 * i + 2], value[4 * i + 3])
      }
      return
    }
    super.uniform4f(location._ | 0, value[0], value[1], value[2], value[3])
  }
  uniform4i (location, v0, v1, v2, v3) {
    if (!this._checkUniformValid(location, v0, 'uniform4i', 4, 'i')) return
    super.uniform4i(location._ | 0, v0, v1, v2, v3)
  }
  uniform4iv (location, value) {
    if (!this._checkUniformValueValid(location, value, 'uniform4iv', 4, 'i')) return
    if (location._array) {
      const locs = location._array
      for (let i = 0; i < locs.length && 4 * i < value.length; ++i) {
        const loc = locs[i]
        super.uniform4i(loc, value[4 * i], value[4 * i + 1], value[4 * i + 2], value[4 * i + 3])
      }
      return
    }
    this.uniform4i(location, value[0], value[1], value[2], value[3])
  }

  _checkUniformMatrix (location, transpose, value, name, count) {
    if (!checkObject(location) ||
      typeof value !== 'object') {
      throw new TypeError(name + '(WebGLUniformLocation, Boolean, Array)')
    } else if (!!transpose ||
      typeof value !== 'object' ||
      value === null ||
      !value.length ||
      value.length % count * count !== 0) {
      this.setError(gl.INVALID_VALUE)
      return false
    }
    if (!location) {
      return false
    }
    if (!this._checkLocationActive(location)) {
      return false
    }

    if (value.length === count * count) {
      return true
    } else if (location._array) {
      return true
    }
    this.setError(gl.INVALID_VALUE)
    return false
  }
  uniformMatrix2fv (location, transpose, value) {
    if (!this._checkUniformMatrix(location, transpose, value, 'uniformMatrix2fv', 2)) return
    const data = new Float32Array(value)
    super.uniformMatrix2fv(
      location._ | 0,
      !!transpose,
      data)
  }
  uniformMatrix3fv (location, transpose, value) {
    if (!this._checkUniformMatrix(location, transpose, value, 'uniformMatrix3fv', 3)) return
    const data = new Float32Array(value)
    super.uniformMatrix3fv(
      location._ | 0,
      !!transpose,
      data)
  }
  uniformMatrix4fv (location, transpose, value) {
    if (!this._checkUniformMatrix(location, transpose, value, 'uniformMatrix4fv', 4)) return
    const data = new Float32Array(value)
    super.uniformMatrix4fv(
      location._ | 0,
      !!transpose,
      data)
  }

  vertexAttrib1f (index, v0) {
    index |= 0
    if (!this._checkVertexIndex(index)) return
    const data = this._vertexAttribs[index]._data
    data[3] = 1
    data[1] = data[2] = 0
    data[0] = v0
    return super.vertexAttrib1f(index | 0, +v0)
  }
  vertexAttrib2f (index, v0, v1) {
    index |= 0
    if (!this._checkVertexIndex(index)) return
    const data = this._vertexAttribs[index]._data
    data[3] = 1
    data[2] = 0
    data[1] = v1
    data[0] = v0
    return super.vertexAttrib2f(index | 0, +v0, +v1)
  }
  vertexAttrib3f (index, v0, v1, v2) {
    index |= 0
    if (!this._checkVertexIndex(index)) return
    const data = this._vertexAttribs[index]._data
    data[3] = 1
    data[2] = v2
    data[1] = v1
    data[0] = v0
    return super.vertexAttrib3f(index | 0, +v0, +v1, +v2)
  }
  vertexAttrib4f (index, v0, v1, v2, v3) {
    index |= 0
    if (!this._checkVertexIndex(index)) return
    const data = this._vertexAttribs[index]._data
    data[3] = v3
    data[2] = v2
    data[1] = v1
    data[0] = v0
    return super.vertexAttrib4f(index | 0, +v0, +v1, +v2, +v3)
  }

  vertexAttrib1fv (index, value) {
    if (typeof value !== 'object' || value === null || value.length < 1) {
      this.setError(gl.INVALID_OPERATION)
      return
    }
    const data = this._vertexAttribs[index]._data
    data[3] = 1
    data[2] = 0
    data[1] = 0
    data[0] = value[0]
    return super.vertexAttrib1f(index | 0, +value[0])
  }
  vertexAttrib2fv (index, value) {
    if (typeof value !== 'object' || value === null || value.length < 2) {
      this.setError(gl.INVALID_OPERATION)
      return
    }
    const data = this._vertexAttribs[index]._data
    data[3] = 1
    data[2] = 0
    data[1] = value[1]
    data[0] = value[0]
    return super.vertexAttrib2f(index | 0, +value[0], +value[1])
  }
  vertexAttrib3fv (index, value) {
    if (typeof value !== 'object' || value === null || value.length < 3) {
      this.setError(gl.INVALID_OPERATION)
      return
    }
    const data = this._vertexAttribs[index]._data
    data[3] = 1
    data[2] = value[2]
    data[1] = value[1]
    data[0] = value[0]
    return super.vertexAttrib3f(index | 0, +value[0], +value[1], +value[2])
  }
  vertexAttrib4fv (index, value) {
    if (typeof value !== 'object' || value === null || value.length < 4) {
      this.setError(gl.INVALID_OPERATION)
      return
    }
    const data = this._vertexAttribs[index]._data
    data[3] = value[3]
    data[2] = value[2]
    data[1] = value[1]
    data[0] = value[0]
    return super.vertexAttrib4f(index | 0, +value[0], +value[1], +value[2], +value[3])
  }
}

module.exports = { WebGLRenderingContext, wrapContext }

},{"../../package.json":9,"./extensions/angle-instanced-arrays":11,"./extensions/oes-element-index-unit":12,"./extensions/oes-texture-float":13,"./extensions/stackgl-destroy-context":14,"./extensions/stackgl-resize-drawing-buffer":15,"./extensions/webgl-draw-buffers":16,"./native-gl":18,"./utils":20,"./webgl-active-info":21,"./webgl-buffer":22,"./webgl-drawing-buffer-wrapper":24,"./webgl-framebuffer":25,"./webgl-program":26,"./webgl-renderbuffer":27,"./webgl-shader":30,"./webgl-shader-precision-format":29,"./webgl-texture":32,"./webgl-uniform-location":33,"bit-twiddle":3,"glsl-tokenizer/string":41}],29:[function(require,module,exports){
class WebGLShaderPrecisionFormat {
  constructor (_) {
    this.rangeMin = _.rangeMin
    this.rangeMax = _.rangeMax
    this.precision = _.precision
  }
}

module.exports = { WebGLShaderPrecisionFormat }

},{}],30:[function(require,module,exports){
const { gl } = require('./native-gl')
const { Linkable } = require('./linkable')

class WebGLShader extends Linkable {
  constructor (_, ctx, type) {
    super(_)
    this._type = type
    this._ctx = ctx
    this._source = ''
    this._compileStatus = false
    this._compileInfo = ''
  }

  _performDelete () {
    const ctx = this._ctx
    delete ctx._shaders[this._ | 0]
    gl.deleteShader.call(ctx, this._ | 0)
  }
}

module.exports = { WebGLShader }

},{"./linkable":17,"./native-gl":18}],31:[function(require,module,exports){
class WebGLTextureUnit {
  constructor (ctx, idx) {
    this._ctx = ctx
    this._idx = idx
    this._mode = 0
    this._bind2D = null
    this._bindCube = null
  }
}

module.exports = { WebGLTextureUnit }

},{}],32:[function(require,module,exports){
const { Linkable } = require('./linkable')
const { gl } = require('./native-gl')

class WebGLTexture extends Linkable {
  constructor (_, ctx) {
    super(_)
    this._ctx = ctx
    this._binding = 0
    this._levelWidth = new Int32Array(32)
    this._levelHeight = new Int32Array(32)
    this._format = 0
    this._type = 0
    this._complete = true
  }

  _performDelete () {
    const ctx = this._ctx
    delete ctx._textures[this._ | 0]
    gl.deleteTexture.call(ctx, this._ | 0)
  }
}

module.exports = { WebGLTexture }

},{"./linkable":17,"./native-gl":18}],33:[function(require,module,exports){
class WebGLUniformLocation {
  constructor (_, program, info) {
    this._ = _
    this._program = program
    this._linkCount = program._linkCount
    this._activeInfo = info
    this._array = null
  }
}

module.exports = { WebGLUniformLocation }

},{}],34:[function(require,module,exports){
const { gl } = require('./native-gl')

class WebGLVertexAttribute {
  constructor (ctx, idx) {
    this._ctx = ctx
    this._idx = idx
    this._isPointer = false
    this._pointerBuffer = null
    this._pointerOffset = 0
    this._pointerSize = 0
    this._pointerStride = 0
    this._pointerType = gl.FLOAT
    this._pointerNormal = false
    this._divisor = 0
    this._inputSize = 4
    this._inputStride = 0
    this._data = new Float32Array([0, 0, 0, 1])
  }
}

module.exports = { WebGLVertexAttribute }

},{"./native-gl":18}],35:[function(require,module,exports){
module.exports = tokenize

var literals100 = require('./lib/literals')
  , operators = require('./lib/operators')
  , builtins100 = require('./lib/builtins')
  , literals300es = require('./lib/literals-300es')
  , builtins300es = require('./lib/builtins-300es')

var NORMAL = 999          // <-- never emitted
  , TOKEN = 9999          // <-- never emitted
  , BLOCK_COMMENT = 0
  , LINE_COMMENT = 1
  , PREPROCESSOR = 2
  , OPERATOR = 3
  , INTEGER = 4
  , FLOAT = 5
  , IDENT = 6
  , BUILTIN = 7
  , KEYWORD = 8
  , WHITESPACE = 9
  , EOF = 10
  , HEX = 11

var map = [
    'block-comment'
  , 'line-comment'
  , 'preprocessor'
  , 'operator'
  , 'integer'
  , 'float'
  , 'ident'
  , 'builtin'
  , 'keyword'
  , 'whitespace'
  , 'eof'
  , 'integer'
]

function tokenize(opt) {
  var i = 0
    , total = 0
    , mode = NORMAL
    , c
    , last
    , content = []
    , tokens = []
    , token_idx = 0
    , token_offs = 0
    , line = 1
    , col = 0
    , start = 0
    , isnum = false
    , isoperator = false
    , input = ''
    , len

  opt = opt || {}
  var allBuiltins = builtins100
  var allLiterals = literals100
  if (opt.version === '300 es') {
    allBuiltins = builtins300es
    allLiterals = literals300es
  }

  // cache by name
  var builtinsDict = {}, literalsDict = {}
  for (var i = 0; i < allBuiltins.length; i++) {
    builtinsDict[allBuiltins[i]] = true
  }
  for (var i = 0; i < allLiterals.length; i++) {
    literalsDict[allLiterals[i]] = true
  }

  return function(data) {
    tokens = []
    if (data !== null) return write(data)
    return end()
  }

  function token(data) {
    if (data.length) {
      tokens.push({
        type: map[mode]
      , data: data
      , position: start
      , line: line
      , column: col
      })
    }
  }

  function write(chunk) {
    i = 0

    if (chunk.toString) chunk = chunk.toString()

    input += chunk.replace(/\r\n/g, '\n')
    len = input.length


    var last

    while(c = input[i], i < len) {
      last = i

      switch(mode) {
        case BLOCK_COMMENT: i = block_comment(); break
        case LINE_COMMENT: i = line_comment(); break
        case PREPROCESSOR: i = preprocessor(); break
        case OPERATOR: i = operator(); break
        case INTEGER: i = integer(); break
        case HEX: i = hex(); break
        case FLOAT: i = decimal(); break
        case TOKEN: i = readtoken(); break
        case WHITESPACE: i = whitespace(); break
        case NORMAL: i = normal(); break
      }

      if(last !== i) {
        switch(input[last]) {
          case '\n': col = 0; ++line; break
          default: ++col; break
        }
      }
    }

    total += i
    input = input.slice(i)
    return tokens
  }

  function end(chunk) {
    if(content.length) {
      token(content.join(''))
    }

    mode = EOF
    token('(eof)')
    return tokens
  }

  function normal() {
    content = content.length ? [] : content

    if(last === '/' && c === '*') {
      start = total + i - 1
      mode = BLOCK_COMMENT
      last = c
      return i + 1
    }

    if(last === '/' && c === '/') {
      start = total + i - 1
      mode = LINE_COMMENT
      last = c
      return i + 1
    }

    if(c === '#') {
      mode = PREPROCESSOR
      start = total + i
      return i
    }

    if(/\s/.test(c)) {
      mode = WHITESPACE
      start = total + i
      return i
    }

    isnum = /\d/.test(c)
    isoperator = /[^\w_]/.test(c)

    start = total + i
    mode = isnum ? INTEGER : isoperator ? OPERATOR : TOKEN
    return i
  }

  function whitespace() {
    if(/[^\s]/g.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function preprocessor() {
    if((c === '\r' || c === '\n') && last !== '\\') {
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }

  function line_comment() {
    return preprocessor()
  }

  function block_comment() {
    if(c === '/' && last === '*') {
      content.push(c)
      token(content.join(''))
      mode = NORMAL
      return i + 1
    }

    content.push(c)
    last = c
    return i + 1
  }

  function operator() {
    if(last === '.' && /\d/.test(c)) {
      mode = FLOAT
      return i
    }

    if(last === '/' && c === '*') {
      mode = BLOCK_COMMENT
      return i
    }

    if(last === '/' && c === '/') {
      mode = LINE_COMMENT
      return i
    }

    if(c === '.' && content.length) {
      while(determine_operator(content));

      mode = FLOAT
      return i
    }

    if(c === ';' || c === ')' || c === '(') {
      if(content.length) while(determine_operator(content));
      token(c)
      mode = NORMAL
      return i + 1
    }

    var is_composite_operator = content.length === 2 && c !== '='
    if(/[\w_\d\s]/.test(c) || is_composite_operator) {
      while(determine_operator(content));
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function determine_operator(buf) {
    var j = 0
      , idx
      , res

    do {
      idx = operators.indexOf(buf.slice(0, buf.length + j).join(''))
      res = operators[idx]

      if(idx === -1) {
        if(j-- + buf.length > 0) continue
        res = buf.slice(0, 1).join('')
      }

      token(res)

      start += res.length
      content = content.slice(res.length)
      return content.length
    } while(1)
  }

  function hex() {
    if(/[^a-fA-F0-9]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function integer() {
    if(c === '.') {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      mode = FLOAT
      last = c
      return i + 1
    }

    if(c === 'x' && content.length === 1 && content[0] === '0') {
      mode = HEX
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function decimal() {
    if(c === 'f') {
      content.push(c)
      last = c
      i += 1
    }

    if(/[eE]/.test(c)) {
      content.push(c)
      last = c
      return i + 1
    }

    if ((c === '-' || c === '+') && /[eE]/.test(last)) {
      content.push(c)
      last = c
      return i + 1
    }

    if(/[^\d]/.test(c)) {
      token(content.join(''))
      mode = NORMAL
      return i
    }

    content.push(c)
    last = c
    return i + 1
  }

  function readtoken() {
    if(/[^\d\w_]/.test(c)) {
      var contentstr = content.join('')
      if(literalsDict[contentstr]) {
        mode = KEYWORD
      } else if(builtinsDict[contentstr]) {
        mode = BUILTIN
      } else {
        mode = IDENT
      }
      token(content.join(''))
      mode = NORMAL
      return i
    }
    content.push(c)
    last = c
    return i + 1
  }
}

},{"./lib/builtins":37,"./lib/builtins-300es":36,"./lib/literals":39,"./lib/literals-300es":38,"./lib/operators":40}],36:[function(require,module,exports){
// 300es builtins/reserved words that were previously valid in v100
var v100 = require('./builtins')

// The texture2D|Cube functions have been removed
// And the gl_ features are updated
v100 = v100.slice().filter(function (b) {
  return !/^(gl\_|texture)/.test(b)
})

module.exports = v100.concat([
  // the updated gl_ constants
    'gl_VertexID'
  , 'gl_InstanceID'
  , 'gl_Position'
  , 'gl_PointSize'
  , 'gl_FragCoord'
  , 'gl_FrontFacing'
  , 'gl_FragDepth'
  , 'gl_PointCoord'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexUniformVectors'
  , 'gl_MaxVertexOutputVectors'
  , 'gl_MaxFragmentInputVectors'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxFragmentUniformVectors'
  , 'gl_MaxDrawBuffers'
  , 'gl_MinProgramTexelOffset'
  , 'gl_MaxProgramTexelOffset'
  , 'gl_DepthRangeParameters'
  , 'gl_DepthRange'

  // other builtins
  , 'trunc'
  , 'round'
  , 'roundEven'
  , 'isnan'
  , 'isinf'
  , 'floatBitsToInt'
  , 'floatBitsToUint'
  , 'intBitsToFloat'
  , 'uintBitsToFloat'
  , 'packSnorm2x16'
  , 'unpackSnorm2x16'
  , 'packUnorm2x16'
  , 'unpackUnorm2x16'
  , 'packHalf2x16'
  , 'unpackHalf2x16'
  , 'outerProduct'
  , 'transpose'
  , 'determinant'
  , 'inverse'
  , 'texture'
  , 'textureSize'
  , 'textureProj'
  , 'textureLod'
  , 'textureOffset'
  , 'texelFetch'
  , 'texelFetchOffset'
  , 'textureProjOffset'
  , 'textureLodOffset'
  , 'textureProjLod'
  , 'textureProjLodOffset'
  , 'textureGrad'
  , 'textureGradOffset'
  , 'textureProjGrad'
  , 'textureProjGradOffset'
])

},{"./builtins":37}],37:[function(require,module,exports){
module.exports = [
  // Keep this list sorted
  'abs'
  , 'acos'
  , 'all'
  , 'any'
  , 'asin'
  , 'atan'
  , 'ceil'
  , 'clamp'
  , 'cos'
  , 'cross'
  , 'dFdx'
  , 'dFdy'
  , 'degrees'
  , 'distance'
  , 'dot'
  , 'equal'
  , 'exp'
  , 'exp2'
  , 'faceforward'
  , 'floor'
  , 'fract'
  , 'gl_BackColor'
  , 'gl_BackLightModelProduct'
  , 'gl_BackLightProduct'
  , 'gl_BackMaterial'
  , 'gl_BackSecondaryColor'
  , 'gl_ClipPlane'
  , 'gl_ClipVertex'
  , 'gl_Color'
  , 'gl_DepthRange'
  , 'gl_DepthRangeParameters'
  , 'gl_EyePlaneQ'
  , 'gl_EyePlaneR'
  , 'gl_EyePlaneS'
  , 'gl_EyePlaneT'
  , 'gl_Fog'
  , 'gl_FogCoord'
  , 'gl_FogFragCoord'
  , 'gl_FogParameters'
  , 'gl_FragColor'
  , 'gl_FragCoord'
  , 'gl_FragData'
  , 'gl_FragDepth'
  , 'gl_FragDepthEXT'
  , 'gl_FrontColor'
  , 'gl_FrontFacing'
  , 'gl_FrontLightModelProduct'
  , 'gl_FrontLightProduct'
  , 'gl_FrontMaterial'
  , 'gl_FrontSecondaryColor'
  , 'gl_LightModel'
  , 'gl_LightModelParameters'
  , 'gl_LightModelProducts'
  , 'gl_LightProducts'
  , 'gl_LightSource'
  , 'gl_LightSourceParameters'
  , 'gl_MaterialParameters'
  , 'gl_MaxClipPlanes'
  , 'gl_MaxCombinedTextureImageUnits'
  , 'gl_MaxDrawBuffers'
  , 'gl_MaxFragmentUniformComponents'
  , 'gl_MaxLights'
  , 'gl_MaxTextureCoords'
  , 'gl_MaxTextureImageUnits'
  , 'gl_MaxTextureUnits'
  , 'gl_MaxVaryingFloats'
  , 'gl_MaxVertexAttribs'
  , 'gl_MaxVertexTextureImageUnits'
  , 'gl_MaxVertexUniformComponents'
  , 'gl_ModelViewMatrix'
  , 'gl_ModelViewMatrixInverse'
  , 'gl_ModelViewMatrixInverseTranspose'
  , 'gl_ModelViewMatrixTranspose'
  , 'gl_ModelViewProjectionMatrix'
  , 'gl_ModelViewProjectionMatrixInverse'
  , 'gl_ModelViewProjectionMatrixInverseTranspose'
  , 'gl_ModelViewProjectionMatrixTranspose'
  , 'gl_MultiTexCoord0'
  , 'gl_MultiTexCoord1'
  , 'gl_MultiTexCoord2'
  , 'gl_MultiTexCoord3'
  , 'gl_MultiTexCoord4'
  , 'gl_MultiTexCoord5'
  , 'gl_MultiTexCoord6'
  , 'gl_MultiTexCoord7'
  , 'gl_Normal'
  , 'gl_NormalMatrix'
  , 'gl_NormalScale'
  , 'gl_ObjectPlaneQ'
  , 'gl_ObjectPlaneR'
  , 'gl_ObjectPlaneS'
  , 'gl_ObjectPlaneT'
  , 'gl_Point'
  , 'gl_PointCoord'
  , 'gl_PointParameters'
  , 'gl_PointSize'
  , 'gl_Position'
  , 'gl_ProjectionMatrix'
  , 'gl_ProjectionMatrixInverse'
  , 'gl_ProjectionMatrixInverseTranspose'
  , 'gl_ProjectionMatrixTranspose'
  , 'gl_SecondaryColor'
  , 'gl_TexCoord'
  , 'gl_TextureEnvColor'
  , 'gl_TextureMatrix'
  , 'gl_TextureMatrixInverse'
  , 'gl_TextureMatrixInverseTranspose'
  , 'gl_TextureMatrixTranspose'
  , 'gl_Vertex'
  , 'greaterThan'
  , 'greaterThanEqual'
  , 'inversesqrt'
  , 'length'
  , 'lessThan'
  , 'lessThanEqual'
  , 'log'
  , 'log2'
  , 'matrixCompMult'
  , 'max'
  , 'min'
  , 'mix'
  , 'mod'
  , 'normalize'
  , 'not'
  , 'notEqual'
  , 'pow'
  , 'radians'
  , 'reflect'
  , 'refract'
  , 'sign'
  , 'sin'
  , 'smoothstep'
  , 'sqrt'
  , 'step'
  , 'tan'
  , 'texture2D'
  , 'texture2DLod'
  , 'texture2DProj'
  , 'texture2DProjLod'
  , 'textureCube'
  , 'textureCubeLod'
  , 'texture2DLodEXT'
  , 'texture2DProjLodEXT'
  , 'textureCubeLodEXT'
  , 'texture2DGradEXT'
  , 'texture2DProjGradEXT'
  , 'textureCubeGradEXT'
]

},{}],38:[function(require,module,exports){
var v100 = require('./literals')

module.exports = v100.slice().concat([
   'layout'
  , 'centroid'
  , 'smooth'
  , 'case'
  , 'mat2x2'
  , 'mat2x3'
  , 'mat2x4'
  , 'mat3x2'
  , 'mat3x3'
  , 'mat3x4'
  , 'mat4x2'
  , 'mat4x3'
  , 'mat4x4'
  , 'uvec2'
  , 'uvec3'
  , 'uvec4'
  , 'samplerCubeShadow'
  , 'sampler2DArray'
  , 'sampler2DArrayShadow'
  , 'isampler2D'
  , 'isampler3D'
  , 'isamplerCube'
  , 'isampler2DArray'
  , 'usampler2D'
  , 'usampler3D'
  , 'usamplerCube'
  , 'usampler2DArray'
  , 'coherent'
  , 'restrict'
  , 'readonly'
  , 'writeonly'
  , 'resource'
  , 'atomic_uint'
  , 'noperspective'
  , 'patch'
  , 'sample'
  , 'subroutine'
  , 'common'
  , 'partition'
  , 'active'
  , 'filter'
  , 'image1D'
  , 'image2D'
  , 'image3D'
  , 'imageCube'
  , 'iimage1D'
  , 'iimage2D'
  , 'iimage3D'
  , 'iimageCube'
  , 'uimage1D'
  , 'uimage2D'
  , 'uimage3D'
  , 'uimageCube'
  , 'image1DArray'
  , 'image2DArray'
  , 'iimage1DArray'
  , 'iimage2DArray'
  , 'uimage1DArray'
  , 'uimage2DArray'
  , 'image1DShadow'
  , 'image2DShadow'
  , 'image1DArrayShadow'
  , 'image2DArrayShadow'
  , 'imageBuffer'
  , 'iimageBuffer'
  , 'uimageBuffer'
  , 'sampler1DArray'
  , 'sampler1DArrayShadow'
  , 'isampler1D'
  , 'isampler1DArray'
  , 'usampler1D'
  , 'usampler1DArray'
  , 'isampler2DRect'
  , 'usampler2DRect'
  , 'samplerBuffer'
  , 'isamplerBuffer'
  , 'usamplerBuffer'
  , 'sampler2DMS'
  , 'isampler2DMS'
  , 'usampler2DMS'
  , 'sampler2DMSArray'
  , 'isampler2DMSArray'
  , 'usampler2DMSArray'
])

},{"./literals":39}],39:[function(require,module,exports){
module.exports = [
  // current
    'precision'
  , 'highp'
  , 'mediump'
  , 'lowp'
  , 'attribute'
  , 'const'
  , 'uniform'
  , 'varying'
  , 'break'
  , 'continue'
  , 'do'
  , 'for'
  , 'while'
  , 'if'
  , 'else'
  , 'in'
  , 'out'
  , 'inout'
  , 'float'
  , 'int'
  , 'uint'
  , 'void'
  , 'bool'
  , 'true'
  , 'false'
  , 'discard'
  , 'return'
  , 'mat2'
  , 'mat3'
  , 'mat4'
  , 'vec2'
  , 'vec3'
  , 'vec4'
  , 'ivec2'
  , 'ivec3'
  , 'ivec4'
  , 'bvec2'
  , 'bvec3'
  , 'bvec4'
  , 'sampler1D'
  , 'sampler2D'
  , 'sampler3D'
  , 'samplerCube'
  , 'sampler1DShadow'
  , 'sampler2DShadow'
  , 'struct'

  // future
  , 'asm'
  , 'class'
  , 'union'
  , 'enum'
  , 'typedef'
  , 'template'
  , 'this'
  , 'packed'
  , 'goto'
  , 'switch'
  , 'default'
  , 'inline'
  , 'noinline'
  , 'volatile'
  , 'public'
  , 'static'
  , 'extern'
  , 'external'
  , 'interface'
  , 'long'
  , 'short'
  , 'double'
  , 'half'
  , 'fixed'
  , 'unsigned'
  , 'input'
  , 'output'
  , 'hvec2'
  , 'hvec3'
  , 'hvec4'
  , 'dvec2'
  , 'dvec3'
  , 'dvec4'
  , 'fvec2'
  , 'fvec3'
  , 'fvec4'
  , 'sampler2DRect'
  , 'sampler3DRect'
  , 'sampler2DRectShadow'
  , 'sizeof'
  , 'cast'
  , 'namespace'
  , 'using'
]

},{}],40:[function(require,module,exports){
module.exports = [
    '<<='
  , '>>='
  , '++'
  , '--'
  , '<<'
  , '>>'
  , '<='
  , '>='
  , '=='
  , '!='
  , '&&'
  , '||'
  , '+='
  , '-='
  , '*='
  , '/='
  , '%='
  , '&='
  , '^^'
  , '^='
  , '|='
  , '('
  , ')'
  , '['
  , ']'
  , '.'
  , '!'
  , '~'
  , '*'
  , '/'
  , '%'
  , '+'
  , '-'
  , '<'
  , '>'
  , '&'
  , '^'
  , '|'
  , '?'
  , ':'
  , '='
  , ','
  , ';'
  , '{'
  , '}'
]

},{}],41:[function(require,module,exports){
var tokenize = require('./index')

module.exports = tokenizeString

function tokenizeString(str, opt) {
  var generator = tokenize(opt)
  var tokens = []

  tokens = tokens.concat(generator(str))
  tokens = tokens.concat(generator(null))

  return tokens
}

},{"./index":35}],42:[function(require,module,exports){
function setupArguments(args) {
  const newArguments = new Array(args.length);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.toArray) {
      newArguments[i] = arg.toArray();
    } else {
      newArguments[i] = arg;
    }
  }
  return newArguments;
}

function mock1D() {
  const args = setupArguments(arguments);
  const row = new Float32Array(this.output.x);
  for (let x = 0; x < this.output.x; x++) {
    this.thread.x = x;
    this.thread.y = 0;
    this.thread.z = 0;
    row[x] = this._fn.apply(this, args);
  }
  return row;
}

function mock2D() {
  const args = setupArguments(arguments);
  const matrix = new Array(this.output.y);
  for (let y = 0; y < this.output.y; y++) {
    const row = new Float32Array(this.output.x);
    for (let x = 0; x < this.output.x; x++) {
      this.thread.x = x;
      this.thread.y = y;
      this.thread.z = 0;
      row[x] = this._fn.apply(this, args);
    }
    matrix[y] = row;
  }
  return matrix;
}

function mock2DGraphical() {
  const args = setupArguments(arguments);
  for (let y = 0; y < this.output.y; y++) {
    for (let x = 0; x < this.output.x; x++) {
      this.thread.x = x;
      this.thread.y = y;
      this.thread.z = 0;
      this._fn.apply(this, args);
    }
  }
}

function mock3D() {
  const args = setupArguments(arguments);
  const cube = new Array(this.output.z);
  for (let z = 0; z < this.output.z; z++) {
    const matrix = new Array(this.output.y);
    for (let y = 0; y < this.output.y; y++) {
      const row = new Float32Array(this.output.x);
      for (let x = 0; x < this.output.x; x++) {
        this.thread.x = x;
        this.thread.y = y;
        this.thread.z = z;
        row[x] = this._fn.apply(this, args);
      }
      matrix[y] = row;
    }
    cube[z] = matrix;
  }
  return cube;
}

function apiDecorate(kernel) {
  kernel.setOutput = (output) => {
    kernel.output = setupOutput(output);
    if (kernel.graphical) {
      setupGraphical(kernel);
    }
  };
  kernel.toJSON = () => {
    throw new Error('Not usable with gpuMock');
  };
  kernel.setConstants = (flag) => {
    kernel.constants = flag;
    return kernel;
  };
  kernel.setGraphical = (flag) => {
    kernel.graphical = flag;
    return kernel;
  };
  kernel.setCanvas = (flag) => {
    kernel.canvas = flag;
    return kernel;
  };
  kernel.setContext = (flag) => {
    kernel.context = flag;
    return kernel;
  };
  kernel.destroy = () => {};
  kernel.validateSettings = () => {};
  if (kernel.graphical && kernel.output) {
    setupGraphical(kernel);
  }
  kernel.exec = function() {
    return new Promise((resolve, reject) => {
      try {
        resolve(kernel.apply(kernel, arguments));
      } catch(e) {
        reject(e);
      }
    });
  };
  kernel.getPixels = (flip) => {
    const {x, y} = kernel.output;
    // cpu is not flipped by default
    return flip ? flipPixels(kernel._imageData.data, x, y) : kernel._imageData.data.slice(0);
  };
  kernel.color = function(r, g, b, a) {
    if (typeof a === 'undefined') {
      a = 1;
    }

    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    a = Math.floor(a * 255);

    const width = kernel.output.x;
    const height = kernel.output.y;

    const x = kernel.thread.x;
    const y = height - kernel.thread.y - 1;

    const index = x + y * width;

    kernel._colorData[index * 4 + 0] = r;
    kernel._colorData[index * 4 + 1] = g;
    kernel._colorData[index * 4 + 2] = b;
    kernel._colorData[index * 4 + 3] = a;
  };

  // these are added for api compatibility, but have no affect
  const mockMethod = () => kernel;
  const methods = [
    'setWarnVarUsage',
    'setArgumentTypes',
    'setTactic',
    'setOptimizeFloatMemory',
    'setDebug',
    'setLoopMaxIterations',
    'setConstantTypes',
    'setFunctions',
    'setNativeFunctions',
    'setInjectedNative',
    'setPipeline',
    'setPrecision',
    'setOutputToTexture',
    'setImmutable',
    'setStrictIntegers',
    'setDynamicOutput',
    'setHardcodeConstants',
    'setDynamicArguments',
    'setUseLegacyEncoder',
    'setWarnVarUsage',
    'addSubKernel',
  ];
  for (let i = 0; i < methods.length; i++) {
    kernel[methods[i]] = mockMethod;
  }
  return kernel;
}

function setupGraphical(kernel) {
  const {x, y} = kernel.output;
  if (kernel.context && kernel.context.createImageData) {
    const data = new Uint8ClampedArray(x * y * 4);
    kernel._imageData = kernel.context.createImageData(x, y);
    kernel._colorData = data;
  } else {
    const data = new Uint8ClampedArray(x * y * 4);
    kernel._imageData = { data };
    kernel._colorData = data;
  }
}

function setupOutput(output) {
  let result = null;
  if (output.length) {
    if (output.length === 3) {
      const [x,y,z] = output;
      result = { x, y, z };
    } else if (output.length === 2) {
      const [x,y] = output;
      result = { x, y };
    } else {
      const [x] = output;
      result = { x };
    }
  } else {
    result = output;
  }
  return result;
}

function gpuMock(fn, settings = {}) {
  const output = settings.output ? setupOutput(settings.output) : null;
  function kernel() {
    if (kernel.output.z) {
      return mock3D.apply(kernel, arguments);
    } else if (kernel.output.y) {
      if (kernel.graphical) {
        return mock2DGraphical.apply(kernel, arguments);
      }
      return mock2D.apply(kernel, arguments);
    } else {
      return mock1D.apply(kernel, arguments);
    }
  }
  kernel._fn = fn;
  kernel.constants = settings.constants || null;
  kernel.context = settings.context || null;
  kernel.canvas = settings.canvas || null;
  kernel.graphical = settings.graphical || false;
  kernel._imageData = null;
  kernel._colorData = null;
  kernel.output = output;
  kernel.thread = {
    x: 0,
    y: 0,
    z: 0
  };
  return apiDecorate(kernel);
}

function flipPixels(pixels, width, height) {
  // https://stackoverflow.com/a/41973289/1324039
  const halfHeight = height / 2 | 0; // the | 0 keeps the result an int
  const bytesPerRow = width * 4;
  // make a temp buffer to hold one row
  const temp = new Uint8ClampedArray(width * 4);
  const result = pixels.slice(0);
  for (let y = 0; y < halfHeight; ++y) {
    const topOffset = y * bytesPerRow;
    const bottomOffset = (height - y - 1) * bytesPerRow;

    // make copy of a row on the top half
    temp.set(result.subarray(topOffset, topOffset + bytesPerRow));

    // copy a row from the bottom half to the top
    result.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

    // copy the copy of the top half row to the bottom half
    result.set(temp, bottomOffset);
  }
  return result;
}

module.exports = {
  gpuMock
};

},{}],43:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.acorn = {})));
}(this, (function (exports) { 'use strict';

// Reserved word lists for various dialects of the language

var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};

// And the keywords

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

var keywords = {
  5: ecma5AndLessKeywords,
  6: ecma5AndLessKeywords + " const class extends export import super"
};

var keywordRelationalOperator = /^in(stanceof)?$/;

// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7b9\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by bin/generate-identifier-regex.js

// eslint-disable-next-line comma-spacing
var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,14,29,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,28,43,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,14,35,477,28,11,0,9,21,190,52,76,44,33,24,27,35,30,0,12,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,26,230,43,117,63,32,0,257,0,11,39,8,0,22,0,12,39,3,3,20,0,35,56,264,8,2,36,18,0,50,29,113,6,2,1,2,37,22,0,26,5,2,1,2,31,15,0,328,18,270,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,689,63,129,68,12,0,67,12,65,1,31,6129,15,754,9486,286,82,395,2309,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,15,7472,3104,541];

// eslint-disable-next-line comma-spacing
var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,574,3,9,9,525,10,176,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,6,1,45,0,13,2,49,13,9,3,4,9,83,11,7,0,161,11,6,9,7,3,56,1,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,5,0,82,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,243,14,166,9,280,9,41,6,2,3,9,0,10,10,47,15,406,7,2,7,17,9,57,21,2,13,123,5,4,0,2,1,2,6,2,0,9,9,49,4,2,1,2,4,9,9,330,3,19306,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) { return false }
    pos += set[i + 1];
    if (pos >= code) { return true }
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code, astral) {
  if (code < 65) { return code === 36 }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes)
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code, astral) {
  if (code < 48) { return code === 36 }
  if (code < 58) { return true }
  if (code < 65) { return false }
  if (code < 91) { return true }
  if (code < 97) { return code === 95 }
  if (code < 123) { return true }
  if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
  if (astral === false) { return false }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
}

// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to check if the token ends a
// `yield` expression. It is set on all token types that either can
// directly start an expression (like a quotation mark) or can
// continue an expression (like the body of a string).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

var TokenType = function TokenType(label, conf) {
  if ( conf === void 0 ) conf = {};

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

function binop(name, prec) {
  return new TokenType(name, {beforeExpr: true, binop: prec})
}
var beforeExpr = {beforeExpr: true};
var startsExpr = {startsExpr: true};

// Map keyword names to token types.

var keywords$1 = {};

// Succinct definitions of keyword token types
function kw(name, options) {
  if ( options === void 0 ) options = {};

  options.keyword = name;
  return keywords$1[name] = new TokenType(name, options)
}

var types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
  assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
  incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
  prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", {beforeExpr: true}),

  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", {isLoop: true, beforeExpr: true}),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", {isLoop: true}),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", {isLoop: true}),
  _with: kw("with"),
  _new: kw("new", {beforeExpr: true, startsExpr: true}),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import"),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", {beforeExpr: true, binop: 7}),
  _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
  _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
  _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
  _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
};

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");

function isNewLine(code, ecma2019String) {
  return code === 10 || code === 13 || (!ecma2019String && (code === 0x2028 || code === 0x2029))
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

var ref = Object.prototype;
var hasOwnProperty = ref.hasOwnProperty;
var toString = ref.toString;

// Checks if an object has a property.

function has(obj, propName) {
  return hasOwnProperty.call(obj, propName)
}

var isArray = Array.isArray || (function (obj) { return (
  toString.call(obj) === "[object Array]"
); });

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = function Position(line, col) {
  this.line = line;
  this.column = col;
};

Position.prototype.offset = function offset (n) {
  return new Position(this.line, this.column + n)
};

var SourceLocation = function SourceLocation(p, start, end) {
  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) { this.source = p.sourceFile; }
};

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    lineBreakG.lastIndex = cur;
    var match = lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur)
    }
  }
}

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must
  // be either 3, 5, 6 (2015), 7 (2016), or 8 (2017). This influences support
  // for strict mode, the set of reserved words, and support for
  // new syntax features. The default is 7.
  ecmaVersion: 7,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"` or `"module"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called
  // when a semicolon is automatically inserted. It will be passed
  // th position of the comma as an offset, and if `locations` is
  // enabled, it is given the location as a `{line, column}` object
  // as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // When enabled, await identifiers are allowed to appear at the top-level scope,
  // but they are still not allowed in non-async functions.
  allowAwaitOutsideFunction: false,
  // When enabled, hashbang directive in the beginning of file
  // is allowed and treated as a line comment.
  allowHashBang: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false,
  plugins: {}
};

// Interpret and default an options object

function getOptions(opts) {
  var options = {};

  for (var opt in defaultOptions)
    { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]; }

  if (options.ecmaVersion >= 2015)
    { options.ecmaVersion -= 2009; }

  if (options.allowReserved == null)
    { options.allowReserved = options.ecmaVersion < 5; }

  if (isArray(options.onToken)) {
    var tokens = options.onToken;
    options.onToken = function (token) { return tokens.push(token); };
  }
  if (isArray(options.onComment))
    { options.onComment = pushComment(options, options.onComment); }

  return options
}

function pushComment(options, array) {
  return function(block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "Block" : "Line",
      value: text,
      start: start,
      end: end
    };
    if (options.locations)
      { comment.loc = new SourceLocation(this, startLoc, endLoc); }
    if (options.ranges)
      { comment.range = [start, end]; }
    array.push(comment);
  }
}

// Registered plugins
var plugins = {};

function keywordRegexp(words) {
  return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$")
}

var Parser = function Parser(options, input, startPos) {
  this.options = options = getOptions(options);
  this.sourceFile = options.sourceFile;
  this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5]);
  var reserved = "";
  if (!options.allowReserved) {
    for (var v = options.ecmaVersion;; v--)
      { if (reserved = reservedWords[v]) { break } }
    if (options.sourceType === "module") { reserved += " await"; }
  }
  this.reservedWords = keywordRegexp(reserved);
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
  this.reservedWordsStrict = keywordRegexp(reservedStrict);
  this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind);
  this.input = String(input);

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.
  this.containsEsc = false;

  // Load plugins
  this.loadPlugins(options.plugins);

  // Set up token state

  // The current position of the tokenizer in the input.
  if (startPos) {
    this.pos = startPos;
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
  } else {
    this.pos = this.lineStart = 0;
    this.curLine = 1;
  }

  // Properties of the current token:
  // Its type
  this.type = types.eof;
  // For tokens that include more information than their type, the value
  this.value = null;
  // Its start and end offset
  this.start = this.end = this.pos;
  // And, if locations are used, the {line, column} object
  // corresponding to those offsets
  this.startLoc = this.endLoc = this.curPosition();

  // Position information for the previous token
  this.lastTokEndLoc = this.lastTokStartLoc = null;
  this.lastTokStart = this.lastTokEnd = this.pos;

  // The context stack is used to superficially track syntactic
  // context to predict whether a regular expression is allowed in a
  // given position.
  this.context = this.initialContext();
  this.exprAllowed = true;

  // Figure out if it's a module code.
  this.inModule = options.sourceType === "module";
  this.strict = this.inModule || this.strictDirective(this.pos);

  // Used to signify the start of a potential arrow function
  this.potentialArrowAt = -1;

  // Flags to track whether we are in a function, a generator, an async function.
  this.inFunction = this.inGenerator = this.inAsync = false;
  // Positions to delayed-check that yield/await does not exist in default parameters.
  this.yieldPos = this.awaitPos = 0;
  // Labels in scope.
  this.labels = [];

  // If enabled, skip leading hashbang line.
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
    { this.skipLineComment(2); }

  // Scope tracking for duplicate variable names (see scope.js)
  this.scopeStack = [];
  this.enterFunctionScope();

  // For RegExp validation
  this.regexpState = null;
};

// DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

Parser.prototype.extend = function extend (name, f) {
  this[name] = f(this[name]);
};

Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
    var this$1 = this;

  for (var name in pluginConfigs) {
    var plugin = plugins[name];
    if (!plugin) { throw new Error("Plugin '" + name + "' not found") }
    plugin(this$1, pluginConfigs[name]);
  }
};

Parser.prototype.parse = function parse () {
  var node = this.options.program || this.startNode();
  this.nextToken();
  return this.parseTopLevel(node)
};

var pp = Parser.prototype;

// ## Parser utilities

var literal = /^(?:'((?:\\.|[^'])*?)'|"((?:\\.|[^"])*?)"|;)/;
pp.strictDirective = function(start) {
  var this$1 = this;

  for (;;) {
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this$1.input)[0].length;
    var match = literal.exec(this$1.input.slice(start));
    if (!match) { return false }
    if ((match[1] || match[2]) === "use strict") { return true }
    start += match[0].length;
  }
};

// Predicate that tests whether the next token is of the given
// type, and if yes, consumes it as a side effect.

pp.eat = function(type) {
  if (this.type === type) {
    this.next();
    return true
  } else {
    return false
  }
};

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function(name) {
  return this.type === types.name && this.value === name && !this.containsEsc
};

// Consumes contextual keyword if possible.

pp.eatContextual = function(name) {
  if (!this.isContextual(name)) { return false }
  this.next();
  return true
};

// Asserts that following token is given contextual keyword.

pp.expectContextual = function(name) {
  if (!this.eatContextual(name)) { this.unexpected(); }
};

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function() {
  return this.type === types.eof ||
    this.type === types.braceR ||
    lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

pp.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon)
      { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
    return true
  }
};

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function() {
  if (!this.eat(types.semi) && !this.insertSemicolon()) { this.unexpected(); }
};

pp.afterTrailingComma = function(tokType, notNext) {
  if (this.type === tokType) {
    if (this.options.onTrailingComma)
      { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
    if (!notNext)
      { this.next(); }
    return true
  }
};

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function(type) {
  this.eat(type) || this.unexpected();
};

// Raise an unexpected token error.

pp.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};

function DestructuringErrors() {
  this.shorthandAssign =
  this.trailingComma =
  this.parenthesizedAssign =
  this.parenthesizedBind =
  this.doubleProto =
    -1;
}

pp.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) { return }
  if (refDestructuringErrors.trailingComma > -1)
    { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
  if (parens > -1) { this.raiseRecoverable(parens, "Parenthesized pattern"); }
};

pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  if (!refDestructuringErrors) { return false }
  var shorthandAssign = refDestructuringErrors.shorthandAssign;
  var doubleProto = refDestructuringErrors.doubleProto;
  if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
  if (shorthandAssign >= 0)
    { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
  if (doubleProto >= 0)
    { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
};

pp.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
    { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
  if (this.awaitPos)
    { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
};

pp.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression")
    { return this.isSimpleAssignTarget(expr.expression) }
  return expr.type === "Identifier" || expr.type === "MemberExpression"
};

var pp$1 = Parser.prototype;

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp$1.parseTopLevel = function(node) {
  var this$1 = this;

  var exports = {};
  if (!node.body) { node.body = []; }
  while (this.type !== types.eof) {
    var stmt = this$1.parseStatement(true, true, exports);
    node.body.push(stmt);
  }
  this.adaptDirectivePrologue(node.body);
  this.next();
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType;
  }
  return this.finishNode(node, "Program")
};

var loopLabel = {kind: "loop"};
var switchLabel = {kind: "switch"};

pp$1.isLet = function() {
  if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
  if (nextCh === 91 || nextCh === 123) { return true } // '{' and '['
  if (isIdentifierStart(nextCh, true)) {
    var pos = next + 1;
    while (isIdentifierChar(this.input.charCodeAt(pos), true)) { ++pos; }
    var ident = this.input.slice(next, pos);
    if (!keywordRelationalOperator.test(ident)) { return true }
  }
  return false
};

// check 'async [no LineTerminator here] function'
// - 'async /*foo*/ function' is OK.
// - 'async /*\n*/ function' is invalid.
pp$1.isAsyncFunction = function() {
  if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
    { return false }

  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length;
  return !lineBreak.test(this.input.slice(this.pos, next)) &&
    this.input.slice(next, next + 8) === "function" &&
    (next + 8 === this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
};

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp$1.parseStatement = function(declaration, topLevel, exports) {
  var starttype = this.type, node = this.startNode(), kind;

  if (this.isLet()) {
    starttype = types._var;
    kind = "let";
  }

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
  case types._break: case types._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
  case types._debugger: return this.parseDebuggerStatement(node)
  case types._do: return this.parseDoStatement(node)
  case types._for: return this.parseForStatement(node)
  case types._function:
    if (!declaration && this.options.ecmaVersion >= 6) { this.unexpected(); }
    return this.parseFunctionStatement(node, false)
  case types._class:
    if (!declaration) { this.unexpected(); }
    return this.parseClass(node, true)
  case types._if: return this.parseIfStatement(node)
  case types._return: return this.parseReturnStatement(node)
  case types._switch: return this.parseSwitchStatement(node)
  case types._throw: return this.parseThrowStatement(node)
  case types._try: return this.parseTryStatement(node)
  case types._const: case types._var:
    kind = kind || this.value;
    if (!declaration && kind !== "var") { this.unexpected(); }
    return this.parseVarStatement(node, kind)
  case types._while: return this.parseWhileStatement(node)
  case types._with: return this.parseWithStatement(node)
  case types.braceL: return this.parseBlock()
  case types.semi: return this.parseEmptyStatement(node)
  case types._export:
  case types._import:
    if (!this.options.allowImportExportEverywhere) {
      if (!topLevel)
        { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
      if (!this.inModule)
        { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
    }
    return starttype === types._import ? this.parseImport(node) : this.parseExport(node, exports)

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
  default:
    if (this.isAsyncFunction()) {
      if (!declaration) { this.unexpected(); }
      this.next();
      return this.parseFunctionStatement(node, true)
    }

    var maybeName = this.value, expr = this.parseExpression();
    if (starttype === types.name && expr.type === "Identifier" && this.eat(types.colon))
      { return this.parseLabeledStatement(node, maybeName, expr) }
    else { return this.parseExpressionStatement(node, expr) }
  }
};

pp$1.parseBreakContinueStatement = function(node, keyword) {
  var this$1 = this;

  var isBreak = keyword === "break";
  this.next();
  if (this.eat(types.semi) || this.insertSemicolon()) { node.label = null; }
  else if (this.type !== types.name) { this.unexpected(); }
  else {
    node.label = this.parseIdent();
    this.semicolon();
  }

  // Verify that there is an actual destination to break or
  // continue to.
  var i = 0;
  for (; i < this.labels.length; ++i) {
    var lab = this$1.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
      if (node.label && isBreak) { break }
    }
  }
  if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
};

pp$1.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement")
};

pp$1.parseDoStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  this.expect(types._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6)
    { this.eat(types.semi); }
  else
    { this.semicolon(); }
  return this.finishNode(node, "DoWhileStatement")
};

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp$1.parseForStatement = function(node) {
  this.next();
  var awaitAt = (this.options.ecmaVersion >= 9 && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction)) && this.eatContextual("await")) ? this.lastTokStart : -1;
  this.labels.push(loopLabel);
  this.enterLexicalScope();
  this.expect(types.parenL);
  if (this.type === types.semi) {
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, null)
  }
  var isLet = this.isLet();
  if (this.type === types._var || this.type === types._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
    this.next();
    this.parseVar(init$1, true, kind);
    this.finishNode(init$1, "VariableDeclaration");
    if ((this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
        !(kind !== "var" && init$1.declarations[0].init)) {
      if (this.options.ecmaVersion >= 9) {
        if (this.type === types._in) {
          if (awaitAt > -1) { this.unexpected(awaitAt); }
        } else { node.await = awaitAt > -1; }
      }
      return this.parseForIn(node, init$1)
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init$1)
  }
  var refDestructuringErrors = new DestructuringErrors;
  var init = this.parseExpression(true, refDestructuringErrors);
  if (this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    if (this.options.ecmaVersion >= 9) {
      if (this.type === types._in) {
        if (awaitAt > -1) { this.unexpected(awaitAt); }
      } else { node.await = awaitAt > -1; }
    }
    this.toAssignable(init, false, refDestructuringErrors);
    this.checkLVal(init);
    return this.parseForIn(node, init)
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  if (awaitAt > -1) { this.unexpected(awaitAt); }
  return this.parseFor(node, init)
};

pp$1.parseFunctionStatement = function(node, isAsync) {
  this.next();
  return this.parseFunction(node, true, false, isAsync)
};

pp$1.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  // allow function declarations in branches, but only in non-strict mode
  node.consequent = this.parseStatement(!this.strict && this.type === types._function);
  node.alternate = this.eat(types._else) ? this.parseStatement(!this.strict && this.type === types._function) : null;
  return this.finishNode(node, "IfStatement")
};

pp$1.parseReturnStatement = function(node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction)
    { this.raise(this.start, "'return' outside of function"); }
  this.next();

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(types.semi) || this.insertSemicolon()) { node.argument = null; }
  else { node.argument = this.parseExpression(); this.semicolon(); }
  return this.finishNode(node, "ReturnStatement")
};

pp$1.parseSwitchStatement = function(node) {
  var this$1 = this;

  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(types.braceL);
  this.labels.push(switchLabel);
  this.enterLexicalScope();

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  var cur;
  for (var sawDefault = false; this.type !== types.braceR;) {
    if (this$1.type === types._case || this$1.type === types._default) {
      var isCase = this$1.type === types._case;
      if (cur) { this$1.finishNode(cur, "SwitchCase"); }
      node.cases.push(cur = this$1.startNode());
      cur.consequent = [];
      this$1.next();
      if (isCase) {
        cur.test = this$1.parseExpression();
      } else {
        if (sawDefault) { this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses"); }
        sawDefault = true;
        cur.test = null;
      }
      this$1.expect(types.colon);
    } else {
      if (!cur) { this$1.unexpected(); }
      cur.consequent.push(this$1.parseStatement(true));
    }
  }
  this.exitLexicalScope();
  if (cur) { this.finishNode(cur, "SwitchCase"); }
  this.next(); // Closing brace
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement")
};

pp$1.parseThrowStatement = function(node) {
  this.next();
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
    { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement")
};

// Reused empty array added for node fields that are always empty.

var empty = [];

pp$1.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === types._catch) {
    var clause = this.startNode();
    this.next();
    if (this.eat(types.parenL)) {
      clause.param = this.parseBindingAtom();
      this.enterLexicalScope();
      this.checkLVal(clause.param, "let");
      this.expect(types.parenR);
    } else {
      if (this.options.ecmaVersion < 10) { this.unexpected(); }
      clause.param = null;
      this.enterLexicalScope();
    }
    clause.body = this.parseBlock(false);
    this.exitLexicalScope();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(types._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer)
    { this.raise(node.start, "Missing catch or finally clause"); }
  return this.finishNode(node, "TryStatement")
};

pp$1.parseVarStatement = function(node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration")
};

pp$1.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "WhileStatement")
};

pp$1.parseWithStatement = function(node) {
  if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement(false);
  return this.finishNode(node, "WithStatement")
};

pp$1.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement")
};

pp$1.parseLabeledStatement = function(node, maybeName, expr) {
  var this$1 = this;

  for (var i$1 = 0, list = this$1.labels; i$1 < list.length; i$1 += 1)
    {
    var label = list[i$1];

    if (label.name === maybeName)
      { this$1.raise(expr.start, "Label '" + maybeName + "' is already declared");
  } }
  var kind = this.type.isLoop ? "loop" : this.type === types._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label$1 = this$1.labels[i];
    if (label$1.statementStart === node.start) {
      // Update information about previous labels on this node
      label$1.statementStart = this$1.start;
      label$1.kind = kind;
    } else { break }
  }
  this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
  node.body = this.parseStatement(true);
  if (node.body.type === "ClassDeclaration" ||
      node.body.type === "VariableDeclaration" && node.body.kind !== "var" ||
      node.body.type === "FunctionDeclaration" && (this.strict || node.body.generator || node.body.async))
    { this.raiseRecoverable(node.body.start, "Invalid labeled declaration"); }
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement")
};

pp$1.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement")
};

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp$1.parseBlock = function(createNewLexicalScope) {
  var this$1 = this;
  if ( createNewLexicalScope === void 0 ) createNewLexicalScope = true;

  var node = this.startNode();
  node.body = [];
  this.expect(types.braceL);
  if (createNewLexicalScope) {
    this.enterLexicalScope();
  }
  while (!this.eat(types.braceR)) {
    var stmt = this$1.parseStatement(true);
    node.body.push(stmt);
  }
  if (createNewLexicalScope) {
    this.exitLexicalScope();
  }
  return this.finishNode(node, "BlockStatement")
};

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp$1.parseFor = function(node, init) {
  node.init = init;
  this.expect(types.semi);
  node.test = this.type === types.semi ? null : this.parseExpression();
  this.expect(types.semi);
  node.update = this.type === types.parenR ? null : this.parseExpression();
  this.expect(types.parenR);
  this.exitLexicalScope();
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "ForStatement")
};

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp$1.parseForIn = function(node, init) {
  var type = this.type === types._in ? "ForInStatement" : "ForOfStatement";
  this.next();
  if (type === "ForInStatement") {
    if (init.type === "AssignmentPattern" ||
      (init.type === "VariableDeclaration" && init.declarations[0].init != null &&
       (this.strict || init.declarations[0].id.type !== "Identifier")))
      { this.raise(init.start, "Invalid assignment in for-in loop head"); }
  }
  node.left = init;
  node.right = type === "ForInStatement" ? this.parseExpression() : this.parseMaybeAssign();
  this.expect(types.parenR);
  this.exitLexicalScope();
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, type)
};

// Parse a list of variable declarations.

pp$1.parseVar = function(node, isFor, kind) {
  var this$1 = this;

  node.declarations = [];
  node.kind = kind;
  for (;;) {
    var decl = this$1.startNode();
    this$1.parseVarId(decl, kind);
    if (this$1.eat(types.eq)) {
      decl.init = this$1.parseMaybeAssign(isFor);
    } else if (kind === "const" && !(this$1.type === types._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
      this$1.unexpected();
    } else if (decl.id.type !== "Identifier" && !(isFor && (this$1.type === types._in || this$1.isContextual("of")))) {
      this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"));
    if (!this$1.eat(types.comma)) { break }
  }
  return node
};

pp$1.parseVarId = function(decl, kind) {
  decl.id = this.parseBindingAtom(kind);
  this.checkLVal(decl.id, kind, false);
};

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseFunction = function(node, isStatement, allowExpressionBody, isAsync) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync)
    { node.generator = this.eat(types.star); }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  if (isStatement) {
    node.id = isStatement === "nullableID" && this.type !== types.name ? null : this.parseIdent();
    if (node.id) {
      this.checkLVal(node.id, this.inModule && !this.inFunction ? "let" : "var");
    }
  }

  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;
  this.inGenerator = node.generator;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;
  this.enterFunctionScope();

  if (!isStatement)
    { node.id = this.type === types.name ? this.parseIdent() : null; }

  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
};

pp$1.parseFunctionParams = function(node) {
  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
};

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseClass = function(node, isStatement) {
  var this$1 = this;

  this.next();

  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    var member = this$1.parseClassMember(classBody);
    if (member && member.type === "MethodDefinition" && member.kind === "constructor") {
      if (hadConstructor) { this$1.raise(member.start, "Duplicate constructor in the same class"); }
      hadConstructor = true;
    }
  }
  node.body = this.finishNode(classBody, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
};

pp$1.parseClassMember = function(classBody) {
  var this$1 = this;

  if (this.eat(types.semi)) { return null }

  var method = this.startNode();
  var tryContextual = function (k, noLineBreak) {
    if ( noLineBreak === void 0 ) noLineBreak = false;

    var start = this$1.start, startLoc = this$1.startLoc;
    if (!this$1.eatContextual(k)) { return false }
    if (this$1.type !== types.parenL && (!noLineBreak || !this$1.canInsertSemicolon())) { return true }
    if (method.key) { this$1.unexpected(); }
    method.computed = false;
    method.key = this$1.startNodeAt(start, startLoc);
    method.key.name = k;
    this$1.finishNode(method.key, "Identifier");
    return false
  };

  method.kind = "method";
  method.static = tryContextual("static");
  var isGenerator = this.eat(types.star);
  var isAsync = false;
  if (!isGenerator) {
    if (this.options.ecmaVersion >= 8 && tryContextual("async", true)) {
      isAsync = true;
      isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
    } else if (tryContextual("get")) {
      method.kind = "get";
    } else if (tryContextual("set")) {
      method.kind = "set";
    }
  }
  if (!method.key) { this.parsePropertyName(method); }
  var key = method.key;
  if (!method.computed && !method.static && (key.type === "Identifier" && key.name === "constructor" ||
      key.type === "Literal" && key.value === "constructor")) {
    if (method.kind !== "method") { this.raise(key.start, "Constructor can't have get/set modifier"); }
    if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
    if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
    method.kind = "constructor";
  } else if (method.static && key.type === "Identifier" && key.name === "prototype") {
    this.raise(key.start, "Classes may not have a static property named prototype");
  }
  this.parseClassMethod(classBody, method, isGenerator, isAsync);
  if (method.kind === "get" && method.value.params.length !== 0)
    { this.raiseRecoverable(method.value.start, "getter should have no params"); }
  if (method.kind === "set" && method.value.params.length !== 1)
    { this.raiseRecoverable(method.value.start, "setter should have exactly one param"); }
  if (method.kind === "set" && method.value.params[0].type === "RestElement")
    { this.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params"); }
  return method
};

pp$1.parseClassMethod = function(classBody, method, isGenerator, isAsync) {
  method.value = this.parseMethod(isGenerator, isAsync);
  classBody.body.push(this.finishNode(method, "MethodDefinition"));
};

pp$1.parseClassId = function(node, isStatement) {
  node.id = this.type === types.name ? this.parseIdent() : isStatement === true ? this.unexpected() : null;
};

pp$1.parseClassSuper = function(node) {
  node.superClass = this.eat(types._extends) ? this.parseExprSubscripts() : null;
};

// Parses module export declaration.

pp$1.parseExport = function(node, exports) {
  var this$1 = this;

  this.next();
  // export * from '...'
  if (this.eat(types.star)) {
    this.expectContextual("from");
    if (this.type !== types.string) { this.unexpected(); }
    node.source = this.parseExprAtom();
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration")
  }
  if (this.eat(types._default)) { // export default ...
    this.checkExport(exports, "default", this.lastTokStart);
    var isAsync;
    if (this.type === types._function || (isAsync = this.isAsyncFunction())) {
      var fNode = this.startNode();
      this.next();
      if (isAsync) { this.next(); }
      node.declaration = this.parseFunction(fNode, "nullableID", false, isAsync);
    } else if (this.type === types._class) {
      var cNode = this.startNode();
      node.declaration = this.parseClass(cNode, "nullableID");
    } else {
      node.declaration = this.parseMaybeAssign();
      this.semicolon();
    }
    return this.finishNode(node, "ExportDefaultDeclaration")
  }
  // export var|const|let|function|class ...
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(true);
    if (node.declaration.type === "VariableDeclaration")
      { this.checkVariableExport(exports, node.declaration.declarations); }
    else
      { this.checkExport(exports, node.declaration.id.name, node.declaration.id.start); }
    node.specifiers = [];
    node.source = null;
  } else { // export { x, y as z } [from '...']
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports);
    if (this.eatContextual("from")) {
      if (this.type !== types.string) { this.unexpected(); }
      node.source = this.parseExprAtom();
    } else {
      // check for keywords used as local names
      for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
        var spec = list[i];

        this$1.checkUnreserved(spec.local);
      }

      node.source = null;
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration")
};

pp$1.checkExport = function(exports, name, pos) {
  if (!exports) { return }
  if (has(exports, name))
    { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
  exports[name] = true;
};

pp$1.checkPatternExport = function(exports, pat) {
  var this$1 = this;

  var type = pat.type;
  if (type === "Identifier")
    { this.checkExport(exports, pat.name, pat.start); }
  else if (type === "ObjectPattern")
    { for (var i = 0, list = pat.properties; i < list.length; i += 1)
      {
        var prop = list[i];

        this$1.checkPatternExport(exports, prop);
      } }
  else if (type === "ArrayPattern")
    { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
      var elt = list$1[i$1];

        if (elt) { this$1.checkPatternExport(exports, elt); }
    } }
  else if (type === "Property")
    { this.checkPatternExport(exports, pat.value); }
  else if (type === "AssignmentPattern")
    { this.checkPatternExport(exports, pat.left); }
  else if (type === "RestElement")
    { this.checkPatternExport(exports, pat.argument); }
  else if (type === "ParenthesizedExpression")
    { this.checkPatternExport(exports, pat.expression); }
};

pp$1.checkVariableExport = function(exports, decls) {
  var this$1 = this;

  if (!exports) { return }
  for (var i = 0, list = decls; i < list.length; i += 1)
    {
    var decl = list[i];

    this$1.checkPatternExport(exports, decl.id);
  }
};

pp$1.shouldParseExportStatement = function() {
  return this.type.keyword === "var" ||
    this.type.keyword === "const" ||
    this.type.keyword === "class" ||
    this.type.keyword === "function" ||
    this.isLet() ||
    this.isAsyncFunction()
};

// Parses a comma-separated list of module exports.

pp$1.parseExportSpecifiers = function(exports) {
  var this$1 = this;

  var nodes = [], first = true;
  // export { x, y as z } [from '...']
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node = this$1.startNode();
    node.local = this$1.parseIdent(true);
    node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local;
    this$1.checkExport(exports, node.exported.name, node.exported.start);
    nodes.push(this$1.finishNode(node, "ExportSpecifier"));
  }
  return nodes
};

// Parses import declaration.

pp$1.parseImport = function(node) {
  this.next();
  // import '...'
  if (this.type === types.string) {
    node.specifiers = empty;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration")
};

// Parses a comma-separated list of module imports.

pp$1.parseImportSpecifiers = function() {
  var this$1 = this;

  var nodes = [], first = true;
  if (this.type === types.name) {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLVal(node.local, "let");
    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
    if (!this.eat(types.comma)) { return nodes }
  }
  if (this.type === types.star) {
    var node$1 = this.startNode();
    this.next();
    this.expectContextual("as");
    node$1.local = this.parseIdent();
    this.checkLVal(node$1.local, "let");
    nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"));
    return nodes
  }
  this.expect(types.braceL);
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var node$2 = this$1.startNode();
    node$2.imported = this$1.parseIdent(true);
    if (this$1.eatContextual("as")) {
      node$2.local = this$1.parseIdent();
    } else {
      this$1.checkUnreserved(node$2.imported);
      node$2.local = node$2.imported;
    }
    this$1.checkLVal(node$2.local, "let");
    nodes.push(this$1.finishNode(node$2, "ImportSpecifier"));
  }
  return nodes
};

// Set `ExpressionStatement#directive` property for directive prologues.
pp$1.adaptDirectivePrologue = function(statements) {
  for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
    statements[i].directive = statements[i].expression.raw.slice(1, -1);
  }
};
pp$1.isDirectiveCandidate = function(statement) {
  return (
    statement.type === "ExpressionStatement" &&
    statement.expression.type === "Literal" &&
    typeof statement.expression.value === "string" &&
    // Reject parenthesized strings.
    (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
  )
};

var pp$2 = Parser.prototype;

// Convert existing expression atom to assignable pattern
// if possible.

pp$2.toAssignable = function(node, isBinding, refDestructuringErrors) {
  var this$1 = this;

  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
    case "Identifier":
      if (this.inAsync && node.name === "await")
        { this.raise(node.start, "Can not use 'await' as identifier inside an async function"); }
      break

    case "ObjectPattern":
    case "ArrayPattern":
    case "RestElement":
      break

    case "ObjectExpression":
      node.type = "ObjectPattern";
      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
      for (var i = 0, list = node.properties; i < list.length; i += 1) {
        var prop = list[i];

      this$1.toAssignable(prop, isBinding);
        // Early error:
        //   AssignmentRestProperty[Yield, Await] :
        //     `...` DestructuringAssignmentTarget[Yield, Await]
        //
        //   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
        if (
          prop.type === "RestElement" &&
          (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
        ) {
          this$1.raise(prop.argument.start, "Unexpected token");
        }
      }
      break

    case "Property":
      // AssignmentProperty has type === "Property"
      if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
      this.toAssignable(node.value, isBinding);
      break

    case "ArrayExpression":
      node.type = "ArrayPattern";
      if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
      this.toAssignableList(node.elements, isBinding);
      break

    case "SpreadElement":
      node.type = "RestElement";
      this.toAssignable(node.argument, isBinding);
      if (node.argument.type === "AssignmentPattern")
        { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
      break

    case "AssignmentExpression":
      if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
      node.type = "AssignmentPattern";
      delete node.operator;
      this.toAssignable(node.left, isBinding);
      // falls through to AssignmentPattern

    case "AssignmentPattern":
      break

    case "ParenthesizedExpression":
      this.toAssignable(node.expression, isBinding);
      break

    case "MemberExpression":
      if (!isBinding) { break }

    default:
      this.raise(node.start, "Assigning to rvalue");
    }
  } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
  return node
};

// Convert list of expression atoms to binding list.

pp$2.toAssignableList = function(exprList, isBinding) {
  var this$1 = this;

  var end = exprList.length;
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) { this$1.toAssignable(elt, isBinding); }
  }
  if (end) {
    var last = exprList[end - 1];
    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
      { this.unexpected(last.argument.start); }
  }
  return exprList
};

// Parses spread element.

pp$2.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
  return this.finishNode(node, "SpreadElement")
};

pp$2.parseRestBinding = function() {
  var node = this.startNode();
  this.next();

  // RestElement inside of a function parameter must be an identifier
  if (this.options.ecmaVersion === 6 && this.type !== types.name)
    { this.unexpected(); }

  node.argument = this.parseBindingAtom();

  return this.finishNode(node, "RestElement")
};

// Parses lvalue (assignable) atom.

pp$2.parseBindingAtom = function() {
  if (this.options.ecmaVersion >= 6) {
    switch (this.type) {
    case types.bracketL:
      var node = this.startNode();
      this.next();
      node.elements = this.parseBindingList(types.bracketR, true, true);
      return this.finishNode(node, "ArrayPattern")

    case types.braceL:
      return this.parseObj(true)
    }
  }
  return this.parseIdent()
};

pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (first) { first = false; }
    else { this$1.expect(types.comma); }
    if (allowEmpty && this$1.type === types.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
      break
    } else if (this$1.type === types.ellipsis) {
      var rest = this$1.parseRestBinding();
      this$1.parseBindingListItem(rest);
      elts.push(rest);
      if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
      this$1.expect(close);
      break
    } else {
      var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc);
      this$1.parseBindingListItem(elem);
      elts.push(elem);
    }
  }
  return elts
};

pp$2.parseBindingListItem = function(param) {
  return param
};

// Parses assignment pattern around given atom if possible.

pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(types.eq)) { return left }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern")
};

// Verify that a node is an lval — something that can be assigned
// to.
// bindingType can be either:
// 'var' indicating that the lval creates a 'var' binding
// 'let' indicating that the lval creates a lexical ('let' or 'const') binding
// 'none' indicating that the binding should be checked for illegal identifiers, but not for duplicate references

pp$2.checkLVal = function(expr, bindingType, checkClashes) {
  var this$1 = this;

  switch (expr.type) {
  case "Identifier":
    if (this.strict && this.reservedWordsStrictBind.test(expr.name))
      { this.raiseRecoverable(expr.start, (bindingType ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
    if (checkClashes) {
      if (has(checkClashes, expr.name))
        { this.raiseRecoverable(expr.start, "Argument name clash"); }
      checkClashes[expr.name] = true;
    }
    if (bindingType && bindingType !== "none") {
      if (
        bindingType === "var" && !this.canDeclareVarName(expr.name) ||
        bindingType !== "var" && !this.canDeclareLexicalName(expr.name)
      ) {
        this.raiseRecoverable(expr.start, ("Identifier '" + (expr.name) + "' has already been declared"));
      }
      if (bindingType === "var") {
        this.declareVarName(expr.name);
      } else {
        this.declareLexicalName(expr.name);
      }
    }
    break

  case "MemberExpression":
    if (bindingType) { this.raiseRecoverable(expr.start, "Binding member expression"); }
    break

  case "ObjectPattern":
    for (var i = 0, list = expr.properties; i < list.length; i += 1)
      {
    var prop = list[i];

    this$1.checkLVal(prop, bindingType, checkClashes);
  }
    break

  case "Property":
    // AssignmentProperty has type === "Property"
    this.checkLVal(expr.value, bindingType, checkClashes);
    break

  case "ArrayPattern":
    for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
      var elem = list$1[i$1];

    if (elem) { this$1.checkLVal(elem, bindingType, checkClashes); }
    }
    break

  case "AssignmentPattern":
    this.checkLVal(expr.left, bindingType, checkClashes);
    break

  case "RestElement":
    this.checkLVal(expr.argument, bindingType, checkClashes);
    break

  case "ParenthesizedExpression":
    this.checkLVal(expr.expression, bindingType, checkClashes);
    break

  default:
    this.raise(expr.start, (bindingType ? "Binding" : "Assigning to") + " rvalue");
  }
};

// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

var pp$3 = Parser.prototype;

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash —
// either with each other or with an init property — and in
// strict mode, init properties are also not allowed to be repeated.

pp$3.checkPropClash = function(prop, propHash, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
    { return }
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
    { return }
  var key = prop.key;
  var name;
  switch (key.type) {
  case "Identifier": name = key.name; break
  case "Literal": name = String(key.value); break
  default: return
  }
  var kind = prop.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) {
        if (refDestructuringErrors && refDestructuringErrors.doubleProto < 0) { refDestructuringErrors.doubleProto = key.start; }
        // Backwards-compat kludge. Can be removed in version 6.0
        else { this.raiseRecoverable(key.start, "Redefinition of __proto__ property"); }
      }
      propHash.proto = true;
    }
    return
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var redefinition;
    if (kind === "init") {
      redefinition = this.strict && other.init || other.get || other.set;
    } else {
      redefinition = other.init || other[kind];
    }
    if (redefinition)
      { this.raiseRecoverable(key.start, "Redefinition of property"); }
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp$3.parseExpression = function(noIn, refDestructuringErrors) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
  if (this.type === types.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(types.comma)) { node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors)); }
    return this.finishNode(node, "SequenceExpression")
  }
  return expr
};

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
  if (this.inGenerator && this.isContextual("yield")) { return this.parseYield() }

  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1;
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
    oldTrailingComma = refDestructuringErrors.trailingComma;
    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
  } else {
    refDestructuringErrors = new DestructuringErrors;
    ownDestructuringErrors = true;
  }

  var startPos = this.start, startLoc = this.startLoc;
  if (this.type === types.parenL || this.type === types.name)
    { this.potentialArrowAt = this.start; }
  var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
  if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
  if (this.type.isAssign) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.left = this.type === types.eq ? this.toAssignable(left, false, refDestructuringErrors) : left;
    if (!ownDestructuringErrors) { DestructuringErrors.call(refDestructuringErrors); }
    refDestructuringErrors.shorthandAssign = -1; // reset because shorthand default was used correctly
    this.checkLVal(left);
    this.next();
    node.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "AssignmentExpression")
  } else {
    if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
  }
  if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
  if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
  return left
};

// Parse a ternary conditional (`?:`) operator.

pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprOps(noIn, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  if (this.eat(types.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(types.colon);
    node.alternate = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "ConditionalExpression")
  }
  return expr
};

// Start the precedence parser.

pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors, false);
  if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
  return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, noIn)
};

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.type.binop;
  if (prec != null && (!noIn || this.type !== types._in)) {
    if (prec > minPrec) {
      var logical = this.type === types.logicalOR || this.type === types.logicalAND;
      var op = this.value;
      this.next();
      var startPos = this.start, startLoc = this.startLoc;
      var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn);
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical);
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
    }
  }
  return left
};

pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.operator = op;
  node.right = right;
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
};

// Parse unary operators, both prefix and postfix.

pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, expr;
  if (this.isContextual("await") && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction))) {
    expr = this.parseAwait();
    sawUnary = true;
  } else if (this.type.prefix) {
    var node = this.startNode(), update = this.type === types.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(null, true);
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) { this.checkLVal(node.argument); }
    else if (this.strict && node.operator === "delete" &&
             node.argument.type === "Identifier")
      { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
    else { sawUnary = true; }
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.operator = this$1.value;
      node$1.prefix = false;
      node$1.argument = expr;
      this$1.checkLVal(expr);
      this$1.next();
      expr = this$1.finishNode(node$1, "UpdateExpression");
    }
  }

  if (!sawUnary && this.eat(types.starstar))
    { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false) }
  else
    { return expr }
};

// Parse call, dot, and `[]`-subscript expressions.

pp$3.parseExprSubscripts = function(refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors);
  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")";
  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) { return expr }
  var result = this.parseSubscripts(expr, startPos, startLoc);
  if (refDestructuringErrors && result.type === "MemberExpression") {
    if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
    if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
  }
  return result
};

pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
  var this$1 = this;

  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
      this.lastTokEnd === base.end && !this.canInsertSemicolon() && this.input.slice(base.start, base.end) === "async";
  for (var computed = (void 0);;) {
    if ((computed = this$1.eat(types.bracketL)) || this$1.eat(types.dot)) {
      var node = this$1.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = computed ? this$1.parseExpression() : this$1.parseIdent(true);
      node.computed = !!computed;
      if (computed) { this$1.expect(types.bracketR); }
      base = this$1.finishNode(node, "MemberExpression");
    } else if (!noCalls && this$1.eat(types.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this$1.yieldPos, oldAwaitPos = this$1.awaitPos;
      this$1.yieldPos = 0;
      this$1.awaitPos = 0;
      var exprList = this$1.parseExprList(types.parenR, this$1.options.ecmaVersion >= 8, false, refDestructuringErrors);
      if (maybeAsyncArrow && !this$1.canInsertSemicolon() && this$1.eat(types.arrow)) {
        this$1.checkPatternErrors(refDestructuringErrors, false);
        this$1.checkYieldAwaitInDefaultParams();
        this$1.yieldPos = oldYieldPos;
        this$1.awaitPos = oldAwaitPos;
        return this$1.parseArrowExpression(this$1.startNodeAt(startPos, startLoc), exprList, true)
      }
      this$1.checkExpressionErrors(refDestructuringErrors, true);
      this$1.yieldPos = oldYieldPos || this$1.yieldPos;
      this$1.awaitPos = oldAwaitPos || this$1.awaitPos;
      var node$1 = this$1.startNodeAt(startPos, startLoc);
      node$1.callee = base;
      node$1.arguments = exprList;
      base = this$1.finishNode(node$1, "CallExpression");
    } else if (this$1.type === types.backQuote) {
      var node$2 = this$1.startNodeAt(startPos, startLoc);
      node$2.tag = base;
      node$2.quasi = this$1.parseTemplate({isTagged: true});
      base = this$1.finishNode(node$2, "TaggedTemplateExpression");
    } else {
      return base
    }
  }
};

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp$3.parseExprAtom = function(refDestructuringErrors) {
  var node, canBeArrow = this.potentialArrowAt === this.start;
  switch (this.type) {
  case types._super:
    if (!this.inFunction)
      { this.raise(this.start, "'super' outside of function or class"); }
    node = this.startNode();
    this.next();
    // The `super` keyword can appear at below:
    // SuperProperty:
    //     super [ Expression ]
    //     super . IdentifierName
    // SuperCall:
    //     super Arguments
    if (this.type !== types.dot && this.type !== types.bracketL && this.type !== types.parenL)
      { this.unexpected(); }
    return this.finishNode(node, "Super")

  case types._this:
    node = this.startNode();
    this.next();
    return this.finishNode(node, "ThisExpression")

  case types.name:
    var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
    var id = this.parseIdent(this.type !== types.name);
    if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types._function))
      { return this.parseFunction(this.startNodeAt(startPos, startLoc), false, false, true) }
    if (canBeArrow && !this.canInsertSemicolon()) {
      if (this.eat(types.arrow))
        { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false) }
      if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types.name && !containsEsc) {
        id = this.parseIdent();
        if (this.canInsertSemicolon() || !this.eat(types.arrow))
          { this.unexpected(); }
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
      }
    }
    return id

  case types.regexp:
    var value = this.value;
    node = this.parseLiteral(value.value);
    node.regex = {pattern: value.pattern, flags: value.flags};
    return node

  case types.num: case types.string:
    return this.parseLiteral(this.value)

  case types._null: case types._true: case types._false:
    node = this.startNode();
    node.value = this.type === types._null ? null : this.type === types._true;
    node.raw = this.type.keyword;
    this.next();
    return this.finishNode(node, "Literal")

  case types.parenL:
    var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow);
    if (refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
        { refDestructuringErrors.parenthesizedAssign = start; }
      if (refDestructuringErrors.parenthesizedBind < 0)
        { refDestructuringErrors.parenthesizedBind = start; }
    }
    return expr

  case types.bracketL:
    node = this.startNode();
    this.next();
    node.elements = this.parseExprList(types.bracketR, true, true, refDestructuringErrors);
    return this.finishNode(node, "ArrayExpression")

  case types.braceL:
    return this.parseObj(false, refDestructuringErrors)

  case types._function:
    node = this.startNode();
    this.next();
    return this.parseFunction(node, false)

  case types._class:
    return this.parseClass(this.startNode(), false)

  case types._new:
    return this.parseNew()

  case types.backQuote:
    return this.parseTemplate()

  default:
    this.unexpected();
  }
};

pp$3.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  this.next();
  return this.finishNode(node, "Literal")
};

pp$3.parseParenExpression = function() {
  this.expect(types.parenL);
  var val = this.parseExpression();
  this.expect(types.parenR);
  return val
};

pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();

    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    while (this.type !== types.parenR) {
      first ? first = false : this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(types.parenR, true)) {
        lastIsComma = true;
        break
      } else if (this$1.type === types.ellipsis) {
        spreadStart = this$1.start;
        exprList.push(this$1.parseParenItem(this$1.parseRestBinding()));
        if (this$1.type === types.comma) { this$1.raise(this$1.start, "Comma is not permitted after the rest element"); }
        break
      } else {
        exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem));
      }
    }
    var innerEndPos = this.start, innerEndLoc = this.startLoc;
    this.expect(types.parenR);

    if (canBeArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList)
    }

    if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
    if (spreadStart) { this.unexpected(spreadStart); }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression")
  } else {
    return val
  }
};

pp$3.parseParenItem = function(item) {
  return item
};

pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
};

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty$1 = [];

pp$3.parseNew = function() {
  var node = this.startNode();
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(types.dot)) {
    node.meta = meta;
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target" || containsEsc)
      { this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target"); }
    if (!this.inFunction)
      { this.raiseRecoverable(node.start, "new.target can only be used in functions"); }
    return this.finishNode(node, "MetaProperty")
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  if (this.eat(types.parenL)) { node.arguments = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8, false); }
  else { node.arguments = empty$1; }
  return this.finishNode(node, "NewExpression")
};

// Parse template expression.

pp$3.parseTemplateElement = function(ref) {
  var isTagged = ref.isTagged;

  var elem = this.startNode();
  if (this.type === types.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value,
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types.backQuote;
  return this.finishNode(elem, "TemplateElement")
};

pp$3.parseTemplate = function(ref) {
  var this$1 = this;
  if ( ref === void 0 ) ref = {};
  var isTagged = ref.isTagged; if ( isTagged === void 0 ) isTagged = false;

  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({isTagged: isTagged});
  node.quasis = [curElt];
  while (!curElt.tail) {
    if (this$1.type === types.eof) { this$1.raise(this$1.pos, "Unterminated template literal"); }
    this$1.expect(types.dollarBraceL);
    node.expressions.push(this$1.parseExpression());
    this$1.expect(types.braceR);
    node.quasis.push(curElt = this$1.parseTemplateElement({isTagged: isTagged}));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral")
};

pp$3.isAsyncProp = function(prop) {
  return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
    (this.type === types.name || this.type === types.num || this.type === types.string || this.type === types.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types.star)) &&
    !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
};

// Parse an object literal or binding pattern.

pp$3.parseObj = function(isPattern, refDestructuringErrors) {
  var this$1 = this;

  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types.braceR)) {
    if (!first) {
      this$1.expect(types.comma);
      if (this$1.afterTrailingComma(types.braceR)) { break }
    } else { first = false; }

    var prop = this$1.parseProperty(isPattern, refDestructuringErrors);
    if (!isPattern) { this$1.checkPropClash(prop, propHash, refDestructuringErrors); }
    node.properties.push(prop);
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
};

pp$3.parseProperty = function(isPattern, refDestructuringErrors) {
  var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
  if (this.options.ecmaVersion >= 9 && this.eat(types.ellipsis)) {
    if (isPattern) {
      prop.argument = this.parseIdent(false);
      if (this.type === types.comma) {
        this.raise(this.start, "Comma is not permitted after the rest element");
      }
      return this.finishNode(prop, "RestElement")
    }
    // To disallow parenthesized identifier via `this.toAssignable()`.
    if (this.type === types.parenL && refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0) {
        refDestructuringErrors.parenthesizedAssign = this.start;
      }
      if (refDestructuringErrors.parenthesizedBind < 0) {
        refDestructuringErrors.parenthesizedBind = this.start;
      }
    }
    // Parse argument.
    prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    // To disallow trailing comma via `this.toAssignable()`.
    if (this.type === types.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
      refDestructuringErrors.trailingComma = this.start;
    }
    // Finish
    return this.finishNode(prop, "SpreadElement")
  }
  if (this.options.ecmaVersion >= 6) {
    prop.method = false;
    prop.shorthand = false;
    if (isPattern || refDestructuringErrors) {
      startPos = this.start;
      startLoc = this.startLoc;
    }
    if (!isPattern)
      { isGenerator = this.eat(types.star); }
  }
  var containsEsc = this.containsEsc;
  this.parsePropertyName(prop);
  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
    isAsync = true;
    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
    this.parsePropertyName(prop, refDestructuringErrors);
  } else {
    isAsync = false;
  }
  this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
  return this.finishNode(prop, "Property")
};

pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
  if ((isGenerator || isAsync) && this.type === types.colon)
    { this.unexpected(); }

  if (this.eat(types.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types.parenL) {
    if (isPattern) { this.unexpected(); }
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator, isAsync);
  } else if (!isPattern && !containsEsc &&
             this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
             (prop.key.name === "get" || prop.key.name === "set") &&
             (this.type !== types.comma && this.type !== types.braceR)) {
    if (isGenerator || isAsync) { this.unexpected(); }
    prop.kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get")
        { this.raiseRecoverable(start, "getter should have no params"); }
      else
        { this.raiseRecoverable(start, "setter should have exactly one param"); }
    } else {
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
    }
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    this.checkUnreserved(prop.key);
    prop.kind = "init";
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else if (this.type === types.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0)
        { refDestructuringErrors.shorthandAssign = this.start; }
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else {
      prop.value = prop.key;
    }
    prop.shorthand = true;
  } else { this.unexpected(); }
};

pp$3.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types.bracketR);
      return prop.key
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === types.num || this.type === types.string ? this.parseExprAtom() : this.parseIdent(true)
};

// Initialize empty function node.

pp$3.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = false;
    node.expression = false;
  }
  if (this.options.ecmaVersion >= 8)
    { node.async = false; }
};

// Parse object or class method.

pp$3.parseMethod = function(isGenerator, isAsync) {
  var node = this.startNode(), oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;

  this.initFunction(node);
  if (this.options.ecmaVersion >= 6)
    { node.generator = isGenerator; }
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.inGenerator = node.generator;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;
  this.enterFunctionScope();

  this.expect(types.parenL);
  node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, "FunctionExpression")
};

// Parse arrow function expression with given parameters.

pp$3.parseArrowExpression = function(node, params, isAsync) {
  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction;

  this.enterFunctionScope();
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8)
    { node.async = !!isAsync; }

  this.inGenerator = false;
  this.inAsync = node.async;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.inFunction = true;

  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true);

  this.inGenerator = oldInGen;
  this.inAsync = oldInAsync;
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.inFunction = oldInFunc;
  return this.finishNode(node, "ArrowFunctionExpression")
};

// Parse function body and check parameters.

pp$3.parseFunctionBody = function(node, isArrowFunction) {
  var isExpression = isArrowFunction && this.type !== types.braceL;
  var oldStrict = this.strict, useStrict = false;

  if (isExpression) {
    node.body = this.parseMaybeAssign();
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      // If this is a strict mode function, verify that argument names
      // are not repeated, and it does not try to bind the words `eval`
      // or `arguments`.
      if (useStrict && nonSimple)
        { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
    }
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) { this.strict = true; }

    // Add the params to varDeclaredNames to ensure that an error is thrown
    // if a let/const declaration in the function clashes with one of the params.
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && this.isSimpleParamList(node.params));
    node.body = this.parseBlock(false);
    node.expression = false;
    this.adaptDirectivePrologue(node.body.body);
    this.labels = oldLabels;
  }
  this.exitFunctionScope();

  if (this.strict && node.id) {
    // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
    this.checkLVal(node.id, "none");
  }
  this.strict = oldStrict;
};

pp$3.isSimpleParamList = function(params) {
  for (var i = 0, list = params; i < list.length; i += 1)
    {
    var param = list[i];

    if (param.type !== "Identifier") { return false
  } }
  return true
};

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp$3.checkParams = function(node, allowDuplicates) {
  var this$1 = this;

  var nameHash = {};
  for (var i = 0, list = node.params; i < list.length; i += 1)
    {
    var param = list[i];

    this$1.checkLVal(param, "var", allowDuplicates ? null : nameHash);
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var this$1 = this;

  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this$1.expect(types.comma);
      if (allowTrailingComma && this$1.afterTrailingComma(close)) { break }
    } else { first = false; }

    var elt = (void 0);
    if (allowEmpty && this$1.type === types.comma)
      { elt = null; }
    else if (this$1.type === types.ellipsis) {
      elt = this$1.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this$1.type === types.comma && refDestructuringErrors.trailingComma < 0)
        { refDestructuringErrors.trailingComma = this$1.start; }
    } else {
      elt = this$1.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts
};

pp$3.checkUnreserved = function(ref) {
  var start = ref.start;
  var end = ref.end;
  var name = ref.name;

  if (this.inGenerator && name === "yield")
    { this.raiseRecoverable(start, "Can not use 'yield' as identifier inside a generator"); }
  if (this.inAsync && name === "await")
    { this.raiseRecoverable(start, "Can not use 'await' as identifier inside an async function"); }
  if (this.isKeyword(name))
    { this.raise(start, ("Unexpected keyword '" + name + "'")); }
  if (this.options.ecmaVersion < 6 &&
    this.input.slice(start, end).indexOf("\\") !== -1) { return }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name)) {
    if (!this.inAsync && name === "await")
      { this.raiseRecoverable(start, "Can not use keyword 'await' outside an async function"); }
    this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
  }
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp$3.parseIdent = function(liberal, isBinding) {
  var node = this.startNode();
  if (liberal && this.options.allowReserved === "never") { liberal = false; }
  if (this.type === types.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;

    // To fix https://github.com/acornjs/acorn/issues/575
    // `class` and `function` keywords push new context into this.context.
    // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
    // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
    if ((node.name === "class" || node.name === "function") &&
        (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
      this.context.pop();
    }
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "Identifier");
  if (!liberal) { this.checkUnreserved(node); }
  return node
};

// Parses yield expression inside generator.

pp$3.parseYield = function() {
  if (!this.yieldPos) { this.yieldPos = this.start; }

  var node = this.startNode();
  this.next();
  if (this.type === types.semi || this.canInsertSemicolon() || (this.type !== types.star && !this.type.startsExpr)) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types.star);
    node.argument = this.parseMaybeAssign();
  }
  return this.finishNode(node, "YieldExpression")
};

pp$3.parseAwait = function() {
  if (!this.awaitPos) { this.awaitPos = this.start; }

  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true);
  return this.finishNode(node, "AwaitExpression")
};

var pp$4 = Parser.prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
  throw err
};

pp$4.raiseRecoverable = pp$4.raise;

pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart)
  }
};

var pp$5 = Parser.prototype;

// Object.assign polyfill
var assign = Object.assign || function(target) {
  var sources = [], len = arguments.length - 1;
  while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];

  for (var i = 0, list = sources; i < list.length; i += 1) {
    var source = list[i];

    for (var key in source) {
      if (has(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target
};

// The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

pp$5.enterFunctionScope = function() {
  // var: a hash of var-declared names in the current lexical scope
  // lexical: a hash of lexically-declared names in the current lexical scope
  // childVar: a hash of var-declared names in all child lexical scopes of the current lexical scope (within the current function scope)
  // parentLexical: a hash of lexically-declared names in all parent lexical scopes of the current lexical scope (within the current function scope)
  this.scopeStack.push({var: {}, lexical: {}, childVar: {}, parentLexical: {}});
};

pp$5.exitFunctionScope = function() {
  this.scopeStack.pop();
};

pp$5.enterLexicalScope = function() {
  var parentScope = this.scopeStack[this.scopeStack.length - 1];
  var childScope = {var: {}, lexical: {}, childVar: {}, parentLexical: {}};

  this.scopeStack.push(childScope);
  assign(childScope.parentLexical, parentScope.lexical, parentScope.parentLexical);
};

pp$5.exitLexicalScope = function() {
  var childScope = this.scopeStack.pop();
  var parentScope = this.scopeStack[this.scopeStack.length - 1];

  assign(parentScope.childVar, childScope.var, childScope.childVar);
};

/**
 * A name can be declared with `var` if there are no variables with the same name declared with `let`/`const`
 * in the current lexical scope or any of the parent lexical scopes in this function.
 */
pp$5.canDeclareVarName = function(name) {
  var currentScope = this.scopeStack[this.scopeStack.length - 1];

  return !has(currentScope.lexical, name) && !has(currentScope.parentLexical, name)
};

/**
 * A name can be declared with `let`/`const` if there are no variables with the same name declared with `let`/`const`
 * in the current scope, and there are no variables with the same name declared with `var` in the current scope or in
 * any child lexical scopes in this function.
 */
pp$5.canDeclareLexicalName = function(name) {
  var currentScope = this.scopeStack[this.scopeStack.length - 1];

  return !has(currentScope.lexical, name) && !has(currentScope.var, name) && !has(currentScope.childVar, name)
};

pp$5.declareVarName = function(name) {
  this.scopeStack[this.scopeStack.length - 1].var[name] = true;
};

pp$5.declareLexicalName = function(name) {
  this.scopeStack[this.scopeStack.length - 1].lexical[name] = true;
};

var Node = function Node(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations)
    { this.loc = new SourceLocation(parser, loc); }
  if (parser.options.directSourceFile)
    { this.sourceFile = parser.options.directSourceFile; }
  if (parser.options.ranges)
    { this.range = [pos, 0]; }
};

// Start an AST node, attaching a start offset.

var pp$6 = Parser.prototype;

pp$6.startNode = function() {
  return new Node(this, this.start, this.startLoc)
};

pp$6.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc)
};

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations)
    { node.loc.end = loc; }
  if (this.options.ranges)
    { node.range[1] = pos; }
  return node
}

pp$6.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
};

// Finish node at given position

pp$6.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc)
};

// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
  this.generator = !!generator;
};

var types$1 = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", false),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
  f_stat: new TokContext("function", false),
  f_expr: new TokContext("function", true),
  f_expr_gen: new TokContext("function", true, false, null, true),
  f_gen: new TokContext("function", false, false, null, true)
};

var pp$7 = Parser.prototype;

pp$7.initialContext = function() {
  return [types$1.b_stat]
};

pp$7.braceIsBlock = function(prevType) {
  var parent = this.curContext();
  if (parent === types$1.f_expr || parent === types$1.f_stat)
    { return true }
  if (prevType === types.colon && (parent === types$1.b_stat || parent === types$1.b_expr))
    { return !parent.isExpr }

  // The check for `tt.name && exprAllowed` detects whether we are
  // after a `yield` or `of` construct. See the `updateContext` for
  // `tt.name`.
  if (prevType === types._return || prevType === types.name && this.exprAllowed)
    { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
  if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR || prevType === types.arrow)
    { return true }
  if (prevType === types.braceL)
    { return parent === types$1.b_stat }
  if (prevType === types._var || prevType === types.name)
    { return false }
  return !this.exprAllowed
};

pp$7.inGeneratorContext = function() {
  var this$1 = this;

  for (var i = this.context.length - 1; i >= 1; i--) {
    var context = this$1.context[i];
    if (context.token === "function")
      { return context.generator }
  }
  return false
};

pp$7.updateContext = function(prevType) {
  var update, type = this.type;
  if (type.keyword && prevType === types.dot)
    { this.exprAllowed = false; }
  else if (update = type.updateContext)
    { update.call(this, prevType); }
  else
    { this.exprAllowed = type.beforeExpr; }
};

// Token-specific context update code

types.parenR.updateContext = types.braceR.updateContext = function() {
  if (this.context.length === 1) {
    this.exprAllowed = true;
    return
  }
  var out = this.context.pop();
  if (out === types$1.b_stat && this.curContext().token === "function") {
    out = this.context.pop();
  }
  this.exprAllowed = !out.isExpr;
};

types.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types$1.b_stat : types$1.b_expr);
  this.exprAllowed = true;
};

types.dollarBraceL.updateContext = function() {
  this.context.push(types$1.b_tmpl);
  this.exprAllowed = true;
};

types.parenL.updateContext = function(prevType) {
  var statementParens = prevType === types._if || prevType === types._for || prevType === types._with || prevType === types._while;
  this.context.push(statementParens ? types$1.p_stat : types$1.p_expr);
  this.exprAllowed = true;
};

types.incDec.updateContext = function() {
  // tokExprAllowed stays unchanged
};

types._function.updateContext = types._class.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== types.semi && prevType !== types._else &&
      !((prevType === types.colon || prevType === types.braceL) && this.curContext() === types$1.b_stat))
    { this.context.push(types$1.f_expr); }
  else
    { this.context.push(types$1.f_stat); }
  this.exprAllowed = false;
};

types.backQuote.updateContext = function() {
  if (this.curContext() === types$1.q_tmpl)
    { this.context.pop(); }
  else
    { this.context.push(types$1.q_tmpl); }
  this.exprAllowed = false;
};

types.star.updateContext = function(prevType) {
  if (prevType === types._function) {
    var index = this.context.length - 1;
    if (this.context[index] === types$1.f_expr)
      { this.context[index] = types$1.f_expr_gen; }
    else
      { this.context[index] = types$1.f_gen; }
  }
  this.exprAllowed = true;
};

types.name.updateContext = function(prevType) {
  var allowed = false;
  if (this.options.ecmaVersion >= 6 && prevType !== types.dot) {
    if (this.value === "of" && !this.exprAllowed ||
        this.value === "yield" && this.inGeneratorContext())
      { allowed = true; }
  }
  this.exprAllowed = allowed;
};

var data = {
  "$LONE": [
    "ASCII",
    "ASCII_Hex_Digit",
    "AHex",
    "Alphabetic",
    "Alpha",
    "Any",
    "Assigned",
    "Bidi_Control",
    "Bidi_C",
    "Bidi_Mirrored",
    "Bidi_M",
    "Case_Ignorable",
    "CI",
    "Cased",
    "Changes_When_Casefolded",
    "CWCF",
    "Changes_When_Casemapped",
    "CWCM",
    "Changes_When_Lowercased",
    "CWL",
    "Changes_When_NFKC_Casefolded",
    "CWKCF",
    "Changes_When_Titlecased",
    "CWT",
    "Changes_When_Uppercased",
    "CWU",
    "Dash",
    "Default_Ignorable_Code_Point",
    "DI",
    "Deprecated",
    "Dep",
    "Diacritic",
    "Dia",
    "Emoji",
    "Emoji_Component",
    "Emoji_Modifier",
    "Emoji_Modifier_Base",
    "Emoji_Presentation",
    "Extender",
    "Ext",
    "Grapheme_Base",
    "Gr_Base",
    "Grapheme_Extend",
    "Gr_Ext",
    "Hex_Digit",
    "Hex",
    "IDS_Binary_Operator",
    "IDSB",
    "IDS_Trinary_Operator",
    "IDST",
    "ID_Continue",
    "IDC",
    "ID_Start",
    "IDS",
    "Ideographic",
    "Ideo",
    "Join_Control",
    "Join_C",
    "Logical_Order_Exception",
    "LOE",
    "Lowercase",
    "Lower",
    "Math",
    "Noncharacter_Code_Point",
    "NChar",
    "Pattern_Syntax",
    "Pat_Syn",
    "Pattern_White_Space",
    "Pat_WS",
    "Quotation_Mark",
    "QMark",
    "Radical",
    "Regional_Indicator",
    "RI",
    "Sentence_Terminal",
    "STerm",
    "Soft_Dotted",
    "SD",
    "Terminal_Punctuation",
    "Term",
    "Unified_Ideograph",
    "UIdeo",
    "Uppercase",
    "Upper",
    "Variation_Selector",
    "VS",
    "White_Space",
    "space",
    "XID_Continue",
    "XIDC",
    "XID_Start",
    "XIDS"
  ],
  "General_Category": [
    "Cased_Letter",
    "LC",
    "Close_Punctuation",
    "Pe",
    "Connector_Punctuation",
    "Pc",
    "Control",
    "Cc",
    "cntrl",
    "Currency_Symbol",
    "Sc",
    "Dash_Punctuation",
    "Pd",
    "Decimal_Number",
    "Nd",
    "digit",
    "Enclosing_Mark",
    "Me",
    "Final_Punctuation",
    "Pf",
    "Format",
    "Cf",
    "Initial_Punctuation",
    "Pi",
    "Letter",
    "L",
    "Letter_Number",
    "Nl",
    "Line_Separator",
    "Zl",
    "Lowercase_Letter",
    "Ll",
    "Mark",
    "M",
    "Combining_Mark",
    "Math_Symbol",
    "Sm",
    "Modifier_Letter",
    "Lm",
    "Modifier_Symbol",
    "Sk",
    "Nonspacing_Mark",
    "Mn",
    "Number",
    "N",
    "Open_Punctuation",
    "Ps",
    "Other",
    "C",
    "Other_Letter",
    "Lo",
    "Other_Number",
    "No",
    "Other_Punctuation",
    "Po",
    "Other_Symbol",
    "So",
    "Paragraph_Separator",
    "Zp",
    "Private_Use",
    "Co",
    "Punctuation",
    "P",
    "punct",
    "Separator",
    "Z",
    "Space_Separator",
    "Zs",
    "Spacing_Mark",
    "Mc",
    "Surrogate",
    "Cs",
    "Symbol",
    "S",
    "Titlecase_Letter",
    "Lt",
    "Unassigned",
    "Cn",
    "Uppercase_Letter",
    "Lu"
  ],
  "Script": [
    "Adlam",
    "Adlm",
    "Ahom",
    "Anatolian_Hieroglyphs",
    "Hluw",
    "Arabic",
    "Arab",
    "Armenian",
    "Armn",
    "Avestan",
    "Avst",
    "Balinese",
    "Bali",
    "Bamum",
    "Bamu",
    "Bassa_Vah",
    "Bass",
    "Batak",
    "Batk",
    "Bengali",
    "Beng",
    "Bhaiksuki",
    "Bhks",
    "Bopomofo",
    "Bopo",
    "Brahmi",
    "Brah",
    "Braille",
    "Brai",
    "Buginese",
    "Bugi",
    "Buhid",
    "Buhd",
    "Canadian_Aboriginal",
    "Cans",
    "Carian",
    "Cari",
    "Caucasian_Albanian",
    "Aghb",
    "Chakma",
    "Cakm",
    "Cham",
    "Cherokee",
    "Cher",
    "Common",
    "Zyyy",
    "Coptic",
    "Copt",
    "Qaac",
    "Cuneiform",
    "Xsux",
    "Cypriot",
    "Cprt",
    "Cyrillic",
    "Cyrl",
    "Deseret",
    "Dsrt",
    "Devanagari",
    "Deva",
    "Duployan",
    "Dupl",
    "Egyptian_Hieroglyphs",
    "Egyp",
    "Elbasan",
    "Elba",
    "Ethiopic",
    "Ethi",
    "Georgian",
    "Geor",
    "Glagolitic",
    "Glag",
    "Gothic",
    "Goth",
    "Grantha",
    "Gran",
    "Greek",
    "Grek",
    "Gujarati",
    "Gujr",
    "Gurmukhi",
    "Guru",
    "Han",
    "Hani",
    "Hangul",
    "Hang",
    "Hanunoo",
    "Hano",
    "Hatran",
    "Hatr",
    "Hebrew",
    "Hebr",
    "Hiragana",
    "Hira",
    "Imperial_Aramaic",
    "Armi",
    "Inherited",
    "Zinh",
    "Qaai",
    "Inscriptional_Pahlavi",
    "Phli",
    "Inscriptional_Parthian",
    "Prti",
    "Javanese",
    "Java",
    "Kaithi",
    "Kthi",
    "Kannada",
    "Knda",
    "Katakana",
    "Kana",
    "Kayah_Li",
    "Kali",
    "Kharoshthi",
    "Khar",
    "Khmer",
    "Khmr",
    "Khojki",
    "Khoj",
    "Khudawadi",
    "Sind",
    "Lao",
    "Laoo",
    "Latin",
    "Latn",
    "Lepcha",
    "Lepc",
    "Limbu",
    "Limb",
    "Linear_A",
    "Lina",
    "Linear_B",
    "Linb",
    "Lisu",
    "Lycian",
    "Lyci",
    "Lydian",
    "Lydi",
    "Mahajani",
    "Mahj",
    "Malayalam",
    "Mlym",
    "Mandaic",
    "Mand",
    "Manichaean",
    "Mani",
    "Marchen",
    "Marc",
    "Masaram_Gondi",
    "Gonm",
    "Meetei_Mayek",
    "Mtei",
    "Mende_Kikakui",
    "Mend",
    "Meroitic_Cursive",
    "Merc",
    "Meroitic_Hieroglyphs",
    "Mero",
    "Miao",
    "Plrd",
    "Modi",
    "Mongolian",
    "Mong",
    "Mro",
    "Mroo",
    "Multani",
    "Mult",
    "Myanmar",
    "Mymr",
    "Nabataean",
    "Nbat",
    "New_Tai_Lue",
    "Talu",
    "Newa",
    "Nko",
    "Nkoo",
    "Nushu",
    "Nshu",
    "Ogham",
    "Ogam",
    "Ol_Chiki",
    "Olck",
    "Old_Hungarian",
    "Hung",
    "Old_Italic",
    "Ital",
    "Old_North_Arabian",
    "Narb",
    "Old_Permic",
    "Perm",
    "Old_Persian",
    "Xpeo",
    "Old_South_Arabian",
    "Sarb",
    "Old_Turkic",
    "Orkh",
    "Oriya",
    "Orya",
    "Osage",
    "Osge",
    "Osmanya",
    "Osma",
    "Pahawh_Hmong",
    "Hmng",
    "Palmyrene",
    "Palm",
    "Pau_Cin_Hau",
    "Pauc",
    "Phags_Pa",
    "Phag",
    "Phoenician",
    "Phnx",
    "Psalter_Pahlavi",
    "Phlp",
    "Rejang",
    "Rjng",
    "Runic",
    "Runr",
    "Samaritan",
    "Samr",
    "Saurashtra",
    "Saur",
    "Sharada",
    "Shrd",
    "Shavian",
    "Shaw",
    "Siddham",
    "Sidd",
    "SignWriting",
    "Sgnw",
    "Sinhala",
    "Sinh",
    "Sora_Sompeng",
    "Sora",
    "Soyombo",
    "Soyo",
    "Sundanese",
    "Sund",
    "Syloti_Nagri",
    "Sylo",
    "Syriac",
    "Syrc",
    "Tagalog",
    "Tglg",
    "Tagbanwa",
    "Tagb",
    "Tai_Le",
    "Tale",
    "Tai_Tham",
    "Lana",
    "Tai_Viet",
    "Tavt",
    "Takri",
    "Takr",
    "Tamil",
    "Taml",
    "Tangut",
    "Tang",
    "Telugu",
    "Telu",
    "Thaana",
    "Thaa",
    "Thai",
    "Tibetan",
    "Tibt",
    "Tifinagh",
    "Tfng",
    "Tirhuta",
    "Tirh",
    "Ugaritic",
    "Ugar",
    "Vai",
    "Vaii",
    "Warang_Citi",
    "Wara",
    "Yi",
    "Yiii",
    "Zanabazar_Square",
    "Zanb"
  ]
};
Array.prototype.push.apply(data.$LONE, data.General_Category);
data.gc = data.General_Category;
data.sc = data.Script_Extensions = data.scx = data.Script;

var pp$9 = Parser.prototype;

var RegExpValidationState = function RegExpValidationState(parser) {
  this.parser = parser;
  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "");
  this.source = "";
  this.flags = "";
  this.start = 0;
  this.switchU = false;
  this.switchN = false;
  this.pos = 0;
  this.lastIntValue = 0;
  this.lastStringValue = "";
  this.lastAssertionIsQuantifiable = false;
  this.numCapturingParens = 0;
  this.maxBackReference = 0;
  this.groupNames = [];
  this.backReferenceNames = [];
};

RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
  var unicode = flags.indexOf("u") !== -1;
  this.start = start | 0;
  this.source = pattern + "";
  this.flags = flags;
  this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
  this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
};

RegExpValidationState.prototype.raise = function raise (message) {
  this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
};

// If u flag is given, this returns the code point at the index (it combines a surrogate pair).
// Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
RegExpValidationState.prototype.at = function at (i) {
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return -1
  }
  var c = s.charCodeAt(i);
  if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
    return c
  }
  return (c << 10) + s.charCodeAt(i + 1) - 0x35FDC00
};

RegExpValidationState.prototype.nextIndex = function nextIndex (i) {
  var s = this.source;
  var l = s.length;
  if (i >= l) {
    return l
  }
  var c = s.charCodeAt(i);
  if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
    return i + 1
  }
  return i + 2
};

RegExpValidationState.prototype.current = function current () {
  return this.at(this.pos)
};

RegExpValidationState.prototype.lookahead = function lookahead () {
  return this.at(this.nextIndex(this.pos))
};

RegExpValidationState.prototype.advance = function advance () {
  this.pos = this.nextIndex(this.pos);
};

RegExpValidationState.prototype.eat = function eat (ch) {
  if (this.current() === ch) {
    this.advance();
    return true
  }
  return false
};

function codePointToString$1(ch) {
  if (ch <= 0xFFFF) { return String.fromCharCode(ch) }
  ch -= 0x10000;
  return String.fromCharCode((ch >> 10) + 0xD800, (ch & 0x03FF) + 0xDC00)
}

/**
 * Validate the flags part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$9.validateRegExpFlags = function(state) {
  var this$1 = this;

  var validFlags = state.validFlags;
  var flags = state.flags;

  for (var i = 0; i < flags.length; i++) {
    var flag = flags.charAt(i);
    if (validFlags.indexOf(flag) === -1) {
      this$1.raise(state.start, "Invalid regular expression flag");
    }
    if (flags.indexOf(flag, i + 1) > -1) {
      this$1.raise(state.start, "Duplicate regular expression flag");
    }
  }
};

/**
 * Validate the pattern part of a given RegExpLiteral.
 *
 * @param {RegExpValidationState} state The state to validate RegExp.
 * @returns {void}
 */
pp$9.validateRegExpPattern = function(state) {
  this.regexp_pattern(state);

  // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
  // parsing contains a |GroupName|, reparse with the goal symbol
  // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
  // exception if _P_ did not conform to the grammar, if any elements of _P_
  // were not matched by the parse, or if any Early Error conditions exist.
  if (!state.switchN && this.options.ecmaVersion >= 9 && state.groupNames.length > 0) {
    state.switchN = true;
    this.regexp_pattern(state);
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
pp$9.regexp_pattern = function(state) {
  state.pos = 0;
  state.lastIntValue = 0;
  state.lastStringValue = "";
  state.lastAssertionIsQuantifiable = false;
  state.numCapturingParens = 0;
  state.maxBackReference = 0;
  state.groupNames.length = 0;
  state.backReferenceNames.length = 0;

  this.regexp_disjunction(state);

  if (state.pos !== state.source.length) {
    // Make the same messages as V8.
    if (state.eat(0x29 /* ) */)) {
      state.raise("Unmatched ')'");
    }
    if (state.eat(0x5D /* [ */) || state.eat(0x7D /* } */)) {
      state.raise("Lone quantifier brackets");
    }
  }
  if (state.maxBackReference > state.numCapturingParens) {
    state.raise("Invalid escape");
  }
  for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
    var name = list[i];

    if (state.groupNames.indexOf(name) === -1) {
      state.raise("Invalid named capture referenced");
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
pp$9.regexp_disjunction = function(state) {
  var this$1 = this;

  this.regexp_alternative(state);
  while (state.eat(0x7C /* | */)) {
    this$1.regexp_alternative(state);
  }

  // Make the same message as V8.
  if (this.regexp_eatQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  if (state.eat(0x7B /* { */)) {
    state.raise("Lone quantifier brackets");
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
pp$9.regexp_alternative = function(state) {
  while (state.pos < state.source.length && this.regexp_eatTerm(state))
    {  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
pp$9.regexp_eatTerm = function(state) {
  if (this.regexp_eatAssertion(state)) {
    // Handle `QuantifiableAssertion Quantifier` alternative.
    // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
    // is a QuantifiableAssertion.
    if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
      // Make the same message as V8.
      if (state.switchU) {
        state.raise("Invalid quantifier");
      }
    }
    return true
  }

  if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
    this.regexp_eatQuantifier(state);
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
pp$9.regexp_eatAssertion = function(state) {
  var start = state.pos;
  state.lastAssertionIsQuantifiable = false;

  // ^, $
  if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
    return true
  }

  // \b \B
  if (state.eat(0x5C /* \ */)) {
    if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
      return true
    }
    state.pos = start;
  }

  // Lookahead / Lookbehind
  if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
    var lookbehind = false;
    if (this.options.ecmaVersion >= 9) {
      lookbehind = state.eat(0x3C /* < */);
    }
    if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
      this.regexp_disjunction(state);
      if (!state.eat(0x29 /* ) */)) {
        state.raise("Unterminated group");
      }
      state.lastAssertionIsQuantifiable = !lookbehind;
      return true
    }
  }

  state.pos = start;
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
pp$9.regexp_eatQuantifier = function(state, noError) {
  if ( noError === void 0 ) noError = false;

  if (this.regexp_eatQuantifierPrefix(state, noError)) {
    state.eat(0x3F /* ? */);
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
pp$9.regexp_eatQuantifierPrefix = function(state, noError) {
  return (
    state.eat(0x2A /* * */) ||
    state.eat(0x2B /* + */) ||
    state.eat(0x3F /* ? */) ||
    this.regexp_eatBracedQuantifier(state, noError)
  )
};
pp$9.regexp_eatBracedQuantifier = function(state, noError) {
  var start = state.pos;
  if (state.eat(0x7B /* { */)) {
    var min = 0, max = -1;
    if (this.regexp_eatDecimalDigits(state)) {
      min = state.lastIntValue;
      if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
        max = state.lastIntValue;
      }
      if (state.eat(0x7D /* } */)) {
        // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
        if (max !== -1 && max < min && !noError) {
          state.raise("numbers out of order in {} quantifier");
        }
        return true
      }
    }
    if (state.switchU && !noError) {
      state.raise("Incomplete quantifier");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
pp$9.regexp_eatAtom = function(state) {
  return (
    this.regexp_eatPatternCharacters(state) ||
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state)
  )
};
pp$9.regexp_eatReverseSolidusAtomEscape = function(state) {
  var start = state.pos;
  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatAtomEscape(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatUncapturingGroup = function(state) {
  var start = state.pos;
  if (state.eat(0x28 /* ( */)) {
    if (state.eat(0x3F /* ? */) && state.eat(0x3A /* : */)) {
      this.regexp_disjunction(state);
      if (state.eat(0x29 /* ) */)) {
        return true
      }
      state.raise("Unterminated group");
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatCapturingGroup = function(state) {
  if (state.eat(0x28 /* ( */)) {
    if (this.options.ecmaVersion >= 9) {
      this.regexp_groupSpecifier(state);
    } else if (state.current() === 0x3F /* ? */) {
      state.raise("Invalid group");
    }
    this.regexp_disjunction(state);
    if (state.eat(0x29 /* ) */)) {
      state.numCapturingParens += 1;
      return true
    }
    state.raise("Unterminated group");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
pp$9.regexp_eatExtendedAtom = function(state) {
  return (
    state.eat(0x2E /* . */) ||
    this.regexp_eatReverseSolidusAtomEscape(state) ||
    this.regexp_eatCharacterClass(state) ||
    this.regexp_eatUncapturingGroup(state) ||
    this.regexp_eatCapturingGroup(state) ||
    this.regexp_eatInvalidBracedQuantifier(state) ||
    this.regexp_eatExtendedPatternCharacter(state)
  )
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
pp$9.regexp_eatInvalidBracedQuantifier = function(state) {
  if (this.regexp_eatBracedQuantifier(state, true)) {
    state.raise("Nothing to repeat");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
pp$9.regexp_eatSyntaxCharacter = function(state) {
  var ch = state.current();
  if (isSyntaxCharacter(ch)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }
  return false
};
function isSyntaxCharacter(ch) {
  return (
    ch === 0x24 /* $ */ ||
    ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
    ch === 0x2E /* . */ ||
    ch === 0x3F /* ? */ ||
    ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
    ch >= 0x7B /* { */ && ch <= 0x7D /* } */
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
// But eat eager.
pp$9.regexp_eatPatternCharacters = function(state) {
  var start = state.pos;
  var ch = 0;
  while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
    state.advance();
  }
  return state.pos !== start
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
pp$9.regexp_eatExtendedPatternCharacter = function(state) {
  var ch = state.current();
  if (
    ch !== -1 &&
    ch !== 0x24 /* $ */ &&
    !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
    ch !== 0x2E /* . */ &&
    ch !== 0x3F /* ? */ &&
    ch !== 0x5B /* [ */ &&
    ch !== 0x5E /* ^ */ &&
    ch !== 0x7C /* | */
  ) {
    state.advance();
    return true
  }
  return false
};

// GroupSpecifier[U] ::
//   [empty]
//   `?` GroupName[?U]
pp$9.regexp_groupSpecifier = function(state) {
  if (state.eat(0x3F /* ? */)) {
    if (this.regexp_eatGroupName(state)) {
      if (state.groupNames.indexOf(state.lastStringValue) !== -1) {
        state.raise("Duplicate capture group name");
      }
      state.groupNames.push(state.lastStringValue);
      return
    }
    state.raise("Invalid group");
  }
};

// GroupName[U] ::
//   `<` RegExpIdentifierName[?U] `>`
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$9.regexp_eatGroupName = function(state) {
  state.lastStringValue = "";
  if (state.eat(0x3C /* < */)) {
    if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
      return true
    }
    state.raise("Invalid capture group name");
  }
  return false
};

// RegExpIdentifierName[U] ::
//   RegExpIdentifierStart[?U]
//   RegExpIdentifierName[?U] RegExpIdentifierPart[?U]
// Note: this updates `state.lastStringValue` property with the eaten name.
pp$9.regexp_eatRegExpIdentifierName = function(state) {
  state.lastStringValue = "";
  if (this.regexp_eatRegExpIdentifierStart(state)) {
    state.lastStringValue += codePointToString$1(state.lastIntValue);
    while (this.regexp_eatRegExpIdentifierPart(state)) {
      state.lastStringValue += codePointToString$1(state.lastIntValue);
    }
    return true
  }
  return false
};

// RegExpIdentifierStart[U] ::
//   UnicodeIDStart
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[?U]
pp$9.regexp_eatRegExpIdentifierStart = function(state) {
  var start = state.pos;
  var ch = state.current();
  state.advance();

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierStart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierStart(ch) {
  return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
}

// RegExpIdentifierPart[U] ::
//   UnicodeIDContinue
//   `$`
//   `_`
//   `\` RegExpUnicodeEscapeSequence[?U]
//   <ZWNJ>
//   <ZWJ>
pp$9.regexp_eatRegExpIdentifierPart = function(state) {
  var start = state.pos;
  var ch = state.current();
  state.advance();

  if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
    ch = state.lastIntValue;
  }
  if (isRegExpIdentifierPart(ch)) {
    state.lastIntValue = ch;
    return true
  }

  state.pos = start;
  return false
};
function isRegExpIdentifierPart(ch) {
  return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
pp$9.regexp_eatAtomEscape = function(state) {
  if (
    this.regexp_eatBackReference(state) ||
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state) ||
    (state.switchN && this.regexp_eatKGroupName(state))
  ) {
    return true
  }
  if (state.switchU) {
    // Make the same message as V8.
    if (state.current() === 0x63 /* c */) {
      state.raise("Invalid unicode escape");
    }
    state.raise("Invalid escape");
  }
  return false
};
pp$9.regexp_eatBackReference = function(state) {
  var start = state.pos;
  if (this.regexp_eatDecimalEscape(state)) {
    var n = state.lastIntValue;
    if (state.switchU) {
      // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
      if (n > state.maxBackReference) {
        state.maxBackReference = n;
      }
      return true
    }
    if (n <= state.numCapturingParens) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatKGroupName = function(state) {
  if (state.eat(0x6B /* k */)) {
    if (this.regexp_eatGroupName(state)) {
      state.backReferenceNames.push(state.lastStringValue);
      return true
    }
    state.raise("Invalid named reference");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
pp$9.regexp_eatCharacterEscape = function(state) {
  return (
    this.regexp_eatControlEscape(state) ||
    this.regexp_eatCControlLetter(state) ||
    this.regexp_eatZero(state) ||
    this.regexp_eatHexEscapeSequence(state) ||
    this.regexp_eatRegExpUnicodeEscapeSequence(state) ||
    (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
    this.regexp_eatIdentityEscape(state)
  )
};
pp$9.regexp_eatCControlLetter = function(state) {
  var start = state.pos;
  if (state.eat(0x63 /* c */)) {
    if (this.regexp_eatControlLetter(state)) {
      return true
    }
    state.pos = start;
  }
  return false
};
pp$9.regexp_eatZero = function(state) {
  if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
    state.lastIntValue = 0;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
pp$9.regexp_eatControlEscape = function(state) {
  var ch = state.current();
  if (ch === 0x74 /* t */) {
    state.lastIntValue = 0x09; /* \t */
    state.advance();
    return true
  }
  if (ch === 0x6E /* n */) {
    state.lastIntValue = 0x0A; /* \n */
    state.advance();
    return true
  }
  if (ch === 0x76 /* v */) {
    state.lastIntValue = 0x0B; /* \v */
    state.advance();
    return true
  }
  if (ch === 0x66 /* f */) {
    state.lastIntValue = 0x0C; /* \f */
    state.advance();
    return true
  }
  if (ch === 0x72 /* r */) {
    state.lastIntValue = 0x0D; /* \r */
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
pp$9.regexp_eatControlLetter = function(state) {
  var ch = state.current();
  if (isControlLetter(ch)) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};
function isControlLetter(ch) {
  return (
    (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
    (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
  )
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
pp$9.regexp_eatRegExpUnicodeEscapeSequence = function(state) {
  var start = state.pos;

  if (state.eat(0x75 /* u */)) {
    if (this.regexp_eatFixedHexDigits(state, 4)) {
      var lead = state.lastIntValue;
      if (state.switchU && lead >= 0xD800 && lead <= 0xDBFF) {
        var leadSurrogateEnd = state.pos;
        if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
          var trail = state.lastIntValue;
          if (trail >= 0xDC00 && trail <= 0xDFFF) {
            state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
            return true
          }
        }
        state.pos = leadSurrogateEnd;
        state.lastIntValue = lead;
      }
      return true
    }
    if (
      state.switchU &&
      state.eat(0x7B /* { */) &&
      this.regexp_eatHexDigits(state) &&
      state.eat(0x7D /* } */) &&
      isValidUnicode(state.lastIntValue)
    ) {
      return true
    }
    if (state.switchU) {
      state.raise("Invalid unicode escape");
    }
    state.pos = start;
  }

  return false
};
function isValidUnicode(ch) {
  return ch >= 0 && ch <= 0x10FFFF
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
pp$9.regexp_eatIdentityEscape = function(state) {
  if (state.switchU) {
    if (this.regexp_eatSyntaxCharacter(state)) {
      return true
    }
    if (state.eat(0x2F /* / */)) {
      state.lastIntValue = 0x2F; /* / */
      return true
    }
    return false
  }

  var ch = state.current();
  if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
pp$9.regexp_eatDecimalEscape = function(state) {
  state.lastIntValue = 0;
  var ch = state.current();
  if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
    do {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
      state.advance();
    } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
pp$9.regexp_eatCharacterClassEscape = function(state) {
  var ch = state.current();

  if (isCharacterClassEscape(ch)) {
    state.lastIntValue = -1;
    state.advance();
    return true
  }

  if (
    state.switchU &&
    this.options.ecmaVersion >= 9 &&
    (ch === 0x50 /* P */ || ch === 0x70 /* p */)
  ) {
    state.lastIntValue = -1;
    state.advance();
    if (
      state.eat(0x7B /* { */) &&
      this.regexp_eatUnicodePropertyValueExpression(state) &&
      state.eat(0x7D /* } */)
    ) {
      return true
    }
    state.raise("Invalid property name");
  }

  return false
};
function isCharacterClassEscape(ch) {
  return (
    ch === 0x64 /* d */ ||
    ch === 0x44 /* D */ ||
    ch === 0x73 /* s */ ||
    ch === 0x53 /* S */ ||
    ch === 0x77 /* w */ ||
    ch === 0x57 /* W */
  )
}

// UnicodePropertyValueExpression ::
//   UnicodePropertyName `=` UnicodePropertyValue
//   LoneUnicodePropertyNameOrValue
pp$9.regexp_eatUnicodePropertyValueExpression = function(state) {
  var start = state.pos;

  // UnicodePropertyName `=` UnicodePropertyValue
  if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
    var name = state.lastStringValue;
    if (this.regexp_eatUnicodePropertyValue(state)) {
      var value = state.lastStringValue;
      this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
      return true
    }
  }
  state.pos = start;

  // LoneUnicodePropertyNameOrValue
  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
    var nameOrValue = state.lastStringValue;
    this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
    return true
  }
  return false
};
pp$9.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
  if (!data.hasOwnProperty(name) || data[name].indexOf(value) === -1) {
    state.raise("Invalid property name");
  }
};
pp$9.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
  if (data.$LONE.indexOf(nameOrValue) === -1) {
    state.raise("Invalid property name");
  }
};

// UnicodePropertyName ::
//   UnicodePropertyNameCharacters
pp$9.regexp_eatUnicodePropertyName = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyNameCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString$1(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};
function isUnicodePropertyNameCharacter(ch) {
  return isControlLetter(ch) || ch === 0x5F /* _ */
}

// UnicodePropertyValue ::
//   UnicodePropertyValueCharacters
pp$9.regexp_eatUnicodePropertyValue = function(state) {
  var ch = 0;
  state.lastStringValue = "";
  while (isUnicodePropertyValueCharacter(ch = state.current())) {
    state.lastStringValue += codePointToString$1(ch);
    state.advance();
  }
  return state.lastStringValue !== ""
};
function isUnicodePropertyValueCharacter(ch) {
  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
}

// LoneUnicodePropertyNameOrValue ::
//   UnicodePropertyValueCharacters
pp$9.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
  return this.regexp_eatUnicodePropertyValue(state)
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
pp$9.regexp_eatCharacterClass = function(state) {
  if (state.eat(0x5B /* [ */)) {
    state.eat(0x5E /* ^ */);
    this.regexp_classRanges(state);
    if (state.eat(0x5D /* [ */)) {
      return true
    }
    // Unreachable since it threw "unterminated regular expression" error before.
    state.raise("Unterminated character class");
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
// https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
pp$9.regexp_classRanges = function(state) {
  var this$1 = this;

  while (this.regexp_eatClassAtom(state)) {
    var left = state.lastIntValue;
    if (state.eat(0x2D /* - */) && this$1.regexp_eatClassAtom(state)) {
      var right = state.lastIntValue;
      if (state.switchU && (left === -1 || right === -1)) {
        state.raise("Invalid character class");
      }
      if (left !== -1 && right !== -1 && left > right) {
        state.raise("Range out of order in character class");
      }
    }
  }
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
// https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
pp$9.regexp_eatClassAtom = function(state) {
  var start = state.pos;

  if (state.eat(0x5C /* \ */)) {
    if (this.regexp_eatClassEscape(state)) {
      return true
    }
    if (state.switchU) {
      // Make the same message as V8.
      var ch$1 = state.current();
      if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
        state.raise("Invalid class escape");
      }
      state.raise("Invalid escape");
    }
    state.pos = start;
  }

  var ch = state.current();
  if (ch !== 0x5D /* [ */) {
    state.lastIntValue = ch;
    state.advance();
    return true
  }

  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
pp$9.regexp_eatClassEscape = function(state) {
  var start = state.pos;

  if (state.eat(0x62 /* b */)) {
    state.lastIntValue = 0x08; /* <BS> */
    return true
  }

  if (state.switchU && state.eat(0x2D /* - */)) {
    state.lastIntValue = 0x2D; /* - */
    return true
  }

  if (!state.switchU && state.eat(0x63 /* c */)) {
    if (this.regexp_eatClassControlLetter(state)) {
      return true
    }
    state.pos = start;
  }

  return (
    this.regexp_eatCharacterClassEscape(state) ||
    this.regexp_eatCharacterEscape(state)
  )
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
pp$9.regexp_eatClassControlLetter = function(state) {
  var ch = state.current();
  if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
    state.lastIntValue = ch % 0x20;
    state.advance();
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$9.regexp_eatHexEscapeSequence = function(state) {
  var start = state.pos;
  if (state.eat(0x78 /* x */)) {
    if (this.regexp_eatFixedHexDigits(state, 2)) {
      return true
    }
    if (state.switchU) {
      state.raise("Invalid escape");
    }
    state.pos = start;
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
pp$9.regexp_eatDecimalDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isDecimalDigit(ch = state.current())) {
    state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
    state.advance();
  }
  return state.pos !== start
};
function isDecimalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
pp$9.regexp_eatHexDigits = function(state) {
  var start = state.pos;
  var ch = 0;
  state.lastIntValue = 0;
  while (isHexDigit(ch = state.current())) {
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return state.pos !== start
};
function isHexDigit(ch) {
  return (
    (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
    (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
    (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
  )
}
function hexToInt(ch) {
  if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
    return 10 + (ch - 0x41 /* A */)
  }
  if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
    return 10 + (ch - 0x61 /* a */)
  }
  return ch - 0x30 /* 0 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
// Allows only 0-377(octal) i.e. 0-255(decimal).
pp$9.regexp_eatLegacyOctalEscapeSequence = function(state) {
  if (this.regexp_eatOctalDigit(state)) {
    var n1 = state.lastIntValue;
    if (this.regexp_eatOctalDigit(state)) {
      var n2 = state.lastIntValue;
      if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
        state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
      } else {
        state.lastIntValue = n1 * 8 + n2;
      }
    } else {
      state.lastIntValue = n1;
    }
    return true
  }
  return false
};

// https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
pp$9.regexp_eatOctalDigit = function(state) {
  var ch = state.current();
  if (isOctalDigit(ch)) {
    state.lastIntValue = ch - 0x30; /* 0 */
    state.advance();
    return true
  }
  state.lastIntValue = 0;
  return false
};
function isOctalDigit(ch) {
  return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
}

// https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
// https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
// And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
pp$9.regexp_eatFixedHexDigits = function(state, length) {
  var start = state.pos;
  state.lastIntValue = 0;
  for (var i = 0; i < length; ++i) {
    var ch = state.current();
    if (!isHexDigit(ch)) {
      state.pos = start;
      return false
    }
    state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
    state.advance();
  }
  return true
};

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations)
    { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
  if (p.options.ranges)
    { this.range = [p.start, p.end]; }
};

// ## Tokenizer

var pp$8 = Parser.prototype;

// Move to the next token

pp$8.next = function() {
  if (this.options.onToken)
    { this.options.onToken(new Token(this)); }

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp$8.getToken = function() {
  this.next();
  return new Token(this)
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined")
  { pp$8[Symbol.iterator] = function() {
    var this$1 = this;

    return {
      next: function () {
        var token = this$1.getToken();
        return {
          done: token.type === types.eof,
          value: token
        }
      }
    }
  }; }

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp$8.curContext = function() {
  return this.context[this.context.length - 1]
};

// Read a single token, updating the parser object's token-related
// properties.

pp$8.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

  this.start = this.pos;
  if (this.options.locations) { this.startLoc = this.curPosition(); }
  if (this.pos >= this.input.length) { return this.finishToken(types.eof) }

  if (curContext.override) { return curContext.override(this) }
  else { this.readToken(this.fullCharCodeAtPos()); }
};

pp$8.readToken = function(code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
    { return this.readWord() }

  return this.getTokenFromCode(code)
};

pp$8.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 0xd7ff || code >= 0xe000) { return code }
  var next = this.input.charCodeAt(this.pos + 1);
  return (code << 10) + next - 0x35fdc00
};

pp$8.skipBlockComment = function() {
  var this$1 = this;

  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
  this.pos = end + 2;
  if (this.options.locations) {
    lineBreakG.lastIndex = start;
    var match;
    while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this$1.curLine;
      this$1.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment)
    { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                           startLoc, this.curPosition()); }
};

pp$8.skipLineComment = function(startSkip) {
  var this$1 = this;

  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this$1.input.charCodeAt(++this$1.pos);
  }
  if (this.options.onComment)
    { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                           startLoc, this.curPosition()); }
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp$8.skipSpace = function() {
  var this$1 = this;

  loop: while (this.pos < this.input.length) {
    var ch = this$1.input.charCodeAt(this$1.pos);
    switch (ch) {
    case 32: case 160: // ' '
      ++this$1.pos;
      break
    case 13:
      if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
        ++this$1.pos;
      }
    case 10: case 8232: case 8233:
      ++this$1.pos;
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      break
    case 47: // '/'
      switch (this$1.input.charCodeAt(this$1.pos + 1)) {
      case 42: // '*'
        this$1.skipBlockComment();
        break
      case 47:
        this$1.skipLineComment(2);
        break
      default:
        break loop
      }
      break
    default:
      if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++this$1.pos;
      } else {
        break loop
      }
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp$8.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) { this.endLoc = this.curPosition(); }
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp$8.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) { return this.readNumber(true) }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(types.ellipsis)
  } else {
    ++this.pos;
    return this.finishToken(types.dot)
  }
};

pp$8.readToken_slash = function() { // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.slash, 1)
};

pp$8.readToken_mult_modulo_exp = function(code) { // '%*'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types.star : types.modulo;

  // exponentiation operator ** and **=
  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
    ++size;
    tokentype = types.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }

  if (next === 61) { return this.finishOp(types.assign, size + 1) }
  return this.finishOp(tokentype, size)
};

pp$8.readToken_pipe_amp = function(code) { // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) { return this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2) }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1)
};

pp$8.readToken_caret = function() { // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.bitwiseXOR, 1)
};

pp$8.readToken_plus_min = function(code) { // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
        (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken()
    }
    return this.finishOp(types.incDec, 2)
  }
  if (next === 61) { return this.finishOp(types.assign, 2) }
  return this.finishOp(types.plusMin, 1)
};

pp$8.readToken_lt_gt = function(code) { // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types.assign, size + 1) }
    return this.finishOp(types.bitShift, size)
  }
  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
      this.input.charCodeAt(this.pos + 3) === 45) {
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken()
  }
  if (next === 61) { size = 2; }
  return this.finishOp(types.relational, size)
};

pp$8.readToken_eq_excl = function(code) { // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) { return this.finishOp(types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
    this.pos += 2;
    return this.finishToken(types.arrow)
  }
  return this.finishOp(code === 61 ? types.eq : types.prefix, 1)
};

pp$8.getTokenFromCode = function(code) {
  switch (code) {
  // The interpretation of a dot depends on whether it is followed
  // by a digit or another two dots.
  case 46: // '.'
    return this.readToken_dot()

  // Punctuation tokens.
  case 40: ++this.pos; return this.finishToken(types.parenL)
  case 41: ++this.pos; return this.finishToken(types.parenR)
  case 59: ++this.pos; return this.finishToken(types.semi)
  case 44: ++this.pos; return this.finishToken(types.comma)
  case 91: ++this.pos; return this.finishToken(types.bracketL)
  case 93: ++this.pos; return this.finishToken(types.bracketR)
  case 123: ++this.pos; return this.finishToken(types.braceL)
  case 125: ++this.pos; return this.finishToken(types.braceR)
  case 58: ++this.pos; return this.finishToken(types.colon)
  case 63: ++this.pos; return this.finishToken(types.question)

  case 96: // '`'
    if (this.options.ecmaVersion < 6) { break }
    ++this.pos;
    return this.finishToken(types.backQuote)

  case 48: // '0'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
    if (this.options.ecmaVersion >= 6) {
      if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
      if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
    }

  // Anything else beginning with a digit is an integer, octal
  // number, or float.
  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
    return this.readNumber(false)

  // Quotes produce strings.
  case 34: case 39: // '"', "'"
    return this.readString(code)

  // Operators are parsed inline in tiny state machines. '=' (61) is
  // often referred to. `finishOp` simply skips the amount of
  // characters it is given as second argument, and returns a token
  // of the type given by its first argument.

  case 47: // '/'
    return this.readToken_slash()

  case 37: case 42: // '%*'
    return this.readToken_mult_modulo_exp(code)

  case 124: case 38: // '|&'
    return this.readToken_pipe_amp(code)

  case 94: // '^'
    return this.readToken_caret()

  case 43: case 45: // '+-'
    return this.readToken_plus_min(code)

  case 60: case 62: // '<>'
    return this.readToken_lt_gt(code)

  case 61: case 33: // '=!'
    return this.readToken_eq_excl(code)

  case 126: // '~'
    return this.finishOp(types.prefix, 1)
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp$8.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str)
};

pp$8.readRegexp = function() {
  var this$1 = this;

  var escaped, inClass, start = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(start, "Unterminated regular expression"); }
    var ch = this$1.input.charAt(this$1.pos);
    if (lineBreak.test(ch)) { this$1.raise(start, "Unterminated regular expression"); }
    if (!escaped) {
      if (ch === "[") { inClass = true; }
      else if (ch === "]" && inClass) { inClass = false; }
      else if (ch === "/" && !inClass) { break }
      escaped = ch === "\\";
    } else { escaped = false; }
    ++this$1.pos;
  }
  var pattern = this.input.slice(start, this.pos);
  ++this.pos;
  var flagsStart = this.pos;
  var flags = this.readWord1();
  if (this.containsEsc) { this.unexpected(flagsStart); }

  // Validate pattern
  var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
  state.reset(start, pattern, flags);
  this.validateRegExpFlags(state);
  this.validateRegExpPattern(state);

  // Create Literal#value property value.
  var value = null;
  try {
    value = new RegExp(pattern, flags);
  } catch (e) {
    // ESTree requires null if it failed to instantiate RegExp object.
    // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
  }

  return this.finishToken(types.regexp, {pattern: pattern, flags: flags, value: value})
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp$8.readInt = function(radix, len) {
  var this$1 = this;

  var start = this.pos, total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this$1.input.charCodeAt(this$1.pos), val = (void 0);
    if (code >= 97) { val = code - 97 + 10; } // a
    else if (code >= 65) { val = code - 65 + 10; } // A
    else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
    else { val = Infinity; }
    if (val >= radix) { break }
    ++this$1.pos;
    total = total * radix + val;
  }
  if (this.pos === start || len != null && this.pos - start !== len) { return null }

  return total
};

pp$8.readRadixNumber = function(radix) {
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
  return this.finishToken(types.num, val)
};

// Read an integer, octal integer, or floating-point number.

pp$8.readNumber = function(startsWithDot) {
  var start = this.pos;
  if (!startsWithDot && this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
  if (octal && this.strict) { this.raise(start, "Invalid number"); }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
  var next = this.input.charCodeAt(this.pos);
  if (next === 46 && !octal) { // '.'
    ++this.pos;
    this.readInt(10);
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) { // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) { ++this.pos; } // '+-'
    if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

  var str = this.input.slice(start, this.pos);
  var val = octal ? parseInt(str, 8) : parseFloat(str);
  return this.finishToken(types.num, val)
};

// Read a string value, interpreting backslash-escapes.

pp$8.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;

  if (ch === 123) { // '{'
    if (this.options.ecmaVersion < 6) { this.unexpected(); }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
  } else {
    code = this.readHexChar(4);
  }
  return code
};

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) { return String.fromCharCode(code) }
  code -= 0x10000;
  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
}

pp$8.readString = function(quote) {
  var this$1 = this;

  var out = "", chunkStart = ++this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated string constant"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === quote) { break }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(false);
      chunkStart = this$1.pos;
    } else {
      if (isNewLine(ch, this$1.options.ecmaVersion >= 10)) { this$1.raise(this$1.start, "Unterminated string constant"); }
      ++this$1.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types.string, out)
};

// Reads template string tokens.

var INVALID_TEMPLATE_ESCAPE_ERROR = {};

pp$8.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err
    }
  }

  this.inTemplateElement = false;
};

pp$8.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR
  } else {
    this.raise(position, message);
  }
};

pp$8.readTmplToken = function() {
  var this$1 = this;

  var out = "", chunkStart = this.pos;
  for (;;) {
    if (this$1.pos >= this$1.input.length) { this$1.raise(this$1.start, "Unterminated template"); }
    var ch = this$1.input.charCodeAt(this$1.pos);
    if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
      if (this$1.pos === this$1.start && (this$1.type === types.template || this$1.type === types.invalidTemplate)) {
        if (ch === 36) {
          this$1.pos += 2;
          return this$1.finishToken(types.dollarBraceL)
        } else {
          ++this$1.pos;
          return this$1.finishToken(types.backQuote)
        }
      }
      out += this$1.input.slice(chunkStart, this$1.pos);
      return this$1.finishToken(types.template, out)
    }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos);
      out += this$1.readEscapedChar(true);
      chunkStart = this$1.pos;
    } else if (isNewLine(ch)) {
      out += this$1.input.slice(chunkStart, this$1.pos);
      ++this$1.pos;
      switch (ch) {
      case 13:
        if (this$1.input.charCodeAt(this$1.pos) === 10) { ++this$1.pos; }
      case 10:
        out += "\n";
        break
      default:
        out += String.fromCharCode(ch);
        break
      }
      if (this$1.options.locations) {
        ++this$1.curLine;
        this$1.lineStart = this$1.pos;
      }
      chunkStart = this$1.pos;
    } else {
      ++this$1.pos;
    }
  }
};

// Reads a template token to search for the end, without validating any escape sequences
pp$8.readInvalidTemplateToken = function() {
  var this$1 = this;

  for (; this.pos < this.input.length; this.pos++) {
    switch (this$1.input[this$1.pos]) {
    case "\\":
      ++this$1.pos;
      break

    case "$":
      if (this$1.input[this$1.pos + 1] !== "{") {
        break
      }
    // falls through

    case "`":
      return this$1.finishToken(types.invalidTemplate, this$1.input.slice(this$1.start, this$1.pos))

    // no default
    }
  }
  this.raise(this.start, "Unterminated template");
};

// Used to read escaped characters

pp$8.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
  case 110: return "\n" // 'n' -> '\n'
  case 114: return "\r" // 'r' -> '\r'
  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
  case 117: return codePointToString(this.readCodePoint()) // 'u'
  case 116: return "\t" // 't' -> '\t'
  case 98: return "\b" // 'b' -> '\b'
  case 118: return "\u000b" // 'v' -> '\u000b'
  case 102: return "\f" // 'f' -> '\f'
  case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
  case 10: // ' \n'
    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
    return ""
  default:
    if (ch >= 48 && ch <= 55) {
      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
      var octal = parseInt(octalStr, 8);
      if (octal > 255) {
        octalStr = octalStr.slice(0, -1);
        octal = parseInt(octalStr, 8);
      }
      this.pos += octalStr.length - 1;
      ch = this.input.charCodeAt(this.pos);
      if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
        this.invalidStringToken(
          this.pos - 1 - octalStr.length,
          inTemplate
            ? "Octal literal in template string"
            : "Octal literal in strict mode"
        );
      }
      return String.fromCharCode(octal)
    }
    return String.fromCharCode(ch)
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp$8.readHexChar = function(len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
  return n
};

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp$8.readWord1 = function() {
  var this$1 = this;

  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this$1.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this$1.pos += ch <= 0xffff ? 1 : 2;
    } else if (ch === 92) { // "\"
      this$1.containsEsc = true;
      word += this$1.input.slice(chunkStart, this$1.pos);
      var escStart = this$1.pos;
      if (this$1.input.charCodeAt(++this$1.pos) !== 117) // "u"
        { this$1.invalidStringToken(this$1.pos, "Expecting Unicode escape sequence \\uXXXX"); }
      ++this$1.pos;
      var esc = this$1.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
        { this$1.invalidStringToken(escStart, "Invalid Unicode escape"); }
      word += codePointToString(esc);
      chunkStart = this$1.pos;
    } else {
      break
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos)
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp$8.readWord = function() {
  var word = this.readWord1();
  var type = types.name;
  if (this.keywords.test(word)) {
    if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword " + word); }
    type = keywords$1[word];
  }
  return this.finishToken(type, word)
};

// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/acornjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/acornjs/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

var version = "5.7.3";

// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return new Parser(options, input).parse()
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  var p = new Parser(options, input, pos);
  p.nextToken();
  return p.parseExpression()
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return new Parser(options, input)
}

// This is a terrible kludge to support the existing, pre-ES6
// interface where the loose parser module retroactively adds exports
// to this module.
 // eslint-disable-line camelcase
function addLooseExports(parse, Parser$$1, plugins$$1) {
  exports.parse_dammit = parse; // eslint-disable-line camelcase
  exports.LooseParser = Parser$$1;
  exports.pluginsLoose = plugins$$1;
}

exports.version = version;
exports.parse = parse;
exports.parseExpressionAt = parseExpressionAt;
exports.tokenizer = tokenizer;
exports.addLooseExports = addLooseExports;
exports.Parser = Parser;
exports.plugins = plugins;
exports.defaultOptions = defaultOptions;
exports.Position = Position;
exports.SourceLocation = SourceLocation;
exports.getLineInfo = getLineInfo;
exports.Node = Node;
exports.TokenType = TokenType;
exports.tokTypes = types;
exports.keywordTypes = keywords$1;
exports.TokContext = TokContext;
exports.tokContexts = types$1;
exports.isIdentifierChar = isIdentifierChar;
exports.isIdentifierStart = isIdentifierStart;
exports.Token = Token;
exports.isNewLine = isNewLine;
exports.lineBreak = lineBreak;
exports.lineBreakG = lineBreakG;
exports.nonASCIIwhitespace = nonASCIIwhitespace;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],44:[function(require,module,exports){
const { utils } = require('./utils');

/**
 *
 * @param name
 * @param source
 * @returns {Function}
 */
function alias(name, source) {
  const fnString = source.toString();
  return new Function(`return function ${ name } (${ utils.getArgumentNamesFromString(fnString).join(', ') }) {
  ${ utils.getFunctionBodyFromString(fnString) }
}`)();
}

module.exports = {
  alias
};
},{"./utils":150}],45:[function(require,module,exports){
const { FunctionNode } = require('../function-node');

/**
 * @desc [INTERNAL] Represents a single function, inside JS
 *
 * <p>This handles all the raw state, converted state, etc. Of a single function.</p>
 */
class CPUFunctionNode extends FunctionNode {
  /**
   * @desc Parses the abstract syntax tree for to its *named function*
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astFunction(ast, retArr) {

    // Setup function return type and name
    if (!this.isRootKernel) {
      retArr.push('function');
      retArr.push(' ');
      retArr.push(this.name);
      retArr.push('(');

      // Arguments handling
      for (let i = 0; i < this.argumentNames.length; ++i) {
        const argumentName = this.argumentNames[i];

        if (i > 0) {
          retArr.push(', ');
        }
        retArr.push('user_');
        retArr.push(argumentName);
      }

      // Function opening
      retArr.push(') {\n');
    }

    // Body statement iteration
    for (let i = 0; i < ast.body.body.length; ++i) {
      this.astGeneric(ast.body.body[i], retArr);
      retArr.push('\n');
    }

    if (!this.isRootKernel) {
      // Function closing
      retArr.push('}\n');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for to *return* statement
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astReturnStatement(ast, retArr) {
    const type = this.returnType || this.getType(ast.argument);

    if (!this.returnType) {
      this.returnType = type;
    }

    if (this.isRootKernel) {
      retArr.push(this.leadingReturnStatement);
      this.astGeneric(ast.argument, retArr);
      retArr.push(';\n');
      retArr.push(this.followingReturnStatement);
      retArr.push('continue;\n');
    } else if (this.isSubKernel) {
      retArr.push(`subKernelResult_${ this.name } = `);
      this.astGeneric(ast.argument, retArr);
      retArr.push(';');
      retArr.push(`return subKernelResult_${ this.name };`);
    } else {
      retArr.push('return ');
      this.astGeneric(ast.argument, retArr);
      retArr.push(';');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *literal value*
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astLiteral(ast, retArr) {

    // Reject non numeric literals
    if (isNaN(ast.value)) {
      throw this.astErrorOutput(
        'Non-numeric literal not supported : ' + ast.value,
        ast
      );
    }

    retArr.push(ast.value);

    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *binary* expression
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astBinaryExpression(ast, retArr) {
    retArr.push('(');
    this.astGeneric(ast.left, retArr);
    retArr.push(ast.operator);
    this.astGeneric(ast.right, retArr);
    retArr.push(')');
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *identifier* expression
   * @param {Object} idtNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astIdentifierExpression(idtNode, retArr) {
    if (idtNode.type !== 'Identifier') {
      throw this.astErrorOutput(
        'IdentifierExpression - not an Identifier',
        idtNode
      );
    }

    switch (idtNode.name) {
      case 'Infinity':
        retArr.push('Infinity');
        break;
      default:
        if (this.constants && this.constants.hasOwnProperty(idtNode.name)) {
          retArr.push('constants_' + idtNode.name);
        } else {
          retArr.push('user_' + idtNode.name);
        }
    }

    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *for-loop* expression
   * @param {Object} forNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the parsed webgl string
   */
  astForStatement(forNode, retArr) {
    if (forNode.type !== 'ForStatement') {
      throw this.astErrorOutput('Invalid for statement', forNode);
    }

    const initArr = [];
    const testArr = [];
    const updateArr = [];
    const bodyArr = [];
    let isSafe = null;

    if (forNode.init) {
      this.pushState('in-for-loop-init');
      this.astGeneric(forNode.init, initArr);
      for (let i = 0; i < initArr.length; i++) {
        if (initArr[i].includes && initArr[i].includes(',')) {
          isSafe = false;
        }
      }
      this.popState('in-for-loop-init');
    } else {
      isSafe = false;
    }

    if (forNode.test) {
      this.astGeneric(forNode.test, testArr);
    } else {
      isSafe = false;
    }

    if (forNode.update) {
      this.astGeneric(forNode.update, updateArr);
    } else {
      isSafe = false;
    }

    if (forNode.body) {
      this.pushState('loop-body');
      this.astGeneric(forNode.body, bodyArr);
      this.popState('loop-body');
    }

    // have all parts, now make them safe
    if (isSafe === null) {
      isSafe = this.isSafe(forNode.init) && this.isSafe(forNode.test);
    }

    if (isSafe) {
      retArr.push(`for (${initArr.join('')};${testArr.join('')};${updateArr.join('')}){\n`);
      retArr.push(bodyArr.join(''));
      retArr.push('}\n');
    } else {
      const iVariableName = this.getInternalVariableName('safeI');
      if (initArr.length > 0) {
        retArr.push(initArr.join(''), ';\n');
      }
      retArr.push(`for (let ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
      if (testArr.length > 0) {
        retArr.push(`if (!${testArr.join('')}) break;\n`);
      }
      retArr.push(bodyArr.join(''));
      retArr.push(`\n${updateArr.join('')};`);
      retArr.push('}\n');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *while* loop
   * @param {Object} whileNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the parsed javascript string
   */
  astWhileStatement(whileNode, retArr) {
    if (whileNode.type !== 'WhileStatement') {
      throw this.astErrorOutput(
        'Invalid while statement',
        whileNode
      );
    }

    retArr.push('for (let i = 0; i < LOOP_MAX; i++) {');
    retArr.push('if (');
    this.astGeneric(whileNode.test, retArr);
    retArr.push(') {\n');
    this.astGeneric(whileNode.body, retArr);
    retArr.push('} else {\n');
    retArr.push('break;\n');
    retArr.push('}\n');
    retArr.push('}\n');

    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *do while* loop
   * @param {Object} doWhileNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the parsed webgl string
   */
  astDoWhileStatement(doWhileNode, retArr) {
    if (doWhileNode.type !== 'DoWhileStatement') {
      throw this.astErrorOutput(
        'Invalid while statement',
        doWhileNode
      );
    }

    retArr.push('for (let i = 0; i < LOOP_MAX; i++) {');
    this.astGeneric(doWhileNode.body, retArr);
    retArr.push('if (!');
    this.astGeneric(doWhileNode.test, retArr);
    retArr.push(') {\n');
    retArr.push('break;\n');
    retArr.push('}\n');
    retArr.push('}\n');

    return retArr;

  }

  /**
   * @desc Parses the abstract syntax tree for *Assignment* Expression
   * @param {Object} assNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astAssignmentExpression(assNode, retArr) {
    const declaration = this.getDeclaration(assNode.left);
    if (declaration && !declaration.assignable) {
      throw this.astErrorOutput(`Variable ${assNode.left.name} is not assignable here`, assNode);
    }
    this.astGeneric(assNode.left, retArr);
    retArr.push(assNode.operator);
    this.astGeneric(assNode.right, retArr);
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *Block* statement
   * @param {Object} bNode - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astBlockStatement(bNode, retArr) {
    if (this.isState('loop-body')) {
      this.pushState('block-body'); // this prevents recursive removal of braces
      for (let i = 0; i < bNode.body.length; i++) {
        this.astGeneric(bNode.body[i], retArr);
      }
      this.popState('block-body');
    } else {
      retArr.push('{\n');
      for (let i = 0; i < bNode.body.length; i++) {
        this.astGeneric(bNode.body[i], retArr);
      }
      retArr.push('}\n');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *Variable Declaration*
   * @param {Object} varDecNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astVariableDeclaration(varDecNode, retArr) {
    if (varDecNode.kind === 'var' && this.warnVarUsage) {
      this.varWarn();
    }
    retArr.push(`${varDecNode.kind} `);
    const { declarations } = varDecNode;
    for (let i = 0; i < declarations.length; i++) {
      if (i > 0) {
        retArr.push(',');
      }
      this.astGeneric(declarations[i], retArr);
    }
    if (!this.isState('in-for-loop-init')) {
      retArr.push(';');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *If* Statement
   * @param {Object} ifNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astIfStatement(ifNode, retArr) {
    retArr.push('if (');
    this.astGeneric(ifNode.test, retArr);
    retArr.push(')');
    if (ifNode.consequent.type === 'BlockStatement') {
      this.astGeneric(ifNode.consequent, retArr);
    } else {
      retArr.push(' {\n');
      this.astGeneric(ifNode.consequent, retArr);
      retArr.push('\n}\n');
    }

    if (ifNode.alternate) {
      retArr.push('else ');
      if (ifNode.alternate.type === 'BlockStatement') {
        this.astGeneric(ifNode.alternate, retArr);
      } else {
        retArr.push(' {\n');
        this.astGeneric(ifNode.alternate, retArr);
        retArr.push('\n}\n');
      }
    }
    return retArr;

  }

  astSwitchStatement(ast, retArr) {
    const { discriminant, cases } = ast;
    retArr.push('switch (');
    this.astGeneric(discriminant, retArr);
    retArr.push(') {\n');
    for (let i = 0; i < cases.length; i++) {
      if (cases[i].test === null) {
        retArr.push('default:\n');
        this.astGeneric(cases[i].consequent, retArr);
        if (cases[i].consequent && cases[i].consequent.length > 0) {
          retArr.push('break;\n');
        }
        continue;
      }
      retArr.push('case ');
      this.astGeneric(cases[i].test, retArr);
      retArr.push(':\n');
      if (cases[i].consequent && cases[i].consequent.length > 0) {
        this.astGeneric(cases[i].consequent, retArr);
        retArr.push('break;\n');
      }
    }
    retArr.push('\n}');
  }

  /**
   * @desc Parses the abstract syntax tree for *This* expression
   * @param {Object} tNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astThisExpression(tNode, retArr) {
    retArr.push('_this');
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *Member* Expression
   * @param {Object} mNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astMemberExpression(mNode, retArr) {
    const {
      signature,
      type,
      property,
      xProperty,
      yProperty,
      zProperty,
      name,
      origin
    } = this.getMemberExpressionDetails(mNode);
    switch (signature) {
      case 'this.thread.value':
        retArr.push(`_this.thread.${ name }`);
        return retArr;
      case 'this.output.value':
        switch (name) {
          case 'x':
            retArr.push('outputX');
            break;
          case 'y':
            retArr.push('outputY');
            break;
          case 'z':
            retArr.push('outputZ');
            break;
          default:
            throw this.astErrorOutput('Unexpected expression', mNode);
        }
        return retArr;
      case 'value':
        throw this.astErrorOutput('Unexpected expression', mNode);
      case 'value[]':
      case 'value[][]':
      case 'value[][][]':
      case 'value.value':
        if (origin === 'Math') {
          retArr.push(Math[name]);
          return retArr;
        }
        switch (property) {
          case 'r':
            retArr.push(`user_${ name }[0]`);
            return retArr;
          case 'g':
            retArr.push(`user_${ name }[1]`);
            return retArr;
          case 'b':
            retArr.push(`user_${ name }[2]`);
            return retArr;
          case 'a':
            retArr.push(`user_${ name }[3]`);
            return retArr;
        }
        break;
      case 'this.constants.value':
      case 'this.constants.value[]':
      case 'this.constants.value[][]':
      case 'this.constants.value[][][]':
        break;
      case 'fn()[]':
        this.astGeneric(mNode.object, retArr);
        retArr.push('[');
        this.astGeneric(mNode.property, retArr);
        retArr.push(']');
        return retArr;
      default:
        throw this.astErrorOutput('Unexpected expression', mNode);
    }

    if (!mNode.computed) {
      // handle simple types
      switch (type) {
        case 'Number':
        case 'Integer':
        case 'Float':
        case 'Boolean':
          retArr.push(`${origin}_${name}`);
          return retArr;
      }
    }

    // handle more complex types
    // argument may have come from a parent
    const markupName = `${origin}_${name}`;

    switch (type) {
      case 'Array(2)':
      case 'Array(3)':
      case 'Array(4)':
      case 'HTMLImageArray':
      case 'ArrayTexture(1)':
      case 'ArrayTexture(2)':
      case 'ArrayTexture(3)':
      case 'ArrayTexture(4)':
      case 'HTMLImage':
      default:
        let size;
        let isInput;
        if (origin === 'constants') {
          const constant = this.constants[name];
          isInput = this.constantTypes[name] === 'Input';
          size = isInput ? constant.size : null;
        } else {
          isInput = this.isInput(name);
          size = isInput ? this.argumentSizes[this.argumentNames.indexOf(name)] : null;
        }
        retArr.push(`${ markupName }`);
        if (zProperty && yProperty) {
          if (isInput) {
            retArr.push('[(');
            this.astGeneric(zProperty, retArr);
            retArr.push(`*${ this.dynamicArguments ? '(outputY * outputX)' : size[1] * size[0] })+(`);
            this.astGeneric(yProperty, retArr);
            retArr.push(`*${ this.dynamicArguments ? 'outputX' : size[0] })+`);
            this.astGeneric(xProperty, retArr);
            retArr.push(']');
          } else {
            retArr.push('[');
            this.astGeneric(zProperty, retArr);
            retArr.push(']');
            retArr.push('[');
            this.astGeneric(yProperty, retArr);
            retArr.push(']');
            retArr.push('[');
            this.astGeneric(xProperty, retArr);
            retArr.push(']');
          }
        } else if (yProperty) {
          if (isInput) {
            retArr.push('[(');
            this.astGeneric(yProperty, retArr);
            retArr.push(`*${ this.dynamicArguments ? 'outputX' : size[0] })+`);
            this.astGeneric(xProperty, retArr);
            retArr.push(']');
          } else {
            retArr.push('[');
            this.astGeneric(yProperty, retArr);
            retArr.push(']');
            retArr.push('[');
            this.astGeneric(xProperty, retArr);
            retArr.push(']');
          }
        } else if (typeof xProperty !== 'undefined') {
          retArr.push('[');
          this.astGeneric(xProperty, retArr);
          retArr.push(']');
        }
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *call* expression
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns  {Array} the append retArr
   */
  astCallExpression(ast, retArr) {
    if (ast.type !== 'CallExpression') {
      // Failure, unknown expression
      throw this.astErrorOutput('Unknown CallExpression', ast);
    }
    // Get the full function call, unrolled
    let functionName = this.astMemberExpressionUnroll(ast.callee);

    // Register the function into the called registry
    if (this.calledFunctions.indexOf(functionName) < 0) {
      this.calledFunctions.push(functionName);
    }

    const isMathFunction = this.isAstMathFunction(ast);

    // track the function was called
    if (this.onFunctionCall) {
      this.onFunctionCall(this.name, functionName, ast.arguments);
    }

    // Call the function
    retArr.push(functionName);

    // Open arguments space
    retArr.push('(');
    const targetTypes = this.lookupFunctionArgumentTypes(functionName) || [];
    // Add the arguments
    for (let i = 0; i < ast.arguments.length; ++i) {
      const argument = ast.arguments[i];

      // in order to track return type, even though this is CPU
      let argumentType = this.getType(argument);
      if (!targetTypes[i]) {
        this.triggerImplyArgumentType(functionName, i, argumentType, this);
      }

      if (i > 0) {
        retArr.push(', ');
      }
      this.astGeneric(argument, retArr);
    }
    // Close arguments space
    retArr.push(')');

    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *Array* Expression
   * @param {Object} arrNode - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astArrayExpression(arrNode, retArr) {
    const arrLen = arrNode.elements.length;

    retArr.push('new Float32Array([');
    for (let i = 0; i < arrLen; ++i) {
      if (i > 0) {
        retArr.push(', ');
      }
      const subNode = arrNode.elements[i];
      this.astGeneric(subNode, retArr)
    }
    retArr.push('])');

    return retArr;
  }

  astDebuggerStatement(arrNode, retArr) {
    retArr.push('debugger;');
    return retArr;
  }
}

module.exports = {
  CPUFunctionNode
};
},{"../function-node":49}],46:[function(require,module,exports){
const { utils } = require('../../utils');

function constantsToString(constants, types) {
  const results = [];
  for (const name in types) {
    if (!types.hasOwnProperty(name)) continue;
    const type = types[name];
    const constant = constants[name];
    switch (type) {
      case 'Number':
      case 'Integer':
      case 'Float':
      case 'Boolean':
        results.push(`${name}:${constant}`);
        break;
      case 'Array(2)':
      case 'Array(3)':
      case 'Array(4)':
        results.push(`${name}:new ${constant.constructor.name}(${JSON.stringify(Array.from(constant))})`);
        break;
    }
  }
  return `{ ${ results.join() } }`;
}

function cpuKernelString(cpuKernel, name) {
  const header = [];
  const thisProperties = [];
  const beforeReturn = [];

  const useFunctionKeyword = !/^function/.test(cpuKernel.color.toString());

  header.push(
    '  const { context, canvas, constants: incomingConstants } = settings;',
    `  const output = new Int32Array(${JSON.stringify(Array.from(cpuKernel.output))});`,
    `  const _constantTypes = ${JSON.stringify(cpuKernel.constantTypes)};`,
    `  const _constants = ${constantsToString(cpuKernel.constants, cpuKernel.constantTypes)};`,
  );

  thisProperties.push(
    '    constants: _constants,',
    '    context,',
    '    output,',
    '    thread: {x: 0, y: 0, z: 0},',
  );

  if (cpuKernel.graphical) {
    header.push(`  const _imageData = context.createImageData(${cpuKernel.output[0]}, ${cpuKernel.output[1]});`);
    header.push(`  const _colorData = new Uint8ClampedArray(${cpuKernel.output[0]} * ${cpuKernel.output[1]} * 4);`);

    const colorFn = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel.color.toString(), {
      thisLookup: (propertyName) => {
        switch (propertyName) {
          case '_colorData':
            return '_colorData';
          case '_imageData':
            return '_imageData';
          case 'output':
            return 'output';
          case 'thread':
            return 'this.thread';
        }
        return JSON.stringify(cpuKernel[propertyName]);
      },
      findDependency: (object, name) => {
        return null;
      }
    });

    const getPixelsFn = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel.getPixels.toString(), {
      thisLookup: (propertyName) => {
        switch (propertyName) {
          case '_colorData':
            return '_colorData';
          case '_imageData':
            return '_imageData';
          case 'output':
            return 'output';
          case 'thread':
            return 'this.thread';
        }
        return JSON.stringify(cpuKernel[propertyName]);
      },
      findDependency: () => {
        return null;
      }
    });

    thisProperties.push(
      '    _imageData,',
      '    _colorData,',
      `    color: ${colorFn},`,
    );

    beforeReturn.push(
      `  kernel.getPixels = ${getPixelsFn};`
    );
  }

  const constantTypes = [];
  const constantKeys = Object.keys(cpuKernel.constantTypes);
  for (let i = 0; i < constantKeys.length; i++) {
    constantTypes.push(cpuKernel.constantTypes[constantKeys]);
  }
  if (cpuKernel.argumentTypes.indexOf('HTMLImageArray') !== -1 || constantTypes.indexOf('HTMLImageArray') !== -1) {
    const flattenedImageTo3DArray = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel._imageTo3DArray.toString(), {
      doNotDefine: ['canvas'],
      findDependency: (object, name) => {
        if (object === 'this') {
          return (useFunctionKeyword ? 'function ' : '') + cpuKernel[name].toString();
        }
        return null;
      },
      thisLookup: (propertyName) => {
        switch (propertyName) {
          case 'canvas':
            return;
          case 'context':
            return 'context';
        }
      }
    });
    beforeReturn.push(flattenedImageTo3DArray);
    thisProperties.push(`    _mediaTo2DArray,`);
    thisProperties.push(`    _imageTo3DArray,`);
  } else if (cpuKernel.argumentTypes.indexOf('HTMLImage') !== -1 || constantTypes.indexOf('HTMLImage') !== -1) {
    const flattenedImageTo2DArray = utils.flattenFunctionToString((useFunctionKeyword ? 'function ' : '') + cpuKernel._mediaTo2DArray.toString(), {
      findDependency: (object, name) => {
        return null;
      },
      thisLookup: (propertyName) => {
        switch (propertyName) {
          case 'canvas':
            return 'settings.canvas';
          case 'context':
            return 'settings.context';
        }
        throw new Error('unhandled thisLookup');
      }
    });
    beforeReturn.push(flattenedImageTo2DArray);
    thisProperties.push(`    _mediaTo2DArray,`);
  }

  return `function(settings) {
${ header.join('\n') }
  for (const p in _constantTypes) {
    if (!_constantTypes.hasOwnProperty(p)) continue;
    const type = _constantTypes[p];
    switch (type) {
      case 'Number':
      case 'Integer':
      case 'Float':
      case 'Boolean':
      case 'Array(2)':
      case 'Array(3)':
      case 'Array(4)':
        if (incomingConstants.hasOwnProperty(p)) {
          console.warn('constant ' + p + ' of type ' + type + ' cannot be resigned');
        }
        continue;
    }
    if (!incomingConstants.hasOwnProperty(p)) {
      throw new Error('constant ' + p + ' not found');
    }
    _constants[p] = incomingConstants[p];
  }
  const kernel = (function() {
${cpuKernel._kernelString}
  })
    .apply({ ${thisProperties.join('\n')} });
  ${ beforeReturn.join('\n') }
  return kernel;
}`;
}

module.exports = {
  cpuKernelString
};
},{"../../utils":150}],47:[function(require,module,exports){
const { Kernel } = require('../kernel');
const { FunctionBuilder } = require('../function-builder');
const { CPUFunctionNode } = require('./function-node');
const { utils } = require('../../utils');
const { cpuKernelString } = require('./kernel-string');

/**
 * @desc Kernel Implementation for CPU.
 * <p>Instantiates properties to the CPU Kernel.</p>
 */
class CPUKernel extends Kernel {
  static getFeatures() {
    return this.features;
  }
  static get features() {
    return Object.freeze({
      kernelMap: true,
      isIntegerDivisionAccurate: true
    });
  }
  static get isSupported() {
    return true;
  }
  static isContextMatch(context) {
    return false;
  }
  /**
   * @desc The current mode in which gpu.js is executing.
   */
  static get mode() {
    return 'cpu';
  }

  static nativeFunctionArguments() {
    return null;
  }

  static nativeFunctionReturnType() {
    return null;
  }

  static combineKernels(combinedKernel) {
    return combinedKernel;
  }

  constructor(source, settings) {
    super(source, settings);
    this.mergeSettings(source.settings || settings);

    this._imageData = null;
    this._colorData = null;
    this._kernelString = null;
    this.thread = {
      x: 0,
      y: 0,
      z: 0
    };
    this.translatedSources = null;
  }

  initCanvas() {
    if (typeof document !== 'undefined') {
      return document.createElement('canvas');
    } else if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(0, 0);
    }
  }

  initContext() {
    if (!this.canvas) return null;
    return this.canvas.getContext('2d');
  }

  initPlugins(settings) {
    return [];
  }

  /**
   * @desc Validate settings related to Kernel, such as dimensions size, and auto output support.
   * @param {IArguments} args
   */
  validateSettings(args) {
    if (!this.output || this.output.length === 0) {
      if (args.length !== 1) {
        throw new Error('Auto output only supported for kernels with only one input');
      }

      const argType = utils.getVariableType(args[0], this.strictIntegers);
      if (argType === 'Array') {
        this.output = utils.getDimensions(argType);
      } else if (argType === 'NumberTexture' || argType === 'ArrayTexture(4)') {
        this.output = args[0].output;
      } else {
        throw new Error('Auto output not supported for input type: ' + argType);
      }
    }

    if (this.graphical) {
      if (this.output.length !== 2) {
        throw new Error('Output must have 2 dimensions on graphical mode');
      }
    }

    this.checkOutput();
  }

  translateSource() {
    this.leadingReturnStatement = this.output.length > 1 ? 'resultX[x] = ' : 'result[x] = ';
    if (this.subKernels) {
      const followingReturnStatement = [];
      for (let i = 0; i < this.subKernels.length; i++) {
        const {
          name
        } = this.subKernels[i];
        followingReturnStatement.push(this.output.length > 1 ? `resultX_${ name }[x] = subKernelResult_${ name };\n` : `result_${ name }[x] = subKernelResult_${ name };\n`);
      }
      this.followingReturnStatement = followingReturnStatement.join('');
    }
    const functionBuilder = FunctionBuilder.fromKernel(this, CPUFunctionNode);
    this.translatedSources = functionBuilder.getPrototypes('kernel');
    if (!this.graphical && !this.returnType) {
      this.returnType = functionBuilder.getKernelResultType();
    }
  }

  /**
   * @desc Builds the Kernel, by generating the kernel
   * string using thread dimensions, and arguments
   * supplied to the kernel.
   *
   * <p>If the graphical flag is enabled, canvas is used.</p>
   */
  build() {
    this.setupConstants();
    this.setupArguments(arguments);
    this.validateSettings(arguments);
    this.translateSource();

    if (this.graphical) {
      const {
        canvas,
        output
      } = this;
      if (!canvas) {
        throw new Error('no canvas available for using graphical output');
      }
      const width = output[0];
      const height = output[1] || 1;
      canvas.width = width;
      canvas.height = height;
      this._imageData = this.context.createImageData(width, height);
      this._colorData = new Uint8ClampedArray(width * height * 4);
    }

    const kernelString = this.getKernelString();
    this.kernelString = kernelString;

    if (this.debug) {
      console.log('Function output:');
      console.log(kernelString);
    }

    try {
      this.run = new Function([], kernelString).bind(this)();
    } catch (e) {
      console.error('An error occurred compiling the javascript: ', e);
    }
  }

  color(r, g, b, a) {
    if (typeof a === 'undefined') {
      a = 1;
    }

    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    a = Math.floor(a * 255);

    const width = this.output[0];
    const height = this.output[1];

    const x = this.thread.x;
    const y = height - this.thread.y - 1;

    const index = x + y * width;

    this._colorData[index * 4 + 0] = r;
    this._colorData[index * 4 + 1] = g;
    this._colorData[index * 4 + 2] = b;
    this._colorData[index * 4 + 3] = a;
  }

  /**
   * @desc Generates kernel string for this kernel program.
   *
   * <p>If sub-kernels are supplied, they are also factored in.
   * This string can be saved by calling the `toString` method
   * and then can be reused later.</p>
   *
   * @returns {String} result
   *
   */
  getKernelString() {
    if (this._kernelString !== null) return this._kernelString;

    let kernelThreadString = null;
    let {
      translatedSources
    } = this;
    if (translatedSources.length > 1) {
      translatedSources = translatedSources.filter(fn => {
        if (/^function/.test(fn)) return fn;
        kernelThreadString = fn;
        return false;
      })
    } else {
      kernelThreadString = translatedSources.shift();
    }
    return this._kernelString = `  const LOOP_MAX = ${ this._getLoopMaxString() };
  ${ this.injectedNative || '' }
  const _this = this;
  ${ this._processConstants() }
  return (${ this.argumentNames.map(argumentName => 'user_' + argumentName).join(', ') }) => {
    ${ this._processArguments() }
    ${ this.graphical ? this._graphicalKernelBody(kernelThreadString) : this._resultKernelBody(kernelThreadString) }
    ${ translatedSources.length > 0 ? translatedSources.join('\n') : '' }
  };`;
  }

  /**
   * @desc Returns the *pre-compiled* Kernel as a JS Object String, that can be reused.
   */
  toString() {
    return cpuKernelString(this);
  }

  /**
   * @desc Get the maximum loop size String.
   * @returns {String} result
   */
  _getLoopMaxString() {
    return (
      this.loopMaxIterations ?
      ` ${ parseInt(this.loopMaxIterations) };` :
      ' 1000;'
    );
  }

  _processConstants() {
    if (!this.constants) return '';

    const result = [];
    for (let p in this.constants) {
      const type = this.constantTypes[p];
      switch (type) {
        case 'HTMLImage':
        case 'HTMLVideo':
          result.push(`    const constants_${p} = this._mediaTo2DArray(this.constants.${p});\n`);
          break;
        case 'HTMLImageArray':
          result.push(`    const constants_${p} = this._imageTo3DArray(this.constants.${p});\n`);
          break;
        case 'Input':
          result.push(`    const constants_${p} = this.constants.${p}.value;\n`);
          break;
        default:
          result.push(`    const constants_${p} = this.constants.${p};\n`);
      }
    }
    return result.join('');
  }

  _processArguments() {
    const result = [];
    for (let i = 0; i < this.argumentTypes.length; i++) {
      const variableName = `user_${this.argumentNames[i]}`;
      switch (this.argumentTypes[i]) {
        case 'HTMLImage':
        case 'HTMLVideo':
          result.push(`    ${variableName} = this._mediaTo2DArray(${variableName});\n`);
          break;
        case 'HTMLImageArray':
          result.push(`    ${variableName} = this._imageTo3DArray(${variableName});\n`);
          break;
        case 'Input':
          result.push(`    ${variableName} = ${variableName}.value;\n`);
          break;
        case 'ArrayTexture(1)':
        case 'ArrayTexture(2)':
        case 'ArrayTexture(3)':
        case 'ArrayTexture(4)':
        case 'NumberTexture':
        case 'MemoryOptimizedNumberTexture':
          result.push(`
    if (${variableName}.toArray) {
      if (!_this.textureCache) {
        _this.textureCache = [];
        _this.arrayCache = [];
      }
      const textureIndex = _this.textureCache.indexOf(${variableName});
      if (textureIndex !== -1) {
        ${variableName} = _this.arrayCache[textureIndex];
      } else {
        _this.textureCache.push(${variableName});
        ${variableName} = ${variableName}.toArray();
        _this.arrayCache.push(${variableName});
      }
    }`);
          break;
      }
    }
    return result.join('');
  }

  _mediaTo2DArray(media) {
    const canvas = this.canvas;
    const width = media.width > 0 ? media.width : media.videoWidth;
    const height = media.height > 0 ? media.height : media.videoHeight;
    if (canvas.width < width) {
      canvas.width = width;
    }
    if (canvas.height < height) {
      canvas.height = height;
    }
    const ctx = this.context;
    ctx.drawImage(media, 0, 0, width, height);
    const pixelsData = ctx.getImageData(0, 0, width, height).data;
    const imageArray = new Array(height);
    let index = 0;
    for (let y = height - 1; y >= 0; y--) {
      const row = imageArray[y] = new Array(width);
      for (let x = 0; x < width; x++) {
        const pixel = new Float32Array(4);
        pixel[0] = pixelsData[index++] / 255; // r
        pixel[1] = pixelsData[index++] / 255; // g
        pixel[2] = pixelsData[index++] / 255; // b
        pixel[3] = pixelsData[index++] / 255; // a
        row[x] = pixel;
      }
    }
    return imageArray;
  }

  /**
   *
   * @param flip
   * @return {Uint8ClampedArray}
   */
  getPixels(flip) {
    const [width, height] = this.output;
    // cpu is not flipped by default
    return flip ? utils.flipPixels(this._imageData.data, width, height) : this._imageData.data.slice(0);
  }

  _imageTo3DArray(images) {
    const imagesArray = new Array(images.length);
    for (let i = 0; i < images.length; i++) {
      imagesArray[i] = this._mediaTo2DArray(images[i]);
    }
    return imagesArray;
  }

  _resultKernelBody(kernelString) {
    switch (this.output.length) {
      case 1:
        return this._resultKernel1DLoop(kernelString) + this._kernelOutput();
      case 2:
        return this._resultKernel2DLoop(kernelString) + this._kernelOutput();
      case 3:
        return this._resultKernel3DLoop(kernelString) + this._kernelOutput();
      default:
        throw new Error('unsupported size kernel');
    }
  }

  _graphicalKernelBody(kernelThreadString) {
    switch (this.output.length) {
      case 2:
        return this._graphicalKernel2DLoop(kernelThreadString) + this._graphicalOutput();
      default:
        throw new Error('unsupported size kernel');
    }
  }

  _graphicalOutput() {
    return `
    this._imageData.data.set(this._colorData);
    this.context.putImageData(this._imageData, 0, 0);
    return;`
  }

  _getKernelResultTypeConstructorString() {
    switch (this.returnType) {
      case 'LiteralInteger':
      case 'Number':
      case 'Integer':
      case 'Float':
        return 'Float32Array';
      case 'Array(2)':
      case 'Array(3)':
      case 'Array(4)':
        return 'Array';
      default:
        if (this.graphical) {
          return 'Float32Array';
        }
        throw new Error(`unhandled returnType ${ this.returnType }`);
    }
  }

  _resultKernel1DLoop(kernelString) {
    const constructorString = this._getKernelResultTypeConstructorString();
    return `  const outputX = _this.output[0];
    const result = new ${constructorString}(outputX);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new ${constructorString}(outputX);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let x = 0; x < outputX; x++) {
      this.thread.x = x;
      this.thread.y = 0;
      this.thread.z = 0;
      ${ kernelString }
    }`;
  }

  _resultKernel2DLoop(kernelString) {
    const constructorString = this._getKernelResultTypeConstructorString();
    return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    const result = new Array(outputY);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new Array(outputY);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let y = 0; y < outputY; y++) {
      this.thread.z = 0;
      this.thread.y = y;
      const resultX = result[y] = new ${constructorString}(outputX);
      ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = result_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('') }
      for (let x = 0; x < outputX; x++) {
        this.thread.x = x;
        ${ kernelString }
      }
    }`;
  }

  _graphicalKernel2DLoop(kernelString) {
    const constructorString = this._getKernelResultTypeConstructorString();
    return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new Array(outputY);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let y = 0; y < outputY; y++) {
      this.thread.z = 0;
      this.thread.y = y;
      ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = result_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('') }
      for (let x = 0; x < outputX; x++) {
        this.thread.x = x;
        ${ kernelString }
      }
    }`;
  }

  _resultKernel3DLoop(kernelString) {
    const constructorString = this._getKernelResultTypeConstructorString();
    return `  const outputX = _this.output[0];
    const outputY = _this.output[1];
    const outputZ = _this.output[2];
    const result = new Array(outputZ);
    ${ this._mapSubKernels(subKernel => `const result_${ subKernel.name } = new Array(outputZ);\n`).join('    ') }
    ${ this._mapSubKernels(subKernel => `let subKernelResult_${ subKernel.name };\n`).join('    ') }
    for (let z = 0; z < outputZ; z++) {
      this.thread.z = z;
      const resultY = result[z] = new Array(outputY);
      ${ this._mapSubKernels(subKernel => `const resultY_${ subKernel.name } = result_${subKernel.name}[z] = new Array(outputY);\n`).join('      ') }
      for (let y = 0; y < outputY; y++) {
        this.thread.y = y;
        const resultX = resultY[y] = new ${constructorString}(outputX);
        ${ this._mapSubKernels(subKernel => `const resultX_${ subKernel.name } = resultY_${subKernel.name}[y] = new ${constructorString}(outputX);\n`).join('        ') }
        for (let x = 0; x < outputX; x++) {
          this.thread.x = x;
          ${ kernelString }
        }
      }
    }`;
  }

  _kernelOutput() {
    if (!this.subKernels) {
      return '\n    return result;';
    }
    return `\n    return {
      result: result,
      ${ this.subKernels.map(subKernel => `${ subKernel.property }: result_${ subKernel.name }`).join(',\n      ') }
    };`;
  }

  _mapSubKernels(fn) {
    return this.subKernels === null ? [''] :
      this.subKernels.map(fn);
  }

  destroy(removeCanvasReference) {
    if (removeCanvasReference) {
      delete this.canvas;
    }
  }

  static destroyContext(context) {}

  toJSON() {
    const json = super.toJSON();
    json.functionNodes = FunctionBuilder.fromKernel(this, CPUFunctionNode).toJSON();
    return json;
  }

  setOutput(output) {
    super.setOutput(output);
    const [width, height] = this.output;
    if (this.graphical) {
      this._imageData = this.context.createImageData(width, height);
      this._colorData = new Uint8ClampedArray(width * height * 4);
    }
  }
}

module.exports = {
  CPUKernel
};
},{"../../utils":150,"../function-builder":48,"../kernel":74,"./function-node":45,"./kernel-string":46}],48:[function(require,module,exports){
/**
 * @desc This handles all the raw state, converted state, etc. of a single function.
 * [INTERNAL] A collection of functionNodes.
 * @class
 */
class FunctionBuilder {
  /**
   *
   * @param {Kernel} kernel
   * @param {FunctionNode} FunctionNode
   * @param {object} [extraNodeOptions]
   * @returns {FunctionBuilder}
   * @static
   */
  static fromKernel(kernel, FunctionNode, extraNodeOptions) {
    const {
      kernelArguments,
      kernelConstants,
      argumentNames,
      argumentSizes,
      argumentBitRatios,
      constants,
      constantBitRatios,
      debug,
      loopMaxIterations,
      nativeFunctions,
      output,
      optimizeFloatMemory,
      precision,
      plugins,
      source,
      subKernels,
      functions,
      leadingReturnStatement,
      followingReturnStatement,
      dynamicArguments,
      dynamicOutput,
      warnVarUsage,
    } = kernel;

    const argumentTypes = new Array(kernelArguments.length);
    const constantTypes = {};

    for (let i = 0; i < kernelArguments.length; i++) {
      argumentTypes[i] = kernelArguments[i].type;
    }

    for (let i = 0; i < kernelConstants.length; i++) {
      const kernelConstant = kernelConstants[i];
      constantTypes[kernelConstant.name] = kernelConstant.type;
    }

    const needsArgumentType = (functionName, index) => {
      return functionBuilder.needsArgumentType(functionName, index);
    };

    const assignArgumentType = (functionName, index, type) => {
      functionBuilder.assignArgumentType(functionName, index, type);
    };

    const lookupReturnType = (functionName, ast, requestingNode) => {
      return functionBuilder.lookupReturnType(functionName, ast, requestingNode);
    };

    const lookupFunctionArgumentTypes = (functionName) => {
      return functionBuilder.lookupFunctionArgumentTypes(functionName);
    };

    const lookupFunctionArgumentName = (functionName, argumentIndex) => {
      return functionBuilder.lookupFunctionArgumentName(functionName, argumentIndex);
    };

    const lookupFunctionArgumentBitRatio = (functionName, argumentName) => {
      return functionBuilder.lookupFunctionArgumentBitRatio(functionName, argumentName);
    };

    const triggerImplyArgumentType = (functionName, i, argumentType, requestingNode) => {
      functionBuilder.assignArgumentType(functionName, i, argumentType, requestingNode);
    };

    const triggerImplyArgumentBitRatio = (functionName, argumentName, calleeFunctionName, argumentIndex) => {
      functionBuilder.assignArgumentBitRatio(functionName, argumentName, calleeFunctionName, argumentIndex);
    };

    const onFunctionCall = (functionName, calleeFunctionName, args) => {
      functionBuilder.trackFunctionCall(functionName, calleeFunctionName, args);
    };

    const onNestedFunction = (ast, returnType) => {
      const argumentNames = [];
      for (let i = 0; i < ast.params.length; i++) {
        argumentNames.push(ast.params[i].name);
      }
      const nestedFunction = new FunctionNode(null, Object.assign({}, nodeOptions, {
        returnType: null,
        ast,
        name: ast.id.name,
        argumentNames,
        lookupReturnType,
        lookupFunctionArgumentTypes,
        lookupFunctionArgumentName,
        lookupFunctionArgumentBitRatio,
        needsArgumentType,
        assignArgumentType,
        triggerImplyArgumentType,
        triggerImplyArgumentBitRatio,
        onFunctionCall,
        warnVarUsage,
      }));
      nestedFunction.traceFunctionAST(ast);
      functionBuilder.addFunctionNode(nestedFunction);
    };

    const nodeOptions = Object.assign({
      isRootKernel: false,
      onNestedFunction,
      lookupReturnType,
      lookupFunctionArgumentTypes,
      lookupFunctionArgumentName,
      lookupFunctionArgumentBitRatio,
      needsArgumentType,
      assignArgumentType,
      triggerImplyArgumentType,
      triggerImplyArgumentBitRatio,
      onFunctionCall,
      optimizeFloatMemory,
      precision,
      constants,
      constantTypes,
      constantBitRatios,
      debug,
      loopMaxIterations,
      output,
      plugins,
      dynamicArguments,
      dynamicOutput,
    }, extraNodeOptions || {});

    const rootNodeOptions = Object.assign({}, nodeOptions, {
      isRootKernel: true,
      name: 'kernel',
      argumentNames,
      argumentTypes,
      argumentSizes,
      argumentBitRatios,
      leadingReturnStatement,
      followingReturnStatement,
    });

    if (typeof source === 'object' && source.functionNodes) {
      return new FunctionBuilder().fromJSON(source.functionNodes, FunctionNode);
    }

    const rootNode = new FunctionNode(source, rootNodeOptions);

    let functionNodes = null;
    if (functions) {
      functionNodes = functions.map((fn) => new FunctionNode(fn.source, {
        returnType: fn.returnType,
        argumentTypes: fn.argumentTypes,
        output,
        plugins,
        constants,
        constantTypes,
        constantBitRatios,
        optimizeFloatMemory,
        precision,
        lookupReturnType,
        lookupFunctionArgumentTypes,
        lookupFunctionArgumentName,
        lookupFunctionArgumentBitRatio,
        needsArgumentType,
        assignArgumentType,
        triggerImplyArgumentType,
        triggerImplyArgumentBitRatio,
        onFunctionCall,
        onNestedFunction,
      }));
    }

    let subKernelNodes = null;
    if (subKernels) {
      subKernelNodes = subKernels.map((subKernel) => {
        const { name, source } = subKernel;
        return new FunctionNode(source, Object.assign({}, nodeOptions, {
          name,
          isSubKernel: true,
          isRootKernel: false,
        }));
      });
    }

    const functionBuilder = new FunctionBuilder({
      kernel,
      rootNode,
      functionNodes,
      nativeFunctions,
      subKernelNodes
    });

    return functionBuilder;
  }

  /**
   *
   * @param {IFunctionBuilderSettings} [settings]
   */
  constructor(settings) {
    settings = settings || {};
    this.kernel = settings.kernel;
    this.rootNode = settings.rootNode;
    this.functionNodes = settings.functionNodes || [];
    this.subKernelNodes = settings.subKernelNodes || [];
    this.nativeFunctions = settings.nativeFunctions || [];
    this.functionMap = {};
    this.nativeFunctionNames = [];
    this.lookupChain = [];
    this.functionNodeDependencies = {};
    this.functionCalls = {};

    if (this.rootNode) {
      this.functionMap['kernel'] = this.rootNode;
    }

    if (this.functionNodes) {
      for (let i = 0; i < this.functionNodes.length; i++) {
        this.functionMap[this.functionNodes[i].name] = this.functionNodes[i];
      }
    }

    if (this.subKernelNodes) {
      for (let i = 0; i < this.subKernelNodes.length; i++) {
        this.functionMap[this.subKernelNodes[i].name] = this.subKernelNodes[i];
      }
    }

    if (this.nativeFunctions) {
      for (let i = 0; i < this.nativeFunctions.length; i++) {
        const nativeFunction = this.nativeFunctions[i];
        this.nativeFunctionNames.push(nativeFunction.name);
      }
    }
  }

  /**
   * @desc Add the function node directly
   *
   * @param {FunctionNode} functionNode - functionNode to add
   *
   */
  addFunctionNode(functionNode) {
    if (!functionNode.name) throw new Error('functionNode.name needs set');
    this.functionMap[functionNode.name] = functionNode;
    if (functionNode.isRootKernel) {
      this.rootNode = functionNode;
    }
  }

  /**
   * @desc Trace all the depending functions being called, from a single function
   *
   * This allow for 'unneeded' functions to be automatically optimized out.
   * Note that the 0-index, is the starting function trace.
   *
   * @param {String} functionName - Function name to trace from, default to 'kernel'
   * @param {String[]} [retList] - Returning list of function names that is traced. Including itself.
   *
   * @returns {String[]}  Returning list of function names that is traced. Including itself.
   */
  traceFunctionCalls(functionName, retList) {
    functionName = functionName || 'kernel';
    retList = retList || [];

    if (this.nativeFunctionNames.indexOf(functionName) > -1) {
      if (retList.indexOf(functionName) === -1) {
        retList.push(functionName);
      }
      return retList;
    }

    const functionNode = this.functionMap[functionName];
    if (functionNode) {
      // Check if function already exists
      const functionIndex = retList.indexOf(functionName);
      if (functionIndex === -1) {
        retList.push(functionName);
        functionNode.toString(); //ensure JS trace is done
        for (let i = 0; i < functionNode.calledFunctions.length; ++i) {
          this.traceFunctionCalls(functionNode.calledFunctions[i], retList);
        }
      } else {
        /**
         * https://github.com/gpujs/gpu.js/issues/207
         * if dependent function is already in the list, because a function depends on it, and because it has
         * already been traced, we know that we must move the dependent function to the end of the the retList.
         * */
        const dependantFunctionName = retList.splice(functionIndex, 1)[0];
        retList.push(dependantFunctionName);
      }
    }

    return retList;
  }

  /**
   * @desc Return the string for a function
   * @param {String} functionName - Function name to trace from. If null, it returns the WHOLE builder stack
   * @returns {String} The full string, of all the various functions. Trace optimized if functionName given
   */
  getPrototypeString(functionName) {
    return this.getPrototypes(functionName).join('\n');
  }

  /**
   * @desc Return the string for a function
   * @param {String} [functionName] - Function name to trace from. If null, it returns the WHOLE builder stack
   * @returns {Array} The full string, of all the various functions. Trace optimized if functionName given
   */
  getPrototypes(functionName) {
    if (this.rootNode) {
      this.rootNode.toString();
    }
    if (functionName) {
      return this.getPrototypesFromFunctionNames(this.traceFunctionCalls(functionName, []).reverse());
    }
    return this.getPrototypesFromFunctionNames(Object.keys(this.functionMap));
  }

  /**
   * @desc Get string from function names
   * @param {String[]} functionList - List of function to build string
   * @returns {String} The string, of all the various functions. Trace optimized if functionName given
   */
  getStringFromFunctionNames(functionList) {
    const ret = [];
    for (let i = 0; i < functionList.length; ++i) {
      const node = this.functionMap[functionList[i]];
      if (node) {
        ret.push(this.functionMap[functionList[i]].toString());
      }
    }
    return ret.join('\n');
  }

  /**
   * @desc Return string of all functions converted
   * @param {String[]} functionList - List of function names to build the string.
   * @returns {Array} Prototypes of all functions converted
   */
  getPrototypesFromFunctionNames(functionList) {
    const ret = [];
    for (let i = 0; i < functionList.length; ++i) {
      const functionName = functionList[i];
      const functionIndex = this.nativeFunctionNames.indexOf(functionName);
      if (functionIndex > -1) {
        ret.push(this.nativeFunctions[functionIndex].source);
        continue;
      }
      const node = this.functionMap[functionName];
      if (node) {
        ret.push(node.toString());
      }
    }
    return ret;
  }

  toJSON() {
    return this.traceFunctionCalls(this.rootNode.name).reverse().map(name => {
      const nativeIndex = this.nativeFunctions.indexOf(name);
      if (nativeIndex > -1) {
        return {
          name,
          source: this.nativeFunctions[nativeIndex].source
        };
      } else if (this.functionMap[name]) {
        return this.functionMap[name].toJSON();
      } else {
        throw new Error(`function ${ name } not found`);
      }
    });
  }

  fromJSON(jsonFunctionNodes, FunctionNode) {
    this.functionMap = {};
    for (let i = 0; i < jsonFunctionNodes.length; i++) {
      const jsonFunctionNode = jsonFunctionNodes[i];
      this.functionMap[jsonFunctionNode.settings.name] = new FunctionNode(jsonFunctionNode.ast, jsonFunctionNode.settings);
    }
    return this;
  }

  /**
   * @desc Get string for a particular function name
   * @param {String} functionName - Function name to trace from. If null, it returns the WHOLE builder stack
   * @returns {String} settings - The string, of all the various functions. Trace optimized if functionName given
   */
  getString(functionName) {
    if (functionName) {
      return this.getStringFromFunctionNames(this.traceFunctionCalls(functionName).reverse());
    }
    return this.getStringFromFunctionNames(Object.keys(this.functionMap));
  }

  lookupReturnType(functionName, ast, requestingNode) {
    if (ast.type !== 'CallExpression') {
      throw new Error(`expected ast type of "CallExpression", but is ${ ast.type }`);
    }
    if (this._isNativeFunction(functionName)) {
      return this._lookupNativeFunctionReturnType(functionName);
    } else if (this._isFunction(functionName)) {
      const node = this._getFunction(functionName);
      if (node.returnType) {
        return node.returnType;
      } else {
        for (let i = 0; i < this.lookupChain.length; i++) {
          // detect circlical logic
          if (this.lookupChain[i].ast === ast) {
            // detect if arguments have not resolved, preventing a return type
            // if so, go ahead and resolve them, so we can resolve the return type
            if (node.argumentTypes.length === 0 && ast.arguments.length > 0) {
              const args = ast.arguments;
              for (let j = 0; j < args.length; j++) {
                this.lookupChain.push({
                  name: requestingNode.name,
                  ast: args[i],
                  requestingNode
                });
                node.argumentTypes[j] = requestingNode.getType(args[j]);
                this.lookupChain.pop();
              }
              return node.returnType = node.getType(node.getJsAST());
            }

            throw new Error('circlical logic detected!');
          }
        }
        // get ready for a ride!
        this.lookupChain.push({
          name: requestingNode.name,
          ast,
          requestingNode
        });
        const type = node.getType(node.getJsAST());
        this.lookupChain.pop();
        return node.returnType = type;
      }
    }

    return null;
  }

  /**
   *
   * @param {String} functionName
   * @return {FunctionNode}
   * @private
   */
  _getFunction(functionName) {
    if (!this._isFunction(functionName)) {
      new Error(`Function ${functionName} not found`);
    }
    return this.functionMap[functionName];
  }

  _isFunction(functionName) {
    return Boolean(this.functionMap[functionName]);
  }

  _getNativeFunction(functionName) {
    for (let i = 0; i < this.nativeFunctions.length; i++) {
      if (this.nativeFunctions[i].name === functionName) return this.nativeFunctions[i];
    }
    return null;
  }

  _isNativeFunction(functionName) {
    return Boolean(this._getNativeFunction(functionName));
  }

  _lookupNativeFunctionReturnType(functionName) {
    let nativeFunction = this._getNativeFunction(functionName);
    if (nativeFunction) {
      return nativeFunction.returnType;
    }
    throw new Error(`Native function ${ functionName } not found`);
  }

  lookupFunctionArgumentTypes(functionName) {
    if (this._isNativeFunction(functionName)) {
      return this._getNativeFunction(functionName).argumentTypes;
    } else if (this._isFunction(functionName)) {
      return this._getFunction(functionName).argumentTypes;
    }
    return null;
  }

  lookupFunctionArgumentName(functionName, argumentIndex) {
    return this._getFunction(functionName).argumentNames[argumentIndex];
  }

  /**
   *
   * @param {string} functionName
   * @param {string} argumentName
   * @return {number}
   */
  lookupFunctionArgumentBitRatio(functionName, argumentName) {
    if (!this._isFunction(functionName)) {
      throw new Error('function not found');
    }
    if (this.rootNode.name === functionName) {
      const i = this.rootNode.argumentNames.indexOf(argumentName);
      if (i !== -1) {
        return this.rootNode.argumentBitRatios[i];
      }
    }
    const node = this._getFunction(functionName);
    const i = node.argumentNames.indexOf(argumentName);
    if (i === -1) {
      throw new Error('argument not found');
    }
    const bitRatio = node.argumentBitRatios[i];
    if (typeof bitRatio !== 'number') {
      throw new Error('argument bit ratio not found');
    }
    return bitRatio;
  }

  needsArgumentType(functionName, i) {
    if (!this._isFunction(functionName)) return false;
    const fnNode = this._getFunction(functionName);
    return !fnNode.argumentTypes[i];
  }

  assignArgumentType(functionName, i, argumentType, requestingNode) {
    if (!this._isFunction(functionName)) return;
    const fnNode = this._getFunction(functionName);
    if (!fnNode.argumentTypes[i]) {
      fnNode.argumentTypes[i] = argumentType;
    }
  }

  /**
   * @param {string} functionName
   * @param {string} argumentName
   * @param {string} calleeFunctionName
   * @param {number} argumentIndex
   * @return {number|null}
   */
  assignArgumentBitRatio(functionName, argumentName, calleeFunctionName, argumentIndex) {
    const node = this._getFunction(functionName);
    if (this._isNativeFunction(calleeFunctionName)) return null;
    const calleeNode = this._getFunction(calleeFunctionName);
    const i = node.argumentNames.indexOf(argumentName);
    if (i === -1) {
      throw new Error(`Argument ${argumentName} not found in arguments from function ${functionName}`);
    }
    const bitRatio = node.argumentBitRatios[i];
    if (typeof bitRatio !== 'number') {
      throw new Error(`Bit ratio for argument ${argumentName} not found in function ${functionName}`);
    }
    if (!calleeNode.argumentBitRatios) {
      calleeNode.argumentBitRatios = new Array(calleeNode.argumentNames.length);
    }
    const calleeBitRatio = calleeNode.argumentBitRatios[i];
    if (typeof calleeBitRatio === 'number') {
      if (calleeBitRatio !== bitRatio) {
        throw new Error(`Incompatible bit ratio found at function ${functionName} at argument ${argumentName}`);
      }
      return calleeBitRatio;
    }
    calleeNode.argumentBitRatios[i] = bitRatio;
    return bitRatio;
  }

  trackFunctionCall(functionName, calleeFunctionName, args) {
    if (!this.functionNodeDependencies[functionName]) {
      this.functionNodeDependencies[functionName] = new Set();
      this.functionCalls[functionName] = [];
    }
    this.functionNodeDependencies[functionName].add(calleeFunctionName);
    this.functionCalls[functionName].push(args);
  }

  getKernelResultType() {
    return this.rootNode.returnType || this.rootNode.getType(this.rootNode.ast);
  }

  getSubKernelResultType(index) {
    const subKernelNode = this.subKernelNodes[index];
    let called = false;
    for (let functionCallIndex = 0; functionCallIndex < this.rootNode.functionCalls.length; functionCallIndex++) {
      const functionCall = this.rootNode.functionCalls[functionCallIndex];
      if (functionCall.ast.callee.name === subKernelNode.name) {
        called = true;
      }
    }
    if (!called) {
      throw new Error(`SubKernel ${ subKernelNode.name } never called by kernel`);
    }
    return subKernelNode.returnType || subKernelNode.getType(subKernelNode.getJsAST());
  }

  getReturnTypes() {
    const result = {
      [this.rootNode.name]: this.rootNode.getType(this.rootNode.ast),
    };
    const list = this.traceFunctionCalls(this.rootNode.name);
    for (let i = 0; i < list.length; i++) {
      const functionName = list[i];
      const functionNode = this.functionMap[functionName];
      result[functionName] = functionNode.getType(functionNode.ast);
    }
    return result;
  }
}

module.exports = {
  FunctionBuilder
};
},{}],49:[function(require,module,exports){
const acorn = require('acorn');
const { utils } = require('../utils');
const { FunctionTracer } = require('./function-tracer');

/**
 *
 * @desc Represents a single function, inside JS, webGL, or openGL.
 * <p>This handles all the raw state, converted state, etc. Of a single function.</p>
 */
class FunctionNode {
  /**
   *
   * @param {string|object} source
   * @param {IFunctionSettings} [settings]
   */
  constructor(source, settings) {
    if (!source && !settings.ast) {
      throw new Error('source parameter is missing');
    }
    settings = settings || {};
    this.source = source;
    this.ast = null;
    this.name = typeof source === 'string' ? settings.isRootKernel ?
      'kernel' :
      (settings.name || utils.getFunctionNameFromString(source)) : null;
    this.calledFunctions = [];
    this.constants = {};
    this.constantTypes = {};
    this.constantBitRatios = {};
    this.isRootKernel = false;
    this.isSubKernel = false;
    this.debug = null;
    this.declarations = null;
    this.functions = null;
    this.identifiers = null;
    this.contexts = null;
    this.functionCalls = null;
    this.states = [];
    this.needsArgumentType = null;
    this.assignArgumentType = null;
    this.lookupReturnType = null;
    this.lookupFunctionArgumentTypes = null;
    this.lookupFunctionArgumentBitRatio = null;
    this.triggerImplyArgumentType = null;
    this.triggerImplyArgumentBitRatio = null;
    this.onNestedFunction = null;
    this.onFunctionCall = null;
    this.optimizeFloatMemory = null;
    this.precision = null;
    this.loopMaxIterations = null;
    this.argumentNames = (typeof this.source === 'string' ? utils.getArgumentNamesFromString(this.source) : null);
    this.argumentTypes = [];
    this.argumentSizes = [];
    this.argumentBitRatios = null;
    this.returnType = null;
    this.output = [];
    this.plugins = null;
    this.leadingReturnStatement = null;
    this.followingReturnStatement = null;
    this.dynamicOutput = null;
    this.dynamicArguments = null;
    this.strictTypingChecking = false;
    this.fixIntegerDivisionAccuracy = null;
    this.warnVarUsage = true;

    if (settings) {
      for (const p in settings) {
        if (!settings.hasOwnProperty(p)) continue;
        if (!this.hasOwnProperty(p)) continue;
        this[p] = settings[p];
      }
    }

    this.literalTypes = {};

    this.validate();
    this._string = null;
    this._internalVariableNames = {};
  }

  validate() {
    if (typeof this.source !== 'string' && !this.ast) {
      throw new Error('this.source not a string');
    }

    if (!this.ast && !utils.isFunctionString(this.source)) {
      throw new Error('this.source not a function string');
    }

    if (!this.name) {
      throw new Error('this.name could not be set');
    }

    if (this.argumentTypes.length > 0 && this.argumentTypes.length !== this.argumentNames.length) {
      throw new Error(`argumentTypes count of ${ this.argumentTypes.length } exceeds ${ this.argumentNames.length }`);
    }

    if (this.output.length < 1) {
      throw new Error('this.output is not big enough');
    }
  }

  /**
   * @param {String} name
   * @returns {boolean}
   */
  isIdentifierConstant(name) {
    if (!this.constants) return false;
    return this.constants.hasOwnProperty(name);
  }

  isInput(argumentName) {
    return this.argumentTypes[this.argumentNames.indexOf(argumentName)] === 'Input';
  }

  pushState(state) {
    this.states.push(state);
  }

  popState(state) {
    if (this.state !== state) {
      throw new Error(`Cannot popState ${ state } when in ${ this.state }`);
    }
    this.states.pop();
  }

  isState(state) {
    return this.state === state;
  }

  get state() {
    return this.states[this.states.length - 1];
  }

  /**
   * @function
   * @name astMemberExpressionUnroll
   * @desc Parses the abstract syntax tree for binary expression.
   *
   * <p>Utility function for astCallExpression.</p>
   *
   * @param {Object} ast - the AST object to parse
   *
   * @returns {String} the function namespace call, unrolled
   */
  astMemberExpressionUnroll(ast) {
    if (ast.type === 'Identifier') {
      return ast.name;
    } else if (ast.type === 'ThisExpression') {
      return 'this';
    }

    if (ast.type === 'MemberExpression') {
      if (ast.object && ast.property) {
        //babel sniffing
        if (ast.object.hasOwnProperty('name') && ast.object.name[0] === '_') {
          return this.astMemberExpressionUnroll(ast.property);
        }

        return (
          this.astMemberExpressionUnroll(ast.object) +
          '.' +
          this.astMemberExpressionUnroll(ast.property)
        );
      }
    }

    //babel sniffing
    if (ast.hasOwnProperty('expressions')) {
      const firstExpression = ast.expressions[0];
      if (firstExpression.type === 'Literal' && firstExpression.value === 0 && ast.expressions.length === 2) {
        return this.astMemberExpressionUnroll(ast.expressions[1]);
      }
    }

    // Failure, unknown expression
    throw this.astErrorOutput('Unknown astMemberExpressionUnroll', ast);
  }

  /**
   * @desc Parses the class function JS, and returns its Abstract Syntax Tree object.
   * This is used internally to convert to shader code
   *
   * @param {Object} [inParser] - Parser to use, assumes in scope 'parser' if null or undefined
   *
   * @returns {Object} The function AST Object, note that result is cached under this.ast;
   */
  getJsAST(inParser) {
    if (this.ast) {
      return this.ast;
    }
    if (typeof this.source === 'object') {
      this.traceFunctionAST(this.source);
      return this.ast = this.source;
    }

    inParser = inParser || acorn;
    if (inParser === null) {
      throw new Error('Missing JS to AST parser');
    }

    const ast = Object.freeze(inParser.parse(`const parser_${ this.name } = ${ this.source };`, {
      locations: true
    }));
    // take out the function object, outside the var declarations
    const functionAST = ast.body[0].declarations[0].init;
    this.traceFunctionAST(functionAST);

    if (!ast) {
      throw new Error('Failed to parse JS code');
    }

    return this.ast = functionAST;
  }

  traceFunctionAST(ast) {
    const { contexts, declarations, functions, identifiers, functionCalls } = new FunctionTracer(ast);
    this.contexts = contexts;
    this.identifiers = identifiers;
    this.functionCalls = functionCalls;
    this.declarations = [];
    this.functions = functions;
    for (let i = 0; i < declarations.length; i++) {
      const declaration = declarations[i];
      const { ast, context, name, origin, forceInteger, assignable } = declaration;
      const { init } = ast;
      const dependencies = this.getDependencies(init);
      let valueType = null;

      if (forceInteger) {
        valueType = 'Integer';
      } else {
        if (init) {
          const realType = this.getType(init);
          switch (realType) {
            case 'Integer':
            case 'Float':
            case 'Number':
              if (init.type === 'MemberExpression') {
                valueType = realType;
              } else {
                valueType = 'Number';
              }
              break;
            case 'LiteralInteger':
              valueType = 'Number';
              break;
            default:
              valueType = realType;
          }
        }
      }
      this.declarations.push({
        valueType,
        dependencies,
        isSafe: this.isSafeDependencies(dependencies),
        ast,
        name,
        context,
        origin,
        assignable,
      });
    }

    for (let i = 0; i < functions.length; i++) {
      this.onNestedFunction(functions[i]);
    }
  }

  getDeclaration(ast) {
    for (let i = 0; i < this.identifiers.length; i++) {
      const identifier = this.identifiers[i];
      if (ast === identifier.ast && identifier.context.hasOwnProperty(ast.name)) {
        for (let j = 0; j < this.declarations.length; j++) {
          const declaration = this.declarations[j];
          if (declaration.name === ast.name && declaration.context[ast.name] === identifier.context[ast.name]) {
            return declaration;
          }
        }
      }
    }
    return null;
  }

  /**
   * @desc Return the type of parameter sent to subKernel/Kernel.
   * @param {Object} ast - Identifier
   * @returns {String} Type of the parameter
   */
  getVariableType(ast) {
    if (ast.type !== 'Identifier') {
      throw new Error(`ast of ${ast.type} not "Identifier"`);
    }
    let type = null;
    const argumentIndex = this.argumentNames.indexOf(ast.name);
    if (argumentIndex === -1) {
      const declaration = this.getDeclaration(ast);
      if (declaration) {
        return declaration.valueType;
      }
    } else {
      const argumentType = this.argumentTypes[argumentIndex];
      if (argumentType) {
        type = argumentType;
      }
    }
    if (!type && this.strictTypingChecking) {
      throw new Error(`Declaration of ${name} not found`);
    }
    return type;
  }

  /**
   * Generally used to lookup the value type returned from a member expressions
   * @param {String} type
   * @return {String}
   */
  getLookupType(type) {
    if (!typeLookupMap.hasOwnProperty(type)) {
      throw new Error(`unknown typeLookupMap ${ type }`);
    }
    return typeLookupMap[type];
  }

  getConstantType(constantName) {
    if (this.constantTypes[constantName]) {
      const type = this.constantTypes[constantName];
      if (type === 'Float') {
        return 'Number';
      } else {
        return type;
      }
    }
    throw new Error(`Type for constant "${ constantName }" not declared`);
  }

  toString() {
    if (this._string) return this._string;
    return this._string = this.astGeneric(this.getJsAST(), []).join('').trim();
  }

  toJSON() {
    const settings = {
      source: this.source,
      name: this.name,
      constants: this.constants,
      constantTypes: this.constantTypes,
      isRootKernel: this.isRootKernel,
      isSubKernel: this.isSubKernel,
      debug: this.debug,
      output: this.output,
      loopMaxIterations: this.loopMaxIterations,
      argumentNames: this.argumentNames,
      argumentTypes: this.argumentTypes,
      argumentSizes: this.argumentSizes,
      returnType: this.returnType,
      leadingReturnStatement: this.leadingReturnStatement,
      followingReturnStatement: this.followingReturnStatement,
    };

    return {
      ast: this.ast,
      settings
    };
  }

  /**
   * Recursively looks up type for ast expression until it's found
   * @param ast
   * @returns {String|null}
   */
  getType(ast) {
    if (Array.isArray(ast)) {
      return this.getType(ast[ast.length - 1]);
    }
    switch (ast.type) {
      case 'BlockStatement':
        return this.getType(ast.body);
      case 'ArrayExpression':
        return `Array(${ ast.elements.length })`;
      case 'Literal':
        const literalKey = `${ast.start},${ast.end}`;
        if (this.literalTypes[literalKey]) {
          return this.literalTypes[literalKey];
        }
        if (Number.isInteger(ast.value)) {
          return 'LiteralInteger';
        } else if (ast.value === true || ast.value === false) {
          return 'Boolean';
        } else {
          return 'Number';
        }
        case 'AssignmentExpression':
          return this.getType(ast.left);
        case 'CallExpression':
          if (this.isAstMathFunction(ast)) {
            return 'Number';
          }
          if (!ast.callee || !ast.callee.name) {
            if (ast.callee.type === 'SequenceExpression' && ast.callee.expressions[ast.callee.expressions.length - 1].property.name) {
              const functionName = ast.callee.expressions[ast.callee.expressions.length - 1].property.name;
              this.inferArgumentTypesIfNeeded(functionName, ast.arguments);
              return this.lookupReturnType(functionName, ast, this);
            }
            throw this.astErrorOutput('Unknown call expression', ast);
          }
          if (ast.callee && ast.callee.name) {
            const functionName = ast.callee.name;
            this.inferArgumentTypesIfNeeded(functionName, ast.arguments);
            return this.lookupReturnType(functionName, ast, this);
          }
          throw this.astErrorOutput(`Unhandled getType Type "${ ast.type }"`, ast);
        case 'BinaryExpression':
          // modulos is Number
          switch (ast.operator) {
            case '%':
            case '/':
              if (this.fixIntegerDivisionAccuracy) {
                return 'Number';
              } else {
                break;
              }
              case '>':
              case '<':
                return 'Boolean';
              case '&':
              case '|':
              case '^':
              case '<<':
              case '>>':
              case '>>>':
                return 'Integer';
          }
          const type = this.getType(ast.left);
          if (this.isState('skip-literal-correction')) return type;
          if (type === 'LiteralInteger') {
            const rightType = this.getType(ast.right);
            if (rightType === 'LiteralInteger') {
              if (ast.left.value % 1 === 0) {
                return 'Integer';
              } else {
                return 'Float';
              }
            }
            return rightType;
          }
          return typeLookupMap[type] || type;
        case 'UpdateExpression':
          return this.getType(ast.argument);
        case 'UnaryExpression':
          if (ast.operator === '~') {
            return 'Integer';
          }
          return this.getType(ast.argument);
        case 'VariableDeclaration': {
          const declarations = ast.declarations;
          let lastType;
          for (let i = 0; i < declarations.length; i++) {
            const declaration = declarations[i];
            lastType = this.getType(declaration);
          }
          if (!lastType) {
            throw this.astErrorOutput(`Unable to find type for declaration`, ast);
          }
          return lastType;
        }
        case 'VariableDeclarator':
          const declaration = this.getDeclaration(ast.id);
          if (!declaration) {
            throw this.astErrorOutput(`Unable to find declarator`, ast);
          }

          if (!declaration.valueType) {
            throw this.astErrorOutput(`Unable to find declarator valueType`, ast);
          }

          return declaration.valueType;
        case 'Identifier':
          if (ast.name === 'Infinity') {
            return 'Number';
          }
          if (this.isAstVariable(ast)) {
            const signature = this.getVariableSignature(ast);
            if (signature === 'value') {
              const type = this.getVariableType(ast);
              if (!type) {
                throw this.astErrorOutput(`Unable to find identifier valueType`, ast);
              }
              return type;
            }
          }
          const origin = this.findIdentifierOrigin(ast);
          if (origin && origin.init) {
            return this.getType(origin.init);
          }
          return null;
        case 'ReturnStatement':
          return this.getType(ast.argument);
        case 'MemberExpression':
          if (this.isAstMathFunction(ast)) {
            switch (ast.property.name) {
              case 'ceil':
                return 'Integer';
              case 'floor':
                return 'Integer';
              case 'round':
                return 'Integer';
            }
            return 'Number';
          }
          if (this.isAstVariable(ast)) {
            const variableSignature = this.getVariableSignature(ast);
            switch (variableSignature) {
              case 'value[]':
                return this.getLookupType(this.getVariableType(ast.object));
              case 'value[][]':
                return this.getLookupType(this.getVariableType(ast.object.object));
              case 'value[][][]':
                return this.getLookupType(this.getVariableType(ast.object.object.object));
              case 'value[][][][]':
                return this.getLookupType(this.getVariableType(ast.object.object.object.object));
              case 'value.thread.value':
              case 'this.thread.value':
                return 'Integer';
              case 'this.output.value':
                return this.dynamicOutput ? 'Integer' : 'LiteralInteger';
              case 'this.constants.value':
                return this.getConstantType(ast.property.name);
              case 'this.constants.value[]':
                return this.getLookupType(this.getConstantType(ast.object.property.name));
              case 'this.constants.value[][]':
                return this.getLookupType(this.getConstantType(ast.object.object.property.name));
              case 'this.constants.value[][][]':
                return this.getLookupType(this.getConstantType(ast.object.object.object.property.name));
              case 'this.constants.value[][][][]':
                return this.getLookupType(this.getConstantType(ast.object.object.object.object.property.name));
              case 'fn()[]':
                return this.getLookupType(this.getType(ast.object));
              case 'fn()[][]':
                return this.getLookupType(this.getType(ast.object));
              case 'fn()[][][]':
                return this.getLookupType(this.getType(ast.object));
              case 'value.value':
                if (this.isAstMathVariable(ast)) {
                  return 'Number';
                }
                switch (ast.property.name) {
                  case 'r':
                    return this.getLookupType(this.getVariableType(ast.object));
                  case 'g':
                    return this.getLookupType(this.getVariableType(ast.object));
                  case 'b':
                    return this.getLookupType(this.getVariableType(ast.object));
                  case 'a':
                    return this.getLookupType(this.getVariableType(ast.object));
                }
                case '[][]':
                  return 'Number';
            }
            throw this.astErrorOutput('Unhandled getType MemberExpression', ast);
          }
          throw this.astErrorOutput('Unhandled getType MemberExpression', ast);
        case 'ConditionalExpression':
          return this.getType(ast.consequent);
        case 'FunctionDeclaration':
        case 'FunctionExpression':
          const lastReturn = this.findLastReturn(ast.body);
          if (lastReturn) {
            return this.getType(lastReturn);
          }
          return null;
        case 'IfStatement':
          return this.getType(ast.consequent);
        default:
          throw this.astErrorOutput(`Unhandled getType Type "${ ast.type }"`, ast);
    }
  }

  inferArgumentTypesIfNeeded(functionName, args) {
    // ensure arguments are filled in, so when we lookup return type, we already can infer it
    for (let i = 0; i < args.length; i++) {
      if (!this.needsArgumentType(functionName, i)) continue;
      const type = this.getType(args[i]);
      if (!type) {
        throw this.astErrorOutput(`Unable to infer argument ${i}`, args[i]);
      }
      this.assignArgumentType(functionName, i, type);
    }
  }

  isAstMathVariable(ast) {
    const mathProperties = [
      'E',
      'PI',
      'SQRT2',
      'SQRT1_2',
      'LN2',
      'LN10',
      'LOG2E',
      'LOG10E',
    ];
    return ast.type === 'MemberExpression' &&
      ast.object && ast.object.type === 'Identifier' &&
      ast.object.name === 'Math' &&
      ast.property &&
      ast.property.type === 'Identifier' &&
      mathProperties.indexOf(ast.property.name) > -1;
  }

  isAstMathFunction(ast) {
    const mathFunctions = [
      'abs',
      'acos',
      'asin',
      'atan',
      'atan2',
      'ceil',
      'cos',
      'exp',
      'floor',
      'log',
      'log2',
      'max',
      'min',
      'pow',
      'random',
      'round',
      'sign',
      'sin',
      'sqrt',
      'tan',
    ];
    return ast.type === 'CallExpression' &&
      ast.callee &&
      ast.callee.type === 'MemberExpression' &&
      ast.callee.object &&
      ast.callee.object.type === 'Identifier' &&
      ast.callee.object.name === 'Math' &&
      ast.callee.property &&
      ast.callee.property.type === 'Identifier' &&
      mathFunctions.indexOf(ast.callee.property.name) > -1;
  }

  isAstVariable(ast) {
    return ast.type === 'Identifier' || ast.type === 'MemberExpression';
  }

  isSafe(ast) {
    return this.isSafeDependencies(this.getDependencies(ast));
  }

  isSafeDependencies(dependencies) {
    return dependencies && dependencies.every ? dependencies.every(dependency => dependency.isSafe) : true;
  }

  /**
   *
   * @param ast
   * @param dependencies
   * @param isNotSafe
   * @return {Array}
   */
  getDependencies(ast, dependencies, isNotSafe) {
    if (!dependencies) {
      dependencies = [];
    }
    if (!ast) return null;
    if (Array.isArray(ast)) {
      for (let i = 0; i < ast.length; i++) {
        this.getDependencies(ast[i], dependencies, isNotSafe);
      }
      return dependencies;
    }
    switch (ast.type) {
      case 'AssignmentExpression':
        this.getDependencies(ast.left, dependencies, isNotSafe);
        this.getDependencies(ast.right, dependencies, isNotSafe);
        return dependencies;
      case 'ConditionalExpression':
        this.getDependencies(ast.test, dependencies, isNotSafe);
        this.getDependencies(ast.alternate, dependencies, isNotSafe);
        this.getDependencies(ast.consequent, dependencies, isNotSafe);
        return dependencies;
      case 'Literal':
        dependencies.push({
          origin: 'literal',
          value: ast.value,
          isSafe: isNotSafe === true ? false : ast.value > -Infinity && ast.value < Infinity && !isNaN(ast.value)
        });
        break;
      case 'VariableDeclarator':
        return this.getDependencies(ast.init, dependencies, isNotSafe);
      case 'Identifier':
        const declaration = this.getDeclaration(ast);
        if (declaration) {
          dependencies.push({
            name: ast.name,
            origin: 'declaration',
            isSafe: isNotSafe ? false : this.isSafeDependencies(declaration.dependencies),
          });
        } else if (this.argumentNames.indexOf(ast.name) > -1) {
          dependencies.push({
            name: ast.name,
            origin: 'argument',
            isSafe: false,
          });
        } else if (this.strictTypingChecking) {
          throw new Error(`Cannot find identifier origin "${ast.name}"`);
        }
        break;
      case 'FunctionDeclaration':
        return this.getDependencies(ast.body.body[ast.body.body.length - 1], dependencies, isNotSafe);
      case 'ReturnStatement':
        return this.getDependencies(ast.argument, dependencies);
      case 'BinaryExpression':
        isNotSafe = (ast.operator === '/' || ast.operator === '*');
        this.getDependencies(ast.left, dependencies, isNotSafe);
        this.getDependencies(ast.right, dependencies, isNotSafe);
        return dependencies;
      case 'UnaryExpression':
      case 'UpdateExpression':
        return this.getDependencies(ast.argument, dependencies, isNotSafe);
      case 'VariableDeclaration':
        return this.getDependencies(ast.declarations, dependencies, isNotSafe);
      case 'ArrayExpression':
        dependencies.push({
          origin: 'declaration',
          isSafe: true,
        });
        return dependencies;
      case 'CallExpression':
        dependencies.push({
          origin: 'function',
          isSafe: true,
        });
        return dependencies;
      case 'MemberExpression':
        const details = this.getMemberExpressionDetails(ast);
        switch (details.signature) {
          case 'value[]':
            this.getDependencies(ast.object, dependencies, isNotSafe);
            break;
          case 'value[][]':
            this.getDependencies(ast.object.object, dependencies, isNotSafe);
            break;
          case 'value[][][]':
            this.getDependencies(ast.object.object.object, dependencies, isNotSafe);
            break;
          case 'this.output.value':
            if (this.dynamicOutput) {
              dependencies.push({
                name: details.name,
                origin: 'output',
                isSafe: false,
              });
            }
            break;
        }
        if (details) {
          if (details.property) {
            this.getDependencies(details.property, dependencies, isNotSafe);
          }
          if (details.xProperty) {
            this.getDependencies(details.xProperty, dependencies, isNotSafe);
          }
          if (details.yProperty) {
            this.getDependencies(details.yProperty, dependencies, isNotSafe);
          }
          if (details.zProperty) {
            this.getDependencies(details.zProperty, dependencies, isNotSafe);
          }
          return dependencies;
        }
        default:
          throw this.astErrorOutput(`Unhandled type ${ ast.type } in getDependencies`, ast);
    }
    return dependencies;
  }

  getVariableSignature(ast) {
    if (!this.isAstVariable(ast)) {
      throw new Error(`ast of type "${ ast.type }" is not a variable signature`);
    }
    if (ast.type === 'Identifier') {
      return 'value';
    }
    const signature = [];
    while (true) {
      if (!ast) break;
      if (ast.computed) {
        signature.push('[]');
      } else if (ast.type === 'ThisExpression') {
        signature.unshift('this');
      } else if (ast.property && ast.property.name) {
        if (
          ast.property.name === 'x' ||
          ast.property.name === 'y' ||
          ast.property.name === 'z'
        ) {
          signature.unshift('.value');
        } else if (
          ast.property.name === 'constants' ||
          ast.property.name === 'thread' ||
          ast.property.name === 'output'
        ) {
          signature.unshift('.' + ast.property.name);
        } else {
          signature.unshift('.value');
        }
      } else if (ast.name) {
        signature.unshift('value');
      } else if (ast.callee && ast.callee.name) {
        signature.unshift('fn()');
      } else if (ast.elements) {
        signature.unshift('[]');
      } else {
        signature.unshift('unknown');
      }
      ast = ast.object;
    }

    const signatureString = signature.join('');
    const allowedExpressions = [
      'value',
      'value[]',
      'value[][]',
      'value[][][]',
      'value[][][][]',
      'value.value',
      'value.thread.value',
      'this.thread.value',
      'this.output.value',
      'this.constants.value',
      'this.constants.value[]',
      'this.constants.value[][]',
      'this.constants.value[][][]',
      'this.constants.value[][][][]',
      'fn()[]',
      'fn()[][]',
      'fn()[][][]',
      '[][]',
    ];
    if (allowedExpressions.indexOf(signatureString) > -1) {
      return signatureString;
    }
    return null;
  }

  build() {
    return this.toString().length > 0;
  }

  /**
   * @desc Parses the abstract syntax tree for generically to its respective function
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the parsed string array
   */
  astGeneric(ast, retArr) {
    if (ast === null) {
      throw this.astErrorOutput('NULL ast', ast);
    } else {
      if (Array.isArray(ast)) {
        for (let i = 0; i < ast.length; i++) {
          this.astGeneric(ast[i], retArr);
        }
        return retArr;
      }

      switch (ast.type) {
        case 'FunctionDeclaration':
          return this.astFunctionDeclaration(ast, retArr);
        case 'FunctionExpression':
          return this.astFunctionExpression(ast, retArr);
        case 'ReturnStatement':
          return this.astReturnStatement(ast, retArr);
        case 'Literal':
          return this.astLiteral(ast, retArr);
        case 'BinaryExpression':
          return this.astBinaryExpression(ast, retArr);
        case 'Identifier':
          return this.astIdentifierExpression(ast, retArr);
        case 'AssignmentExpression':
          return this.astAssignmentExpression(ast, retArr);
        case 'ExpressionStatement':
          return this.astExpressionStatement(ast, retArr);
        case 'EmptyStatement':
          return this.astEmptyStatement(ast, retArr);
        case 'BlockStatement':
          return this.astBlockStatement(ast, retArr);
        case 'IfStatement':
          return this.astIfStatement(ast, retArr);
        case 'SwitchStatement':
          return this.astSwitchStatement(ast, retArr);
        case 'BreakStatement':
          return this.astBreakStatement(ast, retArr);
        case 'ContinueStatement':
          return this.astContinueStatement(ast, retArr);
        case 'ForStatement':
          return this.astForStatement(ast, retArr);
        case 'WhileStatement':
          return this.astWhileStatement(ast, retArr);
        case 'DoWhileStatement':
          return this.astDoWhileStatement(ast, retArr);
        case 'VariableDeclaration':
          return this.astVariableDeclaration(ast, retArr);
        case 'VariableDeclarator':
          return this.astVariableDeclarator(ast, retArr);
        case 'ThisExpression':
          return this.astThisExpression(ast, retArr);
        case 'SequenceExpression':
          return this.astSequenceExpression(ast, retArr);
        case 'UnaryExpression':
          return this.astUnaryExpression(ast, retArr);
        case 'UpdateExpression':
          return this.astUpdateExpression(ast, retArr);
        case 'LogicalExpression':
          return this.astLogicalExpression(ast, retArr);
        case 'MemberExpression':
          return this.astMemberExpression(ast, retArr);
        case 'CallExpression':
          return this.astCallExpression(ast, retArr);
        case 'ArrayExpression':
          return this.astArrayExpression(ast, retArr);
        case 'DebuggerStatement':
          return this.astDebuggerStatement(ast, retArr);
        case 'ConditionalExpression':
          return this.astConditionalExpression(ast, retArr);
      }

      throw this.astErrorOutput('Unknown ast type : ' + ast.type, ast);
    }
  }
  /**
   * @desc To throw the AST error, with its location.
   * @param {string} error - the error message output
   * @param {Object} ast - the AST object where the error is
   */
  astErrorOutput(error, ast) {
    if (typeof this.source !== 'string') {
      return new Error(error);
    }

    const debugString = utils.getAstString(this.source, ast);
    const leadingSource = this.source.substr(ast.start);
    const splitLines = leadingSource.split(/\n/);
    const lineBefore = splitLines.length > 0 ? splitLines[splitLines.length - 1] : 0;
    return new Error(`${error} on line ${ splitLines.length }, position ${ lineBefore.length }:\n ${ debugString }`);
  }

  astDebuggerStatement(arrNode, retArr) {
    return retArr;
  }

  astConditionalExpression(ast, retArr) {
    if (ast.type !== 'ConditionalExpression') {
      throw this.astErrorOutput('Not a conditional expression', ast);
    }
    retArr.push('(');
    this.astGeneric(ast.test, retArr);
    retArr.push('?');
    this.astGeneric(ast.consequent, retArr);
    retArr.push(':');
    this.astGeneric(ast.alternate, retArr);
    retArr.push(')');
    return retArr;
  }

  /**
   * @abstract
   * @param {Object} ast
   * @param {String[]} retArr
   * @returns {String[]}
   */
  astFunction(ast, retArr) {
    throw new Error(`"astFunction" not defined on ${ this.constructor.name }`);
  }

  /**
   * @desc Parses the abstract syntax tree for to its *named function declaration*
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astFunctionDeclaration(ast, retArr) {
    if (this.isChildFunction(ast)) {
      return retArr;
    }
    return this.astFunction(ast, retArr);
  }
  astFunctionExpression(ast, retArr) {
    if (this.isChildFunction(ast)) {
      return retArr;
    }
    return this.astFunction(ast, retArr);
  }
  isChildFunction(ast) {
    for (let i = 0; i < this.functions.length; i++) {
      if (this.functions[i] === ast) {
        return true;
      }
    }
    return false;
  }
  astReturnStatement(ast, retArr) {
    return retArr;
  }
  astLiteral(ast, retArr) {
    this.literalTypes[`${ast.start},${ast.end}`] = 'Number';
    return retArr;
  }
  astBinaryExpression(ast, retArr) {
    return retArr;
  }
  astIdentifierExpression(ast, retArr) {
    return retArr;
  }
  astAssignmentExpression(ast, retArr) {
    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for *generic expression* statement
   * @param {Object} esNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astExpressionStatement(esNode, retArr) {
    this.astGeneric(esNode.expression, retArr);
    retArr.push(';');
    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for an *Empty* Statement
   * @param {Object} eNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astEmptyStatement(eNode, retArr) {
    return retArr;
  }
  astBlockStatement(ast, retArr) {
    return retArr;
  }
  astIfStatement(ast, retArr) {
    return retArr;
  }
  astSwitchStatement(ast, retArr) {
    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for *Break* Statement
   * @param {Object} brNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astBreakStatement(brNode, retArr) {
    retArr.push('break;');
    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for *Continue* Statement
   * @param {Object} crNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astContinueStatement(crNode, retArr) {
    retArr.push('continue;\n');
    return retArr;
  }
  astForStatement(ast, retArr) {
    return retArr;
  }
  astWhileStatement(ast, retArr) {
    return retArr;
  }
  astDoWhileStatement(ast, retArr) {
    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for *Variable Declaration*
   * @param {Object} varDecNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astVariableDeclaration(varDecNode, retArr) {
    const declarations = varDecNode.declarations;
    if (!declarations || !declarations[0] || !declarations[0].init) {
      throw this.astErrorOutput('Unexpected expression', varDecNode);
    }
    const result = [];
    const firstDeclaration = declarations[0];
    const init = firstDeclaration.init;
    let type = this.isState('in-for-loop-init') ? 'Integer' : this.getType(init);
    if (type === 'LiteralInteger') {
      // We had the choice to go either float or int, choosing float
      type = 'Number';
    }
    const markupType = typeMap[type];
    if (!markupType) {
      throw this.astErrorOutput(`Markup type ${ markupType } not handled`, varDecNode);
    }
    let dependencies = this.getDependencies(firstDeclaration.init);
    throw new Error('remove me');
    this.declarations[firstDeclaration.id.name] = Object.freeze({
      type,
      dependencies,
      isSafe: dependencies.every(dependency => dependency.isSafe)
    });
    const initResult = [`${type} user_${firstDeclaration.id.name}=`];
    this.astGeneric(init, initResult);
    result.push(initResult.join(''));

    // first declaration is done, now any added ones setup
    for (let i = 1; i < declarations.length; i++) {
      const declaration = declarations[i];
      dependencies = this.getDependencies(declaration);
      throw new Error('Remove me');
      this.declarations[declaration.id.name] = Object.freeze({
        type,
        dependencies,
        isSafe: false
      });
      this.astGeneric(declaration, result);
    }

    retArr.push(retArr, result.join(','));
    retArr.push(';');
    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for *Variable Declarator*
   * @param {Object} iVarDecNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astVariableDeclarator(iVarDecNode, retArr) {
    this.astGeneric(iVarDecNode.id, retArr);
    if (iVarDecNode.init !== null) {
      retArr.push('=');
      this.astGeneric(iVarDecNode.init, retArr);
    }
    return retArr;
  }
  astThisExpression(ast, retArr) {
    return retArr;
  }
  astSequenceExpression(sNode, retArr) {
    for (let i = 0; i < sNode.expressions.length; i++) {
      if (i > 0) {
        retArr.push(',');
      }
      this.astGeneric(sNode.expressions, retArr);
    }
    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for *Unary* Expression
   * @param {Object} uNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astUnaryExpression(uNode, retArr) {
    const unaryResult = this.checkAndUpconvertBitwiseUnary(uNode, retArr);
    if (unaryResult) {
      return retArr;
    }

    if (uNode.prefix) {
      retArr.push(uNode.operator);
      this.astGeneric(uNode.argument, retArr);
    } else {
      this.astGeneric(uNode.argument, retArr);
      retArr.push(uNode.operator);
    }

    return retArr;
  }

  checkAndUpconvertBitwiseUnary(uNode, retArr) {}

  /**
   * @desc Parses the abstract syntax tree for *Update* Expression
   * @param {Object} uNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astUpdateExpression(uNode, retArr) {
    if (uNode.prefix) {
      retArr.push(uNode.operator);
      this.astGeneric(uNode.argument, retArr);
    } else {
      this.astGeneric(uNode.argument, retArr);
      retArr.push(uNode.operator);
    }

    return retArr;
  }
  /**
   * @desc Parses the abstract syntax tree for *Logical* Expression
   * @param {Object} logNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astLogicalExpression(logNode, retArr) {
    retArr.push('(');
    this.astGeneric(logNode.left, retArr);
    retArr.push(logNode.operator);
    this.astGeneric(logNode.right, retArr);
    retArr.push(')');
    return retArr;
  }
  astMemberExpression(ast, retArr) {
    return retArr;
  }
  astCallExpression(ast, retArr) {
    return retArr;
  }
  astArrayExpression(ast, retArr) {
    return retArr;
  }

  /**
   *
   * @param ast
   * @return {IFunctionNodeMemberExpressionDetails}
   */
  getMemberExpressionDetails(ast) {
    if (ast.type !== 'MemberExpression') {
      throw this.astErrorOutput(`Expression ${ ast.type } not a MemberExpression`, ast);
    }
    let name = null;
    let type = null;
    const variableSignature = this.getVariableSignature(ast);
    switch (variableSignature) {
      case 'value':
        return null;
      case 'value.thread.value':
      case 'this.thread.value':
      case 'this.output.value':
        return {
          signature: variableSignature,
            type: 'Integer',
            name: ast.property.name
        };
      case 'value[]':
        if (typeof ast.object.name !== 'string') {
          throw this.astErrorOutput('Unexpected expression', ast);
        }
        name = ast.object.name;
        return {
          name,
          origin: 'user',
            signature: variableSignature,
            type: this.getVariableType(ast.object),
            xProperty: ast.property
        };
      case 'value[][]':
        if (typeof ast.object.object.name !== 'string') {
          throw this.astErrorOutput('Unexpected expression', ast);
        }
        name = ast.object.object.name;
        return {
          name,
          origin: 'user',
            signature: variableSignature,
            type: this.getVariableType(ast.object.object),
            yProperty: ast.object.property,
            xProperty: ast.property,
        };
      case 'value[][][]':
        if (typeof ast.object.object.object.name !== 'string') {
          throw this.astErrorOutput('Unexpected expression', ast);
        }
        name = ast.object.object.object.name;
        return {
          name,
          origin: 'user',
            signature: variableSignature,
            type: this.getVariableType(ast.object.object.object),
            zProperty: ast.object.object.property,
            yProperty: ast.object.property,
            xProperty: ast.property,
        };
      case 'value[][][][]':
        if (typeof ast.object.object.object.object.name !== 'string') {
          throw this.astErrorOutput('Unexpected expression', ast);
        }
        name = ast.object.object.object.object.name;
        return {
          name,
          origin: 'user',
            signature: variableSignature,
            type: this.getVariableType(ast.object.object.object.object),
            zProperty: ast.object.object.property,
            yProperty: ast.object.property,
            xProperty: ast.property,
        };
      case 'value.value':
        if (typeof ast.property.name !== 'string') {
          throw this.astErrorOutput('Unexpected expression', ast);
        }
        if (this.isAstMathVariable(ast)) {
          name = ast.property.name;
          return {
            name,
            origin: 'Math',
            type: 'Number',
            signature: variableSignature,
          };
        }
        switch (ast.property.name) {
          case 'r':
          case 'g':
          case 'b':
          case 'a':
            name = ast.object.name;
            return {
              name,
              property: ast.property.name,
                origin: 'user',
                signature: variableSignature,
                type: 'Number'
            };
          default:
            throw this.astErrorOutput('Unexpected expression', ast);
        }
        case 'this.constants.value':
          if (typeof ast.property.name !== 'string') {
            throw this.astErrorOutput('Unexpected expression', ast);
          }
          name = ast.property.name;
          type = this.getConstantType(name);
          if (!type) {
            throw this.astErrorOutput('Constant has no type', ast);
          }
          return {
            name,
            type,
            origin: 'constants',
              signature: variableSignature,
          };
        case 'this.constants.value[]':
          if (typeof ast.object.property.name !== 'string') {
            throw this.astErrorOutput('Unexpected expression', ast);
          }
          name = ast.object.property.name;
          type = this.getConstantType(name);
          if (!type) {
            throw this.astErrorOutput('Constant has no type', ast);
          }
          return {
            name,
            type,
            origin: 'constants',
              signature: variableSignature,
              xProperty: ast.property,
          };
        case 'this.constants.value[][]': {
          if (typeof ast.object.object.property.name !== 'string') {
            throw this.astErrorOutput('Unexpected expression', ast);
          }
          name = ast.object.object.property.name;
          type = this.getConstantType(name);
          if (!type) {
            throw this.astErrorOutput('Constant has no type', ast);
          }
          return {
            name,
            type,
            origin: 'constants',
            signature: variableSignature,
            yProperty: ast.object.property,
            xProperty: ast.property,
          };
        }
        case 'this.constants.value[][][]': {
          if (typeof ast.object.object.object.property.name !== 'string') {
            throw this.astErrorOutput('Unexpected expression', ast);
          }
          name = ast.object.object.object.property.name;
          type = this.getConstantType(name);
          if (!type) {
            throw this.astErrorOutput('Constant has no type', ast);
          }
          return {
            name,
            type,
            origin: 'constants',
            signature: variableSignature,
            zProperty: ast.object.object.property,
            yProperty: ast.object.property,
            xProperty: ast.property,
          };
        }
        case 'fn()[]':
        case '[][]':
          return {
            signature: variableSignature,
              property: ast.property,
          };
        default:
          throw this.astErrorOutput('Unexpected expression', ast);
    }
  }

  findIdentifierOrigin(astToFind) {
    const stack = [this.ast];

    while (stack.length > 0) {
      const atNode = stack[0];
      if (atNode.type === 'VariableDeclarator' && atNode.id && atNode.id.name && atNode.id.name === astToFind.name) {
        return atNode;
      }
      stack.shift();
      if (atNode.argument) {
        stack.push(atNode.argument);
      } else if (atNode.body) {
        stack.push(atNode.body);
      } else if (atNode.declarations) {
        stack.push(atNode.declarations);
      } else if (Array.isArray(atNode)) {
        for (let i = 0; i < atNode.length; i++) {
          stack.push(atNode[i]);
        }
      }
    }
    return null;
  }

  findLastReturn(ast) {
    const stack = [ast || this.ast];

    while (stack.length > 0) {
      const atNode = stack.pop();
      if (atNode.type === 'ReturnStatement') {
        return atNode;
      }
      if (atNode.type === 'FunctionDeclaration') {
        continue;
      }
      if (atNode.argument) {
        stack.push(atNode.argument);
      } else if (atNode.body) {
        stack.push(atNode.body);
      } else if (atNode.declarations) {
        stack.push(atNode.declarations);
      } else if (Array.isArray(atNode)) {
        for (let i = 0; i < atNode.length; i++) {
          stack.push(atNode[i]);
        }
      } else if (atNode.consequent) {
        stack.push(atNode.consequent);
      } else if (atNode.cases) {
        stack.push(atNode.cases);
      }
    }
    return null;
  }

  getInternalVariableName(name) {
    if (!this._internalVariableNames.hasOwnProperty(name)) {
      this._internalVariableNames[name] = 0;
    }
    this._internalVariableNames[name]++;
    if (this._internalVariableNames[name] === 1) {
      return name;
    }
    return name + this._internalVariableNames[name];
  }

  varWarn() {
    console.warn('var declarations are deprecated, weird things happen when falling back to CPU because var scope differs in javascript than in most languages.  Use const or let');
  }
}

const typeLookupMap = {
  'Number': 'Number',
  'Float': 'Float',
  'Integer': 'Integer',
  'Array': 'Number',
  'Array(2)': 'Number',
  'Array(3)': 'Number',
  'Array(4)': 'Number',
  'Array2D': 'Number',
  'Array3D': 'Number',
  'Input': 'Number',
  'HTMLImage': 'Array(4)',
  'HTMLVideo': 'Array(4)',
  'HTMLImageArray': 'Array(4)',
  'NumberTexture': 'Number',
  'MemoryOptimizedNumberTexture': 'Number',
  'Array1D(2)': 'Array(2)',
  'Array1D(3)': 'Array(3)',
  'Array1D(4)': 'Array(4)',
  'Array2D(2)': 'Array(2)',
  'Array2D(3)': 'Array(3)',
  'Array2D(4)': 'Array(4)',
  'Array3D(2)': 'Array(2)',
  'Array3D(3)': 'Array(3)',
  'Array3D(4)': 'Array(4)',
  'ArrayTexture(1)': 'Number',
  'ArrayTexture(2)': 'Array(2)',
  'ArrayTexture(3)': 'Array(3)',
  'ArrayTexture(4)': 'Array(4)',
};

module.exports = {
  FunctionNode
};
},{"../utils":150,"./function-tracer":50,"acorn":43}],50:[function(require,module,exports){
class FunctionTracer {
  constructor(ast) {
    this.runningContexts = [];
    this.contexts = [];
    this.functionCalls = [];
    this.declarations = [];
    this.identifiers = [];
    this.functions = [];
    this.returnStatements = [];
    this.inLoopInit = false;
    this.scan(ast);
  }

  get currentContext() {
    return this.runningContexts.length > 0 ? this.runningContexts[this.runningContexts.length - 1] : null;
  }

  newContext(run) {
    const newContext = Object.assign({}, this.currentContext);
    this.contexts.push(newContext);
    this.runningContexts.push(newContext);
    run();
    this.runningContexts.pop();
  }

  /**
   * Recursively scans AST for declarations and functions, and add them to their respective context
   * @param ast
   */
  scan(ast) {
    if (!ast) return;
    if (Array.isArray(ast)) {
      for (let i = 0; i < ast.length; i++) {
        this.scan(ast[i]);
      }
      return;
    }
    switch (ast.type) {
      case 'Program':
        this.scan(ast.body);
        break;
      case 'BlockStatement':
        this.newContext(() => {
          this.scan(ast.body);
        });
        break;
      case 'AssignmentExpression':
      case 'LogicalExpression':
        this.scan(ast.left);
        this.scan(ast.right);
        break;
      case 'BinaryExpression':
        this.scan(ast.left);
        this.scan(ast.right);
        break;
      case 'UpdateExpression':
      case 'UnaryExpression':
        this.scan(ast.argument);
        break;
      case 'VariableDeclaration':
        this.scan(ast.declarations);
        break;
      case 'VariableDeclarator':
        const { currentContext } = this;
        const declaration = {
          ast: ast,
          context: currentContext,
          name: ast.id.name,
          origin: 'declaration',
          forceInteger: this.inLoopInit,
          assignable: !this.inLoopInit && !currentContext.hasOwnProperty(ast.id.name),
        };
        currentContext[ast.id.name] = declaration;
        this.declarations.push(declaration);
        this.scan(ast.id);
        this.scan(ast.init);
        break;
      case 'FunctionExpression':
      case 'FunctionDeclaration':
        if (this.runningContexts.length === 0) {
          this.scan(ast.body);
        } else {
          this.functions.push(ast);
        }
        break;
      case 'IfStatement':
        this.scan(ast.test);
        this.scan(ast.consequent);
        if (ast.alternate) this.scan(ast.alternate);
        break;
      case 'ForStatement':
        this.newContext(() => {
          this.inLoopInit = true;
          this.scan(ast.init);
          this.inLoopInit = false;
          this.scan(ast.test);
          this.scan(ast.update);
          this.newContext(() => {
            this.scan(ast.body);
          });
        });
        break;
      case 'DoWhileStatement':
      case 'WhileStatement':
        this.newContext(() => {
          this.scan(ast.body);
          this.scan(ast.test);
        });
        break;
      case 'Identifier':
        this.identifiers.push({
          context: this.currentContext,
          ast,
        });
        break;
      case 'ReturnStatement':
        this.returnStatements.push(ast);
        this.scan(ast.argument);
        break;
      case 'MemberExpression':
        this.scan(ast.object);
        this.scan(ast.property);
        break;
      case 'ExpressionStatement':
        this.scan(ast.expression);
        break;
      case 'CallExpression':
        this.functionCalls.push({
          context: this.currentContext,
          ast,
        });
        this.scan(ast.arguments);
        break;
      case 'ArrayExpression':
        this.scan(ast.elements);
        break;
      case 'ConditionalExpression':
        this.scan(ast.test);
        this.scan(ast.alternate);
        this.scan(ast.consequent);
        break;
      case 'SwitchStatement':
        this.scan(ast.discriminant);
        this.scan(ast.cases);
        break;
      case 'SwitchCase':
        this.scan(ast.test);
        this.scan(ast.consequent);
        break;

      case 'ThisExpression':
      case 'Literal':
      case 'DebuggerStatement':
      case 'EmptyStatement':
      case 'BreakStatement':
      case 'ContinueStatement':
        break;

      default:
        throw new Error(`unhandled type "${ast.type}"`);
    }
  }
}

module.exports = {
  FunctionTracer,
};
},{}],51:[function(require,module,exports){
const { glWiretap } = require('gl-wiretap');
const { utils } = require('../../utils');

function toStringWithoutUtils(fn) {
  return fn.toString()
    .replace('=>', '')
    .replace(/^function /, '')
    .replace(/utils[.]/g, '/*utils.*/');
}

/**
 *
 * @param {Kernel} Kernel
 * @param {KernelVariable[]} args
 * @param {Kernel} originKernel
 * @param {string} [setupContextString]
 * @param {string} [destroyContextString]
 * @returns {string}
 */
function glKernelString(Kernel, args, originKernel, setupContextString, destroyContextString) {
  args = args ? Array.from(args).map(arg => {
    switch (typeof arg) {
      case 'boolean':
        return new Boolean(arg);
      case 'number':
        return new Number(arg);
      default:
        return arg;
    }
  }) : null;
  const uploadedValues = [];
  const postResult = [];
  const context = glWiretap(originKernel.context, {
    useTrackablePrimitives: true,
    onReadPixels: (targetName) => {
      if (kernel.subKernels) {
        if (!subKernelsResultVariableSetup) {
          postResult.push(`    const result = { result: ${getRenderString(targetName, kernel)} };`);
          subKernelsResultVariableSetup = true;
        } else {
          const property = kernel.subKernels[subKernelsResultIndex++].property;
          postResult.push(`    result${isNaN(property) ? '.' + property : `[${property}]`} = ${getRenderString(targetName, kernel)};`);
        }
        if (subKernelsResultIndex === kernel.subKernels.length) {
          postResult.push('    return result;');
        }
        return;
      }
      if (targetName) {
        postResult.push(`    return ${getRenderString(targetName, kernel)};`);
      } else {
        postResult.push(`    return null;`);
      }
    },
    onUnrecognizedArgumentLookup: (argument) => {
      const argumentName = findKernelValue(argument, kernel.kernelArguments, [], context, uploadedValues);
      if (argumentName) {
        return argumentName;
      }
      const constantName = findKernelValue(argument, kernel.kernelConstants, constants ? Object.keys(constants).map(key => constants[key]) : [], context, uploadedValues);
      if (constantName) {
        return constantName;
      }
      return null;
    }
  });
  let subKernelsResultVariableSetup = false;
  let subKernelsResultIndex = 0;
  const {
    source,
    canvas,
    output,
    pipeline,
    graphical,
    loopMaxIterations,
    constants,
    optimizeFloatMemory,
    precision,
    fixIntegerDivisionAccuracy,
    functions,
    nativeFunctions,
    subKernels,
    immutable,
    argumentTypes,
    constantTypes,
    kernelArguments,
    kernelConstants,
  } = originKernel;
  const kernel = new Kernel(source, {
    canvas,
    context,
    checkContext: false,
    output,
    pipeline,
    graphical,
    loopMaxIterations,
    constants,
    optimizeFloatMemory,
    precision,
    fixIntegerDivisionAccuracy,
    functions,
    nativeFunctions,
    subKernels,
    immutable,
    argumentTypes,
    constantTypes,
  });
  let result = [];
  context.setIndent(2);
  kernel.build.apply(kernel, args);
  result.push(context.toString());
  context.reset();

  kernel.kernelArguments.forEach((kernelArgument, i) => {
    switch (kernelArgument.type) {
      // primitives
      case 'Integer':
      case 'Boolean':
      case 'Number':
      case 'Float':
        // non-primitives
      case 'Array':
      case 'Array(2)':
      case 'Array(3)':
      case 'Array(4)':
      case 'HTMLImage':
      case 'HTMLVideo':
        context.insertVariable(`uploadValue_${kernelArgument.name}`, kernelArgument.uploadValue);
        break;
      case 'HTMLImageArray':
        for (let imageIndex = 0; imageIndex < args[i].length; imageIndex++) {
          const arg = args[i];
          context.insertVariable(`uploadValue_${kernelArgument.name}[${imageIndex}]`, arg[imageIndex]);
        }
        break;
      case 'Input':
        context.insertVariable(`uploadValue_${kernelArgument.name}`, kernelArgument.uploadValue);
        break;
      case 'MemoryOptimizedNumberTexture':
      case 'NumberTexture':
      case 'Array1D(2)':
      case 'Array1D(3)':
      case 'Array1D(4)':
      case 'Array2D(2)':
      case 'Array2D(3)':
      case 'Array2D(4)':
      case 'Array3D(2)':
      case 'Array3D(3)':
      case 'Array3D(4)':
      case 'ArrayTexture(1)':
      case 'ArrayTexture(2)':
      case 'ArrayTexture(3)':
      case 'ArrayTexture(4)':
        context.insertVariable(`uploadValue_${kernelArgument.name}`, args[i].texture);
        break;
      default:
        throw new Error(`unhandled kernelArgumentType insertion for glWiretap of type ${kernelArgument.type}`);
    }
  });
  result.push('/** start of injected functions **/');
  result.push(`function ${toStringWithoutUtils(utils.flattenTo)}`);
  result.push(`function ${toStringWithoutUtils(utils.flatten2dArrayTo)}`);
  result.push(`function ${toStringWithoutUtils(utils.flatten3dArrayTo)}`);
  result.push(`function ${toStringWithoutUtils(utils.flatten4dArrayTo)}`);
  result.push(`function ${toStringWithoutUtils(utils.isArray)}`);
  if (kernel.renderOutput !== kernel.renderTexture && kernel.formatValues) {
    result.push(
      `  const renderOutput = function ${toStringWithoutUtils(kernel.formatValues)};`
    );
  }
  result.push('/** end of injected functions **/');
  result.push(`  const innerKernel = function (${kernel.kernelArguments.map(kernelArgument => kernelArgument.varName).join(', ')}) {`);
  context.setIndent(4);
  kernel.run.apply(kernel, args);
  if (kernel.renderKernels) {
    kernel.renderKernels();
  } else if (kernel.renderOutput) {
    kernel.renderOutput();
  }
  result.push('    /** start setup uploads for kernel values **/');
  kernel.kernelArguments.forEach(kernelArgument => {
    result.push('    ' + kernelArgument.getStringValueHandler().split('\n').join('\n    '));
  });
  result.push('    /** end setup uploads for kernel values **/');
  result.push(context.toString());
  if (kernel.renderOutput === kernel.renderTexture && kernel.renderKernels) {
    context.reset();
    const results = kernel.renderKernels();
    const textureName = context.getContextVariableName(kernel.outputTexture);
    result.push(`    return {
      result: {
        texture: ${ textureName },
        type: '${ results.result.type }',
        toArray: ${ getToArrayString(results.result, textureName) }
      },`);
    const { subKernels, subKernelOutputTextures } = kernel;
    for (let i = 0; i < subKernels.length; i++) {
      const texture = subKernelOutputTextures[i];
      const subKernel = subKernels[i];
      const subKernelResult = results[subKernel.property];
      const subKernelTextureName = context.getContextVariableName(texture);
      result.push(`
      ${subKernel.property}: {
        texture: ${ subKernelTextureName },
        type: '${ subKernelResult.type }',
        toArray: ${ getToArrayString(subKernelResult, subKernelTextureName) }
      },`);
    }
    result.push(`    };`);
  }
  result.push(`    ${destroyContextString ? '\n' + destroyContextString + '    ': ''}`);
  result.push(postResult.join('\n'));
  result.push('  };');
  if (kernel.graphical) {
    result.push(getGetPixelsString(kernel));
    result.push(`  innerKernel.getPixels = getPixels;`);
  }
  result.push('  return innerKernel;');

  let constantsUpload = [];
  kernelConstants.forEach((kernelConstant) => {
    constantsUpload.push(`${  kernelConstant.getStringValueHandler()}`);
  });
  return `function kernel(settings) {
  const { context, constants } = settings;
  ${constantsUpload.join('')}
  ${setupContextString ? setupContextString : ''}
${result.join('\n')}
}`;
}

function getRenderString(targetName, kernel) {
  const readBackValue = kernel.precision === 'single' ? targetName : `new Float32Array(${targetName}.buffer)`;
  if (kernel.output[2]) {
    return `renderOutput(${readBackValue}, ${kernel.output[0]}, ${kernel.output[1]}, ${kernel.output[2]})`;
  }
  if (kernel.output[1]) {
    return `renderOutput(${readBackValue}, ${kernel.output[0]}, ${kernel.output[1]})`;
  }

  return `renderOutput(${readBackValue}, ${kernel.output[0]})`;
}

function getGetPixelsString(kernel) {
  const getPixels = kernel.getPixels.toString();
  const useFunctionKeyword = !/^function/.test(getPixels);
  return utils.flattenFunctionToString(`${useFunctionKeyword ? 'function ' : ''}${ getPixels }`, {
    findDependency: (object, name) => {
      if (object === 'utils') {
        return `const ${name} = ${utils[name].toString()};`;
      }
      return null;
    },
    thisLookup: (property) => {
      if (property === 'context') {
        return null;
      }
      if (kernel.hasOwnProperty(property)) {
        return JSON.stringify(kernel[property]);
      }
      throw new Error(`unhandled thisLookup ${ property }`);
    }
  });
}

function getToArrayString(kernelResult, textureName) {
  const toArray = kernelResult.toArray.toString();
  const useFunctionKeyword = !/^function/.test(toArray);
  const flattenedFunctions = utils.flattenFunctionToString(`${useFunctionKeyword ? 'function ' : ''}${ toArray }`, {
    findDependency: (object, name) => {
      if (object === 'utils') {
        return `const ${name} = ${utils[name].toString()};`;
      } else if (object === 'this') {
        return `${useFunctionKeyword ? 'function ' : ''}${kernelResult[name].toString()}`;
      } else {
        throw new Error('unhandled fromObject');
      }
    },
    thisLookup: (property) => {
      if (property === 'texture') {
        return textureName;
      }
      if (kernelResult.hasOwnProperty(property)) {
        return JSON.stringify(kernelResult[property]);
      }
      throw new Error(`unhandled thisLookup ${ property }`);
    }
  });
  return `() => {
  ${flattenedFunctions}
  return toArray();
  }`;
}

/**
 *
 * @param {KernelVariable} argument
 * @param {KernelValue[]} kernelValues
 * @param {KernelVariable[]} values
 * @param context
 * @param {KernelVariable[]} uploadedValues
 * @return {string|null}
 */
function findKernelValue(argument, kernelValues, values, context, uploadedValues) {
  if (argument === null) return null;
  switch (typeof argument) {
    case 'boolean':
    case 'number':
      return null;
  }
  if (
    typeof HTMLImageElement !== 'undefined' &&
    argument instanceof HTMLImageElement
  ) {
    for (let i = 0; i < kernelValues.length; i++) {
      const kernelValue = kernelValues[i];
      if (kernelValue.type !== 'HTMLImageArray') continue;
      if (kernelValue.uploadValue !== argument) continue;
      // TODO: if we send two of the same image, the parser could get confused, and short circuit to the first, handle that here
      const variableIndex = values[i].indexOf(argument);
      if (variableIndex === -1) continue;
      const variableName = `uploadValue_${kernelValue.name}[${variableIndex}]`;
      context.insertVariable(variableName, argument);
      return variableName;
    }
    return null;
  }

  for (let i = 0; i < kernelValues.length; i++) {
    const kernelValue = kernelValues[i];
    if (argument !== kernelValue.uploadValue) continue;
    const variable = `uploadValue_${kernelValue.name}`;
    context.insertVariable(variable, kernelValue);
    return variable;
  }
  return null;
}

module.exports = {
  glKernelString
};
},{"../../utils":150,"gl-wiretap":7}],52:[function(require,module,exports){
const { Kernel } = require('../kernel');
const { utils } = require('../../utils');
const { GLTextureArray2Float } = require('./texture/array-2-float');
const { GLTextureArray2Float2D } = require('./texture/array-2-float-2d');
const { GLTextureArray2Float3D } = require('./texture/array-2-float-3d');
const { GLTextureArray3Float } = require('./texture/array-3-float');
const { GLTextureArray3Float2D } = require('./texture/array-3-float-2d');
const { GLTextureArray3Float3D } = require('./texture/array-3-float-3d');
const { GLTextureArray4Float } = require('./texture/array-4-float');
const { GLTextureArray4Float2D } = require('./texture/array-4-float-2d');
const { GLTextureArray4Float3D } = require('./texture/array-4-float-3d');
const { GLTextureFloat } = require('./texture/float');
const { GLTextureFloat2D } = require('./texture/float-2d');
const { GLTextureFloat3D } = require('./texture/float-3d');
const { GLTextureMemoryOptimized } = require('./texture/memory-optimized');
const { GLTextureMemoryOptimized2D } = require('./texture/memory-optimized-2d');
const { GLTextureMemoryOptimized3D } = require('./texture/memory-optimized-3d');
const { GLTextureUnsigned } = require('./texture/unsigned');
const { GLTextureUnsigned2D } = require('./texture/unsigned-2d');
const { GLTextureUnsigned3D } = require('./texture/unsigned-3d');
const { GLTextureGraphical } = require('./texture/graphical');

/**
 * @abstract
 * @extends Kernel
 */
class GLKernel extends Kernel {
  static get mode() {
    return 'gpu';
  }

  static getIsFloatRead() {
    const kernelString = `function kernelFunction() {
      return 1;
    }`;
    const kernel = new this(kernelString, {
      context: this.testContext,
      canvas: this.testCanvas,
      validate: false,
      output: [1],
      precision: 'single',
      returnType: 'Number',
      tactic: 'speed',
    });
    kernel.build();
    kernel.run();
    const result = kernel.renderOutput();
    kernel.destroy(true);
    return result[0] === 1;
  }

  static getIsIntegerDivisionAccurate() {
    function kernelFunction(v1, v2) {
      return v1[this.thread.x] / v2[this.thread.x];
    }
    const kernel = new this(kernelFunction.toString(), {
      context: this.testContext,
      canvas: this.testCanvas,
      validate: false,
      output: [2],
      returnType: 'Number',
      precision: 'unsigned',
      tactic: 'speed',
    });
    const args = [
      [6, 6030401],
      [3, 3991]
    ];
    kernel.build.apply(kernel, args);
    kernel.run.apply(kernel, args);
    const result = kernel.renderOutput();
    kernel.destroy(true);
    // have we not got whole numbers for 6/3 or 6030401/3991
    // add more here if others see this problem
    return result[0] === 2 && result[1] === 1511;
  }

  /**
   * @abstract
   */
  static get testCanvas() {
    throw new Error(`"testCanvas" not defined on ${ this.name }`);
  }

  /**
   * @abstract
   */
  static get testContext() {
    throw new Error(`"testContext" not defined on ${ this.name }`);
  }

  /**
   * @type {IKernelFeatures}
   */
  static get features() {
    throw new Error(`"features" not defined on ${ this.name }`);
  }

  /**
   * @abstract
   */
  static setupFeatureChecks() {
    throw new Error(`"setupFeatureChecks" not defined on ${ this.name }`);
  }

  /**
   * @desc Fix division by factor of 3 FP accuracy bug
   * @param {Boolean} fix - should fix
   */
  setFixIntegerDivisionAccuracy(fix) {
    this.fixIntegerDivisionAccuracy = fix;
    return this;
  }

  /**
   * @desc Toggle output mode
   * @param {String} flag - 'single' or 'unsigned'
   */
  setPrecision(flag) {
    this.precision = flag;
    return this;
  }

  /**
   * @desc Toggle texture output mode
   * @param {Boolean} flag - true to enable floatTextures
   * @deprecated
   */
  setFloatTextures(flag) {
    utils.warnDeprecated('method', 'setFloatTextures', 'setOptimizeFloatMemory');
    this.floatTextures = flag;
    return this;
  }

  /**
   * A highly readable very forgiving micro-parser for a glsl function that gets argument types
   * @param {String} source
   * @returns {{argumentTypes: String[], argumentNames: String[]}}
   */
  static nativeFunctionArguments(source) {
    const argumentTypes = [];
    const argumentNames = [];
    const states = [];
    const isStartingVariableName = /^[a-zA-Z_]/;
    const isVariableChar = /[a-zA-Z_0-9]/;
    let i = 0;
    let argumentName = null;
    let argumentType = null;
    while (i < source.length) {
      const char = source[i];
      const nextChar = source[i + 1];
      const state = states.length > 0 ? states[states.length - 1] : null;

      // begin MULTI_LINE_COMMENT handling
      if (state === 'FUNCTION_ARGUMENTS' && char === '/' && nextChar === '*') {
        states.push('MULTI_LINE_COMMENT');
        i += 2;
        continue;
      } else if (state === 'MULTI_LINE_COMMENT' && char === '*' && nextChar === '/') {
        states.pop();
        i += 2;
        continue;
      }
      // end MULTI_LINE_COMMENT handling

      // begin COMMENT handling
      else if (state === 'FUNCTION_ARGUMENTS' && char === '/' && nextChar === '/') {
        states.push('COMMENT');
        i += 2;
        continue;
      } else if (state === 'COMMENT' && char === '\n') {
        states.pop();
        i++;
        continue;
      }
      // end COMMENT handling

      // being FUNCTION_ARGUMENTS handling
      else if (state === null && char === '(') {
        states.push('FUNCTION_ARGUMENTS');
        i++;
        continue;
      } else if (state === 'FUNCTION_ARGUMENTS') {
        if (char === ')') {
          states.pop();
          break;
        }
        if (char === 'f' && nextChar === 'l' && source[i + 2] === 'o' && source[i + 3] === 'a' && source[i + 4] === 't' && source[i + 5] === ' ') {
          states.push('DECLARE_VARIABLE');
          argumentType = 'float';
          argumentName = '';
          i += 6;
          continue;
        } else if (char === 'i' && nextChar === 'n' && source[i + 2] === 't' && source[i + 3] === ' ') {
          states.push('DECLARE_VARIABLE');
          argumentType = 'int';
          argumentName = '';
          i += 4;
          continue;
        } else if (char === 'v' && nextChar === 'e' && source[i + 2] === 'c' && source[i + 3] === '2' && source[i + 4] === ' ') {
          states.push('DECLARE_VARIABLE');
          argumentType = 'vec2';
          argumentName = '';
          i += 5;
          continue;
        } else if (char === 'v' && nextChar === 'e' && source[i + 2] === 'c' && source[i + 3] === '3' && source[i + 4] === ' ') {
          states.push('DECLARE_VARIABLE');
          argumentType = 'vec3';
          argumentName = '';
          i += 5;
          continue;
        } else if (char === 'v' && nextChar === 'e' && source[i + 2] === 'c' && source[i + 3] === '4' && source[i + 4] === ' ') {
          states.push('DECLARE_VARIABLE');
          argumentType = 'vec4';
          argumentName = '';
          i += 5;
          continue;
        }
      }
      // end FUNCTION_ARGUMENTS handling

      // begin DECLARE_VARIABLE handling
      else if (state === 'DECLARE_VARIABLE') {
        if (argumentName === '') {
          if (char === ' ') {
            i++;
            continue;
          }
          if (!isStartingVariableName.test(char)) {
            throw new Error('variable name is not expected string');
          }
        }
        argumentName += char;
        if (!isVariableChar.test(nextChar)) {
          states.pop();
          argumentNames.push(argumentName);
          argumentTypes.push(typeMap[argumentType]);
        }
      }
      // end DECLARE_VARIABLE handling

      // Progress to next character
      i++;
    }
    if (states.length > 0) {
      throw new Error('GLSL function was not parsable');
    }
    return {
      argumentNames,
      argumentTypes,
    };
  }

  static nativeFunctionReturnType(source) {
    return typeMap[source.match(/int|float|vec[2-4]/)[0]];
  }

  static combineKernels(combinedKernel, lastKernel) {
    combinedKernel.apply(null, arguments);
    const {
      texSize,
      context,
      threadDim
    } = lastKernel.texSize;
    let result;
    if (lastKernel.precision === 'single') {
      const w = texSize[0];
      const h = Math.ceil(texSize[1] / 4);
      result = new Float32Array(w * h * 4 * 4);
      context.readPixels(0, 0, w, h * 4, context.RGBA, context.FLOAT, result);
    } else {
      const bytes = new Uint8Array(texSize[0] * texSize[1] * 4);
      context.readPixels(0, 0, texSize[0], texSize[1], context.RGBA, context.UNSIGNED_BYTE, bytes);
      result = new Float32Array(bytes.buffer);
    }

    result = result.subarray(0, threadDim[0] * threadDim[1] * threadDim[2]);

    if (lastKernel.output.length === 1) {
      return result;
    } else if (lastKernel.output.length === 2) {
      return utils.splitArray(result, lastKernel.output[0]);
    } else if (lastKernel.output.length === 3) {
      const cube = utils.splitArray(result, lastKernel.output[0] * lastKernel.output[1]);
      return cube.map(function(x) {
        return utils.splitArray(x, lastKernel.output[0]);
      });
    }
  }

  constructor(source, settings) {
    super(source, settings);
    this.transferValues = null;
    this.formatValues = null;
    this.TextureConstructor = null;
    this.renderOutput = null;
    this.renderRawOutput = null;
    this.texSize = null;
    this.translatedSource = null;
    this.renderStrategy = null;
    this.compiledFragmentShader = null;
    this.compiledVertexShader = null;
  }

  checkTextureSize() {
    const { features } = this.constructor;
    if (this.texSize[0] > features.maxTextureSize || this.texSize[1] > features.maxTextureSize) {
      throw new Error(`Texture size [${this.texSize[0]},${this.texSize[1]}] generated by kernel is larger than supported size [${features.maxTextureSize},${features.maxTextureSize}]`);
    }
  }

  translateSource() {
    throw new Error(`"translateSource" not defined on ${this.constructor.name}`);
  }

  /**
   * Picks a render strategy for the now finally parsed kernel
   * @param args
   * @return {null|KernelOutput}
   */
  pickRenderStrategy(args) {
    if (this.graphical) {
      this.renderRawOutput = this.readPackedPixelsToUint8Array;
      this.transferValues = (pixels) => pixels;
      this.TextureConstructor = GLTextureGraphical;
      return null;
    }
    if (this.precision === 'unsigned') {
      this.renderRawOutput = this.readPackedPixelsToUint8Array;
      this.transferValues = this.readPackedPixelsToFloat32Array;
      if (this.pipeline) {
        this.renderOutput = this.renderTexture;
        if (this.subKernels !== null) {
          this.renderKernels = this.renderKernelsToTextures;
        }
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Float':
          case 'Number':
          case 'Integer':
            if (this.output[2] > 0) {
              this.TextureConstructor = GLTextureUnsigned3D;
              this.renderStrategy = renderStrategy.PackedPixelTo3DFloat;
              return null;
            } else if (this.output[1] > 0) {
              this.TextureConstructor = GLTextureUnsigned2D;
              this.renderStrategy = renderStrategy.PackedPixelTo2DFloat;
              return null;
            } else {
              this.TextureConstructor = GLTextureUnsigned;
              this.renderStrategy = renderStrategy.PackedPixelToFloat;
              return null;
            }
            case 'Array(2)':
            case 'Array(3)':
            case 'Array(4)':
              return this.requestFallback(args);
        }
      } else {
        if (this.subKernels !== null) {
          this.renderKernels = this.renderKernelsToArrays;
        }
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Float':
          case 'Number':
          case 'Integer':
            this.renderOutput = this.renderValues;
            if (this.output[2] > 0) {
              this.TextureConstructor = GLTextureUnsigned3D;
              this.renderStrategy = renderStrategy.PackedPixelTo3DFloat;
              this.formatValues = utils.erect3DPackedFloat;
              return null;
            } else if (this.output[1] > 0) {
              this.TextureConstructor = GLTextureUnsigned2D;
              this.renderStrategy = renderStrategy.PackedPixelTo2DFloat;
              this.formatValues = utils.erect2DPackedFloat;
              return null;
            } else {
              this.TextureConstructor = GLTextureUnsigned;
              this.renderStrategy = renderStrategy.PackedPixelToFloat;
              this.formatValues = utils.erectPackedFloat;
              return null;
            }
            case 'Array(2)':
            case 'Array(3)':
            case 'Array(4)':
              return this.requestFallback(args);
        }
      }
    } else if (this.precision === 'single') {
      this.renderRawOutput = this.readFloatPixelsToFloat32Array;
      this.transferValues = this.readFloatPixelsToFloat32Array;
      if (this.pipeline) {
        this.renderStrategy = renderStrategy.FloatTexture;
        this.renderOutput = this.renderTexture;
        if (this.subKernels !== null) {
          this.renderKernels = this.renderKernelsToTextures;
        }
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Float':
          case 'Number':
          case 'Integer':
            if (this.optimizeFloatMemory) {
              if (this.output[2] > 0) {
                this.TextureConstructor = GLTextureMemoryOptimized3D;
                return null;
              } else if (this.output[1] > 0) {
                this.TextureConstructor = GLTextureMemoryOptimized2D;
                return null;
              } else {
                this.TextureConstructor = GLTextureMemoryOptimized;
                return null;
              }
            } else {
              if (this.output[2] > 0) {
                this.TextureConstructor = GLTextureFloat3D;
                return null;
              } else if (this.output[1] > 0) {
                this.TextureConstructor = GLTextureFloat2D;
                return null;
              } else {
                this.TextureConstructor = GLTextureFloat;
                return null;
              }
            }
            case 'Array(2)':
              if (this.output[2] > 0) {
                this.TextureConstructor = GLTextureArray2Float3D;
                return null;
              } else if (this.output[1] > 0) {
                this.TextureConstructor = GLTextureArray2Float2D;
                return null;
              } else {
                this.TextureConstructor = GLTextureArray2Float;
                return null;
              }
              case 'Array(3)':
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray3Float3D;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray3Float2D;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray3Float;
                  return null;
                }
                case 'Array(4)':
                  if (this.output[2] > 0) {
                    this.TextureConstructor = GLTextureArray4Float3D;
                    return null;
                  } else if (this.output[1] > 0) {
                    this.TextureConstructor = GLTextureArray4Float2D;
                    return null;
                  } else {
                    this.TextureConstructor = GLTextureArray4Float;
                    return null;
                  }
        }
      }
      this.renderOutput = this.renderValues;
      if (this.subKernels !== null) {
        this.renderKernels = this.renderKernelsToArrays;
      }
      if (this.optimizeFloatMemory) {
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Float':
          case 'Number':
          case 'Integer':
            if (this.output[2] > 0) {
              this.TextureConstructor = GLTextureMemoryOptimized3D;
              this.renderStrategy = renderStrategy.MemoryOptimizedFloatPixelToMemoryOptimized3DFloat;
              this.formatValues = utils.erectMemoryOptimized3DFloat;
              return null;
            } else if (this.output[1] > 0) {
              this.TextureConstructor = GLTextureMemoryOptimized2D;
              this.renderStrategy = renderStrategy.MemoryOptimizedFloatPixelToMemoryOptimized2DFloat;
              this.formatValues = utils.erectMemoryOptimized2DFloat;
              return null;
            } else {
              this.TextureConstructor = GLTextureMemoryOptimized;
              this.renderStrategy = renderStrategy.MemoryOptimizedFloatPixelToMemoryOptimizedFloat;
              this.formatValues = utils.erectMemoryOptimizedFloat;
              return null;
            }
            case 'Array(2)':
              if (this.output[2] > 0) {
                this.TextureConstructor = GLTextureArray2Float3D;
                this.renderStrategy = renderStrategy.FloatPixelTo3DArray2;
                this.formatValues = utils.erect3DArray2;
                return null;
              } else if (this.output[1] > 0) {
                this.TextureConstructor = GLTextureArray2Float2D;
                this.renderStrategy = renderStrategy.FloatPixelTo2DArray2;
                this.formatValues = utils.erect2DArray2;
                return null;
              } else {
                this.TextureConstructor = GLTextureArray2Float;
                this.renderStrategy = renderStrategy.FloatPixelToArray2;
                this.formatValues = utils.erectArray2;
                return null;
              }
              case 'Array(3)':
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray3Float3D;
                  this.renderStrategy = renderStrategy.FloatPixelTo3DArray3;
                  this.formatValues = utils.erect3DArray3;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray3Float2D;
                  this.renderStrategy = renderStrategy.FloatPixelTo2DArray3;
                  this.formatValues = utils.erect2DArray3;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray3Float;
                  this.renderStrategy = renderStrategy.FloatPixelToArray3;
                  this.formatValues = utils.erectArray3;
                  return null;
                }
                case 'Array(4)':
                  if (this.output[2] > 0) {
                    this.TextureConstructor = GLTextureArray4Float3D;
                    this.renderStrategy = renderStrategy.FloatPixelTo3DArray4;
                    this.formatValues = utils.erect3DArray4;
                    return null;
                  } else if (this.output[1] > 0) {
                    this.TextureConstructor = GLTextureArray4Float2D;
                    this.renderStrategy = renderStrategy.FloatPixelTo2DArray4;
                    this.formatValues = utils.erect2DArray4;
                    return null;
                  } else {
                    this.TextureConstructor = GLTextureArray4Float;
                    this.renderStrategy = renderStrategy.FloatPixelToArray4;
                    this.formatValues = utils.erectArray4;
                    return null;
                  }
        }
      } else {
        switch (this.returnType) {
          case 'LiteralInteger':
          case 'Float':
          case 'Number':
          case 'Integer':
            if (this.output[2] > 0) {
              this.TextureConstructor = GLTextureFloat3D;
              this.renderStrategy = renderStrategy.FloatPixelTo3DFloat;
              this.formatValues = utils.erect3DFloat;
              return null;
            } else if (this.output[1] > 0) {
              this.TextureConstructor = GLTextureFloat2D;
              this.renderStrategy = renderStrategy.FloatPixelTo2DFloat;
              this.formatValues = utils.erect2DFloat;
              return null;
            } else {
              this.TextureConstructor = GLTextureFloat;
              this.renderStrategy = renderStrategy.FloatPixelToFloat;
              this.formatValues = utils.erectFloat;
              return null;
            }
            case 'Array(2)':
              if (this.output[2] > 0) {
                this.TextureConstructor = GLTextureArray2Float3D;
                this.renderStrategy = renderStrategy.FloatPixelTo3DArray2;
                this.formatValues = utils.erect3DArray2;
                return null;
              } else if (this.output[1] > 0) {
                this.TextureConstructor = GLTextureArray2Float2D;
                this.renderStrategy = renderStrategy.FloatPixelTo2DArray2;
                this.formatValues = utils.erect2DArray2;
                return null;
              } else {
                this.TextureConstructor = GLTextureArray2Float;
                this.renderStrategy = renderStrategy.FloatPixelToArray2;
                this.formatValues = utils.erectArray2;
                return null;
              }
              case 'Array(3)':
                if (this.output[2] > 0) {
                  this.TextureConstructor = GLTextureArray3Float3D;
                  this.renderStrategy = renderStrategy.FloatPixelTo3DArray3;
                  this.formatValues = utils.erect3DArray3;
                  return null;
                } else if (this.output[1] > 0) {
                  this.TextureConstructor = GLTextureArray3Float2D;
                  this.renderStrategy = renderStrategy.FloatPixelTo2DArray3;
                  this.formatValues = utils.erect2DArray3;
                  return null;
                } else {
                  this.TextureConstructor = GLTextureArray3Float;
                  this.renderStrategy = renderStrategy.FloatPixelToArray3;
                  this.formatValues = utils.erectArray3;
                  return null;
                }
                case 'Array(4)':
                  if (this.output[2] > 0) {
                    this.TextureConstructor = GLTextureArray4Float3D;
                    this.renderStrategy = renderStrategy.FloatPixelTo3DArray4;
                    this.formatValues = utils.erect3DArray4;
                    return null;
                  } else if (this.output[1] > 0) {
                    this.TextureConstructor = GLTextureArray4Float2D;
                    this.renderStrategy = renderStrategy.FloatPixelTo2DArray4;
                    this.formatValues = utils.erect2DArray4;
                    return null;
                  } else {
                    this.TextureConstructor = GLTextureArray4Float;
                    this.renderStrategy = renderStrategy.FloatPixelToArray4;
                    this.formatValues = utils.erectArray4;
                    return null;
                  }
        }
      }
    } else {
      throw new Error(`unhandled precision of "${this.precision}"`);
    }

    throw new Error(`unhandled return type "${this.returnType}"`);
  }

  /**
   * @abstract
   * @returns String
   */
  getKernelString() {
    throw new Error(`abstract method call`);
  }

  getMainResultTexture() {
    switch (this.returnType) {
      case 'LiteralInteger':
      case 'Float':
      case 'Integer':
      case 'Number':
        return this.getMainResultNumberTexture();
      case 'Array(2)':
        return this.getMainResultArray2Texture();
      case 'Array(3)':
        return this.getMainResultArray3Texture();
      case 'Array(4)':
        return this.getMainResultArray4Texture();
      default:
        throw new Error(`unhandled returnType type ${ this.returnType }`);
    }
  }

  /**
   * @abstract
   * @returns String[]
   */
  getMainResultKernelNumberTexture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultSubKernelNumberTexture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultKernelArray2Texture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultSubKernelArray2Texture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultKernelArray3Texture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultSubKernelArray3Texture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultKernelArray4Texture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultSubKernelArray4Texture() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultGraphical() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultMemoryOptimizedFloats() {
    throw new Error(`abstract method call`);
  }
  /**
   * @abstract
   * @returns String[]
   */
  getMainResultPackedPixels() {
    throw new Error(`abstract method call`);
  }

  getMainResultString() {
    if (this.graphical) {
      return this.getMainResultGraphical();
    } else if (this.precision === 'single') {
      if (this.optimizeFloatMemory) {
        return this.getMainResultMemoryOptimizedFloats();
      }
      return this.getMainResultTexture();
    } else {
      return this.getMainResultPackedPixels();
    }
  }

  getMainResultNumberTexture() {
    return utils.linesToString(this.getMainResultKernelNumberTexture()) +
      utils.linesToString(this.getMainResultSubKernelNumberTexture());
  }

  getMainResultArray2Texture() {
    return utils.linesToString(this.getMainResultKernelArray2Texture()) +
      utils.linesToString(this.getMainResultSubKernelArray2Texture());
  }

  getMainResultArray3Texture() {
    return utils.linesToString(this.getMainResultKernelArray3Texture()) +
      utils.linesToString(this.getMainResultSubKernelArray3Texture());
  }

  getMainResultArray4Texture() {
    return utils.linesToString(this.getMainResultKernelArray4Texture()) +
      utils.linesToString(this.getMainResultSubKernelArray4Texture());
  }

  /**
   *
   * @return {string}
   */
  getFloatTacticDeclaration() {
    switch (this.tactic) {
      case 'speed':
        return 'precision lowp float;\n';
      case 'performance':
        return 'precision highp float;\n';
      case 'balanced':
      default:
        return 'precision mediump float;\n';
    }
  }

  /**
   *
   * @return {string}
   */
  getIntTacticDeclaration() {
    switch (this.tactic) {
      case 'speed':
        return 'precision lowp int;\n';
      case 'performance':
        return 'precision highp int;\n';
      case 'balanced':
      default:
        return 'precision mediump int;\n';
    }
  }

  /**
   *
   * @return {string}
   */
  getSampler2DTacticDeclaration() {
    switch (this.tactic) {
      case 'speed':
        return 'precision lowp sampler2D;\n';
      case 'performance':
        return 'precision highp sampler2D;\n';
      case 'balanced':
      default:
        return 'precision mediump sampler2D;\n';
    }
  }

  getSampler2DArrayTacticDeclaration() {
    switch (this.tactic) {
      case 'speed':
        return 'precision lowp sampler2DArray;\n';
      case 'performance':
        return 'precision highp sampler2DArray;\n';
      case 'balanced':
      default:
        return 'precision mediump sampler2DArray;\n';
    }
  }

  renderTexture() {
    return new this.TextureConstructor({
      texture: this.outputTexture,
      size: this.texSize,
      dimensions: this.threadDim,
      output: this.output,
      context: this.context,
      kernel: this,
    });
  }
  readPackedPixelsToUint8Array() {
    if (this.precision !== 'unsigned') throw new Error('Requires this.precision to be "unsigned"');
    const {
      texSize,
      context: gl
    } = this;
    const result = new Uint8Array(texSize[0] * texSize[1] * 4);
    gl.readPixels(0, 0, texSize[0], texSize[1], gl.RGBA, gl.UNSIGNED_BYTE, result);
    return result;
  }

  readPackedPixelsToFloat32Array() {
    return new Float32Array(this.readPackedPixelsToUint8Array().buffer);
  }

  readFloatPixelsToFloat32Array() {
    if (this.precision !== 'single') throw new Error('Requires this.precision to be "single"');
    const {
      texSize,
      context: gl
    } = this;
    const w = texSize[0];
    const h = texSize[1];
    const result = new Float32Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, result);
    return result;
  }

  /**
   *
   * @param {Boolean} [flip]
   * @return {Uint8ClampedArray}
   */
  getPixels(flip) {
    const {
      context: gl,
      output
    } = this;
    const [width, height] = output;
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    // flipped by default, so invert
    return new Uint8ClampedArray((flip ? pixels : utils.flipPixels(pixels, width, height)).buffer);
  }

  renderKernelsToArrays() {
    const result = {
      result: this.renderOutput(),
    };
    for (let i = 0; i < this.subKernels.length; i++) {
      result[this.subKernels[i].property] = new this.TextureConstructor({
        texture: this.subKernelOutputTextures[i],
        size: this.texSize,
        dimensions: this.threadDim,
        output: this.output,
        context: this.context,
      }).toArray();
    }
    return result;
  }

  renderKernelsToTextures() {
    const result = {
      result: this.renderOutput(),
    };
    for (let i = 0; i < this.subKernels.length; i++) {
      result[this.subKernels[i].property] = new this.TextureConstructor({
        texture: this.subKernelOutputTextures[i],
        size: this.texSize,
        dimensions: this.threadDim,
        output: this.output,
        context: this.context,
      });
    }
    return result;
  }

  setOutput(output) {
    super.setOutput(output);
    if (this.program) {
      this.threadDim = [this.output[0], this.output[1] || 1, this.output[2] || 1];
      this.texSize = utils.getKernelTextureSize({
        optimizeFloatMemory: this.optimizeFloatMemory,
        precision: this.precision,
      }, this.output);
      const { context: gl } = this;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      this.updateMaxTexSize();
      this.framebuffer.width = this.texSize[0];
      this.framebuffer.height = this.texSize[1];
      this.context.viewport(0, 0, this.maxTexSize[0], this.maxTexSize[1]);
      this.canvas.width = this.maxTexSize[0];
      this.canvas.height = this.maxTexSize[1];
      this._setupOutputTexture();
      if (this.subKernels && this.subKernels.length > 0) {
        this._setupSubOutputTextures();
      }
    }
    return this;
  }
  renderValues() {
    return this.formatValues(
      this.transferValues(),
      this.output[0],
      this.output[1],
      this.output[2]
    );
  }
}

const renderStrategy = Object.freeze({
  PackedPixelToUint8Array: Symbol('PackedPixelToUint8Array'),
  PackedPixelToFloat: Symbol('PackedPixelToFloat'),
  PackedPixelTo2DFloat: Symbol('PackedPixelTo2DFloat'),
  PackedPixelTo3DFloat: Symbol('PackedPixelTo3DFloat'),
  PackedTexture: Symbol('PackedTexture'),
  FloatPixelToFloat32Array: Symbol('FloatPixelToFloat32Array'),
  FloatPixelToFloat: Symbol('FloatPixelToFloat'),
  FloatPixelTo2DFloat: Symbol('FloatPixelTo2DFloat'),
  FloatPixelTo3DFloat: Symbol('FloatPixelTo3DFloat'),
  FloatPixelToArray2: Symbol('FloatPixelToArray2'),
  FloatPixelTo2DArray2: Symbol('FloatPixelTo2DArray2'),
  FloatPixelTo3DArray2: Symbol('FloatPixelTo3DArray2'),
  FloatPixelToArray3: Symbol('FloatPixelToArray3'),
  FloatPixelTo2DArray3: Symbol('FloatPixelTo2DArray3'),
  FloatPixelTo3DArray3: Symbol('FloatPixelTo3DArray3'),
  FloatPixelToArray4: Symbol('FloatPixelToArray4'),
  FloatPixelTo2DArray4: Symbol('FloatPixelTo2DArray4'),
  FloatPixelTo3DArray4: Symbol('FloatPixelTo3DArray4'),
  FloatTexture: Symbol('FloatTexture'),
  MemoryOptimizedFloatPixelToMemoryOptimizedFloat: Symbol('MemoryOptimizedFloatPixelToFloat'),
  MemoryOptimizedFloatPixelToMemoryOptimized2DFloat: Symbol('MemoryOptimizedFloatPixelTo2DFloat'),
  MemoryOptimizedFloatPixelToMemoryOptimized3DFloat: Symbol('MemoryOptimizedFloatPixelTo3DFloat'),
});

const typeMap = {
  int: 'Integer',
  float: 'Number',
  vec2: 'Array(2)',
  vec3: 'Array(3)',
  vec4: 'Array(4)',
};

module.exports = {
  GLKernel,
  renderStrategy
};
},{"../../utils":150,"../kernel":74,"./texture/array-2-float":55,"./texture/array-2-float-2d":53,"./texture/array-2-float-3d":54,"./texture/array-3-float":58,"./texture/array-3-float-2d":56,"./texture/array-3-float-3d":57,"./texture/array-4-float":61,"./texture/array-4-float-2d":59,"./texture/array-4-float-3d":60,"./texture/float":64,"./texture/float-2d":62,"./texture/float-3d":63,"./texture/graphical":65,"./texture/memory-optimized":68,"./texture/memory-optimized-2d":66,"./texture/memory-optimized-3d":67,"./texture/unsigned":71,"./texture/unsigned-2d":69,"./texture/unsigned-3d":70}],53:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray2Float2D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(2)';
  }
  toArray() {
    return utils.erect2DArray2(this.renderValues(), this.output[0], this.output[1]);
  }
}

module.exports = {
  GLTextureArray2Float2D
};
},{"../../../utils":150,"./float":64}],54:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray2Float3D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(2)';
  }
  toArray() {
    return utils.erect3DArray2(this.renderValues(), this.output[0], this.output[1], this.output[2]);
  }
}

module.exports = {
  GLTextureArray2Float3D
};
},{"../../../utils":150,"./float":64}],55:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray2Float extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(2)';
  }
  toArray() {
    return utils.erectArray2(this.renderValues(), this.output[0], this.output[1]);
  }
}

module.exports = {
  GLTextureArray2Float
};
},{"../../../utils":150,"./float":64}],56:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray3Float2D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(3)';
  }
  toArray() {
    return utils.erect2DArray3(this.renderValues(), this.output[0], this.output[1]);
  }
}

module.exports = {
  GLTextureArray3Float2D
};
},{"../../../utils":150,"./float":64}],57:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray3Float3D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(3)';
  }
  toArray() {
    return utils.erect3DArray3(this.renderValues(), this.output[0], this.output[1], this.output[2]);
  }
}

module.exports = {
  GLTextureArray3Float3D
};
},{"../../../utils":150,"./float":64}],58:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray3Float extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(3)';
  }
  toArray() {
    return utils.erectArray3(this.renderValues(), this.output[0]);
  }
}

module.exports = {
  GLTextureArray3Float
};
},{"../../../utils":150,"./float":64}],59:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray4Float2D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(4)';
  }
  toArray() {
    return utils.erect2DArray4(this.renderValues(), this.output[0], this.output[1]);
  }
}

module.exports = {
  GLTextureArray4Float2D
};
},{"../../../utils":150,"./float":64}],60:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray4Float3D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(4)';
  }
  toArray() {
    return utils.erect3DArray4(this.renderValues(), this.output[0], this.output[1], this.output[2]);
  }
}

module.exports = {
  GLTextureArray4Float3D
};
},{"../../../utils":150,"./float":64}],61:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureArray4Float extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(4)';
  }
  toArray() {
    return utils.erectArray4(this.renderValues(), this.output[0]);
  }
}

module.exports = {
  GLTextureArray4Float
};
},{"../../../utils":150,"./float":64}],62:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureFloat2D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(1)';
  }
  toArray() {
    return utils.erect2DFloat(this.renderValues(), this.output[0], this.output[1]);
  }
}

module.exports = {
  GLTextureFloat2D
};
},{"../../../utils":150,"./float":64}],63:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureFloat3D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(1)';
  }
  toArray() {
    return utils.erect3DFloat(this.renderValues(), this.output[0], this.output[1], this.output[2]);
  }
}

module.exports = {
  GLTextureFloat3D
};
},{"../../../utils":150,"./float":64}],64:[function(require,module,exports){
const { utils } = require('../../../utils');
const { Texture } = require('../../../texture');

class GLTextureFloat extends Texture {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(1)';
  }
  renderRawOutput() {
    const { context: gl } = this;
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );
    const result = new Float32Array(this.size[0] * this.size[1] * 4);
    gl.readPixels(0, 0, this.size[0], this.size[1], gl.RGBA, gl.FLOAT, result);
    return result;
  }
  renderValues() {
    return this.renderRawOutput();
  }
  toArray() {
    return utils.erectFloat(this.renderValues(), this.output[0]);
  }
}

module.exports = {
  GLTextureFloat
};
},{"../../../texture":149,"../../../utils":150}],65:[function(require,module,exports){
const { GLTextureUnsigned } = require('./unsigned');

class GLTextureGraphical extends GLTextureUnsigned {
  constructor(settings) {
    super(settings);
    this.type = 'ArrayTexture(4)';
  }
  toArray() {
    return this.renderValues();
  }
}

module.exports = {
  GLTextureGraphical
};
},{"./unsigned":71}],66:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureMemoryOptimized2D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'MemoryOptimizedNumberTexture';
  }
  toArray() {
    return utils.erectMemoryOptimized2DFloat(this.renderValues(), this.output[0], this.output[1]);
  }
}

module.exports = {
  GLTextureMemoryOptimized2D
};
},{"../../../utils":150,"./float":64}],67:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureMemoryOptimized3D extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'MemoryOptimizedNumberTexture';
  }
  toArray() {
    return utils.erectMemoryOptimized3DFloat(this.renderValues(), this.output[0], this.output[1], this.output[2]);
  }
}

module.exports = {
  GLTextureMemoryOptimized3D
};
},{"../../../utils":150,"./float":64}],68:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureFloat } = require('./float');

class GLTextureMemoryOptimized extends GLTextureFloat {
  constructor(settings) {
    super(settings);
    this.type = 'MemoryOptimizedNumberTexture';
  }
  toArray() {
    return utils.erectMemoryOptimizedFloat(this.renderValues(), this.output[0]);
  }
}

module.exports = {
  GLTextureMemoryOptimized
};
},{"../../../utils":150,"./float":64}],69:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureUnsigned } = require('./unsigned');

class GLTextureUnsigned2D extends GLTextureUnsigned {
  constructor(settings) {
    super(settings);
    this.type = 'NumberTexture';
  }
  toArray() {
    return utils.erect2DPackedFloat(this.renderValues(), this.output[0], this.output[1]);
  }
}

module.exports = {
  GLTextureUnsigned2D
};
},{"../../../utils":150,"./unsigned":71}],70:[function(require,module,exports){
const { utils } = require('../../../utils');
const { GLTextureUnsigned } = require('./unsigned');

class GLTextureUnsigned3D extends GLTextureUnsigned {
  constructor(settings) {
    super(settings);
    this.type = 'NumberTexture';
  }
  toArray() {
    return utils.erect3DPackedFloat(this.renderValues(), this.output[0], this.output[1], this.output[2]);
  }
}

module.exports = {
  GLTextureUnsigned3D
};
},{"../../../utils":150,"./unsigned":71}],71:[function(require,module,exports){
const { utils } = require('../../../utils');
const { Texture } = require('../../../texture');

class GLTextureUnsigned extends Texture {
  constructor(settings) {
    super(settings);
    this.type = 'NumberTexture';
  }
  renderRawOutput() {
    const { context: gl } = this;
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.texture,
      0
    );
    const result = new Uint8Array(this.size[0] * this.size[1] * 4);
    gl.readPixels(0, 0, this.size[0], this.size[1], gl.RGBA, gl.UNSIGNED_BYTE, result);
    return result;
  }
  renderValues() {
    return new Float32Array(this.renderRawOutput().buffer);
  }
  toArray() {
    return utils.erectPackedFloat(this.renderValues(), this.output[0]);
  }
}

module.exports = {
  GLTextureUnsigned
};
},{"../../../texture":149,"../../../utils":150}],72:[function(require,module,exports){
const getContext = require('gl');
const { WebGLKernel } = require('../web-gl/kernel');
const { glKernelString } = require('../gl/kernel-string');

let isSupported = null;
let testCanvas = null;
let testContext = null;
let testExtensions = null;
let features = null;

class HeadlessGLKernel extends WebGLKernel {
  static get isSupported() {
    if (isSupported !== null) return isSupported;
    this.setupFeatureChecks();
    isSupported = testContext !== null;
    return isSupported;
  }

  static setupFeatureChecks() {
    testCanvas = null;
    testExtensions = null;
    if (typeof getContext !== 'function') return;
    try { // just in case, edge cases
      testContext = getContext(2, 2, {
        preserveDrawingBuffer: true
      });
      if (!testContext || !testContext.getExtension) return;
      testExtensions = {
        STACKGL_resize_drawingbuffer: testContext.getExtension('STACKGL_resize_drawingbuffer'),
        STACKGL_destroy_context: testContext.getExtension('STACKGL_destroy_context'),
        OES_texture_float: testContext.getExtension('OES_texture_float'),
        OES_texture_float_linear: testContext.getExtension('OES_texture_float_linear'),
        OES_element_index_uint: testContext.getExtension('OES_element_index_uint'),
        WEBGL_draw_buffers: testContext.getExtension('WEBGL_draw_buffers'),
      };
      features = this.getFeatures();
    } catch (e) {
      console.warn(e);
    }
  }

  static isContextMatch(context) {
    try {
      return context.getParameter(context.RENDERER) === 'ANGLE';
    } catch (e) {
      return false;
    }
  }

  static getFeatures() {
    const isDrawBuffers = this.getIsDrawBuffers();
    return Object.freeze({
      isFloatRead: this.getIsFloatRead(),
      isIntegerDivisionAccurate: this.getIsIntegerDivisionAccurate(),
      isTextureFloat: this.getIsTextureFloat(),
      isDrawBuffers,
      kernelMap: isDrawBuffers,
      channelCount: this.getChannelCount(),
      maxTextureSize: this.getMaxTextureSize(),
    });
  }

  static getIsTextureFloat() {
    return Boolean(testExtensions.OES_texture_float);
  }

  static getIsDrawBuffers() {
    return Boolean(testExtensions.WEBGL_draw_buffers);
  }

  static getChannelCount() {
    return testExtensions.WEBGL_draw_buffers ?
      testContext.getParameter(testExtensions.WEBGL_draw_buffers.MAX_DRAW_BUFFERS_WEBGL) :
      1;
  }

  static getMaxTextureSize() {
    return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
  }

  static get testCanvas() {
    return testCanvas;
  }

  static get testContext() {
    return testContext;
  }

  static get features() {
    return features;
  }

  initCanvas() {
    return {};
  }

  initContext() {
    return getContext(2, 2, {
      preserveDrawingBuffer: true
    });
  }

  initExtensions() {
    this.extensions = {
      STACKGL_resize_drawingbuffer: this.context.getExtension('STACKGL_resize_drawingbuffer'),
      STACKGL_destroy_context: this.context.getExtension('STACKGL_destroy_context'),
      OES_texture_float: this.context.getExtension('OES_texture_float'),
      OES_texture_float_linear: this.context.getExtension('OES_texture_float_linear'),
      OES_element_index_uint: this.context.getExtension('OES_element_index_uint'),
      WEBGL_draw_buffers: this.context.getExtension('WEBGL_draw_buffers'),
    };
  }

  build() {
    super.build.apply(this, arguments);
    if (!this.fallbackRequested) {
      this.extensions.STACKGL_resize_drawingbuffer.resize(this.maxTexSize[0], this.maxTexSize[1]);
    }
  }

  destroyExtensions() {
    this.extensions.STACKGL_resize_drawingbuffer = null;
    this.extensions.STACKGL_destroy_context = null;
    this.extensions.OES_texture_float = null;
    this.extensions.OES_texture_float_linear = null;
    this.extensions.OES_element_index_uint = null;
    this.extensions.WEBGL_draw_buffers = null;
  }

  static destroyContext(context) {
    const extension = context.getExtension('STACKGL_destroy_context');
    if (extension && extension.destroy) {
      extension.destroy();
    }
  }

  /**
   * @desc Returns the *pre-compiled* Kernel as a JS Object String, that can be reused.
   */
  toString() {
    const setupContextString = `const gl = context || require('gl')(1, 1);\n`;
    const destroyContextString = `    if (!context) { gl.getExtension('STACKGL_destroy_context').destroy(); }\n`;
    return glKernelString(this.constructor, arguments, this, setupContextString, destroyContextString);
  }

  setOutput(output) {
    super.setOutput(output);
    if (this.graphical && this.extensions.STACKGL_resize_drawingbuffer) {
      this.extensions.STACKGL_resize_drawingbuffer.resize(this.maxTexSize[0], this.maxTexSize[1]);
    }
    return this;
  }
}

module.exports = {
  HeadlessGLKernel
};
},{"../gl/kernel-string":51,"../web-gl/kernel":107,"gl":8}],73:[function(require,module,exports){
/**
 * @class KernelValue
 */
class KernelValue {
  /**
   * @param {KernelVariable} value
   * @param {IKernelValueSettings} settings
   */
  constructor(value, settings) {
    const {
      name,
      kernel,
      context,
      checkContext,
      onRequestContextHandle,
      onUpdateValueMismatch,
      origin,
      strictIntegers,
      type,
      tactic,
    } = settings;
    if (!name) {
      throw new Error('name not set');
    }
    if (!type) {
      throw new Error('type not set');
    }
    if (!origin) {
      throw new Error('origin not set');
    }
    if (!tactic) {
      throw new Error('tactic not set');
    }
    if (origin !== 'user' && origin !== 'constants') {
      throw new Error(`origin must be "user" or "constants" value is "${ origin }"`);
    }
    if (!onRequestContextHandle) {
      throw new Error('onRequestContextHandle is not set');
    }
    this.name = name;
    this.origin = origin;
    this.tactic = tactic;
    this.id = `${this.origin}_${name}`;
    this.varName = origin === 'constants' ? `constants.${name}` : name;
    this.kernel = kernel;
    this.strictIntegers = strictIntegers;
    // handle textures
    this.type = value.type || type;
    this.size = value.size || null;
    this.index = null;
    this.context = context;
    this.checkContext = checkContext !== null && checkContext !== undefined ? checkContext : true;
    this.contextHandle = null;
    this.onRequestContextHandle = onRequestContextHandle;
    this.onUpdateValueMismatch = onUpdateValueMismatch;
    this.forceUploadEachRun = null;
  }

  getSource() {
    throw new Error(`"getSource" not defined on ${ this.constructor.name }`);
  }

  updateValue(value) {
    throw new Error(`"updateValue" not defined on ${ this.constructor.name }`);
  }
}

module.exports = {
  KernelValue
};
},{}],74:[function(require,module,exports){
const { utils } = require('../utils');
const { Input } = require('../input');

class Kernel {
  /**
   * @type {Boolean}
   */
  static get isSupported() {
    throw new Error(`"isSupported" not implemented on ${ this.name }`);
  }

  /**
   * @type {Boolean}
   */
  static isContextMatch(context) {
    throw new Error(`"isContextMatch" not implemented on ${ this.name }`);
  }

  /**
   * @type {IKernelFeatures}
   * Used internally to populate the kernel.feature, which is a getter for the output of this value
   */
  static getFeatures() {
    throw new Error(`"getFeatures" not implemented on ${ this.name }`);
  }

  static destroyContext(context) {
    throw new Error(`"destroyContext" called on ${ this.name }`);
  }

  static nativeFunctionArguments() {
    throw new Error(`"nativeFunctionArguments" called on ${ this.name }`);
  }

  static nativeFunctionReturnType() {
    throw new Error(`"nativeFunctionReturnType" called on ${ this.name }`);
  }

  static combineKernels() {
    throw new Error(`"combineKernels" called on ${ this.name }`);
  }

  /**
   *
   * @param {string|IJSON} source
   * @param [settings]
   */
  constructor(source, settings) {
    if (typeof source !== 'object') {
      if (typeof source !== 'string') {
        throw new Error('source not a string');
      }
      if (!utils.isFunctionString(source)) {
        throw new Error('source not a function string');
      }
    }
    this.useLegacyEncoder = false;
    this.fallbackRequested = false;
    this.onRequestFallback = null;

    /**
     * Name of the arguments found from parsing source argument
     * @type {String[]}
     */
    this.argumentNames = typeof source === 'string' ? utils.getArgumentNamesFromString(source) : null;
    this.argumentTypes = null;
    this.argumentSizes = null;
    this.argumentBitRatios = null;
    this.kernelArguments = null;
    this.kernelConstants = null;
    this.forceUploadKernelConstants = null;


    /**
     * The function source
     * @type {String|IJSON}
     */
    this.source = source;

    /**
     * The size of the kernel's output
     * @type {Number[]}
     */
    this.output = null;

    /**
     * Debug mode
     * @type {Boolean}
     */
    this.debug = false;

    /**
     * Graphical mode
     * @type {Boolean}
     */
    this.graphical = false;

    /**
     * Maximum loops when using argument values to prevent infinity
     * @type {Number}
     */
    this.loopMaxIterations = 0;

    /**
     * Constants used in kernel via `this.constants`
     * @type {Object}
     */
    this.constants = null;
    this.constantTypes = null;
    this.constantBitRatios = null;
    this.dynamicArguments = false;
    this.dynamicOutput = false;

    /**
     *
     * @type {Object}
     */
    this.canvas = null;

    /**
     *
     * @type {Object}
     */
    this.context = null;

    /**
     *
     * @type {Boolean}
     */
    this.checkContext = null;

    /**
     *
     * @type {GPU}
     */
    this.gpu = null;

    /**
     *
     * @type {IGPUFunction[]}
     */
    this.functions = null;

    /**
     *
     * @type {IGPUNativeFunction[]}
     */
    this.nativeFunctions = null;

    /**
     *
     * @type {String}
     */
    this.injectedNative = null;

    /**
     *
     * @type {ISubKernel[]}
     */
    this.subKernels = null;

    /**
     *
     * @type {Boolean}
     */
    this.validate = true;

    /**
     * Enforces kernel to write to a new array or texture on run
     * @type {Boolean}
     */
    this.immutable = false;

    /**
     * Enforces kernel to write to a texture on run
     * @type {Boolean}
     */
    this.pipeline = false;

    /**
     * Make GPU use single precison or unsigned.  Acceptable values: 'single' or 'unsigned'
     * @type {String|null}
     * @enum 'single' | 'unsigned'
     */
    this.precision = null;

    /**
     *
     * @type {String|null}
     * @enum 'speed' | 'balanced' | 'precision'
     */
    this.tactic = 'balanced';

    this.plugins = null;

    this.returnType = null;
    this.leadingReturnStatement = null;
    this.followingReturnStatement = null;
    this.optimizeFloatMemory = null;
    this.strictIntegers = false;
    this.fixIntegerDivisionAccuracy = null;
    this.warnVarUsage = true;
  }

  /**
   *
   * @param {IDirectKernelSettings|IJSONSettings} settings
   */
  mergeSettings(settings) {
    for (let p in settings) {
      if (!settings.hasOwnProperty(p) || !this.hasOwnProperty(p)) continue;
      switch (p) {
        case 'output':
          if (!Array.isArray(settings.output)) {
            this.setOutput(settings.output); // Flatten output object
            continue;
          }
          break;
        case 'functions':
          if (typeof settings.functions[0] === 'function') {
            this.functions = settings.functions.map(source => utils.functionToIFunction(source));
            continue;
          }
          break;
        case 'graphical':
          if (settings[p] && !settings.hasOwnProperty('precision')) {
            this.precision = 'unsigned';
          }
          this[p] = settings[p];
          continue;
      }
      this[p] = settings[p];
    }

    if (!this.canvas) this.canvas = this.initCanvas();
    if (!this.context) this.context = this.initContext();
    if (!this.plugins) this.plugins = this.initPlugins(settings);
  }
  /**
   * @desc Builds the Kernel, by compiling Fragment and Vertical Shaders,
   * and instantiates the program.
   * @abstract
   */
  build() {
    throw new Error(`"build" not defined on ${ this.constructor.name }`);
  }

  /**
   * @desc Run the kernel program, and send the output to renderOutput
   * <p> This method calls a helper method *renderOutput* to return the result. </p>
   * @returns {Float32Array|Float32Array[]|Float32Array[][]|void} Result The final output of the program, as float, and as Textures for reuse.
   * @abstract
   */
  run() {
    throw new Error(`"run" not defined on ${ this.constructor.name }`)
  }

  /**
   * @abstract
   * @return {Object}
   */
  initCanvas() {
    throw new Error(`"initCanvas" not defined on ${ this.constructor.name }`);
  }

  /**
   * @abstract
   * @return {Object}
   */
  initContext() {
    throw new Error(`"initContext" not defined on ${ this.constructor.name }`);
  }

  /**
   * @param {IDirectKernelSettings} settings
   * @return {string[]};
   * @abstract
   */
  initPlugins(settings) {
    throw new Error(`"initPlugins" not defined on ${ this.constructor.name }`);
  }

  /**
   * @desc Setup the parameter types for the parameters
   * supplied to the Kernel function
   *
   * @param {IArguments} args - The actual parameters sent to the Kernel
   */
  setupArguments(args) {
    this.kernelArguments = [];
    if (!this.argumentTypes) {
      if (!this.argumentTypes) {
        this.argumentTypes = [];
        for (let i = 0; i < args.length; i++) {
          const argType = utils.getVariableType(args[i], this.strictIntegers);
          const type = argType === 'Integer' ? 'Number' : argType;
          this.argumentTypes.push(type);
          this.kernelArguments.push({
            type
          });
        }
      }
    } else {
      for (let i = 0; i < this.argumentTypes.length; i++) {
        this.kernelArguments.push({
          type: this.argumentTypes[i]
        });
      }
    }

    // setup sizes
    this.argumentSizes = new Array(args.length);
    this.argumentBitRatios = new Int32Array(args.length);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      this.argumentSizes[i] = arg.constructor === Input ? arg.size : null;
      this.argumentBitRatios[i] = this.getBitRatio(arg);
    }

    if (this.argumentNames.length !== args.length) {
      throw new Error(`arguments are miss-aligned`);
    }
  }

  /**
   * Setup constants
   */
  setupConstants() {
    this.kernelConstants = [];
    let needsConstantTypes = this.constantTypes === null;
    if (needsConstantTypes) {
      this.constantTypes = {};
    }
    this.constantBitRatios = {};
    if (this.constants) {
      for (let name in this.constants) {
        if (needsConstantTypes) {
          const type = utils.getVariableType(this.constants[name], this.strictIntegers);
          this.constantTypes[name] = type;
          this.kernelConstants.push({
            name,
            type
          });
        } else {
          this.kernelConstants.push({
            name,
            type: this.constantTypes[name]
          });
        }
        this.constantBitRatios[name] = this.getBitRatio(this.constants[name]);
      }
    }
  }

  /**
   *
   * @param flag
   * @return {Kernel}
   */
  setOptimizeFloatMemory(flag) {
    this.optimizeFloatMemory = flag;
    return this;
  }

  /**
   * @desc Set output dimensions of the kernel function
   * @param {Array|Object} output - The output array to set the kernel output size to
   * @return {Kernel}
   */
  setOutput(output) {
    if (output.hasOwnProperty('x')) {
      if (output.hasOwnProperty('y')) {
        if (output.hasOwnProperty('z')) {
          this.output = [output.x, output.y, output.z];
        } else {
          this.output = [output.x, output.y];
        }
      } else {
        this.output = [output.x];
      }
    } else {
      this.output = output;
    }
    return this;
  }

  /**
   * @desc Toggle debug mode
   * @param {Boolean} flag - true to enable debug
   * @return {Kernel}
   */
  setDebug(flag) {
    this.debug = flag;
    return this;
  }

  /**
   * @desc Toggle graphical output mode
   * @param {Boolean} flag - true to enable graphical output
   * @return {Kernel}
   */
  setGraphical(flag) {
    this.graphical = flag;
    this.precision = 'unsigned';
    return this;
  }

  /**
   * @desc Set the maximum number of loop iterations
   * @param {number} max - iterations count
   * @return {Kernel}
   */
  setLoopMaxIterations(max) {
    this.loopMaxIterations = max;
    return this;
  }

  /**
   * @desc Set Constants
   * @return {Kernel}
   */
  setConstants(constants) {
    this.constants = constants;
    return this;
  }

  /**
   *
   * @param {IKernelValueTypes} constantTypes
   * @return {Kernel}
   */
  setConstantTypes(constantTypes) {
    this.constantTypes = constantTypes;
    return this;
  }

  /**
   *
   * @param {IFunction[]|KernelFunction[]} functions
   * @return {Kernel}
   */
  setFunctions(functions) {
    if (typeof functions[0] === 'function') {
      this.functions = functions.map(source => utils.functionToIFunction(source));
    } else {
      this.functions = functions;
    }
    return this;
  }

  /**
   *
   * @param {IGPUNativeFunction} nativeFunctions
   * @return {Kernel}
   */
  setNativeFunctions(nativeFunctions) {
    this.nativeFunctions = nativeFunctions;
    return this;
  }

  /**
   *
   * @param {String} injectedNative
   * @return {Kernel}
   */
  setInjectedNative(injectedNative) {
    this.injectedNative = injectedNative;
    return this;
  }

  /**
   * Set writing to texture on/off
   * @param flag
   * @return {Kernel}
   */
  setPipeline(flag) {
    this.pipeline = flag;
    return this;
  }

  /**
   * Set precision to 'unsigned' or 'single'
   * @param {String} flag 'unsigned' or 'single'
   * @return {Kernel}
   */
  setPrecision(flag) {
    this.precision = flag;
    return this;
  }

  /**
   * @param flag
   * @return {Kernel}
   * @deprecated
   */
  setOutputToTexture(flag) {
    utils.warnDeprecated('method', 'setOutputToTexture', 'setPipeline');
    this.pipeline = flag;
    return this;
  }

  /**
   * Set to immutable
   * @param flag
   * @return {Kernel}
   */
  setImmutable(flag) {
    this.immutable = flag;
    return this;
  }

  /**
   * @desc Bind the canvas to kernel
   * @param {Object} canvas
   */
  setCanvas(canvas) {
    this.canvas = canvas;
    return this;
  }

  /**
   * @param {Boolean} flag
   * @return {Kernel}
   */
  setStrictIntegers(flag) {
    this.strictIntegers = flag;
    return this;
  }

  /**
   *
   * @param flag
   * @return {Kernel}
   */
  setDynamicOutput(flag) {
    this.dynamicOutput = flag;
    return this;
  }

  /**
   * @deprecated
   * @param flag
   * @return {Kernel}
   */
  setHardcodeConstants(flag) {
    utils.warnDeprecated('method', 'setHardcodeConstants');
    this.setDynamicOutput(flag);
    this.setDynamicArguments(flag);
    return this;
  }

  /**
   *
   * @param flag
   * @return {Kernel}
   */
  setDynamicArguments(flag) {
    this.dynamicArguments = flag;
    return this;
  }

  /**
   * @param {Boolean} flag
   * @return {Kernel}
   */
  setUseLegacyEncoder(flag) {
    this.useLegacyEncoder = flag;
    return this;
  }

  /**
   *
   * @param {Boolean} flag
   * @return {Kernel}
   */
  setWarnVarUsage(flag) {
    this.warnVarUsage = flag;
    return this;
  }

  /**
   * @deprecated
   * @returns {Object}
   */
  getCanvas() {
    utils.warnDeprecated('method', 'getCanvas');
    return this.canvas;
  }

  /**
   * @deprecated
   * @returns {Object}
   */
  getWebGl() {
    utils.warnDeprecated('method', 'getWebGl');
    return this.context;
  }

  /**
   * @desc Bind the webGL instance to kernel
   * @param {WebGLRenderingContext} context - webGl instance to bind
   */
  setContext(context) {
    this.context = context;
    return this;
  }

  /**
   *
   * @param {IKernelValueTypes|GPUVariableType[]} argumentTypes
   * @return {Kernel}
   */
  setArgumentTypes(argumentTypes) {
    if (Array.isArray(argumentTypes)) {
      this.argumentTypes = argumentTypes;
    } else {
      this.argumentTypes = [];
      for (const p in argumentTypes) {
        if (!argumentTypes.hasOwnProperty(p)) continue;
        const argumentIndex = this.argumentNames.indexOf(p);
        if (argumentIndex === -1) throw new Error(`unable to find argument ${ p }`);
        this.argumentTypes[argumentIndex] = argumentTypes[p];
      }
    }
    return this;
  }

  /**
   *
   * @param {Tactic} tactic
   * @return {Kernel}
   */
  setTactic(tactic) {
    this.tactic = tactic;
    return this;
  }

  requestFallback(args) {
    if (!this.onRequestFallback) {
      throw new Error(`"onRequestFallback" not defined on ${ this.constructor.name }`);
    }
    this.fallbackRequested = true;
    return this.onRequestFallback(args);
  }

  /**
   * @desc Validate settings
   * @abstract
   */
  validateSettings() {
    throw new Error(`"validateSettings" not defined on ${ this.constructor.name }`);
  }

  /**
   * @desc Add a sub kernel to the root kernel instance.
   * This is what `createKernelMap` uses.
   *
   * @param {ISubKernel} subKernel - function (as a String) of the subKernel to add
   */
  addSubKernel(subKernel) {
    if (this.subKernels === null) {
      this.subKernels = [];
    }
    if (!subKernel.source) throw new Error('subKernel missing "source" property');
    if (!subKernel.property && isNaN(subKernel.property)) throw new Error('subKernel missing "property" property');
    if (!subKernel.name) throw new Error('subKernel missing "name" property');
    this.subKernels.push(subKernel);
    return this;
  }

  /**
   * @desc Destroys all memory associated with this kernel
   * @param {Boolean} [removeCanvasReferences] remove any associated canvas references
   */
  destroy(removeCanvasReferences) {
    throw new Error(`"destroy" called on ${ this.constructor.name }`);
  }

  /**
   * bit storage ratio of source to target 'buffer', i.e. if 8bit array -> 32bit tex = 4
   * @param value
   * @returns {number}
   */
  getBitRatio(value) {
    if (this.precision === 'single') {
      // 8 and 16 are upconverted to float32
      return 4;
    } else if (Array.isArray(value[0])) {
      return this.getBitRatio(value[0]);
    } else if (value.constructor === Input) {
      return this.getBitRatio(value.value);
    }
    switch (value.constructor) {
      case Uint8ClampedArray:
      case Uint8Array:
      case Int8Array:
        return 1;
      case Uint16Array:
      case Int16Array:
        return 2;
      case Float32Array:
      case Int32Array:
      default:
        return 4;
    }
  }

  /**
   * @param {Boolean} [flip]
   * @returns {Uint8ClampedArray}
   */
  getPixels(flip) {
    throw new Error(`"getPixels" called on ${ this.constructor.name }`);
  }

  checkOutput() {
    if (!this.output || !utils.isArray(this.output)) throw new Error('kernel.output not an array');
    if (this.output.length < 1) throw new Error('kernel.output is empty, needs at least 1 value');
    for (let i = 0; i < this.output.length; i++) {
      if (isNaN(this.output[i]) || this.output[i] < 1) {
        throw new Error(`${ this.constructor.name }.output[${ i }] incorrectly defined as \`${ this.output[i] }\`, needs to be numeric, and greater than 0`);
      }
    }
  }

  /**
   * @return {IJSON}
   */
  toJSON() {
    return {
      settings: {
        output: this.output,
        pipeline: this.pipeline,
        argumentNames: this.argumentNames,
        argumentsTypes: this.argumentTypes,
        constants: this.constants,
        pluginNames: this.plugins ? this.plugins.map(plugin => plugin.name) : null,
        returnType: this.returnType,
      }
    };
  }
}

module.exports = {
  Kernel
};
},{"../input":146,"../utils":150}],75:[function(require,module,exports){
// language=GLSL
const fragmentShader = `__HEADER__;
__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;

const int LOOP_MAX = __LOOP_MAX__;

__PLUGINS__;
__CONSTANTS__;

varying vec2 vTexCoord;

vec4 round(vec4 x) {
  return floor(x + 0.5);
}

float round(float x) {
  return floor(x + 0.5);
}

const int BIT_COUNT = 32;
int modi(int x, int y) {
  return x - y * (x / y);
}

int bitwiseOr(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) || (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseXOR(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) != (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseAnd(int a, int b) {
  int result = 0;
  int n = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) && (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 && b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseNot(int a) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if (modi(a, 2) == 0) {
      result += n;    
    }
    a = a / 2;
    n = n * 2;
  }
  return result;
}
int bitwiseZeroFillLeftShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n *= 2;
  }

  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

int bitwiseSignedRightShift(int num, int shifts) {
  return int(floor(float(num) / pow(2.0, float(shifts))));
}

int bitwiseZeroFillRightShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n /= 2;
  }
  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

vec2 integerMod(vec2 x, float y) {
  vec2 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec3 integerMod(vec3 x, float y) {
  vec3 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec4 integerMod(vec4 x, vec4 y) {
  vec4 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

float integerMod(float x, float y) {
  float res = floor(mod(x, y));
  return res * (res > floor(y) - 1.0 ? 0.0 : 1.0);
}

int integerMod(int x, int y) {
  return x - (y * int(x / y));
}

__DIVIDE_WITH_INTEGER_CHECK__;

// Here be dragons!
// DO NOT OPTIMIZE THIS CODE
// YOU WILL BREAK SOMETHING ON SOMEBODY\'S MACHINE
// LEAVE IT AS IT IS, LEST YOU WASTE YOUR OWN TIME
const vec2 MAGIC_VEC = vec2(1.0, -256.0);
const vec4 SCALE_FACTOR = vec4(1.0, 256.0, 65536.0, 0.0);
const vec4 SCALE_FACTOR_INV = vec4(1.0, 0.00390625, 0.0000152587890625, 0.0); // 1, 1/256, 1/65536
float decode32(vec4 texel) {
  __DECODE32_ENDIANNESS__;
  texel *= 255.0;
  vec2 gte128;
  gte128.x = texel.b >= 128.0 ? 1.0 : 0.0;
  gte128.y = texel.a >= 128.0 ? 1.0 : 0.0;
  float exponent = 2.0 * texel.a - 127.0 + dot(gte128, MAGIC_VEC);
  float res = exp2(round(exponent));
  texel.b = texel.b - 128.0 * gte128.x;
  res = dot(texel, SCALE_FACTOR) * exp2(round(exponent-23.0)) + res;
  res *= gte128.y * -2.0 + 1.0;
  return res;
}

float decode16(vec4 texel, int index) {
  int channel = integerMod(index, 2);
  if (channel == 0) return texel.r * 255.0 + texel.g * 65280.0;
  if (channel == 1) return texel.b * 255.0 + texel.a * 65280.0;
  return 0.0;
}

float decode8(vec4 texel, int index) {
  int channel = integerMod(index, 4);
  if (channel == 0) return texel.r * 255.0;
  if (channel == 1) return texel.g * 255.0;
  if (channel == 2) return texel.b * 255.0;
  if (channel == 3) return texel.a * 255.0;
  return 0.0;
}

vec4 legacyEncode32(float f) {
  float F = abs(f);
  float sign = f < 0.0 ? 1.0 : 0.0;
  float exponent = floor(log2(F));
  float mantissa = (exp2(-exponent) * F);
  // exponent += floor(log2(mantissa));
  vec4 texel = vec4(F * exp2(23.0-exponent)) * SCALE_FACTOR_INV;
  texel.rg = integerMod(texel.rg, 256.0);
  texel.b = integerMod(texel.b, 128.0);
  texel.a = exponent*0.5 + 63.5;
  texel.ba += vec2(integerMod(exponent+127.0, 2.0), sign) * 128.0;
  texel = floor(texel);
  texel *= 0.003921569; // 1/255
  __ENCODE32_ENDIANNESS__;
  return texel;
}

// https://github.com/gpujs/gpu.js/wiki/Encoder-details
vec4 encode32(float value) {
  if (value == 0.0) return vec4(0, 0, 0, 0);

  float exponent;
  float mantissa;
  vec4  result;
  float sgn;

  sgn = step(0.0, -value);
  value = abs(value);

  exponent = floor(log2(value));

  mantissa = value*pow(2.0, -exponent)-1.0;
  exponent = exponent+127.0;
  result   = vec4(0,0,0,0);

  result.a = floor(exponent/2.0);
  exponent = exponent - result.a*2.0;
  result.a = result.a + 128.0*sgn;

  result.b = floor(mantissa * 128.0);
  mantissa = mantissa - result.b / 128.0;
  result.b = result.b + exponent*128.0;

  result.g = floor(mantissa*32768.0);
  mantissa = mantissa - result.g/32768.0;

  result.r = floor(mantissa*8388608.0);
  return result/255.0;
}
// Dragons end here

int index;
ivec3 threadId;

ivec3 indexTo3D(int idx, ivec3 texDim) {
  int z = int(idx / (texDim.x * texDim.y));
  idx -= z * int(texDim.x * texDim.y);
  int y = int(idx / texDim.x);
  int x = int(integerMod(idx, texDim.x));
  return ivec3(x, y, z);
}

float get32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  return decode32(texel);
}

float get16(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x * 2;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize.x * 2, texSize.y));
  return decode16(texel, index);
}

float get8(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x * 4;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize.x * 4, texSize.y));
  return decode8(texel, index);
}

float getMemoryOptimized32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 4);
  index = index / 4;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  if (channel == 0) return texel.r;
  if (channel == 1) return texel.g;
  if (channel == 2) return texel.b;
  if (channel == 3) return texel.a;
  return 0.0;
}

vec4 getImage2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture2D(tex, st / vec2(texSize));
}

float getFloatFromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return result[0];
}

vec2 getVec2FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec2(result[0], result[1]);
}

vec2 getMemoryOptimizedVec2(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int channel = integerMod(index, 2);
  index = index / 2;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  if (channel == 0) return vec2(texel.r, texel.g);
  if (channel == 1) return vec2(texel.b, texel.a);
  return vec2(0.0, 0.0);
}

vec3 getVec3FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec3(result[0], result[1], result[2]);
}

vec3 getMemoryOptimizedVec3(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int fieldIndex = 3 * (x + texDim.x * (y + texDim.y * z));
  int vectorIndex = fieldIndex / 4;
  int vectorOffset = fieldIndex - vectorIndex * 4;
  int readY = vectorIndex / texSize.x;
  int readX = vectorIndex - readY * texSize.x;
  vec4 tex1 = texture2D(tex, (vec2(readX, readY) + 0.5) / vec2(texSize));
  
  if (vectorOffset == 0) {
    return tex1.xyz;
  } else if (vectorOffset == 1) {
    return tex1.yzw;
  } else {
    readX++;
    if (readX >= texSize.x) {
      readX = 0;
      readY++;
    }
    vec4 tex2 = texture2D(tex, vec2(readX, readY) / vec2(texSize));
    if (vectorOffset == 2) {
      return vec3(tex1.z, tex1.w, tex2.x);
    } else {
      return vec3(tex1.w, tex2.x, tex2.y);
    }
  }
}

vec4 getVec4FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  return getImage2D(tex, texSize, texDim, z, y, x);
}

vec4 getMemoryOptimizedVec4(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture2D(tex, st / vec2(texSize));
  return vec4(texel.r, texel.g, texel.b, texel.a);
}

vec4 actualColor;
void color(float r, float g, float b, float a) {
  actualColor = vec4(r,g,b,a);
}

void color(float r, float g, float b) {
  color(r,g,b,1.0);
}

void color(sampler2D image) {
  actualColor = texture2D(image, vTexCoord);
}

__INJECTED_NATIVE__;
__MAIN_CONSTANTS__;
__MAIN_ARGUMENTS__;
__KERNEL__;

void main(void) {
  index = int(vTexCoord.s * float(uTexSize.x)) + int(vTexCoord.t * float(uTexSize.y)) * uTexSize.x;
  __MAIN_RESULT__;
}`;

module.exports = {
  fragmentShader
};
},{}],76:[function(require,module,exports){
const { FunctionNode } = require('../function-node');

/**
 * @desc [INTERNAL] Takes in a function node, and does all the AST voodoo required to toString its respective WebGL code
 * @extends FunctionNode
 * @returns the converted WebGL function string
 */
class WebGLFunctionNode extends FunctionNode {
  constructor(source, settings) {
    super(source, settings);
    if (settings && settings.hasOwnProperty('fixIntegerDivisionAccuracy')) {
      this.fixIntegerDivisionAccuracy = settings.fixIntegerDivisionAccuracy;
    }
  }

  /**
   * @desc Parses the abstract syntax tree for to its *named function*
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astFunction(ast, retArr) {
    // Setup function return type and name
    if (this.isRootKernel) {
      retArr.push('void');
    } else {
      // looking up return type, this is a little expensive, and can be avoided if returnType is set
      if (!this.returnType) {
        const lastReturn = this.findLastReturn();
        if (lastReturn) {
          this.returnType = this.getType(ast.body);
          if (this.returnType === 'LiteralInteger') {
            this.returnType = 'Number';
          }
        }
      }

      const { returnType } = this;
      if (!returnType) {
        retArr.push('void');
      } else {
        const type = typeMap[returnType];
        if (!type) {
          throw new Error(`unknown type ${returnType}`);
        }
        retArr.push(type);
      }
    }
    retArr.push(' ');
    retArr.push(this.name);
    retArr.push('(');

    if (!this.isRootKernel) {
      // Arguments handling
      for (let i = 0; i < this.argumentNames.length; ++i) {
        const argumentName = this.argumentNames[i];

        if (i > 0) {
          retArr.push(', ');
        }
        let argumentType = this.argumentTypes[this.argumentNames.indexOf(argumentName)];
        // The type is too loose ended, here we descide to solidify a type, lets go with float
        if (!argumentType) {
          throw this.astErrorOutput(`Unknown argument ${argumentName} type`, ast);
        }
        if (argumentType === 'LiteralInteger') {
          this.argumentTypes[i] = argumentType = 'Number';
        }
        const type = typeMap[argumentType];
        if (!type) {
          throw this.astErrorOutput('Unexpected expression', ast);
        }

        if (type === 'sampler2D' || type === 'sampler2DArray') {
          // mash needed arguments together, since now we have end to end inference
          retArr.push(`${type} user_${argumentName},ivec2 user_${argumentName}Size,ivec3 user_${argumentName}Dim`);
        } else {
          retArr.push(`${type} user_${argumentName}`);
        }
      }
    }

    // Function opening
    retArr.push(') {\n');

    // Body statement iteration
    for (let i = 0; i < ast.body.body.length; ++i) {
      this.astGeneric(ast.body.body[i], retArr);
      retArr.push('\n');
    }

    // Function closing
    retArr.push('}\n');
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for to *return* statement
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astReturnStatement(ast, retArr) {
    if (!ast.argument) throw this.astErrorOutput('Unexpected return statement', ast);
    this.pushState('skip-literal-correction');
    const type = this.getType(ast.argument);
    this.popState('skip-literal-correction');

    const result = [];

    if (!this.returnType) {
      if (type === 'LiteralInteger' || type === 'Integer') {
        this.returnType = 'Number';
      } else {
        this.returnType = type;
      }
    }

    switch (this.returnType) {
      case 'LiteralInteger':
      case 'Number':
      case 'Float':
        switch (type) {
          case 'Integer':
            result.push('float(');
            this.astGeneric(ast.argument, result);
            result.push(')');
            break;
          case 'LiteralInteger':
            this.castLiteralToFloat(ast.argument, result);

            // Running astGeneric forces the LiteralInteger to pick a type, and here, if we are returning a float, yet
            // the LiteralInteger has picked to be an integer because of constraints on it we cast it to float.
            if (this.getType(ast) === 'Integer') {
              result.unshift('float(');
              result.push(')');
            }
            break;
          default:
            this.astGeneric(ast.argument, result);
        }
        break;
      case 'Integer':
        switch (type) {
          case 'Float':
          case 'Number':
            this.castValueToInteger(ast.argument, result);
            break;
          case 'LiteralInteger':
            this.castLiteralToInteger(ast.argument, result);
            break;
          default:
            this.astGeneric(ast.argument, result);
        }
        break;
      case 'Array(4)':
      case 'Array(3)':
      case 'Array(2)':
      case 'Input':
        this.astGeneric(ast.argument, result);
        break;
      default:
        throw this.astErrorOutput(`unhandled return type ${this.returnType}`, ast);
    }

    if (this.isRootKernel) {
      retArr.push(`kernelResult = ${ result.join('') };`);
      retArr.push('return;');
    } else if (this.isSubKernel) {
      retArr.push(`subKernelResult_${ this.name } = ${ result.join('') };`);
      retArr.push(`return subKernelResult_${ this.name };`);
    } else {
      retArr.push(`return ${ result.join('') };`);
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *literal value*
   *
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   *
   * @returns {Array} the append retArr
   */
  astLiteral(ast, retArr) {
    // Reject non numeric literals
    if (isNaN(ast.value)) {
      throw this.astErrorOutput(
        'Non-numeric literal not supported : ' + ast.value,
        ast
      );
    }

    const key = `${ast.start},${ast.end}`;
    if (Number.isInteger(ast.value)) {
      if (this.isState('in-for-loop-init') || this.isState('casting-to-integer') || this.isState('building-integer')) {
        this.literalTypes[key] = 'Integer';
        retArr.push(`${ast.value}`);
      } else if (this.isState('casting-to-float') || this.isState('building-float')) {
        this.literalTypes[key] = 'Number';
        retArr.push(`${ast.value}.0`);
      } else {
        this.literalTypes[key] = 'Number';
        retArr.push(`${ast.value}.0`);
      }
    } else if (this.isState('casting-to-integer') || this.isState('building-integer')) {
      this.literalTypes[key] = 'Integer';
      retArr.push(Math.round(ast.value));
    } else {
      this.literalTypes[key] = 'Number';
      retArr.push(`${ast.value}`);
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *binary* expression
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astBinaryExpression(ast, retArr) {
    if (this.checkAndUpconvertOperator(ast, retArr)) {
      return retArr;
    }

    if (this.fixIntegerDivisionAccuracy && ast.operator === '/') {
      retArr.push('div_with_int_check(');
      this.pushState('building-float');
      switch (this.getType(ast.left)) {
        case 'Integer':
          this.castValueToFloat(ast.left, retArr);
          break;
        case 'LiteralInteger':
          this.castLiteralToFloat(ast.left, retArr);
          break;
        default:
          this.astGeneric(ast.left, retArr);
      }
      retArr.push(', ');
      switch (this.getType(ast.right)) {
        case 'Integer':
          this.castValueToFloat(ast.right, retArr);
          break;
        case 'LiteralInteger':
          this.castLiteralToFloat(ast.right, retArr);
          break;
        default:
          this.astGeneric(ast.right, retArr);
      }
      this.popState('building-float');
      retArr.push(')');
      return retArr;
    }

    retArr.push('(');
    const leftType = this.getType(ast.left) || 'Number';
    const rightType = this.getType(ast.right) || 'Number';
    if (!leftType || !rightType) {
      throw this.astErrorOutput(`Unhandled binary expression`, ast);
    }
    const key = leftType + ' & ' + rightType;
    switch (key) {
      case 'Integer & Integer':
        this.pushState('building-integer');
        this.astGeneric(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.astGeneric(ast.right, retArr);
        this.popState('building-integer');
        break;
      case 'Number & Float':
      case 'Float & Number':
      case 'Float & Float':
      case 'Number & Number':
        this.pushState('building-float');
        this.astGeneric(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.astGeneric(ast.right, retArr);
        this.popState('building-float');
        break;
      case 'LiteralInteger & LiteralInteger':
        if (this.isState('casting-to-integer') || this.isState('building-integer')) {
          this.pushState('building-integer');
          this.astGeneric(ast.left, retArr);
          retArr.push(operatorMap[ast.operator] || ast.operator);
          this.astGeneric(ast.right, retArr);
          this.popState('building-integer');
        } else {
          this.pushState('building-float');
          this.castLiteralToFloat(ast.left, retArr);
          retArr.push(operatorMap[ast.operator] || ast.operator);
          this.castLiteralToFloat(ast.right, retArr);
          this.popState('building-float');
        }
        break;

      case 'Integer & Float':
      case 'Integer & Number':
        if (ast.operator === '>' || ast.operator === '<' && ast.right.type === 'Literal') {
          // if right value is actually a float, don't loose that information, cast left to right rather than the usual right to left
          if (!Number.isInteger(ast.right.value)) {
            this.pushState('building-float');
            this.castValueToFloat(ast.left, retArr);
            retArr.push(operatorMap[ast.operator] || ast.operator);
            this.astGeneric(ast.right, retArr);
            this.popState('building-float');
            break;
          }
        }
        this.pushState('building-integer');
        this.astGeneric(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.pushState('casting-to-integer');
        if (ast.right.type === 'Literal') {
          const literalResult = [];
          this.astGeneric(ast.right, literalResult);
          const literalType = this.getType(ast.right);
          if (literalType === 'Integer') {
            retArr.push(literalResult.join(''));
          } else {
            throw this.astErrorOutput(`Unhandled binary expression with literal`, ast);
          }
        } else {
          retArr.push('int(');
          this.astGeneric(ast.right, retArr);
          retArr.push(')');
        }
        this.popState('casting-to-integer');
        this.popState('building-integer');
        break;
      case 'Integer & LiteralInteger':
        this.pushState('building-integer');
        this.astGeneric(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.castLiteralToInteger(ast.right, retArr);
        this.popState('building-integer');
        break;

      case 'Number & Integer':
        this.pushState('building-float');
        this.astGeneric(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.castValueToFloat(ast.right, retArr);
        this.popState('building-float');
        break;
      case 'Float & LiteralInteger':
      case 'Number & LiteralInteger':
        if (this.isState('in-for-loop-test')) {
          this.pushState('building-integer');
          retArr.push('int(');
          this.astGeneric(ast.left, retArr);
          retArr.push(')');
          retArr.push(operatorMap[ast.operator] || ast.operator);
          this.castLiteralToInteger(ast.right, retArr);
          this.popState('building-integer');
        } else {
          this.pushState('building-float');
          this.astGeneric(ast.left, retArr);
          retArr.push(operatorMap[ast.operator] || ast.operator);
          this.castLiteralToFloat(ast.right, retArr);
          this.popState('building-float');
        }
        break;
      case 'LiteralInteger & Float':
      case 'LiteralInteger & Number':
        if (this.isState('in-for-loop-test') || this.isState('in-for-loop-init') || this.isState('casting-to-integer')) {
          this.pushState('building-integer');
          this.castLiteralToInteger(ast.left, retArr);
          retArr.push(operatorMap[ast.operator] || ast.operator);
          this.castValueToInteger(ast.right, retArr);
          this.popState('building-integer');
        } else {
          this.pushState('building-float');
          this.astGeneric(ast.left, retArr);
          retArr.push(operatorMap[ast.operator] || ast.operator);
          this.pushState('casting-to-float');
          this.astGeneric(ast.right, retArr);
          this.popState('casting-to-float');
          this.popState('building-float');
        }
        break;
      case 'LiteralInteger & Integer':
        this.pushState('building-integer');
        this.castLiteralToInteger(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.astGeneric(ast.right, retArr);
        this.popState('building-integer');
        break;

      case 'Boolean & Boolean':
        this.pushState('building-boolean');
        this.astGeneric(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.astGeneric(ast.right, retArr);
        this.popState('building-boolean');
        break;

      case 'Float & Integer':
        this.pushState('building-float');
        this.astGeneric(ast.left, retArr);
        retArr.push(operatorMap[ast.operator] || ast.operator);
        this.castValueToFloat(ast.right, retArr);
        this.popState('building-float');
        break;

      default:
        throw this.astErrorOutput(`Unhandled binary expression between ${key}`, ast);
    }
    retArr.push(')');

    return retArr;
  }

  checkAndUpconvertOperator(ast, retArr) {
    const bitwiseResult = this.checkAndUpconvertBitwiseOperators(ast, retArr);
    if (bitwiseResult) {
      return bitwiseResult;
    }
    const upconvertableOperators = {
      '%': 'mod',
      '**': 'pow',
    };
    const foundOperator = upconvertableOperators[ast.operator];
    if (!foundOperator) return null;
    retArr.push(foundOperator);
    retArr.push('(');
    switch (this.getType(ast.left)) {
      case 'Integer':
        this.castValueToFloat(ast.left, retArr);
        break;
      case 'LiteralInteger':
        this.castLiteralToFloat(ast.left, retArr);
        break;
      default:
        this.astGeneric(ast.left, retArr);
    }
    retArr.push(',');
    switch (this.getType(ast.right)) {
      case 'Integer':
        this.castValueToFloat(ast.right, retArr);
        break;
      case 'LiteralInteger':
        this.castLiteralToFloat(ast.right, retArr);
        break;
      default:
        this.astGeneric(ast.right, retArr);
    }
    retArr.push(')');
    return retArr;
  }

  checkAndUpconvertBitwiseOperators(ast, retArr) {
    const upconvertableOperators = {
      '&': 'bitwiseAnd',
      '|': 'bitwiseOr',
      '^': 'bitwiseXOR',
      '<<': 'bitwiseZeroFillLeftShift',
      '>>': 'bitwiseSignedRightShift',
      '>>>': 'bitwiseZeroFillRightShift',
    };
    const foundOperator = upconvertableOperators[ast.operator];
    if (!foundOperator) return null;
    retArr.push(foundOperator);
    retArr.push('(');
    const leftType = this.getType(ast.left);
    switch (leftType) {
      case 'Number':
      case 'Float':
        this.castValueToInteger(ast.left, retArr);
        break;
      case 'LiteralInteger':
        this.castLiteralToInteger(ast.left, retArr);
        break;
      default:
        this.astGeneric(ast.left, retArr);
    }
    retArr.push(',');
    const rightType = this.getType(ast.right);
    switch (rightType) {
      case 'Number':
      case 'Float':
        this.castValueToInteger(ast.right, retArr);
        break;
      case 'LiteralInteger':
        this.castLiteralToInteger(ast.right, retArr);
        break;
      default:
        this.astGeneric(ast.right, retArr);
    }
    retArr.push(')');
    return retArr;
  }

  checkAndUpconvertBitwiseUnary(ast, retArr) {
    const upconvertableOperators = {
      '~': 'bitwiseNot',
    };
    const foundOperator = upconvertableOperators[ast.operator];
    if (!foundOperator) return null;
    retArr.push(foundOperator);
    retArr.push('(');
    switch (this.getType(ast.argument)) {
      case 'Number':
      case 'Float':
        this.castValueToInteger(ast.argument, retArr);
        break;
      case 'LiteralInteger':
        this.castLiteralToInteger(ast.argument, retArr);
        break;
      default:
        this.astGeneric(ast.argument, retArr);
    }
    retArr.push(')');
    return retArr;
  }

  /**
   *
   * @param {Object} ast
   * @param {Array} retArr
   * @return {String[]}
   */
  castLiteralToInteger(ast, retArr) {
    this.pushState('casting-to-integer');
    this.astGeneric(ast, retArr);
    this.popState('casting-to-integer');
    return retArr;
  }

  /**
   *
   * @param {Object} ast
   * @param {Array} retArr
   * @return {String[]}
   */
  castLiteralToFloat(ast, retArr) {
    this.pushState('casting-to-float');
    this.astGeneric(ast, retArr);
    this.popState('casting-to-float');
    return retArr;
  }

  /**
   *
   * @param {Object} ast
   * @param {Array} retArr
   * @return {String[]}
   */
  castValueToInteger(ast, retArr) {
    this.pushState('casting-to-integer');
    retArr.push('int(');
    this.astGeneric(ast, retArr);
    retArr.push(')');
    this.popState('casting-to-integer');
    return retArr;
  }

  /**
   *
   * @param {Object} ast
   * @param {Array} retArr
   * @return {String[]}
   */
  castValueToFloat(ast, retArr) {
    this.pushState('casting-to-float');
    retArr.push('float(');
    this.astGeneric(ast, retArr);
    retArr.push(')');
    this.popState('casting-to-float');
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *identifier* expression
   * @param {Object} idtNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astIdentifierExpression(idtNode, retArr) {
    if (idtNode.type !== 'Identifier') {
      throw this.astErrorOutput('IdentifierExpression - not an Identifier', idtNode);
    }

    const type = this.getType(idtNode);

    if (idtNode.name === 'Infinity') {
      // https://stackoverflow.com/a/47543127/1324039
      retArr.push('3.402823466e+38');
    } else if (type === 'Boolean') {
      if (this.argumentNames.indexOf(idtNode.name) > -1) {
        retArr.push(`bool(user_${idtNode.name})`);
      } else {
        retArr.push(`user_${idtNode.name}`);
      }
    } else {
      retArr.push(`user_${idtNode.name}`);
    }

    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *for-loop* expression
   * @param {Object} forNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the parsed webgl string
   */
  astForStatement(forNode, retArr) {
    if (forNode.type !== 'ForStatement') {
      throw this.astErrorOutput('Invalid for statement', forNode);
    }

    const initArr = [];
    const testArr = [];
    const updateArr = [];
    const bodyArr = [];
    let isSafe = null;

    if (forNode.init) {
      this.pushState('in-for-loop-init');
      this.astGeneric(forNode.init, initArr);
      const { declarations } = forNode.init;
      for (let i = 0; i < declarations.length; i++) {
        if (declarations[i].init && declarations[i].init.type !== 'Literal') {
          isSafe = false;
        }
      }
      if (isSafe) {
        for (let i = 0; i < initArr.length; i++) {
          if (initArr[i].includes && initArr[i].includes(',')) {
            isSafe = false;
          }
        }
      }
      this.popState('in-for-loop-init');
    } else {
      isSafe = false;
    }

    if (forNode.test) {
      this.pushState('in-for-loop-test');
      this.astGeneric(forNode.test, testArr);
      this.popState('in-for-loop-test');
    } else {
      isSafe = false;
    }

    if (forNode.update) {
      this.astGeneric(forNode.update, updateArr);
    } else {
      isSafe = false;
    }

    if (forNode.body) {
      this.pushState('loop-body');
      this.astGeneric(forNode.body, bodyArr);
      this.popState('loop-body');
    }

    // have all parts, now make them safe
    if (isSafe === null) {
      isSafe = this.isSafe(forNode.init) && this.isSafe(forNode.test);
    }

    if (isSafe) {
      retArr.push(`for (${initArr.join('')};${testArr.join('')};${updateArr.join('')}){\n`);
      retArr.push(bodyArr.join(''));
      retArr.push('}\n');
    } else {
      const iVariableName = this.getInternalVariableName('safeI');
      if (initArr.length > 0) {
        retArr.push(initArr.join(''), ';\n');
      }
      retArr.push(`for (int ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
      if (testArr.length > 0) {
        retArr.push(`if (!${testArr.join('')}) break;\n`);
      }
      retArr.push(bodyArr.join(''));
      retArr.push(`\n${updateArr.join('')};`);
      retArr.push('}\n');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *while* loop
   * @param {Object} whileNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the parsed webgl string
   */
  astWhileStatement(whileNode, retArr) {
    if (whileNode.type !== 'WhileStatement') {
      throw this.astErrorOutput('Invalid while statement', whileNode);
    }

    const iVariableName = this.getInternalVariableName('safeI');
    retArr.push(`for (int ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
    retArr.push('if (!');
    this.astGeneric(whileNode.test, retArr);
    retArr.push(') break;\n');
    this.astGeneric(whileNode.body, retArr);
    retArr.push('}\n');

    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *do while* loop
   * @param {Object} doWhileNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the parsed webgl string
   */
  astDoWhileStatement(doWhileNode, retArr) {
    if (doWhileNode.type !== 'DoWhileStatement') {
      throw this.astErrorOutput('Invalid while statement', doWhileNode);
    }

    const iVariableName = this.getInternalVariableName('safeI');
    retArr.push(`for (int ${iVariableName}=0;${iVariableName}<LOOP_MAX;${iVariableName}++){\n`);
    this.astGeneric(doWhileNode.body, retArr);
    retArr.push('if (!');
    this.astGeneric(doWhileNode.test, retArr);
    retArr.push(') break;\n');
    retArr.push('}\n');

    return retArr;
  }


  /**
   * @desc Parses the abstract syntax tree for *Assignment* Expression
   * @param {Object} assNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astAssignmentExpression(assNode, retArr) {
    // TODO: casting needs implemented here
    if (assNode.operator === '%=') {
      this.astGeneric(assNode.left, retArr);
      retArr.push('=');
      retArr.push('mod(');
      this.astGeneric(assNode.left, retArr);
      retArr.push(',');
      this.astGeneric(assNode.right, retArr);
      retArr.push(')');
    } else if (assNode.operator === '**=') {
      this.astGeneric(assNode.left, retArr);
      retArr.push('=');
      retArr.push('pow(');
      this.astGeneric(assNode.left, retArr);
      retArr.push(',');
      this.astGeneric(assNode.right, retArr);
      retArr.push(')');
    } else {
      const leftType = this.getType(assNode.left);
      const rightType = this.getType(assNode.right);
      this.astGeneric(assNode.left, retArr);
      retArr.push(assNode.operator);
      if (leftType !== 'Integer' && rightType === 'Integer') {
        retArr.push('float(');
        this.astGeneric(assNode.right, retArr);
        retArr.push(')');
      } else {
        this.astGeneric(assNode.right, retArr);
      }
      return retArr;
    }
  }

  /**
   * @desc Parses the abstract syntax tree for *Block* statement
   * @param {Object} bNode - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astBlockStatement(bNode, retArr) {
    if (this.isState('loop-body')) {
      this.pushState('block-body'); // this prevents recursive removal of braces
      for (let i = 0; i < bNode.body.length; i++) {
        this.astGeneric(bNode.body[i], retArr);
      }
      this.popState('block-body');
    } else {
      retArr.push('{\n');
      for (let i = 0; i < bNode.body.length; i++) {
        this.astGeneric(bNode.body[i], retArr);
      }
      retArr.push('}\n');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *Variable Declaration*
   * @param {Object} varDecNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astVariableDeclaration(varDecNode, retArr) {
    if (varDecNode.kind === 'var' && this.warnVarUsage) {
      this.varWarn();
    }
    const declarations = varDecNode.declarations;
    if (!declarations || !declarations[0] || !declarations[0].init) {
      throw this.astErrorOutput('Unexpected expression', varDecNode);
    }
    const result = [];
    let lastType = null;
    const inForLoopInit = this.isState('in-for-loop-init');
    for (let i = 0; i < declarations.length; i++) {
      const declaration = declarations[i];
      const init = declaration.init;
      const info = this.getDeclaration(declaration.id);
      const actualType = this.getType(declaration.init);
      let type = inForLoopInit ? 'Integer' : actualType;
      if (type === 'LiteralInteger') {
        // We had the choice to go either float or int, choosing float
        type = 'Number';
      }
      const markupType = typeMap[type];
      if (!markupType) {
        throw this.astErrorOutput(`Markup type ${ markupType } not handled`, varDecNode);
      }
      const declarationResult = [];
      if (actualType === 'Integer' && type === 'Integer' && !inForLoopInit) {
        // Since we are assigning to a float, ensure valueType is reset to that
        info.valueType = 'Number';
        if (i === 0 || lastType === null) {
          declarationResult.push('float ');
        } else if (type !== lastType) {
          throw new Error('Unhandled declaration');
        } else {
          declarationResult.push(',');
        }
        lastType = type;
        declarationResult.push(`user_${declaration.id.name}=`);
        declarationResult.push('float(');
        this.astGeneric(init, declarationResult);
        declarationResult.push(')');
      } else {
        // Since we are assigning to a float, ensure valueType is reset to that
        info.valueType = type;
        if (i === 0 || lastType === null) {
          declarationResult.push(`${markupType} `);
        } else if (type !== lastType) {
          result.push(';');
          declarationResult.push(`${markupType} `);
        } else {
          declarationResult.push(',');
        }
        lastType = type;
        declarationResult.push(`user_${declaration.id.name}=`);
        if (actualType === 'Number' && type === 'Integer') {
          if (init.left && init.left.type === 'Literal') {
            this.astGeneric(init, declarationResult);
          } else {
            declarationResult.push('int(');
            this.astGeneric(init, declarationResult);
            declarationResult.push(')');
          }
        } else {
          this.astGeneric(init, declarationResult);
        }
      }
      result.push(declarationResult.join(''));
    }

    retArr.push(result.join(''));
    if (!inForLoopInit) {
      retArr.push(';');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *If* Statement
   * @param {Object} ifNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astIfStatement(ifNode, retArr) {
    retArr.push('if (');
    this.astGeneric(ifNode.test, retArr);
    retArr.push(')');
    if (ifNode.consequent.type === 'BlockStatement') {
      this.astGeneric(ifNode.consequent, retArr);
    } else {
      retArr.push(' {\n');
      this.astGeneric(ifNode.consequent, retArr);
      retArr.push('\n}\n');
    }

    if (ifNode.alternate) {
      retArr.push('else ');
      if (ifNode.alternate.type === 'BlockStatement') {
        this.astGeneric(ifNode.alternate, retArr);
      } else {
        retArr.push(' {\n');
        this.astGeneric(ifNode.alternate, retArr);
        retArr.push('\n}\n');
      }
    }
    return retArr;
  }

  astSwitchStatement(ast, retArr) {
    if (ast.type !== 'SwitchStatement') {
      throw this.astErrorOutput('Invalid switch statement', ast);
    }
    const { discriminant, cases } = ast;
    const type = this.getType(discriminant);
    const varName = `switchDiscriminant${ast.start}_${ast.end}`;
    switch (type) {
      case 'Float':
      case 'Number':
        retArr.push(`float ${varName} = `);
        this.astGeneric(discriminant, retArr);
        retArr.push(';\n');
        break;
      case 'Integer':
        retArr.push(`int ${varName} = `);
        this.astGeneric(discriminant, retArr);
        retArr.push(';\n');
        break;
    }
    // switch with just a default:
    if (cases.length === 1 && !cases[0].test) {
      this.astGeneric(cases[0].consequent, retArr);
      return retArr;
    }

    // regular switches:
    let fallingThrough = false;
    let defaultResult = [];
    let movingDefaultToEnd = false;
    let pastFirstIf = false;
    for (let i = 0; i < cases.length; i++) {
      // default
      if (!cases[i].test) {
        if (cases.length > i + 1) {
          movingDefaultToEnd = true;
          this.astGeneric(cases[i].consequent, defaultResult);
          continue;
        } else {
          retArr.push(' else {\n');
        }
      } else {
        // all others
        if (i === 0 || !pastFirstIf) {
          pastFirstIf = true;
          retArr.push(`if (${varName} == `);
        } else {
          if (fallingThrough) {
            retArr.push(`${varName} == `);
            fallingThrough = false;
          } else {
            retArr.push(` else if (${varName} == `);
          }
        }
        if (type === 'Integer') {
          const testType = this.getType(cases[i].test);
          switch (testType) {
            case 'Number':
            case 'Float':
              this.castValueToInteger(cases[i].test, retArr);
              break;
            case 'LiteralInteger':
              this.castLiteralToInteger(cases[i].test, retArr);
              break;
          }
        } else if (type === 'Float') {
          const testType = this.getType(cases[i].test);
          switch (testType) {
            case 'LiteralInteger':
              this.castLiteralToFloat(cases[i].test, retArr);
              break;
            case 'Integer':
              this.castValueToFloat(cases[i].test, retArr);
              break;
          }
        } else {
          throw new Error('unhanlded');
        }
        if (!cases[i].consequent || cases[i].consequent.length === 0) {
          fallingThrough = true;
          retArr.push(' || ');
          continue;
        }
        retArr.push(`) {\n`);
      }
      this.astGeneric(cases[i].consequent, retArr);
      retArr.push('\n}');
    }
    if (movingDefaultToEnd) {
      retArr.push(' else {');
      retArr.push(defaultResult.join(''));
      retArr.push('}');
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *This* expression
   * @param {Object} tNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astThisExpression(tNode, retArr) {
    retArr.push('this');
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *Member* Expression
   * @param {Object} mNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astMemberExpression(mNode, retArr) {
    const {
      property,
      name,
      signature,
      origin,
      type,
      xProperty,
      yProperty,
      zProperty
    } = this.getMemberExpressionDetails(mNode);
    switch (signature) {
      case 'value.thread.value':
      case 'this.thread.value':
        if (name !== 'x' && name !== 'y' && name !== 'z') {
          throw this.astErrorOutput('Unexpected expression, expected `this.thread.x`, `this.thread.y`, or `this.thread.z`', mNode);
        }
        retArr.push(`threadId.${name}`);
        return retArr;
      case 'this.output.value':
        if (this.dynamicOutput) {
          switch (name) {
            case 'x':
              if (this.isState('casting-to-float')) {
                retArr.push('float(uOutputDim.x)');
              } else {
                retArr.push('uOutputDim.x');
              }
              break;
            case 'y':
              if (this.isState('casting-to-float')) {
                retArr.push('float(uOutputDim.y)');
              } else {
                retArr.push('uOutputDim.y');
              }
              break;
            case 'z':
              if (this.isState('casting-to-float')) {
                retArr.push('float(uOutputDim.z)');
              } else {
                retArr.push('uOutputDim.z');
              }
              break;
            default:
              throw this.astErrorOutput('Unexpected expression', mNode);
          }
        } else {
          switch (name) {
            case 'x':
              if (this.isState('casting-to-integer')) {
                retArr.push(this.output[0]);
              } else {
                retArr.push(this.output[0], '.0');
              }
              break;
            case 'y':
              if (this.isState('casting-to-integer')) {
                retArr.push(this.output[1]);
              } else {
                retArr.push(this.output[1], '.0');
              }
              break;
            case 'z':
              if (this.isState('casting-to-integer')) {
                retArr.push(this.output[2]);
              } else {
                retArr.push(this.output[2], '.0');
              }
              break;
            default:
              throw this.astErrorOutput('Unexpected expression', mNode);
          }
        }
        return retArr;
      case 'value':
        throw this.astErrorOutput('Unexpected expression', mNode);
      case 'value[]':
      case 'value[][]':
      case 'value[][][]':
      case 'value[][][][]':
      case 'value.value':
        if (origin === 'Math') {
          retArr.push(Math[name]);
          return retArr;
        }
        switch (property) {
          case 'r':
            retArr.push(`user_${ name }.r`);
            return retArr;
          case 'g':
            retArr.push(`user_${ name }.g`);
            return retArr;
          case 'b':
            retArr.push(`user_${ name }.b`);
            return retArr;
          case 'a':
            retArr.push(`user_${ name }.a`);
            return retArr;
        }
        break;
      case 'this.constants.value':
        if (typeof xProperty === 'undefined') {
          switch (type) {
            case 'Array(2)':
            case 'Array(3)':
            case 'Array(4)':
              retArr.push(`constants_${ name }`);
              return retArr;
          }
        }
        case 'this.constants.value[]':
        case 'this.constants.value[][]':
        case 'this.constants.value[][][]':
        case 'this.constants.value[][][][]':
          break;
        case 'fn()[]':
          this.astCallExpression(mNode.object, retArr);
          retArr.push('[');
          retArr.push(this.memberExpressionPropertyMarkup(property));
          retArr.push(']');
          return retArr;
        case '[][]':
          this.astArrayExpression(mNode.object, retArr);
          retArr.push('[');
          retArr.push(this.memberExpressionPropertyMarkup(property));
          retArr.push(']');
          return retArr;
        default:
          throw this.astErrorOutput('Unexpected expression', mNode);
    }

    if (mNode.computed === false) {
      // handle simple types
      switch (type) {
        case 'Number':
        case 'Integer':
        case 'Float':
        case 'Boolean':
          retArr.push(`${origin}_${name}`);
          return retArr;
      }
    }

    // handle more complex types
    // argument may have come from a parent
    const markupName = `${origin}_${name}`;

    switch (type) {
      case 'Array(2)':
      case 'Array(3)':
      case 'Array(4)':
        // Get from local vec4
        this.astGeneric(mNode.object, retArr);
        retArr.push('[');
        retArr.push(this.memberExpressionPropertyMarkup(xProperty));
        retArr.push(']');
        break;
      case 'HTMLImageArray':
        retArr.push(`getImage3D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'ArrayTexture(1)':
        retArr.push(`getFloatFromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'Array1D(2)':
      case 'Array2D(2)':
      case 'Array3D(2)':
        retArr.push(`getMemoryOptimizedVec2(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'ArrayTexture(2)':
        retArr.push(`getVec2FromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'Array1D(3)':
      case 'Array2D(3)':
      case 'Array3D(3)':
        retArr.push(`getMemoryOptimizedVec3(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'ArrayTexture(3)':
        retArr.push(`getVec3FromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'Array1D(4)':
      case 'Array2D(4)':
      case 'Array3D(4)':
        retArr.push(`getMemoryOptimizedVec4(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'ArrayTexture(4)':
      case 'HTMLImage':
      case 'HTMLVideo':
        retArr.push(`getVec4FromSampler2D(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      case 'NumberTexture':
      case 'Array':
      case 'Array2D':
      case 'Array3D':
      case 'Array4D':
      case 'Input':
      case 'Number':
      case 'Float':
      case 'Integer':
        if (this.precision === 'single') {
          // bitRatio is always 4 here, javascript doesn't yet have 8 or 16 bit support
          // TODO: make 8 or 16 bit work anyway!
          retArr.push(`getMemoryOptimized32(${markupName}, ${markupName}Size, ${markupName}Dim, `);
          this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
          retArr.push(')');
        } else {
          const bitRatio = (origin === 'user' ?
            this.lookupFunctionArgumentBitRatio(this.name, name) :
            this.constantBitRatios[name]
          );
          switch (bitRatio) {
            case 1:
              retArr.push(`get8(${markupName}, ${markupName}Size, ${markupName}Dim, `);
              break;
            case 2:
              retArr.push(`get16(${markupName}, ${markupName}Size, ${markupName}Dim, `);
              break;
            case 4:
            case 0:
              retArr.push(`get32(${markupName}, ${markupName}Size, ${markupName}Dim, `);
              break;
            default:
              throw new Error(`unhandled bit ratio of ${bitRatio}`);
          }
          this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
          retArr.push(')');
        }
        break;
      case 'MemoryOptimizedNumberTexture':
        retArr.push(`getMemoryOptimized32(${ markupName }, ${ markupName }Size, ${ markupName }Dim, `);
        this.memberExpressionXYZ(xProperty, yProperty, zProperty, retArr);
        retArr.push(')');
        break;
      default:
        throw new Error(`unhandled member expression "${ type }"`);
    }
    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *call* expression
   * @param {Object} ast - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns  {Array} the append retArr
   */
  astCallExpression(ast, retArr) {
    if (!ast.callee) {
      throw this.astErrorOutput('Unknown CallExpression', ast);
    }

    let functionName = null;
    const isMathFunction = this.isAstMathFunction(ast);

    // Its a math operator or this.something(), remove the prefix
    if (isMathFunction || (ast.callee.object && ast.callee.object.type === 'ThisExpression')) {
      functionName = ast.callee.property.name;
    }
    // Issue #212, BABEL!
    else if (ast.callee.type === 'SequenceExpression' && ast.callee.expressions[0].type === 'Literal' && !isNaN(ast.callee.expressions[0].raw)) {
      functionName = ast.callee.expressions[1].property.name;
    } else {
      functionName = ast.callee.name;
    }

    if (!functionName) {
      throw this.astErrorOutput(`Unhandled function, couldn't find name`, ast);
    }

    // if this if grows to more than one, lets use a switch
    if (functionName === 'atan2') {
      functionName = 'atan';
    }

    // Register the function into the called registry
    if (this.calledFunctions.indexOf(functionName) < 0) {
      this.calledFunctions.push(functionName);
    }

    if (functionName === 'random' && this.plugins && this.plugins.length > 0) {
      for (let i = 0; i < this.plugins.length; i++) {
        const plugin = this.plugins[i];
        if (plugin.functionMatch === 'Math.random()' && plugin.functionReplace) {
          retArr.push(plugin.functionReplace);
          return retArr;
        }
      }
    }

    // track the function was called
    if (this.onFunctionCall) {
      this.onFunctionCall(this.name, functionName, ast.arguments);
    }

    // Call the function
    retArr.push(functionName);

    // Open arguments space
    retArr.push('(');

    // Add the arguments
    if (isMathFunction) {
      for (let i = 0; i < ast.arguments.length; ++i) {
        const argument = ast.arguments[i];
        const argumentType = this.getType(argument);
        if (i > 0) {
          retArr.push(', ');
        }

        switch (argumentType) {
          case 'Integer':
            this.castValueToFloat(argument, retArr);
            break;
          default:
            this.astGeneric(argument, retArr);
            break;
        }
      }
    } else {
      const targetTypes = this.lookupFunctionArgumentTypes(functionName) || [];
      for (let i = 0; i < ast.arguments.length; ++i) {
        const argument = ast.arguments[i];
        let targetType = targetTypes[i];
        if (i > 0) {
          retArr.push(', ');
        }
        const argumentType = this.getType(argument);
        if (!targetType) {
          this.triggerImplyArgumentType(functionName, i, argumentType, this);
          targetType = argumentType;
        }
        switch (argumentType) {
          case 'Number':
          case 'Float':
            if (targetType === 'Integer') {
              retArr.push('int(');
              this.astGeneric(argument, retArr);
              retArr.push(')');
              continue;
            } else if (targetType === 'Number' || targetType === 'Float') {
              this.astGeneric(argument, retArr);
              continue;
            } else if (targetType === 'LiteralInteger') {
              this.castLiteralToFloat(argument, retArr);
              continue;
            }
            break;
          case 'Integer':
            if (targetType === 'Number' || targetType === 'Float') {
              retArr.push('float(');
              this.astGeneric(argument, retArr);
              retArr.push(')');
              continue;
            } else if (targetType === 'Integer') {
              this.astGeneric(argument, retArr);
              continue;
            }
            break;
          case 'LiteralInteger':
            if (targetType === 'Integer') {
              this.castLiteralToInteger(argument, retArr);
              continue;
            } else if (targetType === 'Number' || targetType === 'Float') {
              this.castLiteralToFloat(argument, retArr);
              continue;
            } else if (targetType === 'LiteralInteger') {
              this.astGeneric(argument, retArr);
              continue;
            }
            break;
          case 'Array(2)':
          case 'Array(3)':
          case 'Array(4)':
            if (targetType === argumentType) {
              if (argument.type === 'Identifier') {
                retArr.push(`user_${argument.name}`);
              } else if (argument.type === 'ArrayExpression') {
                this.astGeneric(argument, retArr);
              } else {
                throw this.astErrorOutput(`Unhandled argument type ${ argument.type }`, ast);
              }
              continue;
            }
            break;
          case 'HTMLImage':
          case 'HTMLImageArray':
          case 'HTMLVideo':
          case 'ArrayTexture(1)':
          case 'ArrayTexture(2)':
          case 'ArrayTexture(3)':
          case 'ArrayTexture(4)':
          case 'Array':
          case 'Input':
            if (targetType === argumentType) {
              if (argument.type !== 'Identifier') throw this.astErrorOutput(`Unhandled argument type ${ argument.type }`, ast);
              this.triggerImplyArgumentBitRatio(this.name, argument.name, functionName, i);
              retArr.push(`user_${argument.name},user_${argument.name}Size,user_${argument.name}Dim`);
              continue;
            }
            break;
        }
        throw this.astErrorOutput(`Unhandled argument combination of ${ argumentType } and ${ targetType } for argument named "${ argument.name }"`, ast);
      }
    }
    // Close arguments space
    retArr.push(')');

    return retArr;
  }

  /**
   * @desc Parses the abstract syntax tree for *Array* Expression
   * @param {Object} arrNode - the AST object to parse
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astArrayExpression(arrNode, retArr) {
    const arrLen = arrNode.elements.length;

    retArr.push('vec' + arrLen + '(');
    for (let i = 0; i < arrLen; ++i) {
      if (i > 0) {
        retArr.push(', ');
      }
      const subNode = arrNode.elements[i];
      this.astGeneric(subNode, retArr)
    }
    retArr.push(')');

    return retArr;
  }

  memberExpressionXYZ(x, y, z, retArr) {
    if (z) {
      retArr.push(this.memberExpressionPropertyMarkup(z), ', ');
    } else {
      retArr.push('0, ');
    }
    if (y) {
      retArr.push(this.memberExpressionPropertyMarkup(y), ', ');
    } else {
      retArr.push('0, ');
    }
    retArr.push(this.memberExpressionPropertyMarkup(x));
    return retArr;
  }

  memberExpressionPropertyMarkup(property) {
    if (!property) {
      throw new Error('Property not set');
    }
    const type = this.getType(property);
    const result = [];
    switch (type) {
      case 'Number':
      case 'Float':
        this.castValueToInteger(property, result);
        break;
      case 'LiteralInteger':
        this.castLiteralToInteger(property, result);
        break;
      default:
        this.astGeneric(property, result);
    }
    return result.join('');
  }
}

const typeMap = {
  'Array': 'sampler2D',
  'Array(2)': 'vec2',
  'Array(3)': 'vec3',
  'Array(4)': 'vec4',
  'Array2D': 'sampler2D',
  'Array3D': 'sampler2D',
  'Boolean': 'bool',
  'Float': 'float',
  'Input': 'sampler2D',
  'Integer': 'int',
  'Number': 'float',
  'LiteralInteger': 'float',
  'NumberTexture': 'sampler2D',
  'MemoryOptimizedNumberTexture': 'sampler2D',
  'ArrayTexture(1)': 'sampler2D',
  'ArrayTexture(2)': 'sampler2D',
  'ArrayTexture(3)': 'sampler2D',
  'ArrayTexture(4)': 'sampler2D',
  'HTMLVideo': 'sampler2D',
  'HTMLImage': 'sampler2D',
  'HTMLImageArray': 'sampler2DArray',
};

const operatorMap = {
  '===': '==',
  '!==': '!='
};

module.exports = {
  WebGLFunctionNode
};
},{"../function-node":49}],77:[function(require,module,exports){
const { WebGLKernelValueBoolean } = require('./kernel-value/boolean');
const { WebGLKernelValueFloat } = require('./kernel-value/float');
const { WebGLKernelValueInteger } = require('./kernel-value/integer');

const { WebGLKernelValueHTMLImage } = require('./kernel-value/html-image');
const { WebGLKernelValueDynamicHTMLImage } = require('./kernel-value/dynamic-html-image');

const { WebGLKernelValueHTMLVideo } = require('./kernel-value/html-video');
const { WebGLKernelValueDynamicHTMLVideo } = require('./kernel-value/dynamic-html-video');

const { WebGLKernelValueSingleInput } = require('./kernel-value/single-input');
const { WebGLKernelValueDynamicSingleInput } = require('./kernel-value/dynamic-single-input');

const { WebGLKernelValueUnsignedInput } = require('./kernel-value/unsigned-input');
const { WebGLKernelValueDynamicUnsignedInput } = require('./kernel-value/dynamic-unsigned-input');

const { WebGLKernelValueMemoryOptimizedNumberTexture } = require('./kernel-value/memory-optimized-number-texture');
const { WebGLKernelValueDynamicMemoryOptimizedNumberTexture } = require('./kernel-value/dynamic-memory-optimized-number-texture');

const { WebGLKernelValueNumberTexture } = require('./kernel-value/number-texture');
const { WebGLKernelValueDynamicNumberTexture } = require('./kernel-value/dynamic-number-texture');

const { WebGLKernelValueSingleArray } = require('./kernel-value/single-array');
const { WebGLKernelValueDynamicSingleArray } = require('./kernel-value/dynamic-single-array');

const { WebGLKernelValueSingleArray1DI } = require('./kernel-value/single-array1d-i');
const { WebGLKernelValueDynamicSingleArray1DI } = require('./kernel-value/dynamic-single-array1d-i');

const { WebGLKernelValueSingleArray2DI } = require('./kernel-value/single-array2d-i');
const { WebGLKernelValueDynamicSingleArray2DI } = require('./kernel-value/dynamic-single-array2d-i');

const { WebGLKernelValueSingleArray3DI } = require('./kernel-value/single-array3d-i');
const { WebGLKernelValueDynamicSingleArray3DI } = require('./kernel-value/dynamic-single-array3d-i');

const { WebGLKernelValueSingleArray2 } = require('./kernel-value/single-array2');
const { WebGLKernelValueSingleArray3 } = require('./kernel-value/single-array3');
const { WebGLKernelValueSingleArray4 } = require('./kernel-value/single-array4');

const { WebGLKernelValueUnsignedArray } = require('./kernel-value/unsigned-array');
const { WebGLKernelValueDynamicUnsignedArray } = require('./kernel-value/dynamic-unsigned-array');

const kernelValueMaps = {
  unsigned: {
    dynamic: {
      'Boolean': WebGLKernelValueBoolean,
      'Integer': WebGLKernelValueInteger,
      'Float': WebGLKernelValueFloat,
      'Array': WebGLKernelValueDynamicUnsignedArray,
      'Array(2)': false,
      'Array(3)': false,
      'Array(4)': false,
      'Array1D(2)': false,
      'Array1D(3)': false,
      'Array1D(4)': false,
      'Array2D(2)': false,
      'Array2D(3)': false,
      'Array2D(4)': false,
      'Array3D(2)': false,
      'Array3D(3)': false,
      'Array3D(4)': false,
      'Input': WebGLKernelValueDynamicUnsignedInput,
      'NumberTexture': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(1)': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(2)': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(3)': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(4)': WebGLKernelValueDynamicNumberTexture,
      'MemoryOptimizedNumberTexture': WebGLKernelValueDynamicMemoryOptimizedNumberTexture,
      'HTMLImage': WebGLKernelValueDynamicHTMLImage,
      'HTMLImageArray': false,
      'HTMLVideo': WebGLKernelValueDynamicHTMLVideo,
    },
    static: {
      'Boolean': WebGLKernelValueBoolean,
      'Float': WebGLKernelValueFloat,
      'Integer': WebGLKernelValueInteger,
      'Array': WebGLKernelValueUnsignedArray,
      'Array(2)': false,
      'Array(3)': false,
      'Array(4)': false,
      'Array1D(2)': false,
      'Array1D(3)': false,
      'Array1D(4)': false,
      'Array2D(2)': false,
      'Array2D(3)': false,
      'Array2D(4)': false,
      'Array3D(2)': false,
      'Array3D(3)': false,
      'Array3D(4)': false,
      'Input': WebGLKernelValueUnsignedInput,
      'NumberTexture': WebGLKernelValueNumberTexture,
      'ArrayTexture(1)': WebGLKernelValueNumberTexture,
      'ArrayTexture(2)': WebGLKernelValueNumberTexture,
      'ArrayTexture(3)': WebGLKernelValueNumberTexture,
      'ArrayTexture(4)': WebGLKernelValueNumberTexture,
      'MemoryOptimizedNumberTexture': WebGLKernelValueMemoryOptimizedNumberTexture,
      'HTMLImage': WebGLKernelValueHTMLImage,
      'HTMLImageArray': false,
      'HTMLVideo': WebGLKernelValueHTMLVideo,
    }
  },
  single: {
    dynamic: {
      'Boolean': WebGLKernelValueBoolean,
      'Integer': WebGLKernelValueInteger,
      'Float': WebGLKernelValueFloat,
      'Array': WebGLKernelValueDynamicSingleArray,
      'Array(2)': WebGLKernelValueSingleArray2,
      'Array(3)': WebGLKernelValueSingleArray3,
      'Array(4)': WebGLKernelValueSingleArray4,
      'Array1D(2)': WebGLKernelValueDynamicSingleArray1DI,
      'Array1D(3)': WebGLKernelValueDynamicSingleArray1DI,
      'Array1D(4)': WebGLKernelValueDynamicSingleArray1DI,
      'Array2D(2)': WebGLKernelValueDynamicSingleArray2DI,
      'Array2D(3)': WebGLKernelValueDynamicSingleArray2DI,
      'Array2D(4)': WebGLKernelValueDynamicSingleArray2DI,
      'Array3D(2)': WebGLKernelValueDynamicSingleArray3DI,
      'Array3D(3)': WebGLKernelValueDynamicSingleArray3DI,
      'Array3D(4)': WebGLKernelValueDynamicSingleArray3DI,
      'Input': WebGLKernelValueDynamicSingleInput,
      'NumberTexture': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(1)': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(2)': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(3)': WebGLKernelValueDynamicNumberTexture,
      'ArrayTexture(4)': WebGLKernelValueDynamicNumberTexture,
      'MemoryOptimizedNumberTexture': WebGLKernelValueDynamicMemoryOptimizedNumberTexture,
      'HTMLImage': WebGLKernelValueDynamicHTMLImage,
      'HTMLImageArray': false,
      'HTMLVideo': WebGLKernelValueDynamicHTMLVideo,
    },
    static: {
      'Boolean': WebGLKernelValueBoolean,
      'Float': WebGLKernelValueFloat,
      'Integer': WebGLKernelValueInteger,
      'Array': WebGLKernelValueSingleArray,
      'Array(2)': WebGLKernelValueSingleArray2,
      'Array(3)': WebGLKernelValueSingleArray3,
      'Array(4)': WebGLKernelValueSingleArray4,
      'Array1D(2)': WebGLKernelValueSingleArray1DI,
      'Array1D(3)': WebGLKernelValueSingleArray1DI,
      'Array1D(4)': WebGLKernelValueSingleArray1DI,
      'Array2D(2)': WebGLKernelValueSingleArray2DI,
      'Array2D(3)': WebGLKernelValueSingleArray2DI,
      'Array2D(4)': WebGLKernelValueSingleArray2DI,
      'Array3D(2)': WebGLKernelValueSingleArray3DI,
      'Array3D(3)': WebGLKernelValueSingleArray3DI,
      'Array3D(4)': WebGLKernelValueSingleArray3DI,
      'Input': WebGLKernelValueSingleInput,
      'NumberTexture': WebGLKernelValueNumberTexture,
      'ArrayTexture(1)': WebGLKernelValueNumberTexture,
      'ArrayTexture(2)': WebGLKernelValueNumberTexture,
      'ArrayTexture(3)': WebGLKernelValueNumberTexture,
      'ArrayTexture(4)': WebGLKernelValueNumberTexture,
      'MemoryOptimizedNumberTexture': WebGLKernelValueMemoryOptimizedNumberTexture,
      'HTMLImage': WebGLKernelValueHTMLImage,
      'HTMLImageArray': false,
      'HTMLVideo': WebGLKernelValueHTMLVideo,
    }
  },
};

function lookupKernelValueType(type, dynamic, precision, value) {
  if (!type) {
    throw new Error('type missing');
  }
  if (!dynamic) {
    throw new Error('dynamic missing');
  }
  if (!precision) {
    throw new Error('precision missing');
  }
  if (value.type) {
    type = value.type;
  }
  const types = kernelValueMaps[precision][dynamic];
  if (types[type] === false) {
    return null;
  } else if (types[type] === undefined) {
    throw new Error(`Could not find a KernelValue for ${ type }`);
  }
  return types[type];
}

module.exports = {
  lookupKernelValueType,
  kernelValueMaps,
};
},{"./kernel-value/boolean":78,"./kernel-value/dynamic-html-image":79,"./kernel-value/dynamic-html-video":80,"./kernel-value/dynamic-memory-optimized-number-texture":81,"./kernel-value/dynamic-number-texture":82,"./kernel-value/dynamic-single-array":83,"./kernel-value/dynamic-single-array1d-i":84,"./kernel-value/dynamic-single-array2d-i":85,"./kernel-value/dynamic-single-array3d-i":86,"./kernel-value/dynamic-single-input":87,"./kernel-value/dynamic-unsigned-array":88,"./kernel-value/dynamic-unsigned-input":89,"./kernel-value/float":90,"./kernel-value/html-image":91,"./kernel-value/html-video":92,"./kernel-value/integer":94,"./kernel-value/memory-optimized-number-texture":95,"./kernel-value/number-texture":96,"./kernel-value/single-array":97,"./kernel-value/single-array1d-i":98,"./kernel-value/single-array2":99,"./kernel-value/single-array2d-i":100,"./kernel-value/single-array3":101,"./kernel-value/single-array3d-i":102,"./kernel-value/single-array4":103,"./kernel-value/single-input":104,"./kernel-value/unsigned-array":105,"./kernel-value/unsigned-input":106}],78:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueBoolean extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.uploadValue = value;
  }
  getSource(value) {
    if (this.origin === 'constants') {
      return `const bool ${this.id} = ${value};\n`;
    }
    return `uniform bool ${this.id};\n`;
  }

  getStringValueHandler() {
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }

  updateValue(value) {
    if (this.origin === 'constants') return;
    this.kernel.setUniform1i(this.id, this.uploadValue = value);
  }
}

module.exports = {
  WebGLKernelValueBoolean
};
},{"../../../utils":150,"./index":93}],79:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueHTMLImage } = require('./html-image');

class WebGLKernelValueDynamicHTMLImage extends WebGLKernelValueHTMLImage {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    const { width, height } = value;
    this.checkSize(width, height);
    this.dimensions = [width, height, 1];
    this.textureSize = [width, height];
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicHTMLImage
};
},{"../../../utils":150,"./html-image":91}],80:[function(require,module,exports){
const { WebGLKernelValueDynamicHTMLImage } = require('./dynamic-html-image');

class WebGLKernelValueDynamicHTMLVideo extends WebGLKernelValueDynamicHTMLImage {}

module.exports = {
  WebGLKernelValueDynamicHTMLVideo
};
},{"./dynamic-html-image":79}],81:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueMemoryOptimizedNumberTexture } = require('./memory-optimized-number-texture');

class WebGLKernelValueDynamicMemoryOptimizedNumberTexture extends WebGLKernelValueMemoryOptimizedNumberTexture {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(inputTexture) {
    this.checkSize(inputTexture.size[0], inputTexture.size[1]);
    this.dimensions = inputTexture.dimensions;
    this.textureSize = inputTexture.size;
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(inputTexture);
  }
}

module.exports = {
  WebGLKernelValueDynamicMemoryOptimizedNumberTexture
};
},{"../../../utils":150,"./memory-optimized-number-texture":95}],82:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueNumberTexture } = require('./number-texture');

class WebGLKernelValueDynamicNumberTexture extends WebGLKernelValueNumberTexture {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.dimensions = value.dimensions;
    this.checkSize(value.size[0], value.size[1]);
    this.textureSize = value.size;
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicNumberTexture
};
},{"../../../utils":150,"./number-texture":96}],83:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray } = require('./single-array');

class WebGLKernelValueDynamicSingleArray extends WebGLKernelValueSingleArray {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.dimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicSingleArray
};
},{"../../../utils":150,"./single-array":97}],84:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray1DI } = require('./single-array1d-i');

class WebGLKernelValueDynamicSingleArray1DI extends WebGLKernelValueSingleArray1DI {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.setShape(value);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicSingleArray1DI
};
},{"../../../utils":150,"./single-array1d-i":98}],85:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray2DI } = require('./single-array2d-i');

class WebGLKernelValueDynamicSingleArray2DI extends WebGLKernelValueSingleArray2DI {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.setShape(value);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicSingleArray2DI
};
},{"../../../utils":150,"./single-array2d-i":100}],86:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray3DI } = require('./single-array3d-i');

class WebGLKernelValueDynamicSingleArray3DI extends WebGLKernelValueSingleArray3DI {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.setShape(value);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicSingleArray3DI
};
},{"../../../utils":150,"./single-array3d-i":102}],87:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleInput } = require('./single-input');

class WebGLKernelValueDynamicSingleInput extends WebGLKernelValueSingleInput {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    let [w, h, d] = value.size;
    this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicSingleInput
};
},{"../../../utils":150,"./single-input":104}],88:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueUnsignedArray } = require('./unsigned-array');

class WebGLKernelValueDynamicUnsignedArray extends WebGLKernelValueUnsignedArray {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.dimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
    this.checkSize(this.textureSize[0] * (4 / this.bitRatio), this.textureSize[1] * (4 / this.bitRatio));
    const Type = this.getTransferArrayType(value);
    this.preUploadValue = new Type(this.uploadArrayLength);
    this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicUnsignedArray
};
},{"../../../utils":150,"./unsigned-array":105}],89:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueUnsignedInput } = require('./unsigned-input');

class WebGLKernelValueDynamicUnsignedInput extends WebGLKernelValueUnsignedInput {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    let [w, h, d] = value.size;
    this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
    this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
    this.checkSize(this.textureSize[0] * (4 / this.bitRatio), this.textureSize[1] * (4 / this.bitRatio));
    const Type = this.getTransferArrayType(value.value);
    this.preUploadValue = new Type(this.uploadArrayLength);
    this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGLKernelValueDynamicUnsignedInput
};
},{"../../../utils":150,"./unsigned-input":106}],90:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueFloat extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.uploadValue = value;
  }
  getStringValueHandler() {
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }
  getSource(value) {
    if (this.origin === 'constants') {
      if (Number.isInteger(value)) {
        return `const float ${this.id} = ${value}.0;\n`;
      }
      return `const float ${this.id} = ${value};\n`;
    }
    return `uniform float ${this.id};\n`;
  }

  updateValue(value) {
    if (this.origin === 'constants') return;
    this.kernel.setUniform1f(this.id, this.uploadValue = value);
  }
}

module.exports = {
  WebGLKernelValueFloat
};
},{"../../../utils":150,"./index":93}],91:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueHTMLImage extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    const { width, height } = value;
    this.checkSize(width, height);
    this.dimensions = [width, height, 1];
    this.requestTexture();
    this.textureSize = [width, height];
    this.uploadValue = value;
  }

  getStringValueHandler() {
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(inputImage) {
    if (inputImage.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.uploadValue = inputImage);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueHTMLImage
};
},{"../../../utils":150,"./index":93}],92:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueHTMLImage } = require('./html-image');

class WebGLKernelValueHTMLVideo extends WebGLKernelValueHTMLImage {}

module.exports = {
  WebGLKernelValueHTMLVideo
};
},{"../../../utils":150,"./html-image":91}],93:[function(require,module,exports){
const { utils } = require('../../../utils');
const { Input } = require('../../../input');
const { KernelValue } = require('../../kernel-value');

class WebGLKernelValue extends KernelValue {
  /**
   * @param {KernelVariable} value
   * @param {IWebGLKernelValueSettings} settings
   */
  constructor(value, settings) {
    super(value, settings);
    this.dimensionsId = null;
    this.sizeId = null;
    this.initialValueConstructor = value.constructor;
    this.onRequestTexture = settings.onRequestTexture;
    this.onRequestIndex = settings.onRequestIndex;
    this.uploadValue = null;
    this.textureSize = null;
    this.bitRatio = null;
  }

  /**
   *
   * @param {number} width
   * @param {number} height
   */
  checkSize(width, height) {
    if (!this.kernel.validate) return;
    const { maxTextureSize } = this.kernel.constructor.features;
    if (width > maxTextureSize || height > maxTextureSize) {
      if (width > height) {
        throw new Error(`Argument width of ${width} larger than maximum size of ${maxTextureSize} for your GPU`);
      } else {
        throw new Error(`Argument height of ${height} larger than maximum size of ${maxTextureSize} for your GPU`);
      }
    }
  }

  requestTexture() {
    this.texture = this.onRequestTexture();
    this.setupTexture();
  }

  setupTexture() {
    this.contextHandle = this.onRequestContextHandle();
    this.index = this.onRequestIndex();
    this.dimensionsId = this.id + 'Dim';
    this.sizeId = this.id + 'Size';
  }

  getTransferArrayType(value) {
    if (Array.isArray(value[0])) {
      return this.getTransferArrayType(value[0]);
    }
    switch (value.constructor) {
      case Array:
      case Int32Array:
      case Int16Array:
      case Int8Array:
        return Float32Array;
      case Uint8ClampedArray:
      case Uint8Array:
      case Uint16Array:
      case Uint32Array:
      case Float32Array:
      case Float64Array:
        return value.constructor;
    }
    console.warn('Unfamiliar constructor type.  Will go ahead and use, but likley this may result in a transfer of zeros');
    return value.constructor;
  }
  /**
   * @desc Adds kernel parameters to the Value Texture,
   * binding it to the context, etc.
   *
   * @param {Array|Float32Array|Uint16Array} value - The actual Value supplied to the kernel
   * @param {Number} length - the expected total length of the output array
   * @param {Object} [Type]
   * @returns {Float32Array|Uint16Array|Uint8Array} flattened array to transfer
   */
  formatArrayTransfer(value, length, Type) {
    if (utils.isArray(value[0]) || this.optimizeFloatMemory) {
      // not already flat
      const valuesFlat = new Float32Array(length);
      utils.flattenTo(value, valuesFlat);
      return valuesFlat;
    } else {
      switch (value.constructor) {
        case Uint8ClampedArray:
        case Uint8Array:
        case Int8Array:
        case Uint16Array:
        case Int16Array:
        case Float32Array:
        case Int32Array: {
          const valuesFlat = new(Type || value.constructor)(length);
          utils.flattenTo(value, valuesFlat);
          return valuesFlat;
        }
        default: {
          const valuesFlat = new Float32Array(length);
          utils.flattenTo(value, valuesFlat);
          return valuesFlat;
        }
      }
    }
  }

  /**
   * bit storage ratio of source to target 'buffer', i.e. if 8bit array -> 32bit tex = 4
   * @param value
   * @returns {number}
   */
  getBitRatio(value) {
    if (Array.isArray(value[0])) {
      return this.getBitRatio(value[0]);
    } else if (value.constructor === Input) {
      return this.getBitRatio(value.value);
    }
    switch (value.constructor) {
      case Uint8ClampedArray:
      case Uint8Array:
      case Int8Array:
        return 1;
      case Uint16Array:
      case Int16Array:
        return 2;
      case Float32Array:
      case Int32Array:
      default:
        return 4;
    }
  }

  /**
   * Used for when we want a string output of our kernel, so we can still input values to the kernel
   */
  getStringValueHandler() {
    throw new Error(`"getStringValueHandler" not implemented on ${this.constructor.name}`);
  }

  getVariablePrecisionString() {
    switch (this.tactic) {
      case 'speed':
        return 'lowp';
      case 'performance':
        return 'highp';
      case 'balanced':
      default:
        return 'mediump';
    }
  }
}

module.exports = {
  WebGLKernelValue
};
},{"../../../input":146,"../../../utils":150,"../../kernel-value":73}],94:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueInteger extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.uploadValue = value;
  }
  getStringValueHandler() {
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }
  getSource(value) {
    if (this.origin === 'constants') {
      return `const int ${this.id} = ${ parseInt(value) };\n`;
    }
    return `uniform int ${this.id};\n`;
  }

  updateValue(value) {
    if (this.origin === 'constants') return;
    this.kernel.setUniform1i(this.id, this.uploadValue = value);
  }
}

module.exports = {
  WebGLKernelValueInteger
};
},{"../../../utils":150,"./index":93}],95:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueMemoryOptimizedNumberTexture extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    const [width, height] = value.size;
    this.checkSize(width, height);
    this.setupTexture();
    this.dimensions = value.dimensions;
    this.textureSize = value.size;
    this.uploadValue = value.texture;
    this.forceUploadEachRun = true;
  }

  getStringValueHandler() {
    return `const uploadValue_${this.name} = ${this.varName}.texture;\n`;
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(inputTexture) {
    if (inputTexture.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    if (this.checkContext && inputTexture.context !== this.context) {
      throw new Error(`Value ${this.name} (${this.type }) must be from same context`);
    }
    const { context: gl } = this;
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.uploadValue = inputTexture.texture);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueMemoryOptimizedNumberTexture
};
},{"../../../utils":150,"./index":93}],96:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueNumberTexture extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    const [width, height] = value.size;
    this.checkSize(width, height);
    this.setupTexture();
    const { size: textureSize, dimensions } = value;
    this.bitRatio = this.getBitRatio(value);
    this.dimensions = dimensions;
    this.textureSize = textureSize;
    this.uploadValue = value.texture;
    this.forceUploadEachRun = true;
  }

  getStringValueHandler() {
    return `const uploadValue_${this.name} = ${this.varName}.texture;\n`;
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(inputTexture) {
    if (inputTexture.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    if (this.checkContext && inputTexture.context !== this.context) {
      throw new Error(`Value ${this.name} (${this.type}) must be from same context`);
    }
    const { context: gl } = this;
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.uploadValue = inputTexture.texture);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueNumberTexture
};
},{"../../../utils":150,"./index":93}],97:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleArray extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.requestTexture();
    this.bitRatio = 4;
    this.dimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
      `flattenTo(${this.varName}, uploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueSingleArray
};
},{"../../../utils":150,"./index":93}],98:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleArray1DI extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.requestTexture();
    this.bitRatio = 4;
    this.setShape(value);
  }

  setShape(value) {
    const valueDimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(valueDimensions, this.bitRatio);
    this.dimensions = new Int32Array([valueDimensions[1], 1, 1]);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
      `flattenTo(${this.varName}, uploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flatten2dArrayTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueSingleArray1DI
};
},{"../../../utils":150,"./index":93}],99:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleArray2 extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.uploadValue = value;
  }
  getSource(value) {
    if (this.origin === 'constants') {
      return `const vec2 ${this.id} = vec2(${value[0]},${value[1]});\n`;
    }
    return `uniform vec2 ${this.id};\n`;
  }

  getStringValueHandler() {
    // resetting isn't supported for Array(2)
    if (this.origin === 'constants') return '';
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }

  updateValue(value) {
    if (this.origin === 'constants') return;
    this.kernel.setUniform2fv(this.id, this.uploadValue = value);
  }
}

module.exports = {
  WebGLKernelValueSingleArray2
};
},{"../../../utils":150,"./index":93}],100:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleArray2DI extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.requestTexture();
    this.bitRatio = 4;
    this.setShape(value);
  }

  setShape(value) {
    const valueDimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(valueDimensions, this.bitRatio);
    this.dimensions = new Int32Array([valueDimensions[1], valueDimensions[2], 1]);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
      `flattenTo(${this.varName}, uploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flatten3dArrayTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueSingleArray2DI
};
},{"../../../utils":150,"./index":93}],101:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleArray3 extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.uploadValue = value;
  }
  getSource(value) {
    if (this.origin === 'constants') {
      return `const vec3 ${this.id} = vec3(${value[0]},${value[1]},${value[2]});\n`;
    }
    return `uniform vec3 ${this.id};\n`;
  }

  getStringValueHandler() {
    // resetting isn't supported for Array(3)
    if (this.origin === 'constants') return '';
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }

  updateValue(value) {
    if (this.origin === 'constants') return;
    this.kernel.setUniform3fv(this.id, this.uploadValue = value);
  }
}

module.exports = {
  WebGLKernelValueSingleArray3
};
},{"../../../utils":150,"./index":93}],102:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleArray3DI extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.requestTexture();
    this.bitRatio = 4;
    this.setShape(value);
  }

  setShape(value) {
    const valueDimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(valueDimensions, this.bitRatio);
    this.dimensions = new Int32Array([valueDimensions[1], valueDimensions[2], valueDimensions[3]]);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
      `flattenTo(${this.varName}, uploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flatten4dArrayTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueSingleArray3DI
};
},{"../../../utils":150,"./index":93}],103:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleArray4 extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.uploadValue = value;
  }
  getSource(value) {
    if (this.origin === 'constants') {
      return `const vec4 ${this.id} = vec4(${value[0]},${value[1]},${value[2]},${value[3]});\n`;
    }
    return `uniform vec4 ${this.id};\n`;
  }

  getStringValueHandler() {
    // resetting isn't supported for Array(4)
    if (this.origin === 'constants') return '';
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }

  updateValue(value) {
    if (this.origin === 'constants') return;
    this.kernel.setUniform4fv(this.id, this.uploadValue = value);
  }
}

module.exports = {
  WebGLKernelValueSingleArray4
};
},{"../../../utils":150,"./index":93}],104:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueSingleInput extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.requestTexture();
    this.bitRatio = 4;
    let [w, h, d] = value.size;
    this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const uploadValue_${this.name} = new Float32Array(${this.uploadArrayLength})`,
      `flattenTo(${this.varName}.value, uploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(input) {
    if (input.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(input.value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueSingleInput
};
},{"../../../utils":150,"./index":93}],105:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueUnsignedArray extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.requestTexture();
    this.bitRatio = this.getBitRatio(value);
    this.dimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
    this.checkSize(this.textureSize[0] * (4 / this.bitRatio), this.textureSize[1] * (4 / this.bitRatio));
    this.TranserArrayType = this.getTransferArrayType(value);
    this.preUploadValue = new this.TranserArrayType(this.uploadArrayLength);
    this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const preUploadValue_${this.name} = new ${this.TranserArrayType.name}(${this.uploadArrayLength})`,
      `const uploadValue_${this.name} = new Uint8Array(preUploadValue_${this.name}.buffer)`,
      `flattenTo(${this.varName}, preUploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(value, this.preUploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueUnsignedArray
};
},{"../../../utils":150,"./index":93}],106:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('./index');

class WebGLKernelValueUnsignedInput extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.requestTexture();
    this.bitRatio = this.getBitRatio(value);
    const [w, h, d] = value.size;
    this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
    this.textureSize = utils.getMemoryOptimizedPackedTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * (4 / this.bitRatio);
    this.checkSize(this.textureSize[0] * (4 / this.bitRatio), this.textureSize[1] * (4 / this.bitRatio));
    this.TranserArrayType = this.getTransferArrayType(value.value);
    this.preUploadValue = new this.TranserArrayType(this.uploadArrayLength);
    this.uploadValue = new Uint8Array(this.preUploadValue.buffer);
  }

  getStringValueHandler() {
    return utils.linesToString([
      `const preUploadValue_${this.name} = new ${this.TranserArrayType.name}(${this.uploadArrayLength})`,
      `const uploadValue_${this.name} = new Uint8Array(preUploadValue_${this.name}.buffer)`,
      `flattenTo(${this.varName}.value, preUploadValue_${this.name})`,
    ]);
  }

  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(input) {
    if (input.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(input.value, this.preUploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGLKernelValueUnsignedInput
};
},{"../../../utils":150,"./index":93}],107:[function(require,module,exports){
const { GLKernel } = require('../gl/kernel');
const { FunctionBuilder } = require('../function-builder');
const { WebGLFunctionNode } = require('./function-node');
const { utils } = require('../../utils');
const triangleNoise = require('../../plugins/triangle-noise');
const { fragmentShader } = require('./fragment-shader');
const { vertexShader } = require('./vertex-shader');
const { glKernelString } = require('../gl/kernel-string');
const { lookupKernelValueType } = require('./kernel-value-maps');

let isSupported = null;
let testCanvas = null;
let testContext = null;
let testExtensions = null;
let features = null;

const plugins = [triangleNoise];
const canvases = [];
const maxTexSizes = {};


/**
 * @desc Kernel Implementation for WebGL.
 * <p>This builds the shaders and runs them on the GPU,
 * the outputs the result back as float(enabled by default) and Texture.</p>
 *
 * @prop {Object} textureCache - webGl Texture cache
 * @prop {Object} programUniformLocationCache - Location of program variables in memory
 * @prop {Object} framebuffer - Webgl frameBuffer
 * @prop {Object} buffer - WebGL buffer
 * @prop {Object} program - The webGl Program
 * @prop {Object} functionBuilder - Function Builder instance bound to this Kernel
 * @prop {Boolean} pipeline - Set output type to FAST mode (GPU to GPU via Textures), instead of float
 * @prop {String} endianness - Endian information like Little-endian, Big-endian.
 * @prop {Array} argumentTypes - Types of parameters sent to the Kernel
 * @prop {String} compiledFragmentShader - Compiled fragment shader string
 * @prop {String} compiledVertexShader - Compiled Vertical shader string
 * @extends GLKernel
 */
class WebGLKernel extends GLKernel {
  static get isSupported() {
    if (isSupported !== null) {
      return isSupported;
    }
    this.setupFeatureChecks();
    isSupported = this.isContextMatch(testContext);
    return isSupported;
  }

  static setupFeatureChecks() {
    if (typeof document !== 'undefined') {
      testCanvas = document.createElement('canvas');
    } else if (typeof OffscreenCanvas !== 'undefined') {
      testCanvas = new OffscreenCanvas(0, 0);
    }
    if (!testCanvas) return;
    testContext = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!testContext || !testContext.getExtension) return;
    testExtensions = {
      OES_texture_float: testContext.getExtension('OES_texture_float'),
      OES_texture_float_linear: testContext.getExtension('OES_texture_float_linear'),
      OES_element_index_uint: testContext.getExtension('OES_element_index_uint'),
      WEBGL_draw_buffers: testContext.getExtension('WEBGL_draw_buffers'),
    };
    features = this.getFeatures();
  }

  static isContextMatch(context) {
    if (typeof WebGLRenderingContext !== 'undefined') {
      return context instanceof WebGLRenderingContext;
    }
    return false;
  }

  static getFeatures() {
    const isDrawBuffers = this.getIsDrawBuffers();
    return Object.freeze({
      isFloatRead: this.getIsFloatRead(),
      isIntegerDivisionAccurate: this.getIsIntegerDivisionAccurate(),
      isTextureFloat: this.getIsTextureFloat(),
      isDrawBuffers,
      kernelMap: isDrawBuffers,
      channelCount: this.getChannelCount(),
      maxTextureSize: this.getMaxTextureSize(),
    });
  }

  static getIsTextureFloat() {
    return Boolean(testExtensions.OES_texture_float);
  }

  static getIsDrawBuffers() {
    return Boolean(testExtensions.WEBGL_draw_buffers);
  }

  static getChannelCount() {
    return testExtensions.WEBGL_draw_buffers ?
      testContext.getParameter(testExtensions.WEBGL_draw_buffers.MAX_DRAW_BUFFERS_WEBGL) :
      1;
  }

  static getMaxTextureSize() {
    return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
  }

  static lookupKernelValueType(type, dynamic, precision, value) {
    return lookupKernelValueType(type, dynamic, precision, value);
  }

  static get testCanvas() {
    return testCanvas;
  }

  static get testContext() {
    return testContext;
  }

  static get features() {
    return features;
  }

  static get fragmentShader() {
    return fragmentShader;
  }

  static get vertexShader() {
    return vertexShader;
  }

  /**
   *
   * @param {String|IJSONSettings} source
   * @param {IDirectKernelSettings} settings
   */
  constructor(source, settings) {
    super(source, settings);
    this.program = null;
    this.pipeline = settings.pipeline;
    this.endianness = utils.systemEndianness();
    this.extensions = {};
    this.subKernelOutputTextures = null;
    this.argumentTextureCount = 0;
    this.constantTextureCount = 0;
    this.fragShader = null;
    this.vertShader = null;
    this.drawBuffersMap = null;
    this.outputTexture = null;

    /**
     *
     * @type {Int32Array|null}
     */
    this.maxTexSize = null;
    this.switchingKernels = false;
    this.onRequestSwitchKernel = null;

    this.mergeSettings(source.settings || settings);

    /**
     * The thread dimensions, x, y and z
     * @type {Array|null}
     */
    this.threadDim = null;
    this.framebuffer = null;
    this.buffer = null;
    this.textureCache = {};
    this.programUniformLocationCache = {};
    this.uniform1fCache = {};
    this.uniform1iCache = {};
    this.uniform2fCache = {};
    this.uniform2fvCache = {};
    this.uniform2ivCache = {};
    this.uniform3fvCache = {};
    this.uniform3ivCache = {};
    this.uniform4fvCache = {};
    this.uniform4ivCache = {};
  }

  initCanvas() {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      // Default width and height, to fix webgl issue in safari
      canvas.width = 2;
      canvas.height = 2;
      return canvas;
    } else if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(0, 0);
    }
  }

  /**
   *
   * @return {WebGLRenderingContext}
   */
  initContext() {
    const settings = {
      alpha: false,
      depth: false,
      antialias: false
    };
    return this.canvas.getContext('webgl', settings) || this.canvas.getContext('experimental-webgl', settings);
  }

  /**
   *
   * @param {IDirectKernelSettings} settings
   * @return {string[]}
   */
  initPlugins(settings) {
    // default plugins
    const pluginsToUse = [];
    const { source } = this;
    if (typeof source === 'string') {
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (source.match(plugin.functionMatch)) {
          pluginsToUse.push(plugin);
        }
      }
    } else if (typeof source === 'object') {
      // `source` is from object, json
      if (settings.pluginNames) { //TODO: in context of JSON support, pluginNames may not exist here
        for (let i = 0; i < plugins.length; i++) {
          const plugin = plugins[i];
          const usePlugin = settings.pluginNames.some(pluginName => pluginName === plugin.name);
          if (usePlugin) {
            pluginsToUse.push(plugin);
          }
        }
      }
    }
    return pluginsToUse;
  }

  initExtensions() {
    this.extensions = {
      OES_texture_float: this.context.getExtension('OES_texture_float'),
      OES_texture_float_linear: this.context.getExtension('OES_texture_float_linear'),
      OES_element_index_uint: this.context.getExtension('OES_element_index_uint'),
      WEBGL_draw_buffers: this.context.getExtension('WEBGL_draw_buffers'),
      WEBGL_color_buffer_float: this.context.getExtension('WEBGL_color_buffer_float'),
    };
  }

  /**
   * @desc Validate settings related to Kernel, such as dimensions size, and auto output support.
   * @param {IArguments} args
   */
  validateSettings(args) {
    if (!this.validate) {
      this.texSize = utils.getKernelTextureSize({
        optimizeFloatMemory: this.optimizeFloatMemory,
        precision: this.precision,
      }, this.output);
      return;
    }

    const { features } = this.constructor;

    if (this.optimizeFloatMemory === true && !features.isTextureFloat) {
      throw new Error('Float textures are not supported');
    } else if (this.precision === 'single' && !features.isFloatRead) {
      throw new Error('Single precision not supported');
    } else if (!this.graphical && this.precision === null && features.isTextureFloat) {
      this.precision = features.isFloatRead ? 'single' : 'unsigned';
    }

    if (this.subKernels && this.subKernels.length > 0 && !this.extensions.WEBGL_draw_buffers) {
      throw new Error('could not instantiate draw buffers extension');
    }

    if (this.fixIntegerDivisionAccuracy === null) {
      this.fixIntegerDivisionAccuracy = !features.isIntegerDivisionAccurate;
    } else if (this.fixIntegerDivisionAccuracy && features.isIntegerDivisionAccurate) {
      this.fixIntegerDivisionAccuracy = false;
    }

    this.checkOutput();

    if (!this.output || this.output.length === 0) {
      if (args.length !== 1) {
        throw new Error('Auto output only supported for kernels with only one input');
      }

      const argType = utils.getVariableType(args[0], this.strictIntegers);
      switch (argType) {
        case 'Array':
          this.output = utils.getDimensions(argType);
          break;
        case 'NumberTexture':
        case 'MemoryOptimizedNumberTexture':
        case 'ArrayTexture(1)':
        case 'ArrayTexture(2)':
        case 'ArrayTexture(3)':
        case 'ArrayTexture(4)':
          this.output = args[0].output;
          break;
        default:
          throw new Error('Auto output not supported for input type: ' + argType);
      }
    }

    if (this.graphical) {
      if (this.output.length !== 2) {
        throw new Error('Output must have 2 dimensions on graphical mode');
      }

      if (this.precision === 'precision') {
        this.precision = 'unsigned';
        console.warn('Cannot use graphical mode and single precision at the same time');
      }

      this.texSize = utils.clone(this.output);
      return;
    } else if (this.precision === null && features.isTextureFloat) {
      this.precision = 'single';
    }

    this.texSize = utils.getKernelTextureSize({
      optimizeFloatMemory: this.optimizeFloatMemory,
      precision: this.precision,
    }, this.output);

    this.checkTextureSize();
  }

  updateMaxTexSize() {
    const { texSize, canvas } = this;
    if (this.maxTexSize === null) {
      let canvasIndex = canvases.indexOf(canvas);
      if (canvasIndex === -1) {
        canvasIndex = canvases.length;
        canvases.push(canvas);
        maxTexSizes[canvasIndex] = [texSize[0], texSize[1]];
      }
      this.maxTexSize = maxTexSizes[canvasIndex];
    }
    if (this.maxTexSize[0] < texSize[0]) {
      this.maxTexSize[0] = texSize[0];
    }
    if (this.maxTexSize[1] < texSize[1]) {
      this.maxTexSize[1] = texSize[1];
    }
  }

  // TODO: move channel checks to new place
  _oldtranslateSource() {
    const functionBuilder = FunctionBuilder.fromKernel(this, WebGLFunctionNode, {
      fixIntegerDivisionAccuracy: this.fixIntegerDivisionAccuracy
    });

    // need this line to automatically get returnType
    const translatedSource = functionBuilder.getPrototypeString('kernel');

    if (!this.returnType) {
      this.returnType = functionBuilder.getKernelResultType();
    }

    let requiredChannels = 0;
    const returnTypes = functionBuilder.getReturnTypes();
    for (let i = 0; i < returnTypes.length; i++) {
      switch (returnTypes[i]) {
        case 'Float':
        case 'Number':
        case 'Integer':
          requiredChannels++;
          break;
        case 'Array(2)':
          requiredChannels += 2;
          break;
        case 'Array(3)':
          requiredChannels += 3;
          break;
        case 'Array(4)':
          requiredChannels += 4;
          break;
      }
    }

    if (features && requiredChannels > features.channelCount) {
      throw new Error('Too many channels!');
    }

    return this.translatedSource = translatedSource;
  }

  setupArguments(args) {
    this.kernelArguments = [];
    this.argumentTextureCount = 0;
    const needsArgumentTypes = this.argumentTypes === null;
    // TODO: remove
    if (needsArgumentTypes) {
      this.argumentTypes = [];
    }
    this.argumentSizes = [];
    this.argumentBitRatios = [];
    // TODO: end remove

    if (args.length < this.argumentNames.length) {
      throw new Error('not enough arguments for kernel');
    } else if (args.length > this.argumentNames.length) {
      throw new Error('too many arguments for kernel');
    }

    const { context: gl } = this;
    let textureIndexes = 0;
    for (let index = 0; index < args.length; index++) {
      const value = args[index];
      const name = this.argumentNames[index];
      let type;
      if (needsArgumentTypes) {
        type = utils.getVariableType(value, this.strictIntegers);
        this.argumentTypes.push(type);
      } else {
        type = this.argumentTypes[index];
      }
      const KernelValue = this.constructor.lookupKernelValueType(type, this.dynamicArguments ? 'dynamic' : 'static', this.precision, args[index]);
      if (KernelValue === null) {
        return this.requestFallback(args);
      }
      const kernelArgument = new KernelValue(value, {
        name,
        type,
        tactic: this.tactic,
        origin: 'user',
        context: gl,
        checkContext: this.checkContext,
        kernel: this,
        strictIntegers: this.strictIntegers,
        onRequestTexture: () => {
          return this.context.createTexture();
        },
        onRequestIndex: () => {
          return textureIndexes++;
        },
        onUpdateValueMismatch: () => {
          this.switchingKernels = true;
        },
        onRequestContextHandle: () => {
          return gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount++;
        }
      });
      this.kernelArguments.push(kernelArgument);
      this.argumentSizes.push(kernelArgument.textureSize);
      this.argumentBitRatios[index] = kernelArgument.bitRatio;
    }
  }

  setupConstants(args) {
    const { context: gl } = this;
    this.kernelConstants = [];
    this.forceUploadKernelConstants = [];
    let needsConstantTypes = this.constantTypes === null;
    if (needsConstantTypes) {
      this.constantTypes = {};
    }
    this.constantBitRatios = {};
    let textureIndexes = 0;
    for (const name in this.constants) {
      const value = this.constants[name];
      let type;
      if (needsConstantTypes) {
        type = utils.getVariableType(value, this.strictIntegers);
        this.constantTypes[name] = type;
      } else {
        type = this.constantTypes[name];
      }
      const KernelValue = this.constructor.lookupKernelValueType(type, 'static', this.precision, value);
      if (KernelValue === null) {
        return this.requestFallback(args);
      }
      const kernelValue = new KernelValue(value, {
        name,
        type,
        tactic: this.tactic,
        origin: 'constants',
        context: this.context,
        checkContext: this.checkContext,
        kernel: this,
        strictIntegers: this.strictIntegers,
        onRequestTexture: () => {
          return this.context.createTexture();
        },
        onRequestIndex: () => {
          return textureIndexes++;
        },
        onRequestContextHandle: () => {
          return gl.TEXTURE0 + this.constantTextureCount++;
        }
      });
      this.constantBitRatios[name] = kernelValue.bitRatio;
      this.kernelConstants.push(kernelValue);
      if (kernelValue.forceUploadEachRun) {
        this.forceUploadKernelConstants.push(kernelValue);
      }
    }
  }

  build() {
    this.initExtensions();
    this.validateSettings(arguments);
    this.setupConstants(arguments);
    if (this.fallbackRequested) return;
    this.setupArguments(arguments);
    if (this.fallbackRequested) return;
    this.updateMaxTexSize();
    this.translateSource();
    const failureResult = this.pickRenderStrategy(arguments);
    if (failureResult) {
      return failureResult;
    }
    const { texSize, context: gl, canvas } = this;
    gl.enable(gl.SCISSOR_TEST);
    if (this.pipeline && this.precision === 'single') {
      gl.viewport(0, 0, this.maxTexSize[0], this.maxTexSize[1]);
      canvas.width = this.maxTexSize[0];
      canvas.height = this.maxTexSize[1];
    } else {
      gl.viewport(0, 0, this.maxTexSize[0], this.maxTexSize[1]);
      canvas.width = this.maxTexSize[0];
      canvas.height = this.maxTexSize[1];
    }
    const threadDim = this.threadDim = Array.from(this.output);
    while (threadDim.length < 3) {
      threadDim.push(1);
    }

    const compiledVertexShader = this.getVertexShader(arguments);
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, compiledVertexShader);
    gl.compileShader(vertShader);
    this.vertShader = vertShader;

    const compiledFragmentShader = this.getFragmentShader(arguments);
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, compiledFragmentShader);
    gl.compileShader(fragShader);
    this.fragShader = fragShader;

    if (this.debug) {
      console.log('GLSL Shader Output:');
      console.log(compiledFragmentShader);
    }

    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      throw new Error('Error compiling vertex shader: ' + gl.getShaderInfoLog(vertShader));
    }
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      throw new Error('Error compiling fragment shader: ' + gl.getShaderInfoLog(fragShader));
    }

    const program = this.program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    this.framebuffer = gl.createFramebuffer();
    this.framebuffer.width = texSize[0];
    this.framebuffer.height = texSize[1];

    const vertices = new Float32Array([-1, -1,
      1, -1, -1, 1,
      1, 1
    ]);
    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ]);

    const texCoordOffset = vertices.byteLength;

    let buffer = this.buffer;
    if (!buffer) {
      buffer = this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength + texCoords.byteLength, gl.STATIC_DRAW);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    }

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);

    const aPosLoc = gl.getAttribLocation(this.program, 'aPos');
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);
    const aTexCoordLoc = gl.getAttribLocation(this.program, 'aTexCoord');
    gl.enableVertexAttribArray(aTexCoordLoc);
    gl.vertexAttribPointer(aTexCoordLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    let i = 0;
    gl.useProgram(this.program);
    for (let p in this.constants) {
      this.kernelConstants[i++].updateValue(this.constants[p]);
    }

    if (!this.immutable) {
      this._setupOutputTexture();
      if (
        this.subKernels !== null &&
        this.subKernels.length > 0
      ) {
        this._setupSubOutputTextures();
      }
    }
  }

  translateSource() {
    const functionBuilder = FunctionBuilder.fromKernel(this, WebGLFunctionNode, {
      fixIntegerDivisionAccuracy: this.fixIntegerDivisionAccuracy
    });
    this.translatedSource = functionBuilder.getPrototypeString('kernel');
    this.setupReturnTypes(functionBuilder);
  }

  setupReturnTypes(functionBuilder) {
    if (!this.graphical && !this.returnType) {
      this.returnType = functionBuilder.getKernelResultType();
    }

    if (this.subKernels && this.subKernels.length > 0) {
      for (let i = 0; i < this.subKernels.length; i++) {
        const subKernel = this.subKernels[i];
        if (!subKernel.returnType) {
          subKernel.returnType = functionBuilder.getSubKernelResultType(i);
        }
      }
    }
  }

  run() {
    const { kernelArguments, texSize, forceUploadKernelConstants } = this;
    const gl = this.context;

    gl.useProgram(this.program);
    gl.scissor(0, 0, texSize[0], texSize[1]);

    if (this.dynamicOutput) {
      this.setUniform3iv('uOutputDim', new Int32Array(this.threadDim));
      this.setUniform2iv('uTexSize', texSize);
    }

    this.setUniform2f('ratio', texSize[0] / this.maxTexSize[0], texSize[1] / this.maxTexSize[1]);

    this.switchingKernels = false;
    for (let i = 0; i < forceUploadKernelConstants.length; i++) {
      const constant = forceUploadKernelConstants[i];
      constant.updateValue(this.constants[constant.name]);
      if (this.switchingKernels) return;
    }
    for (let i = 0; i < kernelArguments.length; i++) {
      kernelArguments[i].updateValue(arguments[i]);
      if (this.switchingKernels) return;
    }

    if (this.plugins) {
      for (let i = 0; i < this.plugins.length; i++) {
        const plugin = this.plugins[i];
        if (plugin.onBeforeRun) {
          plugin.onBeforeRun(this);
        }
      }
    }

    if (this.graphical) {
      if (this.pipeline) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        if (!this.outputTexture || this.immutable) {
          this._setupOutputTexture();
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        return new this.TextureConstructor({
          texture: this.outputTexture,
          size: texSize,
          dimensions: this.threadDim,
          output: this.output,
          context: this.context,
        });
      }
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    if (this.immutable) {
      this._setupOutputTexture();
    }

    if (this.subKernels !== null) {
      if (this.immutable) {
        this._setupSubOutputTextures();
      }
      this.drawBuffers();
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  drawBuffers() {
    this.extensions.WEBGL_draw_buffers.drawBuffersWEBGL(this.drawBuffersMap);
  }

  /**
   * @desc Setup and replace output texture
   */
  _setupOutputTexture() {
    const gl = this.context;
    const texSize = this.texSize;
    const texture = this.outputTexture = this.context.createTexture();
    gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // if (this.precision === 'single') {
    //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
    // } else {
    //   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // }
    if (this.precision === 'single') {
      if (this.pipeline) {
        // TODO: investigate if webgl1 can handle gl.RED usage in gl.texImage2D, otherwise, simplify the below
        switch (this.returnType) {
          case 'Number':
          case 'Float':
          case 'Integer':
            if (this.optimizeFloatMemory) {
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
            } else {
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
            }
            break;
          case 'Array(2)':
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
            break;
          case 'Array(3)':
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
            break;
          case 'Array(4)':
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
            break;
          default:
            if (!this.graphical) {
              throw new Error('Unhandled return type');
            }
        }
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
      }
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }

  /**
   * @desc Setup and replace sub-output textures
   */
  _setupSubOutputTextures() {
    const gl = this.context;
    const texSize = this.texSize;
    this.drawBuffersMap = [gl.COLOR_ATTACHMENT0];
    this.subKernelOutputTextures = [];
    for (let i = 0; i < this.subKernels.length; i++) {
      const texture = this.context.createTexture();
      this.subKernelOutputTextures.push(texture);
      this.drawBuffersMap.push(gl.COLOR_ATTACHMENT0 + i + 1);
      gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount + i);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      if (this.precision === 'single') {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i + 1, gl.TEXTURE_2D, texture, 0);
    }
  }

  setUniform1f(name, value) {
    if (this.uniform1fCache.hasOwnProperty(name)) {
      const cache = this.uniform1fCache[name];
      if (value === cache) {
        return;
      }
    }
    this.uniform1fCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform1f(loc, value);
  }

  setUniform1i(name, value) {
    if (this.uniform1iCache.hasOwnProperty(name)) {
      const cache = this.uniform1iCache[name];
      if (value === cache) {
        return;
      }
    }
    this.uniform1iCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform1i(loc, value);
  }

  setUniform2f(name, value1, value2) {
    if (this.uniform2fCache.hasOwnProperty(name)) {
      const cache = this.uniform2fCache[name];
      if (
        value1 === cache[0] &&
        value2 === cache[1]
      ) {
        return;
      }
    }
    this.uniform2fCache[name] = [value1, value2];
    const loc = this.getUniformLocation(name);
    this.context.uniform2f(loc, value1, value2);
  }

  setUniform2fv(name, value) {
    if (this.uniform2fvCache.hasOwnProperty(name)) {
      const cache = this.uniform2fvCache[name];
      if (
        value[0] === cache[0] &&
        value[1] === cache[1]
      ) {
        return;
      }
    }
    this.uniform2fvCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform2fv(loc, value);
  }

  setUniform2iv(name, value) {
    if (this.uniform2ivCache.hasOwnProperty(name)) {
      const cache = this.uniform2ivCache[name];
      if (
        value[0] === cache[0] &&
        value[1] === cache[1]
      ) {
        return;
      }
    }
    this.uniform2ivCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform2iv(loc, value);
  }

  setUniform3fv(name, value) {
    if (this.uniform3fvCache.hasOwnProperty(name)) {
      const cache = this.uniform3fvCache[name];
      if (
        value[0] === cache[0] &&
        value[1] === cache[1] &&
        value[2] === cache[2]
      ) {
        return;
      }
    }
    this.uniform3fvCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform3fv(loc, value);
  }

  setUniform3iv(name, value) {
    if (this.uniform3ivCache.hasOwnProperty(name)) {
      const cache = this.uniform3ivCache[name];
      if (
        value[0] === cache[0] &&
        value[1] === cache[1] &&
        value[2] === cache[2]
      ) {
        return;
      }
    }
    this.uniform3ivCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform3iv(loc, value);
  }

  setUniform4fv(name, value) {
    if (this.uniform4fvCache.hasOwnProperty(name)) {
      const cache = this.uniform4fvCache[name];
      if (
        value[0] === cache[0] &&
        value[1] === cache[1] &&
        value[2] === cache[2] &&
        value[3] === cache[3]
      ) {
        return;
      }
    }
    this.uniform4fvCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform4fv(loc, value);
  }

  setUniform4iv(name, value) {
    if (this.uniform4ivCache.hasOwnProperty(name)) {
      const cache = this.uniform4ivCache[name];
      if (
        value[0] === cache[0] &&
        value[1] === cache[1] &&
        value[2] === cache[2] &&
        value[3] === cache[3]
      ) {
        return;
      }
    }
    this.uniform4ivCache[name] = value;
    const loc = this.getUniformLocation(name);
    this.context.uniform4iv(loc, value);
  }

  /**
   * @desc Return WebGlUniformLocation for various variables
   * related to webGl program, such as user-defined variables,
   * as well as, dimension sizes, etc.
   */
  getUniformLocation(name) {
    if (this.programUniformLocationCache.hasOwnProperty(name)) {
      return this.programUniformLocationCache[name];
    }
    return this.programUniformLocationCache[name] = this.context.getUniformLocation(this.program, name);
  }

  /**
   * @desc Generate Shader artifacts for the kernel program.
   * The final object contains HEADER, KERNEL, MAIN_RESULT, and others.
   *
   * @param {Array} args - The actual parameters sent to the Kernel
   * @returns {Object} An object containing the Shader Artifacts(CONSTANTS, HEADER, KERNEL, etc.)
   */
  _getFragShaderArtifactMap(args) {
    return {
      HEADER: this._getHeaderString(),
      LOOP_MAX: this._getLoopMaxString(),
      PLUGINS: this._getPluginsString(),
      CONSTANTS: this._getConstantsString(),
      DECODE32_ENDIANNESS: this._getDecode32EndiannessString(),
      ENCODE32_ENDIANNESS: this._getEncode32EndiannessString(),
      DIVIDE_WITH_INTEGER_CHECK: this._getDivideWithIntegerCheckString(),
      INJECTED_NATIVE: this._getInjectedNative(),
      MAIN_CONSTANTS: this._getMainConstantsString(),
      MAIN_ARGUMENTS: this._getMainArgumentsString(args),
      KERNEL: this.getKernelString(),
      MAIN_RESULT: this.getMainResultString(),
      FLOAT_TACTIC_DECLARATION: this.getFloatTacticDeclaration(),
      INT_TACTIC_DECLARATION: this.getIntTacticDeclaration(),
      SAMPLER_2D_TACTIC_DECLARATION: this.getSampler2DTacticDeclaration(),
      SAMPLER_2D_ARRAY_TACTIC_DECLARATION: this.getSampler2DArrayTacticDeclaration(),
    };
  }

  /**
   * @desc Generate Shader artifacts for the kernel program.
   * The final object contains HEADER, KERNEL, MAIN_RESULT, and others.
   *
   * @param {Array} args - The actual parameters sent to the Kernel
   * @returns {Object} An object containing the Shader Artifacts(CONSTANTS, HEADER, KERNEL, etc.)
   */
  _getVertShaderArtifactMap(args) {
    return {
      FLOAT_TACTIC_DECLARATION: this.getFloatTacticDeclaration(),
      INT_TACTIC_DECLARATION: this.getIntTacticDeclaration(),
      SAMPLER_2D_TACTIC_DECLARATION: this.getSampler2DTacticDeclaration(),
      SAMPLER_2D_ARRAY_TACTIC_DECLARATION: this.getSampler2DArrayTacticDeclaration(),
    };
  }

  /**
   * @desc Get the header string for the program.
   * This returns an empty string if no sub-kernels are defined.
   *
   * @returns {String} result
   */
  _getHeaderString() {
    return (
      this.subKernels !== null ?
      '#extension GL_EXT_draw_buffers : require\n' :
      ''
    );
  }

  /**
   * @desc Get the maximum loop size String.
   * @returns {String} result
   */
  _getLoopMaxString() {
    return (
      this.loopMaxIterations ?
      ` ${parseInt(this.loopMaxIterations)};\n` :
      ' 1000;\n'
    );
  }

  _getPluginsString() {
    if (!this.plugins) return '\n';
    return this.plugins.map(plugin => plugin.source && this.source.match(plugin.functionMatch) ? plugin.source : '').join('\n');
  }

  /**
   * @desc Generate transpiled glsl Strings for constant parameters sent to a kernel
   * @returns {String} result
   */
  _getConstantsString() {
    const result = [];
    const { threadDim, texSize } = this;
    if (this.dynamicOutput) {
      result.push(
        'uniform ivec3 uOutputDim',
        'uniform ivec2 uTexSize'
      );
    } else {
      result.push(
        `ivec3 uOutputDim = ivec3(${threadDim[0]}, ${threadDim[1]}, ${threadDim[2]})`,
        `ivec2 uTexSize = ivec2(${texSize[0]}, ${texSize[1]})`
      );
    }
    return utils.linesToString(result);
  }

  /**
   * @desc Get texture coordinate string for the program
   * @returns {String} result
   */
  _getTextureCoordinate() {
    const subKernels = this.subKernels;
    if (subKernels === null || subKernels.length < 1) {
      return 'varying vec2 vTexCoord;\n';
    } else {
      return 'out vec2 vTexCoord;\n';
    }
  }

  /**
   * @desc Get Decode32 endianness string for little-endian and big-endian
   * @returns {String} result
   */
  _getDecode32EndiannessString() {
    return (
      this.endianness === 'LE' ?
      '' :
      '  texel.rgba = texel.abgr;\n'
    );
  }

  /**
   * @desc Get Encode32 endianness string for little-endian and big-endian
   * @returns {String} result
   */
  _getEncode32EndiannessString() {
    return (
      this.endianness === 'LE' ?
      '' :
      '  texel.rgba = texel.abgr;\n'
    );
  }

  /**
   * @desc if fixIntegerDivisionAccuracy provide method to replace /
   * @returns {String} result
   */
  _getDivideWithIntegerCheckString() {
    return this.fixIntegerDivisionAccuracy ?
      `float div_with_int_check(float x, float y) {
  if (floor(x) == x && floor(y) == y && integerMod(x, y) == 0.0) {
    return float(int(x)/int(y));
  }
  return x / y;
}` :
      '';
  }

  /**
   * @desc Generate transpiled glsl Strings for user-defined parameters sent to a kernel
   * @param {Array} args - The actual parameters sent to the Kernel
   * @returns {String} result
   */
  _getMainArgumentsString(args) {
    const results = [];
    const { argumentNames } = this;
    for (let i = 0; i < argumentNames.length; i++) {
      results.push(this.kernelArguments[i].getSource(args[i]));
    }
    return results.join('');
  }

  _getInjectedNative() {
    return this.injectedNative || '';
  }

  _getMainConstantsString() {
    const result = [];
    const { constants } = this;
    if (constants) {
      let i = 0;
      for (const name in constants) {
        if (!this.constants.hasOwnProperty(name)) continue;
        result.push(this.kernelConstants[i++].getSource(this.constants[name]));
      }
    }
    return result.join('');
  }

  getKernelResultDeclaration() {
    switch (this.returnType) {
      case 'Array(2)':
        return 'vec2 kernelResult';
      case 'Array(3)':
        return 'vec3 kernelResult';
      case 'Array(4)':
        return 'vec4 kernelResult';
      case 'LiteralInteger':
      case 'Float':
      case 'Number':
      case 'Integer':
        return 'float kernelResult';
      default:
        if (this.graphical) {
          return 'float kernelResult';
        } else {
          throw new Error(`unrecognized output type "${ this.returnType }"`);
        }
    }
  }
  /**
   * @desc Get Kernel program string (in *glsl*) for a kernel.
   * @returns {String} result
   */
  getKernelString() {
    const result = [this.getKernelResultDeclaration()];
    const { subKernels } = this;
    if (subKernels !== null) {
      switch (this.returnType) {
        case 'Number':
        case 'Float':
        case 'Integer':
          for (let i = 0; i < subKernels.length; i++) {
            const subKernel = subKernels[i];
            result.push(
              subKernel.returnType === 'Integer' ?
              `int subKernelResult_${ subKernel.name } = 0` :
              `float subKernelResult_${ subKernel.name } = 0.0`
            );
          }
          break;
        case 'Array(2)':
          for (let i = 0; i < subKernels.length; i++) {
            result.push(
              `vec2 subKernelResult_${ subKernels[i].name }`
            );
          }
          break;
        case 'Array(3)':
          for (let i = 0; i < subKernels.length; i++) {
            result.push(
              `vec3 subKernelResult_${ subKernels[i].name }`
            );
          }
          break;
        case 'Array(4)':
          for (let i = 0; i < subKernels.length; i++) {
            result.push(
              `vec4 subKernelResult_${ subKernels[i].name }`
            );
          }
          break;
      }
    }

    return utils.linesToString(result) + this.translatedSource;
  }

  getMainResultGraphical() {
    return utils.linesToString([
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  gl_FragColor = actualColor',
    ]);
  }

  getMainResultPackedPixels() {
    switch (this.returnType) {
      case 'LiteralInteger':
      case 'Number':
      case 'Integer':
      case 'Float':
        return this.getMainResultKernelPackedPixels() +
          this.getMainResultSubKernelPackedPixels();
      default:
        throw new Error(`packed output only usable with Numbers, "${this.returnType}" specified`);
    }
  }

  /**
   * @return {String}
   */
  getMainResultKernelPackedPixels() {
    return utils.linesToString([
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      `  gl_FragData[0] = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(kernelResult)`
    ]);
  }

  /**
   * @return {String}
   */
  getMainResultSubKernelPackedPixels() {
    const result = [];
    if (!this.subKernels) return '';
    for (let i = 0; i < this.subKernels.length; i++) {
      const subKernel = this.subKernels[i];
      if (subKernel.returnType === 'Integer') {
        result.push(
          `  gl_FragData[${i + 1}] = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(float(subKernelResult_${this.subKernels[i].name}))`
        );
      } else {
        result.push(
          `  gl_FragData[${i + 1}] = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(subKernelResult_${this.subKernels[i].name})`
        );
      }
    }
    return utils.linesToString(result);
  }

  getMainResultMemoryOptimizedFloats() {
    const result = [
      '  index *= 4',
    ];

    switch (this.returnType) {
      case 'Number':
      case 'Integer':
      case 'Float':
        const channels = ['r', 'g', 'b', 'a'];
        for (let i = 0; i < channels.length; i++) {
          const channel = channels[i];
          this.getMainResultKernelMemoryOptimizedFloats(result, channel);
          this.getMainResultSubKernelMemoryOptimizedFloats(result, channel);
          if (i + 1 < channels.length) {
            result.push('  index += 1');
          }
        }
        break;
      default:
        throw new Error(`optimized output only usable with Numbers, ${this.returnType} specified`);
    }

    return utils.linesToString(result);
  }

  getMainResultKernelMemoryOptimizedFloats(result, channel) {
    result.push(
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      `  gl_FragData[0].${channel} = kernelResult`,
    );
  }

  getMainResultSubKernelMemoryOptimizedFloats(result, channel) {
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; i++) {
      const subKernel = this.subKernels[i];
      if (subKernel.returnType === 'Integer') {
        result.push(
          `  gl_FragData[${i + 1}].${channel} = float(subKernelResult_${this.subKernels[i].name})`,
        );
      } else {
        result.push(
          `  gl_FragData[${i + 1}].${channel} = subKernelResult_${this.subKernels[i].name}`,
        );
      }
    }
  }

  getMainResultKernelNumberTexture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  gl_FragData[0][0] = kernelResult',
    ];
  }

  getMainResultSubKernelNumberTexture() {
    const result = [];
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; ++i) {
      const subKernel = this.subKernels[i];
      if (subKernel.returnType === 'Integer') {
        result.push(
          `  gl_FragData[${i + 1}][0] = float(subKernelResult_${subKernel.name})`,
        );
      } else {
        result.push(
          `  gl_FragData[${i + 1}][0] = subKernelResult_${subKernel.name}`,
        );
      }
    }
    return result;
  }

  getMainResultKernelArray2Texture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  gl_FragData[0][0] = kernelResult[0]',
      '  gl_FragData[0][1] = kernelResult[1]',
    ];
  }

  getMainResultSubKernelArray2Texture() {
    const result = [];
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; ++i) {
      result.push(
        `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
        `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
      );
    }
    return result;
  }

  getMainResultKernelArray3Texture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  gl_FragData[0][0] = kernelResult[0]',
      '  gl_FragData[0][1] = kernelResult[1]',
      '  gl_FragData[0][2] = kernelResult[2]',
    ];
  }

  getMainResultSubKernelArray3Texture() {
    const result = [];
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; ++i) {
      result.push(
        `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
        `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
        `  gl_FragData[${i + 1}][2] = subKernelResult_${this.subKernels[i].name}[2]`,
      );
    }
    return result;
  }

  getMainResultKernelArray4Texture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  gl_FragData[0] = kernelResult',
    ];
  }

  getMainResultSubKernelArray4Texture() {
    const result = [];
    if (!this.subKernels) return result;
    switch (this.returnType) {
      case 'Number':
      case 'Float':
      case 'Integer':
        for (let i = 0; i < this.subKernels.length; ++i) {
          const subKernel = this.subKernels[i];
          if (subKernel.returnType === 'Integer') {
            result.push(
              `  gl_FragData[${i + 1}] = float(subKernelResult_${this.subKernels[i].name})`,
            );
          } else {
            result.push(
              `  gl_FragData[${i + 1}] = subKernelResult_${this.subKernels[i].name}`,
            );
          }
        }
        break;
      case 'Array(2)':
        for (let i = 0; i < this.subKernels.length; ++i) {
          result.push(
            `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
            `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
          );
        }
        break;
      case 'Array(3)':
        for (let i = 0; i < this.subKernels.length; ++i) {
          result.push(
            `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
            `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
            `  gl_FragData[${i + 1}][2] = subKernelResult_${this.subKernels[i].name}[2]`,
          );
        }
        break;
      case 'Array(4)':
        for (let i = 0; i < this.subKernels.length; ++i) {
          result.push(
            `  gl_FragData[${i + 1}][0] = subKernelResult_${this.subKernels[i].name}[0]`,
            `  gl_FragData[${i + 1}][1] = subKernelResult_${this.subKernels[i].name}[1]`,
            `  gl_FragData[${i + 1}][2] = subKernelResult_${this.subKernels[i].name}[2]`,
            `  gl_FragData[${i + 1}][3] = subKernelResult_${this.subKernels[i].name}[3]`,
          );
        }
        break;
    }

    return result;
  }

  /**
   * @param {String} src - Shader string
   * @param {Object} map - Variables/Constants associated with shader
   */
  replaceArtifacts(src, map) {
    return src.replace(/[ ]*__([A-Z]+[0-9]*([_]?[A-Z]*[0-9]?)*)__;\n/g, (match, artifact) => {
      if (map.hasOwnProperty(artifact)) {
        return map[artifact];
      }
      throw `unhandled artifact ${artifact}`;
    });
  }

  /**
   * @desc Get the fragment shader String.
   * If the String hasn't been compiled yet,
   * then this method compiles it as well
   *
   * @param {Array} args - The actual parameters sent to the Kernel
   * @returns {string} Fragment Shader string
   */
  getFragmentShader(args) {
    if (this.compiledFragmentShader !== null) {
      return this.compiledFragmentShader;
    }
    return this.compiledFragmentShader = this.replaceArtifacts(this.constructor.fragmentShader, this._getFragShaderArtifactMap(args));
  }

  /**
   * @desc Get the vertical shader String
   * @param {Array|IArguments} args - The actual parameters sent to the Kernel
   * @returns {string} Vertical Shader string
   */
  getVertexShader(args) {
    if (this.compiledVertexShader !== null) {
      return this.compiledVertexShader;
    }
    return this.compiledVertexShader = this.replaceArtifacts(this.constructor.vertexShader, this._getVertShaderArtifactMap(args));
  }

  /**
   * @desc Returns the *pre-compiled* Kernel as a JS Object String, that can be reused.
   */
  toString() {
    const setupContextString = utils.linesToString([
      `const gl = context`,
    ]);
    return glKernelString(this.constructor, arguments, this, setupContextString);
  }

  destroy(removeCanvasReferences) {
    if (this.outputTexture) {
      this.context.deleteTexture(this.outputTexture);
    }
    if (this.buffer) {
      this.context.deleteBuffer(this.buffer);
    }
    if (this.framebuffer) {
      this.context.deleteFramebuffer(this.framebuffer);
    }
    if (this.vertShader) {
      this.context.deleteShader(this.vertShader);
    }
    if (this.fragShader) {
      this.context.deleteShader(this.fragShader);
    }
    if (this.program) {
      this.context.deleteProgram(this.program);
    }

    const keys = Object.keys(this.textureCache);

    for (let i = 0; i < keys.length; i++) {
      const name = keys[i];
      this.context.deleteTexture(this.textureCache[name]);
    }

    if (this.subKernelOutputTextures) {
      for (let i = 0; i < this.subKernelOutputTextures.length; i++) {
        this.context.deleteTexture(this.subKernelOutputTextures[i]);
      }
    }
    if (removeCanvasReferences) {
      const idx = canvases.indexOf(this.canvas);
      if (idx >= 0) {
        canvases[idx] = null;
        maxTexSizes[idx] = null;
      }
    }
    this.destroyExtensions();
    delete this.context;
    delete this.canvas;
  }

  destroyExtensions() {
    this.extensions.OES_texture_float = null;
    this.extensions.OES_texture_float_linear = null;
    this.extensions.OES_element_index_uint = null;
    this.extensions.WEBGL_draw_buffers = null;
  }

  static destroyContext(context) {
    const extension = context.getExtension('WEBGL_lose_context');
    if (extension) {
      extension.loseContext();
    }
  }

  /**
   * @return {IJSON}
   */
  toJSON() {
    const json = super.toJSON();
    json.functionNodes = FunctionBuilder.fromKernel(this, WebGLFunctionNode).toJSON();
    json.settings.threadDim = this.threadDim;
    return json;
  }
}

module.exports = {
  WebGLKernel
};
},{"../../plugins/triangle-noise":148,"../../utils":150,"../function-builder":48,"../gl/kernel":52,"../gl/kernel-string":51,"./fragment-shader":75,"./function-node":76,"./kernel-value-maps":77,"./vertex-shader":108}],108:[function(require,module,exports){
// language=GLSL
const vertexShader = `__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;

attribute vec2 aPos;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;
uniform vec2 ratio;

void main(void) {
  gl_Position = vec4((aPos + vec2(1)) * ratio + vec2(-1), 0, 1);
  vTexCoord = aTexCoord;
}`;

module.exports = {
  vertexShader
};
},{}],109:[function(require,module,exports){
// language=GLSL
const fragmentShader = `#version 300 es
__HEADER__;
__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;
__SAMPLER_2D_ARRAY_TACTIC_DECLARATION__;

const int LOOP_MAX = __LOOP_MAX__;

__PLUGINS__;
__CONSTANTS__;

in vec2 vTexCoord;

const int BIT_COUNT = 32;
int modi(int x, int y) {
  return x - y * (x / y);
}

int bitwiseOr(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) || (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseXOR(int a, int b) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) != (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 || b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseAnd(int a, int b) {
  int result = 0;
  int n = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if ((modi(a, 2) == 1) && (modi(b, 2) == 1)) {
      result += n;
    }
    a = a / 2;
    b = b / 2;
    n = n * 2;
    if(!(a > 0 && b > 0)) {
      break;
    }
  }
  return result;
}
int bitwiseNot(int a) {
  int result = 0;
  int n = 1;
  
  for (int i = 0; i < BIT_COUNT; i++) {
    if (modi(a, 2) == 0) {
      result += n;    
    }
    a = a / 2;
    n = n * 2;
  }
  return result;
}
int bitwiseZeroFillLeftShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n *= 2;
  }

  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

int bitwiseSignedRightShift(int num, int shifts) {
  return int(floor(float(num) / pow(2.0, float(shifts))));
}

int bitwiseZeroFillRightShift(int n, int shift) {
  int maxBytes = BIT_COUNT;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (maxBytes >= n) {
      break;
    }
    maxBytes *= 2;
  }
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= shift) {
      break;
    }
    n /= 2;
  }
  int result = 0;
  int byteVal = 1;
  for (int i = 0; i < BIT_COUNT; i++) {
    if (i >= maxBytes) break;
    if (modi(n, 2) > 0) { result += byteVal; }
    n = int(n / 2);
    byteVal *= 2;
  }
  return result;
}

vec2 integerMod(vec2 x, float y) {
  vec2 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec3 integerMod(vec3 x, float y) {
  vec3 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

vec4 integerMod(vec4 x, vec4 y) {
  vec4 res = floor(mod(x, y));
  return res * step(1.0 - floor(y), -res);
}

float integerMod(float x, float y) {
  float res = floor(mod(x, y));
  return res * (res > floor(y) - 1.0 ? 0.0 : 1.0);
}

int integerMod(int x, int y) {
  return x - (y * int(x/y));
}

__DIVIDE_WITH_INTEGER_CHECK__;

// Here be dragons!
// DO NOT OPTIMIZE THIS CODE
// YOU WILL BREAK SOMETHING ON SOMEBODY\'S MACHINE
// LEAVE IT AS IT IS, LEST YOU WASTE YOUR OWN TIME
const vec2 MAGIC_VEC = vec2(1.0, -256.0);
const vec4 SCALE_FACTOR = vec4(1.0, 256.0, 65536.0, 0.0);
const vec4 SCALE_FACTOR_INV = vec4(1.0, 0.00390625, 0.0000152587890625, 0.0); // 1, 1/256, 1/65536
float decode32(vec4 texel) {
  __DECODE32_ENDIANNESS__;
  texel *= 255.0;
  vec2 gte128;
  gte128.x = texel.b >= 128.0 ? 1.0 : 0.0;
  gte128.y = texel.a >= 128.0 ? 1.0 : 0.0;
  float exponent = 2.0 * texel.a - 127.0 + dot(gte128, MAGIC_VEC);
  float res = exp2(round(exponent));
  texel.b = texel.b - 128.0 * gte128.x;
  res = dot(texel, SCALE_FACTOR) * exp2(round(exponent-23.0)) + res;
  res *= gte128.y * -2.0 + 1.0;
  return res;
}

float decode16(vec4 texel, int index) {
  int channel = integerMod(index, 2);
  return texel[channel*2] * 255.0 + texel[channel*2 + 1] * 65280.0;
}

float decode8(vec4 texel, int index) {
  int channel = integerMod(index, 4);
  return texel[channel] * 255.0;
}

vec4 legacyEncode32(float f) {
  float F = abs(f);
  float sign = f < 0.0 ? 1.0 : 0.0;
  float exponent = floor(log2(F));
  float mantissa = (exp2(-exponent) * F);
  // exponent += floor(log2(mantissa));
  vec4 texel = vec4(F * exp2(23.0-exponent)) * SCALE_FACTOR_INV;
  texel.rg = integerMod(texel.rg, 256.0);
  texel.b = integerMod(texel.b, 128.0);
  texel.a = exponent*0.5 + 63.5;
  texel.ba += vec2(integerMod(exponent+127.0, 2.0), sign) * 128.0;
  texel = floor(texel);
  texel *= 0.003921569; // 1/255
  __ENCODE32_ENDIANNESS__;
  return texel;
}

// https://github.com/gpujs/gpu.js/wiki/Encoder-details
vec4 encode32(float value) {
  if (value == 0.0) return vec4(0, 0, 0, 0);

  float exponent;
  float mantissa;
  vec4  result;
  float sgn;

  sgn = step(0.0, -value);
  value = abs(value);

  exponent = floor(log2(value));

  mantissa = value*pow(2.0, -exponent)-1.0;
  exponent = exponent+127.0;
  result   = vec4(0,0,0,0);

  result.a = floor(exponent/2.0);
  exponent = exponent - result.a*2.0;
  result.a = result.a + 128.0*sgn;

  result.b = floor(mantissa * 128.0);
  mantissa = mantissa - result.b / 128.0;
  result.b = result.b + exponent*128.0;

  result.g = floor(mantissa*32768.0);
  mantissa = mantissa - result.g/32768.0;

  result.r = floor(mantissa*8388608.0);
  return result/255.0;
}
// Dragons end here

int index;
ivec3 threadId;

ivec3 indexTo3D(int idx, ivec3 texDim) {
  int z = int(idx / (texDim.x * texDim.y));
  idx -= z * int(texDim.x * texDim.y);
  int y = int(idx / texDim.x);
  int x = int(integerMod(idx, texDim.x));
  return ivec3(x, y, z);
}

float get32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  return decode32(texel);
}

float get16(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int w = texSize.x * 2;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize.x * 2, texSize.y));
  return decode16(texel, index);
}

float get8(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int w = texSize.x * 4;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize.x * 4, texSize.y));
  return decode8(texel, index);
}

float getMemoryOptimized32(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + (texDim.x * (y + (texDim.y * z)));
  int channel = integerMod(index, 4);
  index = index / 4;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  index = index / 4;
  vec4 texel = texture(tex, st / vec2(texSize));
  return texel[channel];
}

vec4 getImage2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture(tex, st / vec2(texSize));
}

vec4 getImage3D(sampler2DArray tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  return texture(tex, vec3(st / vec2(texSize), z));
}

float getFloatFromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return result[0];
}

vec2 getVec2FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec2(result[0], result[1]);
}

vec2 getMemoryOptimizedVec2(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  index = index / 2;
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  if (channel == 0) return vec2(texel.r, texel.g);
  if (channel == 1) return vec2(texel.b, texel.a);
  return vec2(0.0, 0.0);
}

vec3 getVec3FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  vec4 result = getImage2D(tex, texSize, texDim, z, y, x);
  return vec3(result[0], result[1], result[2]);
}

vec3 getMemoryOptimizedVec3(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int fieldIndex = 3 * (x + texDim.x * (y + texDim.y * z));
  int vectorIndex = fieldIndex / 4;
  int vectorOffset = fieldIndex - vectorIndex * 4;
  int readY = vectorIndex / texSize.x;
  int readX = vectorIndex - readY * texSize.x;
  vec4 tex1 = texture(tex, (vec2(readX, readY) + 0.5) / vec2(texSize));

  if (vectorOffset == 0) {
    return tex1.xyz;
  } else if (vectorOffset == 1) {
    return tex1.yzw;
  } else {
    readX++;
    if (readX >= texSize.x) {
      readX = 0;
      readY++;
    }
    vec4 tex2 = texture(tex, vec2(readX, readY) / vec2(texSize));
    if (vectorOffset == 2) {
      return vec3(tex1.z, tex1.w, tex2.x);
    } else {
      return vec3(tex1.w, tex2.x, tex2.y);
    }
  }
}

vec4 getVec4FromSampler2D(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  return getImage2D(tex, texSize, texDim, z, y, x);
}

vec4 getMemoryOptimizedVec4(sampler2D tex, ivec2 texSize, ivec3 texDim, int z, int y, int x) {
  int index = x + texDim.x * (y + texDim.y * z);
  int channel = integerMod(index, 2);
  int w = texSize.x;
  vec2 st = vec2(float(integerMod(index, w)), float(index / w)) + 0.5;
  vec4 texel = texture(tex, st / vec2(texSize));
  return vec4(texel.r, texel.g, texel.b, texel.a);
}

vec4 actualColor;
void color(float r, float g, float b, float a) {
  actualColor = vec4(r,g,b,a);
}

void color(float r, float g, float b) {
  color(r,g,b,1.0);
}

__INJECTED_NATIVE__;
__MAIN_CONSTANTS__;
__MAIN_ARGUMENTS__;
__KERNEL__;

void main(void) {
  index = int(vTexCoord.s * float(uTexSize.x)) + int(vTexCoord.t * float(uTexSize.y)) * uTexSize.x;
  __MAIN_RESULT__;
}`;

module.exports = {
  fragmentShader
};
},{}],110:[function(require,module,exports){
const { WebGLFunctionNode } = require('../web-gl/function-node');

/**
 * @class WebGL2FunctionNode
 * @desc [INTERNAL] Takes in a function node, and does all the AST voodoo required to toString its respective webGL code.
 * @extends WebGLFunctionNode
 * @returns the converted webGL function string
 */
class WebGL2FunctionNode extends WebGLFunctionNode {

  /**
   * @desc Parses the abstract syntax tree for *identifier* expression
   * @param {Object} idtNode - An ast Node
   * @param {Array} retArr - return array string
   * @returns {Array} the append retArr
   */
  astIdentifierExpression(idtNode, retArr) {
    if (idtNode.type !== 'Identifier') {
      throw this.astErrorOutput(
        'IdentifierExpression - not an Identifier',
        idtNode
      );
    }

    const type = this.getType(idtNode);

    if (idtNode.name === 'Infinity') {
      retArr.push('intBitsToFloat(2139095039)');
    } else if (type === 'Boolean') {
      if (this.argumentNames.indexOf(idtNode.name) > -1) {
        retArr.push(`bool(user_${idtNode.name})`);
      } else {
        retArr.push(`user_${idtNode.name}`);
      }
    } else {
      retArr.push(`user_${idtNode.name}`);
    }

    return retArr;
  }
}

module.exports = {
  WebGL2FunctionNode
};
},{"../web-gl/function-node":76}],111:[function(require,module,exports){
const { WebGL2KernelValueBoolean } = require('./kernel-value/boolean');
const { WebGL2KernelValueFloat } = require('./kernel-value/float');
const { WebGL2KernelValueInteger } = require('./kernel-value/integer');

const { WebGL2KernelValueHTMLImage } = require('./kernel-value/html-image');
const { WebGL2KernelValueDynamicHTMLImage } = require('./kernel-value/dynamic-html-image');

const { WebGL2KernelValueHTMLImageArray } = require('./kernel-value/html-image-array');
const { WebGL2KernelValueDynamicHTMLImageArray } = require('./kernel-value/dynamic-html-image-array');

const { WebGL2KernelValueHTMLVideo } = require('./kernel-value/html-video');
const { WebGL2KernelValueDynamicHTMLVideo } = require('./kernel-value/dynamic-html-video');

const { WebGL2KernelValueSingleInput } = require('./kernel-value/single-input');
const { WebGL2KernelValueDynamicSingleInput } = require('./kernel-value/dynamic-single-input');

const { WebGL2KernelValueUnsignedInput } = require('./kernel-value/unsigned-input');
const { WebGL2KernelValueDynamicUnsignedInput } = require('./kernel-value/dynamic-unsigned-input');

const { WebGL2KernelValueMemoryOptimizedNumberTexture } = require('./kernel-value/memory-optimized-number-texture');
const { WebGL2KernelValueDynamicMemoryOptimizedNumberTexture } = require('./kernel-value/dynamic-memory-optimized-number-texture');

const { WebGL2KernelValueNumberTexture } = require('./kernel-value/number-texture');
const { WebGL2KernelValueDynamicNumberTexture } = require('./kernel-value/dynamic-number-texture');

const { WebGL2KernelValueSingleArray } = require('./kernel-value/single-array');
const { WebGL2KernelValueDynamicSingleArray } = require('./kernel-value/dynamic-single-array');

const { WebGL2KernelValueSingleArray1DI } = require('./kernel-value/single-array1d-i');
const { WebGL2KernelValueDynamicSingleArray1DI } = require('./kernel-value/dynamic-single-array1d-i');

const { WebGL2KernelValueSingleArray2DI } = require('./kernel-value/single-array2d-i');
const { WebGL2KernelValueDynamicSingleArray2DI } = require('./kernel-value/dynamic-single-array2d-i');

const { WebGL2KernelValueSingleArray3DI } = require('./kernel-value/single-array3d-i');
const { WebGL2KernelValueDynamicSingleArray3DI } = require('./kernel-value/dynamic-single-array3d-i');

const { WebGL2KernelValueSingleArray2 } = require('./kernel-value/single-array2');
const { WebGL2KernelValueSingleArray3 } = require('./kernel-value/single-array3');
const { WebGL2KernelValueSingleArray4 } = require('./kernel-value/single-array4');

const { WebGL2KernelValueUnsignedArray } = require('./kernel-value/unsigned-array');
const { WebGL2KernelValueDynamicUnsignedArray } = require('./kernel-value/dynamic-unsigned-array');

const kernelValueMaps = {
  unsigned: {
    dynamic: {
      'Boolean': WebGL2KernelValueBoolean,
      'Integer': WebGL2KernelValueInteger,
      'Float': WebGL2KernelValueFloat,
      'Array': WebGL2KernelValueDynamicUnsignedArray,
      'Array(2)': false,
      'Array(3)': false,
      'Array(4)': false,
      'Array1D(2)': false,
      'Array1D(3)': false,
      'Array1D(4)': false,
      'Array2D(2)': false,
      'Array2D(3)': false,
      'Array2D(4)': false,
      'Array3D(2)': false,
      'Array3D(3)': false,
      'Array3D(4)': false,
      'Input': WebGL2KernelValueDynamicUnsignedInput,
      'NumberTexture': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(1)': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(2)': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(3)': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(4)': WebGL2KernelValueDynamicNumberTexture,
      'MemoryOptimizedNumberTexture': WebGL2KernelValueDynamicMemoryOptimizedNumberTexture,
      'HTMLImage': WebGL2KernelValueDynamicHTMLImage,
      'HTMLImageArray': WebGL2KernelValueDynamicHTMLImageArray,
      'HTMLVideo': WebGL2KernelValueDynamicHTMLVideo,
    },
    static: {
      'Boolean': WebGL2KernelValueBoolean,
      'Float': WebGL2KernelValueFloat,
      'Integer': WebGL2KernelValueInteger,
      'Array': WebGL2KernelValueUnsignedArray,
      'Array(2)': false,
      'Array(3)': false,
      'Array(4)': false,
      'Array1D(2)': false,
      'Array1D(3)': false,
      'Array1D(4)': false,
      'Array2D(2)': false,
      'Array2D(3)': false,
      'Array2D(4)': false,
      'Array3D(2)': false,
      'Array3D(3)': false,
      'Array3D(4)': false,
      'Input': WebGL2KernelValueUnsignedInput,
      'NumberTexture': WebGL2KernelValueNumberTexture,
      'ArrayTexture(1)': WebGL2KernelValueNumberTexture,
      'ArrayTexture(2)': WebGL2KernelValueNumberTexture,
      'ArrayTexture(3)': WebGL2KernelValueNumberTexture,
      'ArrayTexture(4)': WebGL2KernelValueNumberTexture,
      'MemoryOptimizedNumberTexture': WebGL2KernelValueDynamicMemoryOptimizedNumberTexture,
      'HTMLImage': WebGL2KernelValueHTMLImage,
      'HTMLImageArray': WebGL2KernelValueHTMLImageArray,
      'HTMLVideo': WebGL2KernelValueHTMLVideo,
    }
  },
  single: {
    dynamic: {
      'Boolean': WebGL2KernelValueBoolean,
      'Integer': WebGL2KernelValueInteger,
      'Float': WebGL2KernelValueFloat,
      'Array': WebGL2KernelValueDynamicSingleArray,
      'Array(2)': WebGL2KernelValueSingleArray2,
      'Array(3)': WebGL2KernelValueSingleArray3,
      'Array(4)': WebGL2KernelValueSingleArray4,
      'Array1D(2)': WebGL2KernelValueDynamicSingleArray1DI,
      'Array1D(3)': WebGL2KernelValueDynamicSingleArray1DI,
      'Array1D(4)': WebGL2KernelValueDynamicSingleArray1DI,
      'Array2D(2)': WebGL2KernelValueDynamicSingleArray2DI,
      'Array2D(3)': WebGL2KernelValueDynamicSingleArray2DI,
      'Array2D(4)': WebGL2KernelValueDynamicSingleArray2DI,
      'Array3D(2)': WebGL2KernelValueDynamicSingleArray3DI,
      'Array3D(3)': WebGL2KernelValueDynamicSingleArray3DI,
      'Array3D(4)': WebGL2KernelValueDynamicSingleArray3DI,
      'Input': WebGL2KernelValueDynamicSingleInput,
      'NumberTexture': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(1)': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(2)': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(3)': WebGL2KernelValueDynamicNumberTexture,
      'ArrayTexture(4)': WebGL2KernelValueDynamicNumberTexture,
      'MemoryOptimizedNumberTexture': WebGL2KernelValueDynamicMemoryOptimizedNumberTexture,
      'HTMLImage': WebGL2KernelValueDynamicHTMLImage,
      'HTMLImageArray': WebGL2KernelValueDynamicHTMLImageArray,
      'HTMLVideo': WebGL2KernelValueDynamicHTMLVideo,
    },
    static: {
      'Boolean': WebGL2KernelValueBoolean,
      'Float': WebGL2KernelValueFloat,
      'Integer': WebGL2KernelValueInteger,
      'Array': WebGL2KernelValueSingleArray,
      'Array(2)': WebGL2KernelValueSingleArray2,
      'Array(3)': WebGL2KernelValueSingleArray3,
      'Array(4)': WebGL2KernelValueSingleArray4,
      'Array1D(2)': WebGL2KernelValueSingleArray1DI,
      'Array1D(3)': WebGL2KernelValueSingleArray1DI,
      'Array1D(4)': WebGL2KernelValueSingleArray1DI,
      'Array2D(2)': WebGL2KernelValueSingleArray2DI,
      'Array2D(3)': WebGL2KernelValueSingleArray2DI,
      'Array2D(4)': WebGL2KernelValueSingleArray2DI,
      'Array3D(2)': WebGL2KernelValueSingleArray3DI,
      'Array3D(3)': WebGL2KernelValueSingleArray3DI,
      'Array3D(4)': WebGL2KernelValueSingleArray3DI,
      'Input': WebGL2KernelValueSingleInput,
      'NumberTexture': WebGL2KernelValueNumberTexture,
      'ArrayTexture(1)': WebGL2KernelValueNumberTexture,
      'ArrayTexture(2)': WebGL2KernelValueNumberTexture,
      'ArrayTexture(3)': WebGL2KernelValueNumberTexture,
      'ArrayTexture(4)': WebGL2KernelValueNumberTexture,
      'MemoryOptimizedNumberTexture': WebGL2KernelValueMemoryOptimizedNumberTexture,
      'HTMLImage': WebGL2KernelValueHTMLImage,
      'HTMLImageArray': WebGL2KernelValueHTMLImageArray,
      'HTMLVideo': WebGL2KernelValueHTMLVideo,
    }
  },
};

function lookupKernelValueType(type, dynamic, precision, value) {
  if (!type) {
    throw new Error('type missing');
  }
  if (!dynamic) {
    throw new Error('dynamic missing');
  }
  if (!precision) {
    throw new Error('precision missing');
  }
  if (value.type) {
    type = value.type;
  }
  const types = kernelValueMaps[precision][dynamic];
  if (types[type] === false) {
    return null;
  } else if (types[type] === undefined) {
    throw new Error(`Could not find a KernelValue for ${ type }`);
  }
  return types[type];
}

module.exports = {
  kernelValueMaps,
  lookupKernelValueType
};
},{"./kernel-value/boolean":112,"./kernel-value/dynamic-html-image":114,"./kernel-value/dynamic-html-image-array":113,"./kernel-value/dynamic-html-video":115,"./kernel-value/dynamic-memory-optimized-number-texture":116,"./kernel-value/dynamic-number-texture":117,"./kernel-value/dynamic-single-array":118,"./kernel-value/dynamic-single-array1d-i":119,"./kernel-value/dynamic-single-array2d-i":120,"./kernel-value/dynamic-single-array3d-i":121,"./kernel-value/dynamic-single-input":122,"./kernel-value/dynamic-unsigned-array":123,"./kernel-value/dynamic-unsigned-input":124,"./kernel-value/float":125,"./kernel-value/html-image":127,"./kernel-value/html-image-array":126,"./kernel-value/html-video":128,"./kernel-value/integer":129,"./kernel-value/memory-optimized-number-texture":130,"./kernel-value/number-texture":131,"./kernel-value/single-array":132,"./kernel-value/single-array1d-i":133,"./kernel-value/single-array2":134,"./kernel-value/single-array2d-i":135,"./kernel-value/single-array3":136,"./kernel-value/single-array3d-i":137,"./kernel-value/single-array4":138,"./kernel-value/single-input":139,"./kernel-value/unsigned-array":140,"./kernel-value/unsigned-input":141}],112:[function(require,module,exports){
const { WebGLKernelValueBoolean } = require('../../web-gl/kernel-value/boolean');

class WebGL2KernelValueBoolean extends WebGLKernelValueBoolean {}

module.exports = {
  WebGL2KernelValueBoolean
};
},{"../../web-gl/kernel-value/boolean":78}],113:[function(require,module,exports){
const { WebGL2KernelValueHTMLImageArray } = require('./html-image-array');

class WebGL2KernelValueDynamicHTMLImageArray extends WebGL2KernelValueHTMLImageArray {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2DArray ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(images) {
    const { width, height } = images[0];
    this.checkSize(width, height);
    this.dimensions = [width, height, images.length];
    this.textureSize = [width, height];
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(images);
  }
}

module.exports = {
  WebGL2KernelValueDynamicHTMLImageArray
};
},{"./html-image-array":126}],114:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueDynamicHTMLImage } = require('../../web-gl/kernel-value/dynamic-html-image');

class WebGL2KernelValueDynamicHTMLImage extends WebGLKernelValueDynamicHTMLImage {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueDynamicHTMLImage
};
},{"../../../utils":150,"../../web-gl/kernel-value/dynamic-html-image":79}],115:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGL2KernelValueDynamicHTMLImage } = require('./dynamic-html-image');

class WebGL2KernelValueDynamicHTMLVideo extends WebGL2KernelValueDynamicHTMLImage {}

module.exports = {
  WebGL2KernelValueDynamicHTMLVideo
};
},{"../../../utils":150,"./dynamic-html-image":114}],116:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueDynamicMemoryOptimizedNumberTexture } = require('../../web-gl/kernel-value/dynamic-memory-optimized-number-texture');

class WebGL2KernelValueDynamicMemoryOptimizedNumberTexture extends WebGLKernelValueDynamicMemoryOptimizedNumberTexture {
  getSource() {
    return utils.linesToString([
      `uniform sampler2D ${this.id}`,
      `uniform ivec2 ${this.sizeId}`,
      `uniform ivec3 ${this.dimensionsId}`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueDynamicMemoryOptimizedNumberTexture
};
},{"../../../utils":150,"../../web-gl/kernel-value/dynamic-memory-optimized-number-texture":81}],117:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueDynamicNumberTexture } = require('../../web-gl/kernel-value/dynamic-number-texture');

class WebGL2KernelValueDynamicNumberTexture extends WebGLKernelValueDynamicNumberTexture {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueDynamicNumberTexture
};
},{"../../../utils":150,"../../web-gl/kernel-value/dynamic-number-texture":82}],118:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGL2KernelValueSingleArray } = require('../../web-gl2/kernel-value/single-array');

class WebGL2KernelValueDynamicSingleArray extends WebGL2KernelValueSingleArray {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.dimensions = utils.getDimensions(value, true);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGL2KernelValueDynamicSingleArray
};
},{"../../../utils":150,"../../web-gl2/kernel-value/single-array":132}],119:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGL2KernelValueSingleArray1DI } = require('../../web-gl2/kernel-value/single-array1d-i');

class WebGL2KernelValueDynamicSingleArray1DI extends WebGL2KernelValueSingleArray1DI {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.setShape(value);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGL2KernelValueDynamicSingleArray1DI
};
},{"../../../utils":150,"../../web-gl2/kernel-value/single-array1d-i":133}],120:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGL2KernelValueSingleArray2DI } = require('../../web-gl2/kernel-value/single-array2d-i');

class WebGL2KernelValueDynamicSingleArray2DI extends WebGL2KernelValueSingleArray2DI {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.setShape(value);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGL2KernelValueDynamicSingleArray2DI
};
},{"../../../utils":150,"../../web-gl2/kernel-value/single-array2d-i":135}],121:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGL2KernelValueSingleArray3DI } = require('../../web-gl2/kernel-value/single-array3d-i');

class WebGL2KernelValueDynamicSingleArray3DI extends WebGL2KernelValueSingleArray3DI {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    this.setShape(value);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGL2KernelValueDynamicSingleArray3DI
};
},{"../../../utils":150,"../../web-gl2/kernel-value/single-array3d-i":137}],122:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGL2KernelValueSingleInput } = require('../../web-gl2/kernel-value/single-input');

class WebGL2KernelValueDynamicSingleInput extends WebGL2KernelValueSingleInput {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }

  updateValue(value) {
    let [w, h, d] = value.size;
    this.dimensions = new Int32Array([w || 1, h || 1, d || 1]);
    this.textureSize = utils.getMemoryOptimizedFloatTextureSize(this.dimensions, this.bitRatio);
    this.uploadArrayLength = this.textureSize[0] * this.textureSize[1] * this.bitRatio;
    this.checkSize(this.textureSize[0] * this.bitRatio, this.textureSize[1] * this.bitRatio);
    this.uploadValue = new Float32Array(this.uploadArrayLength);
    this.kernel.setUniform3iv(this.dimensionsId, this.dimensions);
    this.kernel.setUniform2iv(this.sizeId, this.textureSize);
    super.updateValue(value);
  }
}

module.exports = {
  WebGL2KernelValueDynamicSingleInput
};
},{"../../../utils":150,"../../web-gl2/kernel-value/single-input":139}],123:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueDynamicUnsignedArray } = require('../../web-gl/kernel-value/dynamic-unsigned-array');

class WebGL2KernelValueDynamicUnsignedArray extends WebGLKernelValueDynamicUnsignedArray {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueDynamicUnsignedArray
};
},{"../../../utils":150,"../../web-gl/kernel-value/dynamic-unsigned-array":88}],124:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueDynamicUnsignedInput } = require('../../web-gl/kernel-value/dynamic-unsigned-input');

class WebGL2KernelValueDynamicUnsignedInput extends WebGLKernelValueDynamicUnsignedInput {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `uniform ${ variablePrecision } ivec2 ${this.sizeId}`,
      `uniform ${ variablePrecision } ivec3 ${this.dimensionsId}`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueDynamicUnsignedInput
};
},{"../../../utils":150,"../../web-gl/kernel-value/dynamic-unsigned-input":89}],125:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueFloat } = require('../../web-gl/kernel-value/float');

class WebGL2KernelValueFloat extends WebGLKernelValueFloat {}

module.exports = {
  WebGL2KernelValueFloat
};
},{"../../../utils":150,"../../web-gl/kernel-value/float":90}],126:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValue } = require('../../web-gl/kernel-value/index');

class WebGL2KernelValueHTMLImageArray extends WebGLKernelValue {
  constructor(value, settings) {
    super(value, settings);
    this.checkSize(value[0].width, value[0].height);
    this.requestTexture();
    this.dimensions = [value[0].width, value[0].height, value.length];
    this.textureSize = [value[0].width, value[0].height];
  }
  getStringValueHandler() {
    return `const uploadValue_${this.name} = ${this.varName};\n`;
  }
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2DArray ${this.id}`,
      `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(images) {
    const { context: gl } = this;
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // Upload the images into the texture.
    gl.texImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      gl.RGBA,
      images[0].width,
      images[0].height,
      images.length,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    for (let i = 0; i < images.length; i++) {
      const xOffset = 0;
      const yOffset = 0;
      const imageDepth = 1;
      gl.texSubImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        xOffset,
        yOffset,
        i,
        images[i].width,
        images[i].height,
        imageDepth,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        this.uploadValue = images[i]
      );
    }
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGL2KernelValueHTMLImageArray
};
},{"../../../utils":150,"../../web-gl/kernel-value/index":93}],127:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueHTMLImage } = require('../../web-gl/kernel-value/html-image');

class WebGL2KernelValueHTMLImage extends WebGLKernelValueHTMLImage {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueHTMLImage
};
},{"../../../utils":150,"../../web-gl/kernel-value/html-image":91}],128:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGL2KernelValueHTMLImage } = require('./html-image');

class WebGL2KernelValueHTMLVideo extends WebGL2KernelValueHTMLImage {}

module.exports = {
  WebGL2KernelValueHTMLVideo
};
},{"../../../utils":150,"./html-image":127}],129:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueInteger } = require('../../web-gl/kernel-value/integer');

class WebGL2KernelValueInteger extends WebGLKernelValueInteger {
  getSource(value) {
    const variablePrecision = this.getVariablePrecisionString();
    if (this.origin === 'constants') {
      return `const ${ variablePrecision } int ${this.id} = ${ parseInt(value) };\n`;
    }
    return `uniform ${ variablePrecision } int ${this.id};\n`;
  }

  updateValue(value) {
    if (this.origin === 'constants') return;
    this.kernel.setUniform1i(this.id, this.uploadValue = value);
  }
}

module.exports = {
  WebGL2KernelValueInteger
};
},{"../../../utils":150,"../../web-gl/kernel-value/integer":94}],130:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueMemoryOptimizedNumberTexture } = require('../../web-gl/kernel-value/memory-optimized-number-texture');

class WebGL2KernelValueMemoryOptimizedNumberTexture extends WebGLKernelValueMemoryOptimizedNumberTexture {
  getSource() {
    const { id, sizeId, textureSize, dimensionsId, dimensions } = this;
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform sampler2D ${id}`,
      `${ variablePrecision } ivec2 ${sizeId} = ivec2(${textureSize[0]}, ${textureSize[1]})`,
      `${ variablePrecision } ivec3 ${dimensionsId} = ivec3(${dimensions[0]}, ${dimensions[1]}, ${dimensions[2]})`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueMemoryOptimizedNumberTexture
};
},{"../../../utils":150,"../../web-gl/kernel-value/memory-optimized-number-texture":95}],131:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueNumberTexture } = require('../../web-gl/kernel-value/number-texture');

class WebGL2KernelValueNumberTexture extends WebGLKernelValueNumberTexture {
  getSource() {
    const { id, sizeId, textureSize, dimensionsId, dimensions } = this;
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${id}`,
      `${ variablePrecision } ivec2 ${sizeId} = ivec2(${textureSize[0]}, ${textureSize[1]})`,
      `${ variablePrecision } ivec3 ${dimensionsId} = ivec3(${dimensions[0]}, ${dimensions[1]}, ${dimensions[2]})`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueNumberTexture
};
},{"../../../utils":150,"../../web-gl/kernel-value/number-texture":96}],132:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray } = require('../../web-gl/kernel-value/single-array');

class WebGL2KernelValueSingleArray extends WebGLKernelValueSingleArray {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGL2KernelValueSingleArray
};
},{"../../../utils":150,"../../web-gl/kernel-value/single-array":97}],133:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray1DI } = require('../../web-gl/kernel-value/single-array1d-i');

class WebGL2KernelValueSingleArray1DI extends WebGLKernelValueSingleArray1DI {
  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGL2KernelValueSingleArray1DI
};
},{"../../../utils":150,"../../web-gl/kernel-value/single-array1d-i":98}],134:[function(require,module,exports){
const { WebGLKernelValueSingleArray2 } = require('../../web-gl/kernel-value/single-array2');

class WebGL2KernelValueSingleArray2 extends WebGLKernelValueSingleArray2 {}

module.exports = {
  WebGL2KernelValueSingleArray2
};
},{"../../web-gl/kernel-value/single-array2":99}],135:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray2DI } = require('../../web-gl/kernel-value/single-array2d-i');

class WebGL2KernelValueSingleArray2DI extends WebGLKernelValueSingleArray2DI {
  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGL2KernelValueSingleArray2DI
};
},{"../../../utils":150,"../../web-gl/kernel-value/single-array2d-i":100}],136:[function(require,module,exports){
const { WebGLKernelValueSingleArray3 } = require('../../web-gl/kernel-value/single-array3');

class WebGL2KernelValueSingleArray3 extends WebGLKernelValueSingleArray3 {}

module.exports = {
  WebGL2KernelValueSingleArray3
};
},{"../../web-gl/kernel-value/single-array3":101}],137:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleArray3DI } = require('../../web-gl/kernel-value/single-array3d-i');

class WebGL2KernelValueSingleArray3DI extends WebGLKernelValueSingleArray3DI {
  updateValue(value) {
    if (value.constructor !== this.initialValueConstructor) {
      this.onUpdateValueMismatch();
      return;
    }
    const { context: gl } = this;
    utils.flattenTo(value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGL2KernelValueSingleArray3DI
};
},{"../../../utils":150,"../../web-gl/kernel-value/single-array3d-i":102}],138:[function(require,module,exports){
const { WebGLKernelValueSingleArray4 } = require('../../web-gl/kernel-value/single-array4');

class WebGL2KernelValueSingleArray4 extends WebGLKernelValueSingleArray4 {}

module.exports = {
  WebGL2KernelValueSingleArray4
};
},{"../../web-gl/kernel-value/single-array4":103}],139:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueSingleInput } = require('../../web-gl/kernel-value/single-input');

class WebGL2KernelValueSingleInput extends WebGLKernelValueSingleInput {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }

  updateValue(input) {
    const { context: gl } = this;
    utils.flattenTo(input.value, this.uploadValue);
    gl.activeTexture(this.contextHandle);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.textureSize[0], this.textureSize[1], 0, gl.RGBA, gl.FLOAT, this.uploadValue);
    this.kernel.setUniform1i(this.id, this.index);
  }
}

module.exports = {
  WebGL2KernelValueSingleInput
};
},{"../../../utils":150,"../../web-gl/kernel-value/single-input":104}],140:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueUnsignedArray } = require('../../web-gl/kernel-value/unsigned-array');

class WebGL2KernelValueUnsignedArray extends WebGLKernelValueUnsignedArray {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueUnsignedArray
};
},{"../../../utils":150,"../../web-gl/kernel-value/unsigned-array":105}],141:[function(require,module,exports){
const { utils } = require('../../../utils');
const { WebGLKernelValueUnsignedInput } = require('../../web-gl/kernel-value/unsigned-input');

class WebGL2KernelValueUnsignedInput extends WebGLKernelValueUnsignedInput {
  getSource() {
    const variablePrecision = this.getVariablePrecisionString();
    return utils.linesToString([
      `uniform ${ variablePrecision } sampler2D ${this.id}`,
      `${ variablePrecision } ivec2 ${this.sizeId} = ivec2(${this.textureSize[0]}, ${this.textureSize[1]})`,
      `${ variablePrecision } ivec3 ${this.dimensionsId} = ivec3(${this.dimensions[0]}, ${this.dimensions[1]}, ${this.dimensions[2]})`,
    ]);
  }
}

module.exports = {
  WebGL2KernelValueUnsignedInput
};
},{"../../../utils":150,"../../web-gl/kernel-value/unsigned-input":106}],142:[function(require,module,exports){
const { WebGLKernel } = require('../web-gl/kernel');
const { WebGL2FunctionNode } = require('./function-node');
const { FunctionBuilder } = require('../function-builder');
const { utils } = require('../../utils');
const { fragmentShader } = require('./fragment-shader');
const { vertexShader } = require('./vertex-shader');
const { lookupKernelValueType } = require('./kernel-value-maps');

let isSupported = null;
/**
 *
 * @type {HTMLCanvasElement|OffscreenCanvas}
 */
let testCanvas = null;
/**
 *
 * @type {WebGLRenderingContext}
 */
let testContext = null;
let testExtensions = null;

/**
 *
 * @type {IKernelFeatures}
 */
let features = null;

/**
 * @extends WebGLKernel
 */
class WebGL2Kernel extends WebGLKernel {
  static get isSupported() {
    if (isSupported !== null) {
      return isSupported;
    }
    this.setupFeatureChecks();
    isSupported = this.isContextMatch(testContext);
    return isSupported;
  }

  static setupFeatureChecks() {
    if (typeof document !== 'undefined') {
      testCanvas = document.createElement('canvas');
    } else if (typeof OffscreenCanvas !== 'undefined') {
      testCanvas = new OffscreenCanvas(0, 0);
    }
    if (!testCanvas) return;
    testContext = testCanvas.getContext('webgl2');
    if (!testContext || !testContext.getExtension) return;
    testExtensions = {
      EXT_color_buffer_float: testContext.getExtension('EXT_color_buffer_float'),
      OES_texture_float_linear: testContext.getExtension('OES_texture_float_linear'),
    };
    features = this.getFeatures();
  }

  static isContextMatch(context) {
    // from global
    if (typeof WebGL2RenderingContext !== 'undefined') {
      return context instanceof WebGL2RenderingContext;
    }
    return false;
  }

  /**
   *
   * @return {IKernelFeatures}
   */
  static getFeatures() {
    return Object.freeze({
      isFloatRead: this.getIsFloatRead(),
      isIntegerDivisionAccurate: this.getIsIntegerDivisionAccurate(),
      kernelMap: true,
      isTextureFloat: true,
      channelCount: this.getChannelCount(),
      maxTextureSize: this.getMaxTextureSize(),
    });
  }

  static getIsTextureFloat() {
    return true;
  }

  static getIsIntegerDivisionAccurate() {
    return super.getIsIntegerDivisionAccurate();
  }

  static getChannelCount() {
    return testContext.getParameter(testContext.MAX_DRAW_BUFFERS);
  }

  static getMaxTextureSize() {
    return testContext.getParameter(testContext.MAX_TEXTURE_SIZE);
  }

  static lookupKernelValueType(type, dynamic, precision, value) {
    return lookupKernelValueType(type, dynamic, precision, value);
  }

  static get testCanvas() {
    return testCanvas;
  }

  static get testContext() {
    return testContext;
  }

  /**
   *
   * @returns {{isFloatRead: Boolean, isIntegerDivisionAccurate: Boolean, kernelMap: Boolean, isTextureFloat: Boolean}}
   */
  static get features() {
    return features;
  }

  static get fragmentShader() {
    return fragmentShader;
  }
  static get vertexShader() {
    return vertexShader;
  }

  /**
   *
   * @return {WebGLRenderingContext|WebGL2RenderingContext}
   */
  initContext() {
    const settings = {
      alpha: false,
      depth: false,
      antialias: false
    };
    return this.canvas.getContext('webgl2', settings);
  }

  initExtensions() {
    this.extensions = {
      EXT_color_buffer_float: this.context.getExtension('EXT_color_buffer_float'),
      OES_texture_float_linear: this.context.getExtension('OES_texture_float_linear'),
    };
  }

  /**
   * @desc Validate settings related to Kernel, such as dimensions size, and auto output support.
   * @param {IArguments} args
   */
  validateSettings(args) {
    if (!this.validate) {
      this.texSize = utils.getKernelTextureSize({
        optimizeFloatMemory: this.optimizeFloatMemory,
        precision: this.precision,
      }, this.output);
      return;
    }

    const { features } = this.constructor;
    if (this.precision === 'single' && !features.isFloatRead) {
      throw new Error('Float texture outputs are not supported');
    } else if (!this.graphical && this.precision === null) {
      this.precision = features.isFloatRead ? 'single' : 'unsigned';
    }

    if (this.fixIntegerDivisionAccuracy === null) {
      this.fixIntegerDivisionAccuracy = !features.isIntegerDivisionAccurate;
    } else if (this.fixIntegerDivisionAccuracy && features.isIntegerDivisionAccurate) {
      this.fixIntegerDivisionAccuracy = false;
    }

    this.checkOutput();

    if (!this.output || this.output.length === 0) {
      if (args.length !== 1) {
        throw new Error('Auto output only supported for kernels with only one input');
      }

      const argType = utils.getVariableType(args[0], this.strictIntegers);
      switch (argType) {
        case 'Array':
          this.output = utils.getDimensions(argType);
          break;
        case 'NumberTexture':
        case 'MemoryOptimizedNumberTexture':
        case 'ArrayTexture(1)':
        case 'ArrayTexture(2)':
        case 'ArrayTexture(3)':
        case 'ArrayTexture(4)':
          this.output = args[0].output;
          break;
        default:
          throw new Error('Auto output not supported for input type: ' + argType);
      }
    }

    if (this.graphical) {
      if (this.output.length !== 2) {
        throw new Error('Output must have 2 dimensions on graphical mode');
      }

      if (this.precision === 'single') {
        console.warn('Cannot use graphical mode and single precision at the same time');
        this.precision = 'unsigned';
      }

      this.texSize = utils.clone(this.output);
      return;
    } else if (!this.graphical && this.precision === null && features.isTextureFloat) {
      this.precision = 'single';
    }

    this.texSize = utils.getKernelTextureSize({
      optimizeFloatMemory: this.optimizeFloatMemory,
      precision: this.precision,
    }, this.output);

    this.checkTextureSize();
  }

  translateSource() {
    const functionBuilder = FunctionBuilder.fromKernel(this, WebGL2FunctionNode, {
      fixIntegerDivisionAccuracy: this.fixIntegerDivisionAccuracy
    });
    this.translatedSource = functionBuilder.getPrototypeString('kernel');
    this.setupReturnTypes(functionBuilder);
  }

  drawBuffers() {
    this.context.drawBuffers(this.drawBuffersMap);
  }

  _setupOutputTexture() {
    const { texSize } = this;
    const gl = this.context;
    const texture = this.outputTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    if (this.precision === 'single') {
      if (this.pipeline) {
        switch (this.returnType) {
          case 'Number':
          case 'Float':
          case 'Integer':
            if (this.optimizeFloatMemory) {
              gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, texSize[0], texSize[1]);
            } else {
              gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, texSize[0], texSize[1]);
            }
            break;
          case 'Array(2)':
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG32F, texSize[0], texSize[1]);
            break;
          case 'Array(3)': // there is _no_ 3 channel format which is guaranteed to be color-renderable
          case 'Array(4)':
            gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, texSize[0], texSize[1]);
            break;
          default:
            throw new Error('Unhandled return type');
        }
      } else {
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, texSize[0], texSize[1]);
      }
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }

  _setupSubOutputTextures() {
    const { texSize } = this;
    const gl = this.context;
    this.drawBuffersMap = [gl.COLOR_ATTACHMENT0];
    this.subKernelOutputTextures = [];
    for (let i = 0; i < this.subKernels.length; i++) {
      const texture = this.context.createTexture();
      this.subKernelOutputTextures.push(texture);
      this.drawBuffersMap.push(gl.COLOR_ATTACHMENT0 + i + 1);
      gl.activeTexture(gl.TEXTURE0 + this.constantTextureCount + this.argumentTextureCount + i);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      // TODO: upgrade this
      if (this.precision === 'single') {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, texSize[0], texSize[1], 0, gl.RGBA, gl.FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize[0], texSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i + 1, gl.TEXTURE_2D, texture, 0);
    }
  }

  /**
   *
   * @desc Get the header string for the program.
   * This returns an empty string if no sub-kernels are defined.
   *
   * @returns {String} result
   */
  _getHeaderString() {
    return '';
  }

  /**
   * @desc Get texture coordinate string for the program
   * @returns {String} result
   */
  _getTextureCoordinate() {
    const subKernels = this.subKernels;
    if (subKernels === null || subKernels.length < 1) {
      switch (this.tactic) {
        case 'speed':
          return 'in lowp vec2 vTexCoord;\n';
        case 'performance':
          return 'in highp vec2 vTexCoord;\n';
        case 'balanced':
        default:
          return 'in mediump vec2 vTexCoord;\n';
      }
    } else {
      switch (this.tactic) {
        case 'speed':
          return 'out lowp vec2 vTexCoord;\n';
        case 'performance':
          return 'out highp vec2 vTexCoord;\n';
        case 'balanced':
        default:
          return 'out mediump vec2 vTexCoord;\n';
      }
    }
  }

  /**
   * @desc Generate transpiled glsl Strings for user-defined parameters sent to a kernel
   * @param {Array} args - The actual parameters sent to the Kernel
   * @returns {String} result
   */
  _getMainArgumentsString(args) {
    const result = [];
    const argumentNames = this.argumentNames;
    for (let i = 0; i < argumentNames.length; i++) {
      result.push(this.kernelArguments[i].getSource(args[i]));
    }
    return result.join('');
  }

  /**
   * @desc Get Kernel program string (in *glsl*) for a kernel.
   * @returns {String} result
   */
  getKernelString() {
    const result = [];
    const subKernels = this.subKernels;
    if (subKernels !== null) {
      result.push(
        this.getKernelResultDeclaration(),
        'layout(location = 0) out vec4 data0'
      );
      for (let i = 0; i < subKernels.length; i++) {
        const subKernel = subKernels[i];
        result.push(
          subKernel.returnType === 'Integer' ?
          `int subKernelResult_${ subKernel.name } = 0` :
          `float subKernelResult_${ subKernel.name } = 0.0`,
          `layout(location = ${ i + 1 }) out vec4 data${ i + 1 }`
        );
      }
    } else {
      result.push(
        'out vec4 data0',
        this.getKernelResultDeclaration()
      );
    }

    return utils.linesToString(result) + this.translatedSource;
  }

  getMainResultGraphical() {
    return utils.linesToString([
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  data0 = actualColor',
    ]);
  }

  getMainResultPackedPixels() {
    switch (this.returnType) {
      case 'LiteralInteger':
      case 'Number':
      case 'Integer':
      case 'Float':
        return this.getMainResultKernelPackedPixels() +
          this.getMainResultSubKernelPackedPixels();
      default:
        throw new Error(`packed output only usable with Numbers, "${this.returnType}" specified`);
    }
  }

  /**
   * @return {String}
   */
  getMainResultKernelPackedPixels() {
    return utils.linesToString([
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      `  data0 = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(kernelResult)`
    ]);
  }

  /**
   * @return {String}
   */
  getMainResultSubKernelPackedPixels() {
    const result = [];
    if (!this.subKernels) return '';
    for (let i = 0; i < this.subKernels.length; i++) {
      const subKernel = this.subKernels[i];
      if (subKernel.returnType === 'Integer') {
        result.push(
          `  data${i + 1} = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(float(subKernelResult_${this.subKernels[i].name}))`
        );
      } else {
        result.push(
          `  data${i + 1} = ${this.useLegacyEncoder ? 'legacyEncode32' : 'encode32'}(subKernelResult_${this.subKernels[i].name})`
        );
      }
    }
    return utils.linesToString(result);
  }

  getMainResultKernelMemoryOptimizedFloats(result, channel) {
    result.push(
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      `  data0.${channel} = kernelResult`,
    );
  }

  getMainResultSubKernelMemoryOptimizedFloats(result, channel) {
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; i++) {
      const subKernel = this.subKernels[i];
      if (subKernel.returnType === 'Integer') {
        result.push(
          `  data${i + 1}.${channel} = float(subKernelResult_${subKernel.name})`,
        );
      } else {
        result.push(
          `  data${i + 1}.${channel} = subKernelResult_${subKernel.name}`,
        );
      }
    }
  }

  getMainResultKernelNumberTexture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  data0[0] = kernelResult',
    ];
  }

  getMainResultSubKernelNumberTexture() {
    const result = [];
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; ++i) {
      const subKernel = this.subKernels[i];
      if (subKernel.returnType === 'Integer') {
        result.push(
          `  data${i + 1}[0] = float(subKernelResult_${subKernel.name})`,
        );
      } else {
        result.push(
          `  data${i + 1}[0] = subKernelResult_${subKernel.name}`,
        );
      }
    }
    return result;
  }

  getMainResultKernelArray2Texture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  data0[0] = kernelResult[0]',
      '  data0[1] = kernelResult[1]',
    ];
  }

  getMainResultSubKernelArray2Texture() {
    const result = [];
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; ++i) {
      const subKernel = this.subKernels[i];
      result.push(
        `  data${i + 1}[0] = subKernelResult_${subKernel.name}[0]`,
        `  data${i + 1}[1] = subKernelResult_${subKernel.name}[1]`,
      );
    }
    return result;
  }

  getMainResultKernelArray3Texture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  data0[0] = kernelResult[0]',
      '  data0[1] = kernelResult[1]',
      '  data0[2] = kernelResult[2]',
    ];
  }

  getMainResultSubKernelArray3Texture() {
    const result = [];
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; ++i) {
      const subKernel = this.subKernels[i];
      result.push(
        `  data${i + 1}[0] = subKernelResult_${subKernel.name}[0]`,
        `  data${i + 1}[1] = subKernelResult_${subKernel.name}[1]`,
        `  data${i + 1}[2] = subKernelResult_${subKernel.name}[2]`,
      );
    }
    return result;
  }

  getMainResultKernelArray4Texture() {
    return [
      '  threadId = indexTo3D(index, uOutputDim)',
      '  kernel()',
      '  data0 = kernelResult',
    ];
  }

  getMainResultSubKernelArray4Texture() {
    const result = [];
    if (!this.subKernels) return result;
    for (let i = 0; i < this.subKernels.length; ++i) {
      result.push(
        `  data${i + 1} = subKernelResult_${this.subKernels[i].name}`,
      );
    }
    return result;
  }

  destroyExtensions() {
    this.extensions.EXT_color_buffer_float = null;
    this.extensions.OES_texture_float_linear = null;
  }

  /**
   * @return {IJSON}
   */
  toJSON() {
    const json = super.toJSON();
    json.functionNodes = FunctionBuilder.fromKernel(this, WebGL2FunctionNode).toJSON();
    json.settings.threadDim = this.threadDim;
    return json;
  }
}

module.exports = {
  WebGL2Kernel
};
},{"../../utils":150,"../function-builder":48,"../web-gl/kernel":107,"./fragment-shader":109,"./function-node":110,"./kernel-value-maps":111,"./vertex-shader":143}],143:[function(require,module,exports){
// language=GLSL
const vertexShader = `#version 300 es
__FLOAT_TACTIC_DECLARATION__;
__INT_TACTIC_DECLARATION__;
__SAMPLER_2D_TACTIC_DECLARATION__;

in vec2 aPos;
in vec2 aTexCoord;

out vec2 vTexCoord;
uniform vec2 ratio;

void main(void) {
  gl_Position = vec4((aPos + vec2(1)) * ratio + vec2(-1), 0, 1);
  vTexCoord = aTexCoord;
}`;

module.exports = {
  vertexShader
};
},{}],144:[function(require,module,exports){
const { gpuMock } = require('gpu-mock.js');
const { utils } = require('./utils');
const { CPUKernel } = require('./backend/cpu/kernel');
const { HeadlessGLKernel } = require('./backend/headless-gl/kernel');
const { WebGL2Kernel } = require('./backend/web-gl2/kernel');
const { WebGLKernel } = require('./backend/web-gl/kernel');
const { kernelRunShortcut } = require('./kernel-run-shortcut');


/**
 *
 * @type {Kernel[]}
 */
const kernelOrder = [HeadlessGLKernel, WebGL2Kernel, WebGLKernel];

/**
 *
 * @type {string[]}
 */
const kernelTypes = ['gpu', 'cpu'];

const internalKernels = {
  'headlessgl': HeadlessGLKernel,
  'webgl2': WebGL2Kernel,
  'webgl': WebGLKernel,
};

let validate = true;

/**
 * The GPU.js library class which manages the GPU context for the creating kernels
 */
class GPU {
  static disableValidation() {
    validate = false;
  }

  static enableValidation() {
    validate = true;
  }

  static get isGPUSupported() {
    return kernelOrder.some(Kernel => Kernel.isSupported);
  }

  /**
   *
   * @returns {boolean}
   */
  static get isKernelMapSupported() {
    return kernelOrder.some(Kernel => Kernel.isSupported && Kernel.features.kernelMap);
  }

  /**
   * @desc TRUE is platform supports OffscreenCanvas
   */
  static get isOffscreenCanvasSupported() {
    return (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') || typeof importScripts !== 'undefined';
  }

  /**
   * @desc TRUE if platform supports WebGL
   */
  static get isWebGLSupported() {
    return WebGLKernel.isSupported;
  }

  /**
   * @desc TRUE if platform supports WebGL2
   */
  static get isWebGL2Supported() {
    return WebGL2Kernel.isSupported;
  }

  /**
   * @desc TRUE if platform supports HeadlessGL
   */
  static get isHeadlessGLSupported() {
    return HeadlessGLKernel.isSupported;
  }

  /**
   *
   * @desc TRUE if platform supports Canvas
   */
  static get isCanvasSupported() {
    return typeof HTMLCanvasElement !== 'undefined';
  }

  /**
   * @desc TRUE if platform supports HTMLImageArray}
   */
  static get isGPUHTMLImageArraySupported() {
    return WebGL2Kernel.isSupported;
  }

  /**
   * @desc TRUE if platform supports single precision}
   * @returns {boolean}
   */
  static get isSinglePrecisionSupported() {
    return kernelOrder.some(Kernel => Kernel.isSupported && Kernel.features.isFloatRead && Kernel.features.isTextureFloat);
  }

  /**
   * Creates an instance of GPU.
   * @param {IGPUSettings} [settings] - Settings to set mode, and other properties
   */
  constructor(settings) {
    settings = settings || {};
    this.canvas = settings.canvas || null;
    this.context = settings.context || null;
    this.mode = settings.mode;
    this.Kernel = null;
    this.kernels = [];
    this.functions = [];
    this.nativeFunctions = [];
    this.injectedNative = null;
    if (this.mode === 'dev') return;
    this.chooseKernel();
    // add functions from settings
    if (settings.functions) {
      for (let i = 0; i < settings.functions.length; i++) {
        this.addFunction(settings.functions[i]);
      }
    }

    // add native functions from settings
    if (settings.nativeFunctions) {
      for (const p in settings.nativeFunctions) {
        if (!settings.nativeFunctions.hasOwnProperty(p)) continue;
        this.addNativeFunction(p, settings.nativeFunctions[p]);
      }
    }
  }

  /**
   * Choose kernel type and save on .Kernel property of GPU
   */
  chooseKernel() {
    if (this.Kernel) return;

    let Kernel = null;

    if (this.context) {
      for (let i = 0; i < kernelOrder.length; i++) {
        const ExternalKernel = kernelOrder[i];
        if (ExternalKernel.isContextMatch(this.context)) {
          if (!ExternalKernel.isSupported) {
            throw new Error(`Kernel type ${ExternalKernel.name} not supported`);
          }
          Kernel = ExternalKernel;
          break;
        }
      }
      if (Kernel === null) {
        throw new Error('unknown Context');
      }
    } else if (this.mode) {
      if (this.mode in internalKernels) {
        if (!validate || internalKernels[this.mode].isSupported) {
          Kernel = internalKernels[this.mode];
        }
      } else if (this.mode === 'gpu') {
        for (let i = 0; i < kernelOrder.length; i++) {
          if (kernelOrder[i].isSupported) {
            Kernel = kernelOrder[i];
            break;
          }
        }
      } else if (this.mode === 'cpu') {
        Kernel = CPUKernel;
      }
      if (!Kernel) {
        throw new Error(`A requested mode of "${this.mode}" and is not supported`);
      }
    } else {
      for (let i = 0; i < kernelOrder.length; i++) {
        if (kernelOrder[i].isSupported) {
          Kernel = kernelOrder[i];
          break;
        }
      }
      if (!Kernel) {
        Kernel = CPUKernel;
      }
    }

    if (!this.mode) {
      this.mode = Kernel.mode;
    }
    this.Kernel = Kernel;
  }

  /**
   * @desc This creates a callable function object to call the kernel function with the argument parameter set
   * @param {Function|String|object} source - The calling to perform the conversion
   * @param {IGPUKernelSettings} [settings] - The parameter configuration object
   * @return {Kernel} callable function to run
   */
  createKernel(source, settings) {
    if (typeof source === 'undefined') {
      throw new Error('Missing source parameter');
    }
    if (typeof source !== 'object' && !utils.isFunction(source) && typeof source !== 'string') {
      throw new Error('source parameter not a function');
    }

    if (this.mode === 'dev') {
      const devKernel = gpuMock(source, upgradeDeprecatedCreateKernelSettings(settings));
      this.kernels.push(devKernel);
      return devKernel;
    }

    source = typeof source === 'function' ? source.toString() : source;
    const switchableKernels = {};
    const settingsCopy = upgradeDeprecatedCreateKernelSettings(settings) || {};
    // handle conversion of argumentTypes
    if (settings && typeof settings.argumentTypes === 'object') {
      settingsCopy.argumentTypes = Object.keys(settings.argumentTypes).map(argumentName => settings.argumentTypes[argumentName]);
    }

    function onRequestFallback(args) {
      const fallbackKernel = new CPUKernel(source, {
        argumentTypes: kernelRun.argumentTypes,
        constantTypes: kernelRun.constantTypes,
        graphical: kernelRun.graphical,
        loopMaxIterations: kernelRun.loopMaxIterations,
        constants: kernelRun.constants,
        dynamicOutput: kernelRun.dynamicOutput,
        dynamicArgument: kernelRun.dynamicArguments,
        output: kernelRun.output,
        precision: kernelRun.precision,
        pipeline: kernelRun.pipeline,
        immutable: kernelRun.immutable,
        optimizeFloatMemory: kernelRun.optimizeFloatMemory,
        fixIntegerDivisionAccuracy: kernelRun.fixIntegerDivisionAccuracy,
        functions: kernelRun.functions,
        nativeFunctions: kernelRun.nativeFunctions,
        injectedNative: kernelRun.injectedNative,
        subKernels: kernelRun.subKernels,
        strictIntegers: kernelRun.strictIntegers,
        debug: kernelRun.debug,
        warnVarUsage: kernelRun.warnVarUsage,
      });
      fallbackKernel.build.apply(fallbackKernel, args);
      const result = fallbackKernel.run.apply(fallbackKernel, args);
      kernelRun.replaceKernel(fallbackKernel);
      return result;
    }

    function onRequestSwitchKernel(args, kernel) {
      const argumentTypes = new Array(args.length);
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const type = kernel.argumentTypes[i];
        if (arg.type) {
          argumentTypes[i] = arg.type;
        } else {
          switch (type) {
            case 'Number':
            case 'Integer':
            case 'Float':
            case 'ArrayTexture(1)':
              argumentTypes[i] = utils.getVariableType(arg);
              break;
            default:
              argumentTypes[i] = type;
          }
        }
      }
      const signature = argumentTypes.join(',');
      const existingKernel = switchableKernels[signature];
      if (existingKernel) {
        existingKernel.run.apply(existingKernel, args);
        if (existingKernel.renderKernels) {
          return existingKernel.renderKernels();
        } else {
          return existingKernel.renderOutput();
        }
      }

      const newKernel = switchableKernels[signature] = new kernel.constructor(source, {
        argumentTypes,
        constantTypes: kernel.constantTypes,
        graphical: kernel.graphical,
        loopMaxIterations: kernel.loopMaxIterations,
        constants: kernel.constants,
        dynamicOutput: kernel.dynamicOutput,
        dynamicArgument: kernel.dynamicArguments,
        context: kernel.context,
        canvas: kernel.canvas,
        output: kernel.output,
        precision: kernel.precision,
        pipeline: kernel.pipeline,
        immutable: kernel.immutable,
        optimizeFloatMemory: kernel.optimizeFloatMemory,
        fixIntegerDivisionAccuracy: kernel.fixIntegerDivisionAccuracy,
        functions: kernel.functions,
        nativeFunctions: kernel.nativeFunctions,
        injectedNative: kernel.injectedNative,
        subKernels: kernel.subKernels,
        strictIntegers: kernel.strictIntegers,
        debug: kernel.debug,
        gpu: kernel.gpu,
        validate,
        warnVarUsage: kernel.warnVarUsage,
        returnType: kernel.returnType,
        onRequestFallback,
        onRequestSwitchKernel,
      });
      newKernel.build.apply(newKernel, args);
      newKernel.run.apply(newKernel, args);
      kernelRun.replaceKernel(newKernel);
      if (newKernel.renderKernels) {
        return newKernel.renderKernels();
      } else {
        return newKernel.renderOutput();
      }
    }
    const mergedSettings = Object.assign({
      context: this.context,
      canvas: this.canvas,
      functions: this.functions,
      nativeFunctions: this.nativeFunctions,
      injectedNative: this.injectedNative,
      gpu: this,
      validate,
      onRequestFallback,
      onRequestSwitchKernel
    }, settingsCopy);

    const kernelRun = kernelRunShortcut(new this.Kernel(source, mergedSettings));

    //if canvas didn't come from this, propagate from kernel
    if (!this.canvas) {
      this.canvas = kernelRun.canvas;
    }

    //if context didn't come from this, propagate from kernel
    if (!this.context) {
      this.context = kernelRun.context;
    }

    this.kernels.push(kernelRun);

    return kernelRun;
  }

  /**
   *
   * Create a super kernel which executes sub kernels
   * and saves their output to be used with the next sub kernel.
   * This can be useful if we want to save the output on one kernel,
   * and then use it as an input to another kernel. *Machine Learning*
   *
   * @param {Object|Array} subKernels - Sub kernels for this kernel
   * @param {Function} rootKernel - Root kernel
   *
   * @returns {Function} callable kernel function
   *
   * @example
   * const megaKernel = gpu.createKernelMap({
   *   addResult: function add(a, b) {
   *     return a[this.thread.x] + b[this.thread.x];
   *   },
   *   multiplyResult: function multiply(a, b) {
   *     return a[this.thread.x] * b[this.thread.x];
   *   },
   *  }, function(a, b, c) {
   *       return multiply(add(a, b), c);
   * });
   *
   * megaKernel(a, b, c);
   *
   * Note: You can also define subKernels as an array of functions.
   * > [add, multiply]
   *
   */
  createKernelMap() {
    let fn;
    let settings;
    if (typeof arguments[arguments.length - 2] === 'function') {
      fn = arguments[arguments.length - 2];
      settings = arguments[arguments.length - 1];
    } else {
      fn = arguments[arguments.length - 1];
    }

    if (this.mode !== 'dev') {
      if (!this.Kernel.isSupported || !this.Kernel.features.kernelMap) {
        if (this.mode && kernelTypes.indexOf(this.mode) < 0) {
          throw new Error(`kernelMap not supported on ${this.Kernel.name}`);
        }
      }
    }

    const settingsCopy = upgradeDeprecatedCreateKernelSettings(settings);
    // handle conversion of argumentTypes
    if (settings && typeof settings.argumentTypes === 'object') {
      settingsCopy.argumentTypes = Object.keys(settings.argumentTypes).map(argumentName => settings.argumentTypes[argumentName]);
    }

    if (Array.isArray(arguments[0])) {
      settingsCopy.subKernels = [];
      const functions = arguments[0];
      for (let i = 0; i < functions.length; i++) {
        const source = functions[i].toString();
        const name = utils.getFunctionNameFromString(source);
        settingsCopy.subKernels.push({
          name,
          source,
          property: i,
        });
      }
    } else {
      settingsCopy.subKernels = [];
      const functions = arguments[0];
      for (let p in functions) {
        if (!functions.hasOwnProperty(p)) continue;
        const source = functions[p].toString();
        const name = utils.getFunctionNameFromString(source);
        settingsCopy.subKernels.push({
          name: name || p,
          source,
          property: p,
        });
      }
    }
    return this.createKernel(fn, settingsCopy);
  }

  /**
   *
   * Combine different kernels into one super Kernel,
   * useful to perform multiple operations inside one
   * kernel without the penalty of data transfer between
   * cpu and gpu.
   *
   * The number of kernel functions sent to this method can be variable.
   * You can send in one, two, etc.
   *
   * @param {Function} subKernels - Kernel function(s) to combine.
   * @param {Function} rootKernel - Root kernel to combine kernels into
   *
   * @example
   *   combineKernels(add, multiply, function(a,b,c){
   *     return add(multiply(a,b), c)
   *  })
   *
   * @returns {Function} Callable kernel function
   *
   */
  combineKernels() {
    const firstKernel = arguments[0];
    const combinedKernel = arguments[arguments.length - 1];
    if (firstKernel.kernel.constructor.mode === 'cpu') return combinedKernel;
    const canvas = arguments[0].canvas;
    const context = arguments[0].context;
    const max = arguments.length - 1;
    for (let i = 0; i < max; i++) {
      arguments[i]
        .setCanvas(canvas)
        .setContext(context)
        .setPipeline(true);
    }

    return function() {
      const texture = combinedKernel.apply(this, arguments);
      if (texture.toArray) {
        return texture.toArray();
      }
      return texture;
    };
  }

  /**
   * @desc Adds additional functions, that the kernel may call.
   * @param {Function|String} source - Javascript function to convert
   * @param {IFunctionSettings} [settings]
   * @returns {GPU} returns itself
   */
  addFunction(source, settings) {
    this.functions.push(utils.functionToIFunction(source, settings));
    return this;
  }

  /**
   * @desc Adds additional native functions, that the kernel may call.
   * @param {String} name - native function name, used for reverse lookup
   * @param {String} source - the native function implementation, as it would be defined in it's entirety
   * @param {object} [settings]
   * @returns {GPU} returns itself
   */
  addNativeFunction(name, source, settings) {
    if (this.kernels.length > 0) {
      throw new Error('Cannot call "addNativeFunction" after "createKernels" has been called.');
    }
    settings = settings || {};
    const { argumentTypes, argumentNames } = this.Kernel.nativeFunctionArguments(source) || {};
    this.nativeFunctions.push({
      name,
      source,
      settings,
      argumentTypes,
      argumentNames,
      returnType: settings.returnType || this.Kernel.nativeFunctionReturnType(source),
    });
    return this;
  }

  /**
   * Inject a string just before translated kernel functions
   * @param {String} source
   * @return {GPU}
   */
  injectNative(source) {
    this.injectedNative = source;
    return this;
  }

  /**
   * @desc Destroys all memory associated with gpu.js & the webGl if we created it
   */
  destroy() {
    if (!this.kernels) return;
    // perform on next run loop - for some reason we dont get lose context events
    // if webGl is created and destroyed in the same run loop.
    setTimeout(() => {
      for (let i = 0; i < this.kernels.length; i++) {
        this.kernels[i].destroy(true); // remove canvas if exists
      }
      // all kernels are associated with one context, go ahead and take care of it here
      let firstKernel = this.kernels[0];
      if (firstKernel) {
        // if it is shortcut
        if (firstKernel.kernel) {
          firstKernel = firstKernel.kernel;
        }
        if (firstKernel.constructor.destroyContext) {
          firstKernel.constructor.destroyContext(this.context);
        }
      }
    }, 0);
  }
}


function upgradeDeprecatedCreateKernelSettings(settings) {
  if (!settings) {
    return {};
  }
  const upgradedSettings = Object.assign({}, settings);

  if (settings.hasOwnProperty('floatOutput')) {
    utils.warnDeprecated('setting', 'floatOutput', 'precision');
    upgradedSettings.precision = settings.floatOutput ? 'single' : 'unsigned';
  }
  if (settings.hasOwnProperty('outputToTexture')) {
    utils.warnDeprecated('setting', 'outputToTexture', 'pipeline');
    upgradedSettings.pipeline = Boolean(settings.outputToTexture);
  }
  if (settings.hasOwnProperty('outputImmutable')) {
    utils.warnDeprecated('setting', 'outputImmutable', 'immutable');
    upgradedSettings.immutable = Boolean(settings.outputImmutable);
  }
  if (settings.hasOwnProperty('floatTextures')) {
    utils.warnDeprecated('setting', 'floatTextures', 'optimizeFloatMemory');
    upgradedSettings.optimizeFloatMemory = Boolean(settings.floatTextures);
  }
  return upgradedSettings;
}

module.exports = {
  GPU,
  kernelOrder,
  kernelTypes
};
},{"./backend/cpu/kernel":47,"./backend/headless-gl/kernel":72,"./backend/web-gl/kernel":107,"./backend/web-gl2/kernel":142,"./kernel-run-shortcut":147,"./utils":150,"gpu-mock.js":42}],145:[function(require,module,exports){
const { GPU } = require('./gpu');
const { alias } = require('./alias');
const { utils } = require('./utils');
const { Input, input } = require('./input');
const { Texture } = require('./texture');
const { FunctionBuilder } = require('./backend/function-builder');
const { FunctionNode } = require('./backend/function-node');
const { CPUFunctionNode } = require('./backend/cpu/function-node');
const { CPUKernel } = require('./backend/cpu/kernel');

const { HeadlessGLKernel } = require('./backend/headless-gl/kernel');

const { WebGLFunctionNode } = require('./backend/web-gl/function-node');
const { WebGLKernel } = require('./backend/web-gl/kernel');
const { kernelValueMaps: webGLKernelValueMaps } = require('./backend/web-gl/kernel-value-maps');

const { WebGL2FunctionNode } = require('./backend/web-gl2/function-node');
const { WebGL2Kernel } = require('./backend/web-gl2/kernel');
const { kernelValueMaps: webGL2KernelValueMaps } = require('./backend/web-gl2/kernel-value-maps');

const { GLKernel } = require('./backend/gl/kernel');

const { Kernel } = require('./backend/kernel');

const { FunctionTracer } = require('./backend/function-tracer');

module.exports = {
  alias,
  CPUFunctionNode,
  CPUKernel,
  GPU,
  FunctionBuilder,
  FunctionNode,
  HeadlessGLKernel,
  Input,
  input,
  Texture,
  utils,

  WebGL2FunctionNode,
  WebGL2Kernel,
  webGL2KernelValueMaps,

  WebGLFunctionNode,
  WebGLKernel,
  webGLKernelValueMaps,

  GLKernel,
  Kernel,
  FunctionTracer,
};
},{"./alias":44,"./backend/cpu/function-node":45,"./backend/cpu/kernel":47,"./backend/function-builder":48,"./backend/function-node":49,"./backend/function-tracer":50,"./backend/gl/kernel":52,"./backend/headless-gl/kernel":72,"./backend/kernel":74,"./backend/web-gl/function-node":76,"./backend/web-gl/kernel":107,"./backend/web-gl/kernel-value-maps":77,"./backend/web-gl2/function-node":110,"./backend/web-gl2/kernel":142,"./backend/web-gl2/kernel-value-maps":111,"./gpu":144,"./input":146,"./texture":149,"./utils":150}],146:[function(require,module,exports){
class Input {
  constructor(value, size) {
    this.value = value;
    if (Array.isArray(size)) {
      this.size = size;
    } else {
      this.size = new Int32Array(3);
      if (size.z) {
        this.size = new Int32Array([size.x, size.y, size.z]);
      } else if (size.y) {
        this.size = new Int32Array([size.x, size.y]);
      } else {
        this.size = new Int32Array([size.x]);
      }
    }

    const [w, h, d] = this.size;
    if (d) {
      if (this.value.length !== (w * h * d)) {
        throw new Error(`Input size ${this.value.length} does not match ${w} * ${h} * ${d} = ${(h * w * d)}`);
      }
    } else if (h) {
      if (this.value.length !== (w * h)) {
        throw new Error(`Input size ${this.value.length} does not match ${w} * ${h} = ${(h * w)}`);
      }
    } else {
      if (this.value.length !== w) {
        throw new Error(`Input size ${this.value.length} does not match ${w}`);
      }
    }

  }

  toArray() {
    const { utils } = require('./utils');
    const [w, h, d] = this.size;
    if (d) {
      return utils.erectMemoryOptimized3DFloat(this.value.subarray ? this.value : new Float32Array(this.value), w, h, d);
    } else if (h) {
      return utils.erectMemoryOptimized2DFloat(this.value.subarray ? this.value : new Float32Array(this.value), w, h);
    } else {
      return this.value;
    }
  }
}

function input(value, size) {
  return new Input(value, size);
}

module.exports = {
  Input,
  input
};
},{"./utils":150}],147:[function(require,module,exports){
const { utils } = require('./utils');

/**
 * Makes kernels easier for mortals (including me)
 * @param kernel
 * @returns {function()}
 */
function kernelRunShortcut(kernel) {
  let run = function() {
    kernel.build.apply(kernel, arguments);
    if (kernel.renderKernels) {
      run = function() {
        kernel.run.apply(kernel, arguments);
        if (kernel.switchingKernels) {
          kernel.switchingKernels = false;
          return kernel.onRequestSwitchKernel(arguments, kernel);
        }
        return kernel.renderKernels();
      };
    } else if (kernel.renderOutput) {
      run = function() {
        kernel.run.apply(kernel, arguments);
        if (kernel.switchingKernels) {
          kernel.switchingKernels = false;
          return kernel.onRequestSwitchKernel(arguments, kernel);
        }
        return kernel.renderOutput();
      };
    } else {
      run = function() {
        return kernel.run.apply(kernel, arguments);
      };
    }
    return run.apply(kernel, arguments);
  };
  const shortcut = function() {
    return run.apply(kernel, arguments);
  };
  /**
   * Run kernel in async mode
   * @returns {Promise<KernelOutput>}
   */
  shortcut.exec = function() {
    return new Promise((accept, reject) => {
      try {
        accept(run.apply(this, arguments));
      } catch (e) {
        reject(e);
      }
    });
  };
  shortcut.replaceKernel = function(replacementKernel) {
    kernel = replacementKernel;
    bindKernelToShortcut(kernel, shortcut);
    shortcut.kernel = kernel;
  };

  bindKernelToShortcut(kernel, shortcut);
  shortcut.kernel = kernel;
  return shortcut;
}

function bindKernelToShortcut(kernel, shortcut) {
  const properties = utils.allPropertiesOf(kernel);
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    if (property[0] === '_' && property[1] === '_') continue;
    if (typeof kernel[property] === 'function') {
      if (property.substring(0, 3) === 'add' || property.substring(0, 3) === 'set') {
        shortcut[property] = function() {
          kernel[property].apply(kernel, arguments);
          return shortcut;
        };
      } else {
        if (property === 'toString') {
          shortcut.toString = function() {
            return kernel.toString.apply(kernel, arguments);
          };
        } else {
          shortcut[property] = kernel[property].bind(kernel);
        }
      }
    } else {
      shortcut.__defineGetter__(property, () => {
        return kernel[property];
      });
      shortcut.__defineSetter__(property, (value) => {
        kernel[property] = value;
      });
    }
  }
}
module.exports = {
  kernelRunShortcut
};
},{"./utils":150}],148:[function(require,module,exports){
const source = `

uniform highp float triangle_noise_seed;
highp float triangle_noise_shift = 0.000001;

//https://www.shadertoy.com/view/4t2SDh
//note: uniformly distributed, normalized rand, [0;1[
float nrand( vec2 n )
{
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}
//note: remaps v to [0;1] in interval [a;b]
float remap( float a, float b, float v )
{
  return clamp( (v-a) / (b-a), 0.0, 1.0 );
}

float n4rand( vec2 n )
{
  float t = fract( triangle_noise_seed + triangle_noise_shift );
  float nrnd0 = nrand( n + 0.07*t );
  float nrnd1 = nrand( n + 0.11*t );  
  float nrnd2 = nrand( n + 0.13*t );
  float nrnd3 = nrand( n + 0.17*t );
  float result = (nrnd0+nrnd1+nrnd2+nrnd3) / 4.0;
  triangle_noise_shift = result + 0.000001;
  return result;
}`;

const name = 'triangle-noise-noise';

const functionMatch = 'Math.random()';

const functionReplace = 'n4rand(vTexCoord)';

const functionReturnType = 'Number';

const onBeforeRun = (kernel) => {
  kernel.setUniform1f('triangle_noise_seed', Math.random());
};

/**
 *
 * @type IPlugin
 */
module.exports = {
  name,
  onBeforeRun,
  functionMatch,
  functionReplace,
  functionReturnType,
  source
};
},{}],149:[function(require,module,exports){
let clone1DKernels = {};
const cloneKernel1DSource = `function(value) {return value[this.thread.x];}`;
let clone2DKernels = {};
const cloneKernel2DSource = `function(value) {return value[this.thread.y][this.thread.x];}`;
let clone3DKernels = {};
const cloneKernel3DSource = `function(value) {return value[this.thread.z][this.thread.y][this.thread.x];}`;

/**
 * @desc WebGl Texture implementation in JS
 * @param {IGPUTextureSettings} settings
 */
class Texture {
  constructor(settings) {
    const {
      texture,
      size,
      dimensions,
      output,
      context,
      type = 'NumberTexture',
      kernel,
    } = settings;
    if (!output) throw new Error('settings property "output" required.');
    if (!context) throw new Error('settings property "context" required.');
    this.texture = texture;
    this.size = size;
    this.dimensions = dimensions;
    this.output = output;
    this.context = context;
    this.kernel = kernel;
    this.type = type;
  }

  /**
   * @desc Converts the Texture into a JavaScript Array
   * @returns {TextureArrayOutput}
   */
  toArray() {
    throw new Error(`Not implemented on ${this.constructor.name}`);
  }

  /**
   * @desc Clones the Texture
   * @returns {Texture}
   */
  clone() {
    const kernel = this._getCloneKernel();
    kernel.run(this);
    return kernel.renderOutput();
  }

  /**
   *
   * @return {IDirectKernelSettings}
   * @private
   */
  _getCloneKernelSettings() {
    const { output, context, kernel } = this;
    return {
      argumentTypes: [this.type],
      dynamicOutput: true,
      dynamicArguments: true,
      pipeline: true,
      precision: kernel.precision,
      tactic: kernel.tactic,
      output,
      context,
    };
  }

  _getCloneKernelKey() {
    const { kernel, type } = this;
    return `${kernel.constructor.name}-${kernel.precision}-${kernel.tactic}-${type}`;
  }

  /**
   * Get clone kernel
   * @return {Kernel}
   * @private
   */
  _getCloneKernel() {
    const { output } = this;
    const key = this._getCloneKernelKey();

    switch (output.length) {
      case 1:
        return clone1DKernels[key] = this._checkBuildCloneKernel(cloneKernel1DSource, clone1DKernels[key]);
      case 2:
        return clone2DKernels[key] = this._checkBuildCloneKernel(cloneKernel2DSource, clone2DKernels[key]);
      case 3:
        return clone3DKernels[key] = this._checkBuildCloneKernel(cloneKernel3DSource, clone3DKernels[key]);
      default:
        throw new Error(`Cannot copy texture with ${output.length} dimensions`);
    }
  }

  /**
   *
   * Return existing or instantiate and build clone kernel
   * @param {string} source
   * @param {Kernel} [cloneKernel]
   * @return {Kernel}
   * @private
   */
  _checkBuildCloneKernel(source, cloneKernel) {
    if (cloneKernel && cloneKernel.context === this.context) {
      return cloneKernel.setOutput(this.output);
    }
    cloneKernel = new this.kernel.constructor(source, this._getCloneKernelSettings());
    cloneKernel.build(this);
    return cloneKernel;
  }

  /**
   * @desc Deletes the Texture
   */
  delete() {
    return this.context.deleteTexture(this.texture);
  }
}

module.exports = {
  Texture
};
},{}],150:[function(require,module,exports){
const acorn = require('acorn');
const { Input } = require('./input');
const { Texture } = require('./texture');

const FUNCTION_NAME = /function ([^(]*)/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

/**
 *
 * @desc Various utility functions / snippets of code that GPU.JS uses internally.
 * This covers various snippets of code that is not entirely gpu.js specific (ie. may find uses elsewhere)
 */
const utils = {
  /**
   *
   * @desc Gets the system endianness, and cache it
   * @returns {String} 'LE' or 'BE' depending on system architecture
   * Credit: https://gist.github.com/TooTallNate/4750953
   */
  systemEndianness() {
    return _systemEndianness;
  },
  getSystemEndianness() {
    const b = new ArrayBuffer(4);
    const a = new Uint32Array(b);
    const c = new Uint8Array(b);
    a[0] = 0xdeadbeef;
    if (c[0] === 0xef) return 'LE';
    if (c[0] === 0xde) return 'BE';
    throw new Error('unknown endianness');
  },

  /**
   * @descReturn TRUE, on a JS function
   * @param {Function} funcObj - Object to validate if its a function
   * @returns  {Boolean} TRUE if the object is a JS function
   */
  isFunction(funcObj) {
    return typeof(funcObj) === 'function';
  },

  /**
   * @desc Return TRUE, on a valid JS function string
   * Note: This does just a VERY simply sanity check. And may give false positives.
   *
   * @param {String} fn - String of JS function to validate
   * @returns {Boolean} TRUE if the string passes basic validation
   */
  isFunctionString(fn) {
    if (typeof fn === 'string') {
      return (fn
        .slice(0, 'function'.length)
        .toLowerCase() === 'function');
    }
    return false;
  },

  /**
   * @desc Return the function name from a JS function string
   * @param {String} funcStr - String of JS function to validate
   * @returns {String} Function name string (if found)
   */
  getFunctionNameFromString(funcStr) {
    return FUNCTION_NAME.exec(funcStr)[1].trim();
  },

  getFunctionBodyFromString(funcStr) {
    return funcStr.substring(funcStr.indexOf('{') + 1, funcStr.lastIndexOf('}'));
  },

  /**
   * @desc Return list of argument names extracted from a javascript function
   * @param {String} fn - String of JS function to validate
   * @returns {String[]}  Array representing all the parameter names
   */
  getArgumentNamesFromString(fn) {
    const fnStr = fn.replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null) {
      result = [];
    }
    return result;
  },

  /**
   * @desc Returns a clone
   * @param {Object} obj - Object to clone
   * @returns {Object|Array} Cloned object
   */
  clone(obj) {
    if (obj === null || typeof obj !== 'object' || obj.hasOwnProperty('isActiveClone')) return obj;

    const temp = obj.constructor(); // changed

    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj.isActiveClone = null;
        temp[key] = utils.clone(obj[key]);
        delete obj.isActiveClone;
      }
    }

    return temp;
  },

  /**
   * @desc Checks if is an array or Array-like object
   * @param {Object} array - The argument object to check if is array
   * @returns {Boolean}  true if is array or Array-like object
   */
  isArray(array) {
    return !isNaN(array.length);
  },

  /**
   * @desc Evaluate the argument type, to apply respective logic for it
   * @param {Object} value - The argument object to evaluate type
   * @returns {String}  Argument type Array/Number/Float/Texture/Unknown
   */
  getVariableType(value, strictIntegers) {
    if (utils.isArray(value)) {
      if (value[0].nodeName === 'IMG') {
        return 'HTMLImageArray';
      }
      return 'Array';
    }

    switch (value.constructor) {
      case Boolean:
        return 'Boolean';
      case Number:
        if (strictIntegers && Number.isInteger(value)) {
          return 'Integer';
        }
        return 'Float';
      case Texture:
        return value.type;
      case Input:
        return 'Input';
    }
    switch (value.nodeName) {
      case 'IMG':
        return 'HTMLImage';
      case 'VIDEO':
        return 'HTMLVideo';
    }
    if (value.hasOwnProperty('type')) {
      return value.type;
    }
    return 'Unknown';
  },

  getKernelTextureSize(settings, dimensions) {
    let [w, h, d] = dimensions;
    let texelCount = (w || 1) * (h || 1) * (d || 1);

    if (settings.optimizeFloatMemory && settings.precision === 'single') {
      w = texelCount = Math.ceil(texelCount / 4);
    }
    // if given dimensions == a 2d image
    if (h > 1 && w * h === texelCount) {
      return new Int32Array([w, h]);
    }
    return utils.closestSquareDimensions(texelCount);
  },

  /**
   *
   * @param {Number} length
   * @returns {TextureDimensions}
   */
  closestSquareDimensions(length) {
    const sqrt = Math.sqrt(length);
    let high = Math.ceil(sqrt);
    let low = Math.floor(sqrt);
    while (high * low < length) {
      high--;
      low = Math.ceil(length / high);
    }
    return new Int32Array([low, Math.ceil(length / low)]);
  },

  /**
   * A texture takes up four
   * @param {OutputDimensions} dimensions
   * @param {Number} bitRatio
   * @returns {TextureDimensions}
   */
  getMemoryOptimizedFloatTextureSize(dimensions, bitRatio) {
    const totalArea = utils.roundTo((dimensions[0] || 1) * (dimensions[1] || 1) * (dimensions[2] || 1) * (dimensions[3] || 1), 4);
    const texelCount = totalArea / bitRatio;
    return utils.closestSquareDimensions(texelCount);
  },

  /**
   *
   * @param dimensions
   * @param bitRatio
   * @returns {*|TextureDimensions}
   */
  getMemoryOptimizedPackedTextureSize(dimensions, bitRatio) {
    const [w, h, d] = dimensions;
    const totalArea = utils.roundTo((w || 1) * (h || 1) * (d || 1), 4);
    const texelCount = totalArea / (4 / bitRatio);
    return utils.closestSquareDimensions(texelCount);
  },

  roundTo(n, d) {
    return Math.floor((n + d - 1) / d) * d;
  },
  /**
   * @desc Return the dimension of an array.
   * @param {Array|String|Texture|Input} x - The array
   * @param {Boolean} [pad] - To include padding in the dimension calculation
   * @returns {OutputDimensions}
   */
  getDimensions(x, pad) {
    let ret;
    if (utils.isArray(x)) {
      const dim = [];
      let temp = x;
      while (utils.isArray(temp)) {
        dim.push(temp.length);
        temp = temp[0];
      }
      ret = dim.reverse();
    } else if (x instanceof Texture) {
      ret = x.output;
    } else if (x instanceof Input) {
      ret = x.size;
    } else {
      throw new Error(`Unknown dimensions of ${x}`);
    }

    if (pad) {
      ret = Array.from(ret);
      while (ret.length < 3) {
        ret.push(1);
      }
    }

    return new Int32Array(ret);
  },

  /**
   * Puts a nested 2d array into a one-dimensional target array
   * @param {Array|*} array
   * @param {Float32Array|Float64Array} target
   */
  flatten2dArrayTo(array, target) {
    let offset = 0;
    for (let y = 0; y < array.length; y++) {
      target.set(array[y], offset);
      offset += array[y].length;
    }
  },

  /**
   * Puts a nested 3d array into a one-dimensional target array
   * @param {Array|*} array
   * @param {Float32Array|Float64Array} target
   */
  flatten3dArrayTo(array, target) {
    let offset = 0;
    for (let z = 0; z < array.length; z++) {
      for (let y = 0; y < array[z].length; y++) {
        target.set(array[z][y], offset);
        offset += array[z][y].length;
      }
    }
  },

  /**
   * Puts a nested 4d array into a one-dimensional target array
   * @param {Array|*} array
   * @param {Float32Array|Float64Array} target
   */
  flatten4dArrayTo(array, target) {
    let offset = 0;
    for (let l = 0; l < array.length; l++) {
      for (let z = 0; z < array[l].length; z++) {
        for (let y = 0; y < array[l][z].length; y++) {
          target.set(array[l][z][y], offset);
          offset += array[l][z][y].length;
        }
      }
    }
  },

  /**
   * Puts a nested 1d, 2d, or 3d array into a one-dimensional target array
   * @param {Float32Array|Uint16Array|Uint8Array} array
   * @param {Float32Array} target
   */
  flattenTo(array, target) {
    if (utils.isArray(array[0])) {
      if (utils.isArray(array[0][0])) {
        if (utils.isArray(array[0][0][0])) {
          utils.flatten4dArrayTo(array, target);
        } else {
          utils.flatten3dArrayTo(array, target);
        }
      } else {
        utils.flatten2dArrayTo(array, target);
      }
    } else {
      target.set(array);
    }
  },

  /**
   *
   * @desc Splits an array into smaller arrays.
   * Number of elements in one small chunk is given by `part`
   *
   * @param {Number[]} array - The array to split into chunks
   * @param {Number} part - elements in one chunk
   *
   * @returns {Number[]} An array of smaller chunks
   */
  splitArray(array, part) {
    const result = [];
    for (let i = 0; i < array.length; i += part) {
      result.push(new array.constructor(array.buffer, i * 4 + array.byteOffset, part));
    }
    return result;
  },

  getAstString(source, ast) {
    const lines = Array.isArray(source) ? source : source.split(/\r?\n/g);
    const start = ast.loc.start;
    const end = ast.loc.end;
    const result = [];
    if (start.line === end.line) {
      result.push(lines[start.line - 1].substring(start.column, end.column));
    } else {
      result.push(lines[start.line - 1].slice(start.column));
      for (let i = start.line; i < end.line; i++) {
        result.push(lines[i]);
      }
      result.push(lines[end.line - 1].slice(0, end.column));
    }
    return result.join('\n');
  },

  allPropertiesOf(obj) {
    const props = [];

    do {
      props.push.apply(props, Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));

    return props;
  },

  /**
   * @param {Array} lines - An Array of strings
   * @returns {String} Single combined String, separated by *\n*
   */
  linesToString(lines) {
    if (lines.length > 0) {
      return lines.join(';\n') + ';\n';
    } else {
      return '\n';
    }
  },
  warnDeprecated(type, oldName, newName) {
    if (newName) {
      console.warn(`You are using a deprecated ${ type } "${ oldName }". It has been replaced with "${ newName }". Fixing, but please upgrade as it will soon be removed.`);
    } else {
      console.warn(`You are using a deprecated ${ type } "${ oldName }". It has been removed. Fixing, but please upgrade as it will soon be removed.`);
    }
  },
  /**
   *
   * @param {String|Function} source
   * @param {IFunctionSettings} [settings]
   * @returns {IFunction}
   */
  functionToIFunction(source, settings) {
    settings = settings || {};
    if (typeof source !== 'string' && typeof source !== 'function') throw new Error('source not a string or function');
    const sourceString = typeof source === 'string' ? source : source.toString();

    let argumentTypes = [];

    if (Array.isArray(settings.argumentTypes)) {
      argumentTypes = settings.argumentTypes;
    } else if (typeof settings.argumentTypes === 'object') {
      argumentTypes = utils.getArgumentNamesFromString(sourceString)
        .map(name => settings.argumentTypes[name]) || [];
    } else {
      argumentTypes = settings.argumentTypes || [];
    }

    return {
      source: sourceString,
      argumentTypes,
      returnType: settings.returnType || null,
    };
  },
  flipPixels: (pixels, width, height) => {
    // https://stackoverflow.com/a/41973289/1324039
    const halfHeight = height / 2 | 0; // the | 0 keeps the result an int
    const bytesPerRow = width * 4;
    // make a temp buffer to hold one row
    const temp = new Uint8ClampedArray(width * 4);
    const result = pixels.slice(0);
    for (let y = 0; y < halfHeight; ++y) {
      const topOffset = y * bytesPerRow;
      const bottomOffset = (height - y - 1) * bytesPerRow;

      // make copy of a row on the top half
      temp.set(result.subarray(topOffset, topOffset + bytesPerRow));

      // copy a row from the bottom half to the top
      result.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);

      // copy the copy of the top half row to the bottom half
      result.set(temp, bottomOffset);
    }
    return result;
  },
  erectPackedFloat: (array, width) => {
    return array.subarray(0, width);
  },
  erect2DPackedFloat: (array, width, height) => {
    const yResults = new Array(height);
    for (let y = 0; y < height; y++) {
      const xStart = y * width;
      const xEnd = xStart + width;
      yResults[y] = array.subarray(xStart, xEnd);
    }
    return yResults;
  },
  erect3DPackedFloat: (array, width, height, depth) => {
    const zResults = new Array(depth);
    for (let z = 0; z < depth; z++) {
      const yResults = new Array(height);
      for (let y = 0; y < height; y++) {
        const xStart = (z * height * width) + y * width;
        const xEnd = xStart + width;
        yResults[y] = array.subarray(xStart, xEnd);
      }
      zResults[z] = yResults;
    }
    return zResults;
  },
  erectMemoryOptimizedFloat: (array, width) => {
    return array.subarray(0, width);
  },
  erectMemoryOptimized2DFloat: (array, width, height) => {
    const yResults = new Array(height);
    for (let y = 0; y < height; y++) {
      const offset = y * width;
      yResults[y] = array.subarray(offset, offset + width);
    }
    return yResults;
  },
  erectMemoryOptimized3DFloat: (array, width, height, depth) => {
    const zResults = new Array(depth);
    for (let z = 0; z < depth; z++) {
      const yResults = new Array(height);
      for (let y = 0; y < height; y++) {
        const offset = (z * height * width) + (y * width);
        yResults[y] = array.subarray(offset, offset + width);
      }
      zResults[z] = yResults;
    }
    return zResults;
  },
  erectFloat: (array, width) => {
    const xResults = new Float32Array(width);
    let i = 0;
    for (let x = 0; x < width; x++) {
      xResults[x] = array[i];
      i += 4;
    }
    return xResults;
  },
  erect2DFloat: (array, width, height) => {
    const yResults = new Array(height);
    let i = 0;
    for (let y = 0; y < height; y++) {
      const xResults = new Float32Array(width);
      for (let x = 0; x < width; x++) {
        xResults[x] = array[i];
        i += 4;
      }
      yResults[y] = xResults;
    }
    return yResults;
  },
  erect3DFloat: (array, width, height, depth) => {
    const zResults = new Array(depth);
    let i = 0;
    for (let z = 0; z < depth; z++) {
      const yResults = new Array(height);
      for (let y = 0; y < height; y++) {
        const xResults = new Float32Array(width);
        for (let x = 0; x < width; x++) {
          xResults[x] = array[i];
          i += 4;
        }
        yResults[y] = xResults;
      }
      zResults[z] = yResults;
    }
    return zResults;
  },
  erectArray2: (array, width) => {
    const xResults = new Array(width);
    const xResultsMax = width * 4;
    let i = 0;
    for (let x = 0; x < xResultsMax; x += 4) {
      xResults[i++] = array.subarray(x, x + 2);
    }
    return xResults;
  },
  erect2DArray2: (array, width, height) => {
    const yResults = new Array(height);
    const XResultsMax = width * 4;
    for (let y = 0; y < height; y++) {
      const xResults = new Array(width);
      const offset = y * XResultsMax;
      let i = 0;
      for (let x = 0; x < XResultsMax; x += 4) {
        xResults[i++] = array.subarray(x + offset, x + offset + 2);
      }
      yResults[y] = xResults;
    }
    return yResults;
  },
  erect3DArray2: (array, width, height, depth) => {
    const xResultsMax = width * 4;
    const zResults = new Array(depth);
    for (let z = 0; z < depth; z++) {
      const yResults = new Array(height);
      for (let y = 0; y < height; y++) {
        const xResults = new Array(width);
        const offset = (z * xResultsMax * height) + (y * xResultsMax);
        let i = 0;
        for (let x = 0; x < xResultsMax; x += 4) {
          xResults[i++] = array.subarray(x + offset, x + offset + 2);
        }
        yResults[y] = xResults;
      }
      zResults[z] = yResults;
    }
    return zResults;
  },
  erectArray3: (array, width) => {
    const xResults = new Array(width);
    const xResultsMax = width * 4;
    let i = 0;
    for (let x = 0; x < xResultsMax; x += 4) {
      xResults[i++] = array.subarray(x, x + 3);
    }
    return xResults;
  },
  erect2DArray3: (array, width, height) => {
    const xResultsMax = width * 4;
    const yResults = new Array(height);
    for (let y = 0; y < height; y++) {
      const xResults = new Array(width);
      const offset = y * xResultsMax;
      let i = 0;
      for (let x = 0; x < xResultsMax; x += 4) {
        xResults[i++] = array.subarray(x + offset, x + offset + 3);
      }
      yResults[y] = xResults;
    }
    return yResults;
  },
  erect3DArray3: (array, width, height, depth) => {
    const xResultsMax = width * 4;
    const zResults = new Array(depth);
    for (let z = 0; z < depth; z++) {
      const yResults = new Array(height);
      for (let y = 0; y < height; y++) {
        const xResults = new Array(width);
        const offset = (z * xResultsMax * height) + (y * xResultsMax);
        let i = 0;
        for (let x = 0; x < xResultsMax; x += 4) {
          xResults[i++] = array.subarray(x + offset, x + offset + 3);
        }
        yResults[y] = xResults;
      }
      zResults[z] = yResults;
    }
    return zResults;
  },
  erectArray4: (array, width) => {
    const xResults = new Array(array);
    const xResultsMax = width * 4;
    let i = 0;
    for (let x = 0; x < xResultsMax; x += 4) {
      xResults[i++] = array.subarray(x, x + 4);
    }
    return xResults;
  },
  erect2DArray4: (array, width, height) => {
    const xResultsMax = width * 4;
    const yResults = new Array(height);
    for (let y = 0; y < height; y++) {
      const xResults = new Array(width);
      const offset = y * xResultsMax;
      let i = 0;
      for (let x = 0; x < xResultsMax; x += 4) {
        xResults[i++] = array.subarray(x + offset, x + offset + 4);
      }
      yResults[y] = xResults;
    }
    return yResults;
  },
  erect3DArray4: (array, width, height, depth) => {
    const xResultsMax = width * 4;
    const zResults = new Array(depth);
    for (let z = 0; z < depth; z++) {
      const yResults = new Array(height);
      for (let y = 0; y < height; y++) {
        const xResults = new Array(width);
        const offset = (z * xResultsMax * height) + (y * xResultsMax);
        let i = 0;
        for (let x = 0; x < xResultsMax; x += 4) {
          xResults[i++] = array.subarray(x + offset, x + offset + 4);
        }
        yResults[y] = xResults;
      }
      zResults[z] = yResults;
    }
    return zResults;
  },

  /**
   *
   * @param {String} source
   * @param {Object} settings
   * @return {String}
   */
  flattenFunctionToString: (source, settings) => {
    const { findDependency, thisLookup, doNotDefine } = settings;
    let flattened = settings.flattened;
    if (!flattened) {
      flattened = settings.flattened = {};
    }
    const ast = acorn.parse(source);
    const functionDependencies = [];

    function flatten(ast) {
      if (Array.isArray(ast)) {
        const results = [];
        for (let i = 0; i < ast.length; i++) {
          results.push(flatten(ast[i]));
        }
        return results.join('');
      }
      switch (ast.type) {
        case 'Program':
          return flatten(ast.body);
        case 'FunctionDeclaration':
          return `function ${ast.id.name}(${ast.params.map(flatten).join(', ')}) ${ flatten(ast.body) }`;
        case 'BlockStatement': {
          const result = [];
          for (let i = 0; i < ast.body.length; i++) {
            result.push(flatten(ast.body[i]), ';\n');
          }
          return `{\n${result.join('')}}`;
        }
        case 'VariableDeclaration':
          switch (ast.declarations[0].id.type) {
            case 'ObjectPattern': {
              const source = flatten(ast.declarations[0].init);
              const properties = ast.declarations.map(declaration => declaration.id.properties.map(flatten))[0];
              if (/this/.test(source)) {
                const result = [];
                const lookups = properties.map(thisLookup);
                for (let i = 0; i < lookups.length; i++) {
                  const lookup = lookups[i];
                  if (lookup === null) continue;
                  const property = properties[i];
                  result.push(`${ast.kind} ${ property } = ${ lookup };\n`);
                }

                return result.join('');
              }
              return `${ast.kind} { ${properties} } = ${source}`;
            }
            case 'ArrayPattern':
              return `${ast.kind} [ ${ ast.declarations.map(declaration => flatten(declaration.id)).join(', ') } ] = ${flatten(ast.declarations[0].init)}`;
          }
          if (doNotDefine && doNotDefine.indexOf(ast.declarations[0].id.name) !== -1) {
            return '';
          }
          return `${ast.kind} ${ast.declarations[0].id.name} = ${flatten(ast.declarations[0].init)}`;
        case 'CallExpression': {
          if (ast.callee.property.name === 'subarray') {
            return `${flatten(ast.callee.object)}.${flatten(ast.callee.property)}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
          }
          if (ast.callee.object.name === 'gl' || ast.callee.object.name === 'context') {
            return `${flatten(ast.callee.object)}.${flatten(ast.callee.property)}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
          }
          if (ast.callee.object.type === 'ThisExpression') {
            functionDependencies.push(findDependency('this', ast.callee.property.name));
            return `${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
          } else if (ast.callee.object.name) {
            const foundSource = findDependency(ast.callee.object.name, ast.callee.property.name);
            if (foundSource === null) {
              // we're not flattening it
              return `${ast.callee.object.name}.${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
            } else {
              functionDependencies.push(foundSource);
              // we're flattening it
              return `${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
            }
          } else if (ast.callee.object.type === 'MemberExpression') {
            return `${flatten(ast.callee.object)}.${ast.callee.property.name}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
          } else {
            throw new Error('unknown ast.callee');
          }
        }
        case 'ReturnStatement':
          return `return ${flatten(ast.argument)}`;
        case 'BinaryExpression':
          return `(${flatten(ast.left)}${ast.operator}${flatten(ast.right)})`;
        case 'UnaryExpression':
          if (ast.prefix) {
            return `${ast.operator} ${flatten(ast.argument)}`;
          } else {
            return `${flatten(ast.argument)} ${ast.operator}`;
          }
          case 'ExpressionStatement':
            return `(${flatten(ast.expression)})`;
          case 'ArrowFunctionExpression':
            return `(${ast.params.map(flatten).join(', ')}) => ${flatten(ast.body)}`;
          case 'Literal':
            return ast.raw;
          case 'Identifier':
            return ast.name;
          case 'MemberExpression':
            if (ast.object.type === 'ThisExpression') {
              return thisLookup(ast.property.name);
            }
            if (ast.computed) {
              return `${flatten(ast.object)}[${flatten(ast.property)}]`;
            }
            return flatten(ast.object) + '.' + flatten(ast.property);
          case 'ThisExpression':
            return 'this';
          case 'NewExpression':
            return `new ${flatten(ast.callee)}(${ast.arguments.map(value => flatten(value)).join(', ')})`;
          case 'ForStatement':
            return `for (${flatten(ast.init)};${flatten(ast.test)};${flatten(ast.update)}) ${flatten(ast.body)}`;
          case 'AssignmentExpression':
            return `${flatten(ast.left)}${ast.operator}${flatten(ast.right)}`;
          case 'UpdateExpression':
            return `${flatten(ast.argument)}${ast.operator}`;
          case 'IfStatement':
            return `if (${flatten(ast.test)}) ${flatten(ast.consequent)}`;
          case 'ThrowStatement':
            return `throw ${flatten(ast.argument)}`;
          case 'ObjectPattern':
            return ast.properties.map(flatten).join(', ');
          case 'ArrayPattern':
            return ast.elements.map(flatten).join(', ');
          case 'DebuggerStatement':
            return 'debugger;';
          case 'ConditionalExpression':
            return `${flatten(ast.test)}?${flatten(ast.consequent)}:${flatten(ast.alternate)}`;
          case 'Property':
            if (ast.kind === 'init') {
              return flatten(ast.key);
            }
      }
      throw new Error(`unhandled ast.type of ${ ast.type }`);
    }
    const result = flatten(ast);
    if (functionDependencies.length > 0) {
      const flattenedFunctionDependencies = [];
      for (let i = 0; i < functionDependencies.length; i++) {
        const functionDependency = functionDependencies[i];
        if (!flattened[functionDependency]) {
          flattened[functionDependency] = true;
        }
        flattenedFunctionDependencies.push(utils.flattenFunctionToString(functionDependency, settings) + ';\n');
      }
      return flattenedFunctionDependencies.join('') + result;
    }
    return result;
  },

  splitHTMLImageToRGB: (image, mode) => {
    const gpu = new GPU({ mode });

    const rKernel = gpu.createKernel(function(a) {
      const pixel = a[this.thread.y][this.thread.x];
      return pixel.r * 255;
    }, {
      output: [image.width, image.height],
      precision: 'unsigned',
      argumentTypes: ['HTMLImage'],
    });
    const gKernel = gpu.createKernel(function(a) {
      const pixel = a[this.thread.y][this.thread.x];
      return pixel.g * 255;
    }, {
      output: [image.width, image.height],
      precision: 'unsigned',
      argumentTypes: ['HTMLImage'],
    });
    const bKernel = gpu.createKernel(function(a) {
      const pixel = a[this.thread.y][this.thread.x];
      return pixel.b * 255;
    }, {
      output: [image.width, image.height],
      precision: 'unsigned',
      argumentTypes: ['HTMLImage'],
    });
    const aKernel = gpu.createKernel(function(a) {
      const pixel = a[this.thread.y][this.thread.x];
      return pixel.a * 255;
    }, {
      output: [image.width, image.height],
      precision: 'unsigned',
      argumentTypes: ['HTMLImage'],
    });
    const result = [
      rKernel(image),
      gKernel(image),
      bKernel(image),
      aKernel(image),
    ];
    result.rKernel = rKernel;
    result.gKernel = gKernel;
    result.bKernel = bKernel;
    result.aKernel = aKernel;
    result.gpu = gpu;
    return result;
  },

  /**
   * A visual debug utility
   * @param rgba
   * @param width
   * @param height
   * @param mode
   * @return {Object[]}
   */
  splitRGBAToCanvases: (rgba, width, height, mode) => {
    const { GPU } = require('./gpu.js');

    const visualGPUR = new GPU({ mode });
    const visualKernelR = visualGPUR.createKernel(function(v) {
      const pixel = v[this.thread.y][this.thread.x];
      this.color(pixel.r / 255, 0, 0, 255);
    }, { output: [width, height], graphical: true, argumentTypes: { v: 'Array2D(4)' } });
    visualKernelR(rgba);

    const visualGPUG = new GPU({ mode });
    const visualKernelG = visualGPUG.createKernel(function(v) {
      const pixel = v[this.thread.y][this.thread.x];
      this.color(0, pixel.g / 255, 0, 255);
    }, { output: [width, height], graphical: true, argumentTypes: { v: 'Array2D(4)' } });
    visualKernelG(rgba);

    const visualGPUB = new GPU({ mode });
    const visualKernelB = visualGPUB.createKernel(function(v) {
      const pixel = v[this.thread.y][this.thread.x];
      this.color(0, 0, pixel.b / 255, 255);
    }, { output: [width, height], graphical: true, argumentTypes: { v: 'Array2D(4)' } });
    visualKernelB(rgba);

    const visualGPUA = new GPU({ mode });
    const visualKernelA = visualGPUA.createKernel(function(v) {
      const pixel = v[this.thread.y][this.thread.x];
      this.color(255, 255, 255, pixel.a / 255);
    }, { output: [width, height], graphical: true, argumentTypes: { v: 'Array2D(4)' } });
    visualKernelA(rgba);

    visualGPUR.destroy();
    visualGPUG.destroy();
    visualGPUB.destroy();
    visualGPUA.destroy();

    return [
      visualKernelR.canvas,
      visualKernelG.canvas,
      visualKernelB.canvas,
      visualKernelA.canvas,
    ];
  }
};

const _systemEndianness = utils.getSystemEndianness();

module.exports = {
  utils
};
},{"./gpu.js":144,"./input":146,"./texture":149,"acorn":43}],151:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],152:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":154}],153:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.12.2
(function() {
  var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

  if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
    module.exports = function() {
      return performance.now();
    };
  } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
    module.exports = function() {
      return (getNanoSeconds() - nodeLoadTime) / 1e6;
    };
    hrtime = process.hrtime;
    getNanoSeconds = function() {
      var hr;
      hr = hrtime();
      return hr[0] * 1e9 + hr[1];
    };
    moduleLoadTime = getNanoSeconds();
    upTime = process.uptime() * 1e9;
    nodeLoadTime = moduleLoadTime - upTime;
  } else if (Date.now) {
    module.exports = function() {
      return Date.now() - loadTime;
    };
    loadTime = Date.now();
  } else {
    module.exports = function() {
      return new Date().getTime() - loadTime;
    };
    loadTime = new Date().getTime();
  }

}).call(this);



}).call(this,require('_process'))
},{"_process":154}],154:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],155:[function(require,module,exports){
const kernel = [
  [1, 2, 1],
  [2, 1, 2],
  [1, 2, 1]
]

const kernelX = kernel[0].length,
  kernelY = kernel.length,
  paddingX = Math.floor(kernelX / 2),
  paddingY = Math.floor(kernelY / 2);

/**
 * @method paddificate
 * @description Pads a JavaScript array.
 * @param {Float32Array} array Input array.
 * @param {Number} paddingX x-axis padding size.
 * @param {Number} paddingY y-axis padding size.
 * @return {Float32Array}
 */
const paddificate = (array, paddingX, paddingY) => {
  let out = [];

    for (var y = 0; y < array.length + paddingY * 2; y++){
      out.push([]);
      for (var x = 0; x < array[0].length + paddingX * 2; x++){
        const positionX = Math.min(Math.max(x - paddingX, 0), array[0].length - 1);
        const positionY = Math.min(Math.max(y - paddingY, 0), array.length - 1);

        out[y].push(array[positionY][positionX]);
      }
    }
    return out;
}

const matConvFunc = `function (array, kernel) {
  let sum = 0;
  for (let i = 0; i < ${kernelX}; i++){
    for (let j = 0; j < ${kernelY}; j++){
      sum += kernel[j][i] * array[this.thread.y + j][this.thread.x + i];
    }
  }
  return sum;
}`;

/**
 * @method generateFuncs 
 * @description Generates kernel convolution functions.
 * @param {"GPU"} gpu A GPU.js GPU object.
 * @param {"GPU"} cpu A GPU.js object with mode=cpu
 * @param {Float32Array|"Object"} output The output size
 * @returns {{gpu: Object, pipe: Object, cpu: Object}}
 */
const generateFuncs = (gpu, cpu, output) => {
  return {
    gpu: gpu.createKernel(matConvFunc, {
      output
    }),
    pipe: gpu.createKernel(matConvFunc, {
      output,
      pipeline: true
    }),
    cpu: cpu.createKernel(matConvFunc, {
      output
    })
  }
}

module.exports = {
  kernel,
  kernelX,
  kernelY,
  paddingX,
  paddingY,
  paddificate,
  matConvFunc,
  generateFuncs
}

},{}],156:[function(require,module,exports){
/**
 * @method generateMatrices
 * @description generates 5 matrices of uniform x and y length
 * @param size size of the matrices
 * @returns {Float32Array}
 */
module.exports = size => {
  const matrices = [[], [], [], [], []];

  for (let y = 0; y < size; y++){
    matrices[0].push([]);
    matrices[1].push([]);
    matrices[2].push([]);
    matrices[3].push([]);
    matrices[4].push([]);
    for (let x = 0; x < size; x++){
      matrices[0][y].push(Math.random());
      matrices[1][y].push(Math.random());
      matrices[2][y].push(Math.random());
      matrices[3][y].push(Math.random());
      matrices[4][y].push(Math.random());
    }
  }
  return matrices;
}

},{}],157:[function(require,module,exports){
const matMultFunc = `function(a, b) {
  let sum = 0;
  for (let i = 0; i < this.output.x; i++) {
    sum += a[this.thread.y][i] * b[i][this.thread.x];
  }
  return sum;
}`

/**
 * @method generateFuncs 
 * @description Generates matrix multiplication functions.
 * @param {"GPU"} gpu A GPU.js GPU object.
 * @param {"GPU"} cpu A GPU.js object with mode=cpu
 * @param {Float32Array|"Object"} output The output size
 * @return {"Object"}
 */
const generateFuncs = (gpu, cpu, output) => {
  return {
    gpu: gpu.createKernel(matMultFunc, {
      output
    }),
    pipe: gpu.createKernel(matMultFunc, {
      output,
      pipeline: true
    }),
    cpu: cpu.createKernel(matMultFunc, {
      output
    })
  }
}

module.exports = {
  generateFuncs,
  matMultFunc
}
},{}],158:[function(require,module,exports){
module.exports = {
  RED_UNDER: '\033[1;31;4m', // underlined red
  RED_NO_UNDER: '\033[1;31m', // red without underline
  GREEN_UNDER: '\033[0;32;4m', // underlined green
  GREEN_NO_UNDER: '\033[0;32m', // green without underline
  YELLOW_UNDER: '\033[0;33;4m', // yellow underlined
  YELLOW_NO_UNDER: '\033[0;33m', // yellow without underlined
  BG_WHITE: '\033[47;30;1m', // white background
  RED_FLASH: '\033[1;31;5m', // flashing/blinking red text
  NC: '\033[0m' // no color(default)
}
},{}],159:[function(require,module,exports){
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
},{}],160:[function(require,module,exports){
const { GPU } = require('gpu.js'),
  run = require('./run'),
  BenchmarkOut = require('./util/benchmark-out'),
  getDefaultOptions = require('./util/get-default-options'),
  multipleBenchmark = require('./util/multi-bench');

/**
 * @method benchmark
 * @description benchmarks gpu.js
 * @param {...Options} options Optional options
 */
const benchmark = (options = {}) => {

  options = getDefaultOptions(options);
  const out = new BenchmarkOut(true, run(options));

  return out;
}

module.exports = {
  benchmark,
  multipleBenchmark
}

},{"./run":161,"./util/benchmark-out":166,"./util/get-default-options":168,"./util/multi-bench":171,"gpu.js":145}],161:[function(require,module,exports){
const benchIt = require('./util/bench-it'),
  generateMatrices = require('./benches/generate-matrices'),
  getMinMaxAvg = require('./util/get-min-max'),
  matMult = require('./benches/matrix-multiplication'),
  matConv = require('./benches/convolution'),
  { paddificate, paddingX, paddingY, kernel } = require('./benches/convolution'),
  { YELLOW_UNDER, GREEN_NO_UNDER, NC } = require('./cli/colors'),
  { generateStatsObj: generateStats } = require('./stats/get-stats'),
  getgetTextureKernel = require('./util/get-texture'),
  getScore = require('./stats/get-score');

/**
 * @method run
 * @param {Options} options
 * @return {"Object"}
 */
const run = options => {
  options.output = [options.matrix_size, options.matrix_size];
  
  const getTexture = getgetTextureKernel(options.gpu, options.matrix_size, options.matrix_size);
  const mat = benchIt(() => generateMatrices(options.matrix_size)),
    padded = benchIt(() => paddificate(mat.ret[0], paddingX, paddingY));
  
  getTexture.build(mat.ret[0]);

  const funcs = {
    mat_mult: matMult.generateFuncs(options.gpu, options.cpu, options.output),
    mat_conv: matConv.generateFuncs(options.gpu, options.cpu, options.output)
  }

  const benchmarks = {
    mat_mult: {
      gpu: [],
      cpu: []
    },
    mat_conv: {
      gpu: [],
      cpu: []
    },
    pipe: {
      gpu: [],
      cpu: []
    }
  }

  const build_time = {
    mat_mult: {
      gpu: benchIt(() => {funcs.mat_mult.gpu.build(mat.ret[0], mat.ret[1])}).time,
      pipe: benchIt(() => {funcs.mat_mult.pipe.build(mat.ret[0], mat.ret[1])}).time
    },
    mat_conv: {
      gpu: benchIt(() => {funcs.mat_conv.gpu.build(padded.ret, kernel)}).time,
      pipe: benchIt(() => {funcs.mat_conv.pipe.build(padded.ret, kernel)}).time
    }
  }

  for (let i = 1; i <= options.num_benchmarks; i++){
    benchmarks.mat_mult.gpu.push(benchIt(() => funcs.mat_mult.gpu(mat.ret[0], mat.ret[1])).time);
    if (options.cpu_benchmark) {benchmarks.mat_mult.cpu.push(benchIt(() => funcs.mat_mult.cpu(mat.ret[0], mat.ret[1])).time)}

    benchmarks.mat_conv.gpu.push(benchIt(() => funcs.mat_conv.gpu(padded.ret, kernel)).time);
    if (options.cpu_benchmark) {benchmarks.mat_conv.cpu.push(benchIt(() => funcs.mat_conv.cpu(padded.ret, kernel)).time)}
    
    const matrixTexs = mat.ret.map(arr => getTexture(arr));

    benchmarks.pipe.gpu.push(
      benchIt(() => {
        const func = funcs.mat_mult.pipe;

        func(func(func(func(matrixTexs[0], matrixTexs[1]), matrixTexs[2]), matrixTexs[3]), matrixTexs[4]).toArray();
      }).time
    )

    if (options.cpu_benchmark) {
      benchmarks.pipe.cpu.push(
        benchIt(() => {
          const func = funcs.mat_mult.cpu;

          func(func(func(func(mat.ret[0], mat.ret[1]), mat.ret[2]), mat.ret[3]), mat.ret[4]);
        }).time
      )
    }
    
    if (options.logs) console.log(`Benchmark ${YELLOW_UNDER}${i}${NC} ${GREEN_NO_UNDER}completed${NC} ${GREEN_NO_UNDER}✔${NC}`);
  }

  const run_time = {
    mat_mult: {
      gpu: getMinMaxAvg(benchmarks.mat_mult.gpu),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.mat_mult.cpu) : {min: -1, avg: -1, max: -1}
    },

    mat_conv: {
      gpu: getMinMaxAvg(benchmarks.mat_conv.gpu),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.mat_conv.cpu) : {min: -1, avg: -1, max: -1}
    },

    pipe: {
      gpu: getMinMaxAvg(benchmarks.pipe.gpu),
      cpu: options.cpu_benchmark ? getMinMaxAvg(benchmarks.pipe.cpu) : {min: -1, avg: -1, max: -1}
    }
  }
  
  const stats = generateStats(run_time, build_time);

  const benches = {
    mat_gen: mat.time,
    mat_pad: padded.time,

    build_time,
    run_time,

    stats,
    score: getScore(run_time, options.matrix_size),

    options
  }

  return benches;
}

module.exports = run;

},{"./benches/convolution":155,"./benches/generate-matrices":156,"./benches/matrix-multiplication":157,"./cli/colors":158,"./stats/get-score":163,"./stats/get-stats":164,"./util/bench-it":165,"./util/get-min-max":169,"./util/get-texture":170}],162:[function(require,module,exports){
const getDiff = (val1, val2) => Math.floor(((val2 - val1) / val2) * 10000) / 100;

module.exports = (val1, val2) => val1 < val2 ? {diff: getDiff(val1, val2), greater: 0} : {diff: getDiff(val2, val1), greater: 1};
},{}],163:[function(require,module,exports){
const getScore = (run_time, matrix_size) => {
  const score = {
    gpu: Math.floor((matrix_size / run_time.mat_mult.gpu.avg) * 1000),
    cpu: Math.floor((matrix_size / run_time.mat_mult.cpu.avg) * 1000)
  }

  return score;
}

module.exports = getScore;
},{}],164:[function(require,module,exports){
const getDiff = require('./diff');
const formatDiff = (diff, contenders) => {
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

const generateStatsObj = (run_time, build_time) => {
  const 
    mat_mult = {
      diff: {
        cpu_gpu: {}
      },
      best_performer: '',
      worst_performer: ''
    },
    mat_conv = {
      diff: {
        cpu_gpu: {}
      },
      best_performer: '',
      worst_performer: ''
    },
    pipe = {
      diff: {
        cpu_gpu: {}
      },
      best_performer: '',
      worst_performer: ''
    };

  const stats = {
    run_time: {
      mat_mult,
      mat_conv,
      pipe
    },
    build_time: {
      mat_mult: {diff: {gpu_pipe: {}}},
      mat_conv: {diff: {gpu_pipe: {}}}
    },
    overall: {
      mat_mult: {
        best_performer: {},
        worst_performer: {},
        diff: {}
      },
      mat_conv: {
        best_performer: {},
        worst_performer: {},
        diff: {}
      }
    }
  }

  for (const bench in stats.run_time) {
    for (const diffName in stats.run_time[bench].diff){
      const contenders = diffName.split('_');
      const rawDiffs = {
        min: {},
        max: {},
        avg: {}
      }

      for (const rawDiff in  rawDiffs) {
        rawDiffs[rawDiff] = getDiff(
          run_time[bench][contenders[0]][rawDiff],
          run_time[bench][contenders[1]][rawDiff]
        )
        if (run_time[bench][contenders[0]][rawDiff] == -1 || run_time[bench][contenders[1]][rawDiff] == -1) rawDiffs[rawDiff].diff = -1;
      }

      const diff = {
        min: formatDiff(rawDiffs.min, contenders),
        max: formatDiff(rawDiffs.max, contenders),
        avg: formatDiff(rawDiffs.avg, contenders)
      }

      stats.run_time[bench].diff[diffName] = diff;
    }
  }

  for (const bench in stats.build_time) {
    const rawDiff = getDiff(build_time[bench].gpu, build_time[bench].pipe);
    const diff = formatDiff(rawDiff, ['gpu', 'pipe']);

    stats.build_time[bench].diff.gpu_pipe = diff;
  }

  for (const bench in run_time) {
    let better_avg = Infinity,
      better_performer = '',
      worse_avg = 0,
      worse_performer = '';

    for (const performer in run_time[bench]) {
      if (better_avg > run_time[bench][performer].avg && run_time[bench][performer].avg != -1){
        better_performer = performer;
        better_avg = Math.min(run_time[bench][performer].avg, better_avg);
      }

      if (worse_avg < run_time[bench][performer].avg && run_time[bench][performer].avg != -1){
        worse_performer = performer;
        worse_avg = Math.max(run_time[bench][performer].avg, worse_avg);
      }

      if (run_time[bench][performer].avg == -1) better_avg = -1;
    }

    stats.run_time[bench].best_performer = better_performer;
    stats.run_time[bench].worst_performer = worse_performer;
  }

  for (const bench in stats.overall) {
    let better_total = Infinity,
      better_performer = '',
      worse_total = 0,
      worse_performer = '';
      let performerNotBenched;
    for (const performer in run_time[bench]){
      const performer_build_time = performer == 'cpu' ? 0 : build_time[bench][performer],
        performer_run_time = run_time[bench][performer].avg,
        total_time = performer_build_time + performer_run_time;
      if (total_time < better_total && run_time[bench][performer].avg != -1){
        better_total = total_time;
        better_performer = performer;
      }

      performerNotBenched = (performerNotBenched || run_time[bench][performer].avg == -1);
        
      if (total_time > worse_total && run_time[bench][performer].avg != -1){
        worse_total = total_time;
        worse_performer = performer;
      }

    }

    if (performerNotBenched) worse_total = -1;

    stats.overall[bench].best_performer = better_performer;
    stats.overall[bench].worst_performer = worse_performer;
    stats.overall[bench].diff = formatDiff(getDiff(better_total, worse_total), [better_performer, worse_performer]);
  }
  return stats;
}

module.exports = {
  generateStatsObj,
  formatDiff,
}
},{"./diff":162}],165:[function(require,module,exports){
const now = require('performance-now');
/**
 * @method benchIt
 * @param {Function} func the function to be run
 * @returns {{ret: *, time: Number}}
 */
module.exports = func => {

  let time = now() * (-1);
  const ret = func();
  time += now();
  time *= 100;
  time = Math.floor(time) / 100;

  return {
    ret,
    time
  }
}

},{"performance-now":153}],166:[function(require,module,exports){
const { getPlotlyJSON: convertToPlotlyJSON, getChartistJSON: convertToChartistJSON } = require('./export-as-json');

class BenchmarkOut {
  /**
   * @param {Boolean} [singleData] whether only a single data object is to be stored
   * @param {*} [initData] initialData
   * @returns {null}
   */
  constructor(singleData = false, initData) {
    this.singleData = singleData;

    if (singleData) {
      this.data = initData;
    }
    else {
      this.data = [];
      if (initData){
        this.data.push(initData)
      }
    }
  }

  /**
   * @method addData
   * @param {Object} newData new data object to be added to a multi-data array
   * @returns {null}
   */
  addData(newData) {
    if (!this.singleData) {
      this.data.push(newData)
    }
    else throw "Single Data"
  }

  /**
   * @method setDataField
   * @param {String} field the field name
   * @param {*} value the field value
   * @param {Number} [index=0] index of the data object in the multi-data array
   * @returns {null}
   */
  setDataField(field, value, index = 0) {
    if (this.singleData) {
      this.data[field] = value;
    }
    else {
      this.data[index][field] = value;
    }
  }

  /**
   * @method getDataField
   * @param {String} field the field name
   * @param {Number} [index=0] index of the data object in the multi-data array
   * @returns {*}
   */
  getDataField(field, index = 0) {
    if (this.singleData) {
      return this.data[field];
    }
    else {
      return this.data[index][field];
    }
  }

  /**
   * @method getData
   * @returns {Object}
   */
  getData() {
    return this.data;
  }

  /**
   * @description Returns a plotly style array of graphs
   * @param {Array} compareFields
   */
  getPlotlyJSON(compareFields = [
    {
      x: 'matrix_size',
      y: 'gpu_run_time_mat_mult'
    },
    {
      x: 'matrix_size',
      y: 'pipe_run_time'
    },
    {
      x: 'matrix_size',
      y: 'gpu_score'
    }
  ]) {
    if (!this.singleData){
      const retArr = [];
      compareFields.forEach((compareField) => {
        retArr.push(convertToPlotlyJSON(this.data, {
          x: compareField.x,
          y: compareField.y
        }))
      })

      return retArr;
    }
    else throw "Only possible for multi-data arrays"
  }
  
  /**
   * @description Returns a plotly style array of graphs
   * @param {Array} compareFields
   */
  getChartistJSON(compareFields = [
    {
      x: 'matrix_size',
      y: 'gpu_run_time_mat_mult'
    },
    {
      x: 'matrix_size',
      y: 'pipe_run_time'
    },
    {
      x: 'matrix_size',
      y: 'gpu_score'
    }
  ]) {
    if (!this.singleData){
      const retArr = [];
      compareFields.forEach((compareField) => {
        retArr.push(convertToChartistJSON(this.data, {
          x: compareField.x,
          y: compareField.y
        }))
      })

      return retArr;
    }
    else throw "Only possible for multi-data arrays"
  }
}

module.exports = BenchmarkOut;
},{"./export-as-json":167}],167:[function(require,module,exports){
/**
 * @method removeUnnecesasaryProps
 * @description removes unnecessary properties from the benchmarks object(to be stringified)
 * @param {"Object"} data The benchmark data
 * @returns {"Object"}
 */
const removeUnnecessaryProps = (data) => {
  data.options.gpu = "";
  data.options.cpu = "";

  return data
}

/**
 * @method getBenchmarkJSON
 * @description returns the benchmark data as a JSON string
 * @param {"Object"} data The benchmark data
 * @returns {"Object"}
 */
const getBenchmarkJSON = (data) => {
  return JSON.stringify(removeUnnecessaryProps(data));
}

const getPlotData = (dataArr, axes, plotFunction) => {
  const setVal = (input, data) => {
    let outData;
    switch (input) {
      case 'matrix_size':
        outData = data.options.matrix_size;
        break;

      case 'gpu_score':
        outData = data.score.gpu;
        break;
      case 'cpu_score': 
        outData = data.score.cpu;
        break;

      case 'gpu_run_time_mat_mult':
        outData = data.run_time.mat_mult.gpu.avg;
        break;
      case 'gpu_run_time_mat_conv':
        outData = data.run_time.mat_conv.gpu.avg;
        break;
      case 'cpu_run_time_mat_mult':
        outData = data.run_time.mat_mult.cpu.avg;
        break;
      case 'cpu_run_time_mat_conv':
        outData = data.run_time.mat_conv.cpu.avg;
        break;

      case 'pipe_run_time':
        outData = data.run_time.pipe.gpu.avg;
        break;
    }
    return outData;
  }

  dataArr.forEach(data => {
    let x, y;
    x = setVal(axes.x, data);
    y = setVal(axes.y, data);

    plotFunction(x, y);
  })
}

/**
 * @method getPlotlyJSON
 * @description returns multiple benchmarks as plotly format graph JSON string
 * @param {"Array"} dataArr An array of benchmarks
 * @param {"Object"} axes An object containing x and y axis labels
 */
const getPlotlyJSON = (dataArr, axes = {x: '', y: ''}) => {
  const out = {x_series: [], y_series: []}
  
  getPlotData(dataArr, axes, (x, y) => {
    out.x_series.push(x);
    out.y_series.push(y);
  })

  return out;
}

/**
 * @method getChartistJSON
 * @description returns multiple benchmarks as chartist format graph JSON string
 * @param {"Array"} dataArr An array of benchmarks
 * @param {"Object"} axes An object containing x and y axis labels
 */
const getChartistJSON = (dataArr, axes = {x: '', y: ''}) => {
  const out = [];
  
  getPlotData(dataArr, axes, (x, y) => {
    out.push({
      x,
      y
    })
  })
  
  return out;
}

module.exports = {
  getBenchmarkJSON,
  getPlotlyJSON,
  getChartistJSON
}
},{}],168:[function(require,module,exports){
const { GPU } = require('gpu.js');

/**
 * @param {...Options} options
 */
const getDefaultOptions = (options) => {
  options.num_benchmarks = options.num_benchmarks || 1;

  options.matrix_size = options.matrix_size || 512;

  options.logs = typeof options.logs != 'undefined' ? options.logs : true;
  options.cpu_benchmark = typeof options.cpu_benchmark != 'undefined' ? options.cpu_benchmark : true;

  options.gpu = options.gpu || new GPU({mode: 'gpu'});
  options.cpu = options.cpu || new GPU({mode: 'cpu'});

  return options;
}

module.exports = getDefaultOptions;
},{"gpu.js":145}],169:[function(require,module,exports){
module.exports = arr => {
  const avg = Math.floor(((arr.reduce((acc, val) => acc + val)) / arr.length) * 100) / 100,
    min = arr.reduce((min, val) => Math.min(min, val)),
    max = arr.reduce((max, val) => Math.max(max, val))

  return {
    avg,
    min,
    max
  }
}
},{}],170:[function(require,module,exports){
/**
 * @method getgetTextureKernel
 * @param {"GPU"} gpu 
 * @param {Number} arrayX 
 * @param {Number} arrayY 
 */
const getgetTextureKernel = (gpu, arrayX, arrayY) => {
  return gpu.createKernel(function(array) {
    return array[this.thread.y][this.thread.x];
  },
  {
    output: [arrayX, arrayY]
  })
}

module.exports = getgetTextureKernel;
},{}],171:[function(require,module,exports){
const { YELLOW_UNDER, NC } = require('../cli/colors'),
  BenchmarkOut = require('./benchmark-out'),
  getDefaultOptions = require('./get-default-options'),
  run = require('../run'),
  { br } = require('../cli/format');
/**
 * @method multipleBenchmark
 * @description runs multiple GPU.js benchmarks each with different options
 * @param {"Object"} options array of optional options objects
 * @returns {"Object"}
 */
const multipleBenchmark = (options = {
  commonOptions: { // options common to all but can be overridden in range or in fullOptions, preference given to range
    cpu_benchmark: false
  },
  range: { // only one of this and fullOptions works
    optionName: 'matrix_size',
    interval: [128, 1024],
    step: 100 //(default 10) one of step or commonRatio can be used, preference given to step
    // commonRatio: 2 (G.P.: 128, 256, 512, 1024)
  },
  fullOptions: [
    {
      // array of options objects for each benchmark(only one of this and range works, preference given to range)
    }
  ]
}) => {
  const out = new BenchmarkOut();
  const commonBenchmarkOptions = getDefaultOptions(options.commonOptions);
  const benchmarkOptionsArr = [];

  if (options.range) {
    const interval = options.range.interval,
      optionName = options.range.optionName;
    
    if (options.range.step) {
      const step = options.range.step;

      for (let i = interval[0]; i <= interval[1]; i += step) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][optionName] = i;
      }
    }
    else if (options.range.commonRatio) {
      const commonRatio = options.range.commonRatio;

      for (let i = interval[0]; i <= interval[1]; i *= commonRatio) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][optionName] = i;
      }
    }
    else {
      const step = 10;

      for (let i = interval[0]; i <= interval[1]; i += step) {
        benchmarkOptionsArr.push({
          ...commonBenchmarkOptions,
        })
        benchmarkOptionsArr[benchmarkOptionsArr.length - 1][optionName] = i;
      }
    }


  }
  else if (options.fullOptions) {
    options.fullOptions.forEach(optionSet => {
      benchmarkOptionsArr.push({
        ...commonBenchmarkOptions,
        ...optionSet
      })
    })
  }

  benchmarkOptionsArr.forEach((benchmarkOption, i) => {
    console.log(`Config ${YELLOW_UNDER}#${i}${NC}:`);
    
    console.log(`MATRIX_SIZE: ${YELLOW_UNDER}${benchmarkOption.matrix_size}${NC}`);
    console.log(`NUM_BENCHMARKS: ${YELLOW_UNDER}${benchmarkOption.num_benchmarks}${NC}`);
    console.log(`CPU_BENCHMARK: ${YELLOW_UNDER}${benchmarkOption.cpu_benchmark}${NC}`);
    br();
    
    out.addData(run(benchmarkOption));
    br();
    br();
  })

  return out;
}

module.exports = multipleBenchmark;
},{"../cli/colors":158,"../cli/format":159,"../run":161,"./benchmark-out":166,"./get-default-options":168}]},{},[160]);
