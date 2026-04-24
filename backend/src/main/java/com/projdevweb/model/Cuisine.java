package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("CUISINE")
public class Cuisine extends Piece {

    public Cuisine() {
        super();
    }

    public Cuisine(String nom, Maison maison) {
        super(nom, maison);
    }
}
