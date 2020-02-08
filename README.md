# sds-on-p2p-osm

> OSCP spatial search/discovery service (SDS) directly using peer-to-peer OpenStreetMap (OSM).


## Purpose

A quick proof-of-concept of OSCP spatial search/discovery using [osm-p2p-server](https://github.com/digidem/osm-p2p-server), the underlying [kappa-osm](https://github.com/digidem/kappa-osm) database, and real-time sync via [hyperswarm](https://github.com/hyperswarm/hyperswarm) peer connectivity. The OSM data model and queries of course differ from SDS requirements, but this demonstates the high-level concept of adding nodes with geo coordinates, syncing, and performing bounding box queries. The P2P stack is based on components from the [Dat protocol](https://www.datprotocol.com/). The [kappa-osm](https://github.com/digidem/kappa-osm) database builds on [kappa-core](https://github.com/kappa-db/kappa-core), which combines multi-writer append-only logs, [hypercore](https://github.com/mafintosh/hypercore) via [multifeed](https://github.com/kappa-db/multifeed), with materialized views. Spatial queries rely on a Bkd tree materialized view, [unordered-materialized-bkd](https://github.com/digidem/unordered-materialized-bkd).



## Usage


Node 10 (newer version may present issues with Dat framework)

```
git clone https://github.com/OpenArCloud/sds-on-p2p-osm
cd sds-on-p2p-osm
npm install
```

Start first service in one terminal, emulating SDS provider (sds1), sharing data for geo area (geo1), and listening on port (5000) for API requests

```
node sds.js geo1 sds1 5000
```

Start second service in another terminal, emulating SDS provider (sds2), sharing data for geo area (geo1), and listening on port (6000) for API requests

```
node sds.js geo1 sds2 6000
```

Create a changeset and node on SDS provider sds1

```
$ ID=$(echo '<osm><changeset></changeset></osm>' | curl -sSNT- -X PUT \
  -H content-type:text/xml http://localhost:5000/api/0.6/changeset/create)

$ echo '<osmChange version="1.0"><create><node id="-1"
  changeset="'$ID'" lon="1.3" lat="-12.7" />
</create></osmChange>' | curl -sSNT- -X POST \
  -H content-type:text/xml \
  http://localhost:5000/api/0.6/changeset/$ID/upload; echo
```

Examine the data on SDS provider sds1:
```
$ cat geo1_sds1/0/data 
{"type":"changeset","created_at":"2020-02-08T22:50:19.632Z","id":"9918785130892375765","timestamp":"2020-02-08T22:50:19.632Z","links":[]}
{"type":"node","changeset":"9918785130892375765","lon":1.3,"lat":-12.7,"timestamp":"2020-02-08T22:51:19.904Z","links":[],"id":"4742340777148911352"}
```

Examine the data on SDS provider sds2:
```
$ cat geo1_sds2/1/data 
{"type":"changeset","created_at":"2020-02-08T22:50:19.632Z","id":"9918785130892375765","timestamp":"2020-02-08T22:50:19.632Z","links":[]}
{"type":"node","changeset":"9918785130892375765","lon":1.3,"lat":-12.7,"timestamp":"2020-02-08T22:51:19.904Z","links":[],"id":"4742340777148911352"}
```

Perform a bounding box query via SDS provider sds2

```
$ curl http://localhost:6000/api/0.6/map?bbox=1,-13,2,-11

<?xml version="1.0" encoding="UTF-8"?><osm version="0.6" generator="obj2osm"><bounds minlon="1" minlat="-13" maxlon="2" maxlat="-11"/><node id="4742340777148911352" changeset="9918785130892375765" lon="1.3" lat="-12.7" timestamp="2020-02-08T22:51:19.904Z" version="af986f113a587f47f3b9015967f45bff605cb489a5ae497601667aab9dbc8afd@1"/></osm>
```


## OSM Document Format

Documents (OSM elements, observations, etc) have a common format:

```js
  {
    id: String,
    type: String,
    lat: String,
    lon: String,
    tags: Object,
    changeset: String,
    links: Array<String>,
    version: String,
    deviceId: String
  }
```

