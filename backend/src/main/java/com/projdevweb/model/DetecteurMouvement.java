package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("DETECTEUR_MOUVEMENT")
public class DetecteurMouvement extends Capteur {

    public DetecteurMouvement() {
        super();
    }

    public DetecteurMouvement(String nom, String marque, Etat etat, Connectivite connectivite,
                              Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece, zone);
    }
}
