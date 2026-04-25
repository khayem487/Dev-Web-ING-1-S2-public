# Artéfacts à joindre au rapport

## 1. Architecture et conception

- Diagramme UML (classes principales Maison/Pièce/ObjetConnecté/Utilisateur)
- Décisions techniques (JPA inheritance, endpoints, session auth)
- Découpage modules: Information / Visualisation / Gestion

## 2. Backend

- Liste des endpoints par module
- Captures réponses JSON (exemples de filtres)
- Explication modèle de données et seed

## 3. Frontend

- Captures des pages:
  - `/`
  - `/recherche`
  - `/visualisation`
  - `/gestion`
- Justification UX: filtres combinables, feedback utilisateur, navigation

## 4. Qualité

- Build backend (`mvn -DskipTests package`) et frontend (`npm run build`)
- Vérification responsive (mobile/tablette/desktop)
- Vérification accessibilité de base:
  - navigation clavier
  - skip link
  - focus visible
  - messages `role="status"` / `role="alert"`

## 5. Déploiement

- Repo GitHub (branche main)
- Configuration Render (`render.yaml`, `Dockerfile`)
- URLs de démo (front + API)

## 6. Limites et évolutions

- H2 en mémoire (prévu migration MySQL)
- Auth session simple (évolution JWT + hash mot de passe)
- Administration non incluse dans MVP
