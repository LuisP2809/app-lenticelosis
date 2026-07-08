import './styles.css';

const STORAGE_KEY = 'lenticelosis-evaluaciones-v3';
const LEGACY_STORAGE_KEYS = ['lenticelosis-evaluaciones-v2', 'lenticelosis-evaluaciones-v1'];
const DB_NAME = 'lenticelosis-fotos-db';
const DB_VERSION = 1;
const PHOTO_STORE = 'fruitPhotos';
const quadrants = [1, 2, 3];
const farms = ['Olmos', 'Motupe'];
const harvestTypes = ['Mecanizada', 'Manual'];
const varieties = ['Hass', 'Zutano', 'Maluma', 'Pinkerton', 'Ettinger'];
const processes = [
  '01. Planta',
  '02. Balde',
  '03. Bin',
  '04. Acopio',
  '05. Recepcion',
  '06. Proceso',
  '07. Desp. 5 dias',
  '08. Desp. 10 dias',
  '09. Desp. 15 dias',
  '10. Desp. 20 dias',
  '11. Desp. 25 dias'
];

let evaluations = loadEvaluations();
let step = 1;
let selection = {
  date: getToday(),
  farm: '',
  harvestType: '',
  variety: '',
  process: ''
};
let currentPhoto = null;
let dbPromise;

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">Palta · Lenticelosis</p>
      <h1>Evaluacion de frutos</h1>
      <p class="subtitle">Registra datos generales, elige proceso y luego evalua los cuadrantes del fruto.</p>
    </div>
    <span id="connectionStatus" class="status-pill">Comprobando...</span>
  </header>

  <main class="step-layout">
    <section id="stepOne" class="panel step-panel" aria-labelledby="stepOneTitle">
      <p class="step-kicker">Paso 1 de 3</p>
      <h2 id="stepOneTitle">Datos generales de la evaluacion</h2>
      <p class="muted">Completa todos los campos para continuar.</p>

      <label>
        Fecha
        <input id="evaluationDate" type="date" required />
      </label>

      <div class="choice-group" role="group" aria-label="Fundo">
        <h3>Fundo</h3>
        <div class="choice-grid">
          ${farms.map((farm) => `<button class="choice-button" type="button" data-choice="farm" data-value="${farm}">${farm}</button>`).join('')}
        </div>
      </div>

      <div class="choice-group" role="group" aria-label="Tipo de evaluacion">
        <h3>Tipo de evaluacion</h3>
        <div class="choice-grid">
          ${harvestTypes.map((type) => `<button class="choice-button" type="button" data-choice="harvestType" data-value="${type}">${type}</button>`).join('')}
        </div>
      </div>

      <div class="choice-group" role="group" aria-label="Variedad">
        <h3>Variedad</h3>
        <div class="choice-grid variety-grid">
          ${varieties.map((variety) => `<button class="choice-button" type="button" data-choice="variety" data-value="${variety}">${variety}</button>`).join('')}
        </div>
      </div>

      <p id="stepOneError" class="form-error" hidden>Completa fecha, fundo, tipo de evaluacion y variedad para continuar.</p>
      <button id="goToProcessButton" class="primary-button wide-button" type="button">Continuar</button>
    </section>

    <section id="stepTwo" class="panel step-panel" aria-labelledby="stepTwoTitle" hidden>
      <p class="step-kicker">Paso 2 de 3</p>
      <h2 id="stepTwoTitle">Proceso a elegir</h2>
      <p class="muted">Selecciona el proceso obligatorio antes de abrir el formulario.</p>

      <div class="selection-summary compact-summary" aria-live="polite">
        <span><strong>Fecha:</strong> <em data-summary="date">-</em></span>
        <span><strong>Fundo:</strong> <em data-summary="farm">-</em></span>
        <span><strong>Tipo:</strong> <em data-summary="harvestType">-</em></span>
        <span><strong>Variedad:</strong> <em data-summary="variety">-</em></span>
      </div>

      <div class="process-grid" role="group" aria-label="Proceso">
        ${processes.map((process) => `<button class="choice-button process-button" type="button" data-choice="process" data-value="${process}">${process}</button>`).join('')}
      </div>

      <p id="stepTwoError" class="form-error" hidden>Selecciona un proceso para continuar.</p>
      <div class="button-row step-actions">
        <button id="backToInitialButton" class="secondary-button" type="button">Volver</button>
        <button id="goToFormButton" class="primary-button" type="button">Abrir formulario</button>
      </div>
    </section>

    <section id="formStep" hidden>
      <div class="app-layout">
        <section class="panel form-panel" aria-labelledby="formTitle">
          <div class="section-heading stacked-mobile">
            <div>
              <p class="step-kicker">Paso 3 de 3</p>
              <h2 id="formTitle">Formulario de evaluacion</h2>
            </div>
            <div class="button-row form-nav-actions">
              <button id="backToProcessButton" class="secondary-button" type="button">Volver</button>
              <button id="newEvaluationButton" class="ghost-button framed-button" type="button">Nueva evaluacion</button>
            </div>
          </div>

          <div class="selection-summary full-summary" aria-live="polite">
            <span><strong>Fecha:</strong> <em data-summary="date">-</em></span>
            <span><strong>Fundo:</strong> <em data-summary="farm">-</em></span>
            <span><strong>Tipo de evaluacion:</strong> <em data-summary="harvestType">-</em></span>
            <span><strong>Variedad:</strong> <em data-summary="variety">-</em></span>
            <span><strong>Proceso:</strong> <em data-summary="process">-</em></span>
          </div>

          <form id="evaluationForm" class="evaluation-form">
            <label>
              Codigo o N de fruto
              <input id="fruitCode" name="fruitCode" type="text" placeholder="Ej. 001" autocomplete="off" />
            </label>
            <p id="fruitCodeError" class="form-error" hidden>Este Codigo o N de fruto ya fue registrado para este proceso. Ingresa otro codigo.</p>

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

            <section class="photo-section" aria-labelledby="photoTitle">
              <div class="section-heading compact-heading">
                <div>
                  <h3 id="photoTitle">Foto de la fruta</h3>
                  <p>Opcional. Se guarda localmente para uso offline.</p>
                </div>
              </div>
              <div class="photo-actions">
                <label class="file-button">
                  Tomar foto
                  <input id="cameraInput" type="file" accept="image/*" capture="environment" />
                </label>
                <label class="file-button secondary-file-button">
                  Subir de galeria
                  <input id="galleryInput" type="file" accept="image/*" />
                </label>
                <button id="removePhotoButton" class="danger-button" type="button" hidden>Eliminar foto</button>
              </div>
              <div id="photoPreview" class="photo-preview empty-photo">
                <span>Sin foto seleccionada</span>
              </div>
            </section>

            <label class="notes-label">
              Observacion
              <textarea id="notes" name="notes" rows="3" placeholder="Notas de campo, condicion del fruto o comentarios"></textarea>
            </label>

            <button class="primary-button" type="submit">Guardar evaluacion</button>
          </form>
        </section>

        <section class="panel history-panel" aria-labelledby="historyTitle">
          <div class="section-heading stacked-mobile">
            <div>
              <h2 id="historyTitle">Evaluaciones guardadas</h2>
              <div id="summaryText" class="counter-summary">Sin registros todavia.</div>
            </div>
            <div class="button-row">
              <button id="exportButton" class="secondary-button" type="button">Exportar CSV</button>
              <button id="deleteAllButton" class="danger-button" type="button">Borrar todo</button>
            </div>
          </div>
          <div id="evaluationList" class="evaluation-list"></div>
        </section>
      </div>
    </section>
  </main>
