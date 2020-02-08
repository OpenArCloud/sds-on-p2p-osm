var kosm = require('kappa-osm')
var kcore = require('kappa-core')
var http = require('http')
var network = require('hyperswarm')
var pump = require('pump')

var crypto = require('crypto')
var ram = require('random-access-memory')
var memdb = require('memdb')


if (process.argv.length !== 5) {
    console.log('USAGE: node sds.js "{geozone to sync}" "{sds provider name}" "{API port}"')
    process.exit(1)
    return
}

var geozone = process.argv[2]
var provider = process.argv[3]
var port = parseInt(process.argv[4])

var topic = crypto.createHash('sha256').update(geozone).digest()

var osm = kosm({
    core: kcore(geozone + '_' + provider, {
        valueEncoding: 'json'
    }),
    index: memdb(),
    storage: function(name, cb) {
        cb(null, ram())
    }
})

var router = require('osm-p2p-server')(osm)

var net = network()

net.join(topic, {
    lookup: true,
    announce: true
})


net.on('connection', (socket, details) => {

    let locality = 'n/a'
    let host = 'n/a'
    let port = 'n/a'
    if (details.client) {
        locality = details.peer.local ? 'LAN' : 'WAN'
        host = details.peer.host
        port = details.peer.port
    }

    console.log(`Connected: (${details.type}) ${host}:${port} (${locality})`)

    var r = osm.replicate(details.client, {
        live: true
    })

    pump(socket, r, socket, function(err) {
        console.log('Pipe finished', err)
    })

})


var server = http.createServer(function (req, res) {
  if (!router.handle(req, res)) {
    res.statusCode = 404
    res.end('not found\n')
  }
})

server.listen(port)
