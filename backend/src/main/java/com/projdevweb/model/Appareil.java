package com.projdevweb.model;

import jakarta.persistence.Entity;

@Entity
public abstract class Appareil extends ObjetConnecte {

    private String cycle;

    private Float consoEnergie;

    protected Appareil() {
    }

    protected Appareil(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece, String cycle) {
        super(nom, marque, etat, connectivite, batterie, piece);
        this.cycle = cycle;
    }

    public String getCycle() {
        return cycle;
    }

    public void setCycle(String cycle) {
        this.cycle = cycle;
    }

    public Float getConsoEnergie() {
        return consoEnergie;
    }

    public void setConsoEnergie(Float consoEnergie) {
        this.consoEnergie = consoEnergie;
    }
}
