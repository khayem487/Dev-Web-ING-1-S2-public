# Script de démonstration (8-10 minutes)

## 0) Préparation (avant passage)

- Backend: `mvn spring-boot:run`
- Frontend: `cd frontend && npm run dev`
- Ouvrir:
  - `http://localhost:5173/`
  - `http://localhost:5173/recherche`
  - `http://localhost:5173/visualisation`
  - `http://localhost:5173/gestion`

---

## 1) Introduction (30s)

- Contexte: projet Maison Intelligente, 3 modules fonctionnels implémentés.
- Rappel scope: Information, Visualisation, Gestion (Administration hors MVP).

## 2) Module Information (2 min)

- Page `/` : état backend + indicateurs.
- Page `/recherche` : filtres combinables (`type`, `pièce`, texte) + résultats.
- Montrer qu’un filtrage réduit bien la liste.

## 3) Module Visualisation (3 min)

- Sur `/visualisation` :
  - créer un compte ou se connecter,
  - voir profil utilisateur,
  - modifier champs publics/privés,
  - constater l’évolution points/niveau.
- Montrer les services et la recherche privée multi-critères.

## 4) Module Gestion (3 min)

- Sur `/gestion` :
  - créer un objet connecté,
  - modifier ses paramètres,
  - activer/désactiver,
  - supprimer.
- Montrer stats globales + historique des actions.

## 5) Qualité technique (1 min)

- API REST structurée (`/api/info`, `/api/visualisation`, `/api/gestion`).
- Persistance JPA/H2 + seed de données.
- UI responsive + améliorations accessibilité de base.

## 6) Conclusion (30s)

- MVP complet sur 3 modules.
- Pistes post-MVP: MySQL, sécurité renforcée, module Administration.
