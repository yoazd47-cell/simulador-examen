// Catálogo ligero + descarga diferida de preguntas.
const catalogUrl = new URL('../data/index.json', import.meta.url);
const cache = new Map();
const pending = new Map();
let manifest = null;

export async function loadManifest() {
  const response = await fetch(catalogUrl, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`No se pudo cargar el catálogo (HTTP ${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data.micro_tests) || !data.micro_tests.length) {
    throw new Error('El catálogo no contiene microtests.');
  }
  const ids = new Set();
  for (const test of data.micro_tests) {
    if (typeof test.id !== 'string' || !test.id || ids.has(test.id) ||
        typeof test.titulo !== 'string' ||
        typeof test.archivo !== 'string' ||
        !/^microtests\/[a-zA-Z0-9_-]+\.json$/.test(test.archivo) ||
        !Number.isInteger(test.total_preguntas) || test.total_preguntas < 1) {
      throw new Error('El catálogo tiene una entrada inválida o un ID duplicado.');
    }
    ids.add(test.id);
  }
  manifest = data;
  cache.clear();
  pending.clear();
  return data.micro_tests;
}

export async function loadTest(testId) {
  if (!manifest) throw new Error('El catálogo todavía no está disponible.');
  const info = manifest.micro_tests.find(test => test.id === testId);
  if (!info) throw new Error(`Microtest no encontrado: ${testId}`);
  if (cache.has(testId)) return cache.get(testId);
  if (pending.has(testId)) return pending.get(testId);

  const task = (async () => {
    const url = new URL(`../data/${info.archivo}`, import.meta.url);
    // La versión de contenido cambia al generar el manifiesto.
    if (info.version) url.searchParams.set('v', info.version);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo descargar ${info.titulo} (HTTP ${response.status}).`);
    const test = await response.json();
    validateTest(test, info);
    cache.set(testId, test);
    return test;
  })();

  pending.set(testId, task);
  try { return await task; }
  finally { pending.delete(testId); }
}

function validateTest(test, info) {
  if (!test || test.id !== info.id || typeof test.titulo !== 'string' ||
      !Array.isArray(test.preguntas) || test.preguntas.length !== info.total_preguntas) {
    throw new Error(`Los datos de ${info.titulo} no coinciden con el catálogo.`);
  }
  const ids = new Set();
  for (const question of test.preguntas) {
    if (!question || typeof question.id !== 'string' || ids.has(question.id) ||
        typeof question.texto !== 'string' ||
        !['opcion_unica', 'seleccion_multiple', 'verdadero_falso'].includes(question.tipo) ||
        !Array.isArray(question.opciones) || question.opciones.length < 2 ||
        question.opciones.some(option => typeof option.texto !== 'string' || typeof option.correcta !== 'boolean')) {
      throw new Error(`Pregunta inválida en ${info.titulo}.`);
    }
    const nCorrect = question.opciones.filter(option => option.correcta).length;
    if (nCorrect === 0 || (question.tipo !== 'seleccion_multiple' && nCorrect !== 1)) {
      throw new Error(`Respuestas correctas inválidas en ${info.titulo}.`);
    }
    ids.add(question.id);
  }
}

export function clearCache() { cache.clear(); }
