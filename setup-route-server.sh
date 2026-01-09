#!/bin/bash
mkdir -p osrm-data

if [ ! -f osrm-data/sweden-latest.osm.pbf ]; then
    curl -L -o osrm-data/sweden-latest.osm.pbf https://download.geofabrik.de/europe/sweden-latest.osm.pbf
fi

docker run --rm -t -v "$(pwd)/osrm-data:/data" osrm/osrm-backend osrm-extract -p /opt/bicycle.lua /data/sweden-latest.osm.pbf
docker run --rm -t -v "$(pwd)/osrm-data:/data" osrm/osrm-backend osrm-partition /data/sweden.osrm
docker run --rm -t -v "$(pwd)/osrm-data:/data" osrm/osrm-backend osrm-customize /data/sweden.osrm