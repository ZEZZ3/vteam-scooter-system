const app = require("./app");
const initDB = require("./utils/initDB");
require("dotenv").config();

const port = process.env.PORT || 3000;
let server;

(async () => {
    try {
        if (process.env.NODE_ENV !== "test") {
            await initDB();
            console.log("DB initiated")
        }
        server = app.listen(port, () => {console.log(`API running on port ${port}`);});
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
})();

module.exports = server;