`;

const stepOne = document.querySelector('#stepOne');
const stepTwo = document.querySelector('#stepTwo');
const formStep = document.querySelector('#formStep');
const stepOneError = document.querySelector('#stepOneError');
const stepTwoError = document.querySelector('#stepTwoError');
const fruitCodeError = document.querySelector('#fruitCodeError');
const form = document.querySelector('#evaluationForm');
const quadrantList = document.querySelector('#quadrantList');
const finalDamage = document.querySelector('#finalDamage');
const finalGrade = document.querySelector('#finalGrade');
const evaluationList = document.querySelector('#evaluationList');
const summaryText = document.querySelector('#summaryText');
const exportButton = document.querySelector('#exportButton');
const deleteAllButton = document.querySelector('#deleteAllButton');
const connectionStatus = document.querySelector('#connectionStatus');
const evaluationDateInput = document.querySelector('#evaluationDate');
const cameraInput = document.querySelector('#cameraInput');
const galleryInput = document.querySelector('#galleryInput');
const photoPreview = document.querySelector('#photoPreview');
const removePhotoButton = document.querySelector('#removePhotoButton');

evaluationDateInput.value = selection.date;
renderQuadrants();
renderEvaluations();
updateResult();
updateConnectionStatus();
renderStep();

form.addEventListener('input', updateResult);
form.elements.fruitCode.addEventListener('input', () => {
  fruitCodeError.hidden = true;
});
form.addEventListener('submit', saveEvaluation);
evaluationDateInput.addEventListener('change', () => {
  selection.date = evaluationDateInput.value;
  stepOneError.hidden = true;
  updateSelectionSummary();
});
exportButton.addEventListener('click', exportCsv);
deleteAllButton.addEventListener('click', deleteAllEvaluations);
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

document.querySelectorAll('[data-choice]').forEach((button) => {
  button.addEventListener('click', () => selectChoice(button));
});

document.querySelector('#goToProcessButton').addEventListener('click', () => {
  selection.date = evaluationDateInput.value;
  if (!hasCompleteGeneralData()) {
    stepOneError.hidden = false;
    return;
  }
  stepOneError.hidden = true;
  step = 2;
  renderStep();
});

document.querySelector('#backToInitialButton').addEventListener('click', () => {
  step = 1;
  renderStep();
});

document.querySelector('#goToFormButton').addEventListener('click', () => {
  if (!selection.process) {
    stepTwoError.hidden = false;
    return;
  }
  stepTwoError.hidden = true;
  step = 3;
  renderStep();
});

document.querySelector('#backToProcessButton').addEventListener('click', () => {
  step = 2;
  renderStep();
});

document.querySelector('#newEvaluationButton').addEventListener('click', () => {
  resetForm();
  selection.process = '';
  step = 2;
  renderStep();
});

cameraInput.addEventListener('change', (event) => handlePhotoSelection(event.target.files?.[0]));
galleryInput.addEventListener('change', (event) => handlePhotoSelection(event.target.files?.[0]));
removePhotoButton.addEventListener('click', clearCurrentPhoto);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { scope: '../' }).catch(() => {
      connectionStatus.textContent = 'PWA no instalada';
      connectionStatus.className = 'status-pill warning';
    });
  });
}

function selectChoice(button) {
  const key = button.dataset.choice;
  selection[key] = button.dataset.value;

  if (key === 'farm' || key === 'harvestType' || key === 'variety') stepOneError.hidden = true;
  if (key === 'process') stepTwoError.hidden = true;

  renderChoiceState();
  updateSelectionSummary();
  renderEvaluations();
}

function hasCompleteGeneralData() {
  return Boolean(selection.date && selection.farm && selection.harvestType && selection.variety);
}

function renderStep() {
  stepOne.hidden = step !== 1;
  stepTwo.hidden = step !== 2;
  formStep.hidden = step !== 3;
  evaluationDateInput.value = selection.date || getToday();
  renderChoiceState();
  updateSelectionSummary();
  renderEvaluations();
}

function renderChoiceState() {
  document.querySelectorAll('[data-choice]').forEach((button) => {
    const key = button.dataset.choice;
    button.classList.toggle('selected', selection[key] === button.dataset.value);
  });
}

function updateSelectionSummary() {
  document.querySelectorAll('[data-summary]').forEach((item) => {
    const key = item.dataset.summary;
    item.textContent = selection[key] || '-';
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

async function saveEvaluation(event) {
  event.preventDefault();
  selection.date = evaluationDateInput.value;

  if (!hasCompleteGeneralData() || !selection.process) {
    step = hasCompleteGeneralData() ? 2 : 1;
    renderStep();
    return;
  }

  const quadrantData = getQuadrantData();
  const averageDamage = getAverageDamage(quadrantData);
  const fruitCode = form.elements.fruitCode.value.trim() || `Fruto ${evaluations.length + 1}`;

  if (hasDuplicateFruitCode(fruitCode)) {
    fruitCodeError.hidden = false;
    form.elements.fruitCode.focus();
    return;
  }

  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  const evaluation = {
    id,
    date: selection.date,
    farm: selection.farm,
    harvestType: selection.harvestType,
    variety: selection.variety,
    process: selection.process,
    fruitCode,
    normalizedFruitCode: normalizeFruitCode(fruitCode),
    notes: form.elements.notes.value.trim(),
    quadrants: quadrantData,
    averageDamage,
    grade: classifyDamage(averageDamage),
    hasPhoto: Boolean(currentPhoto),
    photoName: currentPhoto?.name || '',
    createdAt: new Date().toISOString(),
    syncStatus: navigator.onLine ? 'online' : 'offline'
  };

  if (currentPhoto) {
    await savePhoto(id, currentPhoto);
  }

  evaluations = [evaluation, ...evaluations];
  persistEvaluations();
  renderEvaluations();
  resetForm();
}

function resetForm() {
  form.reset();
  fruitCodeError.hidden = true;
  quadrants.forEach((number) => {
    form.elements[`q${number}Total`].value = 0;
    form.elements[`q${number}Affected`].value = 0;
  });
  clearCurrentPhoto();
  updateResult();
}

function renderEvaluations() {
  renderCounters();

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
        <p>${escapeHtml(evaluation.date || 'Sin fecha')} · ${escapeHtml(evaluation.farm || 'Sin fundo')} · ${escapeHtml(evaluation.harvestType || 'Sin tipo')}</p>
        <p>${escapeHtml(evaluation.variety || 'Sin variedad')} · ${escapeHtml(evaluation.process || 'Sin proceso')}</p>
      </div>
      <div class="evaluation-score">
        <strong>${formatNumber(evaluation.averageDamage)}%</strong>
        <span>${evaluation.grade}</span>
      </div>
      <div class="photo-flag">Foto registrada: <strong>${evaluation.hasPhoto ? 'Si' : 'No'}</strong></div>
      <details data-detail-id="${evaluation.id}">
        <summary>Ver cuadrantes</summary>
        <div class="detail-grid">
          ${evaluation.quadrants.map((quadrant) => `
            <span>Cuadrante ${quadrant.quadrant}: ${quadrant.total} totales, ${quadrant.affected} afectadas, ${quadrant.healthy} sanas, ${formatNumber(quadrant.damage)}% dano</span>
          `).join('')}
        </div>
        <div class="saved-photo-preview" data-photo-detail-id="${evaluation.id}">${evaluation.hasPhoto ? 'Cargando foto...' : 'Sin foto registrada'}</div>
        ${evaluation.notes ? `<p class="notes"><strong>Observacion:</strong> ${escapeHtml(evaluation.notes)}</p>` : '<p class="notes"><strong>Observacion:</strong> Sin observacion</p>'}
      </details>
      <button class="link-button" type="button" data-delete-id="${evaluation.id}">Eliminar</button>
    </article>
  `).join('');

  evaluationList.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteEvaluation(button.dataset.deleteId));
  });

  evaluationList.querySelectorAll('details[data-detail-id]').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (details.open) renderSavedPhoto(details.dataset.detailId);
    });
  });
}

