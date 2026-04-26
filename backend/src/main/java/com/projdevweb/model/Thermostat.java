package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/**
 * Thermostat avec consigne (température cible). La valeur instantanée
 * (tempActuelle) est lue à la volée depuis le dernier {@code DonneeCapteur}
 * du capteur — pas dupliquée ici.
 */
@Entity
@DiscriminatorValue("THERMOSTAT")
public class Thermostat extends Capteur {

    /** Mode de fonctionnement. Stocké en string pour rester souple. */
    public enum ModeThermostat {
        AUTO("Auto"),
        CHAUFFE("Chauffage"),
        ECO("Éco"),
        OFF("Arrêt");

        private final String label;
        ModeThermostat(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    @Column
    private Float tempCible;

    @Column(length = 16)
    private String mode;

    public Thermostat() {
        super();
    }

    public Thermostat(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece, zone);
        // Défauts produit
        this.tempCible = 20.0f;
        this.mode = ModeThermostat.AUTO.name();
    }

    public Float getTempCible() { return tempCible; }
    public void setTempCible(Float tempCible) {
        if (tempCible == null) {
            this.tempCible = null;
            return;
        }
        // Bornes physiologiques raisonnables (10-30 °C)
        this.tempCible = Math.max(10f, Math.min(30f, tempCible));
    }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
}
