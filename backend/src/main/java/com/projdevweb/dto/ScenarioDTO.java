package com.projdevweb.dto;

import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioType;

import java.time.Instant;
import java.util.List;

public record ScenarioDTO(
        Long id,
        String nom,
        String description,
        String icon,
        ScenarioType type,
        String cron,
        String condition,
        Boolean enabled,
        Instant dateCreation,
        Instant derniereExecution,
        List<ScenarioActionDTO> actions
) {
    public static ScenarioDTO from(Scenario s) {
        return new ScenarioDTO(
                s.getId(),
                s.getNom(),
                s.getDescription(),
                s.getIcon(),
                s.getType(),
                s.getCron(),
                s.getCondition(),
                s.getEnabled(),
                s.getDateCreation(),
                s.getDerniereExecution(),
                s.getActions().stream().map(ScenarioActionDTO::from).toList()
        );
    }
}
