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

## Who owns what
See `REQUIREMENTS.md` for the user's categories, grading scale and rules.

- **Input side: Waleid**
  - the five categories with their weights (Homework 20%, Quizzes 15%,
    Midterm 25%, Final Exam 30%, Participation 10%)
  - individual quiz scores
  - homework scores, each with a days-late option
  - midterm and participation scores
  - a goal GPA picker
  - choosing which exam is next (midterm or final)
- **Math and results side: Zakariya**
  - converting the goal GPA to a percentage using the grading scale
  - dropping the lowest quiz
  - applying the late homework penalty
  - counting blanks as zero
  - the weighted average
  - showing the score needed on the next exam

We'll agree early on the shape of the data passed from the input side to the
math side, so the two halves fit together.

## How we work
- Each of us works on our own branch.
- Changes go into `main` through pull requests, not direct pushes.
- We keep `LOG.md` updated with what was done and when.
