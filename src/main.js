import './styles.css';

const STORAGE_KEY = 'lenticelosis-evaluaciones-v1';
const quadrants = [1, 2, 3];
let evaluations = loadEvaluations();

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">Palta · Lenticelosis</p>
      <h1>Evaluacion de frutos</h1>
      <p class="subtitle">Registra 3 cuadrantes de 3x3 y calcula el grado de dano automaticamente.</p>
    </div>
    <span id="connectionStatus" class="status-pill">Comprobando...</span>
  </header>

  <main class="app-layout">
    <section class="panel form-panel" aria-labelledby="formTitle">
      <div class="section-heading">
        <h2 id="formTitle">Nueva evaluacion</h2>
        <button id="clearFormButton" class="ghost-button" type="button">Limpiar</button>
      </div>

      <form id="evaluationForm" class="evaluation-form">
        <div class="field-grid">
          <label>
            Codigo del fruto
            <input id="fruitCode" name="fruitCode" type="text" placeholder="Ej. Lote1-001" autocomplete="off" />
          </label>
          <label>
            Variedad
            <input id="variety" name="variety" type="text" placeholder="Ej. Hass" autocomplete="off" />
          </label>
          <label>
            Lote / muestra
            <input id="batch" name="batch" type="text" placeholder="Ej. Campo A" autocomplete="off" />
          </label>
          <label>
            Fecha
            <input id="date" name="date" type="date" required />
          </label>
        </div>

        <div id="quadrantList" class="quadrant-list"></div>

        <section class="result-box" aria-live="polite">
          <div>
            <span>Resultado final</span>
            <strong id="finalDamage">0.00%</strong>
          </div>
          <div>
            <span>Clasificacion</span>
            <strong id="finalGrade">Grado 0</strong>
          </div>
        </section>

        <label class="notes-label">
          Observaciones
          <textarea id="notes" name="notes" rows="3" placeholder="Notas de campo, condicion del fruto o comentarios"></textarea>
        </label>

        <button class="primary-button" type="submit">Guardar evaluacion</button>
      </form>
    </section>

    <section class="panel history-panel" aria-labelledby="historyTitle">
      <div class="section-heading stacked-mobile">
        <div>
          <h2 id="historyTitle">Evaluaciones guardadas</h2>
          <p id="summaryText" class="muted">Sin registros todavia.</p>
        </div>
        <div class="button-row">
          <button id="exportButton" class="secondary-button" type="button">Exportar CSV</button>
          <button id="deleteAllButton" class="danger-button" type="button">Borrar todo</button>
        </div>
      </div>
      <div id="evaluationList" class="evaluation-list"></div>
    </section>
  </main>
