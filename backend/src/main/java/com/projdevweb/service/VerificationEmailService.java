package com.projdevweb.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class VerificationEmailService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Europe/Paris"));

    private final JavaMailSender mailSender;
    private final String smtpHost;
    private final String from;
    private final String appName;

    public VerificationEmailService(JavaMailSender mailSender,
                                    @Value("${spring.mail.host:}") String smtpHost,
                                    @Value("${app.mail.from:no-reply@maison-connectee.local}") String from,
                                    @Value("${app.mail.app-name:Maison Intelligente}") String appName) {
        this.mailSender = mailSender;
        this.smtpHost = smtpHost == null ? "" : smtpHost.trim();
        this.from = from;
        this.appName = appName;
    }

    public void sendVerificationCode(String to, String token, Instant expiresAt) {
        if (smtpHost.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Envoi email non configuré (SMTP). Configure APP_MAIL_HOST/APP_MAIL_USERNAME/APP_MAIL_PASSWORD.");
        }

        SimpleMailMessage msg = new SimpleMailMessage();
        if (from != null && !from.isBlank()) {
            msg.setFrom(from);
        }
        msg.setTo(to);
        msg.setSubject("Code de vérification — " + appName);
        msg.setText(buildBody(token, expiresAt));

        try {
            mailSender.send(msg);
        } catch (MailException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Impossible d'envoyer l'email de vérification. Vérifie la config SMTP.");
        }
    }

    private static String buildBody(String token, Instant expiresAt) {
        String expiry = expiresAt == null ? "(non défini)" : DATE_FMT.format(expiresAt);
        return "Bonjour,\n\n"
                + "Voici ton code de vérification: " + token + "\n\n"
                + "Ce code expire le " + expiry + " (heure de Paris).\n"
                + "Si tu n'es pas à l'origine de cette inscription, ignore ce message.\n\n"
                + "— Maison Intelligente";
    }
}
