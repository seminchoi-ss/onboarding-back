# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **app-tier** (backend/application layer) of a three-tier web architecture workshop project. It's a Node.js Express API that handles transaction management with MySQL database connectivity, Prometheus monitoring, and Swagger API documentation.

The application is designed to run on AWS EC2 instances within an Auto Scaling Group, serving as the middle tier between a web frontend (web-tier) and a MySQL database (data-tier).

## Architecture

### Core Components

- **index.js**: Main Express application server running on port 4000
  - Defines all REST API endpoints for transaction CRUD operations
  - Integrates Prometheus metrics middleware
  - Serves Swagger UI at `/api-docs`
  - Health check endpoint at `/health`

- **TransactionService.js**: Database service layer
  - Handles all MySQL database operations
  - Uses callback-based async pattern (not Promises)
  - **Security Note**: Contains SQL injection vulnerabilities - uses string interpolation instead of parameterized queries

- **DbConfig.js**: Database configuration module
  - Exports frozen object with DB connection parameters (DB_HOST, DB_USER, DB_PWD, DB_DATABASE)
  - Values are empty by default and must be populated before deployment

- **PrometheusConfig.js**: Monitoring configuration
  - Sets up Prometheus metrics collection with custom metrics:
    - `app_tier_http_request_duration_seconds`: HTTP request latency histogram
    - `app_tier_http_requests_total`: Total HTTP request counter
    - `app_tier_transactions_total`: Transaction operation counter
    - `app_tier_db_connection_errors_total`: Database error counter
    - `app_tier_active_connections`: Active database connection gauge
  - Exports middleware that automatically tracks request duration and counts

- **swagger.js**: Swagger/OpenAPI 3.0 configuration
  - Auto-generates API documentation from JSDoc comments in index.js

### Monitoring Stack

The project includes a complete Prometheus + Grafana monitoring setup via Docker Compose:

- **docker-compose.monitoring.yml**: Defines monitoring infrastructure
  - Prometheus on port 9090
  - Grafana on port 3000 (admin/admin123)
  - Node Exporter on port 9100 for system metrics

- **prometheus/prometheus.yml**: Prometheus scrape configuration
  - Uses EC2 service discovery to dynamically find app-tier instances
  - Configured for `ap-northeast-2` region
  - Targets EC2 instances tagged with `Name: on-bd-WAS` in running state
  - Scrapes `/metrics` endpoint on port 4000

- **grafana/dashboards/**: Pre-configured Grafana dashboards for visualizing app-tier metrics

## Common Commands

### Running the Application

```bash
# Install dependencies
npm install

# Start the server (runs on port 4000)
node index.js
```

**Important**: Before running, you must populate `DbConfig.js` with valid MySQL connection parameters.

### Running Monitoring Stack

```bash
# Start Prometheus + Grafana
docker-compose -f docker-compose.monitoring.yml up -d

# Stop monitoring stack
docker-compose -f docker-compose.monitoring.yml down

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

### API Access

- Application API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`
- Swagger UI: `http://localhost:4000/api-docs`
- Prometheus metrics: `http://localhost:4000/metrics`
- Prometheus UI: `http://localhost:9090` (when monitoring stack is running)
- Grafana UI: `http://localhost:3000` (when monitoring stack is running)

## API Endpoints

All endpoints are documented with OpenAPI/Swagger annotations in index.js:

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics endpoint
- `POST /transaction` - Add new transaction (body: `{amount: number, desc: string}`)
- `GET /transaction` - Get all transactions
- `GET /transaction/id` - Get transaction by ID (body: `{id: number}`)
- `DELETE /transaction` - Delete all transactions
- `DELETE /transaction/id` - Delete transaction by ID (body: `{id: number}`)

## Important Notes

### Database Connection

The MySQL connection is created once at module load time in TransactionService.js (line 4-9). This is a single persistent connection, not a connection pool. For production, consider using a connection pool.

### Security Vulnerabilities

**SQL Injection**: TransactionService.js uses string interpolation for SQL queries instead of parameterized queries. All database methods (addTransaction, findTransactionById, deleteTransactionById) are vulnerable. If fixing these:
  - Use `con.query()` with parameterized queries: `con.query('SELECT * FROM transactions WHERE id = ?', [id], callback)`
  - Apply to all methods in TransactionService.js

### Bug in index.js

Line 125 contains a bug: `if (success = 200)` should be `if (success === 200)` (assignment vs comparison). This causes the condition to always be truthy.

### Deployment Context

This app tier is designed to:
- Run on EC2 instances in AWS Auto Scaling Groups
- Connect to an RDS MySQL database in private subnets
- Be discovered automatically by Prometheus using EC2 service discovery
- Serve requests from a web tier (likely running Nginx, see ../web-tier/)

The prometheus.yml EC2 discovery configuration expects:
- AWS region: `ap-northeast-2`
- EC2 instance tag: `Name=on-bd-WAS`
- Instances in running state
- App listening on port 4000
