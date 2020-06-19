const app = require('./app');
const CONFIG = require('./config');

app.listen(CONFIG.PORT_NUMBER, () => {
    console.log("Server listening on Port " + CONFIG.PORT_NUMBER);
})