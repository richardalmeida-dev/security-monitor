/* ============================================================
   security-monitor, dashboard
   Vanilla JS, sem dependências. Refresh 5s. Eventos repetidos
   consecutivos (mesmo IP + tipo + fonte) são colapsados em grupo
   expansível. Gráfico de atividade em SVG na mão.
   ============================================================ */
(function () {
  'use strict';

  // ----- config -----
  const POLL_MS = 5000;
  const EVENTS_LIMIT = 300;       // fetch maior alimenta as agregações
  const TABLE_LIMIT = 100;        // tabela visível continua enxuta
  const TOP_IPS_LIMIT = 6;
  const ALERTS_LIMIT = 50;
  const CHART_BUCKETS = 30;       // 30 buckets de 30s = 15 min
  const CHART_BUCKET_SECONDS = 30;

  // ----- state -----
  const state = {
    rawEvents: [],
    rawAlerts: [],
    filters: {
      sources: new Set(['APP', 'ADMIN_PANEL', 'FINANCIAL']),
      type: '',
      query: ''
    },
    expandedGroups: new Set(),    // chave = id do primeiro evento do grupo
    expandedAlerts: new Set()     // ids de alerta com "entender" aberto
  };
  const alertNodes = new Map();   // id -> <article>

  // ----- helpers -----
  const $ = (id) => document.getElementById(id);

  const pad = (n) => String(n).padStart(2, '0');

  function fmtAbs(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
      + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function fmtRel(iso) {
    if (!iso) return '';
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

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ============================ ÍCONES (SVG inline, herdam currentColor) ============================

  const ICONS = {
    shield:   '<path d="M12 2 4 5v6c0 5.2 3.4 9.6 8 11 4.6-1.4 8-5.8 8-11V5l-8-3zm0 2.2 6 2.25V11c0 4.1-2.6 7.7-6 9-3.4-1.3-6-4.9-6-9V6.45L12 4.2z"/>',
    alert:    '<path d="M12 2 1 21h22L12 2zm0 4 8.3 14.3H3.7L12 6zm-1 5v5h2v-5h-2zm0 6.5v2h2v-2h-2z"/>',
    check:    '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
    lock:     '<path d="M7 10V8a5 5 0 1 1 10 0v2h1.5v11.5h-13V10H7zm2 0h6V8a3 3 0 0 0-6 0v2z"/>',
    person:   '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0H5z"/>',
    building: '<path d="M4 21V5l8-3 8 3v16h-6v-4h-4v4H4zm3-3h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V8H7v2zm4 4h2v-2h-2v2zm0-4h2V8h-2v2zm4 8h2v-2h-2v2zm0-4h2v-2h-2v2zm0-4h2V8h-2v2z"/>',
    globe:    '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.8a14 14 0 0 0-1.3-3 8 8 0 0 1 4.1 3zM12 4c.7 0 1.6 1.3 2.1 4h-4.2c.5-2.7 1.4-4 2.1-4zM4.3 14a8 8 0 0 1 0-4h3a18 18 0 0 0 0 4h-3zm.8 2h2.8a14 14 0 0 0 1.3 3 8 8 0 0 1-4.1-3zM7.3 8H4.5a8 8 0 0 1 4.1-3 14 14 0 0 0-1.3 3zM12 20c-.7 0-1.6-1.3-2.1-4h4.2c-.5 2.7-1.4 4-2.1 4zm-2.4-6a16 16 0 0 1 0-4h4.8a16 16 0 0 1 0 4H9.6zm5.2 5a14 14 0 0 0 1.3-3h2.8a8 8 0 0 1-4.1 3zm1.9-5a18 18 0 0 0 0-4h3a8 8 0 0 1 0 4h-3z"/>',
    laptop:   '<path d="M4 6h16v10H4V6zm0 11h16l2 2v1H2v-1l2-2zm2-9v8h12V8H6z"/>',
    bars:     '<path d="M3 21V11h4v10H3zm7 0V3h4v18h-4zm7 0v-7h4v7h-4z"/>',
    info:     '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 4v2h2V8h-2zm0 4v6h2v-6h-2z"/>',
    chevron:  '<path d="M9 6 7.6 7.4 12.2 12l-4.6 4.6L9 18l6-6z"/>'
  };

  function icon(name, opts) {
    opts = opts || {};
    const size = opts.size || 14;
    const cls = opts.className ? ` ${opts.className}` : '';
    const path = ICONS[name] || '';
    return `<svg class="ico${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${path}</svg>`;
  }

  // ----- mapas de apresentação -----

  const TYPE_CLASS = {
    LOGIN_SUCCESS:    'evt-ok',
    ACCESS_GRANTED:   'evt-ok',
    LOGIN_FAILURE:    'evt-fail',
    ACCESS_DENIED:    'evt-fail',
    SENSITIVE_ACTION: 'evt-warn',
    LOGOUT:           'evt-neutral'
  };

  const TYPE_LABEL_PT = {
    LOGIN_SUCCESS:    'Login ok',
    LOGIN_FAILURE:    'Falha de login',
    LOGOUT:           'Logout',
    ACCESS_GRANTED:   'Acesso concedido',
    ACCESS_DENIED:    'Acesso negado',
    SENSITIVE_ACTION: 'Ação sensível'
  };

  // ícone por tipo de evento (login = lock/person, ação sensível = alerta, resto neutro)
  const TYPE_ICON = {
    LOGIN_SUCCESS:    'lock',
    LOGIN_FAILURE:    'lock',
    LOGOUT:           'person',
    ACCESS_GRANTED:   'check',
    ACCESS_DENIED:    'alert',
    SENSITIVE_ACTION: 'alert'
  };

  const SOURCE_LABEL_PT = {
    APP:         'App',
    ADMIN_PANEL: 'Admin',
    FINANCIAL:   'Financeiro'
  };

  // ícone por fonte (FINANCIAL = prédio, conforme briefing)
  const SOURCE_ICON = {
    APP:         'laptop',
    ADMIN_PANEL: 'shield',
    FINANCIAL:   'building'
  };

  function severityOf(alertType) {
    if (alertType === 'BRUTE_FORCE_LOGIN') return 'HIGH';
    return 'MEDIUM';
  }

  function alertLabel(alertType) {
    if (alertType === 'BRUTE_FORCE_LOGIN') return 'Brute force em login';
    return alertType || '';
  }

  // explicações em linguagem simples; "o que é" + "o que fazer"
  const ALERT_EXPL = {
    BRUTE_FORCE_LOGIN: {
      what: 'Várias senhas erradas do mesmo IP em pouco tempo, possível ataque de força bruta tentando adivinhar credenciais.',
      action: 'Revisar ou bloquear o IP de origem, checar se alguma conta legítima foi comprometida e considerar exigir CAPTCHA ou MFA.'
    }
  };
  const ALERT_EXPL_DEFAULT = {
    what: 'A detecção identificou um padrão suspeito conforme as regras configuradas.',
    action: 'Revisar o IP, o usuário e o contexto dos eventos relacionados antes de tomar ação.'
  };

  // ============================ STATUS / LIVE ============================

  let liveTimer = null;
  function setLive(ok) {
    const el = $('live');
    el.classList.remove('is-ok', 'is-err');
    el.classList.add(ok ? 'is-ok' : 'is-err');
    $('live-text').textContent = ok ? 'LIVE' : 'OFFLINE';
    $('updated').textContent = 'última: ' + fmtAbs(new Date().toISOString());

    if (ok) {
      el.style.transition = 'none';
      el.style.opacity = '0.6';
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => { el.style.transition = 'opacity .25s'; el.style.opacity = '1'; }, 30);
    }
  }

  // ============================ STATUS GERAL ============================

  function renderOverallStatus(alertCount) {
    const banner = $('overall-status');
    const title = $('status-title');
    const sub = $('status-sub');
    const ico = $('status-icon');
    if (alertCount > 0) {
      banner.classList.remove('status-ok');
      banner.classList.add('status-alert');
      title.textContent = alertCount === 1 ? '1 alerta ativo.' : `${alertCount} alertas ativos.`;
      sub.textContent = 'Atividade suspeita detectada. Confira a seção Alertas abaixo.';
      ico.innerHTML = icon('alert', { size: 18 });
    } else {
      banner.classList.remove('status-alert');
      banner.classList.add('status-ok');
      title.textContent = 'Tudo nominal.';
      sub.textContent = 'Nenhum alerta ativo no momento.';
      ico.innerHTML = icon('check', { size: 18 });
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
      <div class="alert-row">
        <span class="a-ico" aria-hidden="true"></span>
        <span class="sev-pill"></span>
        <span class="a-type"></span>
        <span class="a-ip"></span>
        <span class="a-msg"></span>
        <button type="button" class="a-entender" aria-expanded="false">
          <span class="a-entender-ico" aria-hidden="true"></span>
          <span class="a-entender-txt">entender</span>
        </button>
        <span class="a-meta">
          <span class="occ" title="ocorrências"></span>
          <time class="a-time"></time>
        </span>
      </div>
      <div class="alert-expl" hidden>
        <p class="expl-what"></p>
        <p class="expl-do"><strong>Sugestão:</strong> <span class="expl-do-txt"></span></p>
      </div>`;
    return node;
  }

  function updateAlertNode(node, a) {
    const sev = severityOf(a.alertType);
    node.className = `alert sev-${sev}`;
    const pill = node.querySelector('.sev-pill');
    pill.className = `sev-pill sev-${sev}`;
    pill.textContent = sev;

    node.querySelector('.a-ico').innerHTML = icon('shield', { size: 16 });

    const typeEl = node.querySelector('.a-type');
    typeEl.textContent = alertLabel(a.alertType);
    typeEl.title = a.alertType || '';

    node.querySelector('.a-ip').textContent = a.ip || '';
    node.querySelector('.a-msg').textContent = a.message || '';
    node.querySelector('.a-msg').title = a.message || '';
    node.querySelector('.occ').textContent = `×${a.occurrences ?? 1}`;
    const t = node.querySelector('.a-time');
    t.textContent = fmtRel(a.createdAt);
    t.dateTime = a.createdAt || '';
    t.title = fmtAbs(a.createdAt);

    // botão entender
    const btn = node.querySelector('.a-entender');
    const open = state.expandedAlerts.has(a.id);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.a-entender-ico').innerHTML = icon('info', { size: 12 });
    btn.querySelector('.a-entender-txt').textContent = open ? 'recolher' : 'entender';

    // painel explicativo
    const panel = node.querySelector('.alert-expl');
    const expl = ALERT_EXPL[a.alertType] || ALERT_EXPL_DEFAULT;
    node.querySelector('.expl-what').textContent = expl.what;
    node.querySelector('.expl-do-txt').textContent = expl.action;
    panel.hidden = !open;
  }

  function renderAlerts(list) {
    $('alerts-count').textContent = list.length;
    const container = $('alerts-list');
    const empty = $('alerts-empty');

    if (!list.length) {
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

  function renderBars(targetId, counts, colorFor, labelFor) {
    const target = $(targetId);
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, n]) => s + n, 0);
    if (!entries.length) {
      target.innerHTML = '<div class="muted">sem dados no feed.</div>';
      return;
    }
    target.innerHTML = entries.map(([key, n]) => {
      const pct = total ? (n * 100 / total) : 0;
      const label = labelFor ? labelFor(key) : key;
      return `
        <div class="bar-row">
          <span class="bar-label" title="${escapeHtml(key)}">${escapeHtml(label)}</span>
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
    renderBars('dist-source', bySource, colorForSourceVar, (k) => SOURCE_LABEL_PT[k] || k);
    renderBars('dist-type',   byType,   colorForTypeVar,   (k) => TYPE_LABEL_PT[k]   || k);
  }

  // ============================ GRÁFICO DE ATIVIDADE ============================

  function renderActivityChart(events) {
    const target = $('chart-activity');
    const N = CHART_BUCKETS;
    const bucketMs = CHART_BUCKET_SECONDS * 1000;
    const now = Date.now();
    const windowStart = now - N * bucketMs;
    const buckets = [];
    for (let i = 0; i < N; i++) buckets.push({ total: 0, fails: 0 });

    for (const e of events) {
      const t = new Date(e.occurredAt).getTime();
      if (isNaN(t) || t < windowStart || t > now) continue;
      const ageMs = now - t;
      const idx = N - 1 - Math.floor(ageMs / bucketMs);
      if (idx < 0 || idx >= N) continue;
      buckets[idx].total++;
      if (e.eventType === 'LOGIN_FAILURE' || e.eventType === 'ACCESS_DENIED') {
        buckets[idx].fails++;
      }
    }

    const max = Math.max(1, ...buckets.map((b) => b.total));
    const W = 600, H = 100;
    const padBottom = 14, padTop = 4;
    const usableH = H - padBottom - padTop;
    const gap = 2;
    const barW = (W - gap * (N - 1)) / N;

    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="chart-svg" role="img" aria-label="Atividade por minuto nos últimos ${Math.round(N * CHART_BUCKET_SECONDS / 60)} minutos">`;

    for (let i = 0; i < N; i++) {
      const b = buckets[i];
      const x = i * (barW + gap);
      if (b.total > 0) {
        const totH = (b.total / max) * usableH;
        const totY = padTop + (usableH - totH);
        svg += `<rect x="${x.toFixed(2)}" y="${totY.toFixed(2)}" width="${barW.toFixed(2)}" height="${totH.toFixed(2)}" rx="1" class="bar-total"><title>${b.total} eventos</title></rect>`;
        if (b.fails > 0) {
          const failH = (b.fails / max) * usableH;
          const failY = padTop + (usableH - failH);
          svg += `<rect x="${x.toFixed(2)}" y="${failY.toFixed(2)}" width="${barW.toFixed(2)}" height="${failH.toFixed(2)}" rx="1" class="bar-fail"><title>${b.fails} falhas ou acessos negados</title></rect>`;
        }
      } else {
        svg += `<rect x="${x.toFixed(2)}" y="${(padTop + usableH - 1).toFixed(2)}" width="${barW.toFixed(2)}" height="1" class="bar-empty"></rect>`;
      }
    }

    const totalEvents = buckets.reduce((s, b) => s + b.total, 0);
    const totalFails = buckets.reduce((s, b) => s + b.fails, 0);
    svg += `<text x="0" y="${H - 2}" class="chart-tick">${Math.round(N * CHART_BUCKET_SECONDS / 60)} min atrás</text>`;
    svg += `<text x="${W / 2}" y="${H - 2}" text-anchor="middle" class="chart-tick">${totalEvents} eventos, ${totalFails} falhas</text>`;
    svg += `<text x="${W}" y="${H - 2}" text-anchor="end" class="chart-tick">agora</text>`;
    svg += `</svg>`;

    target.innerHTML = svg;
  }

  // ============================ FRASE DE RESUMO ============================

  function renderActivitySummary(events, alerts) {
    const target = $('activity-summary');
    const now = Date.now();
    const hourAgo = now - 3600 * 1000;

    let fails = 0;
    const ips = new Set();
    for (const e of events) {
      const t = new Date(e.occurredAt).getTime();
      if (isNaN(t) || t < hourAgo) continue;
      if (e.eventType === 'LOGIN_FAILURE' || e.eventType === 'ACCESS_DENIED') {
        fails++;
        if (e.ip) ips.add(e.ip);
      }
    }

    let newAlerts = 0;
    for (const a of alerts) {
      const t = new Date(a.createdAt).getTime();
      if (!isNaN(t) && t >= hourAgo) newAlerts++;
    }

    target.classList.remove('is-hot', 'is-warm');
    if (newAlerts > 0) target.classList.add('is-hot');
    else if (fails > 0) target.classList.add('is-warm');

    if (fails === 0 && newAlerts === 0) {
      target.innerHTML = `<span class="sum-ok">Na última hora: nenhuma falha, nenhum alerta novo.</span> Sistema tranquilo.`;
      return;
    }

    const ipText = ips.size === 1 ? '1 IP distinto' : `${ips.size} IPs distintos`;
    const failText = fails === 1
      ? `<span class="sum-num sum-warn">1</span> falha de <span class="sum-num">${ips.size}</span> ${ips.size === 1 ? 'IP' : 'IPs'}`
      : `<span class="sum-num sum-warn">${fails}</span> falhas de <span class="sum-num">${ips.size}</span> ${ips.size === 1 ? 'IP' : 'IPs'} distintos`;
    const alertText = newAlerts === 0
      ? 'nenhum alerta novo.'
      : (newAlerts === 1
          ? `<span class="sum-num sum-hot">1</span> alerta novo.`
          : `<span class="sum-num sum-hot">${newAlerts}</span> alertas novos.`);

    target.innerHTML = `Na última hora: ${failText}, ${alertText}`;
  }

  // ============================ EVENTOS, grouping + render ============================

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

  function groupConsecutive(events) {
    const groups = [];
    for (const e of events) {
      const last = groups[groups.length - 1];
      if (last
          && last.eventType    === e.eventType
          && last.sourceSystem === e.sourceSystem
          && (last.ip || '')   === (e.ip || '')) {
        last.items.push(e);
      } else {
        groups.push({
          key: e.id,
          eventType: e.eventType,
          sourceSystem: e.sourceSystem,
          ip: e.ip,
          items: [e]
        });
      }
    }
    return groups;
  }

  function buildTypeTagHtml(eventType) {
    const cls = TYPE_CLASS[eventType] || 'evt-neutral';
    const label = TYPE_LABEL_PT[eventType] || (eventType || '');
    const iconName = TYPE_ICON[eventType];
    const ico = iconName ? `<span class="tag-ico">${icon(iconName, { size: 11 })}</span>` : '';
    const code = eventType ? `<span class="tag-code">${escapeHtml(eventType)}</span>` : '';
    return `<span class="tag ${cls}" title="${escapeHtml(eventType || '')}">${ico}${escapeHtml(label)}${code}</span>`;
  }

  function buildSourceBadgeHtml(src) {
    const label = SOURCE_LABEL_PT[src] || (src || '');
    const cls = src ? `src-${src}` : '';
    const iconName = SOURCE_ICON[src];
    const ico = iconName ? `<span class="src-ico">${icon(iconName, { size: 11 })}</span>` : '';
    return `<span class="src ${cls}" title="${escapeHtml(src || '')}">${ico}${escapeHtml(label)}</span>`;
  }

  function buildGeoHtml(e) {
    if (isUnknown(e.country) && isUnknown(e.city)) {
      return `<span class="cell-dim" title="sem geolocalização">n/d</span>`;
    }
    const c = isUnknown(e.country) ? 'n/d' : e.country;
    const ci = isUnknown(e.city) ? 'n/d' : e.city;
    return `${escapeHtml(c)} · ${escapeHtml(ci)}`;
  }

  function buildEventRowHtml(e) {
    const isFail = e.eventType === 'LOGIN_FAILURE' || e.eventType === 'ACCESS_DENIED';
    return {
      rowClass: isFail ? 'row-fail' : '',
      cells: `
        <td class="cell-time"><time class="t-rel" datetime="${escapeHtml(e.occurredAt || '')}" title="${escapeHtml(fmtAbs(e.occurredAt))}">${escapeHtml(fmtRel(e.occurredAt))}</time></td>
        <td>${buildTypeTagHtml(e.eventType)}</td>
        <td>${buildSourceBadgeHtml(e.sourceSystem)}</td>
        <td class="${e.username ? '' : 'cell-dim'}">${escapeHtml(e.username || '.')}</td>
        <td class="cell-mono">${escapeHtml(e.ip || '.')}</td>
        <td>${buildGeoHtml(e)}</td>
        <td class="cell-details" title="${escapeHtml(e.details || '')}">${escapeHtml(e.details || '.')}</td>`
    };
  }

  function buildGroupRowHtml(g) {
    const newest = g.items[0];
    const oldest = g.items[g.items.length - 1];
    const isFail = g.eventType === 'LOGIN_FAILURE' || g.eventType === 'ACCESS_DENIED';
    const open = state.expandedGroups.has(g.key);
    const count = g.items.length;
    const titleHint = `${count} eventos idênticos consecutivos, clique pra expandir.`;
    const rangeTip = `do mais antigo ao mais recente: ${fmtAbs(oldest.occurredAt)} até ${fmtAbs(newest.occurredAt)}`;
    return {
      rowClass: `row-group ${isFail ? 'row-fail' : ''} ${open ? 'is-open' : ''}`,
      cells: `
        <td class="cell-time" title="${escapeHtml(rangeTip)}">
          <span class="group-caret" aria-hidden="true">▶</span>
          <time class="t-rel" datetime="${escapeHtml(newest.occurredAt || '')}" title="${escapeHtml(fmtAbs(newest.occurredAt))}">${escapeHtml(fmtRel(newest.occurredAt))}</time>
        </td>
        <td>
          <span class="group-count" title="${escapeHtml(titleHint)}">${count}×</span>
          ${buildTypeTagHtml(g.eventType)}
        </td>
        <td>${buildSourceBadgeHtml(g.sourceSystem)}</td>
        <td class="cell-dim">vários</td>
        <td class="cell-mono">${escapeHtml(g.ip || '.')}</td>
        <td>${buildGeoHtml(newest)}</td>
        <td class="cell-details cell-dim">${count} ocorrências consecutivas, clique pra expandir.</td>`
    };
  }

  function makeTr(rowClass, html) {
    const tr = document.createElement('tr');
    if (rowClass) tr.className = rowClass;
    tr.innerHTML = html;
    return tr;
  }

  function renderEvents() {
    // filtra sobre os 300, mas só renderiza os TABLE_LIMIT mais recentes
    const matched = applyFilters(state.rawEvents);
    const filtered = matched.slice(0, TABLE_LIMIT);
    const tally = matched.length > filtered.length
      ? `${filtered.length} de ${matched.length}`
      : String(filtered.length);
    $('events-count').textContent = tally;

    const tbody = document.querySelector('#events-table tbody');
    const wrap = $('events-wrap');
    const empty = $('events-empty');
    const savedScroll = wrap.scrollTop;

    if (!filtered.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
      const hasFilter = state.filters.type || state.filters.query
        || state.filters.sources.size < 3;
      empty.textContent = hasFilter ? 'Nenhum evento corresponde aos filtros.' : 'Sem eventos ainda.';
      return;
    }
    empty.hidden = true;

    const groups = groupConsecutive(filtered);
    const frag = document.createDocumentFragment();

    for (const g of groups) {
      if (g.items.length === 1) {
        const built = buildEventRowHtml(g.items[0]);
        frag.appendChild(makeTr(built.rowClass, built.cells));
      } else {
        const built = buildGroupRowHtml(g);
        const headerTr = makeTr(built.rowClass, built.cells);
        headerTr.dataset.groupKey = String(g.key);
        frag.appendChild(headerTr);
        if (state.expandedGroups.has(g.key)) {
          for (const e of g.items) {
            const childBuilt = buildEventRowHtml(e);
            const childTr = makeTr(`row-child ${childBuilt.rowClass}`, childBuilt.cells);
            frag.appendChild(childTr);
          }
        }
      }
    }

    tbody.innerHTML = '';
    tbody.appendChild(frag);
    wrap.scrollTop = savedScroll;
  }

  // ============================ AGREGAÇÕES (Por sistema, Top IPs, Resumo de alertas, Taxa de login) ============================

  // Heurística: alertas não têm sourceSystem no schema, então inferimos pela
  // fonte mais frequente do IP nos eventos da janela. Alertas cujo IP não
  // aparece nos eventos recentes ficam fora da contagem por fonte.
  function inferIpToSource(events) {
    const counts = {};
    for (const e of events) {
      if (!e.ip) continue;
      const m = counts[e.ip] || (counts[e.ip] = {});
      m[e.sourceSystem] = (m[e.sourceSystem] || 0) + 1;
    }
    const ipToSource = {};
    for (const ip in counts) {
      let best = null, bestN = 0;
      for (const s in counts[ip]) {
        if (counts[ip][s] > bestN) { best = s; bestN = counts[ip][s]; }
      }
      ipToSource[ip] = best;
    }
    return ipToSource;
  }

  function renderBySource(events, alerts) {
    const target = $('by-source');
    const SOURCES = ['APP', 'ADMIN_PANEL', 'FINANCIAL'];
    const ipToSource = inferIpToSource(events);

    // contagens por fonte
    const per = {};
    for (const s of SOURCES) per[s] = { total: 0, fails: 0, alerts: 0, unmappedAlerts: 0 };
    for (const e of events) {
      const s = e.sourceSystem;
      if (!per[s]) continue;
      per[s].total++;
      if (e.eventType === 'LOGIN_FAILURE') per[s].fails++;
    }
    for (const a of alerts) {
      const s = ipToSource[a.ip];
      if (s && per[s]) per[s].alerts++;
    }

    // pior fonte: por (alerts + fails). Sem nada, ninguém é "pior".
    let worst = null, worstScore = 0;
    for (const s of SOURCES) {
      const score = per[s].alerts * 10 + per[s].fails;
      if (score > worstScore) { worst = s; worstScore = score; }
    }

    target.innerHTML = SOURCES.map((s) => {
      const m = per[s];
      const isWorst = s === worst && worstScore > 0;
      const failsHot = m.fails > 0 ? 'is-warm' : '';
      const alertsHot = m.alerts > 0 ? 'is-hot' : '';
      const iconName = SOURCE_ICON[s] || 'laptop';
      const label = SOURCE_LABEL_PT[s] || s;
      return `
        <article class="source-card src-${s} ${isWorst ? 'is-worst' : ''}" title="${escapeHtml(s)}; ${m.total} eventos, ${m.fails} falhas, ${m.alerts} alertas na janela.">
          ${isWorst ? '<span class="worst-mark">sob ataque</span>' : ''}
          <div class="source-card-head">
            <span class="src-card-ico">${icon(iconName, { size: 14 })}</span>
            <span class="source-card-name">${escapeHtml(label)}</span>
            <span class="source-card-code">${escapeHtml(s)}</span>
          </div>
          <div class="source-card-metrics">
            <div class="src-metric">
              <span class="src-metric-num">${m.total}</span>
              <span class="src-metric-label">EVENTOS</span>
            </div>
            <div class="src-metric ${failsHot}">
              <span class="src-metric-num">${m.fails}</span>
              <span class="src-metric-label">FALHAS</span>
            </div>
            <div class="src-metric ${alertsHot}">
              <span class="src-metric-num">${m.alerts}</span>
              <span class="src-metric-label">ALERTAS</span>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function renderLoginRate(events) {
    const target = $('login-rate-body');
    let ok = 0, fail = 0;
    for (const e of events) {
      if (e.eventType === 'LOGIN_SUCCESS') ok++;
      else if (e.eventType === 'LOGIN_FAILURE') fail++;
    }
    const total = ok + fail;
    if (total === 0) {
      target.innerHTML = '<div class="muted">sem dados de login na janela.</div>';
      return;
    }
    const pctOk = (ok * 100) / total;
    const pctFail = 100 - pctOk;
    target.innerHTML = `
      <div class="rate-line">
        <span class="rate-side rate-ok"><span class="rate-num">${ok}</span><span class="rate-label">ok</span></span>
        <span class="rate-side rate-fail"><span class="rate-num">${fail}</span><span class="rate-label">falhas</span></span>
      </div>
      <div class="rate-bar" role="img" aria-label="${pctOk.toFixed(1)}% sucesso, ${pctFail.toFixed(1)}% falha">
        <span class="rate-fill-ok"   style="width:${pctOk.toFixed(2)}%"></span>
        <span class="rate-fill-fail" style="width:${pctFail.toFixed(2)}%"></span>
      </div>
      <div class="rate-pct">
        <span class="pct-ok">${pctOk.toFixed(1)}% sucesso</span>
        <span class="pct-fail">${pctFail.toFixed(1)}% falha</span>
      </div>`;
  }

  function renderAlertSummary(alerts) {
    const target = $('alert-summary-body');
    if (!alerts.length) {
      target.innerHTML = '<div class="muted">nenhum alerta no momento.</div>';
      return;
    }
    // agrega por (tipo, severidade)
    const buckets = {};
    for (const a of alerts) {
      const sev = severityOf(a.alertType);
      const k = `${a.alertType}::${sev}`;
      buckets[k] = (buckets[k] || 0) + 1;
    }
    const rows = Object.entries(buckets).map(([k, n]) => {
      const [type, sev] = k.split('::');
      return { type, sev, n, label: alertLabel(type) };
    }).sort((a, b) => b.n - a.n);

    // se todos da mesma severidade, sufixa "todos SEV"
    const uniqueSev = new Set(rows.map((r) => r.sev));
    const tail = uniqueSev.size === 1 ? `todos ${[...uniqueSev][0]}.` : '';

    target.innerHTML = `
      <div class="alert-sum-list">
        ${rows.map((r) => `
          <div class="alert-sum-row">
            <span class="sum-count">${r.n}×</span>
            <span class="sum-label">${escapeHtml(r.label)}</span>
            <span class="sev-pill sev-${r.sev}">${escapeHtml(r.sev)}</span>
          </div>`).join('')}
      </div>
      ${tail ? `<div class="alert-sum-tail">${escapeHtml(tail)}</div>` : ''}`;
  }

  function renderTopIps(events, alerts) {
    const target = $('top-ips');
    const alertIps = new Set();
    for (const a of alerts) if (a.ip) alertIps.add(a.ip);

    const byIp = {};
    for (const e of events) {
      if (e.eventType !== 'LOGIN_FAILURE' || !e.ip) continue;
      const o = byIp[e.ip] || (byIp[e.ip] = { ip: e.ip, fails: 0, sources: {} });
      o.fails++;
      o.sources[e.sourceSystem] = (o.sources[e.sourceSystem] || 0) + 1;
    }
    const list = Object.values(byIp).map((o) => {
      let bestSrc = null, bestN = 0;
      for (const s in o.sources) if (o.sources[s] > bestN) { bestSrc = s; bestN = o.sources[s]; }
      return { ip: o.ip, fails: o.fails, source: bestSrc, hasAlert: alertIps.has(o.ip) };
    }).sort((a, b) => b.fails - a.fails).slice(0, TOP_IPS_LIMIT);

    if (!list.length) {
      target.innerHTML = '<li class="top-ips-empty">Nenhuma falha de login na janela atual.</li>';
      return;
    }

    target.innerHTML = list.map((o, i) => `
      <li class="${o.hasAlert ? 'has-alert' : ''}">
        <span class="rank">${i + 1}</span>
        <span class="ip" title="${escapeHtml(o.ip)}">${escapeHtml(o.ip)}</span>
        ${buildSourceBadgeHtml(o.source)}
        <span class="fails" title="falhas de login na janela atual">${o.fails} falha${o.fails === 1 ? '' : 's'}</span>
        ${o.hasAlert
          ? `<span class="alert-mark" title="este IP já gerou alerta">${icon('alert', { size: 11 })}alerta</span>`
          : `<span class="no-alert">sem alerta</span>`}
      </li>`).join('');
  }

  // ============================ ÍCONES ESTÁTICOS (renderizados uma vez no boot) ============================

  function renderStaticIcons() {
    $('ico-alerts').innerHTML = icon('shield', { size: 16 });
    $('th-geo').innerHTML = icon('globe', { size: 12 });
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
      state.rawAlerts = alerts;
      renderStats(stats);
      renderOverallStatus(Array.isArray(alerts) ? alerts.length : 0);
      renderBySource(events, alerts);
      renderLoginRate(events);
      renderAlertSummary(alerts);
      renderActivitySummary(events, alerts);
      renderAlerts(alerts);
      renderEvents();
      renderActivityChart(events);
      renderDistribution(events);
      renderTopIps(events, alerts);
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

  function bindGroupToggle() {
    const tbody = document.querySelector('#events-table tbody');
    tbody.addEventListener('click', (ev) => {
      const tr = ev.target.closest('tr.row-group');
      if (!tr) return;
      const key = Number(tr.dataset.groupKey);
      if (Number.isNaN(key)) return;
      if (state.expandedGroups.has(key)) state.expandedGroups.delete(key);
      else state.expandedGroups.add(key);
      renderEvents();
    });
  }

  function bindAlertExpand() {
    $('alerts-list').addEventListener('click', (ev) => {
      const btn = ev.target.closest('.a-entender');
      if (!btn) return;
      const article = btn.closest('article.alert');
      if (!article) return;
      const id = Number(article.dataset.id);
      if (Number.isNaN(id)) return;
      if (state.expandedAlerts.has(id)) state.expandedAlerts.delete(id);
      else state.expandedAlerts.add(id);
      // re-render só esse alerta
      const a = state.rawAlerts.find((x) => x.id === id);
      if (a) updateAlertNode(article, a);
    });
  }

  // ============================ BOOT ============================

  renderStaticIcons();
  bindFilters();
  bindGroupToggle();
  bindAlertExpand();
  refresh();
  setInterval(refresh, POLL_MS);

  // recalcula tempos relativos a cada 30s mesmo sem novo fetch
  setInterval(() => {
    document.querySelectorAll('time.t-rel, time.a-time').forEach((t) => {
      if (t.dateTime) t.textContent = fmtRel(t.dateTime);
    });
  }, 30000);
})();
