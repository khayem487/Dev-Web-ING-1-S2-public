package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("TOILETTES")
public class Toilettes extends Piece {

    public Toilettes() {
        super();
    }

    public Toilettes(String nom, Maison maison) {
        super(nom, maison);
    }
}
