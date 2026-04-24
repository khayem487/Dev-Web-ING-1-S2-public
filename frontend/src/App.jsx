import { useEffect, useState } from 'react'

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
        <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
            <h1>Maison Intelligente — Dev Web ING1</h1>
            <p>Frontend React opérationnel. Ping API backend&nbsp;:</p>
            <section
                aria-live="polite"
                style={{
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    background: health.state === 'ok' ? '#e8f5e9' : health.state === 'error' ? '#ffebee' : '#f5f5f5'
                }}
            >
                {health.state === 'loading' && <span>Chargement…</span>}
                {health.state === 'ok' && (
                    <>
                        <strong>Backend OK</strong>
                        <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(health.data, null, 2)}
                        </pre>
                    </>
                )}
                {health.state === 'error' && (
                    <>
                        <strong>Backend injoignable</strong>
                        <div>Erreur : {health.message}</div>
                        <small>Vérifiez que Spring Boot tourne sur http://localhost:8080</small>
                    </>
                )}
            </section>
        </main>
    )
}
