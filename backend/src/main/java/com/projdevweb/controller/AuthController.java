package com.projdevweb.controller;

import com.projdevweb.dto.AuthLoginRequest;
import com.projdevweb.dto.AuthRegisterResponse;
import com.projdevweb.dto.AuthResendVerificationRequest;
import com.projdevweb.dto.AuthRegisterRequest;
import com.projdevweb.dto.AuthVerifyEmailRequest;
import com.projdevweb.dto.UserProfileDTO;
import com.projdevweb.model.Enfant;
import com.projdevweb.model.ParentFamille;
import com.projdevweb.model.TypeMembre;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.model.VoisinVisiteur;
import com.projdevweb.repository.UtilisateurRepository;
import com.projdevweb.service.PasswordService;
import com.projdevweb.service.PointsService;
import com.projdevweb.service.SessionUtilisateurService;
import com.projdevweb.service.VerificationEmailService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final SecureRandom RNG = new SecureRandom();

    private final UtilisateurRepository utilisateurRepository;
    private final SessionUtilisateurService sessionUtilisateurService;
    private final PasswordService passwordService;
    private final PointsService pointsService;
    private final VerificationEmailService verificationEmailService;
    private final boolean emailVerificationEnabled;
    private final boolean exposeDebugVerificationToken;

    public AuthController(UtilisateurRepository utilisateurRepository,
                          SessionUtilisateurService sessionUtilisateurService,
                          PasswordService passwordService,
                          PointsService pointsService,
                          VerificationEmailService verificationEmailService,
                          @Value("${app.auth.email-verification-enabled:true}") boolean emailVerificationEnabled,
                          @Value("${app.auth.email-verification-debug-token-enabled:false}") boolean exposeDebugVerificationToken) {
        this.utilisateurRepository = utilisateurRepository;
        this.sessionUtilisateurService = sessionUtilisateurService;
        this.passwordService = passwordService;
        this.pointsService = pointsService;
        this.verificationEmailService = verificationEmailService;
        this.emailVerificationEnabled = emailVerificationEnabled;
        this.exposeDebugVerificationToken = exposeDebugVerificationToken;
    }

    @PostMapping("/register")
    public AuthRegisterResponse register(@Valid @RequestBody AuthRegisterRequest request, HttpSession session) {
        String emailNorm = request.email().trim().toLowerCase(Locale.ROOT);
        if (utilisateurRepository.existsByEmailIgnoreCase(emailNorm)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un compte avec cet email existe déjà");
        }

        TypeMembre type = parseTypeMembre(request.typeMembre());
        String hash = passwordService.hash(request.motDePasse());
        Utilisateur utilisateur = instancier(type,
                request.prenom().trim(),
                request.nom().trim(),
                emailNorm,
                hash);

        boolean verificationRequired = emailVerificationEnabled && !emailNorm.endsWith("@demo.local");
        if (verificationRequired) {
            utilisateur.setEmailVerifie(false);
            utilisateur.setEmailVerificationToken(generateVerificationToken());
            utilisateur.setEmailVerificationExpireAt(Instant.now().plusSeconds(24 * 3600));
            Utilisateur saved = utilisateurRepository.save(utilisateur);

            verificationEmailService.sendVerificationCode(
                    saved.getEmail(),
                    saved.getEmailVerificationToken(),
                    saved.getEmailVerificationExpireAt()
            );

            return AuthRegisterResponse.pending(
                    saved.getEmail(),
                    exposeDebugVerificationToken ? saved.getEmailVerificationToken() : null
            );
        }

        utilisateur.setEmailVerifie(true);
        utilisateur.setEmailVerificationToken(null);
        utilisateur.setEmailVerificationExpireAt(null);

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        Utilisateur withLogin = pointsService.recordLogin(saved);
        sessionUtilisateurService.login(session, withLogin);
        return AuthRegisterResponse.verified(UserProfileDTO.from(withLogin));
    }

    @PostMapping("/login")
    public UserProfileDTO login(@Valid @RequestBody AuthLoginRequest request, HttpSession session) {
        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe invalide"));

        if (!passwordService.matches(request.motDePasse(), utilisateur.getMotDePasse())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe invalide");
        }

        if (emailVerificationEnabled && !utilisateur.isEmailVerifie()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Email non vérifié. Valide le code de vérification avant connexion.");
        }

        Utilisateur withLogin = pointsService.recordLogin(utilisateur);
        sessionUtilisateurService.login(session, withLogin);
        return UserProfileDTO.from(withLogin);
    }

    @PostMapping("/verify-email")
    public UserProfileDTO verifyEmail(@Valid @RequestBody AuthVerifyEmailRequest request,
                                      HttpSession session) {
        String emailNorm = request.email().trim().toLowerCase(Locale.ROOT);
        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(emailNorm)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));

        if (utilisateur.isEmailVerifie()) {
            Utilisateur withLogin = pointsService.recordLogin(utilisateur);
            sessionUtilisateurService.login(session, withLogin);
            return UserProfileDTO.from(withLogin);
        }

        if (utilisateur.getEmailVerificationToken() == null
                || utilisateur.getEmailVerificationExpireAt() == null
                || Instant.now().isAfter(utilisateur.getEmailVerificationExpireAt())
                || !utilisateur.getEmailVerificationToken().equals(request.token().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code de vérification invalide ou expiré");
        }

        utilisateur.setEmailVerifie(true);
        utilisateur.setEmailVerificationToken(null);
        utilisateur.setEmailVerificationExpireAt(null);

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        Utilisateur withLogin = pointsService.recordLogin(saved);
        sessionUtilisateurService.login(session, withLogin);
        return UserProfileDTO.from(withLogin);
    }

    @PostMapping("/resend-verification")
    public Map<String, Object> resendVerification(@Valid @RequestBody AuthResendVerificationRequest request) {
        String emailNorm = request.email().trim().toLowerCase(Locale.ROOT);
        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(emailNorm)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));

        if (utilisateur.isEmailVerifie()) {
            return Map.of("ok", true, "alreadyVerified", true);
        }

        String token = generateVerificationToken();
        utilisateur.setEmailVerificationToken(token);
        utilisateur.setEmailVerificationExpireAt(Instant.now().plusSeconds(24 * 3600));
        Utilisateur saved = utilisateurRepository.save(utilisateur);

        verificationEmailService.sendVerificationCode(
                saved.getEmail(),
                token,
                saved.getEmailVerificationExpireAt()
        );

        Map<String, Object> out = new HashMap<>();
        out.put("ok", true);
        out.put("alreadyVerified", false);
        out.put("email", utilisateur.getEmail());
        if (exposeDebugVerificationToken) {
            out.put("debugToken", token);
        }
        out.put("expiresAt", utilisateur.getEmailVerificationExpireAt());
        return out;
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpSession session) {
        sessionUtilisateurService.logout(session);
        return Map.of("ok", true);
    }

    @GetMapping("/me")
    public UserProfileDTO me(HttpSession session) {
        Utilisateur utilisateur = sessionUtilisateurService.getUserOrNull(session);
        if (utilisateur == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Non connecté");
        }
        return UserProfileDTO.from(utilisateur);
    }

    private static TypeMembre parseTypeMembre(String value) {
        if (value == null || value.isBlank()) {
            return TypeMembre.PARENT_FAMILLE;
        }
        String norm = value.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        try {
            return TypeMembre.valueOf(norm);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "typeMembre invalide (attendu: ENFANT, PARENT_FAMILLE, VOISIN_VISITEUR)");
        }
    }

    private static Utilisateur instancier(TypeMembre type, String prenom, String nom, String email, String hash) {
        return switch (type) {
            case ENFANT -> new Enfant(prenom, nom, email, hash);
            case PARENT_FAMILLE -> new ParentFamille(prenom, nom, email, hash);
            case VOISIN_VISITEUR -> new VoisinVisiteur(prenom, nom, email, hash);
        };
    }

    private static String generateVerificationToken() {
        int token = 100000 + RNG.nextInt(900000);
        return String.valueOf(token);
    }
}
