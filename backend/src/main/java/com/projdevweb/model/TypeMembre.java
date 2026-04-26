package com.projdevweb.model;

/**
 * Type d'un membre de la maison. Détermine le niveauMax atteignable.
 *
 * <ul>
 *   <li>{@link #ENFANT}          → niveauMax {@link Niveau#INTERMEDIAIRE}</li>
 *   <li>{@link #PARENT_FAMILLE}  → niveauMax {@link Niveau#AVANCE}</li>
 *   <li>{@link #VOISIN_VISITEUR} → niveauMax {@link Niveau#DEBUTANT}</li>
 * </ul>
 */
public enum TypeMembre {
    ENFANT(Niveau.INTERMEDIAIRE),
    PARENT_FAMILLE(Niveau.AVANCE),
    VOISIN_VISITEUR(Niveau.DEBUTANT);

    private final Niveau niveauMax;

    TypeMembre(Niveau niveauMax) {
        this.niveauMax = niveauMax;
    }

    public Niveau getNiveauMax() {
        return niveauMax;
    }
}
