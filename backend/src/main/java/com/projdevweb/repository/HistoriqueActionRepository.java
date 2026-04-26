package com.projdevweb.repository;

import com.projdevweb.model.HistoriqueAction;
import com.projdevweb.model.ObjetConnecte;
import com.projdevweb.model.Utilisateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HistoriqueActionRepository extends JpaRepository<HistoriqueAction, Long> {

    Page<HistoriqueAction> findAllByOrderByTimestampDesc(Pageable pageable);

    List<HistoriqueAction> findByObjet(ObjetConnecte objet);

    long countByUtilisateur(Utilisateur utilisateur);

    @Modifying
    @Query("update HistoriqueAction h set h.objet = null where h.objet = :objet")
    int detachObjet(@Param("objet") ObjetConnecte objet);
}
