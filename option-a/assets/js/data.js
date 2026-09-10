/* ---------------------------------------------------------------------------
   Synthetic seed data — a general medical ward.

   NOTHING HERE IS REAL. Names are fictional. NHS numbers come from the
   999 000 xxxx synthetic/test range and carry valid Modulus 11 check digits,
   so format validation behaves realistically while being unable to match a
   real patient. Hospital numbers are invented.

   This file is committed to a public repository. It must never contain
   anything other than test data.

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
        'Community acquired pneumonia — right basal. Day 4 IV co-amoxiclav (allergy: given clarithromycin).\n\nPMH: COPD, hypertension, osteoarthritis, previous TIA 2019.',
      nursing:
        'Assistance of 1 for transfers, uses Zimmer frame. Continent, requests toilet — call bell within reach.\nHard of hearing (right ear) — speak clearly, face patient. Daughter Susan is main contact.',
      nutrition:
        'Soft diet, full assistance not required but encourage. Poor appetite — food chart in progress. Supplements BD.',
      fluidRestriction: 'no',
      therapy:
        'Physio reviewing daily — mobilising 5m with frame, aiming 10m before discharge.\nOT home assessment requested 09/09, awaiting date.',
      discharge:
        'For discharge home with existing package of care (2x daily). Awaiting OT home assessment and TTOs.\nTransport required — daughter unable to collect.',
      risk: {
        infectious: 'Nil known. Standard precautions.',
        falls: 'yes',
        must: 'yes',
        mrsaTaken: '2026-09-06',
        mrsaDue: '2026-09-13',
      },
    },
    seedTasks: [
      { text: 'Repeat bloods — U&Es and CRP', due: '2026-09-09', status: 'Outstanding' },
      { text: 'Chase OT home assessment date', due: '2026-09-10', status: 'In progress' },
      { text: 'Falls risk reassessment due', due: '2026-09-12', status: 'Outstanding' },
    ],
    seedHistory: [
      { text: 'Catheter removed, TWOC commenced', due: '2026-09-08', completedAt: '2026-09-08T14:20', by: 'L. Okafor (Staff Nurse)' },
      { text: 'Waterlow score recalculated', due: '2026-09-07', completedAt: '2026-09-07T09:50', by: 'M. Kaur (HCA)' },
    ],
    seedAudit: [
      { at: '2026-09-10T08:15', by: 'S. Ahmed (Staff Nurse)', change: 'Discharge Plans',
        was: { discharge: 'For discharge home with existing package of care (2x daily). Awaiting OT home assessment.' } },
      { at: '2026-09-09T21:40', by: 'J. Whitfield (Charge Nurse)', change: 'Estimated date of discharge',
        was: { edd: '2026-09-13' } },
      { at: '2026-09-09T14:05', by: 'L. Okafor (Staff Nurse)', change: 'Additional Nursing Information',
        was: { nursing: 'Assistance of 1 for transfers, uses Zimmer frame. Hard of hearing (right ear).' } },
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
        'Decompensated heart failure, NYHA III. Day 5 IV furosemide, now on oral.\n\nPMH: Ischaemic heart disease, CABG 2011, atrial fibrillation (on apixaban), CKD stage 3.',
      nursing:
        'Daily weights before breakfast — record on flowsheet. Strict fluid balance, 1.5L restriction.\nOrthopnoeic — sleeps on 3 pillows. Independent with washing, slow mobilising.',
      nutrition:
        'Low salt diet. Fluid restriction 1.5L/24h — jug chart at bedside, family aware not to bring drinks.',
      fluidRestriction: 'yes',
      therapy: 'Physio input for exercise tolerance. Cardiac rehab referral to be made on discharge.',
      discharge:
        'Home with wife. Needs heart failure nurse follow-up and weight monitoring plan.\nAwaiting echo result before EDD confirmed.',
      risk: {
        infectious: 'Nil known.',
        falls: 'no',
        must: 'yes',
        mrsaTaken: '2026-09-05',
        mrsaDue: '2026-09-12',
      },
    },
    seedTasks: [
      { text: 'Daily weight — record and compare', due: '2026-09-10', status: 'Outstanding' },
      { text: 'Chase echo result', due: '2026-09-11', status: 'Awaiting review' },
      { text: 'Heart failure nurse referral', due: '2026-09-12', status: 'Outstanding' },
    ],
    seedHistory: [
      { text: 'IV to oral furosemide switch', due: '2026-09-09', completedAt: '2026-09-09T11:15', by: 'D. Reid (Ward Sister)' },
    ],
    seedAudit: [
      { at: '2026-09-10T07:55', by: 'M. Kaur (HCA)', change: 'Nutrition',
        was: { nutrition: 'Low salt diet. Fluid restriction 1.5L/24h — jug chart at bedside.' } },
      { at: '2026-09-09T16:20', by: 'D. Reid (Ward Sister)', change: 'Diagnosis & Past Medical History',
        was: { diagnosis: 'Decompensated heart failure, NYHA III. Day 5 IV furosemide.\n\nPMH: Ischaemic heart disease, CABG 2011, atrial fibrillation (on apixaban), CKD stage 3.' } },
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
        'Urinary tract infection with hyperactive delirium. Day 3 IV cefalexin.\n\nPMH: Type 2 diabetes, hypothyroidism, previous UTIs.',
      nursing:
        '4AT score 6 on admission, improving. Reorientate frequently, clock and calendar at bedside.\nWandering at night — bed in view of nurses station. Gujarati first language, family interpret; interpreter available.',
      nutrition:
        'Diabetic diet, vegetarian. BM monitoring QDS. Eating with prompting, family bringing food from home.',
      fluidRestriction: 'no',
      therapy: 'Physio not required currently — mobilising independently. OT to review cognition before discharge.',
      discharge:
        'Home with son and daughter-in-law. Needs delirium information leaflet and GP follow-up for repeat MSU.',
      risk: {
        infectious: 'ESBL E. coli in urine — contact precautions, side room not required.',
        falls: 'yes',
        must: 'yes',
        mrsaTaken: '2026-09-08',
        mrsaDue: '2026-09-15',
      },
    },
    seedTasks: [
      { text: 'Repeat 4AT assessment', due: '2026-09-10', status: 'Outstanding' },
      { text: 'Book interpreter for discharge discussion', due: '2026-09-11', status: 'Outstanding' },
      { text: 'Send repeat MSU', due: '2026-09-12', status: 'Outstanding' },
    ],
    seedHistory: [
      { text: 'Cognitive screen completed', due: '2026-09-08', completedAt: '2026-09-08T10:30', by: 'S. Ahmed (Staff Nurse)' },
    ],
    seedAudit: [
      { at: '2026-09-10T09:30', by: 'S. Ahmed (Staff Nurse)', change: 'Risk Assessments',
        was: { risk: { infectious: 'Query UTI — awaiting sensitivities.', falls: 'yes', must: 'yes', mrsaTaken: '2026-09-08', mrsaDue: '2026-09-15' } } },
      { at: '2026-09-08T22:10', by: 'J. Whitfield (Charge Nurse)', change: 'Additional Nursing Information',
        was: { nursing: '4AT score 6 on admission. Reorientate frequently. Gujarati first language.' } },
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
        'Infective exacerbation of COPD. Day 4 oral prednisolone and doxycycline. Weaned off nebulisers to inhalers 09/09.\n\nPMH: COPD (FEV1 42%), type 2 diabetes, ex-smoker 40 pack years.',
      nursing:
        'Sats target 88–92% — 1L via nasal specs overnight only. Self-caring, independent mobility.\nCapillary BMs raised on steroids — sliding scale not required, monitoring QDS.',
      nutrition: 'Diabetic diet. Good appetite. No concerns.',
      fluidRestriction: 'no',
      therapy:
        'Respiratory physio for airway clearance — self-managing well. Pulmonary rehab referral made 08/09.',
      discharge:
        'Home alone, daughter nearby. For discharge once steroid course reviewed. Needs inhaler technique check and rescue pack.',
      risk: {
        infectious: 'Nil known. Standard precautions.',
        falls: 'no',
        must: 'yes',
        mrsaTaken: '2026-09-07',
        mrsaDue: '2026-09-14',
      },
    },
    seedTasks: [
      { text: 'Inhaler technique teaching before discharge', due: '2026-09-11', status: 'Outstanding' },
      { text: 'TTOs to be ordered — include rescue pack', due: '2026-09-11', status: 'Outstanding' },
      { text: 'Confirm pulmonary rehab appointment', due: '2026-09-14', status: 'Awaiting review' },
    ],
    seedHistory: [
      { text: 'Weaned from nebulisers to inhalers', due: '2026-09-09', completedAt: '2026-09-09T13:45', by: 'L. Okafor (Staff Nurse)' },
      { text: 'Pulmonary rehab referral submitted', due: '2026-09-08', completedAt: '2026-09-08T15:10', by: 'S. Ahmed (Staff Nurse)' },
    ],
    seedAudit: [
      { at: '2026-09-09T18:00', by: 'L. Okafor (Staff Nurse)', change: 'Therapy Plans',
        was: { therapy: 'Respiratory physio for airway clearance. Pulmonary rehab referral to be made.' } },
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
        'Recurrent falls with deconditioning and dehydration on admission. Query poor home circumstances.\n\nPMH: Alzheimer\'s dementia (moderate), atrial fibrillation, previous fractured wrist 2024.',
      nursing:
        'Enhanced observation (1:1 overnight) — high falls risk, attempts to self-mobilise without frame.\nPressure area care 2-hourly, Waterlow 20. Grade 1 redness to sacrum, barrier cream applied.\nFull assistance with personal care. Becomes distressed early evening.',
      nutrition:
        'Full assistance at mealtimes. Food and fluid chart in place. Fortified diet plus supplements TDS. Dietitian reviewed 08/09.',
      fluidRestriction: 'no',
      therapy:
        'Physio — sit to stand with assistance of 2. OT completing functional assessment for placement decision.',
      discharge:
        'Not for discharge home. Safeguarding referral open, best interests meeting to be arranged.\nLikely 24-hour care placement — social worker allocated 09/09. No EDD until meeting held.',
      risk: {
        infectious: 'Nil known.',
        falls: 'yes',
        must: 'yes',
        mrsaTaken: '2026-09-02',
        mrsaDue: '2026-09-09',
      },
    },
    seedTasks: [
      { text: 'Pressure area check and reposition', due: '2026-09-10', status: 'In progress' },
      { text: 'Safeguarding referral — follow up with team', due: '2026-09-09', status: 'Outstanding' },
      { text: 'MRSA swab overdue — send today', due: '2026-09-09', status: 'Outstanding' },
      { text: 'Best interests meeting — confirm attendees', due: '2026-09-15', status: 'Outstanding' },
    ],
    seedHistory: [
      { text: 'Dietitian referral and review', due: '2026-09-08', completedAt: '2026-09-08T11:20', by: 'D. Reid (Ward Sister)' },
      { text: 'Waterlow reassessed — score 20', due: '2026-09-08', completedAt: '2026-09-08T08:05', by: 'M. Kaur (HCA)' },
      { text: 'Safeguarding referral submitted', due: '2026-09-06', completedAt: '2026-09-06T16:40', by: 'J. Whitfield (Charge Nurse)' },
    ],
    seedAudit: [
      { at: '2026-09-10T06:45', by: 'M. Kaur (HCA)', change: 'Additional Nursing Information',
        was: { nursing: 'Enhanced observation (1:1 overnight) — high falls risk.\nPressure area care 2-hourly, Waterlow 20.\nFull assistance with personal care.' } },
      { at: '2026-09-09T15:30', by: 'D. Reid (Ward Sister)', change: 'Discharge Plans',
        was: { discharge: 'Not for discharge home. Safeguarding referral open. Awaiting social worker allocation.' } },
      { at: '2026-09-09T10:05', by: 'S. Ahmed (Staff Nurse)', change: 'Therapy Plans',
        was: { therapy: 'Physio — sit to stand with assistance of 2.' } },
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
        'Decompensated alcoholic liver disease with ascites. Ascitic drain removed 08/09.\n\nPMH: Alcohol dependence, previous variceal bleed 2023, hypertension.',
      nursing:
        'CIWA scoring 4-hourly, chlordiazepoxide reducing regime — day 4. Pabrinex as prescribed.\nDaily weights and abdominal girth. Strict fluid balance. Mobilising independently but unsteady.',
      nutrition:
        'High calorie, high protein diet. Dietitian reviewing. Thiamine and multivitamins prescribed. Salt restricted.',
      fluidRestriction: 'yes',
      therapy: 'Physio for deconditioning. Alcohol liaison team reviewing — engagement good.',
      discharge:
        'Home alone. Not medically fit — awaiting resolution of ascites.\nAlcohol liaison to arrange community follow-up before discharge.',
      risk: {
        infectious: 'Nil known.',
        falls: 'yes',
        must: 'yes',
        mrsaTaken: '2026-09-04',
        mrsaDue: '2026-09-11',
      },
    },
    seedTasks: [
      { text: 'CIWA score — 4-hourly', due: '2026-09-10', status: 'In progress' },
      { text: 'Daily weight and abdominal girth', due: '2026-09-10', status: 'Outstanding' },
      { text: 'Fluid balance chart — ensure totalled at 24h', due: '2026-09-08', status: 'Blocked' },
      { text: 'Alcohol liaison follow-up review', due: '2026-09-11', status: 'Awaiting review' },
    ],
    seedHistory: [
      { text: 'Ascitic drain removed, site dressed', due: '2026-09-08', completedAt: '2026-09-08T13:00', by: 'D. Reid (Ward Sister)' },
      { text: 'Dietitian referral submitted', due: '2026-09-06', completedAt: '2026-09-06T09:35', by: 'L. Okafor (Staff Nurse)' },
    ],
    seedAudit: [
      { at: '2026-09-10T04:20', by: 'J. Whitfield (Charge Nurse)', change: 'Additional Nursing Information',
        was: { nursing: 'CIWA scoring 4-hourly, chlordiazepoxide reducing regime — day 3. Pabrinex as prescribed.\nDaily weights and abdominal girth. Strict fluid balance.' } },
      { at: '2026-09-08T14:15', by: 'D. Reid (Ward Sister)', change: 'Diagnosis & Past Medical History',
        was: { diagnosis: 'Decompensated alcoholic liver disease with ascites. Ascitic drain in situ.\n\nPMH: Alcohol dependence, previous variceal bleed 2023, hypertension.' } },
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
        'CKD stage 4 with fluid overload. Responding to IV diuresis, now oral.\n\nPMH: Chronic kidney disease, heart failure, type 2 diabetes, hypertension.',
      nursing:
        'Daily weights, strict fluid balance — 1L restriction. Legs elevated when in chair.\nBilateral pitting oedema to knees, improving. Skin intact but fragile — emollient BD.',
      nutrition: 'Low potassium, low salt diet. Renal dietitian reviewed 07/09. Appetite fair.',
      fluidRestriction: 'yes',
      therapy: 'Physio for mobility and stair practice — lives in first floor flat, no lift.',
      discharge:
        'Lives alone. Package of care to be restarted (was in place until July).\nCommunity matron referral sent 08/09. Needs stair assessment before discharge.',
      risk: {
        infectious: 'Nil known.',
        falls: 'yes',
        must: 'yes',
        mrsaTaken: '2026-09-03',
        mrsaDue: '2026-09-10',
      },
    },
    seedTasks: [
      { text: 'Daily weight and fluid balance review', due: '2026-09-10', status: 'Outstanding' },
      { text: 'MRSA swab due today', due: '2026-09-10', status: 'Outstanding' },
      { text: 'Confirm POC restart date with social services', due: '2026-09-12', status: 'In progress' },
      { text: 'Physio stair assessment', due: '2026-09-13', status: 'Awaiting review' },
    ],
    seedHistory: [
      { text: 'Community matron referral sent', due: '2026-09-08', completedAt: '2026-09-08T13:30', by: 'S. Ahmed (Staff Nurse)' },
      { text: 'Renal dietitian review arranged', due: '2026-09-07', completedAt: '2026-09-07T10:15', by: 'L. Okafor (Staff Nurse)' },
    ],
    seedAudit: [
      { at: '2026-09-10T08:40', by: 'S. Ahmed (Staff Nurse)', change: 'Tasks',
        was: {} },
      { at: '2026-09-09T12:25', by: 'L. Okafor (Staff Nurse)', change: 'Discharge Plans',
        was: { discharge: 'Lives alone. Package of care to be restarted (was in place until July).\nCommunity matron referral sent 08/09.' } },
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
        'Left MCA ischaemic stroke, day 6. Right sided weakness and expressive dysphasia.\n\nPMH: Atrial fibrillation, hypertension, previous MI 2016.',
      nursing:
        'Right arm and leg weakness — assistance of 2 for transfers with hoist. Positioning chart in use.\nExpressive dysphasia — use communication board, allow time. Continent with 2-hourly toileting.\nPressure area care 2-hourly, Waterlow 17.',
      nutrition:
        'SALT assessed 08/09 — Level 4 puree diet and Level 2 mildly thick fluids. Full assistance required, sit upright 90°.\nSupervise all oral intake. NG feed overnight as supplement.',
      fluidRestriction: 'no',
      therapy:
        'Stroke MDT. Physio daily — sitting balance improving. SALT reviewing swallow twice weekly.\nOT assessing seating and upper limb function.',
      discharge:
        'For stroke rehabilitation unit transfer when bed available — referral accepted 09/09.\nWife visiting daily, keen to be involved in care.',
      risk: {
        infectious: 'Nil known. Standard precautions.',
        falls: 'yes',
        must: 'yes',
        mrsaTaken: '2026-09-05',
        mrsaDue: '2026-09-12',
      },
    },
    seedTasks: [
      { text: 'Positioning and pressure area care 2-hourly', due: '2026-09-10', status: 'In progress' },
      { text: 'SALT swallow review', due: '2026-09-11', status: 'Awaiting review' },
      { text: 'Chase stroke rehab bed availability', due: '2026-09-11', status: 'Outstanding' },
      { text: 'Weekly weight', due: '2026-09-13', status: 'Outstanding' },
    ],
    seedHistory: [
      { text: 'SALT assessment completed', due: '2026-09-08', completedAt: '2026-09-08T14:50', by: 'D. Reid (Ward Sister)' },
      { text: 'Stroke rehab referral submitted', due: '2026-09-08', completedAt: '2026-09-08T09:20', by: 'S. Ahmed (Staff Nurse)' },
      { text: 'NG tube sited and position confirmed', due: '2026-09-06', completedAt: '2026-09-06T18:30', by: 'J. Whitfield (Charge Nurse)' },
    ],
    seedAudit: [
      { at: '2026-09-09T17:10', by: 'D. Reid (Ward Sister)', change: 'Discharge Plans',
        was: { discharge: 'For stroke rehabilitation unit transfer when bed available — referral submitted 08/09.' } },
      { at: '2026-09-08T15:05', by: 'S. Ahmed (Staff Nurse)', change: 'Nutrition',
        was: { nutrition: 'Nil by mouth pending SALT assessment. NG feed in progress.', fluidRestriction: 'no' } },
    ],
  },
];
