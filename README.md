 HEAD
# my-cloudeats-labs
=======
## Labs Completed
- [x] Lab 1.1: Development Environment Setup
- [x] Lab 2.1: Static Menu + First Docker Container ✅ NEW!
- [ ] Lab 2.2: Multi-Container Applications

## How to Run — CloudEats Menu

### With Docker (Recommended)
```bash
cd ~/cloudeats-app/frontend
docker build -t cloudeats-menu:v1.0 .
docker run -d -p 3000:80 --name menu cloudeats-menu:v1.0
# Access: http://[VM-IP]:3000/html/index.html
```

### Stop the Container
```bash
docker stop menu
docker rm menu
```
>>>>>>> ad2b75f (Lab 5.1 - Microservices split notes and screenshots)
