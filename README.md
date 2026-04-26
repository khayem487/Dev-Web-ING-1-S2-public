# Maison Intelligente - Dev Web ING1

Plateforme smart-home complete (backend Spring Boot + frontend React/Vite) pour la soutenance ING1.

## Fonctionnalites

- Module **Information** (public): pieces, objets, recherche multi-filtres.
- Module **Visualisation** (membre): inscription/connexion, profil, points/niveaux, services.
- Module **Gestion** (niveau avance): CRUD objets, etat, parametres, maintenance, exports CSV.
- Module **Administration** (admin): gestion des demandes de suppression, gestion des roles admin.
- **Scenarios domotiques** manuels/programmes (cron) + execution rapide depuis l'UI.
- Couverture etendue des types d'objets (ouvrants, capteurs, appareils, besoins animaux).

## Stack technique

- Backend: Java 21, Spring Boot 3.3, Spring Data JPA, Validation
- Frontend: React 19, Vite, CSS custom
- Base de donnees:
  - Defaut: H2 fichier (`./data/maison-db`)
  - Option production locale: MySQL 8 via Docker

## Prerequis

- Java 21
- Maven 3.9+
- Node.js 20+ et npm
- Docker (optionnel, pour MySQL)

## Demarrage rapide (H2, zero config)

### 1) Backend

```bash
mvn spring-boot:run
```

Backend: [http://localhost:8080](http://localhost:8080)  
Health: [http://localhost:8080/api/health](http://localhost:8080/api/health)

### 2) Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Frontend: [http://localhost:5173](http://localhost:5173)

## Demarrage MySQL (recommande pour demo "base SQL reelle")

### 1) Lancer MySQL

```bash
docker compose -f docker-compose.mysql.yml up -d
```

### 2) Lancer le backend avec profil mysql

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

### 3) Lancer le frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Comptes de demo

- `admin@demo.local / demo1234`
- `parent@demo.local / demo1234`
- `enfant@demo.local / demo1234`
- `voisin@demo.local / demo1234`

## Build de verification

### Backend

```bash
mvn -DskipTests package
```

### Frontend

```bash
cd frontend
npm run build
```

## Variables d'environnement importantes

Le backend lit la config DB via `APP_*`:

- `APP_DATASOURCE_URL`
- `APP_DATASOURCE_DRIVER`
- `APP_DATASOURCE_USERNAME`
- `APP_DATASOURCE_PASSWORD`
- `APP_JPA_DIALECT`

Autres flags:

- `APP_AUTH_EMAIL_VERIFICATION_ENABLED` (`false` par defaut en dev)
- `APP_SCHEDULER_ENABLED` (`true` par defaut)

## Structure du repo

- `backend/` : API Spring Boot, modeles JPA, services, controllers
- `frontend/` : application React
- `docs/` : script de demo et artefacts rapport
- `docker-compose.mysql.yml` : stack MySQL locale
- `render.yaml` + `Dockerfile` : deploiement

## Endpoints principaux

- Public: `/api/health`, `/api/info/*`
- Auth: `/api/auth/*`
- Visualisation: `/api/visualisation/*`
- Gestion: `/api/gestion/*`, `/api/gestion/scenarios/*`
- Admin: `/api/admin/*`

## Commandes Git (commit + push)

```bash
git add -A
git commit -m "feat: prepare project for presentation"
git push origin main
```

## Etat actuel

Le projet est prepare pour la presentation avec:
- stack conforme (Spring Boot + React)
- base SQL fonctionnelle
- scenarios + admin + maintenance + exports
- README de run/demo centralise
