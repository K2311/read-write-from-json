const app = require('./app');
const logger = require('./logger');

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    //logger.info(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});
