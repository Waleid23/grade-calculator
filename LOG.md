# Log

## 2026-11-01
- Added the starter skeleton as agreed with Zakariya: `index.html`, `style.css`,
  `script.js` with a title and empty input and results sections. No calculation
  logic yet.
- Added `PLAN.md` (what we're building, who it's for, proposed input vs.
  math/results split, branch + pull request workflow) and a shared `CLAUDE.md`.

## 2026-11-06
- Added `REQUIREMENTS.md` with the user's answers: South Seattle College,
  laptop, goal 3.8 (93%), five weighted categories, the grading scale, the
  special rules, and open questions to confirm with the user.
- Updated `PLAN.md` with who owns what: Waleid has the input side, Zakariya
  has the math and results side.
- Updated `CLAUDE.md` to point to `REQUIREMENTS.md` and `PLAN.md`.
- Built the working grade calculator, merged to `main` in PR #2.
- Input side (Waleid, per `PLAN.md`): `index.html`, `script.js`,
  `style.css`. Homework rows with days-late and Missing, quiz rows,
  midterm and participation status pickers, goal GPA picker
  (default 3.8), next-exam toggle. Results update as you type and
  are saved in the browser.
- Math and results side (Zakariya's, per `PLAN.md`): Waleid drafted
  a working first version so the calculator could be tested end to
  end, kept in its own files for Zakariya to review and change:
  `math.js` (grading scale, 10% late penalty, lowest-quiz drop,
  missing = 0, weighted average, score needed) and `results.js`
  (results panel).
- The data passed from the input side to the math side is
  documented at the top of `math.js`. Zakariya still needs to agree
  to it, as `PLAN.md` asks.
- Added `math.test.js` (19 tests: `node math.test.js`) and checked
  the page in a browser with sample grades.
- Choices still to confirm with the user: late penalty is 10% of
  the score, percentages round down on the GPA scale, ungraded
  categories are assumed at the current %, and if the midterm is
  next the same score is assumed on the final.
- Merged before Zakariya's review. He can change the math and
  results side in a follow-up pull request.
