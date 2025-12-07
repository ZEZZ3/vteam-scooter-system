"use strict"

const minBalance = 100.0;
const startingFee = 12.0;
const minuteFee = 3.0;

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
    minBalance
}