import './styles.css';

const STORAGE_KEY = 'lenticelosis-evaluaciones-v3';
const PROCESS_STORAGE_KEY = 'lenticelosis-procesos-v1';
const LEGACY_STORAGE_KEYS = ['lenticelosis-evaluaciones-v2', 'lenticelosis-evaluaciones-v1'];
const DB_NAME = 'lenticelosis-fotos-db';
const DB_VERSION = 1;
const PHOTO_STORE = 'fruitPhotos';
const MAX_FRUITS_PER_PROCESS = 60;
const CLEAR_ALL_PASSWORD = '2026';
const quadrants = [1, 2, 3];
const fruitCodes = Array.from({ length: MAX_FRUITS_PER_PROCESS }, (_, index) => String(index + 1));
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
let savedProcesses = loadSavedProcesses();
let step = 1;
let selection = getEmptySelection();
let currentPhoto = null;
let dbPromise;
let generalSummariesCache = [];

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">Palta · Lenticelosis</p>
      <h1>Evaluacion de frutos</h1>
      <p class="subtitle">Registra una evaluacion general, elige procesos y evalua frutos del 1 al 60.</p>
    </div>
    <span id="connectionStatus" class="status-pill">Comprobando...</span>
  </header>

  <main class="step-layout">
    <section id="stepOne" class="panel step-panel" aria-labelledby="stepOneTitle">
      <p class="step-kicker">Paso 1 de 3</p>
      <div class="section-heading stacked-mobile">
        <div>
          <h2 id="stepOneTitle">Datos generales de la evaluacion</h2>
          <p class="muted">Completa todos los campos para iniciar o continuar una evaluacion general.</p>
        </div>
        <div class="button-row main-actions">
          <button id="mainExportButton" class="secondary-button" type="button">Exportar CSV</button>
          <button id="clearAllMainButton" class="danger-button" type="button">Limpiar todo</button>
        </div>
      </div>
      <div id="cleanupMessage" class="success-message" hidden></div>

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
      <button id="goToProcessButton" class="primary-button wide-button" type="button">Iniciar evaluacion</button>

      <section class="general-evaluations-section" aria-labelledby="generalEvaluationsTitle">
        <h2 id="generalEvaluationsTitle">Evaluaciones guardadas</h2>
        <div id="generalEvaluationList" class="general-evaluation-list"></div>
      </section>
    </section>

    <section id="stepTwo" class="panel step-panel" aria-labelledby="stepTwoTitle" hidden>
      <p class="step-kicker">Paso 2 de 3</p>
      <h2 id="stepTwoTitle">Seleccion de proceso</h2>
      <p class="muted">Selecciona un proceso para registrar o continuar frutos dentro de la evaluacion general actual.</p>

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
              <h2 id="formTitle">Formulario de frutos del proceso</h2>
            </div>
            <div class="button-row form-nav-actions">
              <button id="backToProcessButton" class="secondary-button" type="button">Volver</button>
              <button id="newEvaluationButton" class="ghost-button framed-button" type="button">Nuevo proceso</button>
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
              <select id="fruitCode" name="fruitCode" required></select>
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

            <button class="primary-button" type="submit">Guardar evaluacion/fruto</button>
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
          <div id="processMessage" class="success-message" hidden></div>
          <div id="evaluationList" class="evaluation-list"></div>
          <button id="saveProcessButton" class="primary-button wide-button save-process-button" type="button">Guardar proceso</button>
          <section class="saved-processes-section" aria-labelledby="savedProcessesTitle">
            <h2 id="savedProcessesTitle">Procesos guardados</h2>
            <div id="savedProcessesList" class="saved-processes-list"></div>
          </section>
        </section>
      </div>
    </section>
  </main>

  <div id="exitDialog" class="modal-backdrop" hidden>
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="exitDialogTitle">
      <h2 id="exitDialogTitle">Salir del proceso</h2>
      <p>¿Seguro que quieres salir? Recomendamos guardar el proceso antes de salir.</p>
      <div class="button-row dialog-actions">
        <button id="cancelExitButton" class="secondary-button" type="button">Cancelar</button>
        <button id="confirmExitButton" class="danger-button" type="button">Si, salir</button>
      </div>
    </section>
  </div>

  <div id="clearConfirmDialog" class="modal-backdrop" hidden>
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="clearConfirmTitle">
      <h2 id="clearConfirmTitle">Limpiar todo</h2>
      <p>¿Seguro quieres limpiar todo? Se eliminarán todas las evaluaciones.</p>
      <div class="button-row dialog-actions">
        <button id="cancelClearButton" class="secondary-button" type="button">Cancelar</button>
        <button id="acceptClearButton" class="danger-button" type="button">Sí</button>
      </div>
    </section>
  </div>

  <div id="passwordDialog" class="modal-backdrop" hidden>
    <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="passwordDialogTitle">
      <h2 id="passwordDialogTitle">Ingrese contraseña</h2>
      <label>
        Contraseña
        <input id="clearPasswordInput" type="password" inputmode="numeric" autocomplete="off" />
      </label>
      <p id="passwordError" class="form-error" hidden>Contraseña incorrecta</p>
      <div class="button-row dialog-actions">
        <button id="cancelPasswordButton" class="secondary-button" type="button">Cancelar</button>
        <button id="confirmPasswordButton" class="danger-button" type="button">Limpiar todo</button>
      </div>
    </section>
  </div>
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
const generalEvaluationList = document.querySelector('#generalEvaluationList');
const summaryText = document.querySelector('#summaryText');
const mainExportButton = document.querySelector('#mainExportButton');
const clearAllMainButton = document.querySelector('#clearAllMainButton');
const exportButton = document.querySelector('#exportButton');
const deleteAllButton = document.querySelector('#deleteAllButton');
const saveProcessButton = document.querySelector('#saveProcessButton');
const processMessage = document.querySelector('#processMessage');
const cleanupMessage = document.querySelector('#cleanupMessage');
const savedProcessesList = document.querySelector('#savedProcessesList');
const connectionStatus = document.querySelector('#connectionStatus');
const evaluationDateInput = document.querySelector('#evaluationDate');
const cameraInput = document.querySelector('#cameraInput');
const galleryInput = document.querySelector('#galleryInput');
const photoPreview = document.querySelector('#photoPreview');
const removePhotoButton = document.querySelector('#removePhotoButton');
const exitDialog = document.querySelector('#exitDialog');
const clearConfirmDialog = document.querySelector('#clearConfirmDialog');
const passwordDialog = document.querySelector('#passwordDialog');
const clearPasswordInput = document.querySelector('#clearPasswordInput');
const passwordError = document.querySelector('#passwordError');

