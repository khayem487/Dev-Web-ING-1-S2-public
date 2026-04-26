# Dev Web ING1 — Maison Intelligente

Smart-home project (Spring Boot + React/Vite) with modules:
- Information
- Visualisation
- Gestion
- Administration

---

## Stack
- Backend: Java 21, Spring Boot, Spring Data JPA
- Frontend: React + Vite
- DB:
  - default local: H2 file (`./data/maison-db`)
  - production-like local: MySQL 8 (Docker)

---

## Quick start (recommended = MySQL)

### 1) Start MySQL (Docker)
```bash
docker compose -f docker-compose.mysql.yml up -d
```

MySQL defaults in compose:
- host: `127.0.0.1`
- port: `3307`
- db: `maison_intelligente`
- user: `maison`
- pass: `maison123`

### 2) Start backend on MySQL profile
```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

Backend URL: `http://localhost:8080`
Health: `http://localhost:8080/api/health`

### 3) Start frontend
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Frontend URL: `http://localhost:5173`

---

## Demo accounts
- `admin@demo.local / demo1234`
- `parent@demo.local / demo1234`
- `enfant@demo.local / demo1234`
- `voisin@demo.local / demo1234`

---

## DB configuration env vars
The app now reads DB config from `APP_*` vars (to avoid broken empty `SPRING_DATASOURCE_URL` env side effects):

- `APP_DATASOURCE_URL`
- `APP_DATASOURCE_DRIVER`
- `APP_DATASOURCE_USERNAME`
- `APP_DATASOURCE_PASSWORD`
- `APP_JPA_DIALECT`

If not set, fallback is H2 file.

---

## Useful commands

Build backend:
```bash
mvn -DskipTests package
```

Build frontend:
```bash
cd frontend
npm run build
```

Stop MySQL stack:
```bash
docker compose -f docker-compose.mysql.yml down
```
