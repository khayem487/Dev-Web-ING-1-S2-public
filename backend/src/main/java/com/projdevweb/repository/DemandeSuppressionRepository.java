package com.projdevweb.repository;

import com.projdevweb.model.DemandeSuppression;
import com.projdevweb.model.DemandeSuppressionStatus;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DemandeSuppressionRepository extends JpaRepository<DemandeSuppression, Long> {
    List<DemandeSuppression> findAllByDemandeurOrderByCreatedAtDesc(Utilisateur demandeur);

    List<DemandeSuppression> findAllByOrderByCreatedAtDesc();

    List<DemandeSuppression> findAllByStatusOrderByCreatedAtDesc(DemandeSuppressionStatus status);

    boolean existsByDemandeurAndObjetAndStatus(Utilisateur demandeur,
                                               ObjetConnecte objet,
                                               DemandeSuppressionStatus status);
}
