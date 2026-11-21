// js/ui.js
const screens = {
  home: document.getElementById('screen-home'),
  quiz: document.getElementById('screen-quiz'),
  results: document.getElementById('screen-results')
};
let cardsById = new Map();

export function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen?.classList.remove('active'));
  if (screens[screenName]) {
    screens[screenName].classList.add('active');
    window.scrollTo(0, 0);
  }
}

export function setHomeMessage(message, isError = false) {
  const element = document.getElementById('home-status');
  element.textContent = message;
  element.style.color = isError ? '#b91c1c' : '';
  element.hidden = !message;
}

export function setTestLoading(testId) {
  for (const [id, card] of cardsById) {
    card.disabled = Boolean(testId);
    const badge = card.querySelector('.badge');
    badge.textContent = id === testId ? 'Cargando…' : '▶ Iniciar';
  }
}

export function renderTestList(tests, onSelect) {
  const container = document.getElementById('test-list');
  container.replaceChildren();
  cardsById = new Map();
  document.getElementById('tests-summary-badge').textContent = `${tests.length} Tests`;
  for (const test of tests) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'test-card';
    // Conservar estética previa, evitando HTML dinámico sin sanitización.
    card.style.textAlign = 'left';
    card.style.cursor = 'pointer';
    card.style.width = '100%';
    card.style.font = 'inherit';
    card.style.color = 'inherit';
    const wrapper = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'test-card-title';
    title.textContent = test.titulo;
    const count = document.createElement('span');
    count.className = 'test-card-count';
    count.textContent = `${test.total_preguntas} preguntas`;
    wrapper.append(title, count);
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = '▶ Iniciar';
    card.append(wrapper, badge);
    card.addEventListener('click', () => onSelect(test.id));
    container.appendChild(card);
    cardsById.set(test.id, card);
  }
}

export function renderQuestion(question, currentIndex, totalQuestions, score) {
  document.getElementById('question-counter').textContent = `Pregunta ${currentIndex + 1} de ${totalQuestions}`;
  document.getElementById('quiz-score-preview').textContent = `Aciertos: ${score.correct}`;
  document.getElementById('progress-fill').style.width = `${(currentIndex / totalQuestions) * 100}%`;
  document.getElementById('question-type-badge').textContent = formatTypeLabel(question.tipo);
  document.getElementById('question-text').textContent = question.texto;
  const container = document.getElementById('options-container');
  container.replaceChildren();
  question.opciones.forEach((opcion, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `option-btn ${question.tipo === 'seleccion_multiple' ? 'is-multiple' : ''}`;
    btn.dataset.index = idx;
    const indicator = document.createElement('div');
    indicator.className = 'option-indicator';
    indicator.textContent = idx + 1;
    const label = document.createElement('span');
    label.textContent = opcion.texto;
    btn.append(indicator, label);
    container.appendChild(btn);
  });
  const feedback = document.getElementById('feedback-banner');
  feedback.className = 'feedback-banner hidden';
  feedback.textContent = '';
  const actionBtn = document.getElementById('btn-submit-action');
  actionBtn.textContent = 'Comprobar respuesta';
  actionBtn.disabled = true;
}

export function updateOptionSelections(selectedIndices) {
  document.querySelectorAll('.option-btn').forEach(btn => {
    const idx = parseInt(btn.dataset.index, 10);
    btn.classList.toggle('selected', selectedIndices.includes(idx));
  });
  document.getElementById('btn-submit-action').disabled = selectedIndices.length === 0;
}

export function showEvaluationFeedback(evaluation, isLastQuestion) {
  document.querySelectorAll('.option-btn').forEach(btn => {
    const idx = parseInt(btn.dataset.index, 10);
    btn.disabled = true;
    if (evaluation.correctIndices.includes(idx)) btn.classList.add('correct');
    else if (evaluation.userSelections.includes(idx)) btn.classList.add('incorrect');
  });
  const actionBtn = document.getElementById('btn-submit-action');
  actionBtn.disabled = false;
  actionBtn.textContent = isLastQuestion ? 'Ver resultados' : 'Siguiente pregunta';
}

export function renderResults(scoreData) {
  document.getElementById('final-percentage').textContent = `${scoreData.percentage}%`;
  document.getElementById('score-summary-text').textContent =
    `Has respondido correctamente ${scoreData.correct} de ${scoreData.total} preguntas`;
  document.getElementById('metric-correct').textContent = scoreData.correct;
  document.getElementById('metric-incorrect').textContent = scoreData.incorrect;
}

function formatTypeLabel(tipo) {
  switch (tipo) {
    case 'verdadero_falso': return 'Verdadero o Falso';
    case 'seleccion_multiple': return 'Selección múltiple';
    case 'opcion_unica': return 'Opción única';
    default: return 'Pregunta';
  }
}
