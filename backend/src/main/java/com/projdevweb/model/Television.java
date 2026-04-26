package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/**
 * TV connectée avec contrôle à distance : chaîne, volume, source d'entrée.
 * UML méthodes correspondantes : {@code setChaine(int)}, {@code setVolume(int)}, etc.
 */
@Entity
@DiscriminatorValue("TELEVISION")
public class Television extends Appareil {

    /** Sources possibles. Reste ouvert (string en base) pour permettre l'extensibilité. */
    public enum SourceTV {
        LIVE_TV("Direct"),
        NETFLIX("Netflix"),
        YOUTUBE("YouTube"),
        DISNEY("Disney+"),
        SPOTIFY("Spotify"),
        HDMI1("HDMI 1"),
        HDMI2("HDMI 2");

        private final String label;
        SourceTV(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    @Column
    private Integer chaine;

    @Column
    private Integer volume;

    @Column(length = 32)
    private String source;

    public Television() {
        super();
    }

    public Television(String nom, String marque, Etat etat, Connectivite connectivite,
                      Float batterie, Piece piece, String cycle) {
        super(nom, marque, etat, connectivite, batterie, piece, cycle);
        // Défauts produit
        this.chaine = 1;
        this.volume = 25;
        this.source = SourceTV.LIVE_TV.name();
    }

    public Integer getChaine() { return chaine; }
    public void setChaine(Integer chaine) {
        if (chaine == null) {
            this.chaine = null;
            return;
        }
        // Borne raisonnable (chaîne 1-99)
        this.chaine = Math.max(1, Math.min(99, chaine));
    }

    public Integer getVolume() { return volume; }
    public void setVolume(Integer volume) {
        if (volume == null) {
            this.volume = null;
            return;
        }
        this.volume = Math.max(0, Math.min(100, volume));
    }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
