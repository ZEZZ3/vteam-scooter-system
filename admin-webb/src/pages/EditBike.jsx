import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBike, updateBike, removeBike, getCity, getZones, getStations } from "../lib/api";

export default function EditBike() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [cities, setCities] = useState(null);
  const [zones, setZones] = useState(null);
  const [stations, setStations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const bikeData = await getBike(id);
        const citiesData = await getCity();
        const zonesData = await getZones();
        const stationsData = await getStations();
        
        setStations(stationsData); 
        setBike(bikeData);
        setCities(citiesData);
        setZones(zonesData);
        console.log(bikeData)
        console.log(citiesData)
        console.log(zonesData)
        console.log(stationsData)

        setFormData(bikeData);
      } catch (e) {
        setError("Kunde inte hämta scooter");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    try {
      setIsSaving(true);
      await updateBike(id, formData);
      setUser(formData);
      setSaved(true);
    } catch (e) {
      setError("Kunde inte uppdatera scooter");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    try {
      await removeBike(id);
      navigate("/bikes")
    } catch (e) {
      console.log(e)
      setError("Kunde inte radera scooter");
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

  if (loading) return <div style={{ padding: 16 }}>Laddar...</div>;
  if (!bike) return <div style={{ padding: 16 }}>Scooter hittades inte</div>;

  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
        <button onClick={() => navigate("/bikes")} style={{ padding: "0.5rem", marginRight: 5 }}>&lt;</button>
        <h2>Scooterdetaljer</h2>
      </div>

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
        <label>ID</label>
        <input
          type="text"
          value={bike._id || "N/A"}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          disabled
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Nummer</label>
        <input
          type="text"
          value={bike.number || "N/A"}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          disabled
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Skapad</label>
        <input
          type="text"
          value={bike.createdAt ? bike.createdAt.slice(0,10) + " " + bike.createdAt.slice(11,19) : "N/A" }
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          disabled
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Uppdaterad</label>
        <input
          type="text"
          value={bike.updatedAt ? bike.updatedAt.slice(0,10) + " " + bike.updatedAt.slice(11,19) : "N/A" } 
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          disabled
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Status</label>
        <select
          value={formData.status || ""}
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
          type="text"
          value={formData.battery || ""}
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
                currentStationName: station?.name || ""
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
        <div>
          <button onClick={remove} style={{ padding: 8, marginRight: 8 }}>Radera scooter</button>
        </div>
      </div>
    </div>
  );
}