const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { error } = require('console');
const app = express();
const PORT = 3000;

const filePath = path.join(__dirname, 'json-files/data.json');

app.use(bodyParser.json());

const readJsonData = ()=>{
    try {
        const data = fs.readFileSync(filePath,'utf8');
        return JSON.parse(data);
    } catch (error) {
        if(error==="ENOENT"){
            console.error('File not found:', filePath);
        }else if(error.name==='SyntaxError'){
            console.error('Invalid JSON format in file:', filePath);
        }else{
            console.error('Error reading the file:', error.message);
        }
        throw error;
    }
    
}

const writeJsonData = (data)=>{
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        console.log('Data successfully written to file.');
    } catch (error) {
        console.error('Error writing to file:', error.message);
        throw error;
    }
}

app.get('/',(req,res)=>{
    try {
        const data = readJsonData();
        res.json(data);
    } catch (error) {
        res.status(500).json({error:'Failed to retrieve data. Please try again later.'});
    }
});
app.get('/api/all',(req,res)=>{
    try {
        const data = readJsonData();
        res.json(data);
    } catch (error) {
        res.status(500).json({error:'Failed to retrieve data. Please try again later.'});
    }
});

app.post('/api/save',(req,res)=>{
    const { name, email } = req.body;
    const errors = [];

    if(!name){
        errors.push('Name is required');
    }
    if(!email  || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        errors.push('A valid email is required');
    }
    

    if(errors.length > 0){
        return res.status(400).json({errors});
    }

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

app.get('/api/id/:id',(req,res)=>{
    const id = parseInt(req.params.id, 10);

    try {
        const data = readJsonData();
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(404).json({ error: 'No data available.' });
        }

        const item = data.find((i)=> i.id==id);
        if(!item){
            return res.status(404).json({ error:'Data not found' });
        }
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



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});