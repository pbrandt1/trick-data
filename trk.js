const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)

var trick_types = require('./trick_types.js')

var log = function () {}; // console.log.bind(console)
var nothing = Promise.resolve()

// Exported functions
var x = module.exports = {}

/**
 * loads a file, all of it in memory returns all the parsed data
 */
x.load = async (filename) => {
  log('loading', filename)

  var f = await readFile(filename)
  var metadata = await x.metadata(f)
  var trk = { meta: metadata }

  trk.data = []

  var done = false
  while (!done) {
    if (f._trk_offset >= f.length) {
      done = true;
      continue
    }
    trk.data.push(trk.meta.parameters.reduce((data, param) => {
      var method = 'read' + param.typename + (metadata.endienness === 'L' ? 'LE' : 'BE');
      if (f[method]) {
        data[param.name] = f[method](f._trk_offset)
      } else {
        // todo support all data types, not just the easy numeric ones
        data[param.name] = null
      }

      f._trk_offset += param.size
      return data
    }, {}))
  }

  return trk
}

/**
 * Just returns the metadata for a file
 */
x.metadata = async (file) => {
  var metadata = {}
  var f = file
  var versionstring = f.toString('utf8', 0, 10)
  metadata.version = versionstring.match(/[0-9][0-9]/g)[0]
  metadata.version = parseInt(metadata.version)
  metadata.endienness = versionstring[9]
  metadata.parameters = []

  hackbuffer(f, metadata.endienness === 'L')
  var n_parameters = f._trk_int()
  log(n_parameters, 'parameters')

  for (var i = 0; i < n_parameters; i++) {
    var p = {}

    // get parameter name
    var str_length = f._trk_int()
    p.name = f.toString('utf8', f._trk_offset, f._trk_offset += str_length)

    // parameter units
    str_length = f._trk_int()
    p.units = f.toString('utf8', f._trk_offset, f._trk_offset += str_length)

    // parameter type
    p.type = f._trk_int()
    p.typename = trick_types[p.type]
    p.size = f._trk_int()

    metadata.parameters.push(p)
  }
  return metadata
}

//
// adds in buf._trk_offset, which keeps track of where in the file we are
// adds in buf._trk_int(), which returns a 4 byte int value and seeks the offset forward
//
function hackbuffer(buf, le) {
  buf._trk_offset = 10
  buf._trk_int = () => {
    var r = le ? buf.readIntLE(buf._trk_offset, 4) : buf.readIntBE(buf._trk_offset, 4)
    buf._trk_offset += 4
    return r
  }
}
