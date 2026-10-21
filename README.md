# CloudEats Labs

A Docker-based, multi-service food ordering application built as a learning project for cloud-native architecture, container orchestration, and microservices design.

<p align="center">
  <img src="https://img.shields.io/badge/Stack-Docker%20%7C%20Node.js%20%7C%20Express-blue" alt="Tech Stack" />
  <img src="https://img.shields.io/badge/DB-MySQL%20%7C%20MongoDB%20%7C%20Redis-orange" alt="Databases" />
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-success" alt="Frontend" />
</p>

## Overview

CloudEats Labs is a hands-on project focused on building a food-ordering platform using a modular, containerized architecture. The application is split into a frontend, backend data services, and individual microservices with a central API gateway.

This repository is designed to demonstrate:

- Containerized application deployment with Docker
- Microservice communication patterns
- Database separation for different business domains
- API gateway routing
- Static frontend hosting via Dockerized web assets

## Architecture

```text
Client
  |
  v
Frontend (HTML/CSS/JS)
  |
  v
API Gateway
  |---------------------> User Service
  |---------------------> Menu Service
  |---------------------> Order Service
  |
  +--> MySQL (users + menu data)
  +--> MongoDB (orders)
  +--> Redis (caching / queue-ready layer)
Tech Stack
Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express
Databases:
MySQL for user and menu-related data
MongoDB for order data
Redis for lightweight caching and event-ready patterns
Infrastructure: Docker, Docker Compose
Project Structure
Text
my-cloudeats-labs/
├── .env.example
├── docker-compose.yml
├── README.md
├── package.json
├── backend/
│   ├── init.sql
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── css/
│   ├── html/
│   └── ...
├── services/
│   ├── api-gateway/
│   ├── menu-service/
│   ├── order-service/
│   └── user-service/
├── docs/
└── .github/
Labs Completed
 Lab 1.1: Development Environment Setup
 Lab 2.1: Static Menu + First Docker Container
 Lab 2.2: Multi-Container Applications
 Lab 3.x: Additional service and integration milestones
Getting Started
1. Clone the repository
bash
git clone https://github.com/Ishowmeat67/my-cloudeats-labs.git
cd my-cloudeats-labs
2. Set environment variables
Copy the sample environment file and update the values for your local setup:

bash
cp .env.example .env
Example values:

env
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=cloudeats_db
MYSQL_USER=cloudeats_user
MYSQL_PASSWORD=your_mysql_password
MONGO_USER=admin
MONGO_PASSWORD=your_mongo_password
3. Start the application
bash
docker compose up --build
This starts the containers for:

MySQL
MongoDB
Redis
User Service
Menu Service
Order Service
API Gateway
4. Access the app
API Gateway: http://localhost:8000
Frontend static menu: http://localhost:3000/html/index.html
Useful Docker Commands
bash
# Start containers
docker compose up --build

# Stop containers
docker compose down

# View logs
docker compose logs -f

# Restart a specific service
docker compose restart api-gateway
Notes
This project is primarily a learning repository for understanding cloud-native application patterns. It is intentionally modular so each service can evolve independently while still being coordinated through Docker Compose and a centralized API entry point.

License
This project is intended for educational and lab use.

Built for learning, containerization, and modern application design.

Code

If you want, I can also make it:
- more professional and enterprise-style
- more fun and colorful
- more concise for GitHub
- tailored specifically to your lab milestones and screenshots
