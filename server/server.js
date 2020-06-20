const app = require('./app');
const CONFIG = require('./config');
const logger = require('./utils');

app.listen(CONFIG.PORT_NUMBER, () => {
    logger.info("Server listening on Port " + CONFIG.PORT_NUMBER);
})