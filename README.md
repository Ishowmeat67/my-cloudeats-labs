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
