package com.projdevweb.config;

import com.projdevweb.model.ActionType;
import com.projdevweb.model.Camera;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Chambre;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Cuisine;
import com.projdevweb.model.DonneeCapteur;
import com.projdevweb.model.Eau;
import com.projdevweb.model.Enfant;
import com.projdevweb.model.Etat;
import com.projdevweb.model.Garage;
import com.projdevweb.model.HistoriqueAction;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.Maison;
import com.projdevweb.model.Nourriture;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.ParentFamille;
import com.projdevweb.model.Piece;
import com.projdevweb.model.Porte;
import com.projdevweb.model.SalleDeBain;
import com.projdevweb.model.Salon;
import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioAction;
import com.projdevweb.model.ScenarioType;
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
        if (objetConnecteRepository.count() > 0) {
            return;
        }
        Map<String, Piece> pieceByName = pieceRepository.findAll().stream()
                .collect(Collectors.toMap(Piece::getNom, Function.identity()));

        objetConnecteRepository.saveAll(List.of(
                // Ouvrants
                new Porte("Porte d'entrée", "Somfy", Etat.ACTIF, Connectivite.WIFI, 98f, getPiece(pieceByName, "Salon"), 100),
                new Volet("Volet baie vitrée", "Somfy", Etat.ACTIF, Connectivite.WIFI, 81f, getPiece(pieceByName, "Salon"), 65),
                new Volet("Volet chambre", "Somfy", Etat.ACTIF, Connectivite.BLUETOOTH, 74f, getPiece(pieceByName, "Chambre parentale"), 30),
                new Porte("Porte garage", "Nice", Etat.INACTIF, Connectivite.WIFI, 55f, getPiece(pieceByName, "Garage"), 0),

                // Capteurs
                new Thermostat("Thermostat salon", "Netatmo", Etat.ACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salon"), "Zone jour"),
                new Thermostat("Thermostat chambre", "Netatmo", Etat.ACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Chambre parentale"), "Zone nuit"),
                new Camera("Caméra entrée", "Arlo", Etat.ACTIF, Connectivite.WIFI, 89f, getPiece(pieceByName, "Salon"), "Entrée"),
                new Camera("Caméra garage", "Arlo", Etat.ACTIF, Connectivite.WIFI, 63f, getPiece(pieceByName, "Garage"), "Garage"),

                // Appareils
                new Television("TV salon", "Samsung", Etat.ACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salon"), "Veille"),
                new LaveLinge("Lave-linge", "LG", Etat.INACTIF, Connectivite.WIFI, null, getPiece(pieceByName, "Salle de bain"), "Eco 40"),

                // Besoins animaux
                new Nourriture("Distributeur croquettes", "PetSafe", Etat.ACTIF, Connectivite.WIFI, 79f, getPiece(pieceByName, "Cuisine"), 58f, "Chat"),
                new Eau("Fontaine à eau", "PetKit", Etat.ACTIF, Connectivite.WIFI, 68f, getPiece(pieceByName, "Cuisine"), 46f, "Chat")
        ));
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
                utilisateurRepository.save(admin);
            }
            return;
        }
        String hash = passwordService.hash(DEMO_PASSWORD);

        // ParentFamille — démarre niveau AVANCE pour démo Gestion immédiate
        ParentFamille parent = new ParentFamille("Camille", "Martin", "parent@demo.local", hash);
        parent.addPoints(12f);          // ≥10 → AVANCE
        parent.incrementNbConnexions();

        // Admin (compte de supervision)
        ParentFamille admin = new ParentFamille("Admin", "Maison", "admin@demo.local", hash);
        admin.addPoints(15f);
        admin.incrementNbConnexions();
        admin.setAdmin(true);

        // Enfant — niveau Débutant au démarrage (max INTERMEDIAIRE)
        Enfant enfant = new Enfant("Lou", "Martin", "enfant@demo.local", hash);
        enfant.addPoints(1.5f);          // < 3 → DEBUTANT
        enfant.incrementNbConnexions();

        // VoisinVisiteur — visiteur, capé à DEBUTANT
        VoisinVisiteur voisin = new VoisinVisiteur("Sam", "Voisin", "voisin@demo.local", hash);
        voisin.addPoints(0.5f);
        voisin.incrementNbConnexions();

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
        addAction(bonjour, objetsByNom.get("Volet baie vitrée"), Etat.ACTIF, 80);
        addAction(bonjour, objetsByNom.get("Volet chambre"), Etat.ACTIF, 80);
        addAction(bonjour, objetsByNom.get("TV salon"), Etat.INACTIF, null);
        addAction(bonjour, objetsByNom.get("Caméra entrée"), Etat.ACTIF, null);

        // 🌙 Bonsoir — chaque jour à 22h00 : volets fermés à 10 %, TV / lave-linge OFF
        Scenario bonsoir = new Scenario("Bonsoir", "🌙", ScenarioType.SCHEDULED);
        bonsoir.setDescription("Fermeture progressive de la maison à 22h00 — volets clos, appareils en veille.");
        bonsoir.setCron("0 0 22 * * *");
        addAction(bonsoir, objetsByNom.get("Volet baie vitrée"), Etat.ACTIF, 10);
        addAction(bonsoir, objetsByNom.get("Volet chambre"), Etat.ACTIF, 10);
        addAction(bonsoir, objetsByNom.get("TV salon"), Etat.INACTIF, null);
        addAction(bonsoir, objetsByNom.get("Lave-linge"), Etat.INACTIF, null);

        // 🎬 Cinéma — manuel : TV ON, volets fermés
        Scenario cinema = new Scenario("Cinéma", "🎬", ScenarioType.MANUAL);
        cinema.setDescription("Mode cinéma : volets fermés et TV allumée pour une ambiance immersive.");
        addAction(cinema, objetsByNom.get("TV salon"), Etat.ACTIF, null);
        addAction(cinema, objetsByNom.get("Volet baie vitrée"), Etat.ACTIF, 0);
        addAction(cinema, objetsByNom.get("Volet chambre"), Etat.ACTIF, 0);

        // 🔒 Sécurité — manuel : portes fermées, volet garage fermé, caméras actives
        Scenario securite = new Scenario("Sécurité", "🔒", ScenarioType.MANUAL);
        securite.setDescription("Mise en sécurité : portes verrouillées, volets fermés, caméras actives.");
        addAction(securite, objetsByNom.get("Porte d'entrée"), Etat.INACTIF, 0);
        addAction(securite, objetsByNom.get("Porte garage"), Etat.INACTIF, 0);
        addAction(securite, objetsByNom.get("Caméra entrée"), Etat.ACTIF, null);
        addAction(securite, objetsByNom.get("Caméra garage"), Etat.ACTIF, null);

        scenarioRepository.saveAll(List.of(bonjour, bonsoir, cinema, securite));
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