function renderCounters() {
  const total = evaluations.length;
  const processTotal = getCurrentProcessEvaluations().length;
  const processLabel = selection.process || 'sin proceso seleccionado';
  const fruitWord = (amount) => amount === 1 ? 'fruto' : 'frutos';

  summaryText.innerHTML = `
    <span>Total general: <strong>${total}</strong> ${fruitWord(total)}</span>
    <span>Proceso actual ${escapeHtml(processLabel)}: <strong>${processTotal}</strong> ${fruitWord(processTotal)}</span>
  `;
}

async function renderSavedPhoto(id) {
  const target = evaluationList.querySelector(`[data-photo-detail-id="${id}"]`);
  if (!target) return;

  const photo = await getPhoto(id);
  if (!photo?.dataUrl) {
    target.textContent = 'Sin foto registrada';
    target.className = 'saved-photo-preview empty-saved-photo';
    return;
  }

  target.className = 'saved-photo-preview';
  target.innerHTML = `<img src="${photo.dataUrl}" alt="Foto guardada de la fruta" />`;
}

async function deleteEvaluation(id) {
  evaluations = evaluations.filter((evaluation) => evaluation.id !== id);
  await deletePhoto(id);
  persistEvaluations();
  renderEvaluations();
}

async function deleteAllEvaluations() {
  if (!confirm('Se borraran todas las evaluaciones guardadas en este dispositivo.')) return;
  const ids = evaluations.map((evaluation) => evaluation.id);
  evaluations = [];
  await Promise.all(ids.map((id) => deletePhoto(id)));
  persistEvaluations();
  renderEvaluations();
}

