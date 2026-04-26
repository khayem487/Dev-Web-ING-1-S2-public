package com.projdevweb.dto;

import com.projdevweb.model.Scenario;

import java.time.Instant;
import java.util.List;

public record ScenarioRunResultDTO(
        Long scenarioId,
        String scenarioNom,
        Instant executedAt,
        int actionsApplied,
        List<String> details
) {
    public static ScenarioRunResultDTO of(Scenario s, List<String> details) {
        return new ScenarioRunResultDTO(
                s.getId(),
                s.getNom(),
                s.getDerniereExecution() != null ? s.getDerniereExecution() : Instant.now(),
                details.size(),
                details
        );
    }
}
