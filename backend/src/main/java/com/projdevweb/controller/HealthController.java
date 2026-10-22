package com.projdevweb.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final boolean demo;
    private final boolean registrationEnabled;
    private final boolean schedulerEnabled;
    private final boolean externalDatabase;

    public HealthController(@Value("${app.demo.enabled:false}") boolean demo,
                            @Value("${app.auth.registration-enabled:true}") boolean registrationEnabled,
                            @Value("${app.scheduler.enabled:true}") boolean schedulerEnabled,
                            @Value("${spring.datasource.url}") String datasourceUrl) {
        this.demo = demo;
        this.registrationEnabled = registrationEnabled;
        this.schedulerEnabled = schedulerEnabled;
        this.externalDatabase = datasourceUrl.startsWith("jdbc:mysql:") || datasourceUrl.startsWith("jdbc:postgresql:");
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "maison-intelligente",
                "timestamp", Instant.now().toString(),
                "demo", demo,
                "registrationEnabled", registrationEnabled,
                "schedulerEnabled", schedulerEnabled,
                "storage", externalDatabase ? "external-database" : (demo ? "ephemeral-demo" : "local-h2")
        );
    }
}