evaluationDateInput.value = selection.date;
renderQuadrants();
renderFruitOptions();
renderEvaluations();
renderSavedProcesses();
renderGeneralEvaluations();
updateResult();
updateConnectionStatus();
renderStep();

form.addEventListener('input', updateResult);
form.elements.fruitCode.addEventListener('change', () => {
  fruitCodeError.hidden = true;
});
form.addEventListener('submit', saveEvaluation);
evaluationDateInput.addEventListener('change', () => {
  selection.date = evaluationDateInput.value;
  selection.process = '';
  stepOneError.hidden = true;
  cleanupMessage.hidden = true;
  updateSelectionSummary();
  renderFruitOptions();
  renderSavedProcesses();
});
mainExportButton.addEventListener('click', exportCsv);
clearAllMainButton.addEventListener('click', beginClearAllFlow);
exportButton.addEventListener('click', exportCsv);
deleteAllButton.addEventListener('click', beginClearAllFlow);
saveProcessButton.addEventListener('click', saveCurrentProcess);
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
  cleanupMessage.hidden = true;
  selection.process = '';
  step = 2;
  renderStep();
});

document.querySelector('#backToInitialButton').addEventListener('click', resetToMainInitialState);

document.querySelector('#goToFormButton').addEventListener('click', () => {
  if (!selection.process) {
    stepTwoError.hidden = false;
    return;
  }
  stepTwoError.hidden = true;
  step = 3;
  renderStep();
});

