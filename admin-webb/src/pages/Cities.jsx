import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { getZones, getStations, getCity } from "../lib/api";
import { useSocket } from "../socket/useSocket";

// mockstäder och zoner
const CITIES = [
  { name: "Stockholm", center: [59.334, 18.063] },
  { name: "Göteborg",  center: [57.708, 11.974] },
  { name: "Malmö",     center: [55.605, 13.003] },
  { name: "Linköping",     center: [58.408406, 15.618392] },
]; 

export default function Cities() {
  const [city, setCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [stations, setStations] = useState([]);
  const mapRef = useRef(null);
  const layerRef = useRef([]);
  const bikeRef = useRef(new Map());
  const [loading, setLoading] = useState(true);
  const {bikes, connected} = useSocket();
  const [limit, setLimit] = useState(50);

  async function load() {
    try {
      const zoneData = await getZones();
      setZones(zoneData);
      setStations(await getStations());
      
      const cities = await getCity();
      const citiesExtend = cities.map(city => {
        const match = CITIES.find(c => c.name.toLowerCase() === city.name.toLowerCase());
        return {
          ...city,
          center: match?.center || [59.334, 18.063]
        }
        
      });

      setCity(citiesExtend[0]);
      setCities(citiesExtend);
    } catch (e) {
      console.log("Kunde inte hämta zoner eller stationer: ", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); 
    const map = L.map("map", { zoomControl: true }).setView(CITIES[0].center, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    }).addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !city || zones.length === 0) return;
    
    const map = mapRef.current;
    map.setView(city.center, 13);
    layerRef.current.forEach(layer => layer && map.removeLayer(layer));
    layerRef.current = [];
    
    const cityZones = zones.filter(z => z.cityID === city._id)
    const cityStations = stations.filter(s => s.cityID === city._id)
    const cityBikes = bikes.filter(b => b.city === city.name)

    cityZones.forEach(z => {
      const latlong = z.area.coordinates.map(coord => [coord.lat, coord.long])
      const polygong = L.polygon(latlong, {
        color: "#079743ff",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.3
      }).addTo(map);
      polygong.bindPopup(`<span>${z.name}</span>`)
      layerRef.current.push(polygong);
    });

    cityStations.forEach(s => {
      const pos = s.position

      const bikesAtStation = cityBikes.filter(b => b.currentStationName === s.name).length

      const stationIcon = L.circleMarker([pos.lat, pos.long], {
        radius: 9,
        fillColor: "#87ceeb",
        weight: 4,
        opacity: 0.8,
        fillOpacity: 0.6,
      }).addTo(map).bindPopup(`<b>${s.name}</b><br/>Bikes: ${bikesAtStation}`);

      layerRef.current.push(stationIcon);
    });

  }, [zones, city, stations]);

  useEffect(() => {
    if (!mapRef.current || !city || bikes.length === 0) return;
    const map = mapRef.current;
    bikeRef.current.forEach(m => map.removeLayer(m))
    bikeRef.current.clear();

    const cityBikes = bikes.filter(b => b.city === city.name).slice(0, limit)

    cityBikes.forEach(b => {
      if(!b.position) {
        return;
      }
      const pos = b.position;
      const markerID = b._id;
      
      if (bikeRef.current.has(markerID)) {
        const marker = bikeRef.current.get(markerID);
        marker.setLatLng([pos.lat, pos.long])
      } else {
        
        const bikeIcon = L.circleMarker([pos.lat, pos.long], {
          radius: 6,
          fillColor: "#ff6b6a",
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.6,
        }).addTo(map).bindPopup(`<b>Bike ${b.number}</b><br/>Battery: ${b.battery}%<br/>Status: ${b.status}`);

        bikeRef.current.set(markerID, bikeIcon);
      }
    });

  }, [bikes, city, limit]);


    console.log(stations)
    console.log(bikes)

  return (
    <div style={{ padding:16 }}>
      <h2>Städer & zoner</h2>
      
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <select 
          className="search-input"
          value={city?._id} 
          onChange={(e) => {setCity(cities.find(c => c._id === e.target.value))}}
          >
          {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <select 
          value={limit} 
          onChange={(e)=>setLimit(Number(e.target.value))} 
          className="search-input"
          >
          <option value={10}>Visa: 10</option>
          <option value={50}>Visa: 50</option>
          <option value={100}>Visa: 100</option>
          <option value={200}>Visa: 200</option>
          <option value={500}>Visa: 500</option>
          <option value={bikes.length}>Visa: {bikes.length}</option>
        </select>

        <div className="live-status" style={{ color: connected ? "green" : "red" }}>
          Live spårning: {connected ? "Aktiv" : "Frånkopplad"}
        </div>
      </div>

      <div id="map" style={{ height: "720px", marginTop: 12, borderRadius: 8, overflow:"hidden" }} />
      <p style={{ opacity:0.8, marginTop:8 }}>
        Grön polygon = giltig zon. 
      </p>
    </div>
  );
}
