# 🍽️ CloudEats Labs

A Docker-based, multi-service food-ordering application built as a hands-on learning project for **cloud-native architecture, containerization, microservices, API gateways, databases, caching, authentication, and monitoring**.

<p align="center">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white" alt="Node.js and Express" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" alt="MySQL 8.0" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" alt="MongoDB 7" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis 7" />
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="Frontend" />
</p>

---

## 📖 Overview

**CloudEats Labs** is a modular food-ordering platform designed to demonstrate how multiple services can work together inside a containerized environment.

The application separates responsibilities into independent services:

- 👤 **User Service** — user registration, authentication, and user-related operations
- 🍔 **Menu Service** — menu and category operations
- 🛒 **Order Service** — order processing and order-related data
- 🚪 **API Gateway** — central entry point for client API requests
- 🗄️ **MySQL** — relational data for users and menu information
- 🍃 **MongoDB** — document-based order data
- ⚡ **Redis** — caching and supporting fast-access application data
- 📊 **Prometheus** — monitoring/metrics infrastructure
- 🌐 **Frontend** — static HTML, CSS, and JavaScript assets

The project is intended for **learning and lab work**, not production deployment.

---

## 🏗️ Architecture

~~~text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │ HTML / CSS / JS     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     API Gateway     │
                         │     Port 8000       │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │  User Service  │ │  Menu Service  │ │ Order Service  │
        │   Port 3001    │ │   Port 3002    │ │   Port 3003    │
        └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
                │                  │                  │
                ▼                  ▼                  ▼
           ┌─────────┐        ┌─────────┐       ┌──────────┐
           │  MySQL  │        │  MySQL  │       │ MongoDB  │
           │   8.0   │        │   8.0   │       │    7     │
           └─────────┘        └─────────┘       └────┬─────┘
                                                     │
                                                     ▼
                                                ┌─────────┐
                                                │  Redis  │
                                                │    7    │
                                                └─────────┘

                         ┌─────────────────────┐
                         │     Prometheus      │
                         │      Metrics        │
                         └─────────────────────┘
~~~

All application services communicate over the Docker network **cloudeats-network**.

---

## 🧩 Services

| Component | Purpose | Port |
|---|---|---:|
| API Gateway | Central API entry point and routing | <code>8000</code> |
| User Service | User and authentication operations | <code>3001</code> |
| Menu Service | Menu and category operations | <code>3002</code> |
| Order Service | Order processing | <code>3003</code> |
| MySQL | User/menu relational data | Internal |
| MongoDB | Order document data | Internal |
| Redis | Caching/supporting fast data access | Internal |
| Prometheus | Metrics and monitoring | Internal |

Only the **API Gateway** is currently published to the host by Docker Compose.

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js
- REST APIs
- JWT-based authentication

### Databases & Caching
- MySQL 8.0
- MongoDB 7
- Redis 7

### Infrastructure
- Docker
- Docker Compose
- Docker networks
- Docker volumes
- Health checks
- Container restart policies
- Prometheus

---

## 📁 Project Structure

~~~text
my-cloudeats-labs/
├── .env.example
├── .github/
├── .gitignore
├── .husky/
├── README.md
├── backend/
│   ├── init.sql
│   ├── package.json
│   └── roles.sql
├── docker-compose.yml
├── docs/
├── frontend/
│   ├── Dockerfile
│   ├── css/
│   ├── html/
│   └── ...
├── monitor-metrics.js
├── package.json
├── package-lock.json
└── services/
    ├── api-gateway/
    ├── menu-service/
    ├── order-service/
    └── user-service/
~~~

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Docker Desktop
- Git

Check Docker:

~~~bash
docker --version
docker compose version
~~~

### 1. Clone the repository

~~~bash
git clone https://github.com/Ishowmeat67/my-cloudeats-labs.git
cd my-cloudeats-labs
~~~

### 2. Create the environment file

**Linux / macOS:**

~~~bash
cp .env.example .env
~~~

**Windows PowerShell:**

~~~powershell
Copy-Item .env.example .env
~~~

Then open <code>.env</code> and configure your credentials.

Example:

~~~env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=cloudeats_db
MYSQL_USER=cloudeats_user
MYSQL_PASSWORD=your_mysql_password

