package com.projdevweb.dto;

import com.projdevweb.model.Appareil;
import com.projdevweb.model.BesoinAnimal;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Etat;
import com.projdevweb.model.LaveLinge;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Ouvrant;
import com.projdevweb.model.Television;
import com.projdevweb.model.Thermostat;

/**
 * Vue front d'un objet connecté. Expose toutes les valeurs vivantes type-spécifiques
 * (position, cycle, niveau, programme TV/lave-linge, target temp…) pour que la liste
 * et le détail montrent un état cohérent — fondamental pour que les contrôles
 * (slider position, mode lave-linge…) ne « perdent » pas leur valeur en re-rendu.
 *
 * <p>Le détail enrichi pour la Gestion (avec champs d'édition) reste {@link GestionObjetDetailDTO}.
 */
public record ObjetConnecteDTO(
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

        // Ouvrant
        Integer position,

        // Capteur
        String zone,

        // Appareil (commun)
        String cycle,
        Float consoEnergie,

        // LaveLinge — programme + paramètres cycle + temps restant calculé
        String programme,
        Integer tempLavage,
        Integer vitesseEssorage,
        Integer dureeRestante,

        // Television — chaîne / volume / source
        Integer chaine,
        Integer volume,
        String source,

        // Thermostat — consigne (température cible)
        Float tempCible,

        // BesoinAnimal — réservoir (renommé pour ne pas se confondre avec Utilisateur.niveau côté front)
        Float niveauReservoir,
        String animal,
        Integer portionGrammes,
        java.time.Instant prochaineDistribution
) {

    public static ObjetConnecteDTO from(ObjetConnecte o) {
        String branche = branche(o);

        Integer position = (o instanceof Ouvrant ouvrant) ? ouvrant.getPosition() : null;
        String zone = (o instanceof Capteur capteur) ? capteur.getZone() : null;

        String cycle = null;
        Float consoEnergie = null;
        String programme = null;
        Integer tempLavage = null;
        Integer vitesseEssorage = null;
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
            dureeRestante = ll.computeDureeRestante();
        }
        if (o instanceof Television tv) {
            chaine = tv.getChaine();
            volume = tv.getVolume();
            source = tv.getSource();
        }

        Float tempCible = (o instanceof Thermostat thermo) ? thermo.getTempCible() : null;

        Float niveauReservoir = null;
        String animal = null;
        Integer portionGrammes = null;
        java.time.Instant prochaineDistribution = null;
        if (o instanceof BesoinAnimal ba) {
            niveauReservoir = ba.getNiveau();
            animal = ba.getAnimal();
            portionGrammes = ba.getPortionGrammes();
            prochaineDistribution = ba.getProchaineDistribution();
        }

        return new ObjetConnecteDTO(
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
                programme,
                tempLavage,
                vitesseEssorage,
                dureeRestante,
                chaine,
                volume,
                source,
                tempCible,
                niveauReservoir,
                animal,
                portionGrammes,
                prochaineDistribution
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
