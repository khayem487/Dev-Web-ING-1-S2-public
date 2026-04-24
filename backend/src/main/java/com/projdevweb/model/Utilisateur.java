package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "utilisateur")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    private String pseudo;

    @Column(length = 1000)
    private String bioPublique;

    private String telephonePrive;

    @Column(length = 500)
    private String adressePrivee;

    @Column(nullable = false)
    private Integer points = 0;

    @Column(nullable = false)
    private Integer niveau = 1;

    @Column(nullable = false, updatable = false)
    private Instant dateInscription = Instant.now();

    public Utilisateur() {
    }

    public Utilisateur(String prenom, String nom, String email, String motDePasse) {
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.motDePasse = motDePasse;
    }

    public void addPoints(int delta) {
        if (delta <= 0) {
            return;
        }
        this.points = (this.points == null ? 0 : this.points) + delta;
        this.niveau = 1 + (this.points / 100);
    }

    public Long getId() {
        return id;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMotDePasse() {
        return motDePasse;
    }

    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }

    public String getPseudo() {
        return pseudo;
    }

    public void setPseudo(String pseudo) {
        this.pseudo = pseudo;
    }

    public String getBioPublique() {
        return bioPublique;
    }

    public void setBioPublique(String bioPublique) {
        this.bioPublique = bioPublique;
    }

    public String getTelephonePrive() {
        return telephonePrive;
    }

    public void setTelephonePrive(String telephonePrive) {
        this.telephonePrive = telephonePrive;
    }

    public String getAdressePrivee() {
        return adressePrivee;
    }

    public void setAdressePrivee(String adressePrivee) {
        this.adressePrivee = adressePrivee;
    }

    public Integer getPoints() {
        return points;
    }

    public Integer getNiveau() {
        return niveau;
    }

    public Instant getDateInscription() {
        return dateInscription;
    }
}
