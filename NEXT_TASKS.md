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

- [x] **P1 Module Information**
  - [x] **P1.1** Entités `Maison` + `Piece` (abstraite + 6 concrètes, SINGLE_TABLE) + `PieceRepository` + seed + `GET /api/info/pieces` (renvoie 6 pièces, vérifié)
  - [x] **P1.2** Entités `ObjetConnecte` (abstraite + 4 branches + ≥ 2 feuilles/branche) + seed = 12 objets
  - [x] **P1.3** `GET /api/info/objets?type=X&pieceId=Y&q=Z` (filtres combinables, vérifié)
  - [x] **P1.4** DTOs ObjetConnecte (évite sérialisation circulaire)
  - [x] **P1.5** React Router + layout (Header/Main/Footer)
  - [x] **P1.6** Page `/` publique
  - [x] **P1.7** Page `/recherche` avec 3 filtres + debounce

- [x] **P2 Module Visualisation**
  - [x] Register/Login flow (session HTTP)
  - [x] User profile (public/private fields)
  - [x] Search/consult objects + services (>=2 filtres)
  - [x] Points and level update per action (consult/search/update)

- [x] **P3 Module Gestion**
  - [x] CRUD connected objects
  - [x] Associate object to room
  - [x] Activate/deactivate + update object params
  - [x] Basic reports/statistics + history view

- [x] **P4 Quality & Delivery**
  - [x] Responsive pass (mobile/tablette/desktop) via media queries + layouts fluides
  - [x] WCAG basics (skip link, focus visible, rôles `status/alert`, structure sémantique)
  - [x] Demo script + report artifacts (`docs/DEMO_SCRIPT.md`, `docs/RAPPORT_ARTIFACTS.md`)

- [x] **P5 v4 alignement & comblement des écarts**
  - [x] Taxonomie UML complète côté frontend (20 types concrets → branche/service/icône/méthodes)
  - [x] Seuils de niveau alignés sur backend (0/3/10) — fini le faux niveau "Expert"
  - [x] HomePage : boutons "Alertes" et "Nouvel objet" wirés à la logique réelle
  - [x] HouseMap : rendu dynamique de toutes les pièces (6/6, plus de Toilettes manquantes)
  - [x] DetailDrawer : historique réel via `/api/gestion/historique`
  - [x] DetailDrawer : méthodes UML actionnables (ouvrir/fermer/demarrer/arreter/remplir/distribuer) câblées sur `PATCH /etat`
  - [x] Visualisation : filtre `pieceId` ajouté
  - [x] Gestion : carte "Répartition par service" (utilise `stats.parService`)
  - [x] Suppression des stubs `Tweak*` morts dans le shell
  - [x] Accessibilité : skip link, `aria-current`, `aria-label` sur boutons icône, `role/aria-live` sur statut backend

- [x] **P6 Contrôle réel + moteur d'automation** (headline)

  ### Backend
  - [x] **P6.1** `Ouvrant.position` mis à jour via `PUT /api/gestion/objets/{id}` (`applySpecific` couvre la mise à jour partielle).
  - [x] **P6.2** Entité `Scenario` (id, nom, description, icon, type, cron, condition, enabled, dateCreation, derniereExecution).
  - [x] **P6.3** Entité `ScenarioAction` (FK scenario, FK objet, targetEtat, targetPosition).
  - [x] **P6.4** `ScenarioRepository` + `ScenarioActionRepository`.
  - [x] **P6.5** `ScenarioService.run` (apply etat + position, log `SCENARIO_RUN` +1.5 pts).
  - [x] **P6.6** `@EnableScheduling` + `ScenarioScheduler.tick()` (`CronExpression.parse`, anti-doublon via `derniereExecution`, toggle `app.scheduler.enabled`).
  - [x] **P6.7** `ScenarioController` : list / get / create / update / patch enabled / delete / run.
  - [x] **P6.8** `GET /api/gestion/objets/{id}/donnees` (sparkline).
  - [x] **P6.9** `DataSeeder` : Bonjour ☀ / Bonsoir 🌙 / Cinéma 🎬 / Sécurité 🔒.
  - [x] **P6.10** `ActionType.SCENARIO_RUN` ajouté + cascade FK `ScenarioAction` géré dans `GestionController#deleteObjet`.

  ### Frontend
  - [x] **P6.11** Slider de position 0–100 % dans `DetailDrawer` (Ouvrant) + boutons Annuler/Appliquer.
  - [x] **P6.12** Sparkline SVG inline (path + gradient + dernier point) pour les Capteurs dans `DetailDrawer`.
  - [x] **P6.13** Boutons "Modes rapides" sur `HomePage` (4 scénarios prioritaires) avec toast et refresh.
  - [x] **P6.14** Section "Routines" dans `GestionPage` (composant `RoutinesSection`) : liste, switch enabled, run, edit, delete + composant `RoutineEditor` (presets cron + actions multi-objets).
  - [x] **P6.15** `SCENARIO_RUN` mis en avant dans le feed historique (fond `accent-soft`, icône bolt, titre = scénario).

