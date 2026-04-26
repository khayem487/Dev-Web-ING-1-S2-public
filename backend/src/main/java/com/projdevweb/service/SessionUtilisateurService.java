package com.projdevweb.service;

import com.projdevweb.model.Niveau;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.UtilisateurRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Gère la session HTTP (cookie JSESSIONID) en stockant uniquement l'id utilisateur.
 *
 * <p>Centralise les guards :
 * <ul>
 *   <li>{@link #requireUser(HttpSession)} → 401 si non connecté</li>
 *   <li>{@link #requireAtLeast(HttpSession, Niveau)} → 403 si niveau insuffisant</li>
 *   <li>{@link #requireAvance(HttpSession)} → 403 si niveau &lt; AVANCE (gestion)</li>
 * </ul>
 */
@Service
public class SessionUtilisateurService {

    private static final String SESSION_USER_ID = "SESSION_USER_ID";

    private final UtilisateurRepository utilisateurRepository;

    public SessionUtilisateurService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    public Utilisateur requireUser(HttpSession session) {
        Object value = session.getAttribute(SESSION_USER_ID);
        if (!(value instanceof Long userId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur non connecté");
        }
        return utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session invalide"));
    }

    public Utilisateur requireAtLeast(HttpSession session, Niveau requis) {
        Utilisateur utilisateur = requireUser(session);
        if (requis != null && !utilisateur.getNiveau().atLeast(requis)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Accès refusé : niveau " + requis + " requis (actuel : " + utilisateur.getNiveau() + ")"
            );
        }
        return utilisateur;
    }

    public Utilisateur requireAvance(HttpSession session) {
        return requireAtLeast(session, Niveau.AVANCE);
    }

    public Utilisateur requireAdmin(HttpSession session) {
        Utilisateur utilisateur = requireUser(session);
        if (!utilisateur.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé : admin requis");
        }
        return utilisateur;
    }

    public Utilisateur getUserOrNull(HttpSession session) {
        Object value = session.getAttribute(SESSION_USER_ID);
        if (!(value instanceof Long userId)) {
            return null;
        }
        return utilisateurRepository.findById(userId).orElse(null);
    }

    public void login(HttpSession session, Utilisateur utilisateur) {
        session.setAttribute(SESSION_USER_ID, utilisateur.getId());
    }

    public void logout(HttpSession session) {
        session.removeAttribute(SESSION_USER_ID);
    }
}
