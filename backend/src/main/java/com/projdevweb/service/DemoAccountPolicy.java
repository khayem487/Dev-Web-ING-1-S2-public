package com.projdevweb.service;

import com.projdevweb.model.Utilisateur;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

/** Keeps the shared public demo accounts usable for the next visitor. */
@Service
public class DemoAccountPolicy {
    private static final Set<String> SHARED = Set.of(
            "admin@demo.local", "parent@demo.local", "enfant@demo.local", "voisin@demo.local");
    private final boolean demo;

    public DemoAccountPolicy(@Value("${app.demo.enabled:false}") boolean demo) {
        this.demo = demo;
    }

    public void requireEditable(Utilisateur user) {
        if (demo && user.getEmail() != null && SHARED.contains(user.getEmail().toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Ce compte de démonstration partagé est protégé pour les visiteurs suivants. Son profil et ses droits ne peuvent pas être modifiés.");
        }
    }
}