document.querySelector('#backToProcessButton').addEventListener('click', showExitDialog);
document.querySelector('#cancelExitButton').addEventListener('click', hideExitDialog);
document.querySelector('#confirmExitButton').addEventListener('click', () => {
  hideExitDialog();
  resetToMainInitialState();
});
document.querySelector('#cancelClearButton').addEventListener('click', hideClearDialogs);
document.querySelector('#acceptClearButton').addEventListener('click', showPasswordDialog);
document.querySelector('#cancelPasswordButton').addEventListener('click', hideClearDialogs);
document.querySelector('#confirmPasswordButton').addEventListener('click', confirmClearAll);
clearPasswordInput.addEventListener('input', () => {
  passwordError.hidden = true;
});
clearPasswordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') confirmClearAll();
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

  if (key === 'farm' || key === 'harvestType' || key === 'variety') {
    stepOneError.hidden = true;
    cleanupMessage.hidden = true;
    selection.process = '';
  }
  if (key === 'process') stepTwoError.hidden = true;

  processMessage.hidden = true;
  renderChoiceState();
  updateSelectionSummary();
  renderFruitOptions();
  renderEvaluations();
  renderSavedProcesses();
}

function hasCompleteGeneralData() {
  return Boolean(selection.date && selection.farm && selection.harvestType && selection.variety);
}

function renderStep() {
  stepOne.hidden = step !== 1;
  stepTwo.hidden = step !== 2;
  formStep.hidden = step !== 3;
  evaluationDateInput.value = selection.date || getToday();
  processMessage.hidden = true;
  hideExitDialog();
  hideClearDialogs();
  renderChoiceState();
  updateSelectionSummary();
  renderFruitOptions();
  renderEvaluations();
  renderSavedProcesses();
  renderGeneralEvaluations();
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

function renderFruitOptions() {
  const currentValue = form.elements.fruitCode?.value || '';
  const registeredCodes = new Set(getCurrentProcessEvaluations().map((evaluation) => evaluation.normalizedFruitCode || normalizeFruitCode(evaluation.fruitCode)));
  const options = ['<option value="">Selecciona fruto</option>'].concat(fruitCodes.map((code) => {
    const normalized = normalizeFruitCode(code);
    const registered = registeredCodes.has(normalized);
    return `<option value="${code}" ${registered ? 'disabled' : ''}>${code}${registered ? ' - Registrado' : ''}</option>`;
  }));

  form.elements.fruitCode.innerHTML = options.join('');
  form.elements.fruitCode.value = registeredCodes.has(normalizeFruitCode(currentValue)) ? '' : currentValue;
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

  const fruitCode = form.elements.fruitCode.value;
  if (!fruitCode || hasDuplicateFruitCode(fruitCode)) {
    fruitCodeError.hidden = false;
    form.elements.fruitCode.focus();
    return;
  }

  const quadrantData = getQuadrantData();
  const averageDamage = getAverageDamage(quadrantData);
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  const evaluation = {
    id,
    generalKey: getCurrentGeneralKey(),
    date: selection.date,
    farm: selection.farm,
    harvestType: selection.harvestType,
    variety: selection.variety,
    process: selection.process,
    fruitCode,
    normalizedFruitCode: normalizeFruitCode(fruitCode),
    processKey: getCurrentProcessKey(),
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
  renderFruitOptions();
  renderSavedProcesses();
  renderGeneralEvaluations();
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
  renderFruitOptions();
}

function renderEvaluations() {
  renderCounters();

  const hasStoredData = evaluations.length > 0 || Object.keys(savedProcesses).length > 0;
  mainExportButton.disabled = evaluations.length === 0;
  exportButton.disabled = evaluations.length === 0;
  clearAllMainButton.disabled = !hasStoredData;
  deleteAllButton.disabled = !hasStoredData;
  saveProcessButton.disabled = !selection.process || getCurrentProcessEvaluations().length === 0;

  const currentEvaluations = getCurrentProcessEvaluations();
  if (!currentEvaluations.length) {
    evaluationList.innerHTML = '<p class="empty-state">Este proceso aun no tiene frutos registrados.</p>';
    return;
  }

  evaluationList.innerHTML = currentEvaluations.map((evaluation) => renderEvaluationCard(evaluation)).join('');
  attachEvaluationEvents(evaluationList);
}

function renderEvaluationCard(evaluation, options = {}) {
  const { allowDelete = true } = options;
  return `
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
      ${allowDelete ? `<button class="link-button" type="button" data-delete-id="${evaluation.id}">Eliminar</button>` : ''}
    </article>
  `;
}

function attachEvaluationEvents(container) {
  container.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => deleteEvaluation(button.dataset.deleteId));
  });

  container.querySelectorAll('details[data-detail-id]').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (details.open) renderSavedPhoto(details.dataset.detailId, container);
    });
  });
}

