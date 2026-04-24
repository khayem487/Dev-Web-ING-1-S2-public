# NEXT_TASKS.md

## Priority Now (MVP path)

- [~] **P0 Setup baseline** (baseline validée; UI métier en cours)
  - [x] Backend skeleton runnable (Spring Boot Web + JPA + H2, `/api/health` endpoint, CORS)
  - [x] Frontend skeleton runnable (Vite proxy `/api` → `:8080`, App.jsx pings health)
  - [x] `.env.example` + `README.md` run instructions added
  - [x] Java 21 + Maven 3.9.9 toolchain bootstrapped with `scripts/dev-env.ps1` + `mvnw.cmd`
  - [x] Build checks passed: `./mvnw.cmd -DskipTests package` + `npm.cmd run build`
  - [x] User run-check live fait: backend + frontend OK, page affiche "Backend OK"
  - [ ] Install Tailwind CSS in frontend (deferred until baseline confirmed green)
  - [ ] Switch from H2 to MySQL and add initial schema/seed (after first entities exist)

- [~] **P1 Module Information**
  - [x] **P1.1** Entités `Maison` + `Piece` (abstraite + 6 concrètes, SINGLE_TABLE) + `PieceRepository` + seed + `GET /api/info/pieces` (renvoie 6 pièces, vérifié)
  - [x] **P1.2** Entités `ObjetConnecte` (abstraite + 4 branches + ≥ 2 feuilles/branche) + seed = 12 objets
  - [x] **P1.3** `GET /api/info/objets?type=X&pieceId=Y&q=Z` (filtres combinables, vérifié)
  - [x] **P1.4** DTOs ObjetConnecte (évite sérialisation circulaire)
  - [ ] **P1.5** React Router + layout (Header/Main/Footer)
  - [ ] **P1.6** Page `/` publique
  - [ ] **P1.7** Page `/recherche` avec 3 filtres + debounce

- [ ] **P2 Module Visualisation**
  - [ ] Register/Login flow
  - [ ] User profile (public/private fields)
  - [ ] Search/consult objects + services (>=2 filters)
  - [ ] Points and level update per action

- [ ] **P3 Module Gestion**
  - [ ] CRUD connected objects
  - [ ] Associate object to room
  - [ ] Activate/deactivate + update object params
  - [ ] Basic reports/statistics + history view

- [ ] **P4 Quality & Delivery**
  - [ ] Responsive checks (mobile/tablet/desktop)
  - [ ] WCAG basics (contrast, alt text, semantic tags)
  - [ ] Demo script + report artifacts

## Working rules
- Update this file after each meaningful step.
- Keep tasks small and testable.
- If blocked, add blocker + proposed workaround.