function exportCsv() {
  if (!evaluations.length) return;

  const headers = [
    'fecha', 'fundo', 'tipo_evaluacion', 'variedad', 'proceso', 'codigo_numero_fruto',
    'cuadrante_1_lenticelas_totales', 'cuadrante_1_lenticelas_afectadas', 'cuadrante_1_lenticelas_sanas', 'cuadrante_1_porcentaje_dano',
    'cuadrante_2_lenticelas_totales', 'cuadrante_2_lenticelas_afectadas', 'cuadrante_2_lenticelas_sanas', 'cuadrante_2_porcentaje_dano',
    'cuadrante_3_lenticelas_totales', 'cuadrante_3_lenticelas_afectadas', 'cuadrante_3_lenticelas_sanas', 'cuadrante_3_porcentaje_dano',
    'resultado_final', 'clasificacion', 'foto_registrada', 'observacion'
  ];

  const rows = evaluations.map((evaluation) => {
    const values = [
      evaluation.date,
      evaluation.farm,
      evaluation.harvestType,
      evaluation.variety,
      evaluation.process,
      evaluation.fruitCode
    ];
    evaluation.quadrants.forEach((quadrant) => {
      values.push(quadrant.total, quadrant.affected, quadrant.healthy, formatNumber(quadrant.damage));
    });
    values.push(
      formatNumber(evaluation.averageDamage),
      evaluation.grade,
      evaluation.hasPhoto ? 'Si' : 'No',
      evaluation.notes
    );
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

async function handlePhotoSelection(file) {
  if (!file) return;

  const dataUrl = await readFileAsDataUrl(file);
  currentPhoto = {
    dataUrl,
    name: file.name || 'foto-fruta',
    type: file.type || 'image/jpeg',
    size: file.size,
    updatedAt: new Date().toISOString()
  };
  renderPhotoPreview();
  cameraInput.value = '';
  galleryInput.value = '';
}

function renderPhotoPreview() {
  if (!currentPhoto) {
    photoPreview.className = 'photo-preview empty-photo';
    photoPreview.innerHTML = '<span>Sin foto seleccionada</span>';
    removePhotoButton.hidden = true;
    return;
  }

  photoPreview.className = 'photo-preview';
  photoPreview.innerHTML = `<img src="${currentPhoto.dataUrl}" alt="Vista previa de la fruta" />`;
  removePhotoButton.hidden = false;
}

function clearCurrentPhoto() {
  currentPhoto = null;
  cameraInput.value = '';
  galleryInput.value = '';
  renderPhotoPreview();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function savePhoto(id, photo) {
  return withPhotoStore('readwrite', (store) => store.put({ id, ...photo }));
}

function getPhoto(id) {
  return withPhotoStore('readonly', (store) => store.get(id));
}

function deletePhoto(id) {
  return withPhotoStore('readwrite', (store) => store.delete(id));
}

function withPhotoStore(mode, action) {
  return openPhotoDb().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(PHOTO_STORE, mode);
    const store = transaction.objectStore(PHOTO_STORE);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  })).catch(() => undefined);
}

function openPhotoDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no disponible'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function hasDuplicateFruitCode(fruitCode) {
  const normalizedCode = normalizeFruitCode(fruitCode);
  return getCurrentProcessEvaluations().some((evaluation) => {
    const existingCode = evaluation.normalizedFruitCode || normalizeFruitCode(evaluation.fruitCode);
    return existingCode === normalizedCode;
  });
}

