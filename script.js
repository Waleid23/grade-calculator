// script.js: INPUT SIDE (owner: Waleid)
//
// Keeps the form state, draws the homework and quiz rows, checks scores, and
// sends a plain input object (collectInput) to GradeMath.calculate().
// The math is in math.js and the results panel in results.js.

const STORAGE_KEY = 'grade-calculator-v1';
const DEFAULT_GOAL = 3.8;

const $ = (id) => document.getElementById(id);

function emptyState() {
  return {
    homework: [],                                  // { scoreText, daysLate, missing }
    quizzes: [],                                   // { scoreText, missing }
    midterm: { status: 'pending', scoreText: '' },
    participation: { status: 'pending', scoreText: '' },
    goalGpa: DEFAULT_GOAL,
    nextExam: 'final',
  };
}

let state = loadState();

// --- Score checking ------------------------------------------------------
// Returns { score, problem }: score is a number or null (blank/invalid), and
// problem is 'blank', 'invalid' or null.
function parseScore(text) {
  const t = String(text).trim();
  if (t === '') return { score: null, problem: 'blank' };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 100) return { score: null, problem: 'invalid' };
  return { score: n, problem: null };
}

const PROBLEM_TEXT = {
  blank: 'Blank: counts as 0',
  invalid: 'Enter 0–100: counts as 0',
};

// --- Turning form state into the math input -----------------------------
function collectInput() {
  const item = (row) => ({
    status: row.missing ? 'missing' : 'graded',
    score: parseScore(row.scoreText).score,
  });
  return {
    homework: state.homework.map((h) => ({ ...item(h), daysLate: Number(h.daysLate) || 0 })),
    quizzes: state.quizzes.map(item),
    midterm: {
      status: state.midterm.status,
      score: parseScore(state.midterm.scoreText).score,
    },
    participation: {
      status: state.participation.status,
      score: parseScore(state.participation.scoreText).score,
    },
    goalGpa: state.goalGpa,
    nextExam: state.nextExam,
  };
}

// --- Drawing the form -----------------------------------------------------
const LISTS = {
  homework: { name: 'HW', blank: () => ({ scoreText: '', daysLate: 0, missing: false }) },
  quizzes: { name: 'Quiz', blank: () => ({ scoreText: '', missing: false }) },
};

function renderList(kind) {
  const list = $(`${kind}-list`);
  const template = $('item-row');
  const rows = state[kind].map((row, i) => {
    const el = template.content.firstElementChild.cloneNode(true);
    el.dataset.kind = kind;
    el.dataset.index = i;
    el.querySelector('.item-name').textContent = `${LISTS[kind].name} ${i + 1}`;
    el.querySelector('.score').value = row.scoreText;
    el.querySelector('.score').setAttribute('aria-label', `${LISTS[kind].name} ${i + 1} score`);
    el.querySelector('.missing').checked = row.missing;
    el.querySelector('.btn-remove').setAttribute('aria-label', `Remove ${LISTS[kind].name} ${i + 1}`);
    const late = el.querySelector('.late');
    if (kind === 'homework') late.value = String(row.daysLate);
    else late.remove();
    return el;
  });
  list.replaceChildren(...rows);
  $(`${kind}-empty`).hidden = rows.length > 0;
}

// Shows "counts as 0", late penalties, the dropped quiz, etc. next to each row.
function updateRowFlags() {
  const input = collectInput();
  for (const kind of Object.keys(LISTS)) {
    const rows = [...$(`${kind}-list`).children];
    const counted = input[kind].map((item) =>
      kind === 'homework' ? GradeMath.homeworkScore(item) : GradeMath.itemScore(item));
    const droppedIndex = kind === 'quizzes' && counted.length >= 2
      ? counted.indexOf(Math.min(...counted)) : -1;

    rows.forEach((el, i) => {
      const row = state[kind][i];
      const { problem } = parseScore(row.scoreText);
      const scoreInput = el.querySelector('.score');
      const flag = el.querySelector('.item-counts');
      scoreInput.disabled = row.missing;
      el.classList.toggle('is-missing', row.missing);
      el.classList.toggle('has-problem', !row.missing && problem !== null);
      el.classList.toggle('is-dropped', i === droppedIndex);

      let text = '';
      if (row.missing) text = 'Missing: counts as 0';
      else if (problem) text = PROBLEM_TEXT[problem];
      else if (kind === 'homework' && row.daysLate > 0) text = `Late: counts as ${GradeMath.round1(counted[i])}%`;
      if (i === droppedIndex) text = text ? `${text} · dropped (lowest)` : 'Dropped (lowest)';
      flag.textContent = text;
    });
  }
}

// Only touch a box's value when it differs, so typing isn't interrupted.
function setValue(el, value) {
  if (el.value !== value) el.value = value;
}

