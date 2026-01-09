import { client } from "../api/client";

// Rek: kör live Users direkt, men låt Bikes vara mock tills det finns bikes i DB
export const USE_MOCK_USERS = false;
export const USE_MOCK_BIKES = true;

/* =======================
  USERS
======================= */
export async function getUsers() {
  if (USE_MOCK_USERS) {
    return [
      { id: "u1", mail: "admin@demo.se", role: "admin", balance: 20000, verified: true },
      { id: "u2", mail: "kund@demo.se", role: "customer", balance: 200, verified: true },
    ];
  }

  const res = await client.get("/api/v1/users");

  const list = res.data?.data ?? [];
  if (!Array.isArray(list)) return [];

  // Returnera bara "säkra" fält (inte password, etc)
  return list.map((u) => ({
    id: u.id ?? u._id ?? "",
    mail: u.mail ?? u.email ?? "",
    role: u.role ?? "",
    balance: typeof u.balance === "number" ? u.balance : null,
    verified: typeof u.verified === "boolean" ? u.verified : null,
    createdAt: u.createdAt ?? null,
  }));
}

/* =======================
  BIKES
======================= */
export async function getBikes() {
  if (USE_MOCK_BIKES) {
    return [
      { id: "SCOOT-101", status: "available", battery: 82, city: "Stockholm" },
      { id: "SCOOT-102", status: "in_use", battery: 47, city: "Göteborg" },
      { id: "SCOOT-103", status: "service", battery: 12, city: "Malmö" },
    ];
  }

  const res = await client.get("/api/v1/bikes");

  const list = res.data?.data ?? [];
  if (!Array.isArray(list)) return [];

  return list.map((b) => ({
    id: b.id ?? b._id ?? b.serial ?? b.bikeId ?? "",
    status: b.status ?? "",
    battery: b.battery ?? b.batteryPct ?? b.battery_level ?? null,
    city: b.city ?? b.cityName ?? b.city_id ?? "",
  }));
}