function renderCounters() {
  const processTotal = getCurrentProcessEvaluations().length;
  const pending = Math.max(MAX_FRUITS_PER_PROCESS - processTotal, 0);
  const processLabel = selection.process || 'sin proceso seleccionado';
  const saved = isCurrentProcessSaved();

  summaryText.innerHTML = `
    <span>Proceso actual ${escapeHtml(processLabel)}: <strong>${processTotal}</strong> frutos registrados de ${MAX_FRUITS_PER_PROCESS}</span>
    <span><strong>${pending}</strong> pendientes</span>
    ${saved ? '<span class="saved-status">Proceso guardado</span>' : ''}
  `;
}

function saveCurrentProcess() {
  if (!selection.process) return;

  const processKey = getCurrentProcessKey();
  savedProcesses[processKey] = {
    key: processKey,
    generalKey: getCurrentGeneralKey(),
    date: selection.date,
    farm: selection.farm,
    harvestType: selection.harvestType,
    variety: selection.variety,
    process: selection.process,
    status: 'Guardado',
    savedAt: new Date().toISOString()
  };

  persistSavedProcesses();
  renderCounters();
  renderSavedProcesses();
  renderGeneralEvaluations();
  processMessage.textContent = `Proceso ${selection.process} guardado correctamente.`;
  processMessage.hidden = false;
}

function renderSavedProcesses() {
  const processItems = getProcessSummaries()
    .filter((item) => item.status === 'Guardado' && getGeneralKey(item) === getCurrentGeneralKey());

  if (!processItems.length) {
    savedProcessesList.innerHTML = '<p class="empty-state">Aun no hay procesos guardados para esta evaluacion general.</p>';
    return;
  }

  savedProcessesList.innerHTML = processItems.map((item) => renderProcessDetail(item)).join('');
  attachProcessDetailEvents(savedProcessesList);
}

