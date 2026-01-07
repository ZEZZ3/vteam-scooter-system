const axios = require("axios");
/* require("dotenv").config(); */

const constants = {}
constants.STOCKHOLM_LAT_MAX = 59.390000;
constants.STOCKHOLM_LAT_MIN = 59.310000;
constants.STOCKHOLM_LONG_MAX = 18.170000;
constants.STOCKHOLM_LONG_MIN = 17.950000;

constants.MAX_RETRY = 10;
constants.RETRY_DELAY = 2000;
constants.BROADCAST_RATE = 10000;

async function getServiceToken(accessToken = null, tokenExpires = 0) {

    if (accessToken && Date.now() < tokenExpires) {
        print("Auth", "Service token found.")
        return accessToken;
    }
    const response = await axios.post(`${process.env.BASE_API_URL}/api/v1/service/token`, {
        serviceID: process.env.SERVICE_ID,
        serviceSecret: process.env.SERVICE_SECRET
    });

    const result = {}
    result.token = response.data.serviceToken;
    result.expiry = Date.now() + (response.data.expires - 40) * 1000;
    print("Auth", "New service token created.")
    return result;
}

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

module.exports = {
    constants,
    getServiceToken,
    print
}