package com.projdevweb.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Encapsulation du hashing BCrypt. Le {@link PasswordEncoder} est configuré
 * en interne pour éviter d'embarquer toute la stack Spring Security.
 */
@Service
public class PasswordService {

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public String hash(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Mot de passe vide");
        }
        return encoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String hash) {
        if (rawPassword == null || hash == null) {
            return false;
        }
        return encoder.matches(rawPassword, hash);
    }
}
