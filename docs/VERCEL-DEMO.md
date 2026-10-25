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

### PostgreSQL / Neon (profil versionné)

Sélectionner `SPRING_PROFILES_ACTIVE=vercel-demo,postgres` uniquement une fois la base créée et liée au projet. Le profil exige une vraie configuration PostgreSQL et échoue au démarrage si elle manque ; il ne retombe pas silencieusement sur H2.

- `DATABASE_URL` : URL poolée injectée par Neon. Le format `postgresql://...` est converti en JDBC ; utilisateur et mot de passe sont décodés puis conservés dans des propriétés séparées, sans identifiants dans l'URL JDBC ni les erreurs de validation.
- `DATABASE_URL_UNPOOLED` : URL directe utilisée par Flyway pour les migrations. À défaut, la même connexion que l'application est utilisée. `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING` sont aussi reconnus.
- Autre fournisseur : `APP_DATASOURCE_URL` (JDBC ou URI PostgreSQL), `APP_DATASOURCE_USERNAME`, `APP_DATASOURCE_PASSWORD`, et éventuellement `APP_MIGRATION_DATASOURCE_URL`. Les variables `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE` sont aussi reconnues. Les paramètres de l'URI sont prioritaires sur les variables de secours.
- TLS est obligatoire pour un hôte distant (`sslmode=require` par défaut ; `verify-ca` et `verify-full` sont conservés lorsqu'ils sont fournis). Le mode `require` chiffre la connexion ; la vérification du certificat et du nom d'hôte nécessite `verify-full` et la configuration de confiance du fournisseur. `sslmode=disable` n'est accepté que sur loopback pour les tests locaux. `channel_binding` est adapté au nom JDBC `channelBinding`.
- Hikari utilise au maximum **3 connexions**, zéro connexion minimale et aucun keep-alive. Les statements préparés côté serveur sont désactivés pour le pool en mode transaction. Il n'y a aucune requête de réveil périodique.

Flyway applique les migrations `db/migration/postgres/V1__application_schema.sql`, `V2__sessions_and_seed_marker.sql` et `V3__preserve_fractional_thermostat_targets.sql`, puis Hibernate **valide** le schéma. La V3 ajoute une colonne `REAL` propre aux thermostats et recopie leurs anciennes consignes entières : une consigne de 20,5 °C conserve désormais sa précision, tandis que les climatiseurs gardent leur colonne entière. Aucun `DROP`, reset ni `ddl-auto=update` n'est exécuté. `clean` et le baseline automatique sont désactivés. Une base déjà occupée sans historique Flyway est refusée ; son adoption exige une migration explicite et une sauvegarde préalable. Les modifications futures doivent ajouter un nouveau script versionné, sans modifier les migrations déjà appliquées.

Le jeu fictif est initialisé **une seule fois dans une transaction**, protégée contre les démarrages simultanés par un verrou transactionnel et un marqueur `app_seed`. Les modifications d'objets, réparations, batteries et scénarios sont donc conservées au redémarrage ; les anciennes routines de démo ne les réinitialisent plus. Les photos utilisent un champ PostgreSQL `TEXT` via JDBC, sans OID/large object dépendant d'une connexion.

Les sessions HTTP utilisent **Spring Session JDBC**, avec le cookie `JSESSIONID` HttpOnly, Secure et SameSite Lax. Une connexion encore valide (30 minutes d'inactivité) peut être retrouvée par une autre instance et après redémarrage. Les sessions expirées sont refusées à la lecture. Le nettoyage périodique est désactivé pour respecter le repos Neon ; les lignes expirées sont purgées au démarrage et à la consultation d'une session expirée. Les lignes abandonnées peuvent donc rester jusqu'au prochain démarrage. La session ne contient que l'identifiant utilisateur ; ses droits continuent d'être lus dans la base.

Le profil `vercel-demo` conserve les quatre comptes partagés protégés, l'inscription et les emails désactivés, le CORS limité à l'origine et le scheduler désactivé. PostgreSQL ne transforme pas ce conteneur en ordonnanceur continu. Un rollback applicatif conserve la base : les migrations déjà appliquées ne sont jamais annulées automatiquement.

### MySQL (profil historique)

Le profil MySQL existant peut être combiné avec la démo : `SPRING_PROFILES_ACTIVE=vercel-demo,mysql`. Configurer dans Vercel pour une **base MySQL externe existante** :

- `APP_DATASOURCE_URL` : URL JDBC MySQL du fournisseur, avec la connexion TLS qu'il impose.
- `APP_DATASOURCE_USERNAME` et `APP_DATASOURCE_PASSWORD` : identifiants de cette base.
- `APP_DATASOURCE_DRIVER=com.mysql.cj.jdbc.Driver` et `APP_JPA_DIALECT=org.hibernate.dialect.MySQLDialect` : nécessaires si seul `vercel-demo` est utilisé ; avec `vercel-demo,mysql`, le profil `mysql` fixe déjà le pilote et le dialecte adéquats.

Ne jamais placer les valeurs d'accès dans Git. Le pilote MySQL est déjà présent. Ne pas activer ce profil sans une base provisionnée et testée. Le champ health `storage=external-database` identifie le type d'URL configurée, et ne remplace pas une vérification de conservation des données après redéploiement. Aucune promesse de persistance ne repose uniquement sur cette métadonnée.

Cette livraison ne crée aucun compte de base de données, n'accepte aucune condition fournisseur et ne souscrit aucune offre. Une base externe doit être choisie/configurée avant d'annoncer la persistance publique. Les sessions des profils H2/MySQL restent locales ; seul le profil PostgreSQL active Spring Session JDBC.

## Vérification

`PublicDemoFlowTest` exerce le contexte Spring, la vraie base de test, les quatre rôles, les refus d'accès, une action d'objet, un scénario manuel et le CSV. `node scripts/verify-demo.mjs https://<alias>` refait le parcours contre le serveur public, vérifie le bundle React, crée/supprime son propre scénario et rétablit l'état de l'objet testé. Ce contrôle n'active ni vrai appareil ni email.

`PostgresEnvironmentPostProcessorTest` couvre les URL Neon/JDBC, l'extraction des identifiants, le TLS et les erreurs sans secrets. `PostgresRetentionTest` est un test **sur un vrai serveur PostgreSQL local**, activé explicitement avec :

```powershell
mvn test '-DsmartHome.test.postgresUrl=jdbc:postgresql://127.0.0.1:55432/smarthome_test?sslmode=disable' '-DsmartHome.test.postgresUser=<local-test-user>' '-DsmartHome.test.postgresPassword=<local-test-password>'
```

Utiliser une base locale de test jetable. Les tests refusent les hôtes distants et créent/suppriment uniquement leurs schémas aléatoires. Le parcours de conservation démarre deux fois l'application réelle avec Tomcat, conserve un compte fictif, une photo de plus de 64 Ko, les modifications d'un objet, une consigne de thermostat à 20,5 °C, la consigne entière du climatiseur et un scénario, réutilise le cookie connecté après redémarrage, puis vérifie les restrictions publiques, la déconnexion et l'expiration. Un autre test applique réellement V1/V2, insère d'anciennes consignes, puis vérifie leur copie lors du passage à V3. Tous les modes thermostat sont enregistrés sans conflit de contrainte SQL. Ces contrôles locaux ne remplacent pas le test de conservation après un vrai redéploiement Vercel avec Neon.
