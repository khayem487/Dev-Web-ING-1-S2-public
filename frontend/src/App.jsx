import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

const TYPE_OPTIONS = [
    '',
    'Ouvrant',
    'Capteur',
    'Appareil',
    'BesoinAnimal',
    'Porte',
    'Volet',
    'Thermostat',
    'Camera',
    'Television',
    'LaveLinge',
    'Nourriture',
    'Eau'
]

const SERVICE_OPTIONS = ['', 'Acces', 'Surveillance', 'Confort', 'Animal']
const ETAT_OPTIONS = ['', 'ACTIF', 'INACTIF']

export default function App() {
    const [health, setHealth] = useState({ state: 'loading' })
    const [sessionUser, setSessionUser] = useState(null)
    const [sessionReady, setSessionReady] = useState(false)

    useEffect(() => {
        let cancelled = false

        fetch('/api/health')
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then((data) => {
                if (!cancelled) setHealth({ state: 'ok', data })
            })
            .catch((err) => {
                if (!cancelled) setHealth({ state: 'error', message: err.message })
            })

        return () => {
            cancelled = true
        }
    }, [])

    const refreshSession = useCallback(async () => {
        try {
            const me = await fetchJson('/api/auth/me')
            setSessionUser(me)
        } catch {
            setSessionUser(null)
        } finally {
            setSessionReady(true)
        }
    }, [])

    useEffect(() => {
        refreshSession()
    }, [refreshSession])

    return (
        <div className="app-shell">
            <header className="app-header">
                <div>
                    <h1>Maison Intelligente</h1>
                    <p>Projet Dev Web ING1 — modules Information + Visualisation (MVP)</p>
                </div>
                <nav>
                    <NavLink to="/" end>
                        Accueil
                    </NavLink>
                    <NavLink to="/recherche">Recherche</NavLink>
                    <NavLink to="/visualisation">Visualisation</NavLink>
                </nav>
            </header>

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<HomePage health={health} sessionUser={sessionUser} />} />
                    <Route path="/recherche" element={<SearchPage />} />
                    <Route
                        path="/visualisation"
                        element={
                            <VisualisationPage
                                sessionUser={sessionUser}
                                sessionReady={sessionReady}
                                onSessionRefresh={refreshSession}
                            />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            <footer className="app-footer">CY Tech · ING1 · Maison connectée</footer>
        </div>
    )
}

