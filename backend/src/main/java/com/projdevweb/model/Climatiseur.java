package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("CLIMATISEUR")
public class Climatiseur extends Appareil {

    public enum ModeClim {
        FROID,
        CHAUD,
        AUTO,
        VENTILATION
    }

    private String modeClim = ModeClim.AUTO.name();
    private Integer tempCible = 22;

    public Climatiseur() {
        super();
    }

    public Climatiseur(String nom, String marque, Etat etat, Connectivite connectivite,
                       Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Auto");
    }

    public String getModeClim() {
        return modeClim;
    }

    public void setModeClim(String modeClim) {
        this.modeClim = modeClim;
    }

    public Integer getTempCible() {
        return tempCible;
    }

    public void setTempCible(Integer tempCible) {
        this.tempCible = tempCible;
    }
}
