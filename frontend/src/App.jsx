import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const ACCENT = '#ffb547'
const HOUSE_NAME = 'Famille Martin'

/* ─── DATA ──────────────────────────────────────── */
const ROOM_ICONS = {
  Salon: '🛋', Cuisine: '🍳', Chambre: '🛏', 'Chambre parentale': '🛏',
  'Salle de bain': '🛁', Garage: '🚗', Toilettes: '🚽',
}

const PIECES = [
  { id:1, nom:'Salon', surface:28, type:'Salon', icon:'🛋' },
  { id:2, nom:'Cuisine', surface:14, type:'Cuisine', icon:'🍳' },
  { id:3, nom:'Chambre', surface:18, type:'Chambre', icon:'🛏' },
  { id:4, nom:'Salle de bain', surface:7, type:'SalleDeBain', icon:'🛁' },
  { id:5, nom:'Garage', surface:22, type:'Garage', icon:'🚗' },
  { id:6, nom:'Toilettes', surface:3, type:'Toilettes', icon:'🚽' },
];

// UML taxonomy: maps every concrete type to its branche, service, icon, and UML methods.
// Sourced from CONTEXTE_PROJET_DEV_WEB.md §7 and matches backend ObjetConnecteDTO branche/service rules.
const TYPE_TAXONOMY = {
  // Ouvrant (Acces)
  Porte:        { branche:'Ouvrant',     service:'Acces',        icon:'door',     methodes:['ouvrir()','fermer()','setPosition()'] },
  Volet:        { branche:'Ouvrant',     service:'Acces',        icon:'volet',    methodes:['ouvrir()','fermer()','setPosition()'] },
  Fenetre:      { branche:'Ouvrant',     service:'Acces',        icon:'window',   methodes:['ouvrir()','fermer()','setPosition()'] },
  PorteGarage:  { branche:'Ouvrant',     service:'Acces',        icon:'door-g',   methodes:['ouvrir()','fermer()','setPosition()'] },
  // Capteur (Surveillance)
  Thermostat:   { branche:'Capteur',     service:'Surveillance', icon:'thermo',   methodes:['lire()','setTemperature()','chauffer()'] },
  Climatiseur:  { branche:'Capteur',     service:'Surveillance', icon:'cool',     methodes:['lire()','setVitesse()'] },
  Camera:       { branche:'Capteur',     service:'Surveillance', icon:'cam',      methodes:['lire()','voirFlux()'] },
  Alarme:       { branche:'Capteur',     service:'Surveillance', icon:'alarm',    methodes:['lire()','alerter()','tester()'] },
  DetecteurMouvement: { branche:'Capteur', service:'Surveillance', icon:'motion', methodes:['lire()','detecter()'] },
  // Appareil (Confort)
  LaveLinge:    { branche:'Appareil',    service:'Confort',      icon:'wash',     methodes:['demarrer()','arreter()','setCycle()'] },
  SecheLinge:   { branche:'Appareil',    service:'Confort',      icon:'wash',     methodes:['demarrer()','arreter()','setCycle()'] },
  LaveVaisselle:{ branche:'Appareil',    service:'Confort',      icon:'wash',     methodes:['demarrer()','arreter()','setCycle()'] },
  MachineCafe:  { branche:'Appareil',    service:'Confort',      icon:'coffee',   methodes:['demarrer()','arreter()','programmer()'] },
  Television:   { branche:'Appareil',    service:'Confort',      icon:'tv',       methodes:['demarrer()','arreter()','setChaine()'] },
  Enceinte:     { branche:'Appareil',    service:'Confort',      icon:'tv',       methodes:['demarrer()','arreter()','setSource()'] },
  Aspirateur:   { branche:'Appareil',    service:'Confort',      icon:'vacuum',   methodes:['demarrer()','arreter()'] },
  Arrosage:     { branche:'Appareil',    service:'Confort',      icon:'water',    methodes:['demarrer()','arreter()'] },
  Reveil:       { branche:'Appareil',    service:'Confort',      icon:'alarm',    methodes:['demarrer()','arreter()','programmer()'] },
  // BesoinAnimal (Animal)
  Eau:          { branche:'BesoinAnimal', service:'Animal',      icon:'water',    methodes:['verifierNiveau()','remplir()'] },
  Nourriture:   { branche:'BesoinAnimal', service:'Animal',      icon:'food',     methodes:['verifierNiveau()','distribuer()','programmer()'] },
}

const ICONS = Object.fromEntries(Object.entries(TYPE_TAXONOMY).map(([k, v]) => [k, v.icon]))

// Backend Niveau.fromPoints() : 0–3 = DEBUTANT, 3–10 = INTERMEDIAIRE, 10+ = AVANCE.
const NIVEAUX = [
  { code:'Débutant',      seuil:0 },
  { code:'Intermédiaire', seuil:3 },
  { code:'Avancé',        seuil:10 },
];

const PAGES = [
  { id:'home', label:'Accueil', icon:'home' },
  { id:'recherche', label:'Recherche', icon:'search' },
  { id:'visualisation', label:'Mes objets', icon:'grid' },
  { id:'gestion', label:'Gestion', icon:'settings' },
  { id:'admin', label:'Administration', icon:'lock', adminOnly:true },
];

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
// Types creatable via POST /api/gestion/objets (backend GestionController#buildByType)
const GESTION_TYPE_OPTIONS = [
  'Porte', 'PorteGarage', 'Volet', 'Fenetre',
  'Thermostat', 'Camera', 'DetecteurMouvement',
  'Television', 'LaveLinge', 'SecheLinge', 'LaveVaisselle',
  'MachineCafe', 'Enceinte', 'Aspirateur', 'Arrosage', 'Reveil', 'Climatiseur', 'Alarme',
  'Nourriture', 'Eau'
]
const OUVRANT_TYPES = new Set(['Porte', 'PorteGarage', 'Volet', 'Fenetre'])
const DEMO_CREDENTIALS = [
  { email: 'parent@demo.local', motDePasse: 'demo1234', label: 'ParentFamille', niveauMax: 'Avancé' },
  { email: 'enfant@demo.local', motDePasse: 'demo1234', label: 'Enfant', niveauMax: 'Intermédiaire' },
  { email: 'voisin@demo.local', motDePasse: 'demo1234', label: 'VoisinVisiteur', niveauMax: 'Débutant' },
  { email: 'admin@demo.local', motDePasse: 'demo1234', label: 'Admin', niveauMax: 'Avancé' },
]

const PAGE_STORAGE_KEY = 'devweb.currentPage'

const SCENARIO_TYPES = ['MANUAL', 'SCHEDULED', 'CONDITIONAL']
const SCENARIO_TRIGGER_EVENTS = [
  { code: 'MOTION_DETECTED', label: 'Mouvement détecté' },
  { code: 'BATTERY_LOW', label: 'Batterie faible' },
  { code: 'TEMP_BELOW', label: 'Température basse' },
]
const CRON_PRESETS = [
  { label: 'Tous les jours à 8h00', cron: '0 0 8 * * *' },
  { label: 'Lundi-vendredi à 8h00', cron: '0 0 8 * * MON-FRI' },
  { label: 'Tous les jours à 22h00', cron: '0 0 22 * * *' },
  { label: 'Samedi/dimanche à 10h00', cron: '0 0 10 * * SAT,SUN' },
  { label: 'Toutes les heures', cron: '0 0 * * * *' },
]

function humanCron(cron) {
  if (!cron) return ''
  const preset = CRON_PRESETS.find((p) => p.cron === cron)
  return preset ? preset.label : cron
}

function toApiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path}`
}

async function fetchJson(url, options = {}) {
  const response = await fetch(toApiUrl(url), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
      `HTTP ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

function normalizeEnumLabel(value) {
  if (!value) return ''
  const v = String(value)
  return v
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (x) => x.toUpperCase())
    .replace('Intermediaire', 'Intermédiaire')
    .replace('Debutant', 'Débutant')
    .replace('Avance', 'Avancé')
}

function toUiUser(user) {
  if (!user) return null
  const prenom = user.prenom || ''
  const nom = user.nom || ''
  const initials = `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase() || 'U'
  return {
    ...user,
    pseudo: user.pseudo || (user.email ? user.email.split('@')[0] : 'user'),
    photo: initials,
    photoDataUrl: user.photoDataUrl || null,
    admin: Boolean(user.admin || user.isAdmin),
    typeMembre: normalizeEnumLabel(user.typeMembre) || user.typeMembre,
    niveau: normalizeEnumLabel(user.niveau) || user.niveau,
    niveauMax: normalizeEnumLabel(user.niveauMax) || user.niveauMax,
    points: Number(user.points || 0)
  }
}

function taxonomyFor(type) {
  return TYPE_TAXONOMY[type] || { branche:'ObjetConnecte', service:'General', icon:'grid', methodes:['activer()','desactiver()'] }
}

// Catalogues produit miroirs des enums backend (LaveLinge.ProgrammeLavage, etc.)
const PROGRAMMES_LAVAGE = [
  { code: 'ECO_40',     label: 'Eco 40°C',           dureeMin: 120, temp: 40, essorage: 1000 },
  { code: 'COTON_60',   label: 'Coton 60°C',         dureeMin: 150, temp: 60, essorage: 1400 },
  { code: 'EXPRESS_30', label: 'Express 30°C',       dureeMin: 30,  temp: 30, essorage: 1200 },
  { code: 'SYNTH_30',   label: 'Synthétique 30°C',   dureeMin: 90,  temp: 30, essorage: 800 },
  { code: 'DELICAT',    label: 'Délicat 20°C',       dureeMin: 60,  temp: 20, essorage: 600 },
  { code: 'RINCAGE',    label: 'Rinçage',            dureeMin: 25,  temp: 30, essorage: 1000 },
  { code: 'ESSORAGE',   label: 'Essorage seul',      dureeMin: 15,  temp: 0,  essorage: 1400 },
]

const SOURCES_TV = [
  { code: 'LIVE_TV', label: 'Direct'    },
  { code: 'NETFLIX', label: 'Netflix'   },
  { code: 'YOUTUBE', label: 'YouTube'   },
  { code: 'DISNEY',  label: 'Disney+'   },
  { code: 'SPOTIFY', label: 'Spotify'   },
  { code: 'HDMI1',   label: 'HDMI 1'    },
  { code: 'HDMI2',   label: 'HDMI 2'    },
]

const MODES_THERMOSTAT = [
  { code: 'AUTO',    label: 'Auto'     },
  { code: 'CHAUFFE', label: 'Chauffage'},
  { code: 'ECO',     label: 'Éco'      },
  { code: 'OFF',     label: 'Arrêt'    },
]

const MODES_CLIM = [
  { code: 'AUTO',         label: 'Auto',        icon: '🌡' },
  { code: 'FROID',        label: 'Froid',       icon: '❄' },
  { code: 'CHAUD',        label: 'Chaud',       icon: '🔥' },
  { code: 'VENTILATION',  label: 'Ventilation', icon: '💨' },
]

const STATUTS_ALARME = [
  { code: 'DESARMEE', label: 'Désarmée',         color: 'var(--text-3)', icon: '🟢' },
  { code: 'ARMEE',    label: 'Armée',            color: 'var(--green)',  icon: '🛡' },
  { code: 'ALERTE',   label: '⚠ Alerte intrusion', color: 'var(--red)',  icon: '🚨' },
]

const RESOLUTIONS_CAMERA = [
  { code: 'SD',      label: 'SD 480p'  },
  { code: 'HD',      label: 'HD 720p'  },
  { code: 'FULL_HD', label: 'Full HD'  },
  { code: 'UHD_4K',  label: '4K UHD'   },
]

const MODES_CAMERA = [
  { code: 'AUTO',         label: 'Auto',           icon: '🎯' },
  { code: 'DAY',          label: 'Jour',           icon: '☀' },
  { code: 'NIGHT',        label: 'Nuit IR',        icon: '🌙' },
  { code: 'MOTION_ONLY',  label: 'Mouvement seul', icon: '👁' },
]

const PRESETS_VOLET = [
  { value: 0,   label: 'Fermé'    },
  { value: 25,  label: '25%'      },
  { value: 50,  label: '50%'      },
  { value: 75,  label: '75%'      },
  { value: 100, label: 'Ouvert'   },
]

/**
 * Étiquette d'état type-aware. Sépare la sémantique métier ("Ouvert 50%",
 * "Cycle Eco 40°C · 38 min", "OK 58%") du brut ACTIF/INACTIF qui n'a aucun
 * sens pour un Volet ou un distributeur.
 */
function displayEtat(o) {
  if (!o) return ''
  const etat = o.etat
  const branche = o.branche
  const type = o.type

  if (branche === 'Ouvrant') {
    const pos = Number(o.position ?? 0)
    if (pos <= 5) return 'Fermé'
    if (pos >= 95) return 'Ouvert'
    return `Ouvert ${pos}%`
  }

  if (branche === 'Capteur') {
    if (type === 'Thermostat' && o.tempCible != null) {
      const mode = (MODES_THERMOSTAT.find((m) => m.code === o.mode)?.label) || ''
      return etat === 'ACTIF' ? `Consigne ${o.tempCible}°C${mode ? ' · ' + mode : ''}` : 'Désactivé'
    }
    if (type === 'Camera') {
      if (etat !== 'ACTIF') return 'Désactivée'
      if (o.enregistrement) return '● REC en direct'
      const m = MODES_CAMERA.find((x) => x.code === o.modeCamera)
      return m ? `${m.icon} ${m.label}` : 'Surveille'
    }
    if (type === 'DetecteurMouvement') {
      if (etat !== 'ACTIF') return 'Désactivé'
      if (o.derniereDetectionAt) {
        const ms = Date.now() - new Date(o.derniereDetectionAt).getTime()
        if (ms < 60_000) return '⚡ Mouvement détecté'
        if (ms < 600_000) return `Calme · ${Math.floor(ms/60000)} min`
      }
      return `Surveille · sens. ${o.sensibilite ?? 5}/10`
    }
    return etat === 'ACTIF' ? 'Surveille' : 'Désactivé'
  }

  if (branche === 'Appareil') {
    if (etat !== 'ACTIF') return 'À l\'arrêt'
    if (type === 'LaveLinge') {
      const prog = PROGRAMMES_LAVAGE.find((p) => p.code === o.programme)
      const label = prog ? prog.label : (o.cycle || 'Cycle')
      return o.dureeRestante != null && o.dureeRestante > 0
        ? `${label} · ${o.dureeRestante} min`
        : `${label} · prêt`
    }
    if (type === 'Television') {
      const src = SOURCES_TV.find((s) => s.code === o.source)
      if (src && src.code !== 'LIVE_TV') return `${src.label} · vol ${o.volume ?? 0}`
      return `Chaîne ${o.chaine ?? 1} · vol ${o.volume ?? 0}`
    }
    if (type === 'Climatiseur') {
      const m = MODES_CLIM.find((x) => x.code === o.mode)
      const target = o.tempCible != null ? Math.round(o.tempCible) : null
      if (m && target != null) return `${m.icon} ${m.label} · ${target}°C`
      if (m) return `${m.icon} ${m.label}`
      return target != null ? `${target}°C` : 'En marche'
    }
    if (type === 'Alarme') {
      const s = STATUTS_ALARME.find((x) => x.code === o.alarmeStatut)
      return s ? s.label : (etat === 'ACTIF' ? 'Armée' : 'Désarmée')
    }
    return 'En marche'
  }

  if (branche === 'BesoinAnimal') {
    const niv = Number(o.niveauReservoir ?? o.niveau ?? 0)
    if (etat !== 'ACTIF') return `Hors service · ${Math.round(niv)}%`
    if (niv < 20) return `⚠ Vide · ${Math.round(niv)}%`
    if (niv < 50) return `À recharger · ${Math.round(niv)}%`
    return `OK · ${Math.round(niv)}%`
  }

  return etat === 'ACTIF' ? 'Actif' : 'Inactif'
}

// Methods we can actually invoke against the existing backend.
// Setters (setTemperature/setCycle/...) are display-only — no dedicated endpoint yet.
const ACTIVATING_METHODS = new Set(['ouvrir()', 'demarrer()', 'activer()', 'remplir()', 'distribuer()'])
const DEACTIVATING_METHODS = new Set(['fermer()', 'arreter()', 'desactiver()'])

function isMethodActionable(method, obj) {
  if (!obj) return false
  if (ACTIVATING_METHODS.has(method)) return obj.etat !== 'ACTIF'
  if (DEACTIVATING_METHODS.has(method)) return obj.etat === 'ACTIF'
  return false
}

function methodToEtat(method) {
  if (ACTIVATING_METHODS.has(method)) return 'ACTIF'
  if (DEACTIVATING_METHODS.has(method)) return 'INACTIF'
  return null
}

function toUiItem(item) {
  const id = Number(item?.id || 0)
  const type = item?.type || 'Objet'
  const tax = taxonomyFor(type)
  const prefix = String(type).slice(0, 2).toUpperCase()
  const enriched = {
    ...item,
    id,
    type,
    code: item?.code || `${prefix}-${String(id).padStart(3, '0')}`,
    branche: item?.branche || tax.branche,
    service: item?.service || tax.service,
    pieceNom: item?.pieceNom || 'Maison',
    marque: item?.marque || 'N/A',
    connectivite: item?.connectivite || 'WIFI',
    batterie: item?.batterie == null ? null : Number(item.batterie),
    // Préserver les valeurs vivantes type-spécifiques renvoyées par le backend
    position: item?.position == null ? null : Number(item.position),
    cycle: item?.cycle ?? null,
    programme: item?.programme ?? null,
    tempLavage: item?.tempLavage == null ? null : Number(item.tempLavage),
    vitesseEssorage: item?.vitesseEssorage == null ? null : Number(item.vitesseEssorage),
    dureeRestante: item?.dureeRestante == null ? null : Number(item.dureeRestante),
    chaine: item?.chaine == null ? null : Number(item.chaine),
    volume: item?.volume == null ? null : Number(item.volume),
    source: item?.source ?? null,
    tempCible: item?.tempCible == null ? null : Number(item.tempCible),
    mode: item?.mode ?? null,
    niveauReservoir: item?.niveauReservoir == null ? (item?.niveau == null ? null : Number(item.niveau)) : Number(item.niveauReservoir),
    animal: item?.animal ?? null,
    portionGrammes: item?.portionGrammes == null ? null : Number(item.portionGrammes),
    prochaineDistribution: item?.prochaineDistribution ?? null,
    derniereDistribution: item?.derniereDistribution ?? null,
    // Alarme
    alarmeStatut: item?.alarmeStatut ?? null,
    alarmeZones: item?.alarmeZones ?? null,
    alarmeCodePin: item?.alarmeCodePin ?? null,
    derniereAlerte: item?.derniereAlerte ?? null,
    // Camera
    resolution: item?.resolution ?? null,
    modeCamera: item?.modeCamera ?? null,
    enregistrement: item?.enregistrement == null ? null : Boolean(item.enregistrement),
    visionNocturne: item?.visionNocturne == null ? null : Boolean(item.visionNocturne),
    // DetecteurMouvement
    sensibilite: item?.sensibilite == null ? null : Number(item.sensibilite),
    derniereDetectionAt: item?.derniereDetectionAt ?? null,
    totalDetections: item?.totalDetections == null ? null : Number(item.totalDetections),
  }
  // Étiquette d'état type-aware (calculée APRÈS l'enrichissement pour avoir les champs nouveaux dispo)
  enriched.statusLabel = displayEtat(enriched)
  // valeur conservée pour rétro-compat — sert de gros chiffre dans le DetailDrawer Lecture en direct
  enriched.valeur = enriched.statusLabel
  return enriched
}

function historyToUiItem(h, idx = 0) {
  return {
    id: h?.id || Date.now() + idx,
    action: h?.action || 'ACTION',
    objetNom: h?.objetNom || 'Objet',
    code: h?.codeObjet || h?.typeObjet || 'OBJ',
    utilisateur: h?.utilisateurEmail ? h.utilisateurEmail.split('@')[0] : 'system',
    details: h?.details || null,
    timestamp: h?.timestamp || Date.now()
  }
}

/* ─── ICONOGRAPHY ─────────────────────────────── */
function Icon({ name, size=18 }) {
  const s = { width: size, height: size, stroke:'currentColor', fill:'none', strokeWidth: 1.7, strokeLinecap:'round', strokeLinejoin:'round' };
  const p = {
    home: <><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-3v-7H10v7H7a2 2 0 01-2-2v-9z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    thermo: <><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4 4 0 105 0z"/></>,
    cam: <><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></>,
    'door-g': <><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18"/></>,
    volet: <><rect x="3" y="3" width="18" height="18"/><path d="M3 8h18M3 13h18M3 18h18"/></>,
    wash: <><rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><circle cx="7" cy="6" r="0.5" fill="currentColor"/></>,
    tv: <><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M17 3l-5 4-5-4"/></>,
    water: <><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z"/></>,
    food: <><path d="M3 2v6c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2V2M5 10v12M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></>,
    alarm: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3"/></>,
    coffee: <><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></>,
    door: <><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M14 12v.01"/></>,
    cool: <><path d="M12 2v20M6.34 6.34l11.32 11.32M2 12h20M17.66 6.34L6.34 17.66"/></>,
    window: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/></>,
    motion: <><circle cx="12" cy="5" r="2"/><path d="M10 22v-6l-2-3 2-4 4 1 3 4M14 22v-7"/></>,
    vacuum: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
    power: <><path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    close: <><path d="M18 6L6 18M6 6l12 12"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bolt: <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
    wifi: <><path d="M5 12.55a11 11 0 0114 0M8.53 16.11a6 6 0 016.95 0M12 20h.01M1.42 9a16 16 0 0121.16 0"/></>,
    bt: <><path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    chevR: <><path d="M9 18l6-6-6-6"/></>,
    bell: <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    log: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></>,
    chart: <><path d="M3 3v18h18M7 14l4-4 4 4 5-5"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{p[name] || p.grid}</svg>;
}

/* ─── ROOM CHIP ─────────────────────────────── */
function RoomChip({ room, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'10px 14px', borderRadius:99, border:'1px solid var(--line-2)',
      background: active ? 'var(--accent)' : 'var(--surface)',
      color: active ? '#0e1116' : 'var(--text)',
      display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:500,
      transition:'all .15s',
    }}>
      <span style={{ fontSize:16 }}>{room.icon}</span>{room.nom}
      {count != null && <span className="mono num" style={{
        fontSize:11, padding:'2px 6px', borderRadius:99,
        background: active ? 'rgba(14,17,22,.15)' : 'var(--bg-3)',
        color: active ? '#0e1116' : 'var(--text-2)',
      }}>{count}</span>}
    </button>
  );
}

/**
 * Mini-pill type-aware affichant l'état "humainement compréhensible" :
 * Ouvert/Fermé pour Ouvrant, Cycle/Arrêt pour Appareil, Surveille/Off pour Capteur, OK/Vide pour BesoinAnimal.
 */
function pillForObj(obj) {
  const active = obj.etat === 'ACTIF'
  if (obj.branche === 'Ouvrant') {
    const pos = Number(obj.position ?? 0)
    if (pos <= 5) return { text: 'FERMÉ', color: 'var(--text-4)', dot: 'var(--text-4)' }
    if (pos >= 95) return { text: 'OUVERT', color: 'var(--green)', dot: 'var(--green)' }
    return { text: `${pos}%`, color: 'var(--accent)', dot: 'var(--accent)' }
  }
  if (obj.branche === 'BesoinAnimal' && active) {
    const niv = Number(obj.niveauReservoir ?? obj.niveau ?? 0)
    if (niv < 20) return { text: 'VIDE', color: 'var(--red)', dot: 'var(--red)' }
    if (niv < 50) return { text: 'BAS', color: 'var(--accent)', dot: 'var(--accent)' }
    return { text: 'OK', color: 'var(--green)', dot: 'var(--green)' }
  }
  if (obj.branche === 'Appareil' && active && obj.type === 'LaveLinge' && obj.dureeRestante != null && obj.dureeRestante > 0) {
    return { text: `${obj.dureeRestante}m`, color: 'var(--accent)', dot: 'var(--accent)' }
  }
  return { text: active ? 'ON' : 'OFF', color: active ? 'var(--green)' : 'var(--text-4)', dot: active ? 'var(--green)' : 'var(--text-4)' }
}

/* ─── DEVICE TILE ─────────────────────────────── */
function DeviceTile({ obj, onClick, actions, compact }) {
  const active = obj.etat === 'ACTIF';
  const isOuvrant = obj?.branche === 'Ouvrant'
  const activeVisual = active && !isOuvrant
  const lowBat = obj.batterie != null && obj.batterie < 20;
  const pill = pillForObj(obj);
  const statusText = obj.statusLabel || displayEtat(obj);
  const showPowerToggle = Boolean(actions) && obj?.branche !== 'Ouvrant';
  return (
    <article onClick={onClick} style={{
      cursor: onClick ? 'pointer' : 'default', position:'relative',
      borderRadius: 16, padding: compact ? '16px' : '20px',
      background: activeVisual ? 'linear-gradient(135deg, var(--surface-2), var(--surface))' : 'var(--surface)',
      border: '1px solid var(--line)', overflow:'hidden',
      display:'flex', flexDirection:'column', gap: compact ? 12 : 16,
      transition:'transform .18s, border-color .18s',
    }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--line-2)'; e.currentTarget.style.transform='translateY(-2px)';}}
       onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.transform='translateY(0)';}}>

      {activeVisual && <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, var(--accent-soft), transparent 70%)' }}/>}

      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
        <div style={{
          width: 44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
          background: activeVisual ? 'var(--accent-soft)' : 'var(--bg-3)',
          color: activeVisual ? 'var(--accent)' : 'var(--text-3)',
        }}>
          <Icon name={ICONS[obj.type] || 'grid'} size={22}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, position:'relative' }}>
          {activeVisual && <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:pill.dot, opacity:.35, animation:'ping 2s ease-out infinite' }}/>}
          <div style={{
            width:8, height:8, borderRadius:'50%', position:'relative',
            background: pill.dot,
          }}/>
          <span className="label" style={{ fontSize:9, color: pill.color }}>{pill.text}</span>
        </div>
      </header>

      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span className="mono" style={{ fontSize:10, color:'var(--text-4)' }}>{obj.code}</span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--text-4)' }}/>
          <span className="label" style={{ fontSize:9, color:'var(--text-3)' }}>{obj.branche}</span>
        </div>
        <h3 className="display" style={{ fontSize: compact ? 18 : 20, lineHeight:1.15, color:'var(--text)' }}>{obj.nom}</h3>
        <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>{obj.pieceNom} · {obj.marque}</div>
      </div>

      {statusText && (
        <div style={{
          padding:'10px 12px', borderRadius:10, background:'var(--bg-2)',
          fontSize:13, color: activeVisual ? 'var(--text)' : 'var(--text-3)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ color:'var(--text-3)', fontSize:11 }}>État</span>
          <span className="display" style={{ fontSize:14, color: activeVisual ? 'var(--accent)' : 'var(--text-2)' }}>{statusText}</span>
        </div>
      )}

      <footer style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, fontSize:11, color:'var(--text-3)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Icon name={obj.connectivite === 'WIFI' ? 'wifi' : 'bt'} size={12}/>
          </span>
          {obj.batterie != null && (
            <span style={{ display:'flex', alignItems:'center', gap:5, color: lowBat ? 'var(--red)' : 'var(--text-3)' }}>
              <Icon name="bolt" size={11}/>
              <span className="num mono" style={{ fontSize:11 }}>{obj.batterie}%</span>
            </span>
          )}
        </div>
        {actions ? (
          <div style={{ display:'flex', gap:4 }} onClick={e=>e.stopPropagation()}>
            {showPowerToggle && (
              <button onClick={()=>actions.toggle(obj)} style={iconBtn} title={active ? 'Éteindre' : 'Allumer'}>
                <Icon name="power" size={13}/>
              </button>
            )}
            <button onClick={()=>actions.edit(obj)} style={iconBtn}><Icon name="edit" size={13}/></button>
            <button onClick={()=>actions.delete(obj.id)} style={{...iconBtn, color:'var(--red)'}}><Icon name="trash" size={13}/></button>
          </div>
        ) : (
          <Icon name="chevR" size={14}/>
        )}
      </footer>
    </article>
  );
}
const iconBtn = {
  width:28, height:28, borderRadius:8, background:'var(--bg-3)', color:'var(--text-2)',
  display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
};

/* ─── SPARKLINE (SVG inline, no lib) ───────── */
function Sparkline({ data, color = '#ffb547', height = 60 }) {
  if (!data || data.length < 2) return null
  const width = 380
  const padX = 6
  const padY = 6
  const values = data.map((d) => d.valeur)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = (width - padX * 2) / (data.length - 1)
  const points = data.map((d, i) => {
    const x = padX + i * stepX
    const y = padY + (1 - (d.valeur - min) / span) * (height - padY * 2)
    return [x, y]
  })
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${path} L ${points[points.length - 1][0].toFixed(1)} ${(height - padY).toFixed(1)} L ${points[0][0].toFixed(1)} ${(height - padY).toFixed(1)} Z`
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Graphique des dernières mesures">
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" stroke="none"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3" fill={color}/>
    </svg>
  )
}

