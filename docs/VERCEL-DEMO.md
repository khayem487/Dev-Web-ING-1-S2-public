# Maison intelligente sur Vercel

Le conteneur construit le **frontend React original** puis l'intègre aux ressources statiques du **backend Spring Boot Java 21 original**. Les pages et `/api/*` utilisent le même domaine, ce qui conserve les cookies de session. Le port est fourni par `PORT` et les en-têtes du proxy HTTPS sont pris en charge.

Le profil `vercel-demo` est sélectionné par `Dockerfile.vercel` :

- Comptes et objets fictifs issus du vrai `DataSeeder`. Les quatre comptes `admin@demo.local`, `parent@demo.local`, `enfant@demo.local`, `voisin@demo.local` utilisent le mot de passe de test documenté `demo1234`.
- Base H2 **en mémoire et temporaire par instance**, tant qu'aucune base externe n'est configurée. Les mutations et les sessions ne sont pas garanties après redémarrage ou changement d'instance.
- Inscription, vérification et renvoi d'email désactivés dans cette démo : aucun SMTP n'est configuré et aucun email n'est envoyé. Le fonctionnement normal hors profil démo conserve les parcours d'origine.
- Console H2 désactivée. Cookies HTTPS, HttpOnly et SameSite Lax.
- API utilisable uniquement depuis la même origine dans ce profil. Les profils, photos, droits, approbations et suppressions des quatre comptes partagés sont protégés côté serveur afin de conserver l'accès des visiteurs suivants ; aucun endpoint existant ne permet de modifier leur email ou mot de passe.
- Les opérations sur les objets, contrôles de rôles, exports CSV, scénarios manuels et événements conditionnels utilisent les vrais contrôleurs et services. Les appareils sont des objets logiciels de démonstration, sans pilotage de matériel réel.
- Le scheduler continu est désactivé ; les scénarios programmés peuvent être inspectés et lancés manuellement, sans promesse d'exécution à heure fixe lorsque le conteneur dort.

## Brancher une base durable

Le profil MySQL existant peut être combiné avec la démo : `SPRING_PROFILES_ACTIVE=vercel-demo,mysql`. Configurer dans Vercel pour une **base MySQL externe existante** :

- `APP_DATASOURCE_URL` : URL JDBC MySQL du fournisseur, avec la connexion TLS qu'il impose.
- `APP_DATASOURCE_USERNAME` et `APP_DATASOURCE_PASSWORD` : identifiants de cette base.
- `APP_DATASOURCE_DRIVER=com.mysql.cj.jdbc.Driver` et `APP_JPA_DIALECT=org.hibernate.dialect.MySQLDialect` : nécessaires si seul `vercel-demo` est utilisé ; avec `vercel-demo,mysql`, le profil `mysql` fixe déjà le pilote et le dialecte adéquats.

Ne jamais placer les valeurs d'accès dans Git. Le pilote MySQL est déjà présent. Ne pas activer ce profil sans une base provisionnée et testée. Le champ health `storage=external-database` identifie le type d'URL configurée, et ne remplace pas une vérification de conservation des données après redéploiement. Aucune promesse de persistance ne repose uniquement sur cette métadonnée.

Cette livraison ne crée aucun compte de base de données, n'accepte aucune condition fournisseur et ne souscrit aucune offre. Une base externe doit être choisie/configurée avant d'annoncer la persistance. Les sessions HTTP restent actuellement locales ; conserver les comptes et objets en base ne rend pas automatiquement les sessions distribuées.

## Vérification

`PublicDemoFlowTest` exerce le contexte Spring, la vraie base de test, les quatre rôles, les refus d'accès, une action d'objet, un scénario manuel et le CSV. `node scripts/verify-demo.mjs https://<alias>` refait le parcours contre le serveur public, vérifie le bundle React, crée/supprime son propre scénario et rétablit l'état de l'objet testé. Ce contrôle n'active ni vrai appareil ni email.