function renderGeneralEvaluations() {
  generalSummariesCache = getGeneralSummaries();

  if (!generalSummariesCache.length) {
    generalEvaluationList.innerHTML = '<p class="empty-state">Aun no hay evaluaciones generales guardadas.</p>';
    return;
  }

  generalEvaluationList.innerHTML = generalSummariesCache.map((summary, index) => `
    <article class="general-evaluation-card">
      <div>
        <p class="step-kicker">Evaluacion guardada</p>
        <h3>${escapeHtml(summary.date)}</h3>
      </div>
      <div class="general-summary-grid">
        <span><strong>Fecha:</strong> ${escapeHtml(summary.date)}</span>
        <span><strong>Fundo:</strong> ${escapeHtml(summary.farm)}</span>
        <span><strong>Tipo:</strong> ${escapeHtml(summary.harvestType)}</span>
        <span><strong>Variedad:</strong> ${escapeHtml(summary.variety)}</span>
        <span><strong>Procesos:</strong> ${summary.processCount}</span>
        <span><strong>Frutos registrados:</strong> ${summary.fruitCount}</span>
      </div>
      <div class="button-row">
        <button class="secondary-button" type="button" data-view-general-index="${index}">Ver detalle</button>
        <button class="primary-button" type="button" data-continue-general-index="${index}">Continuar evaluacion</button>
      </div>
      <div class="general-detail" data-general-detail-index="${index}" hidden></div>
    </article>
  `).join('');

  generalEvaluationList.querySelectorAll('[data-view-general-index]').forEach((button) => {
    button.addEventListener('click', () => toggleGeneralDetail(Number(button.dataset.viewGeneralIndex)));
  });

  generalEvaluationList.querySelectorAll('[data-continue-general-index]').forEach((button) => {
    button.addEventListener('click', () => continueGeneralEvaluation(Number(button.dataset.continueGeneralIndex)));
  });
}

function toggleGeneralDetail(index) {
  const summary = generalSummariesCache[index];
  const detail = generalEvaluationList.querySelector(`[data-general-detail-index="${index}"]`);
  if (!summary || !detail) return;

  const shouldOpen = detail.hidden;
  detail.hidden = !shouldOpen;
  if (!shouldOpen) return;

  detail.innerHTML = renderGeneralDetail(summary);
  attachProcessDetailEvents(detail);
}

function renderGeneralDetail(summary) {
  const processItems = getProcessSummaries().filter((item) => getGeneralKey(item) === summary.key);
  const processMarkup = processItems.length
    ? processItems.map((item) => renderProcessDetail(item)).join('')
    : '<p class="empty-state">Esta evaluacion aun no tiene procesos registrados.</p>';

  return `
    <section class="general-detail-content">
      <h4>Datos generales</h4>
      <div class="general-summary-grid">
        <span><strong>Fecha:</strong> ${escapeHtml(summary.date)}</span>
        <span><strong>Fundo:</strong> ${escapeHtml(summary.farm)}</span>
        <span><strong>Tipo:</strong> ${escapeHtml(summary.harvestType)}</span>
        <span><strong>Variedad:</strong> ${escapeHtml(summary.variety)}</span>
      </div>
      <h4>Procesos registrados</h4>
      <div class="saved-processes-list">${processMarkup}</div>
    </section>
  `;
}

function renderProcessDetail(item) {
  return `
    <details class="saved-process-item" data-process-key="${escapeHtml(item.key)}">
      <summary>${escapeHtml(item.process)} | ${item.count} frutos | ${item.status}</summary>
      <p>${escapeHtml(item.date)} · ${escapeHtml(item.farm)} · ${escapeHtml(item.harvestType)} · ${escapeHtml(item.variety)}</p>
      <div class="saved-process-evaluations"></div>
    </details>
  `;
}

function attachProcessDetailEvents(container) {
  container.querySelectorAll('details[data-process-key]').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      const key = details.dataset.processKey;
      const target = details.querySelector('.saved-process-evaluations');
      if (!target) return;
      const items = evaluations.filter((evaluation) => getProcessKeyFromEvaluation(evaluation) === key);
      target.innerHTML = items.length
        ? items.map((evaluation) => renderEvaluationCard(evaluation, { allowDelete: false })).join('')
        : '<p class="empty-state">Sin frutos en este proceso.</p>';
      attachEvaluationEvents(target);
    });
  });
}

function continueGeneralEvaluation(index) {
  const summary = generalSummariesCache[index];
  if (!summary) return;

  resetForm();
  cleanupMessage.hidden = true;
  selection = {
    date: summary.date,
    farm: summary.farm,
    harvestType: summary.harvestType,
    variety: summary.variety,
    process: ''
  };
  step = 2;
  renderStep();
}

