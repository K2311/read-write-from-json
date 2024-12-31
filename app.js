const express = require('express');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { error } = require('console');
const redis = require('redis');
const logger = require('./logger');
const { saveDataSchema  } = require('./validations/validation');
const validationMiddleware = require('./validations/validationMiddleware');
const app = express();
const PORT = 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6380;
console.log('REDIS_PORT:',REDIS_PORT);

// Create Redis client
const redisClient = redis.createClient({
    socket: {
        port: REDIS_PORT, 
        host: '127.0.0.1', 
    },
});

// Connect to Redis
redisClient.on('connect', () => {
    console.log('Successfully connected to Redis!');
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

async function ensureRedisConnected() {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        return true;
    } catch (err) {
        console.error('Redis connection error:', err);
        return false;
    }
}
ensureRedisConnected();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, 
    message: { message: 'Too many requests, please try again later.' },
});

app.use(limiter);

const filePath = path.join(__dirname, 'json-files/data.json');

app.use(bodyParser.json());

const readJsonData = ()=>{
    try {
        const data = fs.readFileSync(filePath,'utf8');
        if (!data.trim()) {
            logger.warn('JSON file is empty. Initializing with an empty array.',{ filePath });
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        if(error==="ENOENT"){
            logger.error('File not found:', { filePath });
            return [];
        }else if(error.name==='SyntaxError'){
            logger.error('Corrupted JSON file. Initializing with an empty array.', { filePath });
            writeJsonData([]); 
            return [];
        }else{
            logger.error('Error reading the file:', { message: error.message });
            throw error;
        }
        
    }
    
}

const writeJsonData = (data)=>{
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        logger.info('Data successfully written to file.',{ filePath });
    } catch (error) {
        logger.error('Error writing to file:', { message: error.message });
        throw error;
    }
}

app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

app.get('/api/all', async (req, res) => {
    const cacheKey = 'allData';

    if (!await ensureRedisConnected()) {
        return res.status(500).json({ error: 'Redis client is not connected' });
    }

    try {
        // Try to get cached data
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log('Returning data from cache');
            return res.json(JSON.parse(cachedData));
        }

        // If no cached data, read from the JSON file
        const data = readJsonData();
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));  // Cache the data for 1 hour
        console.log('Returning data from JSON file');
        return res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Failed to retrieve data. Please try again later.' });
    }
});


app.post('/api/save',validationMiddleware(saveDataSchema),(req,res)=>{
    const { name, email } = req.body;

    try {
        const data = readJsonData();
        const newData = {
            id: data.length?data[data.length -1].id + 1 : 1,
            name:name,
            email:email
        }
        data.push(newData);
        writeJsonData(data);
        res.status(201).json(newData);
        
    } catch (error) {
        res.status(500).json({error:'Failed to write data. Please try again later.'});
    }
});

app.get('/api/id/:id',async (req,res)=>{
    const cacheKey = 'singleData';
    const id = parseInt(req.params.id, 10);

    if (!await ensureRedisConnected()) {
        return res.status(500).json({ error: 'Redis client is not connected' });
    }

    try {
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log('Returning item from cache');
            return res.json(JSON.parse(cachedData));
        }

        const data = readJsonData();
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(404).json({ error: 'No data available.' });
        }

        const item = data.find((i)=> i.id==id);
        if(!item){
            return res.status(404).json({ error:'Data not found' });
        }

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(item)); 
        console.log('Returning item from JSON file');
        return res.json(item);
        
    } catch (error) {
        res.status(500).json({error:'Failed to retrieve data. Please try again later.'});
    }

});

app.delete('/api/id/:id',(req,res)=>{
    const id = parseInt(req.params.id, 10);

    try {
        const data = readJsonData();
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(404).json({ error: 'No data available.' });
        }
        
        const itemIndex = data.findIndex((i) => i.id === id);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Data not found.' });
        }
        const deletedItem = data.splice(itemIndex, 1)[0];
        writeJsonData(data);
        return res.json(data);
        
    } catch (error) {
        res.status(500).json({error:'Failed to retrieve data. Please try again later.'});
    }

});

app.use((err, req, res, next) => {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;