`;

const form = document.querySelector('#evaluationForm');
const quadrantList = document.querySelector('#quadrantList');
const finalDamage = document.querySelector('#finalDamage');
const finalGrade = document.querySelector('#finalGrade');
const evaluationList = document.querySelector('#evaluationList');
const summaryText = document.querySelector('#summaryText');
const exportButton = document.querySelector('#exportButton');
const deleteAllButton = document.querySelector('#deleteAllButton');
const clearFormButton = document.querySelector('#clearFormButton');
const connectionStatus = document.querySelector('#connectionStatus');
const dateInput = document.querySelector('#date');

dateInput.valueAsDate = new Date();
renderQuadrants();
renderEvaluations();
updateResult();
updateConnectionStatus();

form.addEventListener('input', updateResult);
form.addEventListener('submit', saveEvaluation);
exportButton.addEventListener('click', exportCsv);
deleteAllButton.addEventListener('click', deleteAllEvaluations);
clearFormButton.addEventListener('click', resetForm);
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { scope: '../' }).catch(() => {
      connectionStatus.textContent = 'PWA no instalada';
      connectionStatus.className = 'status-pill warning';
    });
  });
}

function renderQuadrants() {
  quadrantList.innerHTML = quadrants.map((number) => `
    <article class="quadrant-card" data-quadrant="${number}">
      <div class="quadrant-title">
        <div>
          <h3>Cuadrante ${number}</h3>
          <p>Marco 3x3</p>
        </div>
        <div class="mini-grid" aria-hidden="true">${Array.from({ length: 9 }, () => '<span></span>').join('')}</div>
      </div>
      <div class="quadrant-fields">
        <label>
          Lenticelas totales
          <input name="q${number}Total" inputmode="numeric" type="number" min="0" step="1" value="0" />
        </label>
        <label>
          Lenticelas afectadas
          <input name="q${number}Affected" inputmode="numeric" type="number" min="0" step="1" value="0" />
        </label>
        <label>
          Lenticelas sanas
          <input name="q${number}Healthy" type="number" value="0" readonly />
        </label>
        <label>
          Porcentaje de dano
          <input name="q${number}Damage" type="text" value="0.00%" readonly />
        </label>
      </div>
    </article>
  `).join('');
}

function updateResult() {
  const quadrantData = getQuadrantData();
  const averageDamage = getAverageDamage(quadrantData);
  finalDamage.textContent = `${formatNumber(averageDamage)}%`;
  finalGrade.textContent = classifyDamage(averageDamage);
}

function getQuadrantData() {
  return quadrants.map((number) => {
    const totalInput = form.elements[`q${number}Total`];
    const affectedInput = form.elements[`q${number}Affected`];
    const healthyInput = form.elements[`q${number}Healthy`];
    const damageInput = form.elements[`q${number}Damage`];

    const total = sanitizeCount(totalInput.value);
    let affected = sanitizeCount(affectedInput.value);

    if (affected > total) {
      affected = total;
      affectedInput.value = total;
    }

    const healthy = Math.max(total - affected, 0);
    const damage = total > 0 ? (affected / total) * 100 : 0;

    totalInput.value = total;
    healthyInput.value = healthy;
    damageInput.value = `${formatNumber(damage)}%`;

    return { quadrant: number, total, affected, healthy, damage };
  });
}

function sanitizeCount(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getAverageDamage(quadrantData) {
  const sum = quadrantData.reduce((total, quadrant) => total + quadrant.damage, 0);
  return sum / quadrants.length;
}

function classifyDamage(value) {
  if (value === 0) return 'Grado 0';
  if (value <= 10) return 'Grado 1';
  if (value <= 20) return 'Grado 2';
  if (value <= 30) return 'Grado 3';
  if (value <= 40) return 'Grado 4';
  if (value <= 50) return 'Grado 5';
  return 'Grado 6';
}

function saveEvaluation(event) {
  event.preventDefault();
  const quadrantData = getQuadrantData();
  const averageDamage = getAverageDamage(quadrantData);
  const fruitCode = form.elements.fruitCode.value.trim();

  const evaluation = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    fruitCode: fruitCode || `Fruto ${evaluations.length + 1}`,
    variety: form.elements.variety.value.trim(),
    batch: form.elements.batch.value.trim(),
    date: form.elements.date.value,
    notes: form.elements.notes.value.trim(),
    quadrants: quadrantData,
    averageDamage,
    grade: classifyDamage(averageDamage),
    createdAt: new Date().toISOString(),
    syncStatus: navigator.onLine ? 'online' : 'offline'
  };

  evaluations = [evaluation, ...evaluations];
  persistEvaluations();
  renderEvaluations();
  resetForm();
}

function resetForm() {
  form.reset();
  dateInput.valueAsDate = new Date();
  quadrants.forEach((number) => {
    form.elements[`q${number}Total`].value = 0;
    form.elements[`q${number}Affected`].value = 0;
  });
  updateResult();
}

function renderEvaluations() {
  summaryText.textContent = evaluations.length
    ? `${evaluations.length} evaluacion${evaluations.length === 1 ? '' : 'es'} guardada${evaluations.length === 1 ? '' : 's'} en este dispositivo.`
    : 'Sin registros todavia.';

  exportButton.disabled = evaluations.length === 0;
  deleteAllButton.disabled = evaluations.length === 0;

  if (!evaluations.length) {
    evaluationList.innerHTML = '<p class="empty-state">Las evaluaciones apareceran aqui despues de guardar el primer fruto.</p>';
    return;
  }

  evaluationList.innerHTML = evaluations.map((evaluation) => `
    <article class="evaluation-item">
      <div>
        <h3>${escapeHtml(evaluation.fruitCode)}</h3>
        <p>${escapeHtml(evaluation.date || 'Sin fecha')} · ${escapeHtml(evaluation.variety || 'Sin variedad')} · ${escapeHtml(evaluation.batch || 'Sin lote')}</p>
      </div>
      <div class="evaluation-score">
        <strong>${formatNumber(evaluation.averageDamage)}%</strong>
        <span>${evaluation.grade}</span>
      </div>
      <details>
        <summary>Ver cuadrantes</summary>
        <div class="detail-grid">
          ${evaluation.quadrants.map((quadrant) => `
            <span>C${quadrant.quadrant}: ${quadrant.affected}/${quadrant.total} afectadas (${formatNumber(quadrant.damage)}%)</span>
          `).join('')}
        </div>
        ${evaluation.notes ? `<p class="notes">${escapeHtml(evaluation.notes)}</p>` : ''}
      </details>
      <button class="link-button" type="button" data-delete-id="${evaluation.id}">Eliminar</button>
    </article>
  `).join('');

  evaluationList.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteEvaluation(button.dataset.deleteId));
  });
}

function deleteEvaluation(id) {
  evaluations = evaluations.filter((evaluation) => evaluation.id !== id);
  persistEvaluations();
  renderEvaluations();
}

function deleteAllEvaluations() {
  if (!confirm('Se borraran todas las evaluaciones guardadas en este dispositivo.')) return;
  evaluations = [];
  persistEvaluations();
  renderEvaluations();
}

function exportCsv() {
  if (!evaluations.length) return;

  const headers = [
    'fecha', 'codigo_fruto', 'variedad', 'lote',
    'q1_totales', 'q1_afectadas', 'q1_sanas', 'q1_dano_pct',
    'q2_totales', 'q2_afectadas', 'q2_sanas', 'q2_dano_pct',
    'q3_totales', 'q3_afectadas', 'q3_sanas', 'q3_dano_pct',
    'promedio_dano_pct', 'grado', 'estado_conexion_al_guardar', 'observaciones'
  ];

  const rows = evaluations.map((evaluation) => {
    const values = [evaluation.date, evaluation.fruitCode, evaluation.variety, evaluation.batch];
    evaluation.quadrants.forEach((quadrant) => {
      values.push(quadrant.total, quadrant.affected, quadrant.healthy, formatNumber(quadrant.damage));
    });
    values.push(formatNumber(evaluation.averageDamage), evaluation.grade, evaluation.syncStatus, evaluation.notes);
    return values;
  });

  const csv = [headers, ...rows]
    .map((row) => row.map(toCsvCell).join(','))
    .join('\n');

  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `evaluaciones-lenticelosis-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function loadEvaluations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function persistEvaluations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.textContent = online ? 'Online' : 'Offline';
  connectionStatus.className = `status-pill ${online ? 'online' : 'offline'}`;
}

function formatNumber(value) {
  return Number(value).toFixed(2);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
