const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
    register,
    prefix: 'app_tier_',
});

// Custom metrics
const httpRequestDuration = new client.Histogram({
    name: 'app_tier_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
    name: 'app_tier_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
    name: 'app_tier_active_connections',
    help: 'Number of active database connections'
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        const labels = {
            method: req.method,
            route: route,
            status_code: res.statusCode
        };

        httpRequestDuration.observe(labels, duration);
        httpRequestTotal.inc(labels);
    });

    next();
};

module.exports = {
    register,
    metricsMiddleware,
    metrics: {
        httpRequestDuration,
        httpRequestTotal,
        activeConnections
    }
};