function getCurrentProcessEvaluations() {
  return evaluations.filter((evaluation) => isSameProcessGroup(evaluation));
}

function isSameProcessGroup(evaluation) {
  return evaluation.date === selection.date
    && evaluation.farm === selection.farm
    && evaluation.harvestType === selection.harvestType
    && evaluation.variety === selection.variety
    && evaluation.process === selection.process;
}

function normalizeFruitCode(value) {
  const text = String(value ?? '').trim();
  if (/^\d+$/.test(text)) return String(Number.parseInt(text, 10));
  return text.replace(/\s+/g, ' ').toLocaleLowerCase('es-PE');
}

function toCsvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function loadEvaluations() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(current)) return hydrateEvaluations(current);

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(legacy)) return hydrateEvaluations(legacy);
    }

    return [];
  } catch {
    return [];
  }
}

function hydrateEvaluations(items) {
  return items.map((evaluation) => ({
    ...evaluation,
    date: evaluation.date || getToday(),
    farm: evaluation.farm || '',
    harvestType: evaluation.harvestType || '',
    variety: evaluation.variety || '',
    process: evaluation.process || '',
    hasPhoto: Boolean(evaluation.hasPhoto),
    normalizedFruitCode: evaluation.normalizedFruitCode || normalizeFruitCode(evaluation.fruitCode)
  }));
}

function persistEvaluations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
}

function updateConnectionStatus() {
  const online = navigator.onLine;
  connectionStatus.textContent = online ? 'Online' : 'Offline';
  connectionStatus.className = `status-pill ${online ? 'online' : 'offline'}`;
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
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
