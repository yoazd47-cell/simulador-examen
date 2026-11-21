// js/state.js
const state = {
  allTests: [], currentTest: null, currentQuestionIndex: 0,
  selectedOptionIndices: [], isChecked: false,
  score: { correct: 0, incorrect: 0 }
};

export function setTestsData(tests) { state.allTests = tests.map(test => ({ ...test })); }
export function getAllTests() { return state.allTests; }
export function registerLoadedTest(test) {
  const idx = state.allTests.findIndex(item => item.id === test.id);
  if (idx < 0) throw new Error(`Test no registrado: ${test.id}`);
  state.allTests[idx] = test;
}
export function startTest(testId) {
  const foundTest = state.allTests.find(t => t.id === testId);
  if (!foundTest || !Array.isArray(foundTest.preguntas) || !foundTest.preguntas.length) {
    throw new Error(`Test no cargado: ${testId}`);
  }
  state.currentTest = foundTest;
  state.currentQuestionIndex = 0;
  state.selectedOptionIndices = [];
  state.isChecked = false;
  state.score = { correct: 0, incorrect: 0 };
  return state.currentTest;
}
export function getCurrentQuestion() {
  return state.currentTest ? state.currentTest.preguntas[state.currentQuestionIndex] : null;
}
export function getCurrentIndex() { return state.currentQuestionIndex; }
export function getTotalQuestions() {
  return state.currentTest ? state.currentTest.preguntas.length : 0;
}
export function toggleOptionSelection(index, questionType) {
  if (state.isChecked) return;
  if (questionType === 'seleccion_multiple') {
    const existing = state.selectedOptionIndices.indexOf(index);
    if (existing > -1) state.selectedOptionIndices.splice(existing, 1);
    else state.selectedOptionIndices.push(index);
  } else state.selectedOptionIndices = [index];
}
export function getSelectedOptions() { return [...state.selectedOptionIndices]; }
export function markAsChecked(isCorrect) {
  if (state.isChecked) return;
  state.isChecked = true;
  if (isCorrect) state.score.correct++;
  else state.score.incorrect++;
}
export function isCurrentChecked() { return state.isChecked; }
export function nextQuestion() {
  state.currentQuestionIndex++;
  state.selectedOptionIndices = [];
  state.isChecked = false;
  return state.currentQuestionIndex < state.currentTest.preguntas.length;
}
export function getScore() { return { ...state.score, total: getTotalQuestions() }; }
export function getCurrentTestId() { return state.currentTest ? state.currentTest.id : null; }