function resetToMainInitialState() {
  resetForm();
  selection = getEmptySelection();
  stepOneError.hidden = true;
  stepTwoError.hidden = true;
  step = 1;
  renderStep();
}

function showExitDialog() {
  exitDialog.hidden = false;
}

function hideExitDialog() {
  exitDialog.hidden = true;
}

function beginClearAllFlow() {
  if (evaluations.length === 0 && Object.keys(savedProcesses).length === 0) return;
  cleanupMessage.hidden = true;
  passwordError.hidden = true;
  clearPasswordInput.value = '';
  clearConfirmDialog.hidden = false;
}

function showPasswordDialog() {
  clearConfirmDialog.hidden = true;
  passwordError.hidden = true;
  clearPasswordInput.value = '';
  passwordDialog.hidden = false;
  clearPasswordInput.focus();
}

function hideClearDialogs() {
  clearConfirmDialog.hidden = true;
  passwordDialog.hidden = true;
  passwordError.hidden = true;
}

async function confirmClearAll() {
  if (clearPasswordInput.value !== CLEAR_ALL_PASSWORD) {
    passwordError.hidden = false;
    clearPasswordInput.focus();
    return;
  }

  hideClearDialogs();
  await clearAllStoredData();
}

async function clearAllStoredData() {
  evaluations = [];
  savedProcesses = {};
  generalSummariesCache = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROCESS_STORAGE_KEY);
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  await clearPhotoStore();
  resetForm();
  selection = getEmptySelection();
  step = 1;
  renderStep();
  cleanupMessage.textContent = 'Todas las evaluaciones fueron eliminadas.';
  cleanupMessage.hidden = false;
}

function getProcessSummaries() {
  const summaries = new Map();

  evaluations.forEach((evaluation) => {
    const key = getProcessKeyFromEvaluation(evaluation);
    if (!summaries.has(key)) {
      summaries.set(key, {
        key,
        generalKey: evaluation.generalKey || getGeneralKey(evaluation),
        date: evaluation.date,
        farm: evaluation.farm,
        harvestType: evaluation.harvestType,
        variety: evaluation.variety,
        process: evaluation.process,
        count: 0,
        status: getProcessStatus(key)
      });
    }
    summaries.get(key).count += 1;
  });

  Object.values(savedProcesses).forEach((process) => {
    const key = process.key || getProcessKey(process);
    if (!summaries.has(key)) {
      summaries.set(key, { ...process, key, generalKey: process.generalKey || getGeneralKey(process), count: 0, status: 'Guardado' });
    } else {
      summaries.get(key).status = 'Guardado';
    }
  });

  return Array.from(summaries.values()).sort((a, b) => `${b.date}${b.process}`.localeCompare(`${a.date}${a.process}`));
}

function getGeneralSummaries() {
  const summaries = new Map();

  getProcessSummaries().forEach((process) => {
    const key = getGeneralKey(process);
    if (!key.replaceAll('|', '').trim()) return;
    if (!summaries.has(key)) {
      summaries.set(key, {
        key,
        date: process.date,
        farm: process.farm,
        harvestType: process.harvestType,
        variety: process.variety,
        processCount: 0,
        fruitCount: 0
      });
    }
    const summary = summaries.get(key);
    summary.processCount += 1;
    summary.fruitCount += process.count;
  });

  return Array.from(summaries.values()).sort((a, b) => `${b.date}${b.farm}${b.variety}`.localeCompare(`${a.date}${a.farm}${a.variety}`));
}

async function renderSavedPhoto(id, root = document) {
  const target = root.querySelector(`[data-photo-detail-id="${id}"]`);
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
  renderFruitOptions();
  renderSavedProcesses();
  renderGeneralEvaluations();
}

