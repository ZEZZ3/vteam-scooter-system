import axios from "axios";

const API = process.env.API_BASE || "http://backend:3000";

async function report() {
  try {
    // Här skulle en riktig cykel skicka telemetri.
    // Vi gör en enkel health-koll så att containern "gör något".
    const { data } = await axios.get(`${API}/api/health`);
    console.log("Bike heartbeat:", data);
  } catch (err) {
    console.log("Bike heartbeat failed (backend kanske inte redo än)");
  }
}

setInterval(report, 5000);
console.log("Bike device started, sending heartbeat every 5s…");