/* ─── DEVICE CONTROL PANELS (par type) ─────── */

/**
 * Control panel pour LaveLinge : programme + température + essorage + lancer/arrêter cycle.
 * État local non commité jusqu'au clic « Appliquer » ou « Lancer » pour éviter
 * des PUT à chaque tick de slider.
 */
function LaveLingeControl({ obj, accent, canManage, onUpdate }) {
  const [programme, setProgramme] = useState(obj.programme || 'COTON_60')
  const [tempLavage, setTempLavage] = useState(obj.tempLavage ?? 60)
  const [vitesseEssorage, setVitesseEssorage] = useState(obj.vitesseEssorage ?? 1200)
  const [busy, setBusy] = useState(false)

  // Resync state si l'objet change (drawer rouvert sur un autre lave-linge ou refresh)
  useEffect(() => {
    setProgramme(obj.programme || 'COTON_60')
    setTempLavage(obj.tempLavage ?? 60)
    setVitesseEssorage(obj.vitesseEssorage ?? 1200)
  }, [obj.id, obj.programme, obj.tempLavage, obj.vitesseEssorage])

  const isRunning = obj.etat === 'ACTIF' && obj.dureeRestante != null && obj.dureeRestante > 0
  const dirty = programme !== obj.programme || tempLavage !== obj.tempLavage || vitesseEssorage !== obj.vitesseEssorage
  const programmeMeta = PROGRAMMES_LAVAGE.find((p) => p.code === programme) || PROGRAMMES_LAVAGE[0]

  const handleProgramme = (code) => {
    setProgramme(code)
    const meta = PROGRAMMES_LAVAGE.find((p) => p.code === code)
    if (meta) {
      setTempLavage(meta.temp)
      setVitesseEssorage(meta.essorage)
    }
  }

  const apply = async (extra = {}) => {
    if (!canManage || !onUpdate) return
    setBusy(true)
    try {
      await onUpdate(obj, { programme, tempLavage, vitesseEssorage, ...extra })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="label" style={{ marginBottom:10, display:'flex', justifyContent:'space-between' }}>
        <span>Programme & cycle</span>
        {isRunning && (
          <span className="mono" style={{ color: accent, textTransform:'none', letterSpacing:0 }}>
            ⏱ {obj.dureeRestante} min restantes
          </span>
        )}
      </div>
      <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:14 }}>
        <select
          value={programme}
          onChange={(e) => handleProgramme(e.target.value)}
          disabled={!canManage || isRunning}
          aria-label="Programme de lavage"
          style={{ ...inputStyle, padding:'10px 12px' }}
        >
          {PROGRAMMES_LAVAGE.map((p) => (
            <option key={p.code} value={p.code}>{p.label} · ~{p.dureeMin} min</option>
          ))}
        </select>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-3)', marginBottom:4 }}>
            <span>Température</span>
            <span className="mono num" style={{ color: accent }}>{tempLavage}°C</span>
          </div>
          <input
            type="range" min="0" max="95" step="5"
            value={tempLavage}
            onChange={(e) => setTempLavage(Number(e.target.value))}
            disabled={!canManage || isRunning}
            aria-label="Température de lavage"
            style={{ width:'100%', accentColor: accent }}
          />
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-3)', marginBottom:4 }}>
            <span>Essorage</span>
            <span className="mono num" style={{ color: accent }}>{vitesseEssorage} tr/min</span>
          </div>
          <input
            type="range" min="0" max="1600" step="200"
            value={vitesseEssorage}
            onChange={(e) => setVitesseEssorage(Number(e.target.value))}
            disabled={!canManage || isRunning}
            aria-label="Vitesse d'essorage"
            style={{ width:'100%', accentColor: accent }}
          />
        </div>

        {canManage && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', flexWrap:'wrap' }}>
            {dirty && !isRunning && (
              <button type="button" onClick={() => apply()} disabled={busy} style={{ ...ctaSec, padding:'8px 14px', fontSize:12 }}>
                Enregistrer
              </button>
            )}
            {!isRunning ? (
              <button type="button" onClick={() => apply({ cycleAction: 'start' })} disabled={busy} style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12 }}>
                ▶ Lancer cycle
              </button>
            ) : (
              <button type="button" onClick={() => apply({ cycleAction: 'stop' })} disabled={busy} style={{ ...ctaSec, padding:'8px 14px', fontSize:12, color:'var(--red)', borderColor:'var(--red)' }}>
                ■ Arrêter
              </button>
            )}
          </div>
        )}
        <div style={{ fontSize:10, color:'var(--text-4)' }}>
          Programme {programmeMeta.label} · durée prévue {programmeMeta.dureeMin} min
        </div>
      </div>
    </div>
  )
}

/**
 * Télécommande TV : volume + chaîne (boutons -/+) + sélecteur de source.
 */
function TelevisionControl({ obj, accent, canManage, onUpdate }) {
  const [volume, setVolume] = useState(obj.volume ?? 25)
  const [chaine, setChaine] = useState(obj.chaine ?? 1)
  const [source, setSource] = useState(obj.source || 'LIVE_TV')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setVolume(obj.volume ?? 25)
    setChaine(obj.chaine ?? 1)
    setSource(obj.source || 'LIVE_TV')
  }, [obj.id, obj.volume, obj.chaine, obj.source])

  const dirty = volume !== obj.volume || chaine !== obj.chaine || source !== obj.source

  const apply = async () => {
    if (!canManage || !onUpdate) return
    setBusy(true)
    try {
      await onUpdate(obj, { volume, chaine, source })
    } finally {
      setBusy(false)
    }
  }

  const isLive = source === 'LIVE_TV'

  return (
    <div>
      <div className="label" style={{ marginBottom:10 }}>Télécommande</div>
      <div style={{ padding:'16px 18px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:14 }}>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={!canManage}
          aria-label="Source d'entrée"
          style={{ ...inputStyle, padding:'10px 12px' }}
        >
          {SOURCES_TV.map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>

        {isLive && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <span style={{ fontSize:11, color:'var(--text-3)' }}>Chaîne</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button type="button" onClick={() => setChaine(Math.max(1, chaine - 1))} disabled={!canManage} style={{ ...iconBtn, width:32, height:32 }} aria-label="Chaîne précédente">−</button>
              <span className="display num" style={{ fontSize:24, color: accent, minWidth:48, textAlign:'center' }}>{chaine}</span>
              <button type="button" onClick={() => setChaine(Math.min(99, chaine + 1))} disabled={!canManage} style={{ ...iconBtn, width:32, height:32 }} aria-label="Chaîne suivante">+</button>
            </div>
          </div>
        )}

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-3)', marginBottom:4 }}>
            <span>Volume</span>
            <span className="mono num" style={{ color: accent }}>{volume}</span>
          </div>
          <input
            type="range" min="0" max="100" step="1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            disabled={!canManage}
            aria-label="Volume"
            style={{ width:'100%', accentColor: accent }}
          />
        </div>

        {canManage && dirty && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button type="button" onClick={apply} disabled={busy} style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12 }}>
              {busy ? 'Application…' : 'Appliquer'} <Icon name="arrow" size={12}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Thermostat : température cible (consigne) + mode (Auto / Chauffe / Eco / Off).
 * Affiche la température mesurée la plus récente issue de DonneeCapteur.
 */
function ThermostatControl({ obj, accent, canManage, onUpdate, latestMeasure }) {
  const [tempCible, setTempCible] = useState(obj.tempCible ?? 20)
  const [mode, setMode] = useState(obj.mode || 'AUTO')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTempCible(obj.tempCible ?? 20)
    setMode(obj.mode || 'AUTO')
  }, [obj.id, obj.tempCible, obj.mode])

  const dirty = tempCible !== obj.tempCible || mode !== obj.mode
  const tempActuelle = latestMeasure?.valeur

  const apply = async () => {
    if (!canManage || !onUpdate) return
    setBusy(true)
    try {
      await onUpdate(obj, { tempCible, mode })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="label" style={{ marginBottom:10 }}>Consigne thermique</div>
      <div style={{ padding:'18px 20px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <div>
            <div className="label" style={{ fontSize:9 }}>Mesurée</div>
            <div className="display num" style={{ fontSize:30, color:'var(--text)', lineHeight:1 }}>
              {tempActuelle != null ? `${tempActuelle.toFixed(1)}°` : '—'}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="label" style={{ fontSize:9 }}>Cible</div>
            <div className="display num" style={{ fontSize:30, color: accent, lineHeight:1 }}>
              {tempCible.toFixed(1)}°
            </div>
          </div>
        </div>

        <input
          type="range" min="10" max="30" step="0.5"
          value={tempCible}
          onChange={(e) => setTempCible(Number(e.target.value))}
          disabled={!canManage}
          aria-label="Température cible"
          style={{ width:'100%', accentColor: accent }}
        />

        <div style={{ display:'flex', gap:6 }}>
          {MODES_THERMOSTAT.map((m) => (
            <button
              key={m.code}
              type="button"
              onClick={() => canManage && setMode(m.code)}
              disabled={!canManage}
              aria-pressed={mode === m.code}
              style={{
                flex:1, padding:'8px 6px', borderRadius:8, fontSize:11, fontWeight: mode === m.code ? 600 : 400,
                background: mode === m.code ? accent : 'var(--bg-3)',
                color: mode === m.code ? '#0e1116' : 'var(--text-2)',
                border:`1px solid ${mode === m.code ? accent : 'var(--line)'}`,
              }}
            >{m.label}</button>
          ))}
        </div>

        {canManage && dirty && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button type="button" onClick={apply} disabled={busy} style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12 }}>
              {busy ? 'Application…' : 'Appliquer'} <Icon name="arrow" size={12}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Climatiseur : modeClim (Froid/Chaud/Auto/Ventilation) + température cible.
 * Boutons mode iconiques + slider 16-30°C. Pas de mesure live (pas de DonneeCapteur attaché).
 */
function ClimatiseurControl({ obj, accent, canManage, onUpdate }) {
  const [tempCible, setTempCible] = useState(obj.tempCible != null ? Math.round(obj.tempCible) : 22)
  const [mode, setMode] = useState(obj.mode || 'AUTO')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTempCible(obj.tempCible != null ? Math.round(obj.tempCible) : 22)
    setMode(obj.mode || 'AUTO')
  }, [obj.id, obj.tempCible, obj.mode])

  const dirty = tempCible !== (obj.tempCible != null ? Math.round(obj.tempCible) : null) || mode !== obj.mode

  const apply = async () => {
    if (!canManage || !onUpdate) return
    setBusy(true)
    try {
      // tempCible passé en Float ; backend cast en Integer pour Climatiseur
      await onUpdate(obj, { tempCible: Number(tempCible), mode })
    } finally {
      setBusy(false)
    }
  }

  const isOff = mode === 'OFF' || obj.etat !== 'ACTIF'

  return (
    <div>
      <div className="label" style={{ marginBottom:10 }}>Climatisation</div>
      <div style={{ padding:'18px 20px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Affichage central — tempCible avec dégradé selon le mode */}
        <div style={{ textAlign:'center' }}>
          <div className="label" style={{ fontSize:9 }}>Température cible</div>
          <div className="display num" style={{
            fontSize:48, lineHeight:1,
            color: mode === 'FROID' ? 'var(--blue)'
                 : mode === 'CHAUD' ? 'var(--red)'
                 : mode === 'VENTILATION' ? 'var(--text)'
                 : accent,
            opacity: isOff ? 0.4 : 1,
          }}>
            {tempCible}°
          </div>
          <div className="mono" style={{ fontSize:10, color:'var(--text-3)', marginTop:4 }}>
            {(MODES_CLIM.find((m) => m.code === mode)?.label) || mode}
          </div>
        </div>

        <input
          type="range" min="16" max="30" step="1"
          value={tempCible}
          onChange={(e) => setTempCible(Number(e.target.value))}
          disabled={!canManage}
          aria-label="Température cible climatiseur"
          style={{ width:'100%', accentColor: accent }}
        />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6 }}>
          {MODES_CLIM.map((m) => (
            <button
              key={m.code}
              type="button"
              onClick={() => canManage && setMode(m.code)}
              disabled={!canManage}
              aria-pressed={mode === m.code}
              style={{
                padding:'10px 4px', borderRadius:8, fontSize:11, fontWeight: mode === m.code ? 600 : 400,
                background: mode === m.code ? accent : 'var(--bg-3)',
                color: mode === m.code ? '#0e1116' : 'var(--text-2)',
                border:`1px solid ${mode === m.code ? accent : 'var(--line)'}`,
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}
            >
              <span style={{ fontSize:18 }} aria-hidden="true">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {canManage && dirty && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button type="button" onClick={apply} disabled={busy} style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12 }}>
              {busy ? 'Application…' : 'Appliquer'} <Icon name="arrow" size={12}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Système d'alarme : statut DESARMEE/ARMEE/ALERTE, zones surveillées,
 * code PIN, action « Tester » (force ALERTE 1×) et « Réinitialiser ».
 */
function AlarmeControl({ obj, accent, canManage, onUpdate }) {
  const [statut, setStatut] = useState(obj.alarmeStatut || 'DESARMEE')
  const [zones, setZones] = useState(obj.alarmeZones || '')
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    setStatut(obj.alarmeStatut || 'DESARMEE')
    setZones(obj.alarmeZones || '')
  }, [obj.id, obj.alarmeStatut, obj.alarmeZones])

  const dirty = statut !== obj.alarmeStatut || zones !== (obj.alarmeZones || '')
  const meta = STATUTS_ALARME.find((s) => s.code === (obj.alarmeStatut || statut)) || STATUTS_ALARME[0]
  const isAlert = (obj.alarmeStatut || statut) === 'ALERTE'

  const apply = async (extra = {}) => {
    if (!canManage || !onUpdate) return
    setBusy('save')
    try {
      await onUpdate(obj, { alarmeStatut: statut, alarmeZones: zones, ...extra })
    } finally {
      setBusy(null)
    }
  }

  const triggerTest = async () => {
    if (!canManage || !onUpdate) return
    setBusy('test')
    try { await onUpdate(obj, { alarmeAction: 'test' }) } finally { setBusy(null) }
  }
  const triggerReset = async () => {
    if (!canManage || !onUpdate) return
    setBusy('reset')
    try { await onUpdate(obj, { alarmeAction: 'reset', alarmeStatut: 'DESARMEE' }) } finally { setBusy(null) }
  }

  const fmtTime = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div>
      <div className="label" style={{ marginBottom:10 }}>Sécurité maison</div>
      <div style={{
        padding:'18px 20px', borderRadius:14,
        background: isAlert ? 'rgba(255,80,80,0.08)' : 'var(--bg-2)',
        border: `1px solid ${isAlert ? 'var(--red)' : 'var(--line)'}`,
        display:'flex', flexDirection:'column', gap:14,
        animation: isAlert ? 'rise 0.4s ease' : 'none',
      }}>
        {/* Status badge gros plan */}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, lineHeight:1 }} aria-hidden="true">{meta.icon}</div>
          <div className="display" style={{ fontSize:22, color: meta.color, marginTop:8 }}>
            {meta.label}
          </div>
          {obj.derniereAlerte && (
            <div className="mono" style={{ fontSize:10, color:'var(--text-4)', marginTop:6 }}>
              dernière alerte : {fmtTime(obj.derniereAlerte)}
            </div>
          )}
        </div>

        {/* Sélecteur de statut */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
          {STATUTS_ALARME.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => canManage && setStatut(s.code)}
              disabled={!canManage || s.code === 'ALERTE'}
              aria-pressed={statut === s.code}
              title={s.code === 'ALERTE' ? 'ALERTE est déclenchée par le bouton Tester ou un capteur' : `Passer en ${s.label}`}
              style={{
                padding:'10px 4px', borderRadius:8, fontSize:11, fontWeight: statut === s.code ? 600 : 400,
                background: statut === s.code ? accent : 'var(--bg-3)',
                color: statut === s.code ? '#0e1116' : (s.code === 'ALERTE' ? 'var(--text-4)' : 'var(--text-2)'),
                border:`1px solid ${statut === s.code ? accent : 'var(--line)'}`,
                cursor: s.code === 'ALERTE' ? 'not-allowed' : (canManage ? 'pointer' : 'not-allowed'),
              }}
            >{s.label.replace('⚠ ','')}</button>
          ))}
        </div>

        {/* Zones surveillées */}
        <div>
          <div className="label" style={{ fontSize:9, marginBottom:4 }}>Zones surveillées</div>
          <input
            type="text"
            value={zones}
            onChange={(e) => setZones(e.target.value)}
            disabled={!canManage}
            placeholder="Ex : Salon, Garage, Hall"
            style={{ ...inputStyle, padding:'10px 12px' }}
          />
        </div>

        {canManage && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {dirty && (
              <button type="button" onClick={() => apply()} disabled={busy != null} style={{ ...ctaSec, padding:'8px 14px', fontSize:12 }}>
                {busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            )}
            <button type="button" onClick={triggerTest} disabled={busy != null} style={{ ...ctaSec, padding:'8px 14px', fontSize:12, color:'var(--red)', borderColor:'var(--red)' }}>
              {busy === 'test' ? '⚠ Test…' : '⚠ Tester'}
            </button>
            {isAlert && (
              <button type="button" onClick={triggerReset} disabled={busy != null} style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12, flex:1 }}>
                {busy === 'reset' ? '…' : 'Acquitter & désarmer'}
              </button>
            )}
          </div>
        )}
        <div style={{ fontSize:10, color:'var(--text-4)' }}>
          Astuce : combinez avec un scénario CONDITIONAL « MOTION_DETECTED + night » pour une vraie surveillance domotique.
        </div>
      </div>
    </div>
  )
}

