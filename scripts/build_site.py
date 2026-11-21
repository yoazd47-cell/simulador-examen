#!/usr/bin/env python3
"""Valida los microtests, genera su manifiesto y prepara _site/ para Pages."""
from pathlib import Path
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / '_site'
SOURCE = ROOT / 'data' / 'microtests'
KINDS = {'opcion_unica', 'seleccion_multiple', 'verdadero_falso'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(path, test):
    require(isinstance(test, dict), f'{path}: se esperaba un objeto')
    require(isinstance(test.get('id'), str) and test['id'], f'{path}: falta id')
    require(isinstance(test.get('titulo'), str) and test['titulo'], f'{path}: falta titulo')
    questions = test.get('preguntas')
    require(isinstance(questions, list) and questions, f'{path}: preguntas vacío o inválido')
    ids = set()
    for index, question in enumerate(questions, 1):
        tag = f'{path} pregunta {index}'
        require(isinstance(question, dict), f'{tag}: inválida')
        ident = question.get('id')
        require(isinstance(ident, str) and ident and ident not in ids, f'{tag}: id inválido/duplicado')
        ids.add(ident)
        require(isinstance(question.get('texto'), str) and question['texto'], f'{tag}: texto inválido')
        kind = question.get('tipo')
        require(kind in KINDS, f'{tag}: tipo desconocido')
        options = question.get('opciones')
        require(isinstance(options, list) and len(options) >= 2, f'{tag}: opciones inválidas')
        require(all(isinstance(option, dict) and isinstance(option.get('texto'), str)
                    and isinstance(option.get('correcta'), bool) for option in options),
                f'{tag}: campos de opciones inválidos')
        correct = sum(option['correcta'] for option in options)
        require(correct >= 1 and (kind == 'seleccion_multiple' or correct == 1),
                f'{tag}: cantidad incorrecta de respuestas válidas')
    return len(questions)


def natural_key(path):
    """Ordena micro_test_2 antes que micro_test_10."""
    return [int(part) if part.isdigit() else part.lower()
            for part in re.split(r'(\d+)', path.name)]


def main():
    require(SOURCE.is_dir(), 'No existe data/microtests/')
    paths = sorted(SOURCE.glob('*.json'), key=natural_key)
    require(paths, 'No hay microtests en data/microtests/')
    items, seen = [], set()
    for path in paths:
        raw = path.read_bytes()
        try:
            test = json.loads(raw)
        except json.JSONDecodeError as error:
            raise ValueError(f'{path}: JSON inválido: {error}') from error
        count = validate(path, test)
        require(path.stem == test['id'], f'{path}: el nombre debe coincidir con id={test["id"]}')
        require(test['id'] not in seen, f'{path}: ID duplicado')
        seen.add(test['id'])
        items.append({
            'id': test['id'], 'titulo': test['titulo'],
            'archivo': f'microtests/{path.name}', 'total_preguntas': count,
            'version': hashlib.sha256(raw).hexdigest()[:12]
        })

    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(parents=True)
    shutil.copy2(ROOT / 'index.html', SITE / 'index.html')
    for directory in ('css', 'js'):
        require((ROOT / directory).is_dir(), f'No existe {directory}/')
        shutil.copytree(ROOT / directory, SITE / directory)
    shutil.copytree(SOURCE, SITE / 'data' / 'microtests')
    (SITE / 'data' / 'index.json').write_text(json.dumps({
        'titulo_examen': 'Simulador de Aprendizaje Profundo',
        'micro_tests': items
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (SITE / '.nojekyll').touch()
    print(f'Listo: {len(items)} microtests, {sum(x["total_preguntas"] for x in items)} preguntas')


if __name__ == '__main__':
    main()
