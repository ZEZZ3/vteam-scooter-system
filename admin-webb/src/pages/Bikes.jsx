import { useEffect, useMemo, useState } from "react";
import { getBikes } from "../lib/api";

function Battery({ pct }) {
  const n = Number.isFinite(pct) ? pct : Number(pct);
  const safe = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;

  const bg =
    safe === null ? "rgba(148,163,184,.18)" : safe >= 60 ? "rgba(46,204,113,.18)" : safe >= 30 ? "rgba(245,158,11,.18)" : "rgba(255,99,99,.18)";
  const border =
    safe === null ? "rgba(148,163,184,.35)" : safe >= 60 ? "rgba(46,204,113,.35)" : safe >= 30 ? "rgba(245,158,11,.35)" : "rgba(255,99,99,.35)";

  return (
    <span
      className="badge"
      style={{
        background: bg,
        borderColor: border,
        minWidth: 62,
        justifyContent: "center",
        fontWeight: 900,
      }}
    >
      {safe === null ? "—" : `${safe}%`}
    </span>
  );
}

function getCity(b) {
  return b?.city ?? b?.cityName ?? b?.city_id ?? "";
}

function getId(b) {
  return b?.id ?? b?._id ?? b?.bikeId ?? b?.serial ?? "";
}

export default function Bikes() {
  const [bikes, setBikes] = useState([]);
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data = await getBikes();
      setBikes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Kunde inte hämta cyklar. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cities = useMemo(() => {
    const list = [];
    for (const b of bikes) {
      const c = String(getCity(b) ?? "").trim();
      if (c) list.push(c);
    }
    return Array.from(new Set(list)).sort();
  }, [bikes]);

  const filtered = useMemo(() => {
    return bikes.filter((b) => {
      const bStatus = b?.status ?? "";
      const bCity = String(getCity(b) ?? "");
      return (!status || bStatus === status) && (!city || bCity === city);
    });
  }, [bikes, status, city]);

  const emptyText =
    bikes.length === 0
      ? "Inga cyklar ännu."
      : "Inga cyklar matchade filtren. Prova att rensa filter.";

  function clearFilters() {
    setStatus("");
    setCity("");
  }

  return (
    <div className="container">
      <h1 className="h1">Cyklar</h1>
      <p className="muted" style={{ marginTop: -4 }}>
        Filtrera på status och stad. Batteri visas som chip.
      </p>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="cardHead">
          <div className="row" style={{ width: "100%", flexWrap: "wrap" }}>
            <span className="badge">🛴 Bikes</span>

            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Status: Alla</option>
              <option value="available">available</option>
              <option value="in_use">in_use</option>
              <option value="service">service</option>
            </select>

            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Stad: Alla</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="spacer" />

            <button className="btn" onClick={clearFilters} disabled={loading}>
              Rensa filter
            </button>
            <button className="btn btnPrimary" onClick={load} disabled={loading}>
              {loading ? "Laddar…" : "Uppdatera"}
            </button>
          </div>
        </div>

        <div className="cardBody">
          {error ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,99,99,.25)",
                background: "rgba(255,99,99,.10)",
                marginBottom: 12,
              }}
            >
              <div style={{ marginBottom: 10, fontWeight: 700 }}>{error}</div>
              <button className="btn" onClick={load}>
                Försök igen
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="muted" style={{ padding: 10 }}>
              Laddar cyklar…
            </div>
          ) : filtered.length === 0 ? (
            <div className="muted" style={{ padding: 10 }}>
              {emptyText}
            </div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 220 }}>ID</th>
                    <th>Status</th>
                    <th style={{ width: 120 }}>Batteri</th>
                    <th>Stad</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const id = getId(b);
                    const bCity = String(getCity(b) ?? "");
                    return (
                      <tr key={id || JSON.stringify(b)}>
                        <td style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                          {id || "—"}
                        </td>
                        <td>
                          <span className="badge">{b?.status || "—"}</span>
                        </td>
                        <td>
                          <Battery pct={b?.battery ?? b?.batteryPct ?? b?.battery_level} />
                        </td>
                        <td>{bCity || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
