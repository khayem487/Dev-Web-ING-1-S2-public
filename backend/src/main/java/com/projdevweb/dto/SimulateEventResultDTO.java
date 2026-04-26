package com.projdevweb.dto;

import java.util.List;

public record SimulateEventResultDTO(
        Long objetId,
        String event,
        int scenariosTriggered,
        List<String> scenarioNames
) {
}