function HomePage({ health, sessionUser }) {
    const [piecesCount, setPiecesCount] = useState(null)
    const [objetsCount, setObjetsCount] = useState(null)

    useEffect(() => {
        let cancelled = false

        Promise.all([
            fetchJson('/api/info/pieces').catch(() => []),
            fetchJson('/api/info/objets').catch(() => [])
        ])
            .then(([pieces, objets]) => {
                if (cancelled) return
                setPiecesCount(Array.isArray(pieces) ? pieces.length : 0)
                setObjetsCount(Array.isArray(objets) ? objets.length : 0)
            })
            .catch(() => {
                if (cancelled) return
                setPiecesCount(0)
                setObjetsCount(0)
            })

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <section className="stack">
            <article className="card hero">
                <h2>Visite publique de la maison</h2>
                <p>
                    Cette version expose les données de la maison intelligente (pièces + objets connectés)
                    et active un module Visualisation avec authentification, profil et gamification.
                </p>
                <ul>
                    <li>✅ Module Information terminé (P1)</li>
                    <li>✅ Backend Visualisation en place (auth, profil, points/niveaux)</li>
                    <li>➡️ Next: finaliser le module Gestion (CRUD complet)</li>
                </ul>
                {sessionUser && (
                    <p className="ok">
                        Connecté: {sessionUser.prenom} {sessionUser.nom} · Niveau {sessionUser.niveau} ·{' '}
                        {sessionUser.points} pts
                    </p>
                )}
            </article>

            <article className="card">
                <h3>État du backend</h3>
                {health.state === 'loading' && <p>Chargement...</p>}
                {health.state === 'ok' && (
                    <div>
                        <p className="ok">Backend OK</p>
                        <pre>{JSON.stringify(health.data, null, 2)}</pre>
                    </div>
                )}
                {health.state === 'error' && (
                    <p className="error">Backend injoignable : {health.message}</p>
                )}
            </article>

            <div className="kpi-grid">
                <article className="card kpi">
                    <span>Pièces</span>
                    <strong>{piecesCount ?? '...'}</strong>
                </article>
                <article className="card kpi">
                    <span>Objets connectés</span>
                    <strong>{objetsCount ?? '...'}</strong>
                </article>
            </div>
        </section>
    )
}

function SearchPage() {
    const [pieces, setPieces] = useState([])
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [type, setType] = useState('')
    const [pieceId, setPieceId] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [query, setQuery] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setQuery(searchInput.trim()), 300)
        return () => clearTimeout(timer)
    }, [searchInput])

    useEffect(() => {
        fetchJson('/api/info/pieces')
            .then((data) => setPieces(Array.isArray(data) ? data : []))
            .catch(() => setPieces([]))
    }, [])

    useEffect(() => {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (type) params.set('type', type)
        if (pieceId) params.set('pieceId', pieceId)
        if (query) params.set('q', query)

        const url = params.toString() ? `/api/info/objets?${params}` : '/api/info/objets'

        fetchJson(url)
            .then((data) => setItems(Array.isArray(data) ? data : []))
            .catch((err) => {
                setItems([])
                setError(`Impossible de charger les objets (${err.message})`)
            })
            .finally(() => setLoading(false))
    }, [type, pieceId, query])

    const subtitle = useMemo(() => {
        const chunks = []
        if (type) chunks.push(`type: ${type}`)
        if (pieceId) {
            const p = pieces.find((x) => String(x.id) === String(pieceId))
            chunks.push(`pièce: ${p?.nom ?? pieceId}`)
        }
        if (query) chunks.push(`recherche: "${query}"`)
        return chunks.length ? chunks.join(' · ') : 'Aucun filtre (liste complète)'
    }, [type, pieceId, pieces, query])

    return (
        <section className="stack">
            <article className="card">
                <h2>Recherche d&apos;objets connectés (public)</h2>
                <p>Filtres combinables : type, pièce, recherche texte (debounce 300ms).</p>

                <div className="filters">
                    <label>
                        Type
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            {TYPE_OPTIONS.map((opt) => (
                                <option key={opt || 'all'} value={opt}>
                                    {opt || 'Tous'}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Pièce
                        <select value={pieceId} onChange={(e) => setPieceId(e.target.value)}>
                            <option value="">Toutes</option>
                            {pieces.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nom}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Recherche
                        <input
                            type="text"
                            placeholder="Nom, marque, type..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </label>
                </div>

                <small>{subtitle}</small>
            </article>

            <ResultsCard loading={loading} error={error} items={items} />
        </section>
    )
}

function VisualisationPage({ sessionUser, sessionReady, onSessionRefresh }) {
    if (!sessionReady) {
        return (
            <section className="card">
                <h2>Visualisation</h2>
                <p>Chargement de la session...</p>
            </section>
        )
    }

    if (!sessionUser) {
        return <AuthPanel onSessionRefresh={onSessionRefresh} />
    }

    return <VisualisationDashboard sessionUser={sessionUser} onSessionRefresh={onSessionRefresh} />
}

function AuthPanel({ onSessionRefresh }) {
    const [registerForm, setRegisterForm] = useState({ prenom: '', nom: '', email: '', motDePasse: '' })
    const [loginForm, setLoginForm] = useState({ email: '', motDePasse: '' })
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const submitRegister = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        try {
            await fetchJson('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(registerForm)
            })
            setMessage('Compte créé et connecté ✅')
            await onSessionRefresh()
        } catch (err) {
            setError(err.message)
        }
    }

    const submitLogin = async (e) => {
        e.preventDefault()
        setError('')
        setMessage('')
        try {
            await fetchJson('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginForm)
            })
            setMessage('Connexion réussie ✅')
            await onSessionRefresh()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <section className="stack">
            <article className="card">
                <h2>Module Visualisation (auth requis)</h2>
                <p>
                    Crée un compte ou connecte-toi pour accéder au profil, consulter les services et
                    accumuler des points selon les actions.
                </p>
                {message && <p className="ok">{message}</p>}
                {error && <p className="error">{error}</p>}
            </article>

            <div className="auth-grid">
                <article className="card">
                    <h3>Créer un compte</h3>
                    <form className="form-grid" onSubmit={submitRegister}>
                        <label>
                            Prénom
                            <input
                                required
                                value={registerForm.prenom}
                                onChange={(e) => setRegisterForm((f) => ({ ...f, prenom: e.target.value }))}
                            />
                        </label>
                        <label>
                            Nom
                            <input
                                required
                                value={registerForm.nom}
                                onChange={(e) => setRegisterForm((f) => ({ ...f, nom: e.target.value }))}
                            />
                        </label>
                        <label>
                            Email
                            <input
                                type="email"
                                required
                                value={registerForm.email}
                                onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                            />
                        </label>
                        <label>
                            Mot de passe
                            <input
                                type="password"
                                required
                                minLength={4}
                                value={registerForm.motDePasse}
                                onChange={(e) => setRegisterForm((f) => ({ ...f, motDePasse: e.target.value }))}
                            />
                        </label>
                        <button type="submit">Créer et se connecter</button>
                    </form>
                </article>

                <article className="card">
                    <h3>Se connecter</h3>
                    <form className="form-grid" onSubmit={submitLogin}>
                        <label>
                            Email
                            <input
                                type="email"
                                required
                                value={loginForm.email}
                                onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                            />
                        </label>
                        <label>
                            Mot de passe
                            <input
                                type="password"
                                required
                                value={loginForm.motDePasse}
                                onChange={(e) => setLoginForm((f) => ({ ...f, motDePasse: e.target.value }))}
                            />
                        </label>
                        <button type="submit">Connexion</button>
                    </form>
                </article>
            </div>
        </section>
    )
}

