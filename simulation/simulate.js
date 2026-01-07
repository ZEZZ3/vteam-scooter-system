import axios from "axios";

const API = process.env.API_BASE || "http://backend:3000";

async function poke() {
  try {
    const { data } = await axios.get(`${API}/api/v1/index`);
    console.log("Simulation ping:", data);
  } catch (err) {
    console.log("Simulation ping failed (expected if backend not ready yet)");
  }
}

setInterval(poke, 3000);
console.log("Simulation started, pinging backend every 3s…");
