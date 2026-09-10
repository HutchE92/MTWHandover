/* Configuration for the handover proof of concept. */
window.HV_CONFIG = {
  /* Storage key for locally persisted entries. Bump the suffix to invalidate
     previously saved demo state. */
  storageKey: 'mtw-handover-poc-v2',

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
