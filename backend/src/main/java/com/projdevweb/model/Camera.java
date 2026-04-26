package com.projdevweb.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/**
 * Caméra de surveillance avec contrôle à distance type produit (Arlo, Reolink) :
 * <ul>
 *   <li>{@code resolution} — qualité (SD / HD / FULL_HD / UHD_4K)</li>
 *   <li>{@code modeCamera} — DAY / NIGHT / AUTO / MOTION_ONLY (économie batterie)</li>
 *   <li>{@code enregistrement} — caméra en train d'enregistrer un flux</li>
 *   <li>{@code visionNocturne} — IR auto activé</li>
 * </ul>
 */
@Entity
@DiscriminatorValue("CAMERA")
public class Camera extends Capteur {

    public enum ResolutionCamera {
        SD("480p"), HD("720p"), FULL_HD("1080p"), UHD_4K("4K");
        private final String label;
        ResolutionCamera(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    public enum ModeCamera {
        AUTO("Auto"),
        DAY("Jour"),
        NIGHT("Nuit (IR)"),
        MOTION_ONLY("Mouvement seul");
        private final String label;
        ModeCamera(String label) { this.label = label; }
        public String getLabel() { return label; }
    }

    @Column(length = 16)
    private String resolution;

    @Column(length = 16)
    private String modeCamera;

    @Column
    private Boolean enregistrement;

    @Column
    private Boolean visionNocturne;

    public Camera() {
        super();
    }

    public Camera(String nom, String marque, Etat etat, Connectivite connectivite,
                  Float batterie, Piece piece, String zone) {
        super(nom, marque, etat, connectivite, batterie, piece, zone);
        this.resolution = ResolutionCamera.FULL_HD.name();
        this.modeCamera = ModeCamera.AUTO.name();
        this.enregistrement = Boolean.FALSE;
        this.visionNocturne = Boolean.TRUE;
    }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public String getModeCamera() { return modeCamera; }
    public void setModeCamera(String modeCamera) { this.modeCamera = modeCamera; }

    public Boolean getEnregistrement() { return enregistrement; }
    public void setEnregistrement(Boolean enregistrement) { this.enregistrement = enregistrement; }

    public Boolean getVisionNocturne() { return visionNocturne; }
    public void setVisionNocturne(Boolean visionNocturne) { this.visionNocturne = visionNocturne; }
}
