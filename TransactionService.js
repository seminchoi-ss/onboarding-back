const getDbSecrets = require('./DbConfig');
const mysql = require('mysql2');
const genericPool = require('generic-pool');
const { metrics } = require('./PrometheusConfig');

let dbcreds;
let pool;
let isPoolInitialized = false;

const initializeDbPool = (async () => {
    try {
        dbcreds = await getDbSecrets();
        console.log("Database credentials loaded.");
        
        // Hardcode dbname to 'webappdb'
        dbcreds.dbname = 'webappdb';

        // Factory for creating MySQL connections
        const factory = {
            create: async function() {
                return new Promise((resolve, reject) => {
                    const connection = mysql.createConnection({
                        host: dbcreds.host,
                        user: dbcreds.username,
                        password: dbcreds.password,
                        database: dbcreds.dbname
                    });

                    connection.connect((err) => {
                        if (err) {
                            console.error('Error creating connection:', err.message);
                            reject(err);
                        } else {
                            console.log('New connection created in pool');
                            // Update metric when connection is created
                            metrics.activeConnections.inc();
                            resolve(connection);
                        }
                    });
                });
            },
            destroy: async function(connection) {
                return new Promise((resolve) => {
                    connection.end(() => {
                        console.log('Connection destroyed');
                        // Update metric when connection is destroyed
                        metrics.activeConnections.dec();
                        resolve();
                    });
                });
            },
            validate: async function(connection) {
                return new Promise((resolve) => {
                    // Check if connection is still alive
                    connection.ping((err) => {
                        resolve(!err);
                    });
                });
            }
        };

        // Create pool with min/max configuration
        pool = genericPool.createPool(factory, {
            min: 3,                     // Minimum 3 connections
            max: 10,                    // Maximum 10 connections
            idleTimeoutMillis: 30000,   // Close idle connections after 30s
            acquireTimeoutMillis: 30000, // Timeout for acquiring connection
            evictionRunIntervalMillis: 10000, // Check for idle connections every 10s
            testOnBorrow: true          // Validate connection before use
        });

        // Track pool metrics
        pool.on('factoryCreateError', function(err) {
            console.error('Error creating connection:', err);
        });

        pool.on('factoryDestroyError', function(err) {
            console.error('Error destroying connection:', err);
        });

        // Log pool status on startup
        console.log(`Connection pool initialized: min=${pool.min}, max=${pool.max}`);
        isPoolInitialized = true;
    } catch (error) {
        console.error("Failed to initialize database pool:", error);
        process.exit(1);
    }
})();

// Helper function to execute queries
function executeQuery(sql, callback) {
    if (!isPoolInitialized) {
        // If pool is not yet initialized, queue the query or throw an error
        // For now, we'll throw an error to indicate a problem
        return callback(new Error("Database pool not initialized."), null);
    }

    let connection;

    pool.acquire()
        .then(conn => {
            connection = conn;

            connection.query(sql, (err, result) => {
                // Release connection back to pool
                pool.release(connection);

                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        })
        .catch(err => {
            console.error('Error acquiring connection:', err);
            callback(err, null);
        });
}

function addTransaction(amount, desc) {
    var sql = `INSERT INTO 
transactions
 (
	amount
, 	description
) VALUES ('${amount}','${desc}')`;
    executeQuery(sql, function(err, result) {
        if (err) throw err;
        console.log("Adding to the table should have worked");
    });
    return 200;
}

function getAllTransactions(callback) {
    var sql = "SELECT * FROM transactions";
    executeQuery(sql, function(err, result) {
        if (err) throw err;
        console.log("Getting all transactions...");
        return callback(result);
    });
}

function findTransactionById(id, callback) {
    var sql = `SELECT * FROM transactions WHERE id = ${id}`;
    executeQuery(sql, function(err, result) {
        if (err) throw err;
        console.log(`retrieving transactions with id ${id}`);
        return callback(result);
    });
}

function deleteAllTransactions(callback) {
    var sql = "DELETE FROM transactions";
    executeQuery(sql, function(err, result) {
        if (err) throw err;
        console.log("Deleting all transactions...");
        return callback(result);
    });
}

function deleteTransactionById(id, callback) {
    var sql = `DELETE FROM transactions WHERE id = ${id}`;
    executeQuery(sql, function(err, result) {
        if (err) throw err;
        console.log(`Deleting transactions with id ${id}`);
        return callback(result);
    });
}

module.exports = { addTransaction, getAllTransactions, deleteAllTransactions, findTransactionById, deleteTransactionById, initializeDbPool };
