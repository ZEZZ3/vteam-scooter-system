"use strict"

function checkUpdateData(body, letPass) {
    const newData = {}

    for (const pass of letPass) {
        if (body[pass] !== undefined) {
            newData[pass] = body[pass];
        }
    }

    return newData;
}

module.exports = {
    checkUpdateData
}