/**
 * Caméra : flux vidéo placeholder (animation pulsante), résolution, mode jour/nuit,
 * vision nocturne et bouton d'enregistrement live. Pas de capture réelle — la
 * « lecture en direct » est un effet visuel pour la démo.
 */
function CameraControl({ obj, accent, canManage, onUpdate, onSimulateEvent }) {
  const [resolution, setResolution] = useState(obj.resolution || 'FULL_HD')
  const [modeCamera, setModeCamera] = useState(obj.modeCamera || 'AUTO')
  const [visionNocturne, setVisionNocturne] = useState(obj.visionNocturne ?? true)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    setResolution(obj.resolution || 'FULL_HD')
    setModeCamera(obj.modeCamera || 'AUTO')
    setVisionNocturne(obj.visionNocturne ?? true)
  }, [obj.id, obj.resolution, obj.modeCamera, obj.visionNocturne])

  const dirty = resolution !== obj.resolution || modeCamera !== obj.modeCamera || visionNocturne !== obj.visionNocturne
  const isRec = obj.enregistrement === true
  const isOff = obj.etat !== 'ACTIF'

  const apply = async (extra = {}) => {
    if (!canManage || !onUpdate) return
    setBusy('save')
    try { await onUpdate(obj, { resolution, modeCamera, visionNocturne, ...extra }) }
    finally { setBusy(null) }
  }

  const toggleRec = async () => {
    if (!canManage || !onUpdate) return
    setBusy('rec')
    try { await onUpdate(obj, { enregistrement: !isRec }) }
    finally { setBusy(null) }
  }

  const simulateMotion = async () => {
    if (!canManage || !onSimulateEvent) return
    setBusy('simulate')
    try { await onSimulateEvent(obj, 'MOTION_DETECTED') }
    finally { setBusy(null) }
  }

  const modeMeta = MODES_CAMERA.find((m) => m.code === modeCamera) || MODES_CAMERA[0]
  const isDark = modeCamera === 'NIGHT' || (modeCamera === 'AUTO' && new Date().getHours() >= 20)

  return (
    <div>
      <div className="label" style={{ marginBottom:10, display:'flex', justifyContent:'space-between' }}>
        <span>Flux & enregistrement</span>
        {isRec && <span style={{ color:'var(--red)', textTransform:'none', letterSpacing:0 }}>● ENREGISTREMENT</span>}
      </div>

      {/* Live feed placeholder */}
      <div style={{
        position:'relative', borderRadius:14, overflow:'hidden',
        background: isOff ? 'var(--bg-3)' : (isDark
          ? 'linear-gradient(135deg, #0a1f3d, #1a3a5c)'
          : 'linear-gradient(135deg, #2a3441, #3d4755)'),
        border:`1px solid ${isRec ? 'var(--red)' : 'var(--line)'}`,
        aspectRatio:'16 / 9', marginBottom:14,
      }}>
        {/* Faux scanlines + bruit pour le rendu CCTV */}
        {!isOff && (
          <>
            <div style={{
              position:'absolute', inset:0,
              background:'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)',
              pointerEvents:'none',
            }}/>
            <div aria-hidden="true" style={{
              position:'absolute', top:'40%', left:'30%',
              width:60, height:60, borderRadius:'50%',
              background:`radial-gradient(circle, ${isDark ? 'rgba(150,255,150,0.25)' : 'rgba(255,255,255,0.15)'}, transparent 70%)`,
              animation:'rise 3s ease-in-out infinite alternate',
            }}/>
            <div aria-hidden="true" style={{
              position:'absolute', top:'55%', left:'55%',
              width:40, height:40, borderRadius:'50%',
              background:`radial-gradient(circle, ${isDark ? 'rgba(150,255,150,0.18)' : 'rgba(255,255,255,0.10)'}, transparent 70%)`,
              animation:'rise 4s ease-in-out infinite alternate',
            }}/>
          </>
        )}
        {/* Overlay status */}
        <div style={{ position:'absolute', top:8, left:10, right:10, display:'flex', justifyContent:'space-between', fontSize:11 }}>
          <span className="mono" style={{
            padding:'2px 8px', borderRadius:4,
            background:'rgba(0,0,0,0.6)',
            color: isRec ? 'var(--red)' : '#fff',
          }}>{isRec && '● '}{isOff ? 'OFFLINE' : 'LIVE'}</span>
          <span className="mono" style={{ padding:'2px 8px', borderRadius:4, background:'rgba(0,0,0,0.6)', color:'#fff' }}>
            {(RESOLUTIONS_CAMERA.find((r) => r.code === resolution)?.label) || resolution}
          </span>
        </div>
        <div style={{ position:'absolute', bottom:8, left:10, fontSize:10, color:'rgba(255,255,255,0.6)', fontFamily:"'Geist Mono', monospace" }}>
          {obj.zone || obj.pieceNom} · {modeMeta.icon} {modeMeta.label}
        </div>
        {isOff && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-3)', fontSize:14 }}>
            ⏸ Caméra désactivée
          </div>
        )}
      </div>

      <div style={{ padding:'14px 18px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Mode */}
        <div>
          <div className="label" style={{ fontSize:9, marginBottom:6 }}>Mode</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6 }}>
            {MODES_CAMERA.map((m) => (
              <button
                key={m.code}
                type="button"
                onClick={() => canManage && setModeCamera(m.code)}
                disabled={!canManage}
                aria-pressed={modeCamera === m.code}
                style={{
                  padding:'8px 4px', borderRadius:8, fontSize:10, fontWeight: modeCamera === m.code ? 600 : 400,
                  background: modeCamera === m.code ? accent : 'var(--bg-3)',
                  color: modeCamera === m.code ? '#0e1116' : 'var(--text-2)',
                  border:`1px solid ${modeCamera === m.code ? accent : 'var(--line)'}`,
                  display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                }}
              >
                <span style={{ fontSize:14 }} aria-hidden="true">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Résolution */}
        <div>
          <div className="label" style={{ fontSize:9, marginBottom:4 }}>Résolution</div>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            disabled={!canManage}
            style={{ ...inputStyle, padding:'10px 12px' }}
          >
            {RESOLUTIONS_CAMERA.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </select>
        </div>

        {/* Vision nocturne */}
        <label style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg-3)', borderRadius:10, border:'1px solid var(--line)', fontSize:12, cursor: canManage ? 'pointer' : 'not-allowed' }}>
          <input
            type="checkbox"
            checked={visionNocturne}
            onChange={(e) => canManage && setVisionNocturne(e.target.checked)}
            disabled={!canManage}
          />
          <span style={{ flex:1 }}>Vision nocturne IR automatique</span>
          <span style={{ color: visionNocturne ? accent : 'var(--text-4)' }}>{visionNocturne ? 'ON' : 'OFF'}</span>
        </label>

        {canManage && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <button
              type="button"
              onClick={simulateMotion}
              disabled={busy != null || isOff}
              style={{ ...ctaSec, padding:'8px 14px', fontSize:12 }}
            >
              {busy === 'simulate' ? '…' : '⚡ Simuler mouvement'}
            </button>
            <button
              type="button"
              onClick={toggleRec}
              disabled={busy != null || isOff}
              style={{
                ...ctaSec, padding:'8px 14px', fontSize:12,
                color: isRec ? 'var(--red)' : 'var(--text-2)',
                borderColor: isRec ? 'var(--red)' : 'var(--line-2)',
              }}
            >
              {busy === 'rec' ? '…' : (isRec ? '■ Stop enregistrement' : '● Démarrer enregistrement')}
            </button>
            {dirty && (
              <button type="button" onClick={() => apply()} disabled={busy != null} style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12 }}>
                {busy === 'save' ? '…' : 'Appliquer'} <Icon name="arrow" size={12}/>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Détecteur de mouvement : sensibilité 1-10, dernière détection, total cumulé,
 * bouton « Simuler mouvement » pour la démo (pas de capteur physique).
 */
function MotionSensorControl({ obj, accent, canManage, onUpdate, onSimulateEvent }) {
  const [sensibilite, setSensibilite] = useState(obj.sensibilite ?? 5)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    setSensibilite(obj.sensibilite ?? 5)
  }, [obj.id, obj.sensibilite])

  const dirty = sensibilite !== obj.sensibilite

  const fmtAge = (iso) => {
    if (!iso) return 'Aucune détection encore'
    const ms = Date.now() - new Date(iso).getTime()
    if (ms < 60_000) return 'À l\'instant'
    if (ms < 3600_000) return `Il y a ${Math.floor(ms/60000)} min`
    if (ms < 86400_000) return `Il y a ${Math.floor(ms/3600000)} h`
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
  }

  const isRecent = obj.derniereDetectionAt && (Date.now() - new Date(obj.derniereDetectionAt).getTime()) < 60_000

  const apply = async () => {
    if (!canManage || !onUpdate) return
    setBusy('save')
    try { await onUpdate(obj, { sensibilite }) } finally { setBusy(null) }
  }

  const simulate = async () => {
    if (!canManage) return
    setBusy('detect')
    try {
      if (onSimulateEvent) {
        await onSimulateEvent(obj, 'MOTION_DETECTED')
      } else if (onUpdate) {
        await onUpdate(obj, { motionAction: 'detect' })
      }
    } finally { setBusy(null) }
  }

  return (
    <div>
      <div className="label" style={{ marginBottom:10 }}>Détection de présence</div>
      <div style={{
        padding:'18px 20px', borderRadius:14,
        background: isRecent ? 'rgba(255,181,71,0.08)' : 'var(--bg-2)',
        border: `1px solid ${isRecent ? accent : 'var(--line)'}`,
        display:'flex', flexDirection:'column', gap:14,
      }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:36, lineHeight:1 }} aria-hidden="true">{isRecent ? '⚡' : '👁'}</div>
          <div className="display" style={{ fontSize:18, marginTop:6, color: isRecent ? accent : 'var(--text)' }}>
            {isRecent ? 'Mouvement détecté' : 'Aucun mouvement récent'}
          </div>
          <div className="mono" style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>
            {fmtAge(obj.derniereDetectionAt)}
          </div>
          {obj.totalDetections != null && (
            <div className="mono" style={{ fontSize:10, color:'var(--text-4)', marginTop:4 }}>
              {obj.totalDetections} détection{obj.totalDetections > 1 ? 's' : ''} cumulée{obj.totalDetections > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-3)', marginBottom:4 }}>
            <span>Sensibilité</span>
            <span className="mono num" style={{ color: accent }}>{sensibilite}/10</span>
          </div>
          <input
            type="range" min="1" max="10" step="1"
            value={sensibilite}
            onChange={(e) => setSensibilite(Number(e.target.value))}
            disabled={!canManage}
            style={{ width:'100%', accentColor: accent }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-4)', marginTop:2 }}>
            <span>Faible</span>
            <span>Très sensible</span>
          </div>
        </div>

        {canManage && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <button type="button" onClick={simulate} disabled={busy != null || obj.etat !== 'ACTIF'} style={{ ...ctaSec, padding:'8px 14px', fontSize:12 }}>
              {busy === 'detect' ? '⚡ Détection…' : '⚡ Simuler mouvement'}
            </button>
            {dirty && (
              <button type="button" onClick={apply} disabled={busy != null} style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12 }}>
                {busy === 'save' ? '…' : 'Appliquer'} <Icon name="arrow" size={12}/>
              </button>
            )}
          </div>
        )}
        <div style={{ fontSize:10, color:'var(--text-4)' }}>
          Astuce : crée un scénario CONDITIONAL « MOTION_DETECTED » pour qu'une détection allume automatiquement les lumières ou déclenche l'alarme.
        </div>
      </div>
    </div>
  )
}

/**
 * Pet feeder (Nourriture / Eau) : niveau du réservoir, portion par distribution,
 * actions Distribuer maintenant / Remplir réservoir. La planification réelle
 * est gérée par les scénarios programmés (Petit-déj 8h, Dîner 18h, Eau 7h…).
 */
function PetFeederControl({ obj, accent, canManage, onUpdate }) {
  const niveau = Number(obj.niveauReservoir ?? obj.niveau ?? 0)
  const [portion, setPortion] = useState(obj.portionGrammes ?? 30)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    setPortion(obj.portionGrammes ?? 30)
  }, [obj.id, obj.portionGrammes])

  const fillColor = niveau < 20 ? 'var(--red)' : niveau < 50 ? accent : 'var(--green)'
  const isWater = obj.type === 'Eau'
  const unit = isWater ? 'mL' : 'g'

  const trigger = async (action) => {
    if (!canManage || !onUpdate) return
    setBusy(action)
    try {
      await onUpdate(obj, { petAction: action, portionGrammes: portion })
    } finally {
      setBusy(null)
    }
  }

  const fmtTime = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div>
      <div className="label" style={{ marginBottom:10 }}>{isWater ? 'Fontaine' : 'Distributeur'} · {obj.animal || 'Animal'}</div>
      <div style={{ padding:'18px 20px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Jauge réservoir */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
            <span style={{ fontSize:12, color:'var(--text-2)' }}>Réservoir</span>
            <span className="display num" style={{ fontSize:22, color: fillColor }}>{Math.round(niveau)}%</span>
          </div>
          <div style={{ height:10, background:'var(--bg-3)', borderRadius:99, overflow:'hidden' }}>
            <div style={{
              height:'100%', width:`${niveau}%`, borderRadius:99,
              background: fillColor, transition:'width .4s, background .2s',
            }}/>
          </div>
        </div>

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-3)', marginBottom:4 }}>
            <span>Portion par distribution</span>
            <span className="mono num" style={{ color: accent }}>{portion} {unit}</span>
          </div>
          <input
            type="range" min={isWater ? 20 : 10} max={isWater ? 200 : 80} step="5"
            value={portion}
            onChange={(e) => setPortion(Number(e.target.value))}
            disabled={!canManage}
            style={{ width:'100%', accentColor: accent }}
          />
        </div>

        <div style={{ fontSize:11, color:'var(--text-3)', display:'flex', justifyContent:'space-between' }}>
          <span>Dernière distribution</span>
          <span className="mono">{fmtTime(obj.derniereDistribution)}</span>
        </div>
        <div style={{ fontSize:11, color:'var(--text-3)', display:'flex', justifyContent:'space-between' }}>
          <span>Prochaine prévue</span>
          <span className="mono">{fmtTime(obj.prochaineDistribution)}</span>
        </div>

        {canManage && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button
              type="button"
              onClick={() => trigger('distribuer')}
              disabled={busy != null || niveau <= 0}
              style={{ ...ctaPri, background: accent, padding:'10px 14px', fontSize:12, flex:1 }}
            >
              {busy === 'distribuer' ? 'Distribution…' : isWater ? '💧 Servir' : '🍽 Distribuer'} ({portion}{unit})
            </button>
            <button
              type="button"
              onClick={() => trigger('remplir')}
              disabled={busy != null || niveau >= 100}
              style={{ ...ctaSec, padding:'10px 14px', fontSize:12, flex:1 }}
            >
              {busy === 'remplir' ? 'Remplissage…' : '↑ Remplir 100%'}
            </button>
          </div>
        )}
        <div style={{ fontSize:10, color:'var(--text-4)' }}>
          Astuce : programmez une distribution récurrente via Routines (Gestion → Routines → Nouveau scénario).
        </div>
      </div>
    </div>
  )
}

