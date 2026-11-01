# Plan

## What we're building
A single web page grade calculator. The user enters:
- their class's grade categories (e.g. Homework, Midterm, Final)
- the weight of each category
- their scores so far in each category
- the overall grade they want to end up with

The page then shows the score they need on their next exam to reach that goal.

## Who it's for
A friend who wants a quick way to work out what they need on an upcoming exam.

## Team
We're a team of two. Zakariya and I agreed that I'd add a starter skeleton
(`index.html`, `style.css`, `script.js`) with a title and empty sections for
inputs and results, and no calculation logic yet. We build on it from there.

## Proposed split
This is a proposal; we'll confirm who takes which side.

- **Input side:** the form for categories, weights, scores and the goal grade,
  plus adding/removing categories and validating input (e.g. weights add up
  to 100%).
- **Math and results side:** the calculation of the current grade and the
  score needed on the next exam, and how the result is shown (including cases
  like "goal already reached" or "goal not reachable").

We'll agree early on the shape of the data passed from the input side to the
math side, so the two halves fit together.

## How we work
- Each of us works on our own branch.
- Changes go into `main` through pull requests, not direct pushes.
- We keep `LOG.md` updated with what was done and when.
