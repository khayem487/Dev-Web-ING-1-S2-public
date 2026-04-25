import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#ffb547",
  "scheme": "dark",
  "compact": false,
  "houseName": "Famille Martin"
}/*EDITMODE-END*/;

function useTweaks(defaults) {
  const [state, setState] = useState(defaults)
  const setTweak = (key, value) => setState((prev) => ({ ...prev, [key]: value }))
  return [state, setTweak]
}

function TweaksPanel() {
  return null
}

function TweakSection() {
  return null
}

function TweakText() {
  return null
}

function TweakColor() {
  return null
}

function TweakToggle() {
  return null
}

/* ─── DATA ──────────────────────────────────────── */
const PIECES = [
  { id:1, nom:'Salon', surface:28, type:'Salon', icon:'🛋' },
  { id:2, nom:'Cuisine', surface:14, type:'Cuisine', icon:'🍳' },
  { id:3, nom:'Chambre', surface:18, type:'Chambre', icon:'🛏' },
  { id:4, nom:'Salle de bain', surface:7, type:'SalleDeBain', icon:'🛁' },
  { id:5, nom:'Garage', surface:22, type:'Garage', icon:'🚗' },
  { id:6, nom:'Toilettes', surface:3, type:'Toilettes', icon:'🚽' },
];

const ICONS = {
  Thermostat:'thermo', Camera:'cam', PorteGarage:'door-g', Volet:'volet',
  LaveLinge:'wash', Television:'tv', Eau:'water', Nourriture:'food',
  Alarme:'alarm', MachineCafe:'coffee', Porte:'door', Climatiseur:'cool',
  Fenetre:'window', DetecteurMouvement:'motion', Aspirateur:'vacuum'
};


const NIVEAUX = [
  { code:'Débutant', seuil:0 }, { code:'Intermédiaire', seuil:50 },
  { code:'Avancé', seuil:200 }, { code:'Expert', seuil:500 }
];

const PAGES = [
  { id:'home', label:'Accueil', icon:'home' },
  { id:'recherche', label:'Recherche', icon:'search' },
  { id:'visualisation', label:'Mes objets', icon:'grid' },
  { id:'gestion', label:'Gestion', icon:'settings' },
];

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const GESTION_TYPE_OPTIONS = ['Porte', 'Volet', 'Thermostat', 'Camera', 'Television', 'LaveLinge', 'Nourriture', 'Eau']
const DEMO_CREDENTIALS = [
  { email: 'parent@demo.local', motDePasse: 'demo1234' },
  { email: 'enfant@demo.local', motDePasse: 'demo1234' },
  { email: 'voisin@demo.local', motDePasse: 'demo1234' }
]

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
    typeMembre: normalizeEnumLabel(user.typeMembre) || user.typeMembre,
    niveau: normalizeEnumLabel(user.niveau) || user.niveau,
    niveauMax: normalizeEnumLabel(user.niveauMax) || user.niveauMax,
    points: Number(user.points || 0)
  }
}

function inferServiceFromType(type = '') {
  if (['Porte', 'Volet'].includes(type)) return 'Acces'
  if (['Thermostat', 'Camera'].includes(type)) return 'Surveillance'
  if (['Television', 'LaveLinge'].includes(type)) return 'Confort'
  if (['Nourriture', 'Eau'].includes(type)) return 'Animal'
  return 'Confort'
}

function inferBrancheFromType(type = '') {
  if (['Porte', 'Volet'].includes(type)) return 'Ouvrant'
  if (['Thermostat', 'Camera'].includes(type)) return 'Capteur'
  if (['Television', 'LaveLinge'].includes(type)) return 'Appareil'
  if (['Nourriture', 'Eau'].includes(type)) return 'BesoinAnimal'
  return 'Capteur'
}

