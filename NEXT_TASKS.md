# NEXT_TASKS.md

## Priority Now (MVP path)

- [~] **P0 Setup baseline** (build blockers removed; final local run-check pending)
  - [x] Backend skeleton runnable (Spring Boot Web + JPA + H2, `/api/health` endpoint, CORS)
  - [x] Frontend skeleton runnable (Vite proxy `/api` → `:8080`, App.jsx pings health)
  - [x] `.env.example` + `README.md` run instructions added
  - [x] Java 21 + Maven 3.9.9 toolchain bootstrapped with `scripts/dev-env.ps1` + `mvnw.cmd`
  - [x] Build checks passed: `./mvnw.cmd -DskipTests package` + `npm.cmd run build`
  - [ ] User verifies live run: backend + frontend dev servers → page shows "Backend OK"
  - [ ] Install Tailwind CSS in frontend (deferred until baseline confirmed green)
  - [ ] Switch from H2 to MySQL and add initial schema/seed (after first entities exist)

- [ ] **P1 Module Information**
  - [ ] Public home/free-tour page
  - [ ] Public info search with **at least 2 filters**

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