function VisualisationDashboard({ sessionUser, onSessionRefresh }) {
    const [profile, setProfile] = useState(sessionUser)
    const [profileForm, setProfileForm] = useState({
        pseudo: '',
        bioPublique: '',
        telephonePrive: '',
        adressePrivee: ''
    })

    const [pieces, setPieces] = useState([])
    const [services, setServices] = useState([])
    const [items, setItems] = useState([])

    const [type, setType] = useState('')
    const [service, setService] = useState('')
    const [etat, setEtat] = useState('')
    const [pieceId, setPieceId] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [query, setQuery] = useState('')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saveMsg, setSaveMsg] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setQuery(searchInput.trim()), 300)
        return () => clearTimeout(timer)
    }, [searchInput])

    const refreshProfile = useCallback(async () => {
        const data = await fetchJson('/api/visualisation/profile')
        setProfile(data)
        setProfileForm({
            pseudo: data.pseudo ?? '',
            bioPublique: data.bioPublique ?? '',
            telephonePrive: data.telephonePrive ?? '',
            adressePrivee: data.adressePrivee ?? ''
        })
        await onSessionRefresh()
    }, [onSessionRefresh])

    useEffect(() => {
        refreshProfile().catch((err) => setError(err.message))

        fetchJson('/api/info/pieces')
            .then((data) => setPieces(Array.isArray(data) ? data : []))
            .catch(() => setPieces([]))

        fetchJson('/api/visualisation/services')
            .then((data) => setServices(Array.isArray(data) ? data : []))
            .catch(() => setServices([]))
    }, [refreshProfile])

    useEffect(() => {
        setLoading(true)
        setError('')

        const params = new URLSearchParams()
        if (type) params.set('type', type)
        if (service) params.set('service', service)
        if (etat) params.set('etat', etat)
        if (pieceId) params.set('pieceId', pieceId)
        if (query) params.set('q', query)

        const url = params.toString() ? `/api/visualisation/objets?${params}` : '/api/visualisation/objets'

        fetchJson(url)
            .then(async (data) => {
                setItems(Array.isArray(data) ? data : [])
                await onSessionRefresh()
            })
            .catch((err) => {
                setItems([])
                setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [type, service, etat, pieceId, query, onSessionRefresh])

    const saveProfile = async (e) => {
        e.preventDefault()
        setSaveMsg('')
        try {
            const data = await fetchJson('/api/visualisation/profile', {
                method: 'PUT',
                body: JSON.stringify(profileForm)
            })
            setProfile(data)
            setSaveMsg('Profil mis à jour ✅ (+5 points)')
            await onSessionRefresh()
        } catch (err) {
            setSaveMsg(`Erreur: ${err.message}`)
        }
    }

    const logout = async () => {
        await fetchJson('/api/auth/logout', { method: 'POST' })
        await onSessionRefresh()
    }

    return (
        <section className="stack">
            <article className="card">
                <div className="row-between">
                    <div>
                        <h2>Visualisation privée</h2>
                        <p>
                            Bienvenue {profile?.prenom} {profile?.nom}.
                        </p>
                    </div>
                    <button onClick={logout}>Se déconnecter</button>
                </div>

                <div className="kpi-grid">
                    <article className="card kpi">
                        <span>Niveau</span>
                        <strong>{profile?.niveau ?? sessionUser.niveau}</strong>
                    </article>
                    <article className="card kpi">
                        <span>Points</span>
                        <strong>{profile?.points ?? sessionUser.points}</strong>
                    </article>
                </div>
            </article>

            <article className="card">
                <h3>Profil (public / privé)</h3>
                <form className="form-grid" onSubmit={saveProfile}>
                    <label>
                        Pseudo (public)
                        <input
                            value={profileForm.pseudo}
                            onChange={(e) => setProfileForm((f) => ({ ...f, pseudo: e.target.value }))}
                        />
                    </label>
                    <label>
                        Bio (publique)
                        <textarea
                            rows={3}
                            value={profileForm.bioPublique}
                            onChange={(e) => setProfileForm((f) => ({ ...f, bioPublique: e.target.value }))}
                        />
                    </label>
                    <label>
                        Téléphone (privé)
                        <input
                            value={profileForm.telephonePrive}
                            onChange={(e) =>
                                setProfileForm((f) => ({ ...f, telephonePrive: e.target.value }))
                            }
                        />
                    </label>
                    <label>
                        Adresse (privée)
                        <input
                            value={profileForm.adressePrivee}
                            onChange={(e) =>
                                setProfileForm((f) => ({ ...f, adressePrivee: e.target.value }))
                            }
                        />
                    </label>
                    <button type="submit">Enregistrer profil</button>
                </form>
                {saveMsg && <p className={saveMsg.startsWith('Erreur') ? 'error' : 'ok'}>{saveMsg}</p>}
            </article>

            <article className="card">
                <h3>Services disponibles</h3>
                <div className="chips">
                    {services.map((s) => (
                        <span key={s.code} className="chip">
                            {s.label}: {s.objets}
                        </span>
                    ))}
                </div>
            </article>

            <article className="card">
                <h3>Recherche objets (privée)</h3>
                <p>Filtres combinables: service, type, état, pièce, texte.</p>

                <div className="filters">
                    <label>
                        Service
                        <select value={service} onChange={(e) => setService(e.target.value)}>
                            {SERVICE_OPTIONS.map((opt) => (
                                <option key={opt || 'all'} value={opt}>
                                    {opt || 'Tous'}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Type
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            {TYPE_OPTIONS.map((opt) => (
                                <option key={opt || 'all'} value={opt}>
                                    {opt || 'Tous'}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        État
                        <select value={etat} onChange={(e) => setEtat(e.target.value)}>
                            {ETAT_OPTIONS.map((opt) => (
                                <option key={opt || 'all'} value={opt}>
                                    {opt || 'Tous'}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Pièce
                        <select value={pieceId} onChange={(e) => setPieceId(e.target.value)}>
                            <option value="">Toutes</option>
                            {pieces.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nom}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Recherche
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Nom, marque, service..."
                        />
                    </label>
                </div>
            </article>

            <ResultsCard loading={loading} error={error} items={items} />
        </section>
    )
}

function ResultsCard({ loading, error, items }) {
    return (
        <article className="card">
            <h3>Résultats</h3>
            {loading && <p>Chargement...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
                <>
                    <p>{items.length} objet(s) trouvé(s)</p>
                    <div className="results-grid">
                        {items.map((item) => (
                            <article key={item.id} className="result-card">
                                <header>
                                    <strong>{item.nom}</strong>
                                    <span className="badge">{item.type}</span>
                                </header>
                                <p>
                                    {item.marque || 'Marque inconnue'} · {item.pieceNom}
                                </p>
                                <p>
                                    Service: <strong>{item.service}</strong>
                                </p>
                                <p>
                                    Branche: <strong>{item.branche}</strong> · État:{' '}
                                    <strong>{item.etat}</strong>
                                </p>
                            </article>
                        ))}
                    </div>
                </>
            )}
        </article>
    )
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
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

    let payload = null
    const text = await response.text()
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
        throw new Error(message)
    }

    return payload
}
