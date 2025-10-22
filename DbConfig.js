const AWS = require('aws-sdk');

// Configure AWS region
AWS.config.update({ region: process.env.AWS_REGION || 'ap-northeast-2' }); // Replace with your desired region

const secretsManager = new AWS.SecretsManager();

const secretName = 'csm-app-db';

let cachedSecrets = null;

async function getSecret() {
    if (cachedSecrets) {
        return cachedSecrets;
    }
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        if ('SecretString' in data) {
            cachedSecrets = JSON.parse(data.SecretString);
            return cachedSecrets;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            cachedSecrets = JSON.parse(buff.toString('ascii'));
            return cachedSecrets;
        }
    } catch (err) {
        console.error("Error retrieving secret:", err);
        throw err;
    }
}

module.exports = getSecret;