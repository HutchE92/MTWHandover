/* Configuration for the handover proof of concept. */
window.HV_CONFIG = {
  /* Storage key for locally persisted entries. Bump the suffix to invalidate
     previously saved demo state. */
  /* Must differ from Option A's key: both variants are served from the same
     origin, so a shared key would let entries and audit history bleed between
     them. */
  storageKey: 'mtw-handover-poc-b-v1',

  /* Work-area insets as percentages of the background image. Kept here as well
     as in shell.css so the Shift+A alignment overlay can report them. */
  region: { left: 0.70, top: 23.18, right: 0.90, bottom: 6.49 },

  taskStatuses: ['Outstanding', 'In progress', 'Awaiting review', 'Blocked'],

  /* The host EPR's tab strip is redrawn over the background screenshot so that
     "Handover" can appear as the selected tab. Labels match the screenshot,
     with Handover inserted second. */
  eprTabs: [
    'Tracking Board', 'Handover', 'Results', 'Orders', 'Documents', 'Flowsheets',
    'Clinical Summary', 'Timeline', 'Patient Info', 'Reporting', 'Visit Record Review',
    'SDM', 'Referral List', 'EDMS', 'Clinical Viewer', 'SCR',
  ],
  eprSelectedTab: 'Handover',

  /* Regions of the background screenshot to paint over, in the image's native
     1920x1243 pixel coordinates. Each patch is filled with real pixels copied
     from `from` — a text-free column of the same rows — so the fill matches
     the underlying gradient exactly instead of approximating it.
     The title bar is horizontally uniform, which is what makes this work. */
  eprPatches: [
    { label: 'address bar URL', x: 904, y: 4, w: 142, h: 20, from: 758 },
  ],

  /* There is no authentication in a static proof of concept, so the audit
     trail attributes changes to whoever is selected here. In a real
     deployment this would come from the EPR session. */
  users: [
    'S. Ahmed (Staff Nurse)',
    'L. Okafor (Staff Nurse)',
    'D. Reid (Ward Sister)',
    'M. Kaur (HCA)',
    'J. Whitfield (Charge Nurse)',
  ],

  /* Snapshots retained per patient before the oldest are discarded. */
  auditLimit: 60,
};
