package com.projdevweb.model;

/**
 * Niveau d'un utilisateur. Calculé à partir des points cumulés
 * et borné par le {@link Niveau#niveauMax} du sous-type d'utilisateur.
 *
 * <p>Seuils figés (cf. PLAN.md / DECISIONS.md) :
 * <ul>
 *   <li>{@code [0 ; 3[}    → DEBUTANT</li>
 *   <li>{@code [3 ; 10[}   → INTERMEDIAIRE</li>
 *   <li>{@code [10 ; +∞)}  → AVANCE</li>
 * </ul>
 */
public enum Niveau {
    DEBUTANT,
    INTERMEDIAIRE,
    AVANCE;

    /**
     * Niveau brut déduit des points (avant clamp par niveauMax).
     */
    public static Niveau fromPoints(float points) {
        if (points >= 10f) {
            return AVANCE;
        }
        if (points >= 3f) {
            return INTERMEDIAIRE;
        }
        return DEBUTANT;
    }

    /**
     * Borne supérieure : retourne {@code this} si {@code <= cap}, sinon {@code cap}.
     */
    public Niveau cappedAt(Niveau cap) {
        if (cap == null) {
            return this;
        }
        return this.ordinal() > cap.ordinal() ? cap : this;
    }

    /**
     * @return {@code true} si ce niveau est au moins aussi élevé que {@code other}.
     */
    public boolean atLeast(Niveau other) {
        return other == null || this.ordinal() >= other.ordinal();
    }
}
