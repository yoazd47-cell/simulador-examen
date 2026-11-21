// js/app.js - orquestación de la carga bajo demanda y del examen.
import * as State from './state.js';
import * as Engine from './quiz-engine.js';
import * as UI from './ui.js';
import * as Storage from './storage.js';
import * as Loader from './data-loader.js';

let selectionToken = 0;

function setupEventListeners() {
  const optionsContainer = document.getElementById('options-container');
  if (optionsContainer) {
    optionsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || State.isCurrentChecked()) return;
      const index = parseInt(btn.dataset.index, 10);
      const question = State.getCurrentQuestion();
      State.toggleOptionSelection(index, question.tipo);
      UI.updateOptionSelections(State.getSelectedOptions());
    });
  }

  document.getElementById('btn-submit-action')?.addEventListener('click', () => {
    if (!State.isCurrentChecked()) handleCheckAnswer();
    else handleNextStep();
  });

  document.getElementById('btn-exit-quiz')?.addEventListener('click', () => {
    if (confirm('¿Deseas volver al menú principal? Se perderá el avance actual de este test.')) {
      UI.showScreen('home');
    }
  });

  document.getElementById('btn-retry-test')?.addEventListener('click', () => {
    startSelectedTest(State.getCurrentTestId());
  });

  document.getElementById('btn-back-home')?.addEventListener('click', () => {
    UI.showScreen('home');
  });
}

async function startSelectedTest(testId) {
  const token = ++selectionToken;
  UI.setTestLoading(testId);
  UI.setHomeMessage('Cargando preguntas…');
  try {
    const loadedTest = await Loader.loadTest(testId);
    if (token !== selectionToken) return;
    State.registerLoadedTest(loadedTest);
    const test = State.startTest(testId);
    document.getElementById('quiz-test-title').textContent = test.titulo;
    UI.setHomeMessage('');
    UI.showScreen('quiz');
    renderCurrentQuestion();
  } catch (error) {
    if (token !== selectionToken) return;
    console.error('No se pudo iniciar el microtest:', error);
    UI.setHomeMessage(error.message, true);
  } finally {
    if (token === selectionToken) UI.setTestLoading(null);
  }
}

function renderCurrentQuestion() {
  UI.renderQuestion(State.getCurrentQuestion(), State.getCurrentIndex(),
    State.getTotalQuestions(), State.getScore());
}

function handleCheckAnswer() {
  const evaluation = Engine.evaluateAnswer(State.getCurrentQuestion(), State.getSelectedOptions());
  State.markAsChecked(evaluation.isCorrect);
  const isLast = State.getCurrentIndex() === State.getTotalQuestions() - 1;
  UI.showEvaluationFeedback(evaluation, isLast);
}

function handleNextStep() {
  if (State.nextQuestion()) renderCurrentQuestion();
  else finishTest();
}

function finishTest() {
  const score = State.getScore();
  const scoreData = { ...score, percentage: Engine.calculatePercentage(score.correct, score.total) };
  Storage.saveTestResult(State.getCurrentTestId(), scoreData);
  UI.renderResults(scoreData);
  UI.showScreen('results');
}

async function init() {
  setupEventListeners();
  UI.setHomeMessage('Cargando catálogo…');
  try {
    const tests = await Loader.loadManifest();
    State.setTestsData(tests);
    UI.renderTestList(tests, startSelectedTest);
    UI.setHomeMessage('');
  } catch (error) {
    console.error('Error de inicialización:', error);
    UI.setHomeMessage(`No se pudo cargar el catálogo: ${error.message}`, true);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
