import { useEffect, useMemo, useState } from 'react'
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

export default function App() {
    const [health, setHealth] = useState({ state: 'loading' })

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

    return (
        <div className="app-shell">
            <header className="app-header">
                <div>
                    <h1>Maison Intelligente</h1>
                    <p>Projet Dev Web ING1 — module Information (MVP)</p>
                </div>
                <nav>
                    <NavLink to="/" end>
                        Accueil
                    </NavLink>
                    <NavLink to="/recherche">Recherche</NavLink>
                </nav>
            </header>

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<HomePage health={health} />} />
                    <Route path="/recherche" element={<SearchPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            <footer className="app-footer">CY Tech · ING1 · Maison connectée</footer>
        </div>
    )
}

function HomePage({ health }) {
    const [piecesCount, setPiecesCount] = useState(null)
    const [objetsCount, setObjetsCount] = useState(null)

    useEffect(() => {
        let cancelled = false

        Promise.all([
            fetch('/api/info/pieces').then((r) => (r.ok ? r.json() : [])),
            fetch('/api/info/objets').then((r) => (r.ok ? r.json() : []))
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
                    Cette première version expose les informations de base d&apos;une maison intelligente
                    (pièces + objets connectés) avec un moteur de recherche filtrable.
                </p>
                <ul>
                    <li>✅ P0 validé (backend + frontend connectés)</li>
                    <li>✅ P1.1/P1.2/P1.3 backend validés</li>
                    <li>➡️ Prochaine étape : enrichir l&apos;UI et les modules Visualisation/Gestion</li>
                </ul>
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
        fetch('/api/info/pieces')
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
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

        fetch(url)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
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
                <h2>Recherche d&apos;objets connectés</h2>
                <p>Filtres combinables : type, pièce, recherche texte (avec debounce 300ms).</p>

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
                                        Branche: <strong>{item.branche}</strong> · État:{' '}
                                        <strong>{item.etat}</strong>
                                    </p>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </article>
        </section>
    )
}
