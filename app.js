const form = document.getElementById('config-form');
const statusEl = document.getElementById('status');
const metricsEl = document.getElementById('metrics');
const chartsEl = document.getElementById('charts');

const DEFAULT_CHANNEL_ID = '3269359';

let refreshTimer;
let chartRegistry = [];

const palette = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#7c3aed', '#0891b2', '#4f46e5', '#db2777'];

function setStatus(message, variant = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${variant}`.trim();
}

function normalizeChannelId(rawValue) {
  const value = rawValue.trim();

  if (/^\d+$/.test(value)) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const match = parsed.pathname.match(/\/channels\/(\d+)/);
    return match?.[1] || '';
  } catch {
    return '';
  }
}

function buildUrl({ channelId, readKey, results }) {
  const url = new URL(`https://api.thingspeak.com/channels/${channelId}/feeds.json`);
  if (readKey) {
    url.searchParams.set('api_key', readKey);
  }
  url.searchParams.set('results', String(results));
  return url;
}

function fieldEntries(channel) {
  return Array.from({ length: 8 }, (_, i) => {
    const key = `field${i + 1}`;
    return [key, channel[key]];
  }).filter(([, label]) => Boolean(label));
}

function renderMetrics(entries, feeds) {
  metricsEl.innerHTML = '';
  const latest = feeds.at(-1) ?? {};

  entries.forEach(([fieldKey, label]) => {
    const value = latest[fieldKey] ?? 'Sin dato';
    const card = document.createElement('article');
    card.className = 'metric';
    card.innerHTML = `
      <small>${label}</small>
      <strong>${value}</strong>
    `;
    metricsEl.appendChild(card);
  });
}

function destroyCharts() {
  chartRegistry.forEach((chart) => chart.destroy());
  chartRegistry = [];
}

function renderCharts(entries, feeds) {
  destroyCharts();
  chartsEl.innerHTML = '';
  const labels = feeds.map((feed) => new Date(feed.created_at).toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }));

  entries.forEach(([fieldKey, label], index) => {
    const wrapper = document.createElement('article');
    wrapper.className = 'chart-card';

    const title = document.createElement('h3');
    title.textContent = label;

    const canvas = document.createElement('canvas');
    wrapper.append(title, canvas);
    chartsEl.appendChild(wrapper);

    const points = feeds.map((feed) => {
      const value = Number.parseFloat(feed[fieldKey]);
      return Number.isFinite(value) ? value : null;
    });

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label,
          data: points,
          borderColor: palette[index % palette.length],
          backgroundColor: `${palette[index % palette.length]}33`,
          tension: 0.25,
          fill: true,
          spanGaps: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
      },
    });

    chartRegistry.push(chart);
  });
}

async function loadData(config) {
  try {
    const url = buildUrl(config);
    setStatus('Consultando datos en ThingSpeak...');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const payload = await response.json();
    const entries = fieldEntries(payload.channel || {});
    const feeds = payload.feeds || [];

    if (!entries.length || !feeds.length) {
      throw new Error('No se encontraron datos para este canal.');
    }

    renderMetrics(entries, feeds);
    renderCharts(entries, feeds);
    setStatus(`Canal ${config.channelId} actualizado: ${new Date().toLocaleTimeString('es-CO')}`, 'success');
  } catch (error) {
    setStatus(`No se pudo cargar información. ${error.message}`, 'error');
  }
}

function startRealtime(config) {
  clearInterval(refreshTimer);
  loadData(config);
  refreshTimer = setInterval(() => loadData(config), config.refreshInterval * 1000);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  const normalizedChannelId = normalizeChannelId(formData.get('channelId')?.toString() || '');
  const config = {
    channelId: normalizedChannelId,
    readKey: formData.get('readKey')?.toString().trim(),
    results: Number.parseInt(formData.get('results'), 10) || 40,
    refreshInterval: Number.parseInt(formData.get('refreshInterval'), 10) || 15,
  };

  if (!config.channelId) {
    setStatus('Debes ingresar un Channel ID válido o una URL de canal válida.', 'error');
    return;
  }

  document.getElementById('channel-id').value = config.channelId;
  startRealtime(config);
});

startRealtime({
  channelId: DEFAULT_CHANNEL_ID,
  readKey: '',
  results: 40,
  refreshInterval: 15,
});
