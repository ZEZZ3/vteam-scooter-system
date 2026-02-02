import { useEffect, useState } from "react";
import { getSimulation, deleteSimulations } from "../lib/api";

export default function Simulation() {
  const [simulation, setSimulation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [selectedSimulations, setSelectedSimulations] = useState([]);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const data = await getSimulation();
      console.log(data)
      setSimulation(data);
    } catch (e) {
      setErr("Kunde inte hämta simuleringar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Simuleringar</h2>

      {loading && <span className="loader"></span>}
      {err && (
        <div style={{ background:"#431", color:"#fff", padding:8, borderRadius:6 }}>
          {err} <button onClick={load}>Försök igen</button>
        </div>
      )}

      {!loading && !err && simulation.length === 0 && <p>Inga simuleringar hittades.</p>}

      {!loading && !err && simulation.length > 0 && (
        <>
          <button
            disabled={selectedSimulations.size === 0}
            onClick={async () => {
              await deleteSimulations(selectedSimulations);

              setSimulation(prev =>
                prev.filter(
                  sim => !selectedSimulations.some(s => s.simulationID === sim._id)
                )
              );

              setSelectedSimulations([]);
            }}
            style={{ padding: 8, marginBottom: 8 }}
          >
            Ta bort valda ({selectedSimulations.length})
          </button>
          <table className="table" border={1} cellPadding={6}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Total tick</th>
                <th>Klar</th>
                <th>Total tid</th>
                <th>Avslutade rutter</th>
                <th>Scootrar</th>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      simulation.length > 0 &&
                      selectedSimulations.length === simulation.length
                    }
                    onChange={() => {
                      setSelectedSimulations(
                        selectedSimulations.length === simulation.length
                          ? []
                          : simulation.map(s => ({
                              simulationID: s._id,
                            }))
                      );
                    }}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {simulation.map(s => (
                <tr key={s._id}>
                  <td>{s._id}</td>
                  <td>{s.ticks}</td>
                  <td>{s.finishedAt ? s.finishedAt.slice(0,10) + " " + s.finishedAt.slice(11,19) : "N/A"}</td>
                  <td>{Math.floor((s.ticks * s.configuration.simulationRate)/1000)}s</td>
                  <td>{s.finishedBikes}</td>
                  <td>{s.totalBikes}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedSimulations.some(
                        sim => sim.simulationID === s._id
                      )}
                      onChange={() => {
                        setSelectedSimulations(prev =>
                          prev.some(sel => sel.simulationID === s._id)
                            ? prev.filter(sel => sel.simulationID !== s._id)
                            : [...prev, { simulationID: s._id }]
                        );
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
