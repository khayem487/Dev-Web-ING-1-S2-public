package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("CHAMBRE")
public class Chambre extends Piece {

    public Chambre() {
        super();
    }

    public Chambre(String nom, Maison maison) {
        super(nom, maison);
    }
}
