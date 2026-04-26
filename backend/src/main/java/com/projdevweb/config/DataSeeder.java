package com.projdevweb.config;

import com.projdevweb.model.ActionType;
import com.projdevweb.model.Appareil;
import com.projdevweb.model.Camera;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Chambre;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Cuisine;
import com.projdevweb.model.DonneeCapteur;
import com.projdevweb.model.Alarme;
import com.projdevweb.model.Arrosage;
import com.projdevweb.model.Aspirateur;
import com.projdevweb.model.Climatiseur;
import com.projdevweb.model.DetecteurMouvement;
import com.projdevweb.model.Eau;
import com.projdevweb.model.Enceinte;
import com.projdevweb.model.Fenetre;
import com.projdevweb.model.Enfant;
import com.projdevweb.model.Etat;
import com.projdevweb.model.Garage;
import com.projdevweb.model.HistoriqueAction;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.LaveVaisselle;
import com.projdevweb.model.Maison;
import com.projdevweb.model.MachineCafe;
import com.projdevweb.model.Nourriture;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.ParentFamille;
import com.projdevweb.model.Piece;
import com.projdevweb.model.Porte;
import com.projdevweb.model.PorteGarage;
import com.projdevweb.model.Reveil;
import com.projdevweb.model.SalleDeBain;
import com.projdevweb.model.Salon;
import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioAction;
import com.projdevweb.model.ScenarioTriggerEvent;
import com.projdevweb.model.ScenarioType;
import com.projdevweb.model.SecheLinge;
import com.projdevweb.model.Television;
import com.projdevweb.model.Thermostat;
import com.projdevweb.model.Toilettes;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.model.VoisinVisiteur;
import com.projdevweb.model.Volet;
import com.projdevweb.repository.DonneeCapteurRepository;
import com.projdevweb.repository.HistoriqueActionRepository;
import com.projdevweb.repository.MaisonRepository;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.PieceRepository;
import com.projdevweb.repository.ScenarioRepository;
import com.projdevweb.repository.UtilisateurRepository;
import com.projdevweb.service.PasswordService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Seeder dev/démo. Idempotent : ne ré-insère rien si la table contient déjà des données.
 *
 * <p>Insère :
 * <ul>
 *   <li>1 maison + 6 pièces</li>
 *   <li>12 objets répartis sur 4 branches</li>
 *   <li>3 utilisateurs (1 par sous-type) avec mots de passe BCrypt
 *       — le ParentFamille démarre à 12 pts (niveau AVANCE) pour démo Gestion</li>
 *   <li>~50 mesures DonneeCapteur sur 3 capteurs sur 7 jours</li>
 *   <li>quelques entrées d'historique (LOGIN + actions de démo)</li>
 * </ul>
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_PASSWORD = "demo1234";

    private final MaisonRepository maisonRepository;
    private final PieceRepository pieceRepository;
    private final ObjetConnecteRepository objetConnecteRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DonneeCapteurRepository donneeCapteurRepository;
    private final HistoriqueActionRepository historiqueActionRepository;
    private final ScenarioRepository scenarioRepository;
    private final PasswordService passwordService;

    public DataSeeder(MaisonRepository maisonRepository,
                      PieceRepository pieceRepository,
                      ObjetConnecteRepository objetConnecteRepository,
                      UtilisateurRepository utilisateurRepository,
                      DonneeCapteurRepository donneeCapteurRepository,
                      HistoriqueActionRepository historiqueActionRepository,
                      ScenarioRepository scenarioRepository,
                      PasswordService passwordService) {
        this.maisonRepository = maisonRepository;
        this.pieceRepository = pieceRepository;
        this.objetConnecteRepository = objetConnecteRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.donneeCapteurRepository = donneeCapteurRepository;
        this.historiqueActionRepository = historiqueActionRepository;
        this.scenarioRepository = scenarioRepository;
        this.passwordService = passwordService;
    }

    @Override
    public void run(String... args) {
        seedMaisonEtPieces();
        seedObjets();
        seedUtilisateurs();
        seedDonneesCapteur();
        seedHistorique();
        seedScenarios();
    }

    // ----------------------------------------------------------- maison + pièces

    private void seedMaisonEtPieces() {
        if (maisonRepository.count() > 0) {
            return;
        }
        Maison maison = maisonRepository.save(new Maison("Maison de démo"));
        pieceRepository.saveAll(List.of(
                new Salon("Salon", maison),
                new Chambre("Chambre parentale", maison),
                new Cuisine("Cuisine", maison),
                new SalleDeBain("Salle de bain", maison),
                new Toilettes("Toilettes", maison),
                new Garage("Garage", maison)
        ));
    }

    // ------------------------------------------------------------------- objets

        private void seedObjets() {
        Map<String, Piece> pieceByName = pieceRepository.findAll().stream()
                .collect(Collectors.toMap(Piece::getNom, Function.identity()));

        List<ObjetConnecte> existing = objetConnecteRepository.findAll();
        Map<String, Long> existingByType = existing.stream()
                .collect(Collectors.groupingBy(o -> o.getClass().getSimpleName(), Collectors.counting()));
        List<ObjetConnecte> toCreate = new ArrayList<>();

        if (!existingByType.containsKey("Porte")) {
            toCreate.add(new Porte("Porte d'entree", "Somfy", Etat.ACTIF, Connectivite.WIFI, 98f, getPiece(pieceByName, "Salon"), 100));
        }
        if (!existingByType.containsKey("PorteGarage")) {
            toCreate.add(new PorteGarage("Porte garage", "Nice", Etat.INACTIF, Connectivite.WIFI, 55f, getPiece(pieceByName, "Garage"), 0));
        }
        if (!existingByType.containsKey("Volet")) {
            toCreate.add(new Volet("Volet baie vitree", "Somfy", Etat.ACTIF, Connectivite.WIFI, 81f, getPiece(pieceByName, "Salon"), 65));
        }
        if (!existingByType.containsKey("Fenetre")) {
            toCreate.add(new Fenetre("Fenetre baie vitree", "Velux", Etat.ACTIF, Connectivite.WIFI, 92f, getPiece(pieceByName, "Salon"), 0));
        }

        if (!existingByType.containsKey("Thermostat")) {
            Thermostat thermoSalon = new Thermostat("Thermostat salon", "Netatmo", Etat.ACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salon"), "Zone jour");
            thermoSalon.setTempCible(21.0f);
            thermoSalon.setMode(Thermostat.ModeThermostat.AUTO.name());
            toCreate.add(thermoSalon);
        }
        if (!existingByType.containsKey("Camera")) {
            toCreate.add(new Camera("Camera entree", "Arlo", Etat.ACTIF, Connectivite.WIFI, 89f, getPiece(pieceByName, "Salon"), "Entree"));
        }
        if (!existingByType.containsKey("DetecteurMouvement")) {
            toCreate.add(new DetecteurMouvement("Detecteur presence salon", "Bosch", Etat.ACTIF, Connectivite.BLUETOOTH, 85f, getPiece(pieceByName, "Salon"), "Securite"));
        }
        if (!existingByType.containsKey("Climatiseur")) {
            Climatiseur climChambre = new Climatiseur("Climatisation chambre", "Daikin", Etat.INACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Chambre parentale"));
            climChambre.setModeClim(Climatiseur.ModeClim.AUTO.name());
            climChambre.setTempCible(20);
            climChambre.setConsoEnergie(2.4f);
            toCreate.add(climChambre);
        }
        if (!existingByType.containsKey("Alarme")) {
            Alarme alarme = new Alarme("Systeme d'alarme", "Somfy", Etat.INACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salon"));
            alarme.setStatut(Alarme.StatutAlarme.DESARMEE);
            toCreate.add(alarme);
        }

        if (!existingByType.containsKey("Television")) {
            Television tv = new Television("TV salon", "Samsung", Etat.ACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salon"), "Direct");
            tv.setChaine(7);
            tv.setVolume(28);
            tv.setSource(Television.SourceTV.LIVE_TV.name());
            tv.setConsoEnergie(0.18f);
            toCreate.add(tv);
        }
        if (!existingByType.containsKey("LaveLinge")) {
            LaveLinge laveLinge = new LaveLinge("Lave-linge", "LG", Etat.INACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salle de bain"), "Eco 40");
            laveLinge.setProgramme(LaveLinge.ProgrammeLavage.ECO_40.name());
            laveLinge.setTempLavage(LaveLinge.ProgrammeLavage.ECO_40.getTempSuggeree());
            laveLinge.setVitesseEssorage(LaveLinge.ProgrammeLavage.ECO_40.getEssorageSuggere());
            laveLinge.setConsoEnergie(1.1f);
            toCreate.add(laveLinge);
        }
        if (!existingByType.containsKey("SecheLinge")) {
            SecheLinge secheLinge = new SecheLinge("Seche-linge", "Bosch", Etat.INACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salle de bain"));
            secheLinge.setConsoEnergie(1.6f);
            toCreate.add(secheLinge);
        }
        if (!existingByType.containsKey("LaveVaisselle")) {
            LaveVaisselle laveVaisselle = new LaveVaisselle("Lave-vaisselle", "Whirlpool", Etat.INACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Cuisine"));
            laveVaisselle.setConsoEnergie(1.2f);
            toCreate.add(laveVaisselle);
        }
        if (!existingByType.containsKey("MachineCafe")) {
            MachineCafe machineCafe = new MachineCafe("Machine cafe", "Nespresso", Etat.INACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Cuisine"));
            machineCafe.setConsoEnergie(0.08f);
            toCreate.add(machineCafe);
        }
        if (!existingByType.containsKey("Enceinte")) {
            Enceinte enceinte = new Enceinte("Enceinte salon", "Sonos", Etat.ACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salon"));
            enceinte.setConsoEnergie(0.05f);
            toCreate.add(enceinte);
        }
        if (!existingByType.containsKey("Aspirateur")) {
            Aspirateur aspirateur = new Aspirateur("Aspirateur robot", "Roomba", Etat.ACTIF, Connectivite.WIFI, 95f, getPiece(pieceByName, "Cuisine"));
            aspirateur.setStatutAspirateur(Aspirateur.StatutAspirateur.EN_VEILLE);
            aspirateur.setConsoEnergie(0.45f);
            toCreate.add(aspirateur);
        }
        if (!existingByType.containsKey("Arrosage")) {
            Arrosage arrosage = new Arrosage("Arrosage jardin", "Gardena", Etat.INACTIF, Connectivite.WIFI, 88f, getPiece(pieceByName, "Garage"));
            arrosage.setConsoEnergie(0.30f);
            toCreate.add(arrosage);
        }
        if (!existingByType.containsKey("Reveil")) {
            Reveil reveil = new Reveil("Reveil chambre", "Philips", Etat.ACTIF, Connectivite.BLUETOOTH, null, getPiece(pieceByName, "Chambre parentale"));
            reveil.setConsoEnergie(0.02f);
            toCreate.add(reveil);
        }

        if (!existingByType.containsKey("Nourriture")) {
            Nourriture distributeur = new Nourriture("Distributeur croquettes", "PetSafe", Etat.ACTIF, Connectivite.WIFI, 79f, getPiece(pieceByName, "Cuisine"), 58f, "Chat");
            distributeur.setPortionGrammes(30);
            toCreate.add(distributeur);
        }
        if (!existingByType.containsKey("Eau")) {
            Eau fontaine = new Eau("Fontaine a eau", "PetKit", Etat.ACTIF, Connectivite.WIFI, 68f, getPiece(pieceByName, "Cuisine"), 46f, "Chat");
            fontaine.setPortionGrammes(50);
            toCreate.add(fontaine);
        }

        if (!toCreate.isEmpty()) {
            objetConnecteRepository.saveAll(toCreate);
        }

        backfillConsoEnergieAppareils();
        backfillMaintenanceDemo();
        backfillMachineCafeNiveaux();
    }

    /**
     * Démo maintenance + alertes : garantit quelques objets « à réparer » visibles
     * à chaque redémarrage pour une soutenance live stable.
     * <ul>
     *   <li>Aspirateur robot : CRITICAL (batterie 12 % + révision à 280j).</li>
     *   <li>Lave-linge : MEDIUM (révision périodique à 135j).</li>
     *   <li>Caméra entrée : HIGH (batterie faible à 18 %) + enregistrement actif.</li>
     *   <li>Détecteur de mouvement : historique de détection non vide.</li>
     * </ul>
     */
    private void backfillMaintenanceDemo() {
        List<ObjetConnecte> all = objetConnecteRepository.findAll();
        if (all.isEmpty()) return;

        Instant now = Instant.now();
        List<ObjetConnecte> toUpdate = new ArrayList<>();

        for (ObjetConnecte o : all) {
            boolean changed = false;
            String nom = o.getNom() == null ? "" : o.getNom().toLowerCase();

            // Baseline pour garder des dates réalistes quand la colonne est vide.
            if (o.getDerniereMaintenance() == null) {
                int seed = Math.abs((o.getNom() == null ? 0 : o.getNom().hashCode())) % 60;
                o.setDerniereMaintenance(now.minus(20L + seed, ChronoUnit.DAYS));
                changed = true;
            }

            // Hotspots de démo (toujours présents pour la soutenance / la page Maintenance).
            if (nom.contains("aspirateur")) {
                // Critique: batterie très basse + révision très en retard.
                Instant target = now.minus(280, ChronoUnit.DAYS);
                if (o.getDerniereMaintenance() == null || o.getDerniereMaintenance().isAfter(target)) {
                    o.setDerniereMaintenance(target);
                    changed = true;
                }
                if (o.getBatterie() == null || o.getBatterie() > 12f) {
                    o.setBatterie(12f);
                    changed = true;
                }
            } else if (nom.contains("lave-linge") || nom.contains("lavelinge") || nom.contains("lave linge")) {
                // Révision périodique due (medium).
                Instant target = now.minus(135, ChronoUnit.DAYS);
                if (o.getDerniereMaintenance() == null || o.getDerniereMaintenance().isAfter(target)) {
                    o.setDerniereMaintenance(target);
                    changed = true;
                }
            } else if (nom.contains("camera entree") || nom.contains("caméra entrée") || nom.contains("camera entrée") || nom.contains("caméra entree")) {
                // Batterie faible mais pas critique (high).
                if (o.getBatterie() == null || o.getBatterie() > 18f) {
                    o.setBatterie(18f);
                    changed = true;
                }
            }

            if (o instanceof Camera cam && (nom.contains("entree") || nom.contains("entrée"))) {
                // Flux caméra actif en démo.
                if (cam.getEnregistrement() == null || !cam.getEnregistrement()) {
                    cam.setEnregistrement(Boolean.TRUE);
                    changed = true;
                }
            }

            if (o instanceof DetecteurMouvement dm) {
                // Seed un historique de détection pour la démo événements/scénarios.
                if (dm.getDerniereDetectionAt() == null) {
                    dm.setDerniereDetectionAt(now.minus(2, ChronoUnit.HOURS));
                    changed = true;
                }
                if (dm.getTotalDetections() == null || dm.getTotalDetections() < 3) {
                    dm.setTotalDetections(3);
                    changed = true;
                }
            }

            if (changed) toUpdate.add(o);
        }

        if (!toUpdate.isEmpty()) {
            objetConnecteRepository.saveAll(toUpdate);
        }
    }

    private void backfillConsoEnergieAppareils() {
        List<ObjetConnecte> toUpdate = new ArrayList<>();
        for (ObjetConnecte objet : objetConnecteRepository.findAll()) {
            if (!(objet instanceof Appareil appareil)) continue;
            if (appareil.getConsoEnergie() != null) continue;

            Float defaultConso = defaultConsoFor(appareil);
            if (defaultConso == null) continue;

            appareil.setConsoEnergie(defaultConso);
            toUpdate.add(objet);
        }

        if (!toUpdate.isEmpty()) {
            objetConnecteRepository.saveAll(toUpdate);
        }
    }

    private static Float defaultConsoFor(Appareil appareil) {
        if (appareil instanceof Climatiseur) return 2.4f;
        if (appareil instanceof LaveLinge) return 1.1f;
        if (appareil instanceof SecheLinge) return 1.6f;
        if (appareil instanceof LaveVaisselle) return 1.2f;
        if (appareil instanceof Television) return 0.18f;
        if (appareil instanceof Aspirateur) return 0.45f;
        if (appareil instanceof Arrosage) return 0.30f;
        if (appareil instanceof Enceinte) return 0.05f;
        if (appareil instanceof MachineCafe) return 0.08f;
        if (appareil instanceof Reveil) return 0.02f;
        return null;
    }

    /**
     * Backfill MachineCafe water/coffee levels that are null on upgrade installs.
     * Also ensures every MachineCafe has a valid {@code derniereBoisson}.
     */
    private void backfillMachineCafeNiveaux() {
        List<ObjetConnecte> toUpdate = new ArrayList<>();
        for (ObjetConnecte objet : objetConnecteRepository.findAll()) {
            if (!(objet instanceof MachineCafe mc)) continue;
            boolean changed = false;
            if (mc.getNiveauEau() == null) {
                mc.setNiveauEau(80f);
                changed = true;
            }
            if (mc.getNiveauCafe() == null) {
                mc.setNiveauCafe(60f);
                changed = true;
            }
            if (mc.getDerniereBoisson() == null) {
                mc.setDerniereBoisson(MachineCafe.Boisson.ESPRESSO.name());
                changed = true;
            }
            if (mc.getTotalPreparations() == null) {
                mc.setTotalPreparations(0);
                changed = true;
            }
            if (changed) toUpdate.add(objet);
        }
        if (!toUpdate.isEmpty()) {
            objetConnecteRepository.saveAll(toUpdate);
        }
    }

    // ------------------------------------------------------------- utilisateurs

    private void seedUtilisateurs() {
        if (utilisateurRepository.count() > 0) {
            if (utilisateurRepository.findByEmailIgnoreCase("admin@demo.local").isEmpty()) {
                String hash = passwordService.hash(DEMO_PASSWORD);
                ParentFamille admin = new ParentFamille("Admin", "Maison", "admin@demo.local", hash);
                admin.addPoints(15f);
                admin.incrementNbConnexions();
                admin.setAdmin(true);
                admin.setEmailVerifie(true);
                utilisateurRepository.save(admin);
            }
            return;
        }
        String hash = passwordService.hash(DEMO_PASSWORD);

        // ParentFamille — démarre niveau AVANCE pour démo Gestion immédiate
        ParentFamille parent = new ParentFamille("Camille", "Martin", "parent@demo.local", hash);
        parent.addPoints(12f);          // ≥10 → AVANCE
        parent.incrementNbConnexions();
        parent.setEmailVerifie(true);

        // Admin (compte de supervision)
        ParentFamille admin = new ParentFamille("Admin", "Maison", "admin@demo.local", hash);
        admin.addPoints(15f);
        admin.incrementNbConnexions();
        admin.setAdmin(true);
        admin.setEmailVerifie(true);

        // Enfant — niveau Débutant au démarrage (max INTERMEDIAIRE)
        Enfant enfant = new Enfant("Lou", "Martin", "enfant@demo.local", hash);
        enfant.addPoints(1.5f);          // < 3 → DEBUTANT
        enfant.incrementNbConnexions();
        enfant.setEmailVerifie(true);

        // VoisinVisiteur — visiteur, capé à DEBUTANT
        VoisinVisiteur voisin = new VoisinVisiteur("Sam", "Voisin", "voisin@demo.local", hash);
        voisin.addPoints(0.5f);
        voisin.incrementNbConnexions();
        voisin.setEmailVerifie(true);

        utilisateurRepository.saveAll(List.of(parent, enfant, voisin, admin));
    }

    // -------------------------------------------------------- données capteurs

    private void seedDonneesCapteur() {
        if (donneeCapteurRepository.count() > 0) {
            return;
        }
        // 3 capteurs : 2 thermostats + 1 caméra (humidité)
        List<Capteur> capteurs = objetConnecteRepository.findAll().stream()
                .filter(o -> o instanceof Capteur)
                .map(o -> (Capteur) o)
                .toList();
        if (capteurs.isEmpty()) {
            return;
        }

        Random rng = new Random(42);
        Instant now = Instant.now();
        List<DonneeCapteur> donnees = new ArrayList<>();

        for (Capteur capteur : capteurs) {
            String grandeur;
            String unite;
            float base;
            float amplitude;

            if (capteur instanceof Thermostat) {
                grandeur = "temperature";
                unite = "°C";
                base = 19.5f;
                amplitude = 2.5f;
            } else if (capteur instanceof Camera) {
                grandeur = "luminosite";
                unite = "lux";
                base = 220f;
                amplitude = 40f;
            } else {
                grandeur = "valeur";
                unite = "u";
                base = 10f;
                amplitude = 5f;
            }

            // 1 mesure toutes les 8h sur 7 jours = ~21 mesures par capteur => ~63 total
            for (int hours = 0; hours < 7 * 24; hours += 8) {
                float jitter = (rng.nextFloat() * 2f - 1f) * amplitude;
                float valeur = base + jitter;
                Instant ts = now.minus(hours, ChronoUnit.HOURS);
                donnees.add(new DonneeCapteur(capteur, grandeur, valeur, unite, ts));
            }
        }
        donneeCapteurRepository.saveAll(donnees);
    }

    // ------------------------------------------------------------- historique

    private void seedHistorique() {
        if (historiqueActionRepository.count() > 0) {
            return;
        }
        List<Utilisateur> users = utilisateurRepository.findAll();
        List<ObjetConnecte> objets = objetConnecteRepository.findAll();
        if (users.isEmpty() || objets.isEmpty()) {
            return;
        }

        Utilisateur parent = users.stream()
                .filter(u -> u.getEmail().startsWith("parent"))
                .findFirst()
                .orElse(users.get(0));

        ObjetConnecte porte = objets.stream()
                .filter(o -> o.getNom().toLowerCase().contains("porte"))
                .findFirst()
                .orElse(objets.get(0));

        ObjetConnecte volet = objets.stream()
                .filter(o -> o.getNom().toLowerCase().contains("volet"))
                .findFirst()
                .orElse(objets.get(0));

        historiqueActionRepository.saveAll(List.of(
                new HistoriqueAction(ActionType.LOGIN, parent, null, "Connexion initiale"),
                new HistoriqueAction(ActionType.CONSULT_PROFILE, parent, null, "Consultation profil"),
                new HistoriqueAction(ActionType.SEARCH_OBJETS, parent, null, "Recherche objets"),
                new HistoriqueAction(ActionType.TOGGLE_ETAT, parent, porte, porte.getNom() + " → ACTIF"),
                new HistoriqueAction(ActionType.UPDATE_OBJET, parent, volet, "Position 30 → 65")
        ));
    }

    // ------------------------------------------------------------- scénarios

    private void seedScenarios() {
        if (scenarioRepository.count() > 0) {
            return;
        }
        Map<String, ObjetConnecte> objetsByNom = objetConnecteRepository.findAll().stream()
                .collect(Collectors.toMap(ObjetConnecte::getNom, Function.identity(), (a, b) -> a));

        // ☀ Bonjour — chaque jour de semaine à 8h00 : volets ouverts à 80 %, TV éteinte
        Scenario bonjour = new Scenario("Bonjour", "☀", ScenarioType.SCHEDULED);
        bonjour.setDescription("Ouverture des volets et préparation matinale, en semaine à 8h00.");
        bonjour.setCron("0 0 8 * * MON-FRI");
        addAction(bonjour, objetsByNom.get("Volet baie vitree"), Etat.ACTIF, 80);
        addAction(bonjour, objetsByNom.get("TV salon"), Etat.INACTIF, null);
        addAction(bonjour, objetsByNom.get("Camera entree"), Etat.ACTIF, null);

        // 🌙 Bonsoir — chaque jour à 22h00 : volets fermés à 10 %, TV / lave-linge OFF
        Scenario bonsoir = new Scenario("Bonsoir", "🌙", ScenarioType.SCHEDULED);
        bonsoir.setDescription("Fermeture progressive de la maison à 22h00 — volets clos, appareils en veille.");
        bonsoir.setCron("0 0 22 * * *");
        addAction(bonsoir, objetsByNom.get("Volet baie vitree"), Etat.ACTIF, 10);
        addAction(bonsoir, objetsByNom.get("TV salon"), Etat.INACTIF, null);
        addAction(bonsoir, objetsByNom.get("Lave-linge"), Etat.INACTIF, null);

        // 🎬 Cinéma — manuel : TV ON, volets fermés
        Scenario cinema = new Scenario("Cinéma", "🎬", ScenarioType.MANUAL);
        cinema.setDescription("Mode cinéma : volets fermés et TV allumée pour une ambiance immersive.");
        addAction(cinema, objetsByNom.get("TV salon"), Etat.ACTIF, null);
        addAction(cinema, objetsByNom.get("Volet baie vitree"), Etat.ACTIF, 0);

        // 🔒 Sécurité — manuel : portes fermées, volet garage fermé, caméras actives
        Scenario securite = new Scenario("Sécurité", "🔒", ScenarioType.MANUAL);
        securite.setDescription("Mise en sécurité : portes verrouillées, volets fermés, caméras actives.");
        addAction(securite, objetsByNom.get("Porte d'entree"), Etat.INACTIF, 0);
        addAction(securite, objetsByNom.get("Porte garage"), Etat.INACTIF, 0);
        addAction(securite, objetsByNom.get("Camera entree"), Etat.ACTIF, null);
        addAction(securite, objetsByNom.get("Systeme d'alarme"), Etat.ACTIF, null);

        // 🐱 Petit-déj du chat — chaque jour à 8h00 : distribuer une portion croquettes
        Scenario petitDej = new Scenario("Petit-déj du chat", "🐱", ScenarioType.SCHEDULED);
        petitDej.setDescription("Distribution automatique des croquettes du matin à 8h00.");
        petitDej.setCron("0 0 8 * * *");
        addAction(petitDej, objetsByNom.get("Distributeur croquettes"), Etat.ACTIF, null);

        // 🐾 Dîner du chat — chaque jour à 18h00
        Scenario diner = new Scenario("Dîner du chat", "🐾", ScenarioType.SCHEDULED);
        diner.setDescription("Distribution automatique du soir à 18h00.");
        diner.setCron("0 0 18 * * *");
        addAction(diner, objetsByNom.get("Distributeur croquettes"), Etat.ACTIF, null);

        // 💧 Eau fraîche — chaque jour à 7h00 : remet la fontaine à 100 %
        Scenario eauFraiche = new Scenario("Eau fraîche", "💧", ScenarioType.SCHEDULED);
        eauFraiche.setDescription("Remplissage automatique de la fontaine chaque matin à 7h00.");
        eauFraiche.setCron("0 0 7 * * *");
        addAction(eauFraiche, objetsByNom.get("Fontaine a eau"), Etat.ACTIF, null);

        // 🧺 Lessive nuit — manuel : lance le cycle Eco du lave-linge
        Scenario lessive = new Scenario("Lessive Eco", "🧺", ScenarioType.MANUAL);
        lessive.setDescription("Démarre un cycle Eco du lave-linge (programme + paramètres pré-réglés).");
        addAction(lessive, objetsByNom.get("Lave-linge"), Etat.ACTIF, null);

        // 🚨 Intrusion nuit — conditionnel : mouvement détecté + condition night
        Scenario intrusionNuit = new Scenario("Intrusion nuit", "🚨", ScenarioType.CONDITIONAL);
        intrusionNuit.setDescription("Si un mouvement est détecté la nuit, active l'alarme et la caméra d'entrée.");
        intrusionNuit.setTriggerEvent(ScenarioTriggerEvent.MOTION_DETECTED);
        ObjetConnecte detecteurSalon = objetsByNom.get("Detecteur presence salon");
        if (detecteurSalon != null) {
            intrusionNuit.setTriggerObjetId(detecteurSalon.getId());
        }
        intrusionNuit.setCondition("night");
        addAction(intrusionNuit, objetsByNom.get("Systeme d'alarme"), Etat.ACTIF, null);
        addAction(intrusionNuit, objetsByNom.get("Camera entree"), Etat.ACTIF, null);

        scenarioRepository.saveAll(List.of(
                bonjour, bonsoir, cinema, securite,
                petitDej, diner, eauFraiche, lessive, intrusionNuit
        ));
    }

    private void addAction(Scenario scenario, ObjetConnecte objet, Etat etat, Integer position) {
        if (objet == null) {
            return;
        }
        scenario.addAction(new ScenarioAction(objet, etat, position));
    }

    // ----------------------------------------------------------------- helpers

    private Piece getPiece(Map<String, Piece> pieceByName, String pieceName) {
        Piece piece = pieceByName.get(pieceName);
        if (piece == null) {
            throw new IllegalStateException("Pièce introuvable pour seed: " + pieceName);
        }
        return piece;
    }
}



