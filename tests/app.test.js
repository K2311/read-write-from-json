const request = require('supertest');
const app = require('../app');

describe('API Endpoints', () => {
    it('GET / - should return welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('Welcome to the API!');
    });

    it('GET /api/all - should return all data', async () => {
        const res = await request(app).get('/api/all');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/save - should save data and return it', async () => {
        const res = await request(app)
            .post('/api/save')
            .send({ name: 'John Doe', email: 'john.doe@example.com' });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('John Doe');
        expect(res.body.email).toBe('john.doe@example.com');
    });

    it('GET /api/id/:id - should return data for a given ID', async () => {
        const id = 1; 
        const res = await request(app).get(`/api/id/${id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id', id);
    });

    it('DELETE /api/id/:id - should delete data and return remaining data', async () => {
        const id = 1; 
        const res = await request(app).delete(`/api/id/${id}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('Rate Limiting - should block requests after limit is reached', async () => {
        for (let i = 0; i < 10; i++) {
            await request(app).get('/'); 
        }
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(429); 
        expect(res.body.message).toBe(
            'Too many requests, please try again later.'
        );
    });
});
