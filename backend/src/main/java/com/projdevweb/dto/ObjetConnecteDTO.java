package com.projdevweb.dto;

import com.projdevweb.model.Appareil;
import com.projdevweb.model.BesoinAnimal;
import com.projdevweb.model.Capteur;
import com.projdevweb.model.Connectivite;
import com.projdevweb.model.Etat;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Ouvrant;

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
        String pieceNom
) {

    public static ObjetConnecteDTO from(ObjetConnecte o) {
        String branche = branche(o);
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
                o.getPiece() != null ? o.getPiece().getNom() : null
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
