import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUser } from "../lib/api";

export default function AddUser() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({role: "customer"});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    console.log(formData.role)
    if (!formData.mail || !formData.mail.trim()) {
        setError("E-post är obligatoriskt");
        return;
    }
    if (!formData.password || !formData.password.trim()) {
        setError("Lösenord är obligatoriskt");
        return;
    }

    try {
        setIsSaving(true);
        setError(null);
        await addUser(formData);
        navigate("/users");
    } catch (e) {
        const errorTitle = e.response.data.error.title;
        if (errorTitle === "User already exists") {
            setError("Användare med denna e-post finns redan.");
            return
        }
        setError("Kunde inte skapa användare");
        
    } finally {
        setIsSaving(false);
    }
  }



  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <h2>Användardetaljer</h2>

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

      <div style={{ marginBottom: 16 }}>
        <label>E-post</label>
        <input
          type="email"
          value={formData.mail || ""}
          onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
          style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Lösenord</label>
        <input
          type="password"
          value={formData.password || ""}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

      <button onClick={handleSave} disabled={isSaving} style={{ padding: 8, marginRight: 8 }}>
        {isSaving ? "Sparar..." : "Spara"}
      </button>
      <button onClick={() => navigate("/users")} style={{ padding: 8, marginRight: 8 }}>Avbryt</button>
    </div>
  );
}