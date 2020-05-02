# sds-on-p2p-osm

> OSCP spatial search/discovery service (SDS) directly using peer-to-peer OpenStreetMap (OSM).


## Purpose

A quick proof-of-concept of OSCP spatial search/discovery (SDS) using [osm-p2p-server](https://github.com/digidem/osm-p2p-server), the underlying [kappa-osm](https://github.com/digidem/kappa-osm) database, and real-time sync via [hyperswarm](https://github.com/hyperswarm/hyperswarm) peer connectivity. The OSM data model and queries of course differ from SDS requirements, but this demonstates the high-level concept of adding nodes with geo coordinates, syncing, and performing bounding box queries. SDS specific elements are temporarily loaded into OSM tags.

The P2P stack is based on components from the [Dat protocol](https://www.datprotocol.com/). The [kappa-osm](https://github.com/digidem/kappa-osm) database builds on [kappa-core](https://github.com/kappa-db/kappa-core), which combines multi-writer append-only logs, [hypercore](https://github.com/mafintosh/hypercore) via [multifeed](https://github.com/kappa-db/multifeed), with materialized views. Spatial queries rely on a Bkd tree materialized view, [unordered-materialized-bkd](https://github.com/digidem/unordered-materialized-bkd).



## Usage


Node 10 (newer version may present issues with Dat framework)

```
git clone https://github.com/OpenArCloud/sds-on-p2p-osm
cd sds-on-p2p-osm
npm install
```

Start first service in one terminal, emulating SDS provider (sds1), sharing data for geo area (geo3), and listening on port (5000) for API requests

```
node sds.js geo3 sds1 5000
```

Start second service in another terminal, emulating SDS provider (sds2), sharing data for geo area (geo3), and listening on port (6000) for API requests

```
node sds.js geo3 sds2 6000
```

Create a node on SDS provider sds1

```

ID=$(echo '<osm><changeset></changeset></osm>' | curl -sSNT- -X PUT \
  -H content-type:text/xml http://localhost:5000/api/0.6/changeset/create)

  echo '<osm><node id="-1"
  changeset="'$ID'" uid="10" lon="1.3" lat="-12.7">
  <tag k="geopose_vertical" v="78.34"/>
  <tag k="geopose_qNorth" v="0.5"/>
  <tag k="geopose_qEast" v="0.5"/>
  <tag k="geopose_qVertical" v="0.5"/>
  <tag k="geopose_qW" v="0.5"/>
  <tag k="url" v="https://www.example.com/content.glb"/>
  <tag k="amenity" v="restaurant"/>
  </node></osm>' | curl -sSNT- -X PUT \
  -H content-type:text/xml \
  http://localhost:5000/api/0.6/node/create; echo
```

Examine the data on SDS provider sds1:
```
$ cat geo3_sds1/0/data
{"type":"changeset","created_at":"2020-05-02T01:09:59.171Z","id":"15513302566860730037","timestamp":"2020-05-02T01:09:59.171Z","links":[]}
{"type":"node","id":"2101380171136345845","changeset":"15513302566860730037","uid":"10","lon":"1.3","lat":"-12.7","tags":{"geopose_vertical":"78.34","geopose_qNorth":"0.5","geopose_qEast":"0.5","geopose_qVertical":"0.5","geopose_qW":"0.5","url":"https://www.example.com/content.glb","amenity":"restaurant"},"timestamp":"2020-05-02T01:14:20.212Z","links":[]}
```

Examine the data on SDS provider sds2:
```
$ cat geo3_sds2/1/data
{"type":"changeset","created_at":"2020-05-02T01:09:59.171Z","id":"15513302566860730037","timestamp":"2020-05-02T01:09:59.171Z","links":[]}
{"type":"node","id":"2101380171136345845","changeset":"15513302566860730037","uid":"10","lon":"1.3","lat":"-12.7","tags":{"geopose_vertical":"78.34","geopose_qNorth":"0.5","geopose_qEast":"0.5","geopose_qVertical":"0.5","geopose_qW":"0.5","url":"https://www.example.com/content.glb","amenity":"restaurant"},"timestamp":"2020-05-02T01:14:20.212Z","links":[]}
```

Perform a bounding box query via SDS provider sds2

```
$ curl -s http://localhost:6000/api/0.6/map?bbox=1,-13,2,-11 | tidy -xml -i -
No warnings or errors were found.

<?xml version="1.0" encoding="utf-8"?>
<osm version="0.6" generator="obj2osm">
  <bounds minlon="1" minlat="-13" maxlon="2" maxlat="-11" />
  <node id="2101380171136345845" changeset="15513302566860730037"
  uid="10" lon="1.3" lat="-12.7"
  timestamp="2020-05-02T01:14:20.212Z"
  version="59134b0fcf23fb6489d28662aa209bf079617b48922a842366d0e51aa3e88493@1">

    <tag k="geopose_vertical" v="78.34" />
    <tag k="geopose_qNorth" v="0.5" />
    <tag k="geopose_qEast" v="0.5" />
    <tag k="geopose_qVertical" v="0.5" />
    <tag k="geopose_qW" v="0.5" />
    <tag k="url" v="https://www.example.com/content.glb" />
    <tag k="amenity" v="restaurant" />
  </node>
</osm>
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



