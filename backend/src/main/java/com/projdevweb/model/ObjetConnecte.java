package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "objet_connecte")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type_objet", discriminatorType = DiscriminatorType.STRING, length = 40)
public abstract class ObjetConnecte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private String marque;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Etat etat = Etat.INACTIF;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private Connectivite connectivite;

    private Float batterie;

    private Instant derniereInteraction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "piece_id", nullable = false)
    private Piece piece;

    protected ObjetConnecte() {
    }

    protected ObjetConnecte(String nom, String marque, Etat etat, Connectivite connectivite,
                            Float batterie, Piece piece) {
        this.nom = nom;
        this.marque = marque;
        this.etat = etat;
        this.connectivite = connectivite;
        this.batterie = batterie;
        this.piece = piece;
    }

    public Long getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getMarque() {
        return marque;
    }

    public void setMarque(String marque) {
        this.marque = marque;
    }

    public Etat getEtat() {
        return etat;
    }

    public void setEtat(Etat etat) {
        this.etat = etat;
    }

    public Connectivite getConnectivite() {
        return connectivite;
    }

    public void setConnectivite(Connectivite connectivite) {
        this.connectivite = connectivite;
    }

    public Float getBatterie() {
        return batterie;
    }

    public void setBatterie(Float batterie) {
        this.batterie = batterie;
    }

    public Instant getDerniereInteraction() {
        return derniereInteraction;
    }

    public void setDerniereInteraction(Instant derniereInteraction) {
        this.derniereInteraction = derniereInteraction;
    }

    public Piece getPiece() {
        return piece;
    }

    public void setPiece(Piece piece) {
        this.piece = piece;
    }
}
