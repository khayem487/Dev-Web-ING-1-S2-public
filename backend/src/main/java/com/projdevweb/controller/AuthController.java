package com.projdevweb.controller;

import com.projdevweb.dto.AuthLoginRequest;
import com.projdevweb.dto.AuthRegisterRequest;
import com.projdevweb.dto.UserProfileDTO;
import com.projdevweb.model.Utilisateur;
import com.projdevweb.repository.UtilisateurRepository;
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

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;
    private final SessionUtilisateurService sessionUtilisateurService;

    public AuthController(UtilisateurRepository utilisateurRepository,
                          SessionUtilisateurService sessionUtilisateurService) {
        this.utilisateurRepository = utilisateurRepository;
        this.sessionUtilisateurService = sessionUtilisateurService;
    }

    @PostMapping("/register")
    public UserProfileDTO register(@Valid @RequestBody AuthRegisterRequest request, HttpSession session) {
        if (utilisateurRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un compte avec cet email existe déjà");
        }

        Utilisateur utilisateur = new Utilisateur(
                request.prenom().trim(),
                request.nom().trim(),
                request.email().trim().toLowerCase(),
                request.motDePasse()
        );
        utilisateur.addPoints(10); // bonus de création de compte

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        sessionUtilisateurService.login(session, saved);
        return UserProfileDTO.from(saved);
    }

    @PostMapping("/login")
    public UserProfileDTO login(@Valid @RequestBody AuthLoginRequest request, HttpSession session) {
        Utilisateur utilisateur = utilisateurRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe invalide"));

        if (!utilisateur.getMotDePasse().equals(request.motDePasse())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe invalide");
        }

        sessionUtilisateurService.login(session, utilisateur);
        return UserProfileDTO.from(utilisateur);
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
}
