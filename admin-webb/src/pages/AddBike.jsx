import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {addBike, getCity, getZones, getStations } from "../lib/api";
import { SocketCtx } from "../socket/SocketContext";


export default function AddBike() {
  const { id } = useParams();
  const { triggerRefetch } = useContext(SocketCtx);
  const navigate = useNavigate();

  const [cities, setCities] = useState(null);
  const [zones, setZones] = useState(null);
  const [stations, setStations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({status: "free", battery: 100});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const citiesData = await getCity();
        const zonesData = await getZones();
        const stationsData = await getStations();
        
        setStations(stationsData); 
        setCities(citiesData);
        setZones(zonesData);

      } catch (e) {
        setError("Kunde inte hämta nödvändig data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    try {

      if (!formData.city) {
        setError("Stad är obligatorisk");
        return;
      }
      if (!formData.currentZone) {
        setError("Zon är obligatorisk");
        return;
      }
      if (!formData.currentStation) {
        setError("Station är obligatorisk");
        return;
      }
      if (!formData.position) {
        setError("Internt fel.");
        return;
      }
      console.log(formData)
      setIsSaving(true);
      await addBike(formData);

      setSaved(true);
      triggerRefetch();
      navigate("/bikes")
    } catch (e) {
      console.log(e)
      setError("Kunde inte skapa scooter");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    setFormData(f => ({
      ...f,
      currentStation: "",
      currentStationName: ""
    }));
  }, [formData.cityID, formData.currentZone]);

  const availableStations = stations?.filter(
    s => s.cityID === formData.cityID && s.zoneID === formData.currentZone
  )

  const availableZones = zones?.filter(
    s => s.cityID === formData.cityID
  )

  if (loading) return <span className="loader"></span>;

  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <h2>Scooterdetaljer</h2>

      {error && (
        <div style={{ 
          background: "#fee", 
          color: "#c33", 
          padding: 8, 
          borderRadius: 4, 
          marginBottom: 12 
        }}>
            {error}
        </div>
      )}

      {saved && (
        <div style={{ 
          background: "#fee", 
          color: "rgba(137, 197, 40, 1)", 
          padding: 8, 
          borderRadius: 4, 
          marginBottom: 12 
        }}>
            Ändringar sparade.
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label>Status</label>
        <select
          value={formData.status || "free"}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        >
          <option value="free">Free</option>
          <option value="rented">Rented</option>
          <option value="service">Service</option>
        </select>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label>Batteri</label>
        <input
          type="number"
          value={formData.battery || 100}
          onChange={(e) => setFormData({ ...formData, battery: e.target.value })}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
        />
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label>Stad</label>
        <select
            value={formData.cityID || ""}
            onChange={(e) => {
            const cityID = e.target.value;
            const city = cities.find(c => c._id === cityID);

            setFormData({
                ...formData,
                cityID: cityID,
                city: city?.name || ""
            });
            }}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4}}
        >
            <option value="" disabled>Välj stad</option>
            {cities.map(c => (
                <option key={c._id} value={c._id}>
            {c.name}
            </option>
            ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Zon</label>
        <select
        
            value={formData.currentZone || ""}
            onChange={(e) => {
            const zoneID = e.target.value;
            const zone = zones.find(z => z._id === zoneID);

            setFormData({
                ...formData,
                currentZone: zoneID,
                currentZoneName: zone?.name || ""
            });
            }}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4}}
        >
            <option value="" disabled>Välj zon</option>
                {availableZones.map(z => (
                <option key={z._id} value={z._id}>
                {z.name}
            </option>
            ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Station</label>
        <select
        
            value={formData.currentStation || ""}
            onChange={(e) => {
                const stationID = e.target.value;
                const station = stations.find(s => s._id === stationID);

                setFormData({
                    ...formData,
                    currentStation: stationID,
                    currentStationName: station?.name || "",
                    position: station?.position || null
                });
            }}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4}}
        >
            <option value="" disabled>Välj station</option>
            {availableStations.map(s => (
                <option key={s._id} value={s._id}>
                {s.name}
                </option>
            ))}
        </select>
      </div>

      <div style={{display: "flex", justifyContent: "space-between"}}>
        <div>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: 8, marginRight: 8 }}>
            {isSaving ? "Sparar..." : "Spara"}
          </button>
          <button onClick={() => navigate("/bikes")} style={{ padding: 8, marginRight: 8 }}>Avbryt</button>
        </div>
      </div>
    </div>
  );
}