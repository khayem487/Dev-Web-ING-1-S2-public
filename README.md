# 🏠 Maison Intelligente — Dev Web ING1

Projet full-stack **Spring Boot + React/Vite** pour la soutenance ING1.

Objectif : démontrer une maison connectée moderne avec modules complets **Information / Visualisation / Gestion / Administration**, scénarios domotiques, maintenance et UX de présentation.

---

## ✅ Ce que le projet montre en démo

### 1) Information (public)
- Consultation des pièces
- Recherche d’objets avec filtres combinables

### 2) Visualisation (membre)
- Inscription / connexion
- Profil utilisateur (points, niveau)
- Vue objets + détails enrichis

### 3) Gestion (niveau avancé)
- CRUD objets connectés
- Activation / désactivation / réglages
- Historique d’actions + stats
- Maintenance (détection d’objets critiques + marquer réparé)
- Exports CSV

### 4) Administration (admin)
- Gestion des utilisateurs
- Promotion/rétrogradation admin
- Validation/refus des demandes de suppression

### 5) Smart-home / présentation produit
- Scénarios manuels / programmés / conditionnels
- Contrôles avancés par type (ex: TV, lave-linge, thermostat, alarme, capteurs)
- Couverture élargie des types d’objets pour coller à l’UML

---

## 🧱 Stack technique

- **Backend** : Java 21, Spring Boot 3.3, Spring Data JPA, Validation
- **Frontend** : React 19, Vite
- **DB** :
  - défaut dev: **H2** (zéro config)
  - option soutenance SQL réelle: **MySQL 8** (Docker)

---

## 📋 Prérequis

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker Desktop (optionnel, pour MySQL)

---

## 🚀 Lancement rapide (recommandé pour corriger vite et présenter)

## A. Mode simple (H2, zéro config)

### 1) Backend (à la racine du repo)

```bash
mvn spring-boot:run
```

API: `http://localhost:8080`  
Health: `http://localhost:8080/api/health`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Frontend: `http://localhost:5173`

> Sur PowerShell Windows si `npm` est bloqué par ExecutionPolicy, utiliser :
>
> ```bash
> npm.cmd install
> npm.cmd run dev -- --host 0.0.0.0 --port 5173
> ```

---

## B. Mode SQL réel (MySQL Docker) — conseillé pour soutenance

### 1) Démarrer MySQL

```bash
docker compose -f docker-compose.mysql.yml up -d
```

### 2) Lancer le backend avec le profil mysql

```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=mysql"
```

### 3) Lancer le frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## 👤 Comptes de démo

- `admin@demo.local / demo1234`
- `parent@demo.local / demo1234`
- `enfant@demo.local / demo1234`
- `voisin@demo.local / demo1234`

---

## 🧩 Types d’objets pris en charge (création/gestion)

- Ouvrants : `Porte`, `Volet`, `Fenetre`
- Capteurs : `Thermostat`, `Camera`, `DetecteurMouvement`
- Appareils : `Television`, `LaveLinge`, `Climatiseur`, `Aspirateur`
- Sécurité : `Alarme`
- Besoins animaux : `Nourriture`, `Eau`

---

## 🔌 Endpoints principaux

- Santé: `/api/health`
- Information: `/api/info/*`
- Auth: `/api/auth/*`
- Visualisation: `/api/visualisation/*`
- Gestion: `/api/gestion/*`
- Scénarios: `/api/gestion/scenarios/*`
- Admin: `/api/admin/*`

---

## ⚙️ Variables d’environnement utiles

### Backend datasource (optionnel)
- `APP_DATASOURCE_URL`
- `APP_DATASOURCE_DRIVER`
- `APP_DATASOURCE_USERNAME`
- `APP_DATASOURCE_PASSWORD`
- `APP_JPA_DIALECT`

### Flags applicatifs
- `APP_AUTH_EMAIL_VERIFICATION_ENABLED` (par défaut `true`)
- `APP_AUTH_EMAIL_VERIFICATION_DEBUG_TOKEN_ENABLED` (par défaut `false`, dev seulement)
- `APP_SCHEDULER_ENABLED` (par défaut `true`)

### SMTP (vérification email)
- `APP_MAIL_HOST`
- `APP_MAIL_PORT` (ex: `587`)
- `APP_MAIL_USERNAME`
- `APP_MAIL_PASSWORD`
- `APP_MAIL_SMTP_AUTH` (par défaut `true`)
- `APP_MAIL_SMTP_STARTTLS` (par défaut `true`)
- `APP_MAIL_FROM`
- `APP_MAIL_APP_NAME`

---

## 🧪 Vérification build avant soutenance

### Backend

```bash
mvn -DskipTests package
```

### Frontend

```bash
cd frontend
npm run build
```

Si PowerShell bloque `npm`, utiliser :

```bash
cd frontend
npm.cmd run build
```

---

## 📁 Structure du repo

- `backend/` : API Spring Boot + modèles JPA + services + controllers
- `frontend/` : app React (UI complète)
- `docker-compose.mysql.yml` : stack MySQL locale
- `render.yaml`, `Dockerfile` : base de déploiement

---

## 🎤 Parcours de démo conseillé (5-8 min)

1. Login `parent@demo.local`
2. Aller en **Gestion** → montrer création d’objet
3. Ouvrir un objet (drawer) → modifier état/paramètres
4. Lancer un scénario (ex: Cinéma / Sécurité)
5. Montrer l’historique + stats + maintenance
6. Se connecter en `admin@demo.local` → module Administration


---

## Git (commit/push)

```bash
git add -A
git commit -m "feat(p8): extend smart-home components and polish presentation README"
git push origin main
```

---

Projet prêt pour une soutenance orientée produit avec le **bon stack demandé (Spring Boot + React)**.
