// math.js: MATH AND RESULTS SIDE (owner: Zakariya)
//
// Pure calculation functions. No DOM access here, so this file can be tested
// with Node (`node math.test.js`) and changed without touching the form.
//
// Input shape (built by script.js, see collectInput()):
// {
//   homework:      [{ status: 'graded' | 'missing', score: number|null, daysLate: 0-3 }],
//   quizzes:       [{ status: 'graded' | 'missing', score: number|null }],
//   midterm:       { status: 'graded' | 'missing' | 'pending', score: number|null },  // used only when nextExam is 'final'
//   participation: { status: 'graded' | 'missing' | 'pending', score: number|null },
//   goalGpa:       number,               // e.g. 3.8
//   nextExam:      'midterm' | 'final'
// }
// Scores are percentages (0-100). A null score on a 'graded' item means the
// box was left blank, and it counts as 0 (REQUIREMENTS.md: missing work = 0).

const GradeMath = (() => {
  const CATEGORIES = [
    { key: 'homework',      label: 'Homework',      weight: 20 },
    { key: 'quizzes',       label: 'Quizzes',       weight: 15 },
    { key: 'midterm',       label: 'Midterm',       weight: 25 },
    { key: 'final',         label: 'Final Exam',    weight: 30 },
    { key: 'participation', label: 'Participation', weight: 10 },
  ];

  // Late homework: accepted up to 3 days late, scored at 90% of what it earned
  // (an 80 becomes a 72). Change to subtracting 10 points here if that's the rule.
  const LATE_PENALTY = 0.10;
  const MAX_DAYS_LATE = 3;

  // --- Grading scale (REQUIREMENTS.md) ------------------------------------
  // 95-100 = 4.0, each whole point below 95 drops 0.1, 65 = 1.0, below 65 = 0.0.
  // Fractions are rounded down: 93.9% is still a 3.8.
  function percentToGpa(percent) {
    if (percent === null || !Number.isFinite(percent)) return null;
    const p = Math.round(percent * 1000) / 1000; // avoid 92.99999 float noise
    if (p >= 95) return 4.0;
    if (p < 65) return 0.0;
    return (Math.floor(p) - 55) / 10;
  }

  // Lowest percentage that earns the given GPA.
  function gpaToPercent(gpa) {
    if (gpa >= 4) return 95;
    if (gpa <= 0) return 0;
    return Math.max(65, Math.round(gpa * 10) + 55);
  }

  // --- Single items -------------------------------------------------------
  function clampScore(score) {
    if (score === null || score === undefined || !Number.isFinite(score)) return 0;
    return Math.min(100, Math.max(0, score));
  }

  // Score an item counts for, after the missing/blank rule.
  function itemScore(item) {
    if (!item || item.status === 'missing') return 0;
    return clampScore(item.score);
  }

  function homeworkScore(item) {
    const base = itemScore(item);
    const daysLate = item.daysLate || 0;
    if (daysLate > MAX_DAYS_LATE) return 0; // not accepted
    if (daysLate > 0) return base * (1 - LATE_PENALTY);
    return base;
  }

  const average = (nums) => nums.reduce((a, b) => a + b, 0) / nums.length;

  // --- Categories ---------------------------------------------------------
  // Each returns { average: number|null, note: string }. average is null
  // when nothing has been entered yet (the category isn't graded so far).

  function homeworkCategory(list) {
    if (!list.length) return { average: null, note: 'No homework added yet' };
    const scores = list.map(homeworkScore);
    const late = list.filter((h) => h.daysLate > 0 && h.status !== 'missing').length;
    const zeros = list.filter((h) => h.status === 'missing' || h.score === null).length;
    const parts = [`${list.length} assignment${list.length === 1 ? '' : 's'}`];
    if (late) parts.push(`${late} late (−${LATE_PENALTY * 100}%)`);
    if (zeros) parts.push(`${zeros} counted as 0`);
    return { average: average(scores), note: parts.join(', ') };
  }

  function quizCategory(list) {
    if (!list.length) return { average: null, note: 'No quizzes added yet' };
    const scores = list.map(itemScore);
    if (scores.length === 1) {
      return { average: scores[0], note: '1 quiz (lowest is dropped once there are 2)' };
    }
    const lowest = Math.min(...scores);
    const kept = [...scores];
    kept.splice(kept.indexOf(lowest), 1);
    return {
      average: average(kept),
      note: `${scores.length} quizzes, lowest (${round1(lowest)}%) dropped`,
    };
  }

  function singleCategory(item, pendingNote) {
    if (item.status === 'pending') return { average: null, note: pendingNote };
    if (item.status === 'missing') return { average: 0, note: 'Missing, counted as 0' };
    if (item.score === null) return { average: 0, note: 'Blank, counted as 0' };
    return { average: clampScore(item.score), note: 'Graded' };
  }

  // --- Main calculation ---------------------------------------------------
  function calculate(input) {
    const nextExam = input.nextExam === 'midterm' ? 'midterm' : 'final';
    const goalGpa = input.goalGpa;
    const goalPercent = gpaToPercent(goalGpa);

    const results = {
      homework: homeworkCategory(input.homework || []),
      quizzes: quizCategory(input.quizzes || []),
      midterm: nextExam === 'midterm'
        ? { average: null, note: 'Next exam' }
        : singleCategory(input.midterm, 'Not entered yet'),
      final: { average: null, note: nextExam === 'final' ? 'Next exam' : 'After the midterm' },
      participation: singleCategory(input.participation, 'Not graded yet'),
    };

    const categories = CATEGORIES.map((c) => ({ ...c, ...results[c.key] }));
    const graded = categories.filter((c) => c.average !== null);
    const gradedWeight = graded.reduce((s, c) => s + c.weight, 0);
    // Points earned toward the final grade, out of 100.
    const earned = graded.reduce((s, c) => s + (c.weight * c.average) / 100, 0);
    const currentPercent = gradedWeight ? (earned / gradedWeight) * 100 : null;

    // Exams we solve for: the next exam, plus the final if the midterm is next
    // (assumes the same score on both).
    let solveFor = categories.filter((c) =>
      nextExam === 'midterm' ? c.key === 'midterm' || c.key === 'final' : c.key === 'final');
    // Other ungraded categories (e.g. no quizzes yet) are assumed to end up at
    // the current overall percentage. With nothing graded at all there's no
    // current percentage, so they join the exams we solve for.
    let assumedAtCurrent = categories.filter((c) => c.average === null && !solveFor.includes(c));
    if (currentPercent === null) {
      solveFor = solveFor.concat(assumedAtCurrent);
      assumedAtCurrent = [];
    }

    const assumedPoints = assumedAtCurrent.reduce((s, c) => s + (c.weight * currentPercent) / 100, 0);
    const solveWeight = solveFor.reduce((s, c) => s + c.weight, 0);
    const rawNeeded = ((goalPercent - earned - assumedPoints) / solveWeight) * 100;
    const bestPercent = earned + assumedPoints + solveWeight; // 100% on everything solved for

    let status;
    if (rawNeeded <= 0) status = 'secured';
    else if (rawNeeded > 100) status = 'unreachable';
    else status = 'needed';

    return {
      categories,
      currentPercent,
      currentGpa: percentToGpa(currentPercent),
      goalGpa,
      goalPercent,
      nextExam,
      needed: {
        status,
        score: Math.max(0, Math.ceil(rawNeeded * 10) / 10), // round up so it's enough
        solveFor: solveFor.map((c) => c.key),
        assumedAtCurrent: assumedAtCurrent.map((c) => c.key),
        bestPercent,
        bestGpa: percentToGpa(bestPercent),
      },
    };
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  return {
    CATEGORIES, LATE_PENALTY, MAX_DAYS_LATE,
    percentToGpa, gpaToPercent, itemScore, homeworkScore,
    homeworkCategory, quizCategory, calculate, round1,
  };
})();

if (typeof module !== 'undefined') module.exports = GradeMath;
