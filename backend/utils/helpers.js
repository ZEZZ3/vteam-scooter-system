"use strict"

const minBalance = 100.0;
const startingFee = 12.0;
const minuteFee = 3.0;
const LOG_DELAY = 10000;
const BIKES_PER_STATION = 30;

function getTimeString() {
    const now = new Date();
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`
}

function print(source, text) {
    console.log(`${getTimeString()} [${source}] ${text}`);
}

function checkPutData(body, required) {
    const newData = {}

    for (const field of required) {
        if (body[field] === undefined) {
            throw new Error(`Missing field: ${field}`);            
        }
        newData[field] = body[field];
    }

    return newData;
}

function checkPatchData(body, required) {
    const newData = {}

    for (const field of required) {
        if (body[field] !== undefined) {
            newData[field] = body[field];
        }
    }

    return newData;
}

function changeToIsValid(changeTo) {
    const valid = ["free", "rented", "unavailable"];
    if (!valid.includes(changeTo)) {
        return false;
    }
    return true;
}

module.exports = {
    checkPutData,
    checkPatchData,
    changeToIsValid,
    getTimeString,
    print,
    minBalance,
    startingFee,
    minuteFee,
    LOG_DELAY,
    BIKES_PER_STATION
}