/* ---------------------------------------------------------------------------
   Synthetic seed data — a general medical ward. OPTION B.

   NOTHING HERE IS REAL. Names are fictional. NHS numbers come from the
   999 000 xxxx synthetic/test range and carry valid Modulus 11 check digits,
   so format validation behaves realistically while being unable to match a
   real patient. Hospital numbers are invented.

   Option B uses five free-text columns instead of Option A's eight mixed
   columns. Risk scores, infectious status, MRSA swab dates and diet all live
   inside `nursing` here rather than in a separate Risk Assessments or
   Nutrition column.

   `seedAudit` entries carry a `was` map: the previous value of whatever the
   entry changed. The app reconstructs each historic snapshot by applying those
   overrides to the seeded row state, so the demo opens with a believable audit
   trail rather than an empty one.
   --------------------------------------------------------------------------- */

window.HV_PATIENTS = [
  {
    id: 'p1',
    bed: 'Bed 01',
    name: 'HOLLIS, Margaret',
    dob: '1936-02-11',
    nhsNumber: '999 000 0018',
    hospitalNumber: 'MTW1042318',
    allergies: 'Penicillin (rash)',
    dnacpr: true,
    alerts: ['Falls risk', 'Hard of hearing'],
    edd: '2026-09-15',
    seed: {
      diagnosis:
        'Community acquired pneumonia — right basal. Day 4 IV co-amoxiclav (allergy: given clarithromycin).\n\nPMHx: COPD, hypertension, osteoarthritis, previous TIA 2019.',
      nursing:
        'Assistance of 1 for transfers, uses Zimmer frame. Continent, requests toilet — call bell within reach.\nHard of hearing (right ear) — speak clearly, face patient. Daughter Susan is main contact.\n\nRisk scores: Waterlow 15. Falls risk — yes, reassessment due 12/09. MUST completed.\nInfectious status: nil known, standard precautions. MRSA swab taken 06/09, next due 13/09.\nDiet: soft diet, encourage intake. Poor appetite — food chart in progress. Supplements BD.',
      therapies:
        'PT: reviewing daily — mobilising 5m with frame, aiming 10m before discharge.\nOT: home assessment requested 09/09, awaiting date. Will need stair and kitchen assessment.',
      medical:
        'Consultant review 10/09 (Dr Aldridge): CRP falling, 96 to 41. Afebrile 24h.\nPlan — complete clarithromycin, day 4 of 5. Repeat U&Es and CRP today. If bloods satisfactory and remains afebrile, medically fit from 11/09.\nNo change to inhalers. Continue prophylactic LMWH.',
      discharge:
        'For discharge home with existing package of care (2x daily).\nPending: OT home assessment date, TTOs, transport booking.\nDaughter unable to collect — hospital transport required.',
    },
    seedAudit: [
      { at: '2026-09-10T08:15', by: 'S. Ahmed (Staff Nurse)', change: 'Discharge Planning',
        was: { discharge: 'For discharge home with existing package of care (2x daily).\nPending: OT home assessment date, TTOs.' } },
      { at: '2026-09-10T07:40', by: 'Dr M. Aldridge (Consultant)', change: 'Medical / Surgical',
        was: { medical: 'Consultant review 09/09: CRP 96. Continue IV antibiotics and review in 24h.' } },
      { at: '2026-09-09T21:40', by: 'J. Whitfield (Charge Nurse)', change: 'Estimated date of discharge',
        was: { edd: '2026-09-13' } },
    ],
  },

  {
    id: 'p2',
    bed: 'Bed 02',
    name: 'BRENNAN, Arthur',
    dob: '1941-07-24',
    nhsNumber: '999 000 0085',
    hospitalNumber: 'MTW1038204',
    allergies: '',
    dnacpr: true,
    alerts: ['Fluid restriction 1.5L'],
    edd: '2026-09-17',
    seed: {
      diagnosis:
        'Decompensated heart failure, NYHA III. Day 5 IV furosemide, now converted to oral.\n\nPMHx: Ischaemic heart disease, CABG 2011, atrial fibrillation (on apixaban), CKD stage 3.',
      nursing:
        'Daily weights before breakfast — record on flowsheet. Strict fluid balance, 1.5L restriction.\nOrthopnoeic — sleeps on 3 pillows. Independent with washing, slow mobilising with stick.\n\nRisk scores: Waterlow 12. Falls risk — no. MUST completed.\nInfectious status: nil known. MRSA swab taken 05/09, next due 12/09.\nDiet: low salt. Fluid restricted 1.5L/24h — jug chart at bedside, family aware not to bring drinks.',
      therapies:
        'PT: exercise tolerance work, mobilising 20m on the flat.\nCardiac rehab referral to be made on discharge. No OT needs identified.',
      medical:
        'Ward round 10/09 (Dr Nayar): weight down 4.2kg since admission. Creatinine stable at 132.\nPlan — continue oral furosemide 40mg BD. Await echo before confirming EDD. Consider spironolactone once renal function confirmed stable.\nApixaban continued at reduced dose.',
      discharge:
        'Home with wife, who provides support. Ground floor flat, no stairs.\nPending: echo result, heart failure nurse referral, weight monitoring plan and scales at home.',
    },
    seedAudit: [
      { at: '2026-09-10T09:05', by: 'Dr P. Nayar (Registrar)', change: 'Medical / Surgical',
        was: { medical: 'Ward round 09/09: weight down 3.1kg. Continue IV furosemide, review for oral switch tomorrow.' } },
      { at: '2026-09-09T16:20', by: 'D. Reid (Ward Sister)', change: 'Nursing',
        was: { nursing: 'Daily weights before breakfast. Strict fluid balance, 1.5L restriction.\nOrthopnoeic — sleeps on 3 pillows.\n\nRisk scores: Waterlow 12. Falls risk — no. MUST completed.\nInfectious status: nil known. MRSA swab taken 05/09, next due 12/09.\nDiet: low salt. Fluid restricted 1.5L/24h.' } },
    ],
  },

  {
    id: 'p3',
    bed: 'Bed 03',
    name: 'PATEL, Kamla',
    dob: '1944-03-08',
    nhsNumber: '999 000 0158',
    hospitalNumber: 'MTW1041877',
    allergies: 'Trimethoprim (nausea)',
    dnacpr: false,
    alerts: ['Delirium — 4AT positive'],
    edd: '2026-09-14',
    seed: {
      diagnosis:
        'Urinary tract infection with hyperactive delirium. Day 3 IV cefalexin.\n\nPMHx: Type 2 diabetes, hypothyroidism, recurrent UTIs.',
      nursing:
        '4AT score 6 on admission, now 3 and improving. Reorientate frequently, clock and calendar at bedside.\nWandering at night — bed within sight of nurses station. Gujarati first language; family interpret, formal interpreter available.\n\nRisk scores: Waterlow 14. Falls risk — yes, bed rails discussed with family. MUST completed.\nInfectious status: ESBL E. coli in urine — contact precautions, side room not required. MRSA swab taken 08/09, next due 15/09.\nDiet: diabetic, vegetarian. BMs QDS. Eating with prompting, family bringing food from home.',
      therapies:
        'PT: not required — mobilising independently, steady.\nOT: to review cognition and function before discharge, particularly medication management.',
      medical:
        'Ward round 10/09 (Dr Chen): clinically improving, apyrexial 48h. Sensitivities confirm cefalexin appropriate.\nPlan — complete 5 days IV then oral to total 7 days. Repeat MSU on completion. Delirium screen sent, B12 and folate normal.\nHold metformin while inpatient, restart on discharge.',
      discharge:
        'Home with son and daughter-in-law, who are present daily.\nPending: OT cognitive review, interpreter for discharge discussion, delirium information leaflet, GP follow-up for repeat MSU.',
    },
    seedAudit: [
      { at: '2026-09-10T09:30', by: 'S. Ahmed (Staff Nurse)', change: 'Nursing',
        was: { nursing: '4AT score 6 on admission. Reorientate frequently, clock and calendar at bedside.\nWandering at night. Gujarati first language.\n\nRisk scores: Waterlow 14. Falls risk — yes. MUST completed.\nInfectious status: query UTI, awaiting sensitivities. MRSA swab taken 08/09, next due 15/09.\nDiet: diabetic, vegetarian. BMs QDS.' } },
      { at: '2026-09-09T11:15', by: 'Dr L. Chen (SHO)', change: 'Medical / Surgical',
        was: { medical: 'Ward round 09/09: still intermittently pyrexial. Continue IV antibiotics, chase sensitivities.' } },
    ],
  },

  {
    id: 'p4',
    bed: 'Bed 04',
    name: 'OSBORNE, Derek',
    dob: '1949-11-30',
    nhsNumber: '999 000 0220',
    hospitalNumber: 'MTW1039650',
    allergies: '',
    dnacpr: false,
    alerts: [],
    edd: '2026-09-12',
    seed: {
      diagnosis:
        'Infective exacerbation of COPD. Day 4 oral prednisolone and doxycycline. Weaned from nebulisers to inhalers 09/09.\n\nPMHx: COPD (FEV1 42%), type 2 diabetes, ex-smoker 40 pack years.',
      nursing:
        'Sats target 88–92% — 1L via nasal specs overnight only, off oxygen by day.\nSelf-caring, independent mobility. Capillary BMs raised on steroids, monitoring QDS — no sliding scale needed.\n\nRisk scores: Waterlow 10. Falls risk — no. MUST completed.\nInfectious status: nil known, standard precautions. MRSA swab taken 07/09, next due 14/09.\nDiet: diabetic. Good appetite, no concerns.',
      therapies:
        'PT: respiratory physio for airway clearance — self-managing well, discharged from PT caseload.\nPulmonary rehab referral submitted 08/09. No OT needs.',
      medical:
        'Ward round 10/09 (Dr Nayar): sats 91% on air, chest clear of wheeze. Completing 5 days prednisolone.\nPlan — medically fit for discharge 11/09. Needs inhaler technique confirmed and a rescue pack on TTOs.\nDiscussed steroid effect on BMs; no change to metformin.',
      discharge:
        'Home alone, daughter lives nearby and visits daily.\nPending: inhaler technique teaching, TTOs including rescue pack, pulmonary rehab appointment confirmation.',
    },
    seedAudit: [
      { at: '2026-09-09T18:00', by: 'L. Okafor (Staff Nurse)', change: 'Therapies',
        was: { therapies: 'PT: respiratory physio for airway clearance.\nPulmonary rehab referral to be made.' } },
    ],
  },

  {
    id: 'p5',
    bed: 'Bed 05',
    name: 'WHITTAKER, Joan',
    dob: '1933-05-19',
    nhsNumber: '999 000 0298',
    hospitalNumber: 'MTW1040012',
    allergies: 'Latex, Ibuprofen',
    dnacpr: true,
    alerts: ['Safeguarding concern — referral open', 'Dementia', 'Enhanced observation'],
    edd: '',
    seed: {
      diagnosis:
        'Recurrent falls with deconditioning and dehydration on admission. Query inadequate home circumstances.\n\nPMHx: Alzheimer\'s dementia (moderate), atrial fibrillation, fractured wrist 2024.',
      nursing:
        'Enhanced observation, 1:1 overnight — high falls risk, attempts to self-mobilise without frame.\nFull assistance with personal care. Becomes distressed early evening; familiar staff help.\n\nRisk scores: Waterlow 20 — grade 1 redness to sacrum, barrier cream applied, repositioning 2-hourly. Falls risk — yes, 3 falls at home in 6 weeks. MUST completed, score 2.\nInfectious status: nil known. MRSA swab taken 02/09, next due 09/09 — OVERDUE, please send.\nDiet: full assistance at mealtimes. Food and fluid chart. Fortified diet plus supplements TDS, dietitian reviewed 08/09.',
      therapies:
        'PT: sit to stand with assistance of 2. Limited by cognition and fatigue.\nOT: completing functional assessment to inform placement decision. Joint session with PT planned.',
      medical:
        'Consultant review 09/09 (Dr Aldridge): no acute medical issue. Bloods normalised after rehydration.\nPlan — no further investigation. Medically fit, but discharge blocked pending safeguarding and placement.\nCapacity assessed as lacking for discharge destination; best interests process under way.',
      discharge:
        'Not for discharge home. Safeguarding referral open, social worker allocated 09/09.\nLikely 24-hour care placement. Best interests meeting to be arranged — no EDD until held.\nPending: meeting date and attendees, family notified, placement search.',
    },
    seedAudit: [
      { at: '2026-09-10T06:45', by: 'M. Kaur (HCA)', change: 'Nursing',
        was: { nursing: 'Enhanced observation, 1:1 overnight — high falls risk.\nFull assistance with personal care.\n\nRisk scores: Waterlow 20. Falls risk — yes. MUST completed, score 2.\nInfectious status: nil known. MRSA swab taken 02/09, next due 09/09.\nDiet: full assistance at mealtimes. Fortified diet plus supplements TDS.' } },
      { at: '2026-09-09T15:30', by: 'D. Reid (Ward Sister)', change: 'Discharge Planning',
        was: { discharge: 'Not for discharge home. Safeguarding referral open. Awaiting social worker allocation.' } },
      { at: '2026-09-09T10:05', by: 'S. Ahmed (Staff Nurse)', change: 'Therapies',
        was: { therapies: 'PT: sit to stand with assistance of 2.' } },
    ],
  },

  {
    id: 'p6',
    bed: 'Bed 06',
    name: 'MCGRATH, Sean',
    dob: '1958-09-02',
    nhsNumber: '999 000 0360',
    hospitalNumber: 'MTW1043391',
    allergies: 'Codeine (vomiting)',
    dnacpr: false,
    alerts: ['Alcohol withdrawal — CIWA'],
    edd: '2026-09-19',
    seed: {
      diagnosis:
        'Decompensated alcoholic liver disease with ascites. Ascitic drain removed 08/09.\n\nPMHx: Alcohol dependence, variceal bleed 2023, hypertension.',
      nursing:
        'CIWA scoring 4-hourly, chlordiazepoxide reducing regime — day 4. Pabrinex as prescribed.\nDaily weights and abdominal girth. Strict fluid balance — chart not always totalled at 24h, please ensure completed.\nMobilising independently but unsteady.\n\nRisk scores: Waterlow 13. Falls risk — yes, unsteady gait. MUST completed, score 2.\nInfectious status: nil known. MRSA swab taken 04/09, next due 11/09.\nDiet: high calorie, high protein, salt restricted. Thiamine and multivitamins. Dietitian reviewing.',
      therapies:
        'PT: mobility and deconditioning work, tolerating well.\nAlcohol liaison team reviewing — engagement good, attending sessions.',
      medical:
        'Ward round 10/09 (Dr Chen): girth reduced 6cm since drain. Bilirubin 68, falling. Albumin 28.\nPlan — continue spironolactone and furosemide, monitor U&Es alternate days. Repeat USS in one week.\nNot medically fit until ascites stable. Endoscopy surveillance to be arranged as outpatient.',
      discharge:
        'Home alone, first floor flat.\nPending: ascites stabilised, alcohol liaison community follow-up arranged, outpatient endoscopy booked, GP letter re monitoring.',
    },
    seedAudit: [
      { at: '2026-09-10T04:20', by: 'J. Whitfield (Charge Nurse)', change: 'Nursing',
        was: { nursing: 'CIWA scoring 4-hourly, chlordiazepoxide reducing regime — day 3. Pabrinex as prescribed.\nDaily weights and abdominal girth. Strict fluid balance.\n\nRisk scores: Waterlow 13. Falls risk — yes. MUST completed, score 2.\nInfectious status: nil known. MRSA swab taken 04/09, next due 11/09.\nDiet: high calorie, high protein, salt restricted.' } },
      { at: '2026-09-08T14:15', by: 'Dr L. Chen (SHO)', change: 'Diagnosis and PMHx',
        was: { diagnosis: 'Decompensated alcoholic liver disease with ascites. Ascitic drain in situ.\n\nPMHx: Alcohol dependence, variceal bleed 2023, hypertension.' } },
    ],
  },

  {
    id: 'p7',
    bed: 'Bed 07',
    name: 'ADEYEMI, Florence',
    dob: '1946-12-15',
    nhsNumber: '999 000 0433',
    hospitalNumber: 'MTW1037788',
    allergies: 'Morphine (confusion)',
    dnacpr: false,
    alerts: ['Lives alone', 'Fluid restriction 1L'],
    edd: '2026-09-16',
    seed: {
      diagnosis:
        'CKD stage 4 with fluid overload. Responding to IV diuresis, now oral.\n\nPMHx: Chronic kidney disease, heart failure, type 2 diabetes, hypertension.',
      nursing:
        'Daily weights, strict fluid balance — 1L restriction. Legs elevated when sitting out.\nBilateral pitting oedema to knees, improving. Skin intact but fragile — emollient BD, handle with care.\n\nRisk scores: Waterlow 16. Falls risk — yes. MUST completed.\nInfectious status: nil known. MRSA swab taken 03/09, next due 10/09 — due today.\nDiet: low potassium, low salt. Renal dietitian reviewed 07/09. Appetite fair.',
      therapies:
        'PT: mobility and stair practice — lives in a first floor flat with no lift, stair assessment booked.\nOT: to assess kitchen and bathroom, may need equipment before discharge.',
      medical:
        'Ward round 10/09 (Dr Nayar): weight down 5.1kg. Creatinine 246, eGFR 18 — stable for her baseline. K+ 4.8.\nPlan — continue oral furosemide 80mg OD. Renal team advised no dialysis planning at present, review in clinic.\nStop nephrotoxics. Avoid morphine — causes confusion.',
      discharge:
        'Lives alone. Package of care to be restarted — was in place until July.\nCommunity matron referral sent 08/09.\nPending: POC restart date from social services, PT stair assessment, OT equipment, renal clinic appointment.',
    },
    seedAudit: [
      { at: '2026-09-10T08:40', by: 'S. Ahmed (Staff Nurse)', change: 'Nursing',
        was: { nursing: 'Daily weights, strict fluid balance — 1L restriction. Legs elevated when sitting out.\nBilateral pitting oedema to knees. Skin fragile — emollient BD.\n\nRisk scores: Waterlow 16. Falls risk — yes. MUST completed.\nInfectious status: nil known. MRSA swab taken 03/09, next due 10/09.\nDiet: low potassium, low salt. Appetite fair.' } },
      { at: '2026-09-09T12:25', by: 'L. Okafor (Staff Nurse)', change: 'Discharge Planning',
        was: { discharge: 'Lives alone. Package of care to be restarted — was in place until July.\nCommunity matron referral sent 08/09.' } },
    ],
  },

  {
    id: 'p8',
    bed: 'Bed 09',
    name: 'CLARKE, Ronald',
    dob: '1939-04-27',
    nhsNumber: '999 000 0506',
    hospitalNumber: 'MTW1042905',
    allergies: '',
    dnacpr: true,
    alerts: ['Dysphagia — thickened fluids L2', 'Communication difficulty'],
    edd: '2026-09-22',
    seed: {
      diagnosis:
        'Left MCA ischaemic stroke, day 6. Right sided weakness and expressive dysphasia.\n\nPMHx: Atrial fibrillation, hypertension, myocardial infarction 2016.',
      nursing:
        'Right arm and leg weakness — assistance of 2 for transfers with hoist. Positioning chart in use.\nExpressive dysphasia — use communication board, allow time. Continent with 2-hourly toileting.\nWife visiting daily and keen to be involved in care.\n\nRisk scores: Waterlow 17 — repositioning 2-hourly, skin intact. Falls risk — yes. MUST completed, score 2.\nInfectious status: nil known, standard precautions. MRSA swab taken 05/09, next due 12/09.\nDiet: SALT assessed 08/09 — Level 4 puree and Level 2 mildly thick fluids. Full assistance, sit upright 90°, supervise all intake. Overnight NG feed as supplement.',
      therapies:
        'Stroke MDT weekly. PT: daily — sitting balance improving, standing with 2 and frame.\nSALT: reviewing swallow twice weekly, next 11/09.\nOT: assessing seating and upper limb function, splint under consideration.',
      medical:
        'Stroke consultant review 09/09 (Dr Whitmore): CT confirms left MCA infarct, no haemorrhagic transformation.\nPlan — apixaban started day 5 for AF. BP target below 140 systolic, amlodipine added. Statin commenced.\nSwallow remains unsafe for normal diet; continue modified consistency per SALT.',
      discharge:
        'For transfer to the stroke rehabilitation unit when a bed is available — referral accepted 09/09.\nPending: bed availability, transfer letter, wife updated on likely timescale.',
    },
    seedAudit: [
      { at: '2026-09-09T17:10', by: 'D. Reid (Ward Sister)', change: 'Discharge Planning',
        was: { discharge: 'For transfer to the stroke rehabilitation unit when a bed is available — referral submitted 08/09.' } },
      { at: '2026-09-09T13:00', by: 'Dr S. Whitmore (Consultant)', change: 'Medical / Surgical',
        was: { medical: 'Stroke consultant review 08/09: awaiting repeat CT before starting anticoagulation.' } },
      { at: '2026-09-08T15:05', by: 'S. Ahmed (Staff Nurse)', change: 'Nursing',
        was: { nursing: 'Right arm and leg weakness — assistance of 2 for transfers with hoist.\nExpressive dysphasia — use communication board.\n\nRisk scores: Waterlow 17. Falls risk — yes. MUST completed, score 2.\nInfectious status: nil known. MRSA swab taken 05/09, next due 12/09.\nDiet: nil by mouth pending SALT assessment. NG feed in progress.' } },
    ],
  },
];