- [x] **P9 Administration (scope réintégré)**

  ### Baseline livrée (commit `daa3200`)
  - [x] Backend: `AdminController` + guard `requireAdmin` + endpoints `/api/admin/**`.
  - [x] Modèle `DemandeSuppression` (`PENDING/APPROVED/REJECTED`) + repository.
  - [x] User flow: demande suppression objet (`POST /api/gestion/objets/{id}/demande-suppression`).
  - [x] User tracking: `GET /api/gestion/demandes-suppression/mes-demandes`.
  - [x] Front: onglet Administration visible admin only + écran de décision approve/reject + toggle admin users.
  - [x] Front Gestion: non-admin envoie une demande au lieu de suppression directe.
  - [x] Seeder: compte `admin@demo.local / demo1234`.

  ### À finir (hardening + UX)
  - [x] Empêcher la révocation du **dernier admin actif**.
  - [x] Filtres admin (pending only / approved / rejected) + compteur pending.
  - [x] Tri/recherche utilisateurs dans l'écran admin.
  - [ ] Journal admin plus lisible (motif décision + timestamp + auteur).

- [ ] **Gap list vs repo de référence `cyZ-tech2/SmartHouse`**
  - [x] Upload photo profil.
    - `POST /api/visualisation/profile/photo` (multipart, max 2MB)
    - stockage `photoDataUrl` en base + avatar image rendu front
  - [x] Validation email/token à l'inscription.
    - `POST /api/auth/register` retourne mode `verificationRequired` pour email non-demo
    - `POST /api/auth/verify-email` (email + code)
    - `POST /api/auth/resend-verification` (nouveau code)
    - login bloqué tant que l'email n'est pas vérifié
  - [x] Page maintenance dédiée (objets à réparer + action "marquer réparé").
    - endpoint `GET /api/gestion/maintenance`
    - action `POST /api/gestion/objets/{id}/maintenance/reparer`
    - panel maintenance visible dans Gestion (sévérité + raisons + bouton)
  - [x] Exports CSV (objets + consommation).
    - `GET /api/gestion/exports/objets`
    - `GET /api/gestion/exports/conso`
    - boutons front Gestion pour téléchargement direct
  - [x] Profil enrichi (champs perso additionnels).
    - `genre`, `dateNaissance`, `ville` dans `Utilisateur`
    - édition dans le formulaire profil Visualisation

- [ ] **P7 Automation réactive + énergie + notifications**

  **Objectif** : faire vivre la maison de façon réactive (mouvement → action) et fournir au prof un dashboard énergétique crédible.

  ### Backend
  - [ ] **P7.1** Étendre `Scenario.type` avec `CONDITIONAL` + champ `triggerObjetId` + `triggerEvent` (ex: `MOTION_DETECTED`, `BATTERY_LOW`, `TEMP_BELOW`).
  - [ ] **P7.2** `POST /api/gestion/objets/{id}/simulate-event` `{ event: "MOTION_DETECTED" }` : déclenche l'événement (pas de capteur réel, donc bouton démo). Le service trouve les scénarios CONDITIONAL liés et les exécute.
  - [ ] **P7.3** Évaluation contextuelle simple : un scénario CONDITIONAL peut avoir une `condition` libre (string → eval naïf : `night`, `day`, `temp<18`). Pour la démo : `night` = heure ∈ [20:00, 7:00].
  - [ ] **P7.4** `GET /api/gestion/energie` : agrège `consoEnergie` des `Appareil` actifs, retourne `{ consoTotaleKwh, parPiece[], topConsommateurs[] }`.

  ### Frontend
  - [ ] **P7.5** Bouton "Simuler événement" dans `DetailDrawer` pour `Camera` / `DetecteurMouvement` → POST `/simulate-event` → toast + scénario qui suit s'exécute visiblement.
  - [ ] **P7.6** Nouvelle carte "Consommation" sur HomePage (KPI live) + section détaillée dans Gestion (top 3 consommateurs, barre par pièce).
  - [ ] **P7.7** Slider de température cible pour Thermostat dans `DetailDrawer` (réutilise PUT `/objets/{id}` avec un nouveau champ `tempCible`).
  - [ ] **P7.8** Notifications toast in-app pour : scénario exécuté, batterie < 20%, mouvement détecté. Polling léger toutes les 30s sur un nouvel endpoint `GET /api/gestion/notifications?since=…`.

- [ ] **P8 Élargissement UML backend** (volume mécanique, faible créativité — à faire après P6/P7)
  - [ ] Ajouter les entités manquantes : `Fenetre`, `PorteGarage`, `Climatiseur`, `Alarme`, `DetecteurMouvement`, `MachineCafe`, `Enceinte`, `Aspirateur`, `Arrosage`, `Reveil`, `SecheLinge`, `LaveVaisselle`.
  - [ ] Étendre `GestionController#buildByType` pour chacun.
  - [ ] Aligner `GESTION_TYPE_OPTIONS` côté front avec la liste backend.
  - [ ] Endpoint `GET /api/gestion/historique?objetId={id}` pour filtrer côté serveur (le front filtre actuellement en mémoire).
  - [ ] Mettre à jour `DataSeeder` pour seeder au moins 1 instance de chaque nouveau type (utile pour tester les scénarios "Sécurité" avec une vraie Alarme).

- [x] **P10 Senior product pass — persistence, semantics, remote control** (livré 2026-04-26)
  - [x] **M1** H2 file mode (`./data/maison-db`), `ObjetConnecteDTO` exposant les valeurs vivantes type-spécifiques, `displayEtat`/`pillForObj` côté front, presets Volet
  - [x] **M2** LaveLinge : `ProgrammeLavage` enum (7 cycles), `tempLavage`/`vitesseEssorage`/`dateDebutCycle`/`dureeProgrammeMin`, `LaveLingeControl` UI avec lancer/arrêter cycle
  - [x] **M3** Television : `chaine`/`volume`/`source` (catalogue `SourceTV`), `TelevisionControl` UI avec télécommande
  - [x] **M4** Thermostat : `tempCible`/`mode` (catalogue `ModeThermostat`), `ThermostatControl` UI avec mesurée vs cible
  - [x] **M5** Pet feeders : `portionGrammes`/`derniereDistribution`/`prochaineDistribution`, `distribuer()`/`remplir()`, `PetFeederControl` UI, 4 scénarios programmés (Petit-déj, Dîner, Eau, Lessive Eco), `ScenarioService` étendu pour appeler `.distribuer()` quand un scénario cible un BesoinAnimal
  - [x] **M6** Historique de-noising : `PointsService.awardPoints` (silent) pour `CONSULT_PROFILE` et `SEARCH_OBJETS`

## Working rules
- Update this file after each meaningful step.
- Keep tasks small and testable.
- If blocked, add blocker + proposed workaround.
