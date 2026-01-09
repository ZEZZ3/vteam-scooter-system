import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

// mockstäder och zoner
const CITIES = [
  { id: "sthlm", name: "Stockholm", center: [59.334, 18.063] },
  { id: "gbg", name: "Göteborg", center: [57.708, 11.974] },
  { id: "malmo", name: "Malmö", center: [55.605, 13.003] },
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
    parking: [
      [57.708, 11.974],
      [57.71, 11.98],
      [57.705, 11.985],
    ],
    noride: [
      [57.705, 11.97],
      [57.704, 11.98],
      [57.702, 11.97],
    ],
  },
  malmo: {
    parking: [
      [55.605, 13.003],
      [55.607, 13.01],
      [55.603, 13.012],
    ],
    noride: [
      [55.603, 13.0],
      [55.602, 13.01],
      [55.601, 13.0],
    ],
  },
};

export default function Cities() {
  const [cityId, setCityId] = useState(CITIES[0].id);

  const city = useMemo(() => CITIES.find((c) => c.id === cityId) || CITIES[0], [cityId]);

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef({ parking: null, noride: null });

  // init map once
  useEffect(() => {
    if (!mapElRef.current) return;

    const map = L.map(mapElRef.current, { zoomControl: true }).setView(city.center, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setView(city.center, 13);

    Object.values(layerRef.current).forEach((layer) => layer && map.removeLayer(layer));

    const z = MOCK_ZONES[city.id];
    const parking = L.polygon(z.parking, { color: "#1e8f4d", fillOpacity: 0.25 }).addTo(map);
    const noride = L.polygon(z.noride, { color: "#b42323", fillOpacity: 0.25 }).addTo(map);

    parking.bindPopup("Parking zone");
    noride.bindPopup("No-ride zone");

    layerRef.current = { parking, noride };
  }, [city]);

  function fitToCityBounds() {
    const map = mapRef.current;
    if (!map) return;

    const z = MOCK_ZONES[city.id];
    const all = [...z.parking, ...z.noride];
    const bounds = L.latLngBounds(all.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds.pad(0.3));
  }

  function reloadZones() {

    setCityId((x) => x);
  }

  return (
    <div className="container">
      <h1 className="h1">Städer & zoner</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        Välj stad och granska parkeringszoner / no-ride zoner.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardHead">
          <div className="row" style={{ width: "100%" }}>
            <span className="badge">📍 Stad</span>

            <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="spacer" />

            <button className="btn" onClick={fitToCityBounds}>
              Zooma till zoner
            </button>

            <button className="btn btnPrimary" onClick={reloadZones}>
              Uppdatera zoner
            </button>
          </div>
        </div>

        <div
          className="cardBody"
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr .65fr",
            gap: 14,
          }}
        >
          {/* KARTA */}
          <div className="card" style={{ padding: 10 }}>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
              <div ref={mapElRef} style={{ height: 520 }} />
            </div>
          </div>

          {/* SIDOPANEL */}
          <div className="card" style={{ padding: 14 }}>
            <h2 className="h2" style={{ marginBottom: 10 }}>
              Legend & info
            </h2>

            <div className="row" style={{ marginBottom: 12 }}>
              <span className="badge" style={{ borderColor: "rgba(46,204,113,.35)" }}>
                🟢 Parking zone
              </span>
              <span className="badge" style={{ borderColor: "rgba(255,99,99,.35)" }}>
                🔴 No-ride zone
              </span>
            </div>

            <div className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 10 }}>
                <strong style={{ color: "var(--text)" }}>Vald stad:</strong> {city.name}
              </div>

              <div style={{ marginBottom: 10 }}>
              </div>

              <div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => setCityId(CITIES[0].id)}>
                Återställ till default
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
