// results.js: MATH AND RESULTS SIDE (owner: Zakariya)
//
// Shows the output of GradeMath.calculate() in the #results panel.
// Reads nothing from the form; it only gets the result object.

const GradeResults = (() => {
  const $ = (id) => document.getElementById(id);
  const fmtPct = (n) => `${GradeMath.round1(n)}%`;
  const fmtGpa = (n) => n.toFixed(1);
  const labelOf = (key) => GradeMath.CATEGORIES.find((c) => c.key === key).label;

  function joinLabels(keys) {
    const names = keys.map(labelOf);
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }

  function render(r) {
    // Current percentage and GPA
    $('current-percent').textContent = r.currentPercent === null ? '—' : fmtPct(r.currentPercent);
    $('current-gpa').textContent = r.currentGpa === null ? '—' : fmtGpa(r.currentGpa);
    $('goal-gpa-out').textContent = fmtGpa(r.goalGpa);
    $('goal-percent-out').textContent = `needs ${r.goalPercent}%+`;

    renderProgress(r);
    renderNeeded(r);
    renderBreakdown(r);
  }

  function renderProgress(r) {
    const bar = $('progress-fill');
    const text = $('progress-text');
    if (r.currentPercent === null) {
      bar.style.width = '0%';
      bar.className = 'progress-fill';
      text.textContent = 'Enter some grades to see your progress.';
      return;
    }
    const ratio = Math.min(1, r.currentPercent / r.goalPercent);
    bar.style.width = `${ratio * 100}%`;
    const gap = r.goalPercent - r.currentPercent;
    bar.className = 'progress-fill' + (gap <= 0 ? ' is-done' : '');
    text.textContent = gap <= 0
      ? `You're ${GradeMath.round1(-gap)} points above your ${r.goalPercent}% goal so far.`
      : `You're ${GradeMath.round1(gap)} points below your ${r.goalPercent}% goal so far.`;
  }

  function renderNeeded(r) {
    const n = r.needed;
    const box = $('needed');
    const exam = r.nextExam === 'midterm' ? 'midterm' : 'final exam';
    let big, line;

    if (n.status === 'secured') {
      box.dataset.state = 'good';
      big = '0%';
      line = `Your goal of ${fmtGpa(r.goalGpa)} is reached even with a 0 on the ${exam}.`;
    } else if (n.status === 'unreachable') {
      box.dataset.state = 'bad';
      big = `${n.score}%`;
      line = `Not reachable: even 100% on the ${exam} gets you about ${fmtPct(n.bestPercent)} `
        + `(GPA ${fmtGpa(n.bestGpa)}). Try a lower goal.`;
    } else {
      box.dataset.state = n.score >= 90 ? 'warn' : 'ok';
      big = `${n.score}%`;
      line = `Score this or higher on the ${exam} to reach a ${fmtGpa(r.goalGpa)} (${r.goalPercent}%).`;
    }

    $('needed-label').textContent = `Needed on your ${exam}`;
    $('needed-score').textContent = big;
    $('needed-line').textContent = line;

    const notes = [];
    if (r.nextExam === 'midterm') {
      notes.push('Assumes you get the same score on the final exam.');
    }
    const examsAsked = r.nextExam === 'midterm' ? ['midterm', 'final'] : ['final'];
    const extraSolved = n.solveFor.filter((k) => !examsAsked.includes(k));
    if (extraSolved.length) {
      notes.push(`Nothing graded yet, so this assumes the same score on ${joinLabels(extraSolved)} too.`);
    }
    if (n.assumedAtCurrent.length) {
      notes.push(`${joinLabels(n.assumedAtCurrent)} ha${n.assumedAtCurrent.length === 1 ? 's' : 've'} `
        + `no grades yet, so ${n.assumedAtCurrent.length === 1 ? 'it is' : 'they are'} `
        + `assumed to end at your current ${fmtPct(r.currentPercent)}.`);
    }
    const ul = $('needed-notes');
    ul.replaceChildren(...notes.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
  }

  function renderBreakdown(r) {
    const rows = r.categories.map((c) => {
      const tr = document.createElement('tr');
      if (c.average === null) tr.className = 'is-pending';
      const cells = [
        c.label,
        `${c.weight}%`,
        c.average === null ? '—' : fmtPct(c.average),
        c.note,
      ];
      cells.forEach((t) => tr.appendChild(Object.assign(document.createElement('td'), { textContent: t })));
      return tr;
    });
    $('breakdown-body').replaceChildren(...rows);
  }

  return { render };
})();
