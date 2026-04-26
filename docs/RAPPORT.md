# Rapport — Projet Maison Intelligente (ING1 Dev Web)

**Auteur :** Khayem Ben Ghorbel  
**Formation :** ING1 2025–2026  
**Projet :** Maison Intelligente (Spring Boot + React)

---

## 1) Introduction

Ce projet a pour objectif de concevoir une application web de **maison connectée** respectant les contraintes du module Dev Web :
- architecture full-stack avec frameworks,
- persistance en base de données,
- séparation des responsabilités backend/frontend,
- fonctionnalités concrètes de consultation, gestion et administration.

Le système permet de visualiser et piloter des objets connectés (ouvrants, capteurs, appareils, besoins animaux), d’exécuter des scénarios domotiques, de suivre la maintenance et de gérer les utilisateurs côté administration.

---

## 2) Objectifs et périmètre

### Objectifs fonctionnels
1. **Information (public)** : consulter pièces et objets, rechercher avec filtres.
2. **Visualisation (membre)** : authentification, profil, consultation objets/services.
3. **Gestion (niveau avancé)** : CRUD objets, stats, historique, maintenance, scénarios.
4. **Administration (admin)** : gestion des utilisateurs, rôles admin, demandes de suppression.

### Contraintes du module
- Utilisation de frameworks backend + frontend.
- Base de données persistante.
- Recherche avec au moins deux filtres.
- Démo exploitable en soutenance.

---

## 3) Stack technique

- **Backend** : Java 21, Spring Boot 3.3, Spring Data JPA, Spring Validation
- **Frontend** : React 19 + Vite
- **Base de données** : H2 (dev rapide), compatibilité MySQL prévue
- **Déploiement** : Render (API Docker + frontend static)

---

## 4) Architecture générale

L’architecture suit une séparation claire :
- **backend/** : modèle métier, persistance, logique applicative, endpoints REST
- **frontend/** : interface utilisateur, navigation, appels API, expérience de démo

Le backend expose des routes REST groupées par domaine :
- `/api/info/*`
- `/api/auth/*`
- `/api/visualisation/*`
- `/api/gestion/*`
- `/api/admin/*`

Le frontend consomme ces routes via `fetchJson`, avec base configurable (`VITE_API_BASE_URL`) pour environnement local ou Render.

---

## 5) Modèle métier et données

Le domaine repose sur un modèle polymorphe :
- `Maison` → contient des `Piece`
- `ObjetConnecte` (abstrait) → branches : `Ouvrant`, `Capteur`, `Appareil`, `BesoinAnimal`
- `Utilisateur` (abstrait) → `ParentFamille`, `Enfant`, `VoisinVisiteur`

### Héritage JPA
Une stratégie `SINGLE_TABLE` est utilisée pour simplifier les lectures et accélérer les vues de démo multi-types.

### Seed de démonstration
Le seeder initialise :
- une maison + pièces,
- une flotte d’objets couvrant les types UML,
- des utilisateurs de test,
- des scénarios,
- des données réalistes pour maintenance/alertes.

Hotspots de maintenance garantis pour la soutenance :
- Aspirateur robot (CRITICAL),
- Caméra entrée (HIGH),
- Lave-linge (MEDIUM).

---

## 6) Implémentation backend

### 6.1 API de gestion
Le module Gestion fournit :
- CRUD objets connectés,
- activation/désactivation,
- statistiques,
- historique des actions,
- maintenance et marquage réparé,
- moteur de scénarios manuels/programmés/conditionnels.

### 6.2 Contrôles spécialisés par type
Des traitements spécifiques ont été implémentés selon les classes concrètes (ex. aspirateur, alarme, machine café, animaux), ce qui évite un CRUD générique pauvre.

### 6.3 Exemple notable : Machine à café
- sélection de boisson,
- consommation eau/café,
- remplissage réservoirs,
- compteur de préparations,
- validation des codes boisson.

### 6.4 Sécurité fonctionnelle
- séparation des droits utilisateur / avancé / admin,
- protections sur endpoints `/api/admin/**`,
- garde-fous métier (ex. gestion admins).

---

## 7) Implémentation frontend

### 7.1 UX globale
L’application propose :
- un shell de navigation clair,
- une page d’accueil orientée état global,
- des vues modulaires (recherche, visualisation, gestion, admin),
- des toasts de feedback.

### 7.2 Détail objet enrichi
Le drawer détail affiche des contrôles selon le type d’objet (pas une UI unique figée).

Exemples :
- aspirateur : cycle, retour base, statut,
- caméra : mode/résolution/enregistrement,
- besoins animaux : distribution/remplissage,
- machine café : boisson + jauges + actions.

### 7.3 Correctifs UX réalisés
Un correctif clé a été appliqué : mise à jour immédiate de l’UI après action (sans attendre un refetch complet), pour une expérience live plus fluide en soutenance.

---

## 8) Qualité, validation et démonstration

### Vérifications techniques
- Build backend : `mvn -DskipTests compile` ✅
- Build frontend : `npm.cmd run build` ✅
- Smoke test démo : `scripts/demo-smoke.ps1` ✅

### Artéfacts de soutenance
- `docs/DEMO_PROF.md` : script oral 8–10 min
- `docs/DEMO_SCRIPT.md` : parcours opérationnel
- `docs/RAPPORT_ARTIFACTS.md` : checklist pièces à joindre

---

## 9) Déploiement Render

Deux services sont configurés :
- **API** : `dev-web-ing1-api` (Docker, healthcheck `/api/health`)
- **Frontend** : `dev-web-ing1-web` (static Vite)

Points importants :
- la racine API (`/`) retourne 404 (normal sur API-only),
- le healthcheck attendu est `/api/health`,
- le frontend pointe vers l’API via `VITE_API_BASE_URL`.

---

## 10) Difficultés rencontrées et solutions

1. **Migrations/schéma legacy H2**
   - Problème : anciennes valeurs incompatibles sur enums.
   - Solution : durcissement modèle + ajustements de seed + validations.

2. **Synchronisation état UI / état backend**
   - Problème : sensation de non-mise-à-jour instantanée.
   - Solution : appliquer la réponse PUT directement dans le state local.

3. **Stabilité démo**
   - Problème : démo aléatoire selon données initiales.
   - Solution : hotspots maintenance forcés dans le seed pour reproductibilité.

---

## 11) Limites actuelles

- H2 utilisé en mode dev (MySQL prêt mais non imposé en local de démo).
- Couverture tests automatisés encore partielle (beaucoup de validation manuelle/smoke).
- UI riche mais perfectible sur certains flux edge-case.

---

## 12) Améliorations futures

- Passage complet MySQL + migration formalisée.
- Renforcement tests (intégration backend + tests UI E2E).
- Export avancé de rapports d’usage/maintenance.
- Monitoring applicatif et observabilité (logs structurés, métriques).

---

## 13) Conclusion

Le projet atteint l’objectif d’un produit de maison connectée **cohérent, démontrable et techniquement structuré**.  
Les modules Information, Visualisation, Gestion et Administration sont intégrés dans un même système, avec un vrai modèle métier et une UX orientée usage réel.  
Le résultat est exploitable en soutenance, tout en restant extensible pour une industrialisation progressive.

---

## Annexes (commandes utiles)

```bash
# backend
mvn spring-boot:run

# frontend
cd frontend
npm.cmd run dev

# build
mvn -DskipTests compile
cd frontend && npm.cmd run build

# smoke demo
powershell.exe -ExecutionPolicy Bypass -File scripts\demo-smoke.ps1
```
