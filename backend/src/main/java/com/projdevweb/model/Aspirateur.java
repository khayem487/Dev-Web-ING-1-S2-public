package com.projdevweb.model;

/**
 * Aspirateur autonome — nettoyeur automatique avec statut de cycle.
 * Hérite de {@link Appareil}.
 */
public class Aspirateur extends Appareil {

    public enum StatutAspirateur { EN_VEILLE, EN_COURS, TERMINE, EN_CHARGE }

    private StatutAspirateur statutAspirateur = StatutAspirateur.EN_VEILLE;
    private Integer pourcentageBatterieAspirateur = 100;

    public Aspirateur() {}

    public Aspirateur(String nom, String marque,Etat etat, Connectivite connectivite, Float batterie, Piece piece) {
        super(nom, marque, etat, connectivite, batterie, piece, "En veille");
    }

    public StatutAspirateur getStatutAspirateur() { return statutAspirateur; }
    public void setStatutAspirateur(StatutAspirateur statutAspirateur) { this.statutAspirateur = statutAspirateur; }

    public Integer getPourcentageBatterieAspirateur() { return pourcentageBatterieAspirateur; }
    public void setPourcentageBatterieAspirateur(Integer pourcentageBatterieAspirateur) { this.pourcentageBatterieAspirateur = pourcentageBatterieAspirateur; }
}