function toUiItem(item) {
  const id = Number(item?.id || 0)
  const type = item?.type || 'Objet'
  const prefix = String(type).slice(0, 2).toUpperCase()
  return {
    ...item,
    id,
    type,
    code: item?.code || `${prefix}-${String(id).padStart(3, '0')}`,
    branche: item?.branche || inferBrancheFromType(type),
    service: item?.service || inferServiceFromType(type),
    pieceNom: item?.pieceNom || 'Maison',
    marque: item?.marque || 'N/A',
    connectivite: item?.connectivite || 'WIFI',
    valeur: item?.valeur || `${item?.etat || 'INACTIF'}`,
    batterie: item?.batterie == null ? null : Number(item.batterie)
  }
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

/* ─── DEVICE TILE ─────────────────────────────── */
function DeviceTile({ obj, idx, onClick, actions, compact }) {
  const active = obj.etat === 'ACTIF';
  const lowBat = obj.batterie != null && obj.batterie < 20;
  return (
    <article onClick={onClick} style={{
      cursor: onClick ? 'pointer' : 'default', position:'relative',
      borderRadius: 16, padding: compact ? '16px' : '20px',
      background: active ? 'linear-gradient(135deg, var(--surface-2), var(--surface))' : 'var(--surface)',
      border: '1px solid var(--line)', overflow:'hidden',
      display:'flex', flexDirection:'column', gap: compact ? 12 : 16,
      transition:'transform .18s, border-color .18s',
    }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--line-2)'; e.currentTarget.style.transform='translateY(-2px)';}}
       onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.transform='translateY(0)';}}>

      {active && <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, var(--accent-soft), transparent 70%)' }}/>}

      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative' }}>
        <div style={{
          width: 44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
          background: active ? 'var(--accent-soft)' : 'var(--bg-3)',
          color: active ? 'var(--accent)' : 'var(--text-3)',
        }}>
          <Icon name={ICONS[obj.type] || 'grid'} size={22}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, position:'relative' }}>
          {active && <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'var(--green)', opacity:.4, animation:'ping 2s ease-out infinite' }}/>}
          <div style={{
            width:8, height:8, borderRadius:'50%', position:'relative',
            background: active ? 'var(--green)' : 'var(--text-4)',
          }}/>
          <span className="label" style={{ fontSize:9, color: active ? 'var(--green)' : 'var(--text-4)' }}>{active?'ON':'OFF'}</span>
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

      {obj.valeur && (
        <div style={{
          padding:'10px 12px', borderRadius:10, background:'var(--bg-2)',
          fontSize:13, color: active ? 'var(--text)' : 'var(--text-3)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ color:'var(--text-3)', fontSize:11 }}>État</span>
          <span className="display" style={{ fontSize:16, color: active ? 'var(--accent)' : 'var(--text-2)' }}>{obj.valeur}</span>
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
            <button onClick={()=>actions.toggle(obj)} style={iconBtn}><Icon name="power" size={13}/></button>
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

/* ─── DETAIL DRAWER ─────────────────────────── */
function DetailDrawer({ obj, onClose }) {
  if (!obj) return null;
  const methodes = obj.branche === 'Ouvrant' ? ['ouvrir()','fermer()','setPosition()'] :
                   obj.branche === 'Capteur' ? ['lire()','alerter()',obj.type==='Thermostat' && 'setTemperature()'].filter(Boolean) :
                   obj.branche === 'Appareil' ? ['demarrer()','arreter()'] :
                   obj.branche === 'BesoinAnimal' ? ['verifierNiveau()',obj.type==='Eau'?'remplir()':'distribuer()'] : ['activer()','desactiver()'];
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
              <div className="display" style={{ fontSize:48, color: obj.etat==='ACTIF' ? 'var(--accent)' : 'var(--text-3)', lineHeight:1 }}>{obj.valeur}</div>
              <div className="label" style={{ color:'var(--text-3)' }}>{obj.pieceNom} · {obj.connectivite}</div>
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom:10 }}>Attributs</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {Object.entries(obj).filter(([k,v]) => v != null && !['id','code','nom','branche','marque','valeur','pieceNom','connectivite'].includes(k)).map(([k,v]) => (
                <div key={k} style={{ padding:'10px 12px', borderRadius:10, background:'var(--bg-2)', border:'1px solid var(--line)' }}>
                  <div className="label" style={{ fontSize:9, marginBottom:3 }}>{k}</div>
                  <div className="display" style={{ fontSize:15, color:'var(--text)' }}>{String(v)}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom:10 }}>Méthodes UML</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {methodes.map(m => (
                <button key={m} className="mono" style={{
                  padding:'8px 12px', fontSize:12, borderRadius:8,
                  background:'var(--bg-3)', color:'var(--text-2)', border:'1px solid var(--line-2)',
                }}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="label" style={{ marginBottom:10 }}>Activité (24h)</div>
            <div style={{ borderRadius:12, background:'var(--bg-2)', border:'1px solid var(--line)', padding:'14px 16px' }}>
              {[
                { t:'14:17', txt: obj.type === 'Thermostat' ? '21.4°C · cible 22°C' : 'Lecture OK' },
                { t:'13:02', txt: obj.batterie != null ? `Batterie ${obj.batterie}%` : 'Cycle terminé' },
                { t:'09:55', txt:`Dernière action — ${obj.etat}` },
              ].map((l,i) => (
                <div key={i} style={{ display:'flex', gap:14, padding:'8px 0', fontSize:12, borderBottom: i<2 ? '1px solid var(--line)' : 'none' }}>
                  <span className="mono" style={{ color:'var(--text-4)', minWidth:40 }}>{l.t}</span>
                  <span style={{ color:'var(--text-2)' }}>{l.txt}</span>
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
function HouseMap({ items, pieces, t }) {
  const piecesList = pieces?.length ? pieces : PIECES
  const counts = {};
  piecesList.forEach(p => { counts[p.nom] = items.filter(o=>o.pieceNom===p.nom && o.etat==='ACTIF').length; });
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
          <span className="num display" style={{ fontSize:32, color:'var(--accent)', lineHeight:1 }}>{Object.values(counts).reduce((a,b)=>a+b,0)}</span>
          <span style={{ lineHeight:1.3 }}>objets<br/>actifs</span>
        </div>
      </div>
      <div style={{
        display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gridTemplateRows:'1fr 0.8fr',
        gap:8, height:280, position:'relative',
      }}>
        {[
          { nom:'Salon', col:'1 / 2', row:'1 / 3' },
          { nom:'Cuisine', col:'2 / 3', row:'1 / 2' },
          { nom:'Chambre', col:'3 / 4', row:'1 / 2' },
          { nom:'Salle de bain', col:'2 / 3', row:'2 / 3' },
          { nom:'Garage', col:'3 / 4', row:'2 / 3' },
        ].map(p => {
          const room = piecesList.find(r => r.nom === p.nom) || { icon: '•', surface: 0 };
          const c = counts[p.nom] || 0;
          const intensity = c / 4;
          return (
            <div key={p.nom} style={{
              gridColumn: p.col, gridRow: p.row,
              borderRadius:12, padding:'14px 16px',
              background: c > 0 ? `linear-gradient(135deg, rgba(255,181,71,${intensity*0.3}), var(--bg-2))` : 'var(--bg-2)',
              border: '1px solid var(--line)',
              display:'flex', flexDirection:'column', justifyContent:'space-between',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{ fontSize:22 }}>{room.icon}</span>
                {c > 0 && <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', boxShadow:`0 0 8px var(--accent)` }}/>}
              </div>
              <div>
                <div className="display" style={{ fontSize:15, color:'var(--text)' }}>{p.nom}</div>
                <div className="mono" style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                  <span className="num" style={{ color: c>0 ? 'var(--accent)' : 'var(--text-3)' }}>{c}</span> actif{c!==1?'s':''} · {room.surface}m²
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
function HomePage({ user, items, pieces, t, openDetail, health }) {
  const actifs = items.filter(o => o.etat==='ACTIF').length;
  const lowBat = items.filter(o => o.batterie!=null && o.batterie<20);
  const consumption = items.filter(o => o.etat==='ACTIF' && o.branche === 'Appareil').length * 1.2;
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
          <button style={ctaSec}><Icon name="bell" size={14}/> Alertes</button>
          <button style={{...ctaPri, background: t.accent}}><Icon name="plus" size={14}/> Nouvel objet</button>
        </div>
      </div>

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
        <Icon name="search" size={18}/>
        <input
          placeholder="Rechercher par nom, type, marque…"
          value={filters.q}
          onChange={e=>setFilters({...filters, q:e.target.value})}
          style={{
            width:'100%', padding:'16px 20px 16px 50px', fontSize:15,
            background:'var(--surface)', border:'1px solid var(--line)', borderRadius:14,
            color:'var(--text)',
          }}
        />
        <div style={{ position:'absolute', left:18, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }}>
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

/* ─── LOGIN / VISUALISATION ─────────────── */
function VisualisationPage({ user, onLogin, onRegister, onLogout, onSessionRefresh, openDetail, t }) {
  const [filters, setFilters] = useState({ service:'', etat:'', q:'' });
  const [profile, setProfile] = useState(user);
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [profileForm, setProfileForm] = useState({ pseudo:'', bioPublique:'', telephonePrive:'', adressePrivee:'' });

  useEffect(() => {
    setProfile(user)
    setProfileForm({
      pseudo: user?.pseudo || '',
      bioPublique: user?.bioPublique || '',
      telephonePrive: user?.telephonePrive || '',
      adressePrivee: user?.adressePrivee || ''
    })
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
        if (filters.q) params.set('q', filters.q)
        const url = params.toString() ? `/api/visualisation/objets?${params}` : '/api/visualisation/objets'
        const itemsData = await fetchJson(url)

        if (cancelled) return

        const uiProfile = toUiUser(profileData)
        setProfile(uiProfile)
        setProfileForm({
          pseudo: profileData?.pseudo || '',
          bioPublique: profileData?.bioPublique || '',
          telephonePrive: profileData?.telephonePrive || '',
          adressePrivee: profileData?.adressePrivee || ''
        })
        setServices(Array.isArray(servicesData) ? servicesData : [])
        setItems(Array.isArray(itemsData) ? itemsData.map(toUiItem) : [])
        onSessionRefresh?.()
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
  }, [user, filters.service, filters.etat, filters.q, onSessionRefresh])

  if (!user) {
    return <LoginScreen onLogin={onLogin} onRegister={onRegister} t={t} />
  }

  const currentUser = profile || user
  const currentNiv = NIVEAUX.find(n => n.code === currentUser.niveau) || NIVEAUX[0]
  const nextNiv = NIVEAUX[NIVEAUX.findIndex(n => n.code === currentUser.niveau) + 1]
  const xpPct = nextNiv
    ? Math.max(0, Math.min(100, Math.round((currentUser.points - currentNiv.seuil) / (nextNiv.seuil - currentNiv.seuil) * 100)))
    : 100

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaveMsg('')
    try {
      const updated = await fetchJson('/api/visualisation/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      })
      setProfile(toUiUser(updated))
      setSaveMsg('Profil mis à jour ✅')
      onSessionRefresh?.()
    } catch (e2) {
      setSaveMsg(`Erreur: ${e2.message}`)
    }
  }

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
          <div style={{
            width:72, height:72, borderRadius:18,
            background:`linear-gradient(135deg, ${t.accent}, #ff8a47)`, color:'#0e1116',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Fraunces', serif", fontSize:30, fontWeight:600,
            boxShadow:`0 8px 32px ${t.accent}40`,
          }}>{currentUser.photo}</div>

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

      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
        <input
          placeholder="Rechercher dans mes objets…"
          value={filters.q}
          onChange={e=>setFilters({...filters, q:e.target.value})}
          style={{ flex:1, padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:10, fontSize:14 }}
        />
        <select value={filters.service} onChange={e=>setFilters({...filters, service:e.target.value})} style={selectStyle}>
          <option value="">Tous services</option>
          {['Acces','Surveillance','Confort','Animal'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.etat} onChange={e=>setFilters({...filters, etat:e.target.value})} style={selectStyle}>
          <option value="">Tous états</option>
          <option>ACTIF</option><option>INACTIF</option>
        </select>
      </div>

      {error && <div style={{ marginBottom: 12, color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12, marginBottom:24 }}>
        {loading ? <p style={{ color:'var(--text-3)' }}>Chargement…</p> : items.map((o,i) => <DeviceTile key={o.id} obj={o} idx={i} onClick={()=>openDetail(o)}/>)}
      </div>

      <form onSubmit={saveProfile} style={{ borderRadius:14, border:'1px solid var(--line)', background:'var(--surface)', padding:16, display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:12 }}>
        <Field label="Pseudo"><input value={profileForm.pseudo} onChange={(e) => setProfileForm((p) => ({ ...p, pseudo: e.target.value }))} style={inputStyle}/></Field>
        <Field label="Téléphone privé"><input value={profileForm.telephonePrive} onChange={(e) => setProfileForm((p) => ({ ...p, telephonePrive: e.target.value }))} style={inputStyle}/></Field>
        <div style={{ gridColumn:'span 2' }}><Field label="Bio publique"><input value={profileForm.bioPublique} onChange={(e) => setProfileForm((p) => ({ ...p, bioPublique: e.target.value }))} style={inputStyle}/></Field></div>
        <div style={{ gridColumn:'span 2' }}><Field label="Adresse privée"><input value={profileForm.adressePrivee} onChange={(e) => setProfileForm((p) => ({ ...p, adressePrivee: e.target.value }))} style={inputStyle}/></Field></div>
        <div style={{ gridColumn:'span 2', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color: saveMsg.startsWith('Erreur') ? 'var(--red)' : 'var(--text-3)' }}>{saveMsg}</span>
          <button type="submit" style={{...ctaPri, background:t.accent}}>Enregistrer profil</button>
        </div>
      </form>
    </div>
  );
}

function LoginScreen({ onLogin, onRegister, t }) {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginForm, setLoginForm] = useState({ email: 'parent@demo.local', motDePasse: 'demo1234' })
  const [registerForm, setRegisterForm] = useState({ prenom:'', nom:'', email:'', motDePasse:'', typeMembre:'PARENT_FAMILLE' })

  const runLogin = async (email, motDePasse) => {
    setLoading(true)
    setError('')
    try {
      await onLogin({ email, motDePasse })
    } catch (e) {
      setError(e.message || 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  const runRegister = async () => {
    setLoading(true)
    setError('')
    try {
      await onRegister(registerForm)
    } catch (e) {
      setError(e.message || 'Inscription impossible')
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
            <button key={demo.email} onClick={()=>runLogin(demo.email, demo.motDePasse)}
              style={{ padding:'12px 14px', background:'rgba(14,17,22,.85)', color:'#fff', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:8, background: t.accent, color:'#0e1116', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces', serif", fontSize:14, fontWeight:600 }}>{demo.email[0].toUpperCase()}</div>
              <div style={{ flex:1, textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{demo.email}</div>
                <div style={{ fontSize:11, opacity:.6, fontFamily:"'Geist Mono', monospace" }}>mot de passe: demo1234</div>
              </div>
              <Icon name="chevR" size={14}/>
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderRadius:18, padding:'32px', background:'var(--surface)', border:'1px solid var(--line)' }}>
        <div style={{ display:'flex', gap:4, padding:4, background:'var(--bg-2)', borderRadius:10, marginBottom:24 }}>
          {['login','register'].map(k => (
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1, padding:'9px', borderRadius:8, fontSize:13, fontWeight:500,
              background: tab===k ? 'var(--surface)' : 'transparent',
              color: tab===k ? 'var(--text)' : 'var(--text-3)',
              transition:'all .15s',
            }}>{k==='login' ? 'Connexion' : 'Inscription'}</button>
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
        ) : (
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
            {error && <div style={{ color:'var(--red)', fontSize:12, marginTop:10 }}>{error}</div>}
            <button disabled={loading} style={{ marginTop:20, width:'100%', padding:'14px', background: t.accent, color:'#0e1116', borderRadius:10, fontSize:14, fontWeight:600 }}>{loading ? 'Création...' : 'Créer mon compte'}</button>
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
function GestionPage({ user, pieces, openDetail, t }) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [items, setItems] = useState([])
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialGestionForm())

  const loadGestion = async () => {
    if (!user || user.niveauMax !== 'Avancé') return
    setLoading(true)
    setError('')
    try {
      const [objetsData, historyData, statsData] = await Promise.all([
        fetchJson('/api/gestion/objets'),
        fetchJson('/api/gestion/historique?limit=40'),
        fetchJson('/api/gestion/stats')
      ])
      setItems(Array.isArray(objetsData) ? objetsData.map(toUiItem) : [])
      setHistory(Array.isArray(historyData) ? historyData.map(historyToUiItem) : [])
      setStats(statsData)
    } catch (e) {
      setError(e.message || 'Erreur chargement gestion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGestion()
  }, [user?.email])

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
        await fetchJson(`/api/gestion/objets/${id}`, { method: 'DELETE' })
        flash('Objet supprimé.')
        await loadGestion()
      } catch (e) {
        setError(e.message)
      }
    },
  };

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
        <button onClick={()=>{ setEditing(null); setShowForm(!showForm); }} style={{...ctaPri, background: t.accent}}>
          <Icon name="plus" size={14}/>{showForm && !editing ? 'Replier' : 'Nouvel objet'}
        </button>
      </div>

      {error && <div style={{ marginBottom: 10, color:'var(--red)', fontSize:12 }}>{error}</div>}
      {loading && <div style={{ marginBottom: 10, color:'var(--text-3)', fontSize:12 }}>Chargement des données...</div>}

      {msg && (
        <div className="rise" style={{ borderRadius:10, padding:'10px 16px', marginBottom:16, fontSize:13, background:'var(--green-soft)', color:'var(--green)', border:'1px solid var(--green)40', display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="bell" size={14}/>{msg}
        </div>
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
            <Field label="État"><select style={inputStyle} value={form.etat} onChange={(e)=>setForm((f)=>({ ...f, etat: e.target.value }))}><option>ACTIF</option><option>INACTIF</option></select></Field>
            <Field label="Connectivité"><select style={inputStyle} value={form.connectivite} onChange={(e)=>setForm((f)=>({ ...f, connectivite: e.target.value }))}><option>WIFI</option><option>BLUETOOTH</option></select></Field>
            <Field label="Batterie %"><input type="number" min="0" max="100" style={inputStyle} value={form.batterie} onChange={(e)=>setForm((f)=>({ ...f, batterie: e.target.value }))}/></Field>
            {(form.type === 'Porte' || form.type === 'Volet') && <Field label="Position"><input type="number" style={inputStyle} value={form.position} onChange={(e)=>setForm((f)=>({ ...f, position: e.target.value }))}/></Field>}
            {(form.type === 'Thermostat' || form.type === 'Camera') && <Field label="Zone"><input style={inputStyle} value={form.zone} onChange={(e)=>setForm((f)=>({ ...f, zone: e.target.value }))}/></Field>}
            {(form.type === 'Television' || form.type === 'LaveLinge') && <><Field label="Cycle"><input style={inputStyle} value={form.cycle} onChange={(e)=>setForm((f)=>({ ...f, cycle: e.target.value }))}/></Field><Field label="Conso énergie"><input type="number" step="0.1" style={inputStyle} value={form.consoEnergie} onChange={(e)=>setForm((f)=>({ ...f, consoEnergie: e.target.value }))}/></Field></>}
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
        {items.map((o,i) => <DeviceTile key={o.id} obj={o} idx={i} onClick={()=>openDetail(o)} actions={acts}/>) }
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
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
            <Icon name="log" size={18}/>
            <h3 className="display" style={{ fontSize:18 }}>Historique · <span className="num" style={{color: t.accent}}>{history.length}</span></h3>
          </div>
          <div style={{ maxHeight:340, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
            {history.slice().reverse().map(h => {
              const isNeg = h.action.includes('DELETE') || h.action.includes('SUPPR') || h.action.includes('DÉSACT') || h.action.includes('INACTIF');
              const c = isNeg ? 'var(--red)' : (h.action.includes('LOGIN') || h.action.includes('CONNEXION') ? 'var(--blue)' : 'var(--green)');
              return (
                <div key={h.id} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'10px 12px', borderRadius:10, background:'var(--bg-2)' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: c, marginTop:6, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:'var(--text)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span className="mono" style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'var(--bg-3)', color: c }}>{h.action}</span>
                      <span style={{ fontWeight:500 }}>{h.objetNom}</span>
                    </div>
                    <div className="mono" style={{ fontSize:10, color:'var(--text-4)', marginTop:3 }}>
                      {h.code} · @{h.utilisateur} {h.details ? `· ${h.details}` : ''}
                    </div>
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
  return {
    type: form.type,
    nom: form.nom,
    marque: trimToNull(form.marque),
    pieceId: toNullableInteger(form.pieceId),
    etat: form.etat,
    connectivite: form.connectivite,
    batterie: toNullableFloat(form.batterie),
    position: toNullableInteger(form.position),
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
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [pieces, setPieces] = useState(PIECES);
  const [detail, setDetail] = useState(null);
  const [health, setHealth] = useState({ state: 'loading' })

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

  useEffect(() => {
    refreshSession()
    refreshPublic()
  }, [])

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
    setUser(toUiUser(data))
  }

  const handleLogout = async () => {
    await fetchJson('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const openDetail = (o) => {
    setDetail(o);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-soft', t.accent + '1f');
    document.documentElement.style.setProperty('--accent-glow', t.accent + '66');
  }, [t.accent]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [page]);

  const renderPage = () => {
    const props = { user, items, pieces, openDetail, t, health };
    if (page==='home') return <HomePage {...props} />;
    if (page==='recherche') return <SearchPage {...props} />;
    if (page==='visualisation') return (
      <VisualisationPage
        {...props}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onSessionRefresh={refreshSession}
      />
    )
    if (page==='gestion') return <GestionPage {...props} />;
    return null
  };

  return (
    <div style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'240px 1fr', position:'relative', zIndex:1 }}>
      <aside style={{
        background:'var(--bg-2)', borderRight:'1px solid var(--line)',
        padding:'24px 16px', display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32, padding:'0 8px' }}>
          <div style={{
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

        <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {PAGES.map(p => {
            const active = page === p.id;
            const locked = p.id === 'gestion' && user && user.niveauMax !== 'Avancé';
            return (
              <button key={p.id} onClick={()=>setPage(p.id)} style={{
                padding:'10px 12px', borderRadius:10, display:'flex', alignItems:'center', gap:12,
                background: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--text)' : (locked ? 'var(--text-4)' : 'var(--text-2)'),
                fontSize:13, fontWeight: active ? 500 : 400, transition:'all .15s',
                border: active ? '1px solid var(--line-2)' : '1px solid transparent',
              }}>
                <Icon name={p.icon} size={16}/>
                <span style={{ flex:1, textAlign:'left' }}>{p.label}</span>
                {locked && <Icon name="lock" size={11}/>}
                {active && <span style={{ width:4, height:4, borderRadius:'50%', background: t.accent, boxShadow:`0 0 6px ${t.accent}` }}/>} 
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop:'auto', padding:'14px', borderRadius:12, background:'var(--surface)', border:'1px solid var(--line)' }}>
          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background: t.accent, color:'#0e1116', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces', serif", fontSize:13, fontWeight:600 }}>{user.photo}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.prenom}</div>
                <div className="mono" style={{ fontSize:10, color:'var(--text-3)' }}>{user.points.toFixed(2)} pts</div>
              </div>
              <button onClick={handleLogout} style={iconBtn}><Icon name="power" size={12}/></button>
            </div>
          ) : (
            <button onClick={()=>setPage('visualisation')} style={{ width:'100%', padding:'8px', fontSize:12, color:'var(--text-2)', display:'flex', alignItems:'center', gap:8 }}>
              <Icon name="user" size={14}/> Se connecter
            </button>
          )}
        </div>

        <div className="mono" style={{ fontSize:9, color:'var(--text-4)', marginTop:14, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: health.state === 'ok' ? 'var(--green)' : 'var(--red)' }}/>
          {health.state === 'ok' ? 'Backend en ligne · v4.0' : 'Backend injoignable'}
        </div>
      </aside>

      <main style={{ padding:'40px 48px 80px', maxWidth: 1320, width:'100%' }}>
        {renderPage()}
      </main>

      <DetailDrawer obj={detail} onClose={()=>setDetail(null)}/>

      <TweaksPanel>
        <TweakSection label="Identité"/>
        <TweakText label="Nom de la maison" value={t.houseName} onChange={(v)=>setTweak('houseName', v)}/>
        <TweakSection label="Couleur"/>
        <TweakColor label="Accent" value={t.accent} onChange={(v)=>setTweak('accent', v)}/>
        <TweakSection label="Apparence"/>
        <TweakToggle label="Densité compacte" value={t.compact} onChange={(v)=>setTweak('compact', v)}/>
      </TweaksPanel>
    </div>
  );
}

export default App
