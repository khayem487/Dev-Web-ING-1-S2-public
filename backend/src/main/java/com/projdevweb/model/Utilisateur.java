package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.DiscriminatorType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Utilisateur abstrait — base SINGLE_TABLE pour {@link Enfant},
 * {@link ParentFamille} et {@link VoisinVisiteur}.
 *
 * <p>Champs publics : {@code prenom}, {@code nom}, {@code pseudo}, {@code bioPublique}.
 * <p>Champs privés  : {@code email}, {@code motDePasse} (BCrypt), {@code telephonePrive}, {@code adressePrivee}.
 *
 * <p>Le {@code niveau} est dérivé des {@code points} et clampé au niveauMax du sous-type.
 */
@Entity
@Table(name = "utilisateur")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type_membre", discriminatorType = DiscriminatorType.STRING, length = 32)
public abstract class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String prenom;

    @Column(nullable = false, length = 80)
    private String nom;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    /** Hash BCrypt du mot de passe — jamais en clair. */
    @Column(nullable = false, length = 100)
    private String motDePasse;

    @Column(length = 80)
    private String pseudo;

    @Column(length = 1000)
    private String bioPublique;

    @Column(length = 30)
    private String telephonePrive;

    @Column(length = 500)
    private String adressePrivee;

    @Column(length = 32)
    private String genre;

    private LocalDate dateNaissance;

    @Column(length = 120)
    private String ville;

    @Column(nullable = false)
    private Boolean emailVerifie = true;

    @Column(length = 32)
    private String emailVerificationToken;

    private Instant emailVerificationExpireAt;

    @Lob
    @Column
    private String photoDataUrl;

    /** Points cumulés (Float pour autoriser les +0.25/+0.50). */
    @Column(nullable = false)
    private Float points = 0f;

    @Column(nullable = false)
    private Integer nbConnexions = 0;

    /**
     * Drapeau administration (module admin).
     * Un admin peut valider/refuser les demandes de suppression et gérer les comptes.
     */
    @Column(nullable = false)
    private Boolean admin = false;

    @Column(nullable = false, updatable = false)
    private Instant dateInscription = Instant.now();

    protected Utilisateur() {
    }

    protected Utilisateur(String prenom, String nom, String email, String motDePasseHash) {
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.motDePasse = motDePasseHash;
    }

    /**
     * Niveau max accessible par ce sous-type. Implémenté par chaque
     * sous-classe concrète, pas stocké en base.
     */
    @Transient
    public abstract Niveau getNiveauMax();

    /**
     * Type discriminant. Les sous-classes le surchargent pour exposer leur valeur.
     */
    @Transient
    public abstract TypeMembre getTypeMembre();

    /** Niveau actuel (derivé des points, clampé au niveauMax). */
    @Transient
    public Niveau getNiveau() {
        float p = points == null ? 0f : points;
        return Niveau.fromPoints(p).cappedAt(getNiveauMax());
    }

    /**
     * Ajoute des points (delta positif). Le niveau est recalculé à la lecture.
     * À utiliser uniquement via {@code PointsService} pour homogénéité.
     */
    public void addPoints(float delta) {
        if (delta <= 0f) {
            return;
        }
        this.points = (this.points == null ? 0f : this.points) + delta;
    }

    public void incrementNbConnexions() {
        this.nbConnexions = (this.nbConnexions == null ? 0 : this.nbConnexions) + 1;
    }

    // -- getters / setters --

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

    public void setMotDePasse(String motDePasseHash) {
        this.motDePasse = motDePasseHash;
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

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public LocalDate getDateNaissance() {
        return dateNaissance;
    }

    public void setDateNaissance(LocalDate dateNaissance) {
        this.dateNaissance = dateNaissance;
    }

    public String getVille() {
        return ville;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public String getPhotoDataUrl() {
        return photoDataUrl;
    }

    public void setPhotoDataUrl(String photoDataUrl) {
        this.photoDataUrl = photoDataUrl;
    }

    public boolean isEmailVerifie() {
        return Boolean.TRUE.equals(emailVerifie);
    }

    public void setEmailVerifie(Boolean emailVerifie) {
        this.emailVerifie = Boolean.TRUE.equals(emailVerifie);
    }

    public String getEmailVerificationToken() {
        return emailVerificationToken;
    }

    public void setEmailVerificationToken(String emailVerificationToken) {
        this.emailVerificationToken = emailVerificationToken;
    }

    public Instant getEmailVerificationExpireAt() {
        return emailVerificationExpireAt;
    }

    public void setEmailVerificationExpireAt(Instant emailVerificationExpireAt) {
        this.emailVerificationExpireAt = emailVerificationExpireAt;
    }

    public Float getPoints() {
        return points;
    }

    public Integer getNbConnexions() {
        return nbConnexions;
    }

    public boolean isAdmin() {
        return Boolean.TRUE.equals(admin);
    }

    public void setAdmin(Boolean admin) {
        this.admin = Boolean.TRUE.equals(admin);
    }

    public Instant getDateInscription() {
        return dateInscription;
    }
}
