const chai = require('chai'); // Import chai
const chaiHttp = require('chai-http'); // Import chai-http
const app = require('../../app'); // Import your app

// Configure chai to use chai-http
chai.use(chaiHttp);
const { expect } = chai;

describe('API Tests', () => {
    it('should return 200 for the root route', async () => {
        const res = await chai.request(app).get('/'); // Send a GET request to the root route
        expect(res).to.have.status(200); // Assert the status is 200
        expect(res.text).to.include('Welcome to the API'); // Assert response contains specific text
    });
});
