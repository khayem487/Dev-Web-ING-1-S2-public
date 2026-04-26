package com.projdevweb.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ALARME")
public class Alarme extends Appareil {

    public enum StatutAlarme {
        DESARMEE,
        ARMEE,
        ALERTE
    }

    private StatutAlarme statut = StatutAlarme.DESARMEE;
    private String zones = "Principale";

    public Alarme() {
        super();
    }

    public Alarme(String nom, String marque, Etat etat, Connectivite connectivite,
                  Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "Armee");
    }

    public StatutAlarme getStatut() {
        return statut;
    }

    public void setStatut(StatutAlarme statut) {
        this.statut = statut;
    }

    public String getZones() {
        return zones;
    }

    public void setZones(String zones) {
        this.zones = zones;
    }
}
