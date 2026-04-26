package com.projdevweb.repository;

import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.ScenarioAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScenarioActionRepository extends JpaRepository<ScenarioAction, Long> {

    /**
     * Détache la FK objet sur les actions de scénarios pointant vers un objet
     * en cours de suppression — préserve l'historique côté Scenario sans
     * empêcher la suppression de l'ObjetConnecte.
     */
    @Modifying
    @Query("delete from ScenarioAction a where a.objet = :objet")
    int deleteByObjet(@Param("objet") ObjetConnecte objet);
}
