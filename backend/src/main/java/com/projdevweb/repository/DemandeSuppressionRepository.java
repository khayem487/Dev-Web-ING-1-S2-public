package com.projdevweb.repository;

import com.projdevweb.model.DemandeSuppression;
import com.projdevweb.model.DemandeSuppressionStatus;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DemandeSuppressionRepository extends JpaRepository<DemandeSuppression, Long> {
    List<DemandeSuppression> findAllByDemandeurOrderByCreatedAtDesc(Utilisateur demandeur);

    List<DemandeSuppression> findAllByOrderByCreatedAtDesc();

    List<DemandeSuppression> findAllByStatusOrderByCreatedAtDesc(DemandeSuppressionStatus status);

    boolean existsByDemandeurAndObjetAndStatus(Utilisateur demandeur,
                                               ObjetConnecte objet,
                                               DemandeSuppressionStatus status);

    long deleteByDemandeur(Utilisateur demandeur);

    @Modifying
    @Query("update DemandeSuppression d set d.traitePar = null where d.traitePar = :utilisateur")
    int detachTraitePar(@Param("utilisateur") Utilisateur utilisateur);
}
