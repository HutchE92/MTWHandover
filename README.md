# MTW Nursing Handover — Proof of Concept

A nursing handover board for a general medical ward, built as a **proof of
concept** and rendered inside a screenshot of the host EPR (Altera Gateway /
Sunrise) so it can be reviewed in context.

> ### No real patient data
>
> Every patient in this tool is fictional. NHS numbers come from the
> `999 000 xxxx` synthetic/test range — they carry valid Modulus 11 check
> digits so format validation behaves realistically, but cannot match a real
> patient. Hospital numbers are invented.
>
> This repository is **public** and the site is served from GitHub Pages with
> no authentication. Nothing entered here is protected, so it must never be
> used with real patient-identifiable data.

## What it does

One row per patient, with these columns left to right:

| Column | Behaviour |
| --- | --- |
| **Patient Details** | Name, DOB, NHS number, hospital number, allergy status, DNACPR status and clinical alerts (safeguarding, falls, delirium, dysphagia…). Editable EDD. Buttons for **Handover History** and **Task History**. |
| **Diagnosis & Past Medical History** | Free text |
| **Additional Nursing Information** | Free text |
| **Tasks** | Add a task with a due date and status. Tick to complete — completed tasks drop off the row and move to Task History. Overdue and due-today are colour-coded. |
| **Nutrition** | Yes/No — *Is the patient currently on fluid restrictions?* — plus free text |
| **Risk Assessments** | Infectious status (free text), risk of falls (Yes/No), MUST completed (Yes/No), MRSA swab taken (date), MRSA swab due (date, flagged when overdue) |
| **Therapy Plans** | Free text |
| **Discharge Plans** | Free text |

### Handover History (audit trail)

Every committed change snapshots the **whole patient row**, stamped with the
date, time and the user who made it. Opening Handover History lists those
snapshots newest first; selecting one shows the row exactly as it stood then.

Text fields commit on blur, so one snapshot represents one edit rather than one
keystroke. Controls (dates, Yes/No, task changes) commit immediately. Snapshots
that would be identical to the previous one are discarded, and the most recent
60 per patient are retained.

## Running it locally

No build step and no dependencies — it is plain HTML, CSS and JavaScript.

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765>. Opening `index.html` directly via `file://`
will not work: the browser blocks the relative asset loads.

## Deploying to GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
The site is static, so it needs no workflow or build.

## The EPR frame

`assets/img/epr-background.png` is a screenshot of the host EPR. The tool is
positioned over that screenshot's work area using percentage insets in
`assets/css/shell.css`:

```css
--region-left:   0.70%;
--region-top:   23.18%;
--region-right:  0.90%;
--region-bottom: 6.49%;
```

To swap in a different screenshot, replace the image, update `--epr-ar` to its
width/height ratio, then press **Shift+A** in the browser for an alignment
overlay that lets you nudge the insets live and copy the resulting CSS.

The board is laid out at a fixed design width (1520px) and scaled to fill that
region, so it keeps the same proportions as the surrounding screenshot at any
window size.

## Limitations to be aware of

These follow from it being a static proof of concept, and would all need a
backend to resolve:

- **State is per-browser.** Entries live in `localStorage` on one device. Two
  nurses on two computers see different data; nothing is shared.
- **There is no authentication.** The "Signed in as" selector exists only to
  attribute audit entries. In a real deployment this would come from the EPR
  session, and the audit trail would be tamper-evident and server-side.
- **The audit trail is local and erasable.** Clearing site data deletes it.
- **Ward and shift selectors are presentational** — one ward of synthetic
  patients is loaded regardless.
- Clearing browser site data, or using a private window, loses everything.

## Layout

```
index.html
assets/
  css/shell.css       EPR frame, work-area alignment, modals
  css/handover.css    the tool itself
  js/config.js        storage key, users, region insets
  js/data.js          synthetic patients (the only patient-shaped data)
  js/app.js           rendering, persistence, audit trail
  img/epr-background.png
```
