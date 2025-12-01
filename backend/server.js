const app = require("./app");
const port = process.env.PORT || 3000;
let server = app.listen(port, () => {console.log(`API running on port ${port}`);});

module.exports = server;