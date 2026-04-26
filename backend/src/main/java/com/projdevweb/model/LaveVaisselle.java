package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("LAVE_VAISSELLE")
public class LaveVaisselle extends Appareil {

    public LaveVaisselle() {
        super();
    }

    public LaveVaisselle(String nom, String marque, Etat etat, Connectivite connectivite,
                         Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Eco");
    }
}
