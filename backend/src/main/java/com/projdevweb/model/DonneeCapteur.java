package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Mesure ponctuelle remontée par un objet (typiquement un {@link Capteur}).
 * UML : DonneeCapteur — FK simple vers ObjetConnecte (pas vers Capteur,
 * car certains autres objets peuvent aussi exposer une mesure dérivée).
 */
@Entity
@Table(
        name = "donnee_capteur",
        indexes = {
                @Index(name = "idx_donnee_capteur_timestamp", columnList = "timestamp"),
                @Index(name = "idx_donnee_capteur_objet", columnList = "objet_id")
        }
)
public class DonneeCapteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "objet_id", nullable = false)
    private ObjetConnecte objet;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    /** Grandeur mesurée (ex: "temperature", "humidite", "luminosite"). */
    @Column(nullable = false, length = 40)
    private String grandeur;

    @Column(nullable = false)
    private Float valeur;

    @Column(length = 16)
    private String unite;

    public DonneeCapteur() {
    }

    public DonneeCapteur(ObjetConnecte objet, String grandeur, Float valeur, String unite) {
        this.objet = objet;
        this.grandeur = grandeur;
        this.valeur = valeur;
        this.unite = unite;
    }

    public DonneeCapteur(ObjetConnecte objet, String grandeur, Float valeur, String unite, Instant timestamp) {
        this(objet, grandeur, valeur, unite);
        if (timestamp != null) {
            this.timestamp = timestamp;
        }
    }

    public Long getId() {
        return id;
    }

    public ObjetConnecte getObjet() {
        return objet;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getGrandeur() {
        return grandeur;
    }

    public Float getValeur() {
        return valeur;
    }

    public String getUnite() {
        return unite;
    }
}
