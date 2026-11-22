const $ = s => document.querySelector(s);
const load = k => JSON.parse(localStorage.getItem(k) || '[]');
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const ico = id => `<svg width="22" height="22"><use href="#i-${id}"/></svg>`;

// Endpoint opcional: si se define, envía ahí; si no, usa endpoint de prueba
const CUSTOM_ENDPOINT = (window.SPORTSCHOOL_API_URL || localStorage.getItem('ss_api_url') || '').trim();
const DEMO_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';

let students = load('ss_students');
let acts = load('ss_acts');

// Splash animado con progreso y salvavidas
function hideSplash() {
  const s = $('#splash');
  if (s) s.classList.add('hide');
  setTimeout(() => document.body.classList.remove('loading'), 900);
}
setTimeout(hideSplash, 5000);

try {
  (() => {
    $('#splash-title').innerHTML = [...'SportSchool']
      .map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');
    const bar = $('#sp-bar'), txt = $('#sp-txt'), pct = $('#sp-pct');
    const t0 = performance.now(), DUR = 2400;
    let loaded = document.readyState === 'complete';
    addEventListener('load', () => { loaded = true; });

    const step = now => {
      const p = Math.min(1, (now - t0) / DUR);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(e * 100);
      bar.style.transform = `scaleX(${e})`;
      pct.textContent = v + '%';
      txt.textContent = v < 40 ? 'Preparando recursos'
        : v < 80 ? 'Cargando tus datos'
        : v < 100 ? 'Casi listo' : 'Listo';
      if (p < 1 || !loaded) return requestAnimationFrame(step);
      setTimeout(hideSplash, 250);
    };
    requestAnimationFrame(step);
  })();
} catch (e) {
  hideSplash();
}

// Navegación entre vistas
function go(view) {
  document.querySelectorAll('.nav button').forEach(b => {
    const on = b.dataset.view === view;
    b.classList.toggle('active', on);
    on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === view));
  scrollTo({ top: 0 });
}
document.querySelectorAll('.nav button').forEach(b => { b.onclick = () => go(b.dataset.view); });
document.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });

// Toast
let tt;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(tt);
  tt = setTimeout(() => t.classList.remove('show'), 2600);
}

// Estado de conexión
function net() {
  const on = navigator.onLine;
  const el = $('#net');
  if (!el) return;
  el.textContent = on ? 'En línea' : 'Sin conexión';
  el.classList.toggle('off', !on);
}
addEventListener('online', net);
addEventListener('offline', net);
net();

// Renderizado dinámico (CSR)
const initials = n => n.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'SS';
const empty = t => `<li class="empty">${t}</li>`;

function render() {
  const nameOf = id => (students.find(s => String(s.id) === String(id)) || {}).nombre || 'Estudiante';
  const opts = students.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('');
  if ($('#sel-est')) {
    $('#sel-est').innerHTML = opts || '<option value="">Primero registra un estudiante</option>';
  }

  const keep = (sel, v) => {
    const el = $(sel);
    if (!el) return;
    el.innerHTML = '<option value="all">Todos los estudiantes</option>' + opts;
    el.value = v && [...el.options].some(o => o.value === v) ? v : 'all';
  };
  keep('#sel-hist', $('#sel-hist')?.value);
  keep('#sel-desp', $('#sel-desp')?.value);

  if ($('#l-est')) {
    $('#l-est').innerHTML = students.length
      ? students.map(s => `
          <li class="item">
            <div class="avatar">${esc(initials(s.nombre))}</div>
            <div><b>${esc(s.nombre)}</b><small>Grupo ${esc(s.grupo)}</small></div>
            <div class="meta"><span class="chip">${esc(s.disciplina)}</span></div>
          </li>`).join('')
      : empty('Aún no hay estudiantes. Agrega el primero.');
  }

  const totMin = acts.reduce((t, a) => t + (Number(a.min) || 0), 0);
  const totKm = acts.reduce((t, a) => t + (Number(a.km) || 0), 0);
  if ($('#h-est')) $('#h-est').textContent = students.length;
  if ($('#h-act')) $('#h-act').textContent = acts.length;
  if ($('#h-min')) $('#h-min').textContent = totMin;
  if ($('#h-km')) $('#h-km').textContent = totKm.toFixed(1);

  const filt = id => (!id || id === 'all') ? acts : acts.filter(a => String(a.est) === String(id));
  const hist = filt($('#sel-hist')?.value).slice().sort((a, b) =>
    String(b.fecha || '').localeCompare(String(a.fecha || '')) || (b.id - a.id)
  );

  if ($('#l-hist')) {
    $('#l-hist').innerHTML = hist.length
      ? hist.map(a => `
          <li class="item">
            <div class="ico">${ico('run')}</div>
            <div>
              <b>${esc(a.actividad)}</b>
              <small>${esc(a.fecha)} · ${esc(nameOf(a.est))}${a.geo ? ` · ${Number(a.geo.lat).toFixed(3)}, ${Number(a.geo.lon).toFixed(3)}` : ''}</small>
              ${a.obs ? `<p>${esc(a.obs)}</p>` : ''}
            </div>
            <div class="meta">
              <span class="chip">${Number(a.min) || 0} min</span>
              <span class="chip green">${Number(a.km) || 0} km</span>
            </div>
          </li>`).join('')
      : empty('Sin actividades registradas.');
  }

  const r = filt($('#sel-desp')?.value);
  if ($('#d-n')) $('#d-n').textContent = r.length;
  if ($('#d-min')) $('#d-min').textContent = r.reduce((t, a) => t + (Number(a.min) || 0), 0);
  if ($('#d-km')) $('#d-km').textContent = r.reduce((t, a) => t + (Number(a.km) || 0), 0).toFixed(2);

  const per = students.map(s => ({
    n: s.nombre,
    m: acts.filter(a => String(a.est) === String(s.id)).reduce((t, a) => t + (Number(a.min) || 0), 0)
  }));
  const max = Math.max(1, ...per.map(p => p.m));
  if ($('#bars')) {
    $('#bars').innerHTML = per.length
      ? per.map(p => `
          <li>
            <div class="top-row"><span>${esc(p.n)}</span><span>${p.m} min</span></div>
            <div class="track"><div class="fill" style="width:${(p.m / max * 100).toFixed(0)}%"></div></div>
          </li>`).join('')
      : empty('Registra estudiantes para ver comparativas.');
  }
}

