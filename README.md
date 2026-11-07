# Grade Calculator

A one-page calculator for a South Seattle College class. Enter
your grades so far and a goal GPA, and it shows the score you
need on your next exam.

## How to use
**Use it online:** https://waleid23.github.io/grade-calculator/

Or open `index.html` in a browser. Nothing to install.
Click **Fill sample grades** to try it.

- Add a row for every homework and quiz that's been assigned and
  is due. Work that isn't due yet isn't added and isn't counted.
- Didn't turn it in? Tick **Missing**: it counts as 0.
- Pick your goal GPA (default 3.8) and whether the midterm or the
  final is next.

## Grading rules
Homework 20%, Quizzes 15%, Midterm 25%, Final Exam 30%,
Participation 10%. The lowest quiz is dropped, late homework
(up to 3 days) loses 10%, and missing work counts as 0.
95%+ = 4.0, and each point lower drops 0.1 (93% = 3.8). Below
65% = 0.0. Full details in `REQUIREMENTS.md`.

## Files
- `index.html`, `style.css`, `script.js`: input side (Waleid)
- `math.js`, `results.js`: math and results side (Zakariya)
- `math.test.js`: tests, run with `node math.test.js`
- `REQUIREMENTS.md`, `PLAN.md`, `LOG.md`: requirements, plan
  and who owns what, work log
