const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AWS 3-Tier Application API',
      version: '1.0.0',
      description: 'Transaction management API for AWS 3-tier web architecture',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Transactions',
        description: 'Transaction management operations',
      },
      {
        name: 'Monitoring',
        description: 'Monitoring and metrics endpoints',
      },
    ],
  },
  apis: ['./index.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