/* ─── DETAIL DRAWER ─────────────────────────── */
function DetailDrawer({ obj, onClose, canManage, onMethodInvoke, onUpdateObjet, onSimulateEvent, t }) {
  const [activity, setActivity] = useState([])
  const [actLoading, setActLoading] = useState(false)
  const [actError, setActError] = useState('')
  const [busyMethod, setBusyMethod] = useState(null)
  const [sparkData, setSparkData] = useState([])
  const [sliderPos, setSliderPos] = useState(null)
  const [savingPos, setSavingPos] = useState(false)

  const objetId = obj?.id
  const branche = obj?.branche

  useEffect(() => {
    if (!objetId || !canManage) {
      setActivity([])
      return
    }
    let cancelled = false
    setActLoading(true)
    setActError('')
    fetchJson(`/api/gestion/historique?limit=40&objetId=${objetId}`)
      .then((all) => {
        if (cancelled) return
        const filtered = (Array.isArray(all) ? all : []).slice(0, 6)
        setActivity(filtered)
      })
      .catch((e) => { if (!cancelled) setActError(e.message || 'Historique indisponible') })
      .finally(() => { if (!cancelled) setActLoading(false) })
    return () => { cancelled = true }
  }, [objetId, canManage])

  useEffect(() => {
    if (!objetId || !canManage || branche !== 'Capteur') {
      setSparkData([])
      return
    }
    let cancelled = false
    fetchJson(`/api/gestion/objets/${objetId}/donnees`)
      .then((data) => { if (!cancelled) setSparkData(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setSparkData([]) })
    return () => { cancelled = true }
  }, [objetId, canManage, branche])

  useEffect(() => {
    if (obj?.position != null) setSliderPos(Number(obj.position))
    else setSliderPos(null)
  }, [objetId, obj?.position])

  if (!obj) return null;
  const tax = taxonomyFor(obj.type)
  const methodes = tax.methodes
  const accent = t?.accent || ACCENT

  const fmtTime = (ts) => {
    const d = ts ? new Date(ts) : new Date()
    const diff = Date.now() - d.getTime()
    if (diff < 60000) return "à l'instant"
    if (diff < 3600000) return `il y a ${Math.floor(diff/60000)} min`
    if (diff < 86400000) return `il y a ${Math.floor(diff/3600000)} h`
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
  }

  const handleMethod = async (m) => {
    if (!canManage || !onMethodInvoke || busyMethod) return
    setBusyMethod(m)
    try {
      await onMethodInvoke(obj, m)
    } finally {
      setBusyMethod(null)
    }
  }

  const applyPosition = async () => {
    if (!canManage || !onUpdateObjet || sliderPos == null) return
    setSavingPos(true)
    try {
      await onUpdateObjet(obj, { position: sliderPos })
    } finally {
      setSavingPos(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:200, backdropFilter:'blur(4px)', animation:'rise .2s' }}/>
      <aside className="slideR" style={{
        position:'fixed', top:16, right:16, bottom:16, width:460, zIndex:201,
        background:'var(--surface)', border:'1px solid var(--line-2)', borderRadius:18,
        display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow:'0 24px 80px rgba(0,0,0,.5)',
      }}>
        <header style={{ padding:'24px 24px 20px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:52, height:52, borderRadius:14, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name={ICONS[obj.type] || 'grid'} size={26}/>
            </div>
            <div>
              <div className="label" style={{ color:'var(--accent)', marginBottom:4 }}>{obj.branche} · {obj.type}</div>
              <h2 className="display" style={{ fontSize:24, lineHeight:1.1, marginBottom:4 }}>{obj.nom}</h2>
              <div className="mono" style={{ fontSize:11, color:'var(--text-3)' }}>{obj.code} · {obj.marque}</div>
            </div>
          </div>
          <button onClick={onClose} style={iconBtn}><Icon name="close" size={14}/></button>
        </header>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:24 }}>
          <div>
            <div className="label" style={{ marginBottom:10 }}>Lecture en direct</div>
            <div style={{
              padding:'24px 20px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            }}>
              <div className="display" style={{ fontSize:48, color: obj.etat==='ACTIF' ? 'var(--accent)' : 'var(--text-3)', lineHeight:1 }}>
                {sparkData.length > 0
                  ? `${sparkData[sparkData.length - 1].valeur.toFixed(1)} ${sparkData[sparkData.length - 1].unite || ''}`.trim()
                  : obj.valeur}
              </div>
              <div className="label" style={{ color:'var(--text-3)' }}>{obj.pieceNom} · {obj.connectivite}</div>
            </div>
          </div>

          {branche === 'Ouvrant' && (
            <div>
              <div className="label" style={{ marginBottom:10, display:'flex', justifyContent:'space-between' }}>
                <span>{obj.type === 'Porte' || obj.type === 'PorteGarage' ? 'Ouverture' : 'Position'}</span>
                <span className="mono num" style={{ color: accent, textTransform:'none', letterSpacing:0, fontFamily:"'Geist Mono', monospace" }}>
                  {sliderPos != null ? `${sliderPos}%` : '—'}
                </span>
              </div>
              <div style={{
                padding:'18px 20px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)',
                display:'flex', flexDirection:'column', gap:12,
              }}>
                <input
                  type="range"
                  min="0" max="100" step="1"
                  value={sliderPos ?? 0}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  disabled={!canManage}
                  aria-label={`Position de ${obj.nom}`}
                  style={{ width:'100%', accentColor: accent }}
                />
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {PRESETS_VOLET.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => canManage && setSliderPos(preset.value)}
                      disabled={!canManage}
                      style={{
                        flex:1, minWidth:0, padding:'6px 8px', borderRadius:8, fontSize:11,
                        background: sliderPos === preset.value ? accent : 'var(--bg-3)',
                        color: sliderPos === preset.value ? '#0e1116' : 'var(--text-2)',
                        border:`1px solid ${sliderPos === preset.value ? accent : 'var(--line)'}`,
                        fontWeight: sliderPos === preset.value ? 600 : 400,
                        cursor: canManage ? 'pointer' : 'not-allowed',
                      }}
                    >{preset.label}</button>
                  ))}
                </div>
                {canManage && (
                  <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSliderPos(obj.position ?? 0)}
                      disabled={savingPos || sliderPos === (obj.position ?? 0)}
                      style={{ ...ctaSec, padding:'8px 14px', fontSize:12, opacity: sliderPos === (obj.position ?? 0) ? 0.5 : 1 }}
                    >Annuler</button>
                    <button
                      type="button"
                      onClick={applyPosition}
                      disabled={savingPos || sliderPos === (obj.position ?? 0)}
                      style={{ ...ctaPri, background: accent, padding:'8px 14px', fontSize:12, opacity: sliderPos === (obj.position ?? 0) ? 0.5 : 1 }}
                    >{savingPos ? 'Application…' : 'Appliquer'} <Icon name="arrow" size={12}/></button>
                  </div>
                )}
                {!canManage && (
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>
                    Lecture seule — niveau Avancé requis pour modifier la position.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LaveLinge — programme + paramètres + lancer cycle */}
          {obj.type === 'LaveLinge' && (
            <LaveLingeControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet}/>
          )}

          {/* Television — chaîne / volume / source */}
          {obj.type === 'Television' && (
            <TelevisionControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet}/>
          )}

          {/* Thermostat — consigne + mode */}
          {obj.type === 'Thermostat' && (
            <ThermostatControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet} latestMeasure={sparkData[sparkData.length - 1]}/>
          )}

          {/* Climatiseur — mode + tempCible */}
          {obj.type === 'Climatiseur' && (
            <ClimatiseurControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet}/>
          )}

          {/* Alarme — statut + zones + tester */}
          {obj.type === 'Alarme' && (
            <AlarmeControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet}/>
          )}

          {/* Camera — flux placeholder + résolution + mode + enregistrement */}
          {obj.type === 'Camera' && (
            <CameraControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet} onSimulateEvent={onSimulateEvent}/>
          )}

          {/* DetecteurMouvement — sensibilité + simulate + dernière détection */}
          {obj.type === 'DetecteurMouvement' && (
            <MotionSensorControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet} onSimulateEvent={onSimulateEvent}/>
          )}

          {/* BesoinAnimal — réservoir + portion + distribuer/remplir */}
          {branche === 'BesoinAnimal' && (
            <PetFeederControl obj={obj} accent={accent} canManage={canManage} onUpdate={onUpdateObjet}/>
          )}

          {branche === 'Capteur' && sparkData.length > 1 && (
            <div>
              <div className="label" style={{ marginBottom:10, display:'flex', justifyContent:'space-between' }}>
                <span>Mesures · {sparkData[0].grandeur}</span>
                <span style={{ color:'var(--text-4)', fontFamily:"'Geist Mono', monospace", letterSpacing:0, textTransform:'none' }}>
                  {sparkData.length} pts
                </span>
              </div>
              <div style={{ padding:'14px 16px', borderRadius:14, background:'var(--bg-2)', border:'1px solid var(--line)' }}>
                <Sparkline data={sparkData} color={accent}/>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11, color:'var(--text-4)' }}>
                  <span>min {Math.min(...sparkData.map(d=>d.valeur)).toFixed(1)} {sparkData[0].unite}</span>
                  <span>max {Math.max(...sparkData.map(d=>d.valeur)).toFixed(1)} {sparkData[0].unite}</span>
                </div>
              </div>
            </div>
          )}

          {/* Métadonnées résiduelles (fields type-aware déjà montés dans les panels dédiés) */}
          {(() => {
            const HIDDEN = new Set([
              'id','code','nom','branche','marque','valeur','pieceNom','connectivite','position','service','type','etat',
              'programme','tempLavage','vitesseEssorage','dureeRestante','dureeProgrammeMin','dateDebutCycle','cycle','consoEnergie',
              'chaine','volume','source',
              'tempCible','mode',
              'niveau','niveauReservoir','animal','portionGrammes','derniereDistribution','prochaineDistribution',
              'statusLabel','batterie','dateInscription','prenom',
            ])
            const entries = Object.entries(obj).filter(([k, v]) => v != null && v !== '' && !HIDDEN.has(k))
            if (entries.length === 0) return null
            return (
              <div>
                <div className="label" style={{ marginBottom:10 }}>Métadonnées</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {entries.map(([k, v]) => (
                    <div key={k} style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg-2)', border:'1px solid var(--line)' }}>
                      <div className="label" style={{ fontSize:9, marginBottom:3 }}>{k}</div>
                      <div className="display" style={{ fontSize:14, color:'var(--text)' }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          <div>
            <div className="label" style={{ marginBottom:10, display:'flex', justifyContent:'space-between' }}>
              <span>Méthodes UML</span>
              {!canManage && <span style={{ color:'var(--text-4)', textTransform:'none', letterSpacing:0, fontFamily:'inherit' }}>lecture seule</span>}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {methodes.map(m => {
                const enabled = canManage && isMethodActionable(m, obj)
                const busy = busyMethod === m
                return (
                  <button
                    key={m}
                    className="mono"
                    type="button"
                    onClick={enabled ? () => handleMethod(m) : undefined}
                    disabled={!enabled || busy}
                    aria-disabled={!enabled || busy}
                    title={enabled ? `Exécuter ${m}` : 'Action non disponible avec votre niveau'}
                    style={{
                      padding:'8px 12px', fontSize:12, borderRadius:8,
                      background: enabled ? 'var(--bg-3)' : 'var(--bg-2)',
                      color: enabled ? 'var(--text-2)' : 'var(--text-4)',
                      border:'1px solid var(--line-2)',
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >{busy ? `${m}…` : m}</button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom:10 }}>Historique récent</div>
            <div style={{ borderRadius:12, background:'var(--bg-2)', border:'1px solid var(--line)', padding:'14px 16px' }}>
              {!canManage && (
                <div style={{ fontSize:12, color:'var(--text-3)' }}>Réservé aux comptes <strong>Avancé</strong>.</div>
              )}
              {canManage && actLoading && <div style={{ fontSize:12, color:'var(--text-3)' }}>Chargement…</div>}
              {canManage && actError && <div style={{ fontSize:12, color:'var(--red)' }}>{actError}</div>}
              {canManage && !actLoading && !actError && activity.length === 0 && (
                <div style={{ fontSize:12, color:'var(--text-3)' }}>Aucune action enregistrée pour cet objet.</div>
              )}
              {canManage && !actLoading && activity.map((h, i) => (
                <div key={h.id ?? i} style={{ display:'flex', gap:14, padding:'8px 0', fontSize:12, borderBottom: i<activity.length-1 ? '1px solid var(--line)' : 'none' }}>
                  <span className="mono" style={{ color:'var(--text-4)', minWidth:60 }}>{fmtTime(h.timestamp)}</span>
                  <span style={{ color:'var(--text-2)', flex:1 }}>
                    <span className="mono" style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'var(--bg-3)', color: accent, marginRight:8 }}>{h.action}</span>
                    {h.details || (h.utilisateurEmail ? `par ${h.utilisateurEmail}` : '—')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── HOUSE MAP ───────────────────────────── */
function HouseMap({ items, pieces }) {
  const piecesList = pieces?.length ? pieces : PIECES
  const counts = {};
  piecesList.forEach(p => { counts[p.nom] = items.filter(o=>o.pieceNom===p.nom && o.etat==='ACTIF').length; });
  const totalActive = Object.values(counts).reduce((a,b)=>a+b,0)
  const maxActive = Math.max(1, ...Object.values(counts))
  return (
    <div style={{
      borderRadius:18, background:'var(--surface)', border:'1px solid var(--line)',
      padding:'24px', position:'relative', overflow:'hidden',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div className="label" style={{ marginBottom:6 }}>Carte de la maison</div>
          <h3 className="display" style={{ fontSize:22 }}>Vue d'ensemble</h3>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--text-3)' }}>
          <span className="num display" style={{ fontSize:32, color:'var(--accent)', lineHeight:1 }}>{totalActive}</span>
          <span style={{ lineHeight:1.3 }}>objets<br/>actifs</span>
        </div>
      </div>
      <div style={{
        display:'grid',
        gridTemplateColumns:`repeat(${Math.min(piecesList.length, 3)}, 1fr)`,
        gap:8, position:'relative',
      }}>
        {piecesList.map(p => {
          const c = counts[p.nom] || 0;
          const intensity = c / maxActive;
          const icon = p.icon || ROOM_ICONS[p.nom] || '•'
          const surface = p.surface != null ? `${p.surface}m²` : (p.type || 'Pièce')
          return (
            <div key={p.id ?? p.nom} style={{
              borderRadius:12, padding:'14px 16px', minHeight:108,
              background: c > 0 ? `linear-gradient(135deg, rgba(255,181,71,${intensity*0.3}), var(--bg-2))` : 'var(--bg-2)',
              border: '1px solid var(--line)',
              display:'flex', flexDirection:'column', justifyContent:'space-between',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{ fontSize:22 }} aria-hidden="true">{icon}</span>
                {c > 0 && <span aria-label={`${c} objets actifs`} style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', boxShadow:`0 0 8px var(--accent)` }}/>}
              </div>
              <div>
                <div className="display" style={{ fontSize:15, color:'var(--text)' }}>{p.nom}</div>
                <div className="mono" style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                  <span className="num" style={{ color: c>0 ? 'var(--accent)' : 'var(--text-3)' }}>{c}</span> actif{c!==1?'s':''} · {surface}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── HOME ─────────────────────────────────── */
function HomePage({ user, items, pieces, t, openDetail, onCreateObjet, canManage, scenarios = [], onRunScenario, energy }) {
  const [showAlerts, setShowAlerts] = useState(false)
  const [runningScenarioId, setRunningScenarioId] = useState(null)
  const actifs = items.filter(o => o.etat==='ACTIF').length;
  const lowBat = items.filter(o => o.batterie!=null && o.batterie<20);
  const inactifs = items.filter(o => o.etat === 'INACTIF')
  const alerts = [...lowBat.map(o => ({ kind:'battery', obj:o })), ...inactifs.slice(0, 5).map(o => ({ kind:'inactive', obj:o }))]
  const consumption = energy?.consoTotaleKwh ?? (items.filter(o => o.etat==='ACTIF' && o.branche === 'Appareil').length * 1.2);
  const hour = new Date().getHours();
  const greeting = hour<12 ? 'Bonjour' : hour<18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="rise">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32, gap:32 }}>
        <div>
          <div className="label" style={{ marginBottom:10, color: t.accent }}>{new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })}</div>
          <h1 className="display" style={{ fontSize:56, lineHeight:1, letterSpacing:'-0.03em' }}>
            {greeting}, <span className="display-i" style={{ color: t.accent }}>{user?.prenom || 'visiteur'}</span>.
          </h1>
          <p style={{ fontSize:16, color:'var(--text-2)', marginTop:14, maxWidth:580 }}>
            {actifs} objet{actifs>1?'s':''} en service dans la maison <span style={{color:'var(--text)'}}>{t.houseName}</span>.{' '}
            {lowBat.length > 0 && <span style={{color:'var(--accent)'}}>{lowBat.length} batterie{lowBat.length>1?'s':''} faible{lowBat.length>1?'s':''}.</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button
            type="button"
            onClick={() => setShowAlerts((v) => !v)}
            aria-expanded={showAlerts}
            aria-controls="home-alerts-panel"
            style={{ ...ctaSec, position:'relative' }}
          >
            <Icon name="bell" size={14}/> Alertes
            {alerts.length > 0 && (
              <span aria-label={`${alerts.length} alertes`} style={{
                position:'absolute', top:-4, right:-4, minWidth:18, height:18, padding:'0 5px',
                background:'var(--red)', color:'#0e1116', borderRadius:99, fontSize:10, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{alerts.length}</span>
            )}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => onCreateObjet?.()}
              style={{...ctaPri, background: t.accent}}
              title="Aller à Gestion et créer un objet"
            >
              <Icon name="plus" size={14}/> Nouvel objet
            </button>
          )}
        </div>
      </div>

      {showAlerts && (
        <div id="home-alerts-panel" className="rise" role="region" aria-label="Alertes maison" style={{
          marginBottom:24, borderRadius:14, padding:'16px 20px',
          background:'var(--surface)', border:`1px solid ${t.accent}40`,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <h3 className="display" style={{ fontSize:16 }}>Alertes ({alerts.length})</h3>
            <button type="button" onClick={() => setShowAlerts(false)} aria-label="Fermer le panneau d'alertes" style={iconBtn}>
              <Icon name="close" size={12}/>
            </button>
          </div>
          {alerts.length === 0 ? (
            <div style={{ fontSize:13, color:'var(--text-3)' }}>Tout va bien — aucune anomalie détectée.</div>
          ) : (
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8 }}>
              {alerts.slice(0, 8).map((a, i) => (
                <li key={`${a.kind}-${a.obj.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => openDetail(a.obj)}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', gap:12,
                      padding:'10px 12px', borderRadius:10, background:'var(--bg-2)', textAlign:'left',
                    }}
                  >
                    <span style={{
                      width:8, height:8, borderRadius:'50%',
                      background: a.kind === 'battery' ? 'var(--red)' : 'var(--text-4)',
                    }}/>
                    <span style={{ flex:1, fontSize:13, color:'var(--text)' }}>
                      <span className="mono" style={{ fontSize:10, marginRight:8, color: a.kind==='battery' ? 'var(--red)' : 'var(--text-3)' }}>
                        {a.kind === 'battery' ? 'BATTERIE' : 'INACTIF'}
                      </span>
                      {a.obj.nom}
                      <span className="mono" style={{ fontSize:10, color:'var(--text-4)', marginLeft:8 }}>
                        {a.obj.pieceNom}{a.kind==='battery' && a.obj.batterie != null ? ` · ${a.obj.batterie}%` : ''}
                      </span>
                    </span>
                    <Icon name="chevR" size={12}/>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canManage && scenarios.length > 0 && (
        <div className="rise" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
            <h3 className="display" style={{ fontSize:18 }}>Modes rapides</h3>
            <span className="label">un clic — toute la maison réagit</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(4, scenarios.length)}, 1fr)`, gap:10 }}>
            {scenarios.slice(0, 4).map((s) => {
              const running = runningScenarioId === s.id
              const disabled = running || s.enabled === false
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={disabled}
                  aria-label={`Exécuter le scénario ${s.nom}`}
                  onClick={async () => {
                    if (!onRunScenario) return
                    setRunningScenarioId(s.id)
                    try { await onRunScenario(s.id) } finally { setRunningScenarioId(null) }
                  }}
                  style={{
                    position:'relative', overflow:'hidden',
                    padding:'18px 20px', borderRadius:14,
                    background: running ? 'var(--accent-soft)' : 'var(--surface)',
                    border:`1px solid ${running ? t.accent : 'var(--line)'}`,
                    color: 'var(--text)', textAlign:'left',
                    display:'flex', flexDirection:'column', gap:8,
                    transition:'transform .15s, border-color .15s',
                    opacity: disabled && !running ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e)=>{ if(!disabled) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e)=>{ e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span style={{ fontSize:32, lineHeight:1 }} aria-hidden="true">{s.icon || '⚡'}</span>
                    <span className="mono" style={{
                      fontSize:9, padding:'2px 7px', borderRadius:99,
                      background:'var(--bg-3)', color: s.type === 'SCHEDULED' ? t.accent : 'var(--text-3)',
                    }}>{s.type === 'SCHEDULED' ? 'AUTO' : s.type === 'CONDITIONAL' ? 'TRIGGER' : 'MANUEL'}</span>
                  </div>
                  <div>
                    <div className="display" style={{ fontSize:18, lineHeight:1.1 }}>{s.nom}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>
                      {running ? 'Exécution…' : (s.actions?.length || 0) + ' action' + ((s.actions?.length || 0) > 1 ? 's' : '')}
                      {s.type === 'SCHEDULED' && s.cron && <> · {humanCron(s.cron)}</>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* KPI ROW */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Objets total', val:items.length, sub:'enregistrés', color: 'var(--text)', icon:'grid' },
          { label:'En service', val:actifs, sub:`${items.length ? Math.round(actifs/items.length*100) : 0}% actifs`, color: 'var(--green)', icon:'power' },
          { label:'Conso estimée', val:`${consumption.toFixed(1)}`, sub:'kWh / heure', color: t.accent, icon:'bolt', unit:'' },
          { label:'Alertes', val:lowBat.length, sub: lowBat.length>0 ? 'à recharger' : 'tout va bien', color: lowBat.length > 0 ? 'var(--red)' : 'var(--text-2)', icon:'bell' },
        ].map(k => (
          <div key={k.label} style={{ borderRadius:14, padding:'18px 20px', background:'var(--surface)', border:'1px solid var(--line)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <span className="label">{k.label}</span>
              <span style={{ color: k.color, opacity:.7 }}><Icon name={k.icon} size={14}/></span>
            </div>
            <div className="display num" style={{ fontSize:36, lineHeight:1, color: k.color }}>{k.val}</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16, marginBottom:32 }}>
        <HouseMap items={items} pieces={pieces} t={t}/>
        <div style={{ borderRadius:18, background:'var(--surface)', border:'1px solid var(--line)', padding:24, display:'flex', flexDirection:'column' }}>
          <div className="label" style={{ marginBottom:6 }}>Modules</div>
          <h3 className="display" style={{ fontSize:22, marginBottom:16 }}>Trois espaces</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
            {[
              { n:'I', t:'Information', d:'Vitrine publique · index des objets', s:'P1', c:'var(--blue)' },
              { n:'II', t:'Visualisation', d:'Espace privé · profil · services', s:'P2', c: t.accent },
              { n:'III', t:'Gestion', d:'CRUD · statistiques · journal', s:'P3', c:'var(--purple)' },
            ].map(m => (
              <div key={m.t} style={{ padding:'14px 16px', borderRadius:12, background:'var(--bg-2)', border:'1px solid var(--line)', display:'flex', alignItems:'center', gap:14 }}>
                <div className="display num" style={{ fontSize:24, color: m.c, minWidth:32 }}>{m.n}</div>
                <div style={{ flex:1 }}>
                  <div className="display" style={{ fontSize:15 }}>{m.t}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>{m.d}</div>
                </div>
                <span className="mono" style={{ fontSize:10, color: m.c, padding:'3px 8px', borderRadius:99, border:`1px solid ${m.c}40` }}>{m.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <h3 className="display" style={{ fontSize:24 }}>Objets récents</h3>
        <span className="label">Cliquez pour voir le détail</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {items.slice(0,4).map((o, i) => <DeviceTile key={o.id} obj={o} idx={i} onClick={()=>openDetail(o)}/>)}
      </div>
    </div>
  );
}
const ctaPri = { padding:'10px 18px', borderRadius:10, background:'var(--accent)', color:'#0e1116', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600 };
const ctaSec = { padding:'10px 18px', borderRadius:10, background:'var(--surface)', color:'var(--text)', border:'1px solid var(--line-2)', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:500 };

/* ─── SEARCH ─────────────────────────────── */
function SearchPage({ items, pieces, openDetail, t }) {
  const piecesList = pieces?.length ? pieces : PIECES
  const [filters, setFilters] = useState({ branche:'', type:'', piece:'', q:'' });
  const filtered = useMemo(() => items.filter(o => {
    if (filters.branche && o.branche !== filters.branche) return false;
    if (filters.type && o.type !== filters.type) return false;
    if (filters.piece && o.pieceNom !== filters.piece) return false;
    if (filters.q && !`${o.nom} ${o.marque} ${o.type}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  }), [items, filters]);
  const types = [...new Set(items.map(o => o.type))].sort();
  const counts = {};
  piecesList.forEach(p => counts[p.nom] = items.filter(o=>o.pieceNom===p.nom).length);

  return (
    <div className="rise">
      <div style={{ marginBottom:28 }}>
        <div className="label" style={{ marginBottom:8, color: t.accent }}>Module I · accès public</div>
        <h1 className="display" style={{ fontSize:42, lineHeight:1.05 }}>Recherche d'<span className="display-i" style={{color: t.accent}}>objets connectés</span></h1>
        <p style={{ fontSize:15, color:'var(--text-2)', marginTop:10, maxWidth:620 }}>Filtres combinables · index complet de la collection. Aucune authentification requise.</p>
      </div>

      <div style={{ position:'relative', marginBottom:20 }}>
        <input
          placeholder="Rechercher par nom, type, marque…"
          aria-label="Rechercher par nom, type ou marque"
          value={filters.q}
          onChange={e=>setFilters({...filters, q:e.target.value})}
          style={{
            width:'100%', padding:'16px 20px 16px 50px', fontSize:15,
            background:'var(--surface)', border:'1px solid var(--line)', borderRadius:14,
            color:'var(--text)',
          }}
        />
        <div aria-hidden="true" style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }}>
          <Icon name="search" size={18}/>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        <RoomChip room={{nom:'Toutes', icon:'•'}} count={items.length} active={!filters.piece} onClick={()=>setFilters({...filters, piece:''})}/>
        {piecesList.map(p => <RoomChip key={p.id} room={p} count={counts[p.nom]} active={filters.piece===p.nom} onClick={()=>setFilters({...filters, piece: filters.piece===p.nom?'':p.nom})}/>)}
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:24, padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:12, alignItems:'center' }}>
        <span className="label">Filtres</span>
        <select value={filters.branche} onChange={e=>setFilters({...filters, branche:e.target.value})} style={selectStyle}>
          <option value="">Toutes branches</option>
          {['Ouvrant','Capteur','Appareil','BesoinAnimal'].map(b => <option key={b}>{b}</option>)}
        </select>
        <select value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})} style={selectStyle}>
          <option value="">Tous types</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <div style={{ flex:1 }}/>
        {(filters.branche || filters.type || filters.piece || filters.q) && (
          <button onClick={()=>setFilters({branche:'', type:'', piece:'', q:''})} style={{ ...ctaSec, padding:'8px 14px', fontSize:12 }}>
            Réinitialiser <Icon name="close" size={12}/>
          </button>
        )}
        <span className="mono num" style={{ fontSize:13, color: t.accent }}>{filtered.length}</span>
        <span style={{ fontSize:12, color:'var(--text-3)' }}>résultats</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 20px', borderRadius:14, background:'var(--surface)', border:'1px solid var(--line)' }}>
          <div className="display-i" style={{ fontSize:32, color:'var(--text-3)', marginBottom:8 }}>aucun résultat</div>
          <div style={{ fontSize:13, color:'var(--text-4)' }}>Ajustez les filtres ou la requête</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
          {filtered.map((o,i) => <DeviceTile key={o.id} obj={o} idx={i} onClick={()=>openDetail(o)}/>)}
        </div>
      )}
    </div>
  );
}
const selectStyle = { padding:'8px 12px', background:'var(--bg-2)', color:'var(--text)', border:'1px solid var(--line)', borderRadius:8, fontSize:13, cursor:'pointer' };

function AvatarBadge({ user, size = 48, accent = 'var(--accent)' }) {
  const initials = user?.photo || 'U'
  if (user?.photoDataUrl) {
    return (
      <img
        src={user.photoDataUrl}
        alt={`Avatar ${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'Avatar'}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.26),
          objectFit: 'cover',
          border: `1px solid ${accent}55`,
          boxShadow: `0 6px 20px ${accent}33`
        }}
      />
    )
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:Math.round(size * 0.26),
      background:`linear-gradient(135deg, ${accent}, #ff8a47)`, color:'#0e1116',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Fraunces', serif", fontSize:Math.max(12, Math.round(size * 0.38)), fontWeight:600,
      boxShadow:`0 8px 32px ${accent}40`,
    }}>{initials}</div>
  )
}

function ProfileEditorModal({ open, user, onClose, onUpdated, accent = 'var(--accent)' }) {
  const [form, setForm] = useState({
    pseudo:'', bioPublique:'', telephonePrive:'', adressePrivee:'',
    genre:'', dateNaissance:'', ville:''
  })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!open || !user) return
    setForm({
      pseudo: user.pseudo || '',
      bioPublique: user.bioPublique || '',
      telephonePrive: user.telephonePrive || '',
      adressePrivee: user.adressePrivee || '',
      genre: user.genre || '',
      dateNaissance: user.dateNaissance || '',
      ville: user.ville || ''
    })
    setMsg('')
  }, [open, user])

  if (!open || !user) return null

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const updated = await fetchJson('/api/visualisation/profile', {
        method: 'PUT',
        body: JSON.stringify(form)
      })
      onUpdated?.(toUiUser(updated), 'Profil mis à jour ✅')
    } catch (err) {
      setMsg(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const uploadPhoto = async (file) => {
    if (!file) return
    setSaving(true)
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const response = await fetch(toApiUrl('/api/visualisation/profile/photo'), {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      const text = await response.text()
      const payload = text ? JSON.parse(text) : null
      if (!response.ok) {
        const message = payload?.message || payload?.error || `HTTP ${response.status}`
        throw new Error(message)
      }
      onUpdated?.(toUiUser(payload), 'Photo profil mise à jour ✅')
    } catch (err) {
      setMsg(`Erreur: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Modifier mon profil" style={{
      position:'fixed', inset:0, zIndex:320, background:'rgba(0,0,0,.58)',
      display:'grid', placeItems:'center', padding:20
    }}>
      <form onSubmit={save} style={{
        width:'min(760px, 100%)', borderRadius:16, background:'var(--surface)',
        border:'1px solid var(--line-2)', padding:18, display:'grid', gap:12
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 className="display" style={{ fontSize:24 }}>Mon profil</h3>
          <button type="button" onClick={onClose} style={ctaSec}>Fermer</button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background:'transparent', border:'none', padding:0, cursor:'pointer' }}>
            <AvatarBadge user={user} size={72} accent={accent} />
          </button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:'var(--text)' }}>{user.prenom} {user.nom}</div>
            <div className="mono" style={{ fontSize:11, color:'var(--text-3)' }}>{user.email}</div>
            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...ctaSec, marginTop:8, padding:'8px 12px', fontSize:12 }}>Changer la photo</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={(e) => uploadPhoto(e.target.files?.[0])} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:12 }}>
          <Field label="Pseudo"><input value={form.pseudo} onChange={(e)=>setForm((f)=>({ ...f, pseudo:e.target.value }))} style={inputStyle}/></Field>
          <Field label="Téléphone privé"><input value={form.telephonePrive} onChange={(e)=>setForm((f)=>({ ...f, telephonePrive:e.target.value }))} style={inputStyle}/></Field>
          <Field label="Ville"><input value={form.ville} onChange={(e)=>setForm((f)=>({ ...f, ville:e.target.value }))} style={inputStyle}/></Field>
          <Field label="Genre">
            <select value={form.genre} onChange={(e)=>setForm((f)=>({ ...f, genre:e.target.value }))} style={inputStyle}>
              <option value="">—</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
              <option value="AUTRE">Autre</option>
            </select>
          </Field>
          <Field label="Date de naissance"><input type="date" value={form.dateNaissance || ''} onChange={(e)=>setForm((f)=>({ ...f, dateNaissance:e.target.value || null }))} style={inputStyle}/></Field>
          <div />
          <div style={{ gridColumn:'span 2' }}><Field label="Bio publique"><input value={form.bioPublique} onChange={(e)=>setForm((f)=>({ ...f, bioPublique:e.target.value }))} style={inputStyle}/></Field></div>
          <div style={{ gridColumn:'span 2' }}><Field label="Adresse privée"><input value={form.adressePrivee} onChange={(e)=>setForm((f)=>({ ...f, adressePrivee:e.target.value }))} style={inputStyle}/></Field></div>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color: msg.startsWith('Erreur') ? 'var(--red)' : 'var(--text-3)' }}>{msg}</span>
          <button disabled={saving} type="submit" style={{ ...ctaPri, background: accent }}>{saving ? 'Enregistrement...' : 'Enregistrer profil'}</button>
        </div>
      </form>
    </div>
  )
}

/* ─── LOGIN / VISUALISATION ─────────────── */
function VisualisationPage({ user, pieces, refreshTick, onLogin, onRegister, onVerifyEmail, onResendVerification, onLogout, onSessionRefresh, openDetail, t }) {
  const [filters, setFilters] = useState({ service:'', etat:'', pieceId:'', q:'' });
  const [profile, setProfile] = useState(user);
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setProfile(user)
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const [profileData, servicesData] = await Promise.all([
          fetchJson('/api/visualisation/profile'),
          fetchJson('/api/visualisation/services')
        ])

        const params = new URLSearchParams()
        if (filters.service) params.set('service', filters.service)
        if (filters.etat) params.set('etat', filters.etat)
        if (filters.pieceId) params.set('pieceId', filters.pieceId)
        if (filters.q) params.set('q', filters.q)
        const url = params.toString() ? `/api/visualisation/objets?${params}` : '/api/visualisation/objets'
        const itemsData = await fetchJson(url)

        if (cancelled) return

        const uiProfile = toUiUser(profileData)
        setProfile(uiProfile)
        setServices(Array.isArray(servicesData) ? servicesData : [])
        setItems(Array.isArray(itemsData) ? itemsData.map(toUiItem) : [])
        // NB: do NOT call onSessionRefresh here — /profile already returns the
        // updated points snapshot (and triggering setUser here would change the
        // `user` prop reference and re-fire this effect → infinite loop).
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Erreur de chargement')
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => { cancelled = true }
    // Key on user?.id (stable), not the user object whose reference flips on every setUser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshTick, filters.service, filters.etat, filters.pieceId, filters.q])

  if (!user) {
    return (
      <LoginScreen
        onLogin={onLogin}
        onRegister={onRegister}
        onVerifyEmail={onVerifyEmail}
        onResendVerification={onResendVerification}
        t={t}
      />
    )
  }

  const currentUser = profile || user
  const currentNiv = NIVEAUX.find(n => n.code === currentUser.niveau) || NIVEAUX[0]
  const nextNiv = NIVEAUX[NIVEAUX.findIndex(n => n.code === currentUser.niveau) + 1]
  const xpPct = nextNiv
    ? Math.max(0, Math.min(100, Math.round((currentUser.points - currentNiv.seuil) / (nextNiv.seuil - currentNiv.seuil) * 100)))
    : 100

  return (
    <div className="rise">
      <div style={{ marginBottom:28 }}>
        <div className="label" style={{ marginBottom:8, color: t.accent }}>Module II · espace privé</div>
        <h1 className="display" style={{ fontSize:42, lineHeight:1.05 }}>Mon <span className="display-i" style={{color: t.accent}}>tableau de bord</span></h1>
      </div>

      <div style={{
        borderRadius:18, padding:'24px', marginBottom:24,
        background:'linear-gradient(135deg, var(--surface-2), var(--surface))',
        border:'1px solid var(--line-2)', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, borderRadius:'50%', background:`radial-gradient(circle, ${t.accent}30, transparent 70%)`, pointerEvents:'none' }}/>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:24, alignItems:'center', position:'relative' }}>
          <div>
            <AvatarBadge user={currentUser} size={72} accent={t.accent} />
          </div>

          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <h3 className="display" style={{ fontSize:24 }}>{currentUser.prenom} {currentUser.nom}</h3>
              <span style={{
                padding:'3px 10px', borderRadius:99, fontSize:11,
                background: 'var(--accent-soft)', color: t.accent, fontWeight:600,
              }}>{currentUser.typeMembre}</span>
            </div>
            <div className="mono" style={{ fontSize:12, color:'var(--text-3)', marginBottom:8 }}>@{currentUser.pseudo} · {currentUser.email}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, maxWidth:280, height:6, background:'var(--bg-3)', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${xpPct}%`, background: t.accent, borderRadius:99, transition:'width .4s' }}/>
              </div>
              <span className="mono" style={{ fontSize:11, color:'var(--text-3)' }}>
                {nextNiv ? `${currentUser.points.toFixed(2)} / ${nextNiv.seuil} pts → ${nextNiv.code}` : 'Niveau max'}
              </span>
            </div>
          </div>

          <div style={{ borderLeft:'1px solid var(--line-2)', paddingLeft:24, textAlign:'center' }}>
            <div className="label" style={{ marginBottom:4 }}>Niveau</div>
            <div className="display" style={{ fontSize:30, color: t.accent, lineHeight:1 }}>{currentUser.niveau}</div>
            <div className="mono" style={{ fontSize:10, color:'var(--text-4)', marginTop:4 }}>plafond : {currentUser.niveauMax}</div>
          </div>
          <div style={{ borderLeft:'1px solid var(--line-2)', paddingLeft:24, textAlign:'center' }}>
            <div className="label" style={{ marginBottom:4 }}>Points</div>
            <div className="display num" style={{ fontSize:30, lineHeight:1 }}>{Math.floor(currentUser.points)}</div>
            <button onClick={onLogout} style={{ marginTop:6, fontSize:11, color:'var(--text-3)', padding:'4px 8px' }}>Déconnexion ↗</button>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 }}>
        {['Acces','Surveillance','Confort','Animal'].map(s => {
          const apiService = services.find((x) => x.code === s)
          const cnt = apiService?.objets ?? items.filter(o => o.service===s).length
          return (
            <div key={s} style={{ borderRadius:14, padding:'18px 20px', background:'var(--surface)', border:'1px solid var(--line)' }}>
              <div className="label">{s}</div>
              <div className="display num" style={{ fontSize:32, color: t.accent, lineHeight:1, marginTop:6 }}>{cnt}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>objets liés</div>
            </div>
          );
        })}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center', flexWrap:'wrap' }}>
        <input
          placeholder="Rechercher dans mes objets…"
          aria-label="Rechercher dans mes objets"
          value={filters.q}
          onChange={e=>setFilters({...filters, q:e.target.value})}
          style={{ flex:1, minWidth:220, padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:10, fontSize:14 }}
        />
        <select aria-label="Filtre par service" value={filters.service} onChange={e=>setFilters({...filters, service:e.target.value})} style={selectStyle}>
          <option value="">Tous services</option>
          {['Acces','Surveillance','Confort','Animal'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select aria-label="Filtre par pièce" value={filters.pieceId} onChange={e=>setFilters({...filters, pieceId:e.target.value})} style={selectStyle}>
          <option value="">Toutes pièces</option>
          {(pieces?.length ? pieces : PIECES).map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
        </select>
        <select aria-label="Filtre par état" value={filters.etat} onChange={e=>setFilters({...filters, etat:e.target.value})} style={selectStyle}>
          <option value="">Tous états</option>
          <option>ACTIF</option><option>INACTIF</option>
        </select>
        {(filters.service || filters.pieceId || filters.etat || filters.q) && (
          <button type="button" onClick={() => setFilters({ service:'', etat:'', pieceId:'', q:'' })} style={{ ...ctaSec, padding:'8px 12px', fontSize:12 }}>
            Réinitialiser
          </button>
        )}
      </div>

      {error && <div style={{ marginBottom: 12, color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12, marginBottom:24 }}>
        {loading ? <p style={{ color:'var(--text-3)' }}>Chargement…</p> : items.map((o,i) => <DeviceTile key={o.id} obj={o} idx={i} onClick={()=>openDetail(o)}/>)}
      </div>

      <div style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:16 }}>
        <div style={{ fontSize:12, color:'var(--text-3)' }}>
          💡 La modification du profil se fait depuis la carte profil en bas à gauche (avatar + nom).
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, onRegister, onVerifyEmail, onResendVerification, t }) {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifyMsg, setVerifyMsg] = useState('')
  const [loginForm, setLoginForm] = useState({ email: 'parent@demo.local', motDePasse: 'demo1234' })
  const [registerForm, setRegisterForm] = useState({ prenom:'', nom:'', email:'', motDePasse:'', typeMembre:'PARENT_FAMILLE' })
  const [verifyForm, setVerifyForm] = useState({ email: '', token: '' })

  const runLogin = async (email, motDePasse) => {
    setLoading(true)
    setError('')
    try {
      await onLogin({ email, motDePasse })
    } catch (e) {
      const message = e.message || 'Connexion impossible'
      setError(message)
      if (message.toLowerCase().includes('email non vérifié') || message.toLowerCase().includes('non vérifi')) {
        setTab('verify')
        setVerifyForm((f) => ({ ...f, email }))
        setVerifyMsg('Ton compte doit être vérifié avant connexion.')
      }
    } finally {
      setLoading(false)
    }
  }

  const runRegister = async () => {
    setLoading(true)
    setError('')
    setVerifyMsg('')
    try {
      const result = await onRegister(registerForm)
      if (result?.verificationRequired) {
        setTab('verify')
        setVerifyForm({ email: result.email || registerForm.email, token: result.debugToken || '' })
        setVerifyMsg(result.debugToken
          ? `Compte créé. Code de vérification (dev): ${result.debugToken}`
          : 'Compte créé. Entre le code reçu par email.')
      }
    } catch (e) {
      setError(e.message || 'Inscription impossible')
    } finally {
      setLoading(false)
    }
  }

  const runVerify = async () => {
    setLoading(true)
    setError('')
    setVerifyMsg('')
    try {
      await onVerifyEmail(verifyForm)
      setVerifyMsg('Email vérifié ✅ Connexion active.')
    } catch (e) {
      setError(e.message || 'Vérification impossible')
    } finally {
      setLoading(false)
    }
  }

  const runResend = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await onResendVerification(verifyForm.email)
      setVerifyMsg(data?.debugToken
        ? `Nouveau code (dev): ${data.debugToken}`
        : 'Code renvoyé (si le compte existe et n\'est pas vérifié).')
    } catch (e) {
      setError(e.message || 'Renvoi impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rise" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, minHeight:600 }}>
      <div style={{
        borderRadius:18, padding:'32px', position:'relative', overflow:'hidden',
        background:`linear-gradient(135deg, ${t.accent}, #ff8a47)`,
        color:'#0e1116', display:'flex', flexDirection:'column', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontSize:11, fontFamily:"'Geist Mono', monospace", textTransform:'uppercase', letterSpacing:'.08em', marginBottom:14, opacity:.7 }}>Module II</div>
          <h2 className="display" style={{ fontSize:42, lineHeight:1, marginBottom:14 }}>Identifiez-vous pour accéder à <span className="display-i">votre maison</span>.</h2>
          <p style={{ fontSize:14, opacity:.85, lineHeight:1.5 }}>Trois types de membres : ParentFamille, Enfant, VoisinVisiteur. Chaque type ouvre un niveau de droits différent.</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:32 }}>
          <div style={{ fontSize:11, fontFamily:"'Geist Mono', monospace", textTransform:'uppercase', letterSpacing:'.08em', opacity:.6, marginBottom:4 }}>Profils de démo backend</div>
          {DEMO_CREDENTIALS.map((demo) => (
            <button
              key={demo.email}
              type="button"
              onClick={() => runLogin(demo.email, demo.motDePasse)}
              aria-label={`Se connecter en tant que ${demo.label}`}
              style={{ padding:'12px 14px', background:'rgba(14,17,22,.85)', color:'#fff', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}
            >
              <div style={{ width:32, height:32, borderRadius:8, background: t.accent, color:'#0e1116', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces', serif", fontSize:14, fontWeight:600 }}>{demo.label[0]}</div>
              <div style={{ flex:1, textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{demo.label}</div>
                <div style={{ fontSize:11, opacity:.7, fontFamily:"'Geist Mono', monospace" }}>{demo.email} · plafond {demo.niveauMax}</div>
              </div>
              <Icon name="chevR" size={14}/>
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderRadius:18, padding:'32px', background:'var(--surface)', border:'1px solid var(--line)' }}>
        <div style={{ display:'flex', gap:4, padding:4, background:'var(--bg-2)', borderRadius:10, marginBottom:24 }}>
          {[
            { key:'login', label:'Connexion' },
            { key:'register', label:'Inscription' },
            { key:'verify', label:'Vérifier' }
          ].map(({ key, label }) => (
            <button key={key} onClick={()=>setTab(key)} style={{
              flex:1, padding:'9px', borderRadius:8, fontSize:13, fontWeight:500,
              background: tab===key ? 'var(--surface)' : 'transparent',
              color: tab===key ? 'var(--text)' : 'var(--text-3)',
              transition:'all .15s',
            }}>{label}</button>
          ))}
        </div>

        {tab==='login' ? (
          <form onSubmit={(e)=>{ e.preventDefault(); runLogin(loginForm.email, loginForm.motDePasse) }}>
            <h3 className="display" style={{ fontSize:26, marginBottom:24 }}>Heureux de vous revoir.</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Field label="Email">
                <input type="email" value={loginForm.email} onChange={(e)=>setLoginForm((f)=>({ ...f, email: e.target.value }))} style={inputStyle}/>
              </Field>
              <Field label="Mot de passe">
                <input type="password" value={loginForm.motDePasse} onChange={(e)=>setLoginForm((f)=>({ ...f, motDePasse: e.target.value }))} style={inputStyle}/>
              </Field>
              {error && <div style={{ color:'var(--red)', fontSize:12 }}>{error}</div>}
              <button disabled={loading} type="submit" style={{ marginTop:12, padding:'14px', background: t.accent, color:'#0e1116', borderRadius:10, fontSize:14, fontWeight:600, display:'flex', justifyContent:'center', alignItems:'center', gap:8 }}>
                {loading ? 'Connexion...' : <>Se connecter <Icon name="arrow" size={14}/></>}
              </button>
            </div>
          </form>
        ) : tab==='register' ? (
          <form onSubmit={(e)=>{ e.preventDefault(); runRegister() }}>
            <h3 className="display" style={{ fontSize:26, marginBottom:24 }}>Créer un compte.</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Field label="Prénom"><input value={registerForm.prenom} onChange={(e)=>setRegisterForm((f)=>({ ...f, prenom: e.target.value }))} style={inputStyle}/></Field>
              <Field label="Nom"><input value={registerForm.nom} onChange={(e)=>setRegisterForm((f)=>({ ...f, nom: e.target.value }))} style={inputStyle}/></Field>
              <div style={{ gridColumn:'span 2' }}><Field label="Email"><input type="email" value={registerForm.email} onChange={(e)=>setRegisterForm((f)=>({ ...f, email: e.target.value }))} style={inputStyle}/></Field></div>
              <Field label="Mot de passe"><input type="password" value={registerForm.motDePasse} onChange={(e)=>setRegisterForm((f)=>({ ...f, motDePasse: e.target.value }))} style={inputStyle}/></Field>
              <Field label="Type de membre">
                <select value={registerForm.typeMembre} onChange={(e)=>setRegisterForm((f)=>({ ...f, typeMembre: e.target.value }))} style={inputStyle}>
                  <option value="PARENT_FAMILLE">ParentFamille — Avancé</option>
                  <option value="ENFANT">Enfant — Intermédiaire</option>
                  <option value="VOISIN_VISITEUR">VoisinVisiteur — Débutant</option>
                </select>
              </Field>
            </div>
            {(error || verifyMsg) && <div style={{ color:error ? 'var(--red)' : 'var(--text-3)', fontSize:12, marginTop:10 }}>{error || verifyMsg}</div>}
            <button disabled={loading} style={{ marginTop:20, width:'100%', padding:'14px', background: t.accent, color:'#0e1116', borderRadius:10, fontSize:14, fontWeight:600 }}>{loading ? 'Création...' : 'Créer mon compte'}</button>
          </form>
        ) : (
          <form onSubmit={(e)=>{ e.preventDefault(); runVerify() }}>
            <h3 className="display" style={{ fontSize:26, marginBottom:24 }}>Vérifier mon email</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Field label="Email">
                <input type="email" value={verifyForm.email} onChange={(e)=>setVerifyForm((f)=>({ ...f, email: e.target.value }))} style={inputStyle}/>
              </Field>
              <Field label="Code de vérification">
                <input value={verifyForm.token} onChange={(e)=>setVerifyForm((f)=>({ ...f, token: e.target.value }))} style={inputStyle} placeholder="Code à 6 chiffres"/>
              </Field>
              {(error || verifyMsg) && <div style={{ color:error ? 'var(--red)' : 'var(--text-3)', fontSize:12 }}>{error || verifyMsg}</div>}
              <div style={{ display:'flex', gap:8 }}>
                <button disabled={loading} type="submit" style={{ ...ctaPri, background:t.accent, flex:1 }}>{loading ? 'Vérification...' : 'Valider le code'}</button>
                <button disabled={loading || !verifyForm.email} type="button" onClick={runResend} style={{ ...ctaSec }}>Renvoyer</button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <span className="label" style={{ fontSize:10 }}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = {
  padding:'12px 14px', background:'var(--bg-2)', border:'1px solid var(--line)', borderRadius:10,
  fontSize:14, color:'var(--text)', width:'100%',
};

/* ─── GESTION ──────────────────────────── */
function GestionPage({ user, pieces, openDetail, t, refreshTick, openFormSignal, onFormHandled, scenarios = [], onRunScenario, onScenariosChanged, energy }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [myDeleteRequests, setMyDeleteRequests] = useState([])
  const [maintenanceItems, setMaintenanceItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialGestionForm())

  useEffect(() => {
    if (openFormSignal && user?.niveauMax === 'Avancé') {
      setEditing(null)
      setForm(initialGestionForm())
      setShowForm(true)
      window.scrollTo({ top: 240, behavior: 'smooth' })
      onFormHandled?.()
    }
  }, [openFormSignal, user?.niveauMax, onFormHandled])

  const loadGestion = async () => {
    if (!user || user.niveauMax !== 'Avancé') return
    setLoading(true)
    setError('')
    try {
      const [objetsData, historyData, statsData, demandesData, maintenanceData] = await Promise.all([
        fetchJson('/api/gestion/objets'),
        fetchJson('/api/gestion/historique?limit=40'),
        fetchJson('/api/gestion/stats'),
        fetchJson('/api/gestion/demandes-suppression/mes-demandes').catch(() => []),
        fetchJson('/api/gestion/maintenance').catch(() => [])
      ])
      setItems(Array.isArray(objetsData) ? objetsData.map(toUiItem) : [])
      setHistory(Array.isArray(historyData) ? historyData.map(historyToUiItem) : [])
      setStats(statsData)
      setMyDeleteRequests(Array.isArray(demandesData) ? demandesData : [])
      setMaintenanceItems(Array.isArray(maintenanceData) ? maintenanceData : [])
    } catch (e) {
      setError(e.message || 'Erreur chargement gestion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGestion()
  }, [user?.email, refreshTick])

  if (!user) {
    return (
      <div className="rise" style={{ padding:'80px 0', textAlign:'center', maxWidth:480, margin:'0 auto' }}>
        <div style={{ width:64, height:64, borderRadius:18, background:'var(--accent-soft)', color: t.accent, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Icon name="lock" size={28}/>
        </div>
        <h2 className="display" style={{ fontSize:28, marginBottom:10 }}>Connexion requise</h2>
        <p style={{ fontSize:14, color:'var(--text-2)' }}>Le module Gestion est réservé aux comptes authentifiés (niveauMax = Avancé). Connectez-vous via l'onglet « Mes objets ».</p>
      </div>
    );
  }
  if (user.niveauMax !== 'Avancé') {
    return (
      <div className="rise" style={{ padding:'80px 0', textAlign:'center', maxWidth:520, margin:'0 auto' }}>
        <div style={{ width:64, height:64, borderRadius:18, background:'var(--red-soft)', color:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Icon name="lock" size={28}/>
        </div>
        <div className="label" style={{ color:'var(--red)', marginBottom:6 }}>Accès refusé</div>
        <h2 className="display" style={{ fontSize:28, marginBottom:10 }}>Plafond <span className="display-i" style={{color:'var(--red)'}}>{user.niveauMax}</span> atteint</h2>
        <p style={{ fontSize:14, color:'var(--text-2)', marginBottom:18 }}>Le module Gestion exige niveauMax = Avancé. Votre type de membre <strong>{user.typeMembre}</strong> est plafonné à {user.niveauMax}.</p>
        <div style={{ padding:'16px', borderRadius:12, background:'var(--surface)', border:'1px solid var(--line)', textAlign:'left', fontSize:12, color:'var(--text-3)' }}>
          <div className="label" style={{ marginBottom:8 }}>Hiérarchie des plafonds</div>
          VoisinVisiteur → Débutant<br/>Enfant → Intermédiaire<br/>ParentFamille → Avancé
        </div>
      </div>
    );
  }

  const parPiece = stats?.parPiece?.map((p) => ({ piece: p.piece, count: p.objets })) || Object.entries(items.reduce((acc, o) => {
    acc[o.pieceNom] = (acc[o.pieceNom] || 0) + 1
    return acc
  }, {})).map(([piece, count]) => ({ piece, count }))

  const flash = (s) => { setMsg(s); setTimeout(()=>setMsg(''), 2500); };

  const downloadCsv = async (kind) => {
    try {
      const response = await fetch(toApiUrl(`/api/gestion/exports/${kind}`), { credentials: 'include' })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = kind === 'objets' ? 'gestion_objets.csv' : 'gestion_conso.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      flash(`Export CSV ${kind} téléchargé`) 
    } catch (e) {
      setError(e.message || 'Export impossible')
    }
  }

  const acts = {
    edit: async (o) => {
      try {
        const detail = await fetchJson(`/api/gestion/objets/${o.id}`)
        setForm(formFromDetail(detail))
        setEditing(o)
        setShowForm(true)
        window.scrollTo({top:240, behavior:'smooth'})
      } catch (e) {
        setError(e.message)
      }
    },
    toggle: async (o) => {
      try {
        const newEtat = o.etat==='ACTIF' ? 'INACTIF' : 'ACTIF'
        await fetchJson(`/api/gestion/objets/${o.id}/etat`, {
          method: 'PATCH',
          body: JSON.stringify({ actif: newEtat === 'ACTIF' })
        })
        flash(`${o.nom} → ${newEtat.toLowerCase()}`)
        await loadGestion()
      } catch (e) {
        setError(e.message)
      }
    },
    delete: async (id) => {
      try {
        const objet = items.find((x) => x.id === id)
        if (user?.admin) {
          await fetchJson(`/api/gestion/objets/${id}`, { method: 'DELETE' })
          flash('Objet supprimé.')
        } else {
          const raison = window.prompt('Raison de la demande de suppression (optionnel) :', '')
          await fetchJson(`/api/gestion/objets/${id}/demande-suppression`, {
            method: 'POST',
            body: JSON.stringify({ raison: raison || null })
          })
          flash(`Demande de suppression envoyée${objet ? ` pour ${objet.nom}` : ''}.`)
        }
        await loadGestion()
      } catch (e) {
        setError(e.message)
      }
    },
  };

  const repairItem = async (id) => {
    try {
      await fetchJson(`/api/gestion/objets/${id}/maintenance/reparer`, { method: 'POST' })
      flash('Maintenance marquée ✅')
      await loadGestion()
    } catch (e) {
      setError(e.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = payloadFromForm(form)
      if (editing) {
        await fetchJson(`/api/gestion/objets/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        flash('Objet mis à jour.')
      } else {
        await fetchJson('/api/gestion/objets', { method: 'POST', body: JSON.stringify(payload) })
        flash('Objet créé.')
      }
      setShowForm(false)
      setEditing(null)
      setForm(initialGestionForm())
      await loadGestion()
    } catch (e2) {
      setError(e2.message)
    }
  };

  const fmtTime = (ts) => {
    const d = ts ? new Date(ts) : new Date();
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'à l\'instant';
    if (diff < 3600000) return `il y a ${Math.floor(diff/60000)} min`;
    if (diff < 86400000) return `il y a ${Math.floor(diff/3600000)} h`;
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
  };

  const safePieces = pieces?.length ? pieces : PIECES

  return (
    <div className="rise">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <div className="label" style={{ marginBottom:8, color: t.accent }}>Module III · administration</div>
          <h1 className="display" style={{ fontSize:42, lineHeight:1.05 }}>Gestion des <span className="display-i" style={{color: t.accent}}>objets connectés</span></h1>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button type="button" onClick={() => downloadCsv('objets')} style={ctaSec}>Export objets CSV</button>
          <button type="button" onClick={() => downloadCsv('conso')} style={ctaSec}>Export conso CSV</button>
          <button onClick={()=>{ setEditing(null); setShowForm(!showForm); }} style={{...ctaPri, background: t.accent}}>
            <Icon name="plus" size={14}/>{showForm && !editing ? 'Replier' : 'Nouvel objet'}
          </button>
        </div>
      </div>

      {error && <div style={{ marginBottom: 10, color:'var(--red)', fontSize:12 }}>{error}</div>}
      {loading && <div style={{ marginBottom: 10, color:'var(--text-3)', fontSize:12 }}>Chargement des données...</div>}

      {msg && (
        <div className="rise" style={{ borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:13, background:'var(--green-soft)', color:'var(--green)', border:'1px solid var(--green)40', display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="bell" size={14}/>{msg}
        </div>
      )}

      {!user?.admin && (
        <article style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:14, marginBottom:16 }}>
          <h3 className="display" style={{ fontSize:18, marginBottom:8 }}>Mes demandes de suppression</h3>
          {myDeleteRequests.length === 0 && <p style={{ color:'var(--text-3)', fontSize:12 }}>Aucune demande pour le moment.</p>}
          <div style={{ display:'grid', gap:8 }}>
            {myDeleteRequests.slice(0, 5).map((r) => (
              <div key={r.id} style={{ border:'1px solid var(--line)', borderRadius:10, padding:10, background:'var(--bg-2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                  <strong style={{ fontSize:13 }}>{r.objetNom || 'Objet'}</strong>
                  <span className="mono" style={{ fontSize:10, color: r.status === 'PENDING' ? t.accent : 'var(--text-3)' }}>{r.status}</span>
                </div>
                {r.noteAdmin && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>Note admin: {r.noteAdmin}</div>}
              </div>
            ))}
          </div>
        </article>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 }}>
        {[
          { l:'Total', v:stats?.totalObjets ?? items.length, c:'var(--text)', i:'grid' },
          { l:'Actifs', v:stats?.actifs ?? items.filter(o=>o.etat==='ACTIF').length, c:'var(--green)', i:'power' },
          { l:'Inactifs', v:stats?.inactifs ?? items.filter(o=>o.etat==='INACTIF').length, c:'var(--text-3)', i:'close' },
          { l:'Actions', v:stats?.actionsHistorique ?? history.length, c: t.accent, i:'log' },
        ].map(k => (
          <div key={k.l} style={{ borderRadius:14, padding:'18px 20px', background:'var(--surface)', border:'1px solid var(--line)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div className="label">{k.l}</div>
              <div className="display num" style={{ fontSize:32, color: k.c, lineHeight:1, marginTop:4 }}>{k.v}</div>
            </div>
            <div style={{ color: k.c, opacity:.7 }}><Icon name={k.i} size={20}/></div>
          </div>
        ))}
      </div>

      <article style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:16, marginBottom:16 }}>
        <h3 className="display" style={{ fontSize:20, marginBottom:8 }}>
          Maintenance · <span className="mono" style={{ fontSize:12, color:t.accent }}>{maintenanceItems.length}</span>
        </h3>
        {maintenanceItems.length === 0 && <p style={{ color:'var(--text-3)', fontSize:12 }}>Aucun objet critique pour l’instant.</p>}
        <div style={{ display:'grid', gap:8 }}>
          {maintenanceItems.slice(0, 8).map((m) => (
            <div key={m.id} style={{ border:'1px solid var(--line)', borderRadius:10, background:'var(--bg-2)', padding:12, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
              <div>
                <div style={{ fontSize:13, color:'var(--text)' }}>{m.nom} · {m.type}</div>
                <div className="mono" style={{ fontSize:10, color:'var(--text-3)', marginTop:4 }}>
                  {m.pieceNom || 'Maison'} · {m.raisons?.join(' · ') || '-'}
                </div>
                <div style={{ fontSize:11, color: m.severite === 'CRITICAL' ? 'var(--red)' : (m.severite === 'HIGH' ? t.accent : 'var(--text-3)') }}>
                  Sévérité: {m.severite}
                </div>
              </div>
              <button type="button" style={{ ...ctaPri, background:'var(--green)' }} onClick={() => repairItem(m.id)}>
                Marquer réparé
              </button>
            </div>
          ))}
        </div>
      </article>

      <article style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:16, marginBottom:16 }}>
        <h3 className="display" style={{ fontSize:20, marginBottom:8 }}>
          Énergie · <span className="mono" style={{ fontSize:12, color:t.accent }}>{(energy?.consoTotaleKwh ?? 0).toFixed(2)} kWh</span>
        </h3>
        {!energy && <p style={{ color:'var(--text-3)', fontSize:12 }}>Données énergie indisponibles.</p>}
        {energy && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ padding:12, borderRadius:10, border:'1px solid var(--line)', background:'var(--bg-2)' }}>
              <div className="label" style={{ marginBottom:8 }}>Par pièce</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {(energy.parPiece || []).slice(0, 6).map((p) => (
                  <div key={p.piece} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-2)' }}>
                    <span>{p.piece}</span>
                    <span className="mono">{Number(p.consoKwh || 0).toFixed(2)} kWh</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding:12, borderRadius:10, border:'1px solid var(--line)', background:'var(--bg-2)' }}>
              <div className="label" style={{ marginBottom:8 }}>Top consommateurs</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {(energy.topConsommateurs || []).slice(0, 5).map((a) => (
                  <div key={a.objetId} style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:12, color:'var(--text-2)' }}>
                    <span style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nom}</span>
                    <span className="mono">{Number(a.consoKwh || 0).toFixed(2)} kWh</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>

      {showForm && (
        <form onSubmit={submit} className="rise" style={{ borderRadius:18, padding:'24px', marginBottom:24, background:'var(--surface)', border:`1px solid ${t.accent}40` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
            <h3 className="display" style={{ fontSize:22 }}>{editing ? <>Modifier <span className="display-i" style={{color: t.accent}}>{editing.nom}</span></> : 'Nouvel objet connecté'}</h3>
            <button type="button" onClick={()=>{ setShowForm(false); setEditing(null); setForm(initialGestionForm()) }} style={iconBtn}><Icon name="close" size={14}/></button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
            <Field label="Nom"><input required style={inputStyle} value={form.nom} onChange={(e)=>setForm((f)=>({ ...f, nom: e.target.value }))}/></Field>
            <Field label="Marque"><input style={inputStyle} value={form.marque} onChange={(e)=>setForm((f)=>({ ...f, marque: e.target.value }))}/></Field>
            <Field label="Type">
              <select style={inputStyle} value={form.type} onChange={(e)=>setForm((f)=>({ ...f, type: e.target.value }))}>
                {GESTION_TYPE_OPTIONS.map(tp => <option key={tp}>{tp}</option>)}
              </select>
            </Field>
            <Field label="Pièce">
              <select style={inputStyle} value={form.pieceId} onChange={(e)=>setForm((f)=>({ ...f, pieceId: e.target.value }))}>
                <option value="">Sélectionner</option>
                {safePieces.map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
              </select>
            </Field>
            {!OUVRANT_TYPES.has(form.type) && (
              <Field label="État"><select style={inputStyle} value={form.etat} onChange={(e)=>setForm((f)=>({ ...f, etat: e.target.value }))}><option>ACTIF</option><option>INACTIF</option></select></Field>
            )}
            <Field label="Connectivité"><select style={inputStyle} value={form.connectivite} onChange={(e)=>setForm((f)=>({ ...f, connectivite: e.target.value }))}><option>WIFI</option><option>BLUETOOTH</option></select></Field>
            <Field label="Batterie %"><input type="number" min="0" max="100" style={inputStyle} value={form.batterie} onChange={(e)=>setForm((f)=>({ ...f, batterie: e.target.value }))}/></Field>
            {(form.type === 'Porte' || form.type === 'Volet' || form.type === 'Fenetre') && <Field label="Position"><input type="number" style={inputStyle} value={form.position} onChange={(e)=>setForm((f)=>({ ...f, position: e.target.value }))}/></Field>}
            {(form.type === 'Thermostat' || form.type === 'Camera' || form.type === 'DetecteurMouvement') && <Field label="Zone"><input style={inputStyle} value={form.zone} onChange={(e)=>setForm((f)=>({ ...f, zone: e.target.value }))}/></Field>}
            {(form.type === 'Television' || form.type === 'LaveLinge' || form.type === 'Climatiseur' || form.type === 'Aspirateur') && <><Field label="Cycle"><input style={inputStyle} value={form.cycle} onChange={(e)=>setForm((f)=>({ ...f, cycle: e.target.value }))}/></Field><Field label="Conso énergie"><input type="number" step="0.1" style={inputStyle} value={form.consoEnergie} onChange={(e)=>setForm((f)=>({ ...f, consoEnergie: e.target.value }))}/></Field></>}
            {(form.type === 'Nourriture' || form.type === 'Eau') && <><Field label="Niveau"><input type="number" step="0.1" style={inputStyle} value={form.niveau} onChange={(e)=>setForm((f)=>({ ...f, niveau: e.target.value }))}/></Field><Field label="Animal"><input style={inputStyle} value={form.animal} onChange={(e)=>setForm((f)=>({ ...f, animal: e.target.value }))}/></Field></>}
            <div style={{ gridColumn:'span 2', display:'flex', alignItems:'flex-end', gap:8, justifyContent:'flex-end' }}>
              <button type="button" onClick={()=>{ setShowForm(false); setEditing(null); setForm(initialGestionForm()) }} style={ctaSec}>Annuler</button>
              <button type="submit" style={{...ctaPri, background: t.accent}}>{editing?'Enregistrer':'Créer'} <Icon name="arrow" size={13}/></button>
            </div>
          </div>
        </form>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <h3 className="display" style={{ fontSize:22 }}>Collection · <span className="num" style={{color: t.accent}}>{items.length}</span></h3>
        <span className="label">Actions × objet</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12, marginBottom:32 }}>
        {items.map((o) => <DeviceTile key={o.id} obj={o} onClick={()=>openDetail(o)} actions={acts}/>) }
      </div>

      <RoutinesSection
        scenarios={scenarios}
        objets={items}
        accent={t.accent}
        onRun={onRunScenario}
        onChanged={onScenariosChanged}
        onError={(m) => setError(m)}
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ borderRadius:18, padding:24, background:'var(--surface)', border:'1px solid var(--line)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Icon name="chart" size={18}/>
            <h3 className="display" style={{ fontSize:18 }}>Distribution par pièce</h3>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {parPiece.map(p => {
              const pct = items.length ? Math.round(p.count / items.length * 100) : 0;
              return (
                <div key={p.piece}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'var(--text)' }}>{p.piece}</span>
                    <span className="mono num" style={{ fontSize:11, color:'var(--text-3)' }}>{p.count} ({pct}%)</span>
                  </div>
                  <div style={{ height:6, background:'var(--bg-3)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: t.accent, borderRadius:99, transition:'width .4s' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderRadius:18, padding:24, background:'var(--surface)', border:'1px solid var(--line)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Icon name="grid" size={18}/>
            <h3 className="display" style={{ fontSize:18 }}>Répartition par service</h3>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {(stats?.parService?.length ? stats.parService : ['Acces','Surveillance','Confort','Animal'].map((c) => ({ code:c, libelle:c, objets: items.filter((o) => o.service === c).length }))).map((s) => {
              const total = stats?.totalObjets ?? items.length
              const pct = total ? Math.round((s.objets || 0) / total * 100) : 0
              return (
                <div key={s.code}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'var(--text)' }}>{s.libelle || s.code}</span>
                    <span className="mono num" style={{ fontSize:11, color:'var(--text-3)' }}>{s.objets} ({pct}%)</span>
                  </div>
                  <div style={{ height:6, background:'var(--bg-3)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: t.accent, borderRadius:99, transition:'width .4s' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16 }}>

        <div style={{ borderRadius:18, padding:24, background:'var(--surface)', border:'1px solid var(--line)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Icon name="log" size={18}/>
            <h3 className="display" style={{ fontSize:18 }}>Historique · <span className="num" style={{color: t.accent}}>{history.length}</span></h3>
          </div>
          <div style={{ maxHeight:340, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
            {history.slice().reverse().map(h => {
              const isScenario = h.action === 'SCENARIO_RUN';
              const isNeg = h.action.includes('DELETE') || h.action.includes('SUPPR') || h.action.includes('DÉSACT') || h.action.includes('INACTIF');
              const c = isScenario ? t.accent
                : (isNeg ? 'var(--red)'
                : (h.action.includes('LOGIN') || h.action.includes('CONNEXION') ? 'var(--blue)' : 'var(--green)'));
              return (
                <div key={h.id} style={{
                  display:'flex', gap:12, alignItems:'flex-start',
                  padding:'10px 12px', borderRadius:10,
                  background: isScenario ? 'var(--accent-soft)' : 'var(--bg-2)',
                  border: isScenario ? `1px solid ${t.accent}40` : '1px solid transparent',
                }}>
                  {isScenario ? (
                    <span style={{ color: t.accent, marginTop:1, flexShrink:0 }}><Icon name="bolt" size={14}/></span>
                  ) : (
                    <div style={{ width:6, height:6, borderRadius:'50%', background: c, marginTop:6, flexShrink:0 }}/>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:'var(--text)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span className="mono" style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'var(--bg-3)', color: c }}>{h.action}</span>
                      <span style={{ fontWeight: isScenario ? 600 : 500 }}>{isScenario ? (h.details || 'Scénario') : h.objetNom}</span>
                    </div>
                    {!isScenario && (
                      <div className="mono" style={{ fontSize:10, color:'var(--text-4)', marginTop:3 }}>
                        {h.code} · @{h.utilisateur} {h.details ? `· ${h.details}` : ''}
                      </div>
                    )}
                    {isScenario && (
                      <div className="mono" style={{ fontSize:10, color:'var(--text-4)', marginTop:3 }}>
                        @{h.utilisateur || 'system'}
                      </div>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize:10, color:'var(--text-4)', whiteSpace:'nowrap' }}>{fmtTime(h.timestamp)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROUTINES (Scénarios) ──────────────── */
function RoutinesSection({ scenarios, objets, accent, onRun, onChanged, onError }) {
  const [editing, setEditing] = useState(null) // null | 'new' | scenarioId
  const [busyId, setBusyId] = useState(null)

  const startCreate = () => setEditing('new')
  const startEdit = (s) => setEditing(s.id)
  const cancelEdit = () => setEditing(null)

  const submit = async (payload, id) => {
    try {
      if (id) {
        await fetchJson(`/api/gestion/scenarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await fetchJson('/api/gestion/scenarios', { method: 'POST', body: JSON.stringify(payload) })
      }
      setEditing(null)
      onChanged?.()
    } catch (e) {
      onError?.(e.message || 'Erreur lors de la sauvegarde du scénario')
    }
  }

  const toggleEnabled = async (s) => {
    setBusyId(s.id)
    try {
      await fetchJson(`/api/gestion/scenarios/${s.id}/enabled`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !s.enabled })
      })
      onChanged?.()
    } catch (e) {
      onError?.(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (s) => {
    if (!window.confirm(`Supprimer le scénario « ${s.nom} » ?`)) return
    try {
      await fetchJson(`/api/gestion/scenarios/${s.id}`, { method: 'DELETE' })
      onChanged?.()
    } catch (e) {
      onError?.(e.message)
    }
  }

  return (
    <section aria-label="Routines et scénarios" style={{ marginBottom:24 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
        <div>
          <h3 className="display" style={{ fontSize:22 }}>Routines · <span className="num" style={{ color: accent }}>{scenarios.length}</span></h3>
          <span className="label" style={{ color:'var(--text-3)' }}>scénarios programmables · manuels ou cron</span>
        </div>
        <button
          type="button"
          onClick={startCreate}
          style={{ ...ctaPri, background: accent }}
        >
          <Icon name="plus" size={14}/> Nouveau scénario
        </button>
      </div>

      {editing === 'new' && (
        <RoutineEditor
          objets={objets}
          accent={accent}
          onSubmit={(p) => submit(p, null)}
          onCancel={cancelEdit}
        />
      )}

      {scenarios.length === 0 && editing !== 'new' && (
        <div style={{
          padding:'40px 20px', borderRadius:14, background:'var(--surface)', border:'1px solid var(--line)',
          textAlign:'center',
        }}>
          <div className="display-i" style={{ fontSize:24, color:'var(--text-3)', marginBottom:6 }}>aucun scénario</div>
          <div style={{ fontSize:13, color:'var(--text-4)' }}>Créez un mode rapide ou une automatisation programmée.</div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 }}>
        {scenarios.map((s) => {
          if (editing === s.id) {
            return (
              <RoutineEditor
                key={s.id}
                scenario={s}
                objets={objets}
                accent={accent}
                onSubmit={(p) => submit(p, s.id)}
                onCancel={cancelEdit}
              />
            )
          }
          const running = busyId === s.id
          const isOff = s.enabled === false
          return (
            <article key={s.id} style={{
              padding:'18px 20px', borderRadius:14,
              background: 'var(--surface)',
              border: `1px solid ${isOff ? 'var(--line)' : 'var(--line-2)'}`,
              opacity: isOff ? 0.6 : 1,
              display:'flex', flexDirection:'column', gap:14,
            }}>
              <header style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <span aria-hidden="true" style={{ fontSize:32, lineHeight:1 }}>{s.icon || '⚡'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="display" style={{ fontSize:18, lineHeight:1.1 }}>{s.nom}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>
                    <span className="mono" style={{ marginRight:8, color: s.type === 'SCHEDULED' ? accent : 'var(--text-3)' }}>
                      {s.type === 'SCHEDULED' ? 'AUTO' : s.type === 'CONDITIONAL' ? 'TRIGGER' : 'MANUEL'}
                    </span>
                    {s.type === 'SCHEDULED' && s.cron && humanCron(s.cron)}
                    {s.type === 'CONDITIONAL' && ([
                      SCENARIO_TRIGGER_EVENTS.find((ev) => ev.code === s.triggerEvent)?.label || s.triggerEvent || 'événement',
                      s.condition || 'condition libre'
                    ].filter(Boolean).join(' · '))}
                    {s.type === 'MANUAL' && 'sur demande'}
                  </div>
                  {s.description && (
                    <div style={{ fontSize:12, color:'var(--text-2)', marginTop:8 }}>{s.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleEnabled(s)}
                  disabled={running}
                  aria-label={isOff ? 'Activer le scénario' : 'Désactiver le scénario'}
                  title={isOff ? 'Activer' : 'Désactiver'}
                  style={{
                    width:36, height:20, borderRadius:99, position:'relative',
                    background: isOff ? 'var(--bg-3)' : accent,
                    transition:'background .2s',
                  }}
                >
                  <span aria-hidden="true" style={{
                    position:'absolute', top:2, left: isOff ? 2 : 18,
                    width:16, height:16, borderRadius:99, background:'#fff',
                    transition:'left .2s',
                  }}/>
                </button>
              </header>

              <div style={{ borderRadius:10, background:'var(--bg-2)', border:'1px solid var(--line)', padding:'10px 12px' }}>
                <div className="label" style={{ marginBottom:6 }}>{s.actions.length} action{s.actions.length > 1 ? 's' : ''}</div>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:4, maxHeight:120, overflowY:'auto' }}>
                  {s.actions.length === 0 ? (
                    <li style={{ fontSize:11, color:'var(--text-4)' }}>Aucune action — éditez pour en ajouter.</li>
                  ) : s.actions.map((a) => (
                    <li key={a.id} style={{ fontSize:12, color:'var(--text-2)', display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background: a.targetEtat === 'ACTIF' ? 'var(--green)' : 'var(--text-4)' }}/>
                      <span style={{ flex:1 }}>{a.objetNom || `objet #${a.objetId}`}</span>
                      <span className="mono" style={{ fontSize:10, color:'var(--text-3)' }}>
                        → {a.targetEtat}{a.targetPosition != null ? ` ${a.targetPosition}%` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <footer style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 }}>
                <span className="mono" style={{ fontSize:10, color:'var(--text-4)' }}>
                  {s.derniereExecution ? `Dernière : ${new Date(s.derniereExecution).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}` : 'jamais exécuté'}
                </span>
                <div style={{ display:'flex', gap:4 }}>
                  <button type="button" onClick={() => onRun?.(s.id)} disabled={isOff} aria-label="Lancer le scénario" title="Lancer maintenant" style={{ ...iconBtn, color: accent }}>
                    <Icon name="bolt" size={13}/>
                  </button>
                  <button type="button" onClick={() => startEdit(s)} aria-label="Modifier" title="Modifier" style={iconBtn}>
                    <Icon name="edit" size={13}/>
                  </button>
                  <button type="button" onClick={() => remove(s)} aria-label="Supprimer" title="Supprimer" style={{ ...iconBtn, color:'var(--red)' }}>
                    <Icon name="trash" size={13}/>
                  </button>
                </div>
              </footer>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/* ─── ROUTINE EDITOR ────────────────────── */
function RoutineEditor({ scenario, objets, accent, onSubmit, onCancel }) {
  const isEdit = !!scenario
  const [form, setForm] = useState(() => ({
    nom: scenario?.nom || '',
    description: scenario?.description || '',
    icon: scenario?.icon || '⚡',
    type: scenario?.type || 'MANUAL',
    cron: scenario?.cron || CRON_PRESETS[0].cron,
    cronCustom: scenario && scenario.cron && !CRON_PRESETS.some((p) => p.cron === scenario.cron) ? scenario.cron : '',
    condition: scenario?.condition || '',
    triggerObjetId: scenario?.triggerObjetId ?? '',
    triggerEvent: scenario?.triggerEvent || 'MOTION_DETECTED',
    enabled: scenario?.enabled !== false,
    actions: (scenario?.actions || []).map((a) => ({
      objetId: a.objetId,
      targetEtat: a.targetEtat || 'ACTIF',
      targetPosition: a.targetPosition,
    })),
  }))

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const addAction = () => {
    setForm((f) => ({
      ...f,
      actions: [...f.actions, {
        objetId: objets[0]?.id ?? null,
        targetEtat: 'ACTIF',
        targetPosition: null,
      }]
    }))
  }
  const updateAction = (i, patch) => {
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, idx) => idx === i ? { ...a, ...patch } : a)
    }))
  }
  const removeAction = (i) => {
    setForm((f) => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.nom.trim()) return

    const cleanActions = form.actions
      .filter((a) => a.objetId != null)
      .map((a) => {
        const obj = objets.find((o) => o.id === a.objetId)
        const isOuvrant = obj?.branche === 'Ouvrant'
        return {
          objetId: Number(a.objetId),
          targetEtat: a.targetEtat,
          targetPosition: isOuvrant && a.targetPosition != null ? Number(a.targetPosition) : null,
        }
      })

    const payload = {
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      type: form.type,
      cron: form.type === 'SCHEDULED' ? (form.cronCustom.trim() || form.cron) : null,
      condition: form.type === 'CONDITIONAL' ? (form.condition.trim() || null) : null,
      triggerObjetId: form.type === 'CONDITIONAL' && form.triggerObjetId !== '' ? Number(form.triggerObjetId) : null,
      triggerEvent: form.type === 'CONDITIONAL' ? (form.triggerEvent || 'MOTION_DETECTED') : null,
      enabled: form.enabled,
      actions: cleanActions,
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="rise" style={{
      gridColumn:'1 / -1',
      padding:'20px 24px', borderRadius:14,
      background:'var(--surface)', border:`1px solid ${accent}40`,
      display:'flex', flexDirection:'column', gap:16,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h4 className="display" style={{ fontSize:20 }}>{isEdit ? <>Modifier <span className="display-i" style={{ color: accent }}>{scenario.nom}</span></> : 'Nouveau scénario'}</h4>
        <button type="button" onClick={onCancel} style={iconBtn} aria-label="Annuler"><Icon name="close" size={14}/></button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 120px', gap:12 }}>
        <Field label="Icône"><input maxLength={4} style={{ ...inputStyle, textAlign:'center', fontSize:22 }} value={form.icon} onChange={(e)=>setField('icon', e.target.value)}/></Field>
        <Field label="Nom"><input required maxLength={80} style={inputStyle} value={form.nom} onChange={(e)=>setField('nom', e.target.value)}/></Field>
        <Field label="Activé">
          <label style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'var(--bg-2)', borderRadius:10, border:'1px solid var(--line)' }}>
            <input type="checkbox" checked={form.enabled} onChange={(e)=>setField('enabled', e.target.checked)}/>
            <span style={{ fontSize:13 }}>{form.enabled ? 'Oui' : 'Non'}</span>
          </label>
        </Field>
      </div>

      <Field label="Description (optionnel)">
        <input maxLength={500} style={inputStyle} value={form.description} onChange={(e)=>setField('description', e.target.value)} placeholder="Ex : Ouverture matinale automatique"/>
      </Field>

      <div>
        <div className="label" style={{ marginBottom:6 }}>Déclencheur</div>
        <div style={{ display:'flex', gap:6 }}>
          {SCENARIO_TYPES.map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setField('type', tp)}
              aria-pressed={form.type === tp}
              style={{
                flex:1, padding:'10px 12px', borderRadius:10, fontSize:13,
                background: form.type === tp ? accent : 'var(--bg-2)',
                color: form.type === tp ? '#0e1116' : 'var(--text-2)',
                border: `1px solid ${form.type === tp ? accent : 'var(--line)'}`,
                fontWeight: form.type === tp ? 600 : 400,
              }}
            >{tp === 'MANUAL' ? 'Manuel' : tp === 'SCHEDULED' ? 'Programmé (cron)' : 'Conditionnel'}</button>
          ))}
        </div>
      </div>

      {form.type === 'SCHEDULED' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Préréglage">
            <select style={inputStyle} value={form.cron} onChange={(e)=>setField('cron', e.target.value)}>
              {CRON_PRESETS.map((p) => <option key={p.cron} value={p.cron}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Cron personnalisé (override)">
            <input style={inputStyle} value={form.cronCustom} onChange={(e)=>setField('cronCustom', e.target.value)} placeholder="0 0 8 * * MON-FRI"/>
          </Field>
        </div>
      )}

      {form.type === 'CONDITIONAL' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Événement déclencheur">
            <select style={inputStyle} value={form.triggerEvent} onChange={(e)=>setField('triggerEvent', e.target.value)}>
              {SCENARIO_TRIGGER_EVENTS.map((ev) => <option key={ev.code} value={ev.code}>{ev.label}</option>)}
            </select>
          </Field>
          <Field label="Objet source (optionnel)">
            <select style={inputStyle} value={form.triggerObjetId} onChange={(e)=>setField('triggerObjetId', e.target.value)}>
              <option value="">Tous les objets</option>
              {objets.map((o) => <option key={o.id} value={o.id}>{o.nom} · {o.pieceNom}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn:'1 / -1' }}>
            <Field label="Condition contexte (optionnel)">
              <input style={inputStyle} value={form.condition} onChange={(e)=>setField('condition', e.target.value)} placeholder="Ex : night ou temp<18"/>
            </Field>
          </div>
        </div>
      )}

      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div className="label">Actions ({form.actions.length})</div>
          <button type="button" onClick={addAction} style={{ ...ctaSec, padding:'6px 12px', fontSize:12 }}>
            <Icon name="plus" size={12}/> Ajouter une action
          </button>
        </div>
        {form.actions.length === 0 ? (
          <div style={{ padding:'14px', borderRadius:10, background:'var(--bg-2)', border:'1px dashed var(--line-2)', fontSize:12, color:'var(--text-3)', textAlign:'center' }}>
            Aucune action — ajoutez au moins un objet à piloter.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {form.actions.map((a, i) => {
              const obj = objets.find((o) => o.id === a.objetId)
              const isOuvrant = obj?.branche === 'Ouvrant'
              return (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns: isOuvrant ? '1.5fr 0.8fr 1fr 32px' : '1.5fr 0.8fr 32px',
                  gap:8, alignItems:'center',
                  padding:'8px', borderRadius:10, background:'var(--bg-2)', border:'1px solid var(--line)',
                }}>
                  <select
                    aria-label="Objet à piloter"
                    style={{ ...inputStyle, padding:'8px 10px' }}
                    value={a.objetId ?? ''}
                    onChange={(e) => {
                      const newId = Number(e.target.value)
                      const newObj = objets.find((o) => o.id === newId)
                      updateAction(i, {
                        objetId: newId,
                        targetPosition: newObj?.branche === 'Ouvrant' ? (a.targetPosition ?? 50) : null,
                      })
                    }}
                  >
                    {objets.map((o) => <option key={o.id} value={o.id}>{o.nom} · {o.pieceNom}</option>)}
                  </select>
                  <select
                    aria-label="État cible"
                    style={{ ...inputStyle, padding:'8px 10px' }}
                    value={a.targetEtat}
                    onChange={(e) => updateAction(i, { targetEtat: e.target.value })}
                  >
                    <option value="ACTIF">{isOuvrant ? '→ Ouvrir' : '→ Actif'}</option>
                    <option value="INACTIF">{isOuvrant ? '→ Fermer' : '→ Inactif'}</option>
                  </select>
                  {isOuvrant && (
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input
                        type="range" min="0" max="100" step="5"
                        aria-label="Position cible"
                        value={a.targetPosition ?? 50}
                        onChange={(e) => updateAction(i, { targetPosition: Number(e.target.value) })}
                        style={{ flex:1, accentColor: accent }}
                      />
                      <span className="mono num" style={{ fontSize:11, color:'var(--text-3)', minWidth:32 }}>
                        {a.targetPosition ?? 50}%
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAction(i)}
                    aria-label="Retirer l'action"
                    style={{ ...iconBtn, color:'var(--red)' }}
                  ><Icon name="trash" size={12}/></button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button type="button" onClick={onCancel} style={ctaSec}>Annuler</button>
        <button type="submit" style={{ ...ctaPri, background: accent }}>
          {isEdit ? 'Enregistrer' : 'Créer'} <Icon name="arrow" size={13}/>
        </button>
      </div>
    </form>
  )
}

function initialGestionForm() {
  return {
    type: 'Porte',
    nom: '',
    marque: '',
    pieceId: '',
    etat: 'ACTIF',
    connectivite: 'WIFI',
    batterie: '',
    position: '',
    zone: '',
    cycle: '',
    consoEnergie: '',
    niveau: '',
    animal: ''
  }
}

function formFromDetail(detail) {
  return {
    type: detail?.type || 'Porte',
    nom: detail?.nom || '',
    marque: detail?.marque || '',
    pieceId: detail?.pieceId != null ? String(detail.pieceId) : '',
    etat: detail?.etat || 'ACTIF',
    connectivite: detail?.connectivite || 'WIFI',
    batterie: detail?.batterie ?? '',
    position: detail?.position ?? '',
    zone: detail?.zone ?? '',
    cycle: detail?.cycle ?? '',
    consoEnergie: detail?.consoEnergie ?? '',
    niveau: detail?.niveau ?? '',
    animal: detail?.animal ?? ''
  }
}

function payloadFromForm(form) {
  const isOuvrantType = OUVRANT_TYPES.has(form.type)
  const position = toNullableInteger(form.position)
  const derivedEtat = isOuvrantType
    ? ((position ?? 0) > 0 ? 'ACTIF' : 'INACTIF')
    : form.etat

  return {
    type: form.type,
    nom: form.nom,
    marque: trimToNull(form.marque),
    pieceId: toNullableInteger(form.pieceId),
    etat: derivedEtat,
    connectivite: form.connectivite,
    batterie: toNullableFloat(form.batterie),
    position,
    zone: trimToNull(form.zone),
    cycle: trimToNull(form.cycle),
    consoEnergie: toNullableFloat(form.consoEnergie),
    niveau: toNullableFloat(form.niveau),
    animal: trimToNull(form.animal)
  }
}

function trimToNull(v) {
  if (v == null) return null
  const t = String(v).trim()
  return t ? t : null
}

function toNullableInteger(v) {
  const t = trimToNull(v)
  return t == null ? null : Number.parseInt(t, 10)
}

function toNullableFloat(v) {
  const t = trimToNull(v)
  return t == null ? null : Number.parseFloat(t)
}

/* ─── APP SHELL ────────────────────────── */
function AdminPage({ user, t, onChanged }) {
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [userSearch, setUserSearch] = useState('')

  const load = async (requestedStatus = statusFilter) => {
    setLoading(true)
    setError('')
    try {
      const reqQuery = requestedStatus && requestedStatus !== 'ALL'
        ? `?status=${encodeURIComponent(requestedStatus)}`
        : ''
      const [usersData, reqData] = await Promise.all([
        fetchJson('/api/admin/utilisateurs'),
        fetchJson(`/api/admin/demandes-suppression${reqQuery}`)
      ])
      setUsers(Array.isArray(usersData) ? usersData.map(toUiUser) : [])
      setRequests(Array.isArray(reqData) ? reqData : [])
    } catch (e) {
      setError(e.message || 'Erreur module admin')
      setUsers([])
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.admin) load(statusFilter)
  }, [user?.id, user?.admin, statusFilter])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      `${u.prenom || ''} ${u.nom || ''} ${u.email || ''} ${u.typeMembre || ''}`.toLowerCase().includes(q)
    )
  }, [users, userSearch])

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'PENDING').length,
    [requests]
  )

  const fmtDate = (ts) => {
    if (!ts) return '-'
    const d = new Date(ts)
    return d.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
  }

  const decide = async (id, decision) => {
    const note = window.prompt(
      decision === 'approve' ? 'Note admin (optionnel) : suppression validée' : 'Note admin (optionnel) : raison du refus',
      ''
    )
    try {
      await fetchJson(`/api/admin/demandes-suppression/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note: note || null })
      })
      await load()
      onChanged?.()
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleAdmin = async (target) => {
    try {
      await fetchJson(`/api/admin/utilisateurs/${target.id}/admin`, {
        method: 'PATCH',
        body: JSON.stringify({ admin: !target.admin })
      })
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!user?.admin) {
    return (
      <section className="rise" style={{ maxWidth:640 }}>
        <h2 className="display" style={{ fontSize:30 }}>Administration</h2>
        <p style={{ color:'var(--text-2)' }}>Accès refusé : compte admin requis.</p>
      </section>
    )
  }

  return (
    <section className="rise" style={{ display:'grid', gap:16 }}>
      <header>
        <div className="label" style={{ color:t.accent, marginBottom:8 }}>Module IV · administration</div>
        <h2 className="display" style={{ fontSize:34 }}>Pilotage admin</h2>
      </header>

      {error && <div style={{ color:'var(--red)', fontSize:13 }}>{error}</div>}
      {loading && <div style={{ color:'var(--text-3)', fontSize:12 }}>Chargement...</div>}

      <article style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:16, display:'grid', gap:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <div>
            <div className="label" style={{ marginBottom:4 }}>Filtre demandes</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{ ...(statusFilter === st ? ctaPri : ctaSec), background: statusFilter === st ? t.accent : undefined }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
          <div style={{ minWidth:260, flex:1 }}>
            <div className="label" style={{ marginBottom:4 }}>Recherche utilisateurs</div>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Nom, email, type..."
              style={{ ...inputStyle, width:'100%' }}
            />
          </div>
        </div>
      </article>

      <article style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:16 }}>
        <h3 className="display" style={{ fontSize:20, marginBottom:10 }}>
          Demandes de suppression · <span className="mono" style={{ fontSize:12, color:t.accent }}>{requests.length} (pending: {pendingCount})</span>
        </h3>
        <div style={{ display:'grid', gap:10 }}>
          {requests.length === 0 && <p style={{ color:'var(--text-3)' }}>Aucune demande.</p>}
          {requests.map((r) => (
            <div key={r.id} style={{ border:'1px solid var(--line)', borderRadius:10, padding:12, background:'var(--bg-2)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
                <strong>{r.objetNom || 'Objet'}</strong>
                <span className="mono" style={{ fontSize:11, color: r.status === 'PENDING' ? t.accent : 'var(--text-3)' }}>{r.status}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>Demandeur: {r.demandeurEmail || '-'}</div>
              <div style={{ fontSize:11, color:'var(--text-4)', marginTop:2 }}>Créée le: {fmtDate(r.createdAt)}</div>
              {r.raison && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4 }}>Raison: {r.raison}</div>}
              {r.status !== 'PENDING' && (
                <div style={{ marginTop:6, fontSize:12, color:'var(--text-2)' }}>
                  <div>Traitée par: {r.traiteParEmail || '-'}</div>
                  <div>Traitée le: {fmtDate(r.resolvedAt)}</div>
                  {r.noteAdmin && <div>Note admin: {r.noteAdmin}</div>}
                </div>
              )}
              {r.status === 'PENDING' && (
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <button type="button" style={{ ...ctaPri, background:'var(--green)' }} onClick={() => decide(r.id, 'approve')}>Approuver</button>
                  <button type="button" style={{ ...ctaSec, color:'var(--red)', borderColor:'var(--red)40' }} onClick={() => decide(r.id, 'reject')}>Refuser</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </article>

      <article style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:16 }}>
        <h3 className="display" style={{ fontSize:20, marginBottom:10 }}>Utilisateurs · {filteredUsers.length}</h3>
        <div style={{ display:'grid', gap:8 }}>
          {filteredUsers.length === 0 && <p style={{ color:'var(--text-3)', fontSize:12 }}>Aucun utilisateur pour ce filtre.</p>}
          {filteredUsers.map((u) => (
            <div key={u.id} style={{ border:'1px solid var(--line)', borderRadius:10, padding:12, background:'var(--bg-2)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
              <div>
                <div style={{ fontSize:13, color:'var(--text)' }}>{u.prenom} {u.nom} · {u.email}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>{u.typeMembre} · {u.niveau}</div>
              </div>
              <button type="button" onClick={() => toggleAdmin(u)} style={{ ...(u.admin ? ctaSec : ctaPri), background: u.admin ? undefined : t.accent }}>
                {u.admin ? 'Retirer admin' : 'Passer admin'}
              </button>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

const APP_THEME = { accent: ACCENT, houseName: HOUSE_NAME }

function App() {
  const t = APP_THEME
  const [page, setPage] = useState(() => {
    try {
      const saved = localStorage.getItem(PAGE_STORAGE_KEY)
      return PAGES.some((p) => p.id === saved) ? saved : 'home'
    } catch {
      return 'home'
    }
  });
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [pieces, setPieces] = useState(PIECES);
  const [detail, setDetail] = useState(null);
  const [health, setHealth] = useState({ state: 'loading' })
  const [gestionFormSignal, setGestionFormSignal] = useState(0)
  const [scenarios, setScenarios] = useState([])
  const [refreshTick, setRefreshTick] = useState(0)
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const [toast, setToast] = useState(null) // { kind: 'success'|'error', message: string }
  const [energy, setEnergy] = useState(null)
  const notificationCursorRef = useRef(new Date(Date.now() - 30 * 60 * 1000).toISOString())
  const seenNotificationsRef = useRef(new Set())
  const canManage = user?.niveauMax === 'Avancé'
  const visiblePages = useMemo(
    () => PAGES.filter((p) => !p.adminOnly || user?.admin),
    [user?.admin]
  )

  const refreshSession = async () => {
    try {
      const me = await fetchJson('/api/auth/me')
      setUser(toUiUser(me))
    } catch {
      setUser(null)
    }
  }

  const refreshPublic = async () => {
    try {
      const [healthData, piecesData, itemsData] = await Promise.all([
        fetchJson('/api/health').catch(() => null),
        fetchJson('/api/info/pieces').catch(() => []),
        fetchJson('/api/info/objets').catch(() => [])
      ])
      if (healthData) setHealth({ state: 'ok', data: healthData })
      else setHealth({ state: 'error' })
      if (Array.isArray(piecesData) && piecesData.length) {
        setPieces(piecesData.map((p, idx) => ({
          id: p.id,
          nom: p.nom,
          surface: p.surface || PIECES[idx % PIECES.length]?.surface || 12,
          type: p.type || p.nom,
          icon: PIECES.find((x) => x.nom === p.nom)?.icon || '•'
        })))
      }
      setItems(Array.isArray(itemsData) ? itemsData.map(toUiItem) : [])
    } catch {
      setHealth({ state: 'error' })
      setItems([])
    }
  }

  const refreshScenarios = async () => {
    try {
      const data = await fetchJson('/api/gestion/scenarios')
      setScenarios(Array.isArray(data) ? data : [])
    } catch {
      setScenarios([])
    }
  }

  const refreshEnergy = async () => {
    if (!canManage) {
      setEnergy(null)
      return
    }
    try {
      const data = await fetchJson('/api/gestion/energie')
      setEnergy(data || null)
    } catch {
      setEnergy(null)
    }
  }

  const showToast = (kind, message) => {
    setToast({ kind, message })
    setTimeout(() => setToast(null), 3500)
  }

  const bumpRefresh = () => setRefreshTick((n) => n + 1)

  useEffect(() => {
    refreshSession()
    refreshPublic()
  }, [])

  useEffect(() => {
    if (canManage) {
      refreshScenarios()
      refreshEnergy()
    } else {
      setScenarios([])
      setEnergy(null)
    }
  }, [canManage])

  useEffect(() => {
    if (!canManage) return
    refreshEnergy()
  }, [refreshTick, canManage])

  const handleLogin = async ({ email, motDePasse }) => {
    const data = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, motDePasse })
    })
    setUser(toUiUser(data))
  }

  const handleRegister = async (payload) => {
    const data = await fetchJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    if (data?.verificationRequired) {
      return {
        verificationRequired: true,
        email: data.email,
        debugToken: data.debugToken,
      }
    }

    const profile = data?.user ?? data
    setUser(toUiUser(profile))
    return { verificationRequired: false }
  }

  const handleVerifyEmail = async ({ email, token }) => {
    const data = await fetchJson('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, token })
    })
    setUser(toUiUser(data))
    return data
  }

  const handleResendVerification = async (email) => {
    return fetchJson('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  const handleLogout = async () => {
    await fetchJson('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setProfileEditorOpen(false)
  }

  const handleProfileUpdated = (updatedUser, toastMessage) => {
    setUser(updatedUser)
    bumpRefresh()
    if (toastMessage) showToast('success', toastMessage)
  }

  const openDetail = (o) => {
    setDetail(o);
  };

  const triggerCreateObjet = () => {
    if (!canManage) {
      setPage('visualisation')
      return
    }
    setPage('gestion')
    setGestionFormSignal((n) => n + 1)
  }

  const invokeMethod = async (obj, method) => {
    const target = methodToEtat(method)
    if (!target) return
    try {
      await fetchJson(`/api/gestion/objets/${obj.id}/etat`, {
        method: 'PATCH',
        body: JSON.stringify({ actif: target === 'ACTIF' })
      })
      await refreshPublic()
      await refreshEnergy()
      bumpRefresh()
      setDetail((current) => current && current.id === obj.id ? { ...current, etat: target } : current)
      showToast('success', `${obj.nom} → ${target.toLowerCase()}`)
    } catch (e) {
      showToast('error', `Action impossible : ${e.message}`)
    }
  }

  // Used by the position slider in DetailDrawer (and reusable for other partial updates).
  const updateObjet = async (obj, patch) => {
    try {
      const detailDto = await fetchJson(`/api/gestion/objets/${obj.id}`)
      const payload = {
        type: detailDto.type,
        nom: detailDto.nom,
        marque: detailDto.marque,
        pieceId: detailDto.pieceId,
        etat: detailDto.etat,
        connectivite: detailDto.connectivite,
        batterie: detailDto.batterie,
        position: detailDto.position,
        zone: detailDto.zone,
        cycle: detailDto.cycle,
        consoEnergie: detailDto.consoEnergie,
        niveau: detailDto.niveau,
        animal: detailDto.animal,
        ...patch,
      }
      await fetchJson(`/api/gestion/objets/${obj.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      await refreshPublic()
      await refreshEnergy()
      bumpRefresh()
      setDetail((current) => current && current.id === obj.id ? toUiItem({ ...current, ...patch }) : current)
      showToast('success', `${obj.nom} mis à jour`)
    } catch (e) {
      showToast('error', `Mise à jour impossible : ${e.message}`)
    }
  }

  const runScenario = async (scenarioId) => {
    try {
      const result = await fetchJson(`/api/gestion/scenarios/${scenarioId}/run`, { method: 'POST' })
      const label = result?.scenarioNom || 'Scénario'
      const n = result?.actionsApplied ?? 0
      showToast('success', `${label} exécuté · ${n} action${n > 1 ? 's' : ''}`)
      await refreshPublic()
      await refreshScenarios()
      await refreshEnergy()
      bumpRefresh()
    } catch (e) {
      showToast('error', `Exécution impossible : ${e.message}`)
    }
  }

  const simulateEvent = async (obj, event) => {
    try {
      const result = await fetchJson(`/api/gestion/objets/${obj.id}/simulate-event`, {
        method: 'POST',
        body: JSON.stringify({ event })
      })
      await refreshPublic()
      await refreshScenarios()
      await refreshEnergy()
      bumpRefresh()

      const n = result?.scenariosTriggered || 0
      if (n > 0) {
        showToast('success', `${event} simulé · ${n} scénario${n > 1 ? 's' : ''} déclenché${n > 1 ? 's' : ''}`)
      } else {
        showToast('success', `${event} simulé · aucun scénario lié`)
      }
      return result
    } catch (e) {
      showToast('error', `Simulation impossible : ${e.message}`)
      throw e
    }
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-soft', t.accent + '1f');
    document.documentElement.style.setProperty('--accent-glow', t.accent + '66');
  }, [t.accent]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [page]);

  useEffect(() => {
    try {
      localStorage.setItem(PAGE_STORAGE_KEY, page)
    } catch {
      // ignore storage errors
    }
  }, [page])

  useEffect(() => {
    if (page === 'admin' && !user?.admin) {
      setPage('home')
    }
  }, [page, user?.admin])

  useEffect(() => {
    seenNotificationsRef.current = new Set()
    notificationCursorRef.current = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }, [user?.id])

  useEffect(() => {
    if (!canManage) return

    let cancelled = false
    const poll = async () => {
      try {
        const since = notificationCursorRef.current
        const data = await fetchJson(`/api/gestion/notifications?since=${encodeURIComponent(since)}`)
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        if (list.length === 0) return

        const sorted = list.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        for (const n of sorted) {
          if (!n?.key || seenNotificationsRef.current.has(n.key)) continue
          seenNotificationsRef.current.add(n.key)
          const kind = n.severity === 'critical' ? 'error' : 'success'
          showToast(kind, n.message || n.type || 'Notification')
        }

        const newest = sorted[sorted.length - 1]
        if (newest?.timestamp) {
          notificationCursorRef.current = newest.timestamp
        }
      } catch {
        // ignore polling errors
      }
    }

    poll()
    const id = setInterval(poll, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [canManage])

  const renderPage = () => {
    const props = { user, items, pieces, openDetail, t, health };
    if (page==='home') return (
      <HomePage
        {...props}
        canManage={canManage}
        energy={energy}
        onCreateObjet={triggerCreateObjet}
        scenarios={scenarios}
        onRunScenario={runScenario}
      />
    );
    if (page==='recherche') return <SearchPage {...props} />;
    if (page==='visualisation') return (
      <VisualisationPage
        {...props}
        refreshTick={refreshTick}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onVerifyEmail={handleVerifyEmail}
        onResendVerification={handleResendVerification}
        onLogout={handleLogout}
        onSessionRefresh={refreshSession}
      />
    )
    if (page==='gestion') return (
      <GestionPage
        {...props}
        energy={energy}
        refreshTick={refreshTick}
        openFormSignal={gestionFormSignal}
        onFormHandled={() => setGestionFormSignal(0)}
        scenarios={scenarios}
        onRunScenario={runScenario}
        onScenariosChanged={refreshScenarios}
      />
    );
    if (page==='admin') return <AdminPage user={user} t={t} onChanged={refreshPublic} />
    return null
  };

  return (
    <div style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'240px 1fr', position:'relative', zIndex:1 }}>
      <a href="#main-content" className="skip-link" style={{
        position:'absolute', left:8, top:8, zIndex:1000, padding:'8px 14px',
        background:'var(--accent)', color:'#0e1116', borderRadius:8, fontWeight:600,
        transform:'translateY(-200%)', transition:'transform .2s',
      }}
        onFocus={(e)=>{ e.currentTarget.style.transform = 'translateY(0)' }}
        onBlur={(e)=>{ e.currentTarget.style.transform = 'translateY(-200%)' }}
      >Aller au contenu principal</a>

      <aside aria-label="Navigation principale" style={{
        background:'var(--bg-2)', borderRight:'1px solid var(--line)',
        padding:'24px 16px', display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, padding:'0 8px' }}>
          <div aria-hidden="true" style={{
            width:36, height:36, borderRadius:10,
            background:`linear-gradient(135deg, ${t.accent}, #ff8a47)`,
            display:'flex', alignItems:'center', justifyContent:'center', color:'#0e1116',
            fontFamily:"'Fraunces', serif", fontSize:18, fontWeight:600,
          }}>M</div>
          <div>
            <div className="display" style={{ fontSize:15, lineHeight:1 }}>Maison</div>
            <div className="mono" style={{ fontSize:10, color:'var(--text-3)', marginTop:2 }}>{t.houseName}</div>
          </div>
        </div>

        <nav aria-label="Modules" style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {visiblePages.map(p => {
            const active = page === p.id;
            const locked = p.id === 'gestion' && user && user.niveauMax !== 'Avancé';
            return (
              <button
                key={p.id}
                type="button"
                onClick={()=>setPage(p.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={locked ? `${p.label} — verrouillé (niveau Avancé requis)` : p.label}
                style={{
                  padding:'10px 12px', borderRadius:10, display:'flex', alignItems:'center', gap:12,
                  background: active ? 'var(--surface)' : 'transparent',
                  color: active ? 'var(--text)' : (locked ? 'var(--text-4)' : 'var(--text-2)'),
                  fontSize:13, fontWeight: active ? 500 : 400, transition:'all .15s',
                  border: active ? '1px solid var(--line-2)' : '1px solid transparent',
                }}
              >
                <Icon name={p.icon} size={16}/>
                <span style={{ flex:1, textAlign:'left' }}>{p.label}</span>
                {locked && <Icon name="lock" size={11}/>}
                {active && <span aria-hidden="true" style={{ width:4, height:4, borderRadius:'50%', background: t.accent, boxShadow:`0 0 6px ${t.accent}` }}/>}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop:'auto', padding:'14px', borderRadius:12, background:'var(--surface)', border:'1px solid var(--line)' }}>
          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button
                type="button"
                onClick={() => setProfileEditorOpen(true)}
                aria-label="Ouvrir mon profil"
                style={{
                  flex:1,
                  display:'flex',
                  alignItems:'center',
                  gap:10,
                  background:'transparent',
                  border:'none',
                  padding:0,
                  textAlign:'left',
                  cursor:'pointer'
                }}
              >
                <div aria-hidden="true"><AvatarBadge user={user} size={32} accent={t.accent} /></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.prenom}</div>
                  <div className="mono" style={{ fontSize:10, color:'var(--text-3)' }}>{user.points.toFixed(2)} pts · cliquer pour profil</div>
                </div>
              </button>
              <button type="button" onClick={handleLogout} aria-label="Se déconnecter" style={iconBtn}><Icon name="power" size={12}/></button>
            </div>
          ) : (
            <button type="button" onClick={()=>setPage('visualisation')} style={{ width:'100%', padding:'8px', fontSize:12, color:'var(--text-2)', display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="user" size={14}/> Se connecter
            </button>
          )}
        </div>

        <div role="status" aria-live="polite" className="mono" style={{ fontSize:9, color:'var(--text-4)', marginTop:14, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <span aria-hidden="true" style={{ width:6, height:6, borderRadius:'50%', background: health.state === 'ok' ? 'var(--green)' : 'var(--red)' }}/>
          {health.state === 'ok' ? 'Backend en ligne · v4.0' : 'Backend injoignable'}
        </div>
      </aside>

      <main id="main-content" style={{ padding:'40px 48px 80px', maxWidth: 1320, width:'100%' }}>
        {renderPage()}
      </main>

      <DetailDrawer
        obj={detail}
        onClose={()=>setDetail(null)}
        canManage={canManage}
        onMethodInvoke={invokeMethod}
        onUpdateObjet={updateObjet}
        onSimulateEvent={simulateEvent}
        t={t}
      />

      <ProfileEditorModal
        open={profileEditorOpen && Boolean(user)}
        user={user}
        onClose={() => setProfileEditorOpen(false)}
        onUpdated={handleProfileUpdated}
        accent={t.accent}
      />

      {toast && (
        <div role="status" aria-live="polite" className="rise" style={{
          position:'fixed', bottom:24, right:24, zIndex:300,
          padding:'14px 20px', borderRadius:12, minWidth:260, maxWidth:400,
          background: toast.kind === 'error' ? 'var(--red-soft)' : 'var(--green-soft)',
          border: `1px solid ${toast.kind === 'error' ? 'var(--red)' : 'var(--green)'}40`,
          color: toast.kind === 'error' ? 'var(--red)' : 'var(--green)',
          display:'flex', alignItems:'center', gap:12, fontSize:13,
          boxShadow:'0 12px 40px rgba(0,0,0,.4)',
        }}>
          <Icon name={toast.kind === 'error' ? 'close' : 'bell'} size={14}/>
          <span style={{ flex:1, color:'var(--text)' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App
