# MEU Aegis

MEU Aegis is a static GitHub Pages platform for participant wellbeing, daily safety feedback, Safe Person support requests, confidential reports and operational issue routing.

The frontend is public and static. Google Apps Script is the backend layer that writes to Google Sheets, creates Drive folders, stores optional evidence files and serves the restricted dashboard.

## What You Upload To GitHub Pages

- `index.html`
- `styles.css`
- `app.js`
- `config.js`
- `assets/`

Do not upload only the Apps Script folder to GitHub Pages as a backend. The files in `google-apps-script/` must be pasted into Google Apps Script.

## Google Sheet And Drive Setup

1. Create a new Google Sheet named `MEU AEGIS Database`.
2. Open the Sheet.
3. Go to `Extensions -> Apps Script`.
4. Delete the default code.
5. Paste everything from `google-apps-script/Code.gs`.
6. In Apps Script, open `Project Settings`.
7. Enable `Show appsscript.json manifest file in editor`.
8. Open `appsscript.json` and paste everything from `google-apps-script/appsscript.json`.
9. Save the project.
10. Select the function `setupAegis`.
11. Click `Run`.
12. Authorize Google Sheets and Google Drive access.
13. Open `Executions` or `Logs` and copy the generated Sheet and Drive links if you need them.

The script creates these Sheet tabs:

- `Participants`
- `Daily_Pulse`
- `Pulse_Risk_Flags`
- `Support_Requests`
- `Confidential_Reports`
- `Case_Actions`
- `Operational_Tickets`
- `Evidence_Index`
- `Daily_Digest`
- `Access_Audit`

The script also creates this Drive structure:

- `MEU_AEGIS / 00 Governance & Policies`
- `MEU_AEGIS / 01 Daily Pulse Responses - Restricted`
- `MEU_AEGIS / 02 Safe Person Cases - Safe Persons Only`
- `MEU_AEGIS / 03 Evidence Vault - Restricted by Case ID`
- `MEU_AEGIS / 04 Operational Tickets - Need-to-Know`
- `MEU_AEGIS / 05 Anonymized Reports & Dashboards`
- `MEU_AEGIS / 99 Archive - Retention Controlled`

## Deploy Apps Script As Web App

1. In Apps Script, click `Deploy -> New deployment`.
2. Choose `Web app`.
3. Description: `MEU Aegis API`.
4. Execute as: `Me`.
5. Who has access: `Anyone with the link`.
6. Click `Deploy`.
7. Copy the Web App URL ending in `/exec`.
8. Open `config.js`.
9. Paste the URL:

```js
window.AEGIS_CONFIG = {
  API_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
};
```

## Dashboard Access

The restricted dashboard is loaded from Google Sheets through Apps Script and requires:

```text
safepersonmeutm
```

The password is stored in Script Properties as `DASHBOARD_PASSWORD` when `setupAegis()` runs. Change that property if you need to rotate the password.

## GitHub Pages Deployment

1. Create a GitHub repository.
2. Upload the platform files from this folder.
3. Go to `Settings -> Pages`.
4. Deploy from the main branch root.
5. Open the GitHub Pages link.
6. Submit one test Daily Pulse.
7. Check that the row appears in the Google Sheet.
8. Open the restricted dashboard and enter `safepersonmeutm`.
9. Delete test data before launch.

## Production Checks

- Restrict raw Sheet and Drive access to Safe Persons and authorized HR/legal roles.
- Keep leadership reporting aggregated.
- Test the platform on phone before creating the QR code.
- Run at least one fake confidential report with a small upload to verify Drive evidence storage.
- After testing, remove all fake participant data.
