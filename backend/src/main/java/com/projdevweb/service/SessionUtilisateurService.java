package com.projdevweb.service;

import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.UtilisateurRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
