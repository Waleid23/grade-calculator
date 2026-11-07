// Tests for math.js. Run with: node math.test.js
const assert = require('node:assert/strict');
const M = require('./math.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); process.exitCode = 1; }
}
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg || ''} expected ${b}, got ${a}`);
const g = (score) => ({ status: 'graded', score });
const hw = (score, daysLate = 0) => ({ status: 'graded', score, daysLate });
const base = (over) => ({
  homework: [], quizzes: [],
  midterm: { status: 'pending', score: null },
  participation: { status: 'pending', score: null },
  goalGpa: 3.8, nextExam: 'final', ...over,
});

console.log('Grading scale');
test('percent -> GPA matches REQUIREMENTS.md', () => {
  const table = [[100, 4.0], [95, 4.0], [94.99, 3.9], [94, 3.9], [93, 3.8], [90, 3.5],
    [85, 3.0], [80, 2.5], [75, 2.0], [70, 1.5], [65, 1.0], [64.99, 0], [64, 0], [0, 0]];
  for (const [p, gpa] of table) close(M.percentToGpa(p), gpa, `${p}%:`);
});
test('GPA -> minimum percent', () => {
  const table = [[4.0, 95], [3.9, 94], [3.8, 93], [3.5, 90], [3.3, 88], [3.0, 85], [1.0, 65]];
  for (const [gpa, p] of table) assert.equal(M.gpaToPercent(gpa), p, `GPA ${gpa}`);
});
test('every goal GPA round-trips through the scale', () => {
  for (let t = 10; t <= 40; t++) close(M.percentToGpa(M.gpaToPercent(t / 10)), t / 10, `GPA ${t / 10}:`);
});

console.log('Special rules');
test('late homework loses 10% of its score, up to 3 days', () => {
  close(M.homeworkScore(hw(80, 0)), 80);
  close(M.homeworkScore(hw(80, 1)), 72);
  close(M.homeworkScore(hw(80, 3)), 72);
  close(M.homeworkScore(hw(80, 4)), 0, 'more than 3 days late is not accepted:');
});
test('missing and blank work count as 0', () => {
  close(M.homeworkScore({ status: 'missing', score: null, daysLate: 2 }), 0);
  close(M.itemScore(g(null)), 0);
  close(M.homeworkCategory([hw(100), { status: 'missing', score: null, daysLate: 0 }]).average, 50);
});
test('lowest quiz is dropped', () => {
  close(M.quizCategory([g(80), g(90), g(100), g(60)]).average, 90);
});
test('a missing quiz is the one dropped', () => {
  close(M.quizCategory([g(80), { status: 'missing', score: null }, g(100)]).average, 90);
});
test('one quiz: nothing dropped', () => {
  close(M.quizCategory([g(70)]).average, 70);
});
test('no quizzes / no homework: category not graded yet', () => {
  assert.equal(M.quizCategory([]).average, null);
  assert.equal(M.homeworkCategory([]).average, null);
});

console.log('Full calculation');
// Sample: HW 95, 88 (2 days late -> 79.2), missing, 92 -> 66.55
//         Quizzes 80, 90, 100, 60 -> drop 60 -> 90
//         Midterm 85, Participation 100
// Earned = 13.31 + 13.5 + 21.25 + 10 = 58.06 out of 70 -> 82.94%
const sample = base({
  homework: [hw(95), hw(88, 2), { status: 'missing', score: null, daysLate: 0 }, hw(92)],
  quizzes: [g(80), g(90), g(100), g(60)],
  midterm: g(85),
  participation: g(100),
});
test('sample: current percent and GPA', () => {
  const r = M.calculate(sample);
  close(r.currentPercent, (58.06 / 70) * 100);
  close(r.currentGpa, 2.7);
});
test('sample, goal 3.8 (93%): unreachable, best is 88.06% = 3.3', () => {
  const r = M.calculate(sample);
  assert.equal(r.goalPercent, 93);
  assert.equal(r.needed.status, 'unreachable');
  close(r.needed.bestPercent, 88.06);
  close(r.needed.bestGpa, 3.3);
});
test('sample, goal 3.3 (88%): needs 99.8% on the final', () => {
  const r = M.calculate({ ...sample, goalGpa: 3.3 });
  assert.equal(r.needed.status, 'needed');
  close(r.needed.score, 99.8);
});
test('goal already secured', () => {
  const r = M.calculate(base({
    homework: [hw(100)], quizzes: [g(100)], midterm: g(100), participation: g(100), goalGpa: 1.0,
  }));
  assert.equal(r.needed.status, 'secured');
  assert.equal(r.needed.score, 0);
});
test('ungraded categories are assumed at the current percentage', () => {
  // HW 90 + midterm 90 -> current 90%. Quizzes and participation assumed 90.
  const r = M.calculate(base({ homework: [hw(90)], midterm: g(90), goalGpa: 3.5 }));
  close(r.currentPercent, 90);
  assert.deepEqual(r.needed.assumedAtCurrent, ['quizzes', 'participation']);
  close(r.needed.score, 90);
});
test('nothing entered, midterm next: need the goal % on everything', () => {
  const r = M.calculate(base({ nextExam: 'midterm' }));
  assert.equal(r.currentPercent, null);
  assert.equal(r.currentGpa, null);
  close(r.needed.score, 93);
  assert.deepEqual(r.needed.solveFor.sort(), ['final', 'homework', 'midterm', 'participation', 'quizzes']);
});
test('midterm next: same score assumed on midterm and final', () => {
  // HW 100, quizzes 100, participation 100 -> earned 45 of 45.
  // Need 93: (93 - 45) / 55 = 87.27 -> rounds up to 87.3
  const r = M.calculate(base({
    nextExam: 'midterm', homework: [hw(100)], quizzes: [g(100)], participation: g(100),
    midterm: g(20), // ignored, since the midterm hasn't happened
  }));
  assert.deepEqual(r.needed.solveFor, ['midterm', 'final']);
  close(r.needed.score, 87.3);
});
test('blank midterm (final next) counts as 0', () => {
  const r = M.calculate(base({ homework: [hw(100)], midterm: g(null) }));
  close(r.currentPercent, (20 / 45) * 100);
});

test('midterm not entered yet: not counted, assumed at current', () => {
  const r = M.calculate(base({ homework: [hw(80)] }));
  close(r.currentPercent, 80);
  assert.ok(r.needed.assumedAtCurrent.includes('midterm'));
});
test('fresh page (nothing entered, final next): need 93% on everything left', () => {
  const r = M.calculate(base({}));
  assert.equal(r.currentPercent, null);
  close(r.needed.score, 93);
});

console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