MONGO_USER=admin
MONGO_PASSWORD=your_mongo_password

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1h
~~~

> ⚠️ Never commit your real <code>.env</code> file or production secrets to GitHub.

### 3. Build and start the application

~~~bash
docker compose up --build
~~~

To run in the background:

~~~bash
docker compose up --build -d
~~~

### 4. Check running containers

~~~bash
docker compose ps
~~~

---

## 🔌 API Gateway

The main API entry point is:

~~~text
http://localhost:8000
~~~

Example menu request:

~~~bash
curl http://localhost:8000/api/menu/1
~~~

Example category request:

~~~bash
curl http://localhost:8000/api/menu/category/Drinks
~~~

Example user registration:

~~~bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123"
  }'
~~~

> API routes can change as the lab progresses. Check the individual service source code for the latest endpoints.

---

## 🌐 Frontend

The repository contains a static frontend under:

~~~text
frontend/
├── css/
├── html/
└── Dockerfile
~~~

The current root <code>docker-compose.yml</code> does **not** publish a frontend container on port <code>3000</code>. The main publicly exposed application entry point is the API Gateway on port <code>8000</code>.

If you want to serve the frontend separately, follow the instructions associated with the frontend Dockerfile or use a local static web server.

---

## 🧪 Labs & Learning Progress

- [x] Development environment setup
- [x] Static menu and first Docker container
- [x] Multi-container Docker applications
- [x] MySQL integration
- [x] MongoDB integration
- [x] Redis integration
- [x] Microservice separation
- [x] API Gateway routing
- [x] User authentication
- [x] Container health checks
- [x] Docker volumes and networks
- [x] Monitoring/metrics infrastructure

More lab milestones will be added as the project develops.

---

## 🐳 Useful Docker Commands

~~~bash
# Start
docker compose up

# Build and start
docker compose up --build

# Run in background
docker compose up -d

# Stop containers
docker compose down

# Stop and remove volumes
# WARNING: removes persistent database data
docker compose down -v

# View logs
docker compose logs -f

# View one service's logs
docker compose logs -f api-gateway

# Restart a service
docker compose restart api-gateway

# Check container status
docker compose ps
~~~

---

## 🔍 Troubleshooting

### Containers are not starting

~~~bash
docker compose ps
docker compose logs -f
~~~

### Database is not ready

The database-backed services use Docker health checks and dependencies. Give MySQL/MongoDB a little time to become healthy before testing the APIs.

### "Databases not ready, try again shortly"

Check:

~~~bash
docker compose ps
docker compose logs db
docker compose logs mongo
docker compose logs user-service
docker compose logs menu-service
docker compose logs order-service
~~~

### "Cannot GET" errors

Make sure you are calling the route exposed by the **API Gateway**:

~~~text
http://localhost:8000
~~~

rather than trying to access an internal service port directly from the host.

---

## 🔐 Security Notes

This project is intended for educational use.

For real deployments:

- Use strong randomly generated secrets.
- Do not commit <code>.env</code> files.
- Rotate JWT secrets when necessary.
- Use HTTPS/TLS.
- Restrict exposed ports.
- Use least-privilege database accounts.
- Add proper input validation and rate limiting.
- Store production secrets in a secrets manager.

---

## 🎯 Learning Goals

CloudEats Labs helps demonstrate:

- Containerization
- Docker Compose orchestration
- Microservice architecture
- API Gateway patterns
- Service-to-service communication
- Relational vs. document databases
- Caching with Redis
- Authentication with JWT
- Health checks
- Persistent Docker volumes
- Container networking
- Logging
- Monitoring and metrics

---

## 🔮 Future Improvements

- [ ] Dedicated frontend container in Docker Compose
- [ ] API documentation with Swagger/OpenAPI
- [ ] Automated integration tests
- [ ] CI/CD pipeline
- [ ] Better service-level health endpoints
- [ ] Expanded Prometheus dashboards
- [ ] Centralized logging
- [ ] Message broker/event-driven communication
- [ ] Kubernetes deployment
- [ ] Cloud deployment

---

## 📚 Repository

**GitHub:** https://github.com/Ishowmeat67/my-cloudeats-labs

---

## 📄 License

This project is intended for educational and lab use.

---

<div align="center">

**Built for learning cloud computing, containerization, and modern application architecture. 🚀**

</div>
