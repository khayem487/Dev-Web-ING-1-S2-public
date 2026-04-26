package com.projdevweb.service;

import com.projdevweb.model.ActionType;
import com.projdevweb.model.HistoriqueAction;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.HistoriqueActionRepository;
import com.projdevweb.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Centralise les incréments de points + l'écriture de l'historique.
 *
 * <p>Deux modes :
 * <ul>
 *   <li>{@link #record} — points + ligne historique (actions structurantes : login,
 *       création/MAJ/suppression d'objet, exécution scénario, décision admin).</li>
 *   <li>{@link #awardPoints} — points seuls, pas de ligne historique (consultations
 *       répétées : {@code CONSULT_PROFILE}, {@code SEARCH_OBJETS} — sinon le journal
 *       devient illisible avec une ligne par refresh de page).</li>
 * </ul>
 */
@Service
public class PointsService {

    private final UtilisateurRepository utilisateurRepository;
    private final HistoriqueActionRepository historiqueActionRepository;

    public PointsService(UtilisateurRepository utilisateurRepository,
                         HistoriqueActionRepository historiqueActionRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.historiqueActionRepository = historiqueActionRepository;
    }

    /** Incrément + log historique pour les actions sans objet (login, profil...). */
    @Transactional
    public Utilisateur record(Utilisateur utilisateur, ActionType action, String details) {
        return record(utilisateur, action, null, details);
    }

    /** Incrément + log historique pour les actions liées à un objet. */
    @Transactional
    public Utilisateur record(Utilisateur utilisateur,
                              ActionType action,
                              ObjetConnecte objet,
                              String details) {
        if (utilisateur == null || action == null) {
            return utilisateur;
        }
        utilisateur.addPoints(action.getPoints());
        Utilisateur saved = utilisateurRepository.save(utilisateur);
        historiqueActionRepository.save(new HistoriqueAction(action, saved, objet, details));
        return saved;
    }

    /**
     * Incrémente les points sans écrire de ligne historique.
     * À utiliser pour les consultations répétitives (lecture de profil, listing
     * d'objets) qui sinon noieraient le journal d'audit utilisateur.
     */
    @Transactional
    public Utilisateur awardPoints(Utilisateur utilisateur, ActionType action) {
        if (utilisateur == null || action == null) {
            return utilisateur;
        }
        utilisateur.addPoints(action.getPoints());
        return utilisateurRepository.save(utilisateur);
    }

    /** Incrément du compteur de connexions + +0.25 pts (LOGIN, lui RESTE loggué). */
    @Transactional
    public Utilisateur recordLogin(Utilisateur utilisateur) {
        if (utilisateur == null) {
            return null;
        }
        utilisateur.incrementNbConnexions();
        return record(utilisateur, ActionType.LOGIN, null, "Connexion");
    }
}
