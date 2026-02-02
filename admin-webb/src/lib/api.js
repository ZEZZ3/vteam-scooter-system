import { client } from "../api/client";

export const USE_MOCK = false; // byt till false när backend kör

export async function getUsers() {
  if (USE_MOCK) {
    return [
      { id: "u1", email: "admin@demo.se", role: "admin" },
      { id: "u2", email: "kund@demo.se", role: "user" },
    ];
  }
  const { data } = await client.get("/api/v1/users");

  return data.data;
}

export async function getBikes() {
  if (USE_MOCK) {
    return [
      { id: "SCOOT-101", status: "available", battery: 82, city: "Stockholm" },
      { id: "SCOOT-102", status: "in_use",    battery: 47, city: "Göteborg"  },
      { id: "SCOOT-103", status: "service",   battery: 12, city: "Malmö"     },
    ];
  }
  const { data } = await client.get("/api/v1/bikes");

  return data.data;
}

export async function getZones() {
  const { data } = await client.get("/api/v1/zone");

  return data.data;
}

export async function getStations() {
  const { data } = await client.get("/api/v1/station");

  return data.data;
}

export async function getCity() {
  const { data } = await client.get("/api/v1/city");

  return data.data;
}

export async function getSimulation() {
  const { data } = await client.get("/api/v1/simulation");

  return data.data;
}

export async function deleteSimulations(simulations) {
  await Promise.all(
    simulations.map(s =>
      client.delete(`api/v1/simulation/${s.simulationID}`)
    )
  );
}

/**
 * USERS
 */

export async function addUser(usrData) {
  const { data } = await client.post(`/api/v1/users/`, usrData);

  return data.data;
}

export async function getUser(id) {
  const { data } = await client.get(`/api/v1/users/${id}`);

  return data.data;
}

export async function updateUser(id, usrData) {
  const { data } = await client.patch(`/api/v1/users/${id}`, usrData);
  return data.data;
}

export async function removeUser(id) {
  const { data } = await client.delete(`/api/v1/users/${id}`);
  return data.data;
}

/**
 * HISTORY
 */

export async function getHistory() {
  const { data } = await client.get(`/api/v1/history`);
  return data.data;
}

export async function getUserHistory(id) {
  const { data } = await client.get(`api/v1/history?userID=${id}`);
  return data.data;
}

export async function deletePayments(payments) {
  await Promise.all(
    payments.map(p =>
      client.delete(`api/v1/history/${p.userID}/payments/${p.paymentID}`)
    )
  );
}

export async function deleteRides(rides) {
  await Promise.all(
    rides.map(r =>
      client.delete(`api/v1/history/${r.userID}/rides/${r.rideID}`)
    )
  );
}

/**
 * BIKES
 */

export async function getBike(id) {
  const { data } = await client.get(`/api/v1/bikes/${id}`);
  return data.data;
}

export async function addBike(bikeData) {
  const { data } = await client.post(`/api/v1/bikes/`, bikeData);
  console.log(data)
  return data.data;
}

export async function updateBike(id, bikeData) {
  const { data } = await client.patch(`/api/v1/bikes/${id}`, bikeData);
  return data.data;
}

export async function removeBike(id) {
  const { data } = await client.delete(`/api/v1/bikes/${id}`);
  return data.data;
}