if ($('#sel-hist')) $('#sel-hist').onchange = render;
if ($('#sel-desp')) $('#sel-desp').onchange = render;

// Registro de estudiantes
if ($('#f-est')) {
  $('#f-est').onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nombre = String(f.get('nombre') || '').trim();
    const grupo = String(f.get('grupo') || '').trim();
    const disciplina = String(f.get('disciplina') || '').trim();
    if (!nombre || !grupo || !disciplina) return toast('Completa todos los campos del estudiante');

    students.push({ id: Date.now(), nombre, grupo, disciplina });
    save('ss_students', students);
    e.target.reset();
    render();
    toast('Estudiante guardado');
  };
}

// Geolocalización opcional
const getPos = () => new Promise(res => {
  if (!('geolocation' in navigator)) return res(null);
  navigator.geolocation.getCurrentPosition(
    p => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
    () => res(null),
    { timeout: 8000, enableHighAccuracy: false }
  );
});

// Registro de actividad deportiva
if ($('#f-act')) {
  $('#f-act').onsubmit = async e => {
    e.preventDefault();
    const form = e.target, f = new FormData(form);
    const est = f.get('est');
    if (!est) return toast('Primero registra un estudiante');

    const wantsGeo = Boolean(f.get('geo'));
    const geo = wantsGeo ? await getPos() : null;

    const a = {
      id: Date.now(),
      est,
      fecha: String(f.get('fecha') || new Date().toISOString().slice(0, 10)),
      actividad: String(f.get('actividad') || '').trim(),
      min: Math.max(0, Number(f.get('min')) || 0),
      km: Math.max(0, Number(f.get('km')) || 0),
      obs: String(f.get('obs') || '').trim(),
      geo
    };

    acts.push(a);
    save('ss_acts', acts);
    form.reset();
    render();

    const msg = 'Actividad guardada' + (wantsGeo && !geo ? ' (sin ubicación)' : '');
    if ($('#msg-act')) $('#msg-act').textContent = msg;
    toast('Actividad guardada');
    notify('SportSchool', `Actividad "${a.actividad}" registrada (${a.min} min, ${a.km} km)`);
  };
}

// Notificación local de confirmación
async function notify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, { body, icon: 'icons/icon-192.png' });
        return;
      }
    }
    new Notification(title, { body, icon: 'icons/icon-192.png' });
  } catch (_) {}
}

if ($('#btn-notif')) {
  $('#btn-notif').onclick = async () => {
    if (!('Notification' in window)) return toast('Tu navegador no soporta notificaciones');
    const perm = await Notification.requestPermission();
    toast('Permiso de notificaciones: ' + perm);
  };
}

// Fetch API (endpoint configurado o demostración documentada)
if ($('#btn-fetch')) {
  $('#btn-fetch').onclick = async () => {
    const out = $('#fetchOut');
    if (!out) return;

    const targetUrl = CUSTOM_ENDPOINT || DEMO_ENDPOINT;
    const isDemo = !CUSTOM_ENDPOINT;

    const payload = {
      app: 'SportSchool',
      timestamp: new Date().toISOString(),
      estudiantes: students.length,
      actividades: acts.length,
      resumenMinutos: acts.reduce((t, a) => t + (Number(a.min) || 0), 0),
      resumenKm: Number(acts.reduce((t, a) => t + (Number(a.km) || 0), 0).toFixed(2))
    };

    out.textContent = `Enviando petición POST a ${targetUrl}…`;

    try {
      const r = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const ct = r.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await r.json() : await r.text();
      const formatted = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

      out.textContent =
        `HTTP ${r.status}\n` +
        formatted +
        (isDemo ? '\n(Solicitud Fetch demostrativa: no se realizó sincronización real con servidor institucional)' : '');
      toast(r.ok ? 'Petición Fetch completada' : `Respuesta HTTP ${r.status}`);
    } catch (_) {
      out.textContent =
        `Sin conexión o endpoint no alcanzable (${targetUrl}).\n` +
        `Datos locales intactos: ${students.length} estudiantes y ${acts.length} actividades en localStorage.`;
      toast('Sin conexión: datos locales conservados');
    }
  };
}

// Service Worker
if ('serviceWorker' in navigator) {
  const had = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (had && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {});
  });
}

render();