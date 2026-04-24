package com.projdevweb.config;

import com.projdevweb.model.Camera;
import com.projdevweb.model.Chambre;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Cuisine;
import com.projdevweb.model.Eau;
import com.projdevweb.model.Etat;
import com.projdevweb.model.Garage;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.Maison;
import com.projdevweb.model.Nourriture;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Piece;
import com.projdevweb.model.Porte;
import com.projdevweb.model.SalleDeBain;
import com.projdevweb.model.Salon;
import com.projdevweb.model.Television;
import com.projdevweb.model.Thermostat;
import com.projdevweb.model.Toilettes;
import com.projdevweb.model.Volet;
import com.projdevweb.repository.MaisonRepository;
import com.projdevweb.repository.ObjetConnecteRepository;
import com.projdevweb.repository.PieceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class DataSeeder implements CommandLineRunner {

    private final MaisonRepository maisonRepository;
    private final PieceRepository pieceRepository;
    private final ObjetConnecteRepository objetConnecteRepository;

    public DataSeeder(MaisonRepository maisonRepository,
                      PieceRepository pieceRepository,
                      ObjetConnecteRepository objetConnecteRepository) {
        this.maisonRepository = maisonRepository;
        this.pieceRepository = pieceRepository;
        this.objetConnecteRepository = objetConnecteRepository;
    }

    @Override
    public void run(String... args) {
        if (maisonRepository.count() == 0) {
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

        if (objetConnecteRepository.count() > 0) {
            return;
        }

        Map<String, Piece> pieceByName = pieceRepository.findAll().stream()
                .collect(Collectors.toMap(Piece::getNom, Function.identity()));

        List<ObjetConnecte> objets = List.of(
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
        );

        objetConnecteRepository.saveAll(objets);
    }

    private Piece getPiece(Map<String, Piece> pieceByName, String pieceName) {
        Piece piece = pieceByName.get(pieceName);
        if (piece == null) {
            throw new IllegalStateException("Piece introuvable pour seed: " + pieceName);
        }
        return piece;
    }
}
