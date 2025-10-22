const AWS = require('aws-sdk');

// Configure AWS region
AWS.config.update({ region: process.env.AWS_REGION || 'ap-northeast-2' }); // Replace with your desired region

const secretsManager = new AWS.SecretsManager();

const secretName = 'csm-app-db';

async function getSecret() {
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        if ('SecretString' in data) {
            return JSON.parse(data.SecretString);
        } else {
            // For binary secrets, you would decode base64
            let buff = new Buffer(data.SecretBinary, 'base64');
            return JSON.parse(buff.toString('ascii'));
        }
    } catch (err) {
        console.error("Error retrieving secret:", err);
        throw err;
    }
}

let dbConfig = {};

// Immediately-invoked async function to load config
(async () => {
    try {
        const secrets = await getSecret();
        dbConfig.DB_HOST = secrets.host;
        dbConfig.DB_USER = secrets.username;
        dbConfig.DB_PWD = secrets.password;
        dbConfig.DB_DATABASE = 'webappdb';
    } catch (error) {
        console.error("Failed to load database configuration from Secrets Manager.", error);
        // Exit the process or handle the error appropriately
        process.exit(1);
    }
})();

module.exports = dbConfig;