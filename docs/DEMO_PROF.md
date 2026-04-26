# 🎓 Demo Prof — Maison Intelligente (script 8-10 min)

Ce guide est pensé pour une soutenance fluide, avec un scénario robuste même si le stress monte.

## 0) Préparation (2 min)

1. Backend:
   ```bash
   mvn spring-boot:run
   ```
2. Frontend:
   ```bash
   cd frontend
   npm.cmd run dev
   ```
3. Ouvrir:
   - Frontend: `http://localhost:5173`
   - Health API: `http://localhost:8080/api/health`

Comptes:
- `parent@demo.local / demo1234` (gestion)
- `admin@demo.local / demo1234` (administration)

---

## 1) Pitch d'ouverture (30s)

> « On a réalisé une maison connectée full-stack Spring Boot + React avec architecture modulaire: Information, Visualisation, Gestion, Administration. Je vais montrer un parcours utilisateur complet avec objets intelligents, scénarios, maintenance, puis gouvernance admin. »

---

## 2) Parcours démo recommandé

## Étape A — Information / Visualisation (1 min)

- Montrer la page d'accueil + carte de la maison.
- Ouvrir 1-2 objets pour prouver les détails typés.

## Étape B — Gestion des objets (3 min)

Connecté en `parent@demo.local`:

1. Ouvrir **Machine café**
   - Préparer un espresso
   - Montrer la baisse immédiate eau/café
   - Cliquer remplissage eau/café 100%
2. Ouvrir **Fontaine à eau** (ou distributeur)
   - Distribuer puis **Remplir 100%**
   - Montrer que la jauge est mise à jour immédiatement

## Étape C — Maintenance (2 min)

Dans Gestion → bloc Maintenance:
- Montrer les 3 niveaux de sévérité:
  - **CRITICAL**: Aspirateur robot
  - **HIGH**: Camera entrée (batterie faible)
  - **MEDIUM**: Lave-linge (révision périodique)
- Cliquer **Marquer réparé** sur un item pour expliquer le workflow de maintenance.

## Étape D — Scénarios domotiques (1-2 min)

- Exécuter un scénario manuel (ex: cinéma/sécurité).
- Montrer le feedback utilisateur (toast) + historique/état mis à jour.

## Étape E — Administration (1-2 min)

Se connecter en `admin@demo.local`:
- Liste utilisateurs
- Promotion/rétrogradation admin
- Demandes de suppression

---

## 3) Plan B (si souci en live)

- Si frontend freeze: hard refresh `Ctrl+F5`
- Si backend non joignable: relancer `mvn spring-boot:run`
- Vérifier API: `http://localhost:8080/api/health`
- Si npm bloqué PowerShell: toujours utiliser `npm.cmd ...`

---

## 4) Points forts à verbaliser

- Modèle objet polymorphe (UML -> types concrets)
- Contrôles UI spécialisés par type (pas juste un CRUD générique)
- Gestion maintenance priorisée (CRITICAL/HIGH/MEDIUM)
- Séparation rôles utilisateur (membre avancé vs admin)
- Expérience démo stable (seed cohérent + feedback immédiat UI)
