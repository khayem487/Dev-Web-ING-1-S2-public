package com.projdevweb.controller;

import com.projdevweb.dto.AuthLoginRequest;
import com.projdevweb.dto.AuthRegisterRequest;
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
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;
    private final SessionUtilisateurService sessionUtilisateurService;
    private final PasswordService passwordService;
    private final PointsService pointsService;

    public AuthController(UtilisateurRepository utilisateurRepository,
                          SessionUtilisateurService sessionUtilisateurService,
                          PasswordService passwordService,
                          PointsService pointsService) {
        this.utilisateurRepository = utilisateurRepository;
        this.sessionUtilisateurService = sessionUtilisateurService;
        this.passwordService = passwordService;
        this.pointsService = pointsService;
    }

    @PostMapping("/register")
    public UserProfileDTO register(@Valid @RequestBody AuthRegisterRequest request, HttpSession session) {
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

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        // Connexion immédiate après inscription
        Utilisateur withLogin = pointsService.recordLogin(saved);
        sessionUtilisateurService.login(session, withLogin);
        return UserProfileDTO.from(withLogin);
    }

    @PostMapping("/login")
    public UserProfileDTO login(@Valid @RequestBody AuthLoginRequest request, HttpSession session) {
        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe invalide"));

        if (!passwordService.matches(request.motDePasse(), utilisateur.getMotDePasse())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe invalide");
        }

        Utilisateur withLogin = pointsService.recordLogin(utilisateur);
        sessionUtilisateurService.login(session, withLogin);
        return UserProfileDTO.from(withLogin);
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
}
