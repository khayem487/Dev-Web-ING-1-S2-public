package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "demande_suppression")
public class DemandeSuppression {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objet_id")
    private ObjetConnecte objet;

    @Column(nullable = false)
    private Long objetIdSnapshot;

    @Column(nullable = false, length = 180)
    private String objetNomSnapshot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private Utilisateur demandeur;

    @Column(length = 1000)
    private String raison;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private DemandeSuppressionStatus status = DemandeSuppressionStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_id")
    private Utilisateur traitePar;

    private Instant resolvedAt;

    @Column(length = 1000)
    private String noteAdmin;

    protected DemandeSuppression() {
    }

    public DemandeSuppression(ObjetConnecte objet, Utilisateur demandeur, String raison) {
        this.objet = objet;
        this.objetIdSnapshot = objet != null ? objet.getId() : null;
        this.objetNomSnapshot = objet != null ? objet.getNom() : "Objet";
        this.demandeur = demandeur;
        this.raison = raison;
        this.status = DemandeSuppressionStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public ObjetConnecte getObjet() {
        return objet;
    }

    public void setObjet(ObjetConnecte objet) {
        this.objet = objet;
    }

    public Long getObjetIdSnapshot() {
        return objetIdSnapshot;
    }

    public String getObjetNomSnapshot() {
        return objetNomSnapshot;
    }

    public Utilisateur getDemandeur() {
        return demandeur;
    }

    public String getRaison() {
        return raison;
    }

    public void setRaison(String raison) {
        this.raison = raison;
    }

    public DemandeSuppressionStatus getStatus() {
        return status;
    }

    public void setStatus(DemandeSuppressionStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Utilisateur getTraitePar() {
        return traitePar;
    }

    public void setTraitePar(Utilisateur traitePar) {
        this.traitePar = traitePar;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getNoteAdmin() {
        return noteAdmin;
    }

    public void setNoteAdmin(String noteAdmin) {
        this.noteAdmin = noteAdmin;
    }
}
