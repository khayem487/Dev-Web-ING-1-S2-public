package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "gestion_historique")
public class GestionHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(nullable = false, length = 50)
    private String action;

    private Long objetId;

    private String objetNom;

    private String typeObjet;

    private String pieceNom;

    private String utilisateurEmail;

    @Column(length = 1000)
    private String details;

    public GestionHistorique() {
    }

    public GestionHistorique(String action,
                             Long objetId,
                             String objetNom,
                             String typeObjet,
                             String pieceNom,
                             String utilisateurEmail,
                             String details) {
        this.action = action;
        this.objetId = objetId;
        this.objetNom = objetNom;
        this.typeObjet = typeObjet;
        this.pieceNom = pieceNom;
        this.utilisateurEmail = utilisateurEmail;
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getAction() {
        return action;
    }

    public Long getObjetId() {
        return objetId;
    }

    public String getObjetNom() {
        return objetNom;
    }

    public String getTypeObjet() {
        return typeObjet;
    }

    public String getPieceNom() {
        return pieceNom;
    }

    public String getUtilisateurEmail() {
        return utilisateurEmail;
    }

    public String getDetails() {
        return details;
    }
}