function renderSingles() {
  renderSingle('midterm', 'Enter your score, or choose Missing if you skipped it');
  renderSingle('participation', "Not counted until it's graded");
  const midNext = state.nextExam === 'midterm';
  $('midterm-taken').hidden = midNext;
  $('midterm-next').hidden = !midNext;

  $('final-note').textContent = midNext
    ? 'Comes after the midterm. The calculator assumes you score the same as on the midterm.'
    : 'This is your next exam. The results show the score you need.';

  document.querySelector(`input[name="next-exam"][value="${state.nextExam}"]`).checked = true;
  $('goal-gpa').value = state.goalGpa.toFixed(1);
}

// Midterm and participation: a status picker plus a score box.
function renderSingle(key, pendingText) {
  const item = state[key];
  const { problem } = parseScore(item.scoreText);
  $(`${key}-status`).value = item.status;
  setValue($(`${key}-score`), item.scoreText);
  $(`${key}-score`).hidden = item.status !== 'graded';
  const msg = $(`${key}-msg`);
  msg.textContent = item.status === 'missing' ? 'Missing: counts as 0'
    : item.status === 'pending' ? pendingText
    : problem ? PROBLEM_TEXT[problem] : '';
  msg.classList.toggle('is-problem', item.status === 'graded' && !!problem);
}

function buildGoalOptions() {
  const select = $('goal-gpa');
  for (let tenths = 40; tenths >= 10; tenths--) {
    const gpa = tenths / 10;
    const opt = document.createElement('option');
    opt.value = gpa.toFixed(1);
    opt.textContent = `${gpa.toFixed(1)} (${GradeMath.gpaToPercent(gpa)}%+)`;
    select.appendChild(opt);
  }
}

// --- Updating ---------------------------------------------------------------
function update() {
  renderSingles();
  updateRowFlags();
  GradeResults.render(GradeMath.calculate(collectInput()));
  saveState();
}

function renderAll() {
  renderList('homework');
  renderList('quizzes');
  update();
}

function wireEvents() {
  const inputs = $('inputs');

  // Typing in a row or changing its late/missing settings
  const onRowChange = (e) => {
    const el = e.target.closest('.item');
    if (!el) return;
    const row = state[el.dataset.kind][Number(el.dataset.index)];
    if (e.target.classList.contains('score')) row.scoreText = e.target.value;
    else if (e.target.classList.contains('late')) row.daysLate = Number(e.target.value);
    else if (e.target.classList.contains('missing')) row.missing = e.target.checked;
    else return;
    update();
  };
  inputs.addEventListener('input', onRowChange);
  inputs.addEventListener('change', onRowChange);

  inputs.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const kind = add.dataset.add;
      state[kind].push(LISTS[kind].blank());
      renderList(kind);
      update();
      $(`${kind}-list`).lastElementChild.querySelector('.score').focus();
      return;
    }
    const remove = e.target.closest('.btn-remove');
    if (remove) {
      const el = remove.closest('.item');
      state[el.dataset.kind].splice(Number(el.dataset.index), 1);
      renderList(el.dataset.kind);
      update();
    }
  });

  for (const key of ['midterm', 'participation']) {
    $(`${key}-status`).addEventListener('change', (e) => {
      state[key].status = e.target.value;
      update();
      if (e.target.value === 'graded') $(`${key}-score`).focus();
    });
    $(`${key}-score`).addEventListener('input', (e) => { state[key].scoreText = e.target.value; update(); });
  }
  $('goal-gpa').addEventListener('change', (e) => { state.goalGpa = Number(e.target.value); update(); });
  document.querySelectorAll('input[name="next-exam"]').forEach((r) =>
    r.addEventListener('change', (e) => { state.nextExam = e.target.value; update(); }));

  $('load-sample').addEventListener('click', () => { state = sampleState(); renderAll(); });
  $('clear-all').addEventListener('click', () => {
    if (!confirm('Clear all grades?')) return;
    state = emptyState();
    renderAll();
  });
}

function sampleState() {
  return {
    homework: [
      { scoreText: '95', daysLate: 0, missing: false },
      { scoreText: '88', daysLate: 2, missing: false },
      { scoreText: '', daysLate: 0, missing: true },
      { scoreText: '92', daysLate: 0, missing: false },
    ],
    quizzes: [
      { scoreText: '80', missing: false },
      { scoreText: '90', missing: false },
      { scoreText: '100', missing: false },
      { scoreText: '60', missing: false },
    ],
    midterm: { status: 'graded', scoreText: '85' },
    participation: { status: 'graded', scoreText: '100' },
    goalGpa: DEFAULT_GOAL,
    nextExam: 'final',
  };
}

// --- Saving between visits (this browser only) ----------------------------
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.homework) && saved.midterm?.status) return { ...emptyState(), ...saved };
  } catch { /* ignore bad or missing data */ }
  return emptyState();
}

buildGoalOptions();
wireEvents();
renderAll();
