"use strict";

const clearDatabase = require("./clearDatabase");
const baseData = require("./baseData");

beforeEach(async () => {
    await clearDatabase();
    await baseData();
});