package com.projdevweb.repository;

import com.projdevweb.model.Scenario;
import com.projdevweb.model.ScenarioTriggerEvent;
import com.projdevweb.model.ScenarioType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScenarioRepository extends JpaRepository<Scenario, Long> {
    List<Scenario> findByEnabledTrueAndType(ScenarioType type);

    List<Scenario> findAllByOrderByDateCreationAsc();

    @Query("""
            select s from Scenario s
            where s.enabled = true
              and s.type = com.projdevweb.model.ScenarioType.CONDITIONAL
              and s.triggerEvent = :event
              and (s.triggerObjetId is null or s.triggerObjetId = :objetId)
            """)
    List<Scenario> findConditionalByEventAndObjet(@Param("event") ScenarioTriggerEvent event,
                                                   @Param("objetId") Long objetId);
}
