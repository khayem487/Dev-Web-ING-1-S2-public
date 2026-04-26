package com.projdevweb.dto;

import com.projdevweb.model.Appareil;
import com.projdevweb.model.BesoinAnimal;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Climatiseur;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Etat;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Ouvrant;
import com.projdevweb.model.Television;
import com.projdevweb.model.Thermostat;

import java.time.Instant;

/**
 * Détail enrichi pour l'éditeur Gestion. Inclut TOUS les champs type-spécifiques
 * pour pré-remplir le formulaire et afficher les compteurs live (cycle restant,
 * prochaine distribution pet feeder, etc.).
 */
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
        Instant derniereMaintenance,
        Long pieceId,
        String pieceNom,

        // Ouvrant
        Integer position,

        // Capteur
        String zone,

        // Appareil commun
        String cycle,
        Float consoEnergie,

        // LaveLinge
        String programme,
        Integer tempLavage,
        Integer vitesseEssorage,
        Integer dureeProgrammeMin,
        Instant dateDebutCycle,
        Integer dureeRestante,

        // Television
        Integer chaine,
        Integer volume,
        String source,

        // Thermostat
        Float tempCible,
        String mode,

        // BesoinAnimal
        Float niveau,
        String animal,
        Integer portionGrammes,
        Instant derniereDistribution,
        Instant prochaineDistribution
) {

    public static GestionObjetDetailDTO from(ObjetConnecte o) {
        String branche = branche(o);

        Integer position = (o instanceof Ouvrant ouvrant) ? ouvrant.getPosition() : null;
        String zone = (o instanceof Capteur cap) ? cap.getZone() : null;

        String cycle = null;
        Float consoEnergie = null;
        String programme = null;
        Integer tempLavage = null;
        Integer vitesseEssorage = null;
        Integer dureeProgrammeMin = null;
        Instant dateDebutCycle = null;
        Integer dureeRestante = null;
        Integer chaine = null;
        Integer volume = null;
        String source = null;

        if (o instanceof Appareil appareil) {
            cycle = appareil.getCycle();
            consoEnergie = appareil.getConsoEnergie();
        }
        if (o instanceof LaveLinge ll) {
            programme = ll.getProgramme();
            tempLavage = ll.getTempLavage();
            vitesseEssorage = ll.getVitesseEssorage();
            dureeProgrammeMin = ll.getDureeProgrammeMin();
            dateDebutCycle = ll.getDateDebutCycle();
            dureeRestante = ll.computeDureeRestante();
        }
        if (o instanceof Television tv) {
            chaine = tv.getChaine();
            volume = tv.getVolume();
            source = tv.getSource();
        }

        Float tempCible = null;
        String mode = null;
        if (o instanceof Thermostat th) {
            tempCible = th.getTempCible();
            mode = th.getMode();
        } else if (o instanceof Climatiseur clim) {
            tempCible = clim.getTempCible() != null ? clim.getTempCible().floatValue() : null;
            mode = clim.getModeClim();
        }

        Float niveau = null;
        String animal = null;
        Integer portionGrammes = null;
        Instant derniere = null;
        Instant prochaine = null;
        if (o instanceof BesoinAnimal ba) {
            niveau = ba.getNiveau();
            animal = ba.getAnimal();
            portionGrammes = ba.getPortionGrammes();
            derniere = ba.getDerniereDistribution();
            prochaine = ba.getProchaineDistribution();
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
                o.getDerniereMaintenance(),
                o.getPiece() != null ? o.getPiece().getId() : null,
                o.getPiece() != null ? o.getPiece().getNom() : null,
                position,
                zone,
                cycle,
                consoEnergie,
                programme,
                tempLavage,
                vitesseEssorage,
                dureeProgrammeMin,
                dateDebutCycle,
                dureeRestante,
                chaine,
                volume,
                source,
                tempCible,
                mode,
                niveau,
                animal,
                portionGrammes,
                derniere,
                prochaine
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
