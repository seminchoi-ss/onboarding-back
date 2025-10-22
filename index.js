const transactionService = require('./TransactionService');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');
const fetch = require('node-fetch');
const { register, metricsMiddleware } = require('./PrometheusConfig');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Add Prometheus metrics middleware
app.use(metricsMiddleware);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ROUTES FOR OUR API
// =======================================================

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Returns a simple health check message
 *     responses:
 *       200:
 *         description: Successful health check
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "This is the health check"
 */
app.get('/health',(req,res)=>{
    res.json("This is the health check");
});

/**
 * @openapi
 * /metrics:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Prometheus metrics endpoint
 *     description: Returns Prometheus-formatted metrics for monitoring
 *     responses:
 *       200:
 *         description: Prometheus metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

/**
 * @openapi
 * /transaction:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Add a new transaction
 *     description: Creates a new transaction with amount and description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - desc
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Transaction amount
 *                 example: 100.50
 *               desc:
 *                 type: string
 *                 description: Transaction description
 *                 example: "Payment for services"
 *     responses:
 *       200:
 *         description: Transaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "added transaction successfully"
 *       500:
 *         description: Error adding transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
app.post('/transaction', (req,res)=>{
    var response = "";
    try{
        console.log(req.body);
        console.log(req.body.amount);
        console.log(req.body.desc);
        var success = transactionService.addTransaction(req.body.amount,req.body.desc);
        if (success = 200) res.json({ message: 'added transaction successfully'});
    }catch (err){
        res.json({ message: 'something went wrong', error : err.message});
    }
});

/**
 * @openapi
 * /transaction:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get all transactions
 *     description: Retrieves a list of all transactions
 *     responses:
 *       200:
 *         description: List of all transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       amount:
 *                         type: number
 *                         example: 100.50
 *                       description:
 *                         type: string
 *                         example: "Payment for services"
 *       500:
 *         description: Error retrieving transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
app.get('/transaction',(req,res)=>{
    try{
        var transactionList = [];
       transactionService.getAllTransactions(function (results) {
            console.log("we are in the call back:");
            for (const row of results) {
                transactionList.push({ "id": row.id, "amount": row.amount, "description": row.description });
            }
            console.log(transactionList);
            res.statusCode = 200;
            res.json({"result":transactionList});
        });
    }catch (err){
        res.json({message:"could not get all transactions",error: err.message});
    }
});

/**
 * @openapi
 * /transaction:
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Delete all transactions
 *     description: Removes all transactions from the database
 *     responses:
 *       200:
 *         description: All transactions deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "delete function execution finished."
 *       500:
 *         description: Error deleting transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
app.delete('/transaction',(req,res)=>{
    try{
        transactionService.deleteAllTransactions(function(result){
            res.statusCode = 200;
            res.json({message:"delete function execution finished."})
        })
    }catch (err){
        res.json({message: "Deleting all transactions may have failed.", error:err.message});
    }
});

/**
 * @openapi
 * /transaction/id:
 *   delete:
 *     tags:
 *       - Transactions
 *     summary: Delete a transaction by ID
 *     description: Removes a specific transaction from the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Transaction ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "transaction with id 1 seemingly deleted"
 *       500:
 *         description: Error deleting transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
app.delete('/transaction/id', (req,res)=>{
    try{
        //probably need to do some kind of parameter checking
        transactionService.deleteTransactionById(req.body.id, function(result){
            res.statusCode = 200;
            res.json({message: `transaction with id ${req.body.id} seemingly deleted`});
        })
    } catch (err){
        res.json({message:"error deleting transaction", error: err.message});
    }
});

/**
 * @openapi
 * /transaction/id:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get a transaction by ID
 *     description: Retrieves a specific transaction from the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Transaction ID
 *                 example: 1
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 amount:
 *                   type: number
 *                   example: 100.50
 *                 desc:
 *                   type: string
 *                   example: "Payment for services"
 *       500:
 *         description: Error retrieving transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
app.get('/transaction/id',(req,res)=>{
    //also probably do some kind of parameter checking here
    try{
        transactionService.findTransactionById(req.body.id,function(result){
            res.statusCode = 200;
            var id = result[0].id;
            var amt = result[0].amount;
            var desc= result[0].desc;
            res.json({"id":id,"amount":amt,"desc":desc});
        });

    }catch(err){
        res.json({message:"error retrieving transaction", error: err.message});
    }
});

async function startServer() {
  await transactionService.initializeDbPool; // Await the promise
  app.listen(port, () => {
    console.log(`AB3 backend app listening at http://localhost:${port}`)
  });
}

startServer();
