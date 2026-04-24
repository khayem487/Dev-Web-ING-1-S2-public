package com.projdevweb.model;

import jakarta.persistence.Entity;

import java.time.Instant;

@Entity
public abstract class Capteur extends ObjetConnecte {

    private String zone;

    private Instant derniereAlerte;

    protected Capteur() {
    }

    protected Capteur(String nom, String marque, Etat etat, Connectivite connectivite,
                     Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece);
        this.zone = zone;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public Instant getDerniereAlerte() {
        return derniereAlerte;
    }

    public void setDerniereAlerte(Instant derniereAlerte) {
        this.derniereAlerte = derniereAlerte;
    }
}
