const path = require('path')
var trk = require('../trk')
var should = require('should')


describe('trick data loader', () => {
  it('should read the full file correctly', async function() {
    var filename = path.join(__dirname, 'log_such_cannon.trk')
    var f = await trk.load(filename)
    f.should.have.properties('meta', 'data')
    f.meta.should.have.properties('version', 'endienness', 'parameters')
    f.meta.version.should.equal(10)
    f.meta.endienness.should.equal('L')
    f.meta.parameters.length.should.equal(3)
    f.data[0].should.have.properties('sys.exec.out.time', 'dyn.cannon.pos[0]', 'dyn.cannon.pos[1]')
  })
})
