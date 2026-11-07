# CLAUDE.md

Shared instructions for Claude Code in this repo. Both teammates use this file.

## Project
A grade calculator web page for a friend: they enter grade categories, weights,
scores so far, and a goal grade, and the page shows the score they need on
their next exam. Plain HTML, CSS and JavaScript (`index.html`, `style.css`,
`script.js`), no build step.

- `REQUIREMENTS.md`: the user's answers (categories, weights, grading scale,
  special rules, open questions). Read it before building features.
- `PLAN.md`: the full plan and who owns which side.

## Team plan
- Two-person team. The starter skeleton was added by agreement between both teammates.
- Split: Waleid owns the **input side** (form, categories, scores,
  validation), Zakariya owns the **math and results side** (calculation and
  displaying the result). See `PLAN.md` for the detailed list.
- Stay within the side the current user owns. If a change would touch the
  other person's side, point it out and ask before making it.

## Workflow
- Each person works on their own branch. Don't commit directly to `main`.
- Changes reach `main` through pull requests.
- Add a dated entry to `LOG.md` when meaningful work is done.
