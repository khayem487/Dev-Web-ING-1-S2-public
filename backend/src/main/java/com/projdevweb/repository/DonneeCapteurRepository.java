package com.projdevweb.repository;

import com.projdevweb.model.DonneeCapteur;
import com.projdevweb.model.ObjetConnecte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DonneeCapteurRepository extends JpaRepository<DonneeCapteur, Long> {
    List<DonneeCapteur> findTop20ByObjetOrderByTimestampDesc(ObjetConnecte objet);

    DonneeCapteur findTop1ByObjetOrderByTimestampDesc(ObjetConnecte objet);

    @Modifying
    @Query("delete from DonneeCapteur d where d.objet = :objet")
    int deleteByObjet(@Param("objet") ObjetConnecte objet);
}
