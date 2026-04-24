# Maison Intelligente — Projet Dev Web ING1 (CY Tech)

Application web trois modules (Information / Visualisation / Gestion) pour une maison connectée.
Le module **Administration est volontairement exclu** (correction du prof).

> Documents de référence dans le repo : [PLAN.md](PLAN.md) (plan d'exécution MVP + Gantt), [CONTEXTE_PROJET_DEV_WEB.md](CONTEXTE_PROJET_DEV_WEB.md), [DECISIONS.md](DECISIONS.md), [UML_Maison.html](UML_Maison.html), [NEXT_TASKS.md](NEXT_TASKS.md), [WORKLOG.md](WORKLOG.md).

## Stack

| Couche   | Techno                          |
|----------|---------------------------------|
| Frontend | React 19 + Vite                 |
| Backend  | Spring Boot 3.3.2 (Java 21)     |
| BDD dev  | **H2 en mémoire** (baseline)    |
| BDD cible| MySQL (à activer plus tard)     |
| ORM      | JPA / Hibernate                 |

## Arborescence

```
.
├── pom.xml                 # Maven (sources pointées vers backend/src)
├── backend/
│   └── src/main/java/com/projdevweb/
│       ├── MaisonConnectee.java     # @SpringBootApplication
│       ├── config/WebConfig.java    # CORS pour le front Vite
│       └── controller/HealthController.java
├── frontend/
│   ├── package.json
│   ├── vite.config.js      # proxy /api -> http://localhost:8080
│   └── src/
│       ├── App.jsx         # Router + pages /, /recherche, /visualisation
│       ├── App.css         # styles MVP
│       └── index.jsx       # BrowserRouter mount
└── .env.example
```

## Prérequis

- Java 21
- Maven 3.9+
- Node.js 20+ et npm

### Déblocage rapide Windows (si Java/Maven ne passent pas)

Depuis la racine du repo :

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\dev-env.ps1
```

Puis lancer Maven via le wrapper local :

```powershell
.\mvnw.cmd spring-boot:run
```

> Le script force `JAVA_HOME`/`MAVEN_HOME` vers une config locale compatible (JDK 21 + Maven 3.9.9).

## Lancer l'application (dev)

Dans deux terminaux séparés depuis la racine du repo :

**Backend** (H2 en mémoire, port 8080)
```bash
mvn spring-boot:run
```
_ou sous Windows (recommandé pour éviter les soucis PATH)_
```powershell
.\mvnw.cmd spring-boot:run
```
- Health check : http://localhost:8080/api/health
- Console H2 : http://localhost:8080/h2-console
  (JDBC URL: `jdbc:h2:mem:maison`, user `sa`, mot de passe vide)

**Frontend** (Vite, port 5173)
```bash
cd frontend
npm install
npm run dev
```
_ou sous PowerShell Windows si policy bloque `npm.ps1`_
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Ouvrez http://localhost:5173 :
- `/` affiche l'accueil public + état backend + KPIs.
- `/recherche` affiche la recherche d'objets (publique) avec filtres combinables.
- `/visualisation` expose le module privé (register/login, profil, services, recherche filtrée, points/niveau).
- `/gestion` expose le CRUD objets (création, modification, association pièce, activation/désactivation, suppression), stats et historique.

## Tests manuels rapides

- `curl http://localhost:8080/api/health` doit renvoyer `{"status":"UP",...}`.
- `curl http://localhost:8080/api/info/pieces` doit renvoyer 6 pièces seedées.
- `curl "http://localhost:8080/api/info/objets?type=Capteur&pieceId=1"` doit filtrer les objets.
- `POST /api/auth/register` puis `GET /api/visualisation/profile` (avec cookie session) doit répondre 200.
- `GET /api/visualisation/objets?service=Surveillance&etat=ACTIF&pieceId=1` doit retourner un sous-ensemble.
- `POST /api/gestion/objets` puis `PUT/PATCH/DELETE /api/gestion/objets/{id}` doivent fonctionner en session authentifiée.
- `GET /api/gestion/stats` et `GET /api/gestion/historique` doivent remonter stats + traces d'actions.
- Ouvrir http://localhost:5173 et vérifier `/visualisation` puis `/gestion`.

## Activer MySQL plus tard

1. Décommenter la dépendance `mysql-connector-j` dans [pom.xml](pom.xml).
2. Dans [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties) :
   commenter le bloc H2 et décommenter le bloc MySQL.
3. Créer la base : `CREATE DATABASE maison_intelligente;`
4. Adapter `DB_USERNAME` / `DB_PASSWORD` via `.env` (voir [.env.example](.env.example)).

## Règles de collaboration

Suivi du projet :
- [SYNC_CONTEXT.md](SYNC_CONTEXT.md) — protocole
- [WORKLOG.md](WORKLOG.md) — journal chronologique (quoi changé / fichiers / bloquants / next)
- [NEXT_TASKS.md](NEXT_TASKS.md) — backlog MVP
- [DECISIONS.md](DECISIONS.md) — choix validés

Jamais de secrets/tokens dans le repo.
