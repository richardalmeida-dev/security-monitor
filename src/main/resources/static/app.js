/* ============================================================
   security-monitor — dashboard
   Vanilla JS, sem dependências. Refresh 5s com reconciliação
   keyed na tabela de eventos (sem flicker, scroll preservado).
   ============================================================ */
(function () {
  'use strict';

  // ----- config -----
  const POLL_MS = 5000;
  const EVENTS_LIMIT = 100;
  const ALERTS_LIMIT = 50;

  // ----- state -----
  const state = {
    rawEvents: [],
    filters: {
      sources: new Set(['APP', 'ADMIN_PANEL', 'FINANCIAL']),
      type: '',
      query: ''
    }
  };
  const eventNodes = new Map(); // id -> <tr>
  const alertNodes = new Map(); // id -> <article>

  // ----- helpers -----
  const $ = (id) => document.getElementById(id);

  const escape = (s) => (s == null ? '' : String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;'));

  const pad = (n) => String(n).padStart(2, '0');

  function fmtAbs(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
      + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function fmtRel(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
    if (diff < 5) return 'agora';
    if (diff < 60) return `há ${Math.floor(diff)}s`;
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
    return `há ${Math.floor(diff / 86400)} d`;
  }

  const isUnknown = (v) => !v || v === 'UNKNOWN';

  // tipo de evento → classe de cor consistente
  const TYPE_CLASS = {
    LOGIN_SUCCESS:    'evt-ok',
    ACCESS_GRANTED:   'evt-ok',
    LOGIN_FAILURE:    'evt-fail',
    ACCESS_DENIED:    'evt-fail',
    SENSITIVE_ACTION: 'evt-warn',
    LOGOUT:           'evt-neutral'
  };

  // severidade por tipo de alerta. Hoje só BRUTE_FORCE_LOGIN → HIGH.
  // Tipos futuros sem mapeamento caem em MEDIUM.
  function severityOf(alertType) {
    if (alertType === 'BRUTE_FORCE_LOGIN') return 'HIGH';
    return 'MEDIUM';
  }

  // ============================ STATUS / LIVE ============================

  let liveTimer = null;
  function setLive(ok) {
    const el = $('live');
    el.classList.remove('is-ok', 'is-err');
    el.classList.add(ok ? 'is-ok' : 'is-err');
    $('live-text').textContent = ok ? 'LIVE' : 'OFFLINE';
    $('updated').textContent = 'última: ' + fmtAbs(new Date().toISOString());

    // pisca o LIVE rapidamente para indicar nova batida
    if (ok) {
      el.style.transition = 'none';
      el.style.opacity = '0.6';
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '1'; }, 30);
    }
  }

  // ============================ STATS ============================

  function setText(id, v) {
    const n = $(id);
    const s = String(v ?? 0);
    if (n.textContent !== s) n.textContent = s;
  }

  function renderStats(s) {
    setText('m-total-events',     s.totalEvents);
    setText('m-total-alerts',     s.totalAlerts);
    setText('m-login-fail',       s.loginFailures);
    setText('m-login-fail-1h',    s.loginFailuresLastHour);

    $('kpi-alerts').classList.toggle('is-hot',  (s.totalAlerts ?? 0) > 0);
    $('kpi-fail').classList.toggle('is-warm',   (s.loginFailures ?? 0) > 0);
    $('kpi-fail-1h').classList.toggle('is-warm',(s.loginFailuresLastHour ?? 0) > 0);
  }

  // ============================ ALERTAS ============================

  function createAlertNode(a) {
    const node = document.createElement('article');
    node.setAttribute('role', 'listitem');
    node.dataset.id = a.id;
    node.innerHTML = `
      <span class="sev-pill"></span>
      <span class="a-type"></span>
      <span class="a-ip"></span>
      <span class="a-msg"></span>
      <span class="a-meta">
        <span class="occ" title="ocorrências"></span>
        <time class="a-time"></time>
      </span>`;
    return node;
  }

  function updateAlertNode(node, a) {
    const sev = severityOf(a.alertType);
    node.className = `alert sev-${sev}`;
    const pill = node.querySelector('.sev-pill');
    pill.className = `sev-pill sev-${sev}`;
    pill.textContent = sev;

    node.querySelector('.a-type').textContent = a.alertType || '—';
    node.querySelector('.a-ip').textContent = a.ip || '—';
    node.querySelector('.a-msg').textContent = a.message || '';
    node.querySelector('.a-msg').title = a.message || '';
    node.querySelector('.occ').textContent = `×${a.occurrences ?? 1}`;
    const t = node.querySelector('.a-time');
    t.textContent = fmtRel(a.createdAt);
    t.dateTime = a.createdAt || '';
    t.title = fmtAbs(a.createdAt);
  }

  function renderAlerts(list) {
    $('alerts-count').textContent = list.length;
    const container = $('alerts-list');
    const empty = $('alerts-empty');

    if (!list.length) {
      // limpa nodes residuais
      for (const node of eventNodes.values()) {}  // noop
      alertNodes.forEach((n) => n.remove());
      alertNodes.clear();
      container.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const incoming = new Set(list.map((a) => a.id));
    for (const [id, node] of alertNodes) {
      if (!incoming.has(id)) { node.remove(); alertNodes.delete(id); }
    }
    let prev = null;
    for (const a of list) {
      let node = alertNodes.get(a.id);
      if (!node) { node = createAlertNode(a); alertNodes.set(a.id, node); }
      updateAlertNode(node, a);
      const target = prev ? prev.nextSibling : container.firstChild;
      if (target !== node) container.insertBefore(node, target);
      prev = node;
    }
  }

  // ============================ DISTRIBUIÇÃO ============================

  function classForSource(s) { return 'src-' + s; }
  function colorForSourceVar(s) {
    return s === 'APP'         ? 'var(--src-app)'
         : s === 'ADMIN_PANEL' ? 'var(--src-admin)'
         : s === 'FINANCIAL'   ? 'var(--src-fin)'
         : 'var(--fg-mute)';
  }
  function colorForTypeVar(t) {
    const c = TYPE_CLASS[t] || 'evt-neutral';
    return c === 'evt-ok'   ? 'var(--ok)'
         : c === 'evt-fail' ? 'var(--high)'
         : c === 'evt-warn' ? 'var(--warn)'
         : 'var(--fg-mute)';
  }

  function renderBars(targetId, counts, colorFor) {
    const target = $(targetId);
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, n]) => s + n, 0);
    if (!entries.length) {
      target.innerHTML = '<div class="muted">sem dados no feed</div>';
      return;
    }
    target.innerHTML = entries.map(([key, n]) => {
      const pct = total ? (n * 100 / total) : 0;
      return `
        <div class="bar-row">
          <span class="bar-label" title="${escape(key)}">${escape(key)}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${pct.toFixed(1)}%;background:${colorFor(key)}"></span></span>
          <span class="bar-count">${n}</span>
        </div>`;
    }).join('');
  }

  function renderDistribution(events) {
    const bySource = {};
    const byType = {};
    for (const e of events) {
      bySource[e.sourceSystem] = (bySource[e.sourceSystem] || 0) + 1;
      byType[e.eventType]      = (byType[e.eventType]      || 0) + 1;
    }
    renderBars('dist-source', bySource, colorForSourceVar);
    renderBars('dist-type',   byType,   colorForTypeVar);
  }

  // ============================ EVENTOS ============================

  function createEventRow(e) {
    const tr = document.createElement('tr');
    tr.dataset.id = e.id;
    tr.innerHTML = `
      <td class="cell-time"><span class="t-rel"></span><br><small class="t-abs"></small></td>
      <td><span class="tag t-type"></span></td>
      <td><span class="src s-src"></span></td>
      <td class="c-user"></td>
      <td class="cell-mono c-ip"></td>
      <td class="c-geo"></td>
      <td class="cell-details c-details"></td>`;
    return tr;
  }

  function updateEventRow(tr, e) {
    const isFail = e.eventType === 'LOGIN_FAILURE' || e.eventType === 'ACCESS_DENIED';
    tr.classList.toggle('row-fail', isFail);

    const rel = tr.querySelector('.t-rel');
    const abs = tr.querySelector('.t-abs');
    rel.textContent = fmtRel(e.occurredAt);
    abs.textContent = fmtAbs(e.occurredAt);
    tr.querySelector('.cell-time').title = fmtAbs(e.occurredAt);

    const typeTag = tr.querySelector('.t-type');
    typeTag.className = 'tag t-type ' + (TYPE_CLASS[e.eventType] || 'evt-neutral');
    typeTag.textContent = e.eventType || '—';

    const src = tr.querySelector('.s-src');
    src.className = 'src s-src ' + classForSource(e.sourceSystem);
    src.textContent = e.sourceSystem || '—';

    const user = tr.querySelector('.c-user');
    user.textContent = e.username || '—';
    user.classList.toggle('cell-dim', !e.username);

    tr.querySelector('.c-ip').textContent = e.ip || '—';

    const geo = tr.querySelector('.c-geo');
    if (isUnknown(e.country) && isUnknown(e.city)) {
      geo.textContent = '—';
      geo.className = 'c-geo cell-dim';
      geo.title = 'sem geolocalização';
    } else {
      geo.textContent = `${e.country || '—'} · ${e.city || '—'}`;
      geo.className = 'c-geo';
      geo.title = '';
    }

    const det = tr.querySelector('.c-details');
    det.textContent = e.details || '—';
    det.title = e.details || '';
  }

  function applyFilters(events) {
    const { sources, type, query } = state.filters;
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (!sources.has(e.sourceSystem)) return false;
      if (type && e.eventType !== type) return false;
      if (q) {
        const ip = (e.ip || '').toLowerCase();
        const user = (e.username || '').toLowerCase();
        if (!ip.includes(q) && !user.includes(q)) return false;
      }
      return true;
    });
  }

  function renderEvents() {
    const filtered = applyFilters(state.rawEvents);
    $('events-count').textContent = filtered.length;

    const tbody = document.querySelector('#events-table tbody');
    const wrap = $('events-wrap');
    const empty = $('events-empty');
    const savedScroll = wrap.scrollTop;

    if (!filtered.length) {
      eventNodes.forEach((n) => n.remove());
      eventNodes.clear();
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const incoming = new Set(filtered.map((e) => e.id));
    for (const [id, node] of eventNodes) {
      if (!incoming.has(id)) { node.remove(); eventNodes.delete(id); }
    }
    let prev = null;
    for (const e of filtered) {
      let node = eventNodes.get(e.id);
      if (!node) { node = createEventRow(e); eventNodes.set(e.id, node); }
      updateEventRow(node, e);
      const target = prev ? prev.nextSibling : tbody.firstChild;
      if (target !== node) tbody.insertBefore(node, target);
      prev = node;
    }
    wrap.scrollTop = savedScroll;
  }

  // ============================ FETCH LOOP ============================

  async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
    return r.json();
  }

  async function refresh() {
    try {
      const [stats, alerts, events] = await Promise.all([
        fetchJson('/api/stats'),
        fetchJson(`/api/alerts?limit=${ALERTS_LIMIT}`),
        fetchJson(`/api/events?limit=${EVENTS_LIMIT}`)
      ]);
      state.rawEvents = events;
      renderStats(stats);
      renderAlerts(alerts);
      renderDistribution(events);
      renderEvents();
      setLive(true);
    } catch (err) {
      console.error(err);
      setLive(false);
    }
  }

  // ============================ EVENTOS DE UI ============================

  function bindFilters() {
    document.querySelectorAll('.chip[data-filter="source"]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const v = chip.dataset.val;
        if (state.filters.sources.has(v)) {
          state.filters.sources.delete(v);
          chip.classList.remove('is-on');
          chip.setAttribute('aria-pressed', 'false');
        } else {
          state.filters.sources.add(v);
          chip.classList.add('is-on');
          chip.setAttribute('aria-pressed', 'true');
        }
        renderEvents();
      });
    });
    $('filter-type').addEventListener('change', (e) => {
      state.filters.type = e.target.value;
      renderEvents();
    });
    $('filter-search').addEventListener('input', (e) => {
      state.filters.query = e.target.value;
      renderEvents();
    });
  }

  // ============================ BOOT ============================

  bindFilters();
  refresh();
  setInterval(refresh, POLL_MS);

  // recalcula tempos relativos a cada 30s mesmo sem novo fetch (mantém "há 2 min" coerente)
  setInterval(() => {
    for (const [, tr] of eventNodes) {
      const abs = tr.querySelector('.t-abs').textContent;
      const rel = tr.querySelector('.t-rel');
      const iso = absToIso(abs);
      if (iso) rel.textContent = fmtRel(iso);
    }
    for (const [, node] of alertNodes) {
      const t = node.querySelector('.a-time');
      if (t.dateTime) t.textContent = fmtRel(t.dateTime);
    }
  }, 30000);

  // Converte o "YYYY-MM-DD HH:MM:SS" de volta para ISO local — usado só pelo tick acima.
  function absToIso(abs) {
    if (!abs || abs === '—') return null;
    const m = abs.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).toISOString();
  }
})();
