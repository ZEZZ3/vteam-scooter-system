import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUser, updateUser, removeUser } from "../lib/api";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [payments, setPayments] = useState();
  const [rides, setRides] = useState();

  useEffect(() => {
    async function load() {
      try {
        const userData = await getUser(id);
        //console.log(userData)
        setUser(userData);
        setFormData(userData);

      } catch (e) {
        setError("Kunde inte hämta användare");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSave() {
    try {
      setIsSaving(true);
      await updateUser(id, formData);
      setUser(formData);
      setSaved(true);
    } catch (e) {
      setError("Kunde inte uppdatera användare");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    try {
      await removeUser(id);
      navigate("/users")
    } catch (e) {
      setError("Kunde inte radera användare");
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Laddar...</div>;
  if (!user) return <div style={{ padding: 16 }}>Användare hittades inte</div>;

  return (
    <div style={{ padding: 16,  display: "flex" }}>
      
      <div style={{width: "50%"}}>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
          <button onClick={() => navigate("/users")} style={{ padding: "0.5rem", marginRight: 5 }}>&lt;</button>
          <h2>Användardetaljer</h2>
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
            value={user._id || "N/A"}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            disabled
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Skapad</label>
          <input
            type="text"
            value={user.createdAt ? user.createdAt.slice(0,10) + " " + user.createdAt.slice(11,19) : "N/A"}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            disabled
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Uppdaterad</label>
          <input
            type="text"
            value={user.updatedAt ? user.updatedAt.slice(0,10) + " " + user.updatedAt.slice(11,19) : "N/A"}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            disabled
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>E-post</label>
          <input
            type="email"
            value={formData.mail || ""}
            onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Roll</label>
          <select
            value={formData.role || "customer"}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="customer">Användare</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Saldo</label>
          <input
            type="number"
            value={formData.balance || 0}
            onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Förnamn</label>
          <input
            type="text"
            value={formData.firstName || ""}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Efternamn</label>
          <input
            type="text"
            value={formData.lastName || ""}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Adress</label>
          <input
            type="text"
            value={formData.adress || ""}
            onChange={(e) => setFormData({ ...formData, adress: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Postnummer</label>
          <input
            type="text"
            value={formData.postcode || ""}
            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Stad</label>
          <select
            value={formData.city || ""}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          >
            <option value="Stockholm">Stockholm</option>
            <option value="Linköping">Linköping</option>
            <option value="Malmö">Malmö</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Telefon</label>
          <input
            type="text"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{display: "flex", justifyContent: "space-between"}}>
          <div>
            <button onClick={handleSave} disabled={isSaving} style={{ padding: 8, marginRight: 8 }}>
              {isSaving ? "Sparar..." : "Spara"}
            </button>
            <button onClick={() => navigate("/users")} style={{ padding: 8, marginRight: 8 }}>Avbryt</button>
          </div>
          <div>
            <button onClick={remove} style={{ padding: 8, marginRight: 8 }}>Radera användare</button>
          </div>
        </div>
      </div>
    </div>
  );
}