"use strict"

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

module.exports = {
    checkPutData,
    checkPatchData
}