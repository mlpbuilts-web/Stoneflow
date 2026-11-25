// Site settings.
window.STONEFLOW_CONFIG = {
  company: "Our Stone Studio",
  // Printed on sales orders.
  companyDetails: { address: "Virginia", phone: "999-999-9999", email: "outstonestudio@gmail.com" },
  currency: "USD",
  // Who sees the "things to check in the sheet" notes is set in Netlify: ADMIN_EMAILS (or the owner).
  adminEmails: ["mlpbuilts@gmail.com"],

  // Microsoft sign-in for staff (Azure app registration). The app ID and emails live in Netlify, not here.
  microsoft: {
    clientId: "51eaad3c-733d-40f9-9aed-d898b557325a",                 // leave empty: the site reads it from Netlify (MS_CLIENT_ID)
    tenant: "consumers",
  },

  // The Excel file is opened by the site's server with the owner's OneDrive connection
  // (Netlify variable EXCEL_PATH). Anyone can view stock; staff in ALLOWED_EMAILS can make changes.
  excel: {
    sheet: "",                    // empty = newest month sheet (e.g. "AUG 2026")
    salesLogName: "StoneFlow sales log.csv",
    ordersFileName: "StoneFlow sales orders.csv",
  },

  agentUrl: "/api/agent",
};
