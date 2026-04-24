package com.projdevweb.dto;

import com.projdevweb.model.Appareil;
import com.projdevweb.model.BesoinAnimal;
import com.projdevweb.model.Camera;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Eau;
import com.projdevweb.model.Etat;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.Nourriture;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Ouvrant;
import com.projdevweb.model.Porte;
import com.projdevweb.model.Television;
import com.projdevweb.model.Thermostat;
import com.projdevweb.model.Volet;

public record GestionObjetDetailDTO(
        Long id,
        String nom,
        String marque,
        String type,
        String branche,
        String service,
        Etat etat,
        Connectivite connectivite,
        Float batterie,
        Long pieceId,
        String pieceNom,
        Integer position,
        String zone,
        String cycle,
        Float consoEnergie,
        Float niveau,
        String animal
) {

    public static GestionObjetDetailDTO from(ObjetConnecte o) {
        String branche = branche(o);

        Integer position = null;
        String zone = null;
        String cycle = null;
        Float consoEnergie = null;
        Float niveau = null;
        String animal = null;

        if (o instanceof Ouvrant ouvrant) {
            position = ouvrant.getPosition();
        }
        if (o instanceof Capteur capteur) {
            zone = capteur.getZone();
        }
        if (o instanceof Appareil appareil) {
            cycle = appareil.getCycle();
            consoEnergie = appareil.getConsoEnergie();
        }
        if (o instanceof BesoinAnimal besoinAnimal) {
            niveau = besoinAnimal.getNiveau();
            animal = besoinAnimal.getAnimal();
        }

        return new GestionObjetDetailDTO(
                o.getId(),
                o.getNom(),
                o.getMarque(),
                o.getClass().getSimpleName(),
                branche,
                service(branche),
                o.getEtat(),
                o.getConnectivite(),
                o.getBatterie(),
                o.getPiece() != null ? o.getPiece().getId() : null,
                o.getPiece() != null ? o.getPiece().getNom() : null,
                position,
                zone,
                cycle,
                consoEnergie,
                niveau,
                animal
        );
    }

    private static String branche(ObjetConnecte o) {
        if (o instanceof Ouvrant) return "Ouvrant";
        if (o instanceof Capteur) return "Capteur";
        if (o instanceof Appareil) return "Appareil";
        if (o instanceof BesoinAnimal) return "BesoinAnimal";
        return "ObjetConnecte";
    }

    private static String service(String branche) {
        return switch (branche) {
            case "Ouvrant" -> "Acces";
            case "Capteur" -> "Surveillance";
            case "Appareil" -> "Confort";
            case "BesoinAnimal" -> "Animal";
            default -> "General";
        };
    }
}
