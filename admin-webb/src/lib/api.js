import { client } from "../api/client";

export const USE_MOCK = true; // byt till false när backend kör

export async function getUsers() {
  if (USE_MOCK) {
    return [
      { id: "u1", email: "admin@demo.se", role: "admin" },
      { id: "u2", email: "kund@demo.se", role: "user" },
    ];
  }
  const { data } = await client.get("/v1/users");
  return data;
}

export async function getBikes() {
  if (USE_MOCK) {
    return [
      { id: "SCOOT-101", status: "available", battery: 82, city: "Stockholm" },
      { id: "SCOOT-102", status: "in_use",    battery: 47, city: "Göteborg"  },
      { id: "SCOOT-103", status: "service",   battery: 12, city: "Malmö"     },
    ];
  }
  const { data } = await client.get("/v1/bikes");
  return data;
}
