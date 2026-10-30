import { useCallback, useEffect, useRef, useState } from 'react';

export default function App() {
  const [value, setValue] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [activity, setActivity] = useState('Waiting for the first response');
  const request = useRef<AbortController | null>(null);
  const writing = useRef(false);

  const load = useCallback(async (increment = false) => {
    if (writing.current) return;
    if (!increment && request.current) return;
    request.current?.abort(); // An older read must not replace an increment response.
    const controller = new AbortController();
    request.current = controller;
    writing.current = increment;
    setBusy(increment);
    setReading(!increment);
    const started = performance.now();
    // Free-host cold starts may take around a minute.
    const timeout = window.setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch(increment ? '/api/increment' : '/api/counter', {
        method: increment ? 'POST' : 'GET', cache: 'no-store', signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('value' in data) ||
          typeof data.value !== 'number' || !Number.isSafeInteger(data.value) || data.value < 0) {
        throw new Error('Invalid counter response');
      }
      if (request.current !== controller) return;
      setValue(data.value);
      setConnected(true);
      setUpdated(new Date());
      setLatency(Math.round(performance.now() - started));
      setActivity(increment ? 'POST /api/increment → 200' : 'GET /api/counter → 200');
      setError('');
    } catch {
      if (request.current !== controller) return;
      setConnected(false);
      setError(increment
        ? 'Could not confirm the increment. Refresh to check the saved value before trying again.'
        : 'Could not reach the counter. The server may be waking up; try refreshing shortly.');
      setActivity('Request could not be confirmed');
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        writing.current = false;
        setBusy(false);
        setReading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => { if (!document.hidden) void load(); }, 5000);
    const onFocus = () => { if (!document.hidden) void load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onFocus);
      request.current?.abort();
      request.current = null;
      writing.current = false;
    };
  }, [load]);

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="/" aria-label="Counter Lab home"><span aria-hidden="true">＋</span> counter<span className="brand-light">lab</span></a>
        <span className="lesson-tag">HLD <span>/</span> SESSION 01</span>
      </header>
      <main>
        <div className="intro">
          <p className="eyebrow"><span /> A SMALL EXPERIMENT IN SHARED STATE</p>
          <h1>One counter.<br /><em>Every click counts.</em></h1>
          <p className="subtitle">A little number with a real backend. Add one, refresh,<br className="desktop-break" /> come back later. The database remembers.</p>
        </div>

        <section className="counter-card" aria-label="Shared counter">
          <div className="card-top"><span className="card-label">GLOBAL COUNTER</span><span className={`status ${connected ? 'online' : ''}`} role="status"><i />{connected ? 'Connected' : reading ? 'Connecting' : 'Unavailable'}</span></div>
          <div className="counter-value" aria-live="polite" aria-atomic="true">{value === null ? '—' : value.toLocaleString()}</div>
          <p className="counter-caption">{value === null ? 'Fetching the saved value…' : connected ? 'Stored in MongoDB. Shared by everyone.' : 'Last known value · connection interrupted'}</p>
          <button className="increment" type="button" disabled={busy || !connected} onClick={() => { void load(true); }}>
            <span aria-hidden="true">＋</span> {busy ? 'Saving…' : 'Increment'} <kbd>+1</kbd>
          </button>
          <button className="refresh" type="button" disabled={busy || reading} onClick={() => { void load(); }}><span aria-hidden="true">↻</span> {reading ? 'Refreshing…' : 'Refresh value'}</button>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="card-bottom"><span>↳ {updated ? `Last read at ${updated.toLocaleTimeString()}` : 'Waiting for database'}</span><span>Auto-refresh · 5s</span></div>
        </section>

        <section className="under-the-hood" aria-labelledby="hood-title">
          <div className="section-title"><h2 id="hood-title">Under the hood</h2><span>THE REQUEST JOURNEY</span></div>
          <div className="pipeline">
            <div><span className="step-icon" aria-hidden="true">◫</span><strong>React</strong><small>The interface</small></div>
            <span className="arrow" aria-hidden="true">→</span>
            <div><span className="step-icon" aria-hidden="true">⇄</span><strong>Express</strong><small>The API</small></div>
            <span className="arrow" aria-hidden="true">→</span>
            <div><span className="step-icon" aria-hidden="true">▱</span><strong>MongoDB</strong><small>The source of truth</small></div>
          </div>
          <div className="request-log"><span className="log-dot" /><code>{activity}</code><span>{latency === null ? '—' : `${latency} ms`}</span></div>
          <p className="atomic-note">Every increment uses <code>$inc</code>: one atomic update, so simultaneous clicks don’t overwrite each other.</p>
        </section>
      </main>
      <footer><span>Built to learn. Made to count.</span><a href="https://github.com/slyjain/system-design-JAVA/tree/main/HLD/counter-app" target="_blank" rel="noreferrer">Explore the code <span aria-hidden="true">↗</span></a></footer>
    </div>
  );
}
