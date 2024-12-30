const request = require('supertest');
const app = require('../../app'); // Path to your app module

describe('Jest - API Endpoints', () => {
    it('GET / should return welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Welcome to the API!');
    });

    it('GET /api/all should return all data', async () => {
        const res = await request(app).get('/api/all');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
