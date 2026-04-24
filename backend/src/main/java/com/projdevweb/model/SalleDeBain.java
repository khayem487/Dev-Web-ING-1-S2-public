package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("SALLE_DE_BAIN")
public class SalleDeBain extends Piece {

    public SalleDeBain() {
        super();
    }

    public SalleDeBain(String nom, Maison maison) {
        super(nom, maison);
    }
}
