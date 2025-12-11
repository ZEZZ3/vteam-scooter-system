import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// mockstäder och zoner
const CITIES = [
  { id: "sthlm", name: "Stockholm", center: [59.334, 18.063] },
  { id: "gbg",   name: "Göteborg",  center: [57.708, 11.974] },
  { id: "malmo", name: "Malmö",     center: [55.605, 13.003] },
];

const MOCK_ZONES = {
  sthlm: {
    parking: [
      [59.334, 18.063],
      [59.336, 18.07],
      [59.331, 18.075],
    ],
    noride: [
      [59.33, 18.06],
      [59.329, 18.07],
      [59.327, 18.06],
    ],
  },
  gbg: {
    parking: [[57.708, 11.974],[57.71, 11.98],[57.705, 11.985]],
    noride:  [[57.705, 11.97],[57.704, 11.98],[57.702, 11.97]],
  },
  malmo: {
    parking: [[55.605, 13.003],[55.607, 13.01],[55.603, 13.012]],
    noride:  [[55.603, 13.0],[55.602, 13.01],[55.601, 13.0]],
  },
};

export default function Cities() {
  const [city, setCity] = useState(CITIES[0]);
  const mapRef = useRef(null);
  const layerRef = useRef({ parking: null, noride: null });

  useEffect(() => {
    const map = L.map("map", { zoomControl: true }).setView(city.center, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.setView(city.center, 13);

    Object.values(layerRef.current).forEach(layer => layer && map.removeLayer(layer));

    const z = MOCK_ZONES[city.id];
    const parking = L.polygon(z.parking, { color:"#1e8f4d", fillOpacity:0.25 }).addTo(map);
    const noride  = L.polygon(z.noride,  { color:"#b42323", fillOpacity:0.25 }).addTo(map);
    parking.bindPopup("Parking zone");
    noride.bindPopup("No-ride zone");
    layerRef.current = { parking, noride };
  }, [city]);

  return (
    <div style={{ padding:16 }}>
      <h2>Städer & zoner</h2>
      <select value={city.id} onChange={(e)=>setCity(CITIES.find(c => c.id === e.target.value))}>
        {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div id="map" style={{ height: "520px", marginTop: 12, borderRadius: 8, overflow:"hidden" }} />
      <p style={{ opacity:0.8, marginTop:8 }}>
        Grön polygon = parkering. Röd polygon = förbjudet område.
      </p>
    </div>
  );
}
