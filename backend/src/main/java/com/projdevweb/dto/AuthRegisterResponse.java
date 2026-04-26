package com.projdevweb.dto;

public record AuthRegisterResponse(
        boolean ok,
        boolean verificationRequired,
        String email,
        String debugToken,
        String message,
        UserProfileDTO user
) {
    public static AuthRegisterResponse verified(UserProfileDTO user) {
        return new AuthRegisterResponse(true, false, user != null ? user.email() : null,
                null, "Compte créé et connecté", user);
    }

    public static AuthRegisterResponse pending(String email, String debugToken) {
        return new AuthRegisterResponse(true, true, email, debugToken,
                "Compte créé. Vérifie ton email avec le code de vérification.", null);
    }
}
