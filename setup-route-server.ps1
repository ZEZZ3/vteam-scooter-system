if (-not (Test-Path ./osrm-data)) { mkdir osrm-data }

$osrmUrl = "https://download.geofabrik.de/europe/sweden-latest.osm.pbf"
$osrmFile = "./osrm-data/sweden-latest.osm.pbf"

if (-not (Test-Path $osrmFile)) {
    Invoke-WebRequest -Uri $osrmUrl -OutFile $osrmFile
}

docker run --rm -t -v "${PWD}/osrm-data:/data" osrm/osrm-backend osrm-extract -p /opt/bicycle.lua /data/sweden-latest.osm.pbf
docker run --rm -t -v "${PWD}/osrm-data:/data" osrm/osrm-backend osrm-partition /data/sweden-latest.osrm
docker run --rm -t -v "${PWD}/osrm-data:/data" osrm/osrm-backend osrm-customize /data/sweden-latest.osrm