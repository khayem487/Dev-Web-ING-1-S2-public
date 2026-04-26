package com.projdevweb.repository;

import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    List<Scenario> findByEnabledTrueAndType(ScenarioType type);

    List<Scenario> findAllByOrderByDateCreationAsc();
}