function exportCsv() {
  if (!evaluations.length) return;

  const headers = [
    'id_evaluacion_general', 'fecha', 'fundo', 'tipo_evaluacion', 'variedad', 'proceso', 'estado_proceso', 'codigo_numero_fruto',
    'cuadrante_1_lenticelas_totales', 'cuadrante_1_lenticelas_afectadas', 'cuadrante_1_lenticelas_sanas', 'cuadrante_1_porcentaje_dano',
    'cuadrante_2_lenticelas_totales', 'cuadrante_2_lenticelas_afectadas', 'cuadrante_2_lenticelas_sanas', 'cuadrante_2_porcentaje_dano',
    'cuadrante_3_lenticelas_totales', 'cuadrante_3_lenticelas_afectadas', 'cuadrante_3_lenticelas_sanas', 'cuadrante_3_porcentaje_dano',
    'resultado_final', 'clasificacion', 'foto_registrada', 'observacion'
  ];

  const rows = evaluations.map((evaluation) => {
    const values = [
      evaluation.generalKey || getGeneralKey(evaluation),
      evaluation.date,
      evaluation.farm,
      evaluation.harvestType,
      evaluation.variety,
      evaluation.process,
      getProcessStatus(getProcessKeyFromEvaluation(evaluation)),
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

function clearPhotoStore() {
  return withPhotoStore('readwrite', (store) => store.clear());
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
  return getProcessKeyFromEvaluation(evaluation) === getCurrentProcessKey();
}

function getCurrentGeneralKey() {
  return getGeneralKey(selection);
}

function getCurrentProcessKey() {
  return getProcessKey(selection);
}

function getProcessKeyFromEvaluation(evaluation) {
  return evaluation.processKey || getProcessKey(evaluation);
}

function getGeneralKey(item) {
  return [item.date, item.farm, item.harvestType, item.variety]
    .map((value) => String(value ?? '').trim().toLocaleLowerCase('es-PE'))
    .join('|');
}

function getProcessKey(item) {
  return [item.date, item.farm, item.harvestType, item.variety, item.process]
    .map((value) => String(value ?? '').trim().toLocaleLowerCase('es-PE'))
    .join('|');
}

function getProcessStatus(key) {
  return savedProcesses[key]?.status || 'En edicion';
}

function isCurrentProcessSaved() {
  return getProcessStatus(getCurrentProcessKey()) === 'Guardado';
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

function getEmptySelection() {
  return {
    date: getToday(),
    farm: '',
    harvestType: '',
    variety: '',
    process: ''
  };
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
  return items.map((evaluation) => {
    const hydrated = {
      ...evaluation,
      date: evaluation.date || getToday(),
      farm: evaluation.farm || '',
      harvestType: evaluation.harvestType || '',
      variety: evaluation.variety || '',
      process: evaluation.process || '',
      hasPhoto: Boolean(evaluation.hasPhoto),
      normalizedFruitCode: evaluation.normalizedFruitCode || normalizeFruitCode(evaluation.fruitCode)
    };
    hydrated.generalKey = hydrated.generalKey || getGeneralKey(hydrated);
    hydrated.processKey = hydrated.processKey || getProcessKey(hydrated);
    return hydrated;
  });
}

function loadSavedProcesses() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROCESS_STORAGE_KEY)) || {};
    return hydrateSavedProcesses(saved);
  } catch {
    return {};
  }
}

function hydrateSavedProcesses(processMap) {
  return Object.values(processMap).reduce((items, process) => {
    const key = process.key || getProcessKey(process);
    items[key] = {
      ...process,
      key,
      generalKey: process.generalKey || getGeneralKey(process),
      status: process.status || 'Guardado'
    };
    return items;
  }, {});
}

function persistEvaluations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
}

function persistSavedProcesses() {
  localStorage.setItem(PROCESS_STORAGE_KEY, JSON.stringify(savedProcesses));
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
