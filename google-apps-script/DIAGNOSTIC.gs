function helloAegis() {
  Logger.log("MEU Aegis diagnostic started.");
  return "Hello from MEU Aegis";
}

function testSheetOnly() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("No active Google Sheet found. Open Apps Script from Extensions -> Apps Script inside the Sheet.");
  }

  let sheet = spreadsheet.getSheetByName("AEGIS_Test");
  if (!sheet) {
    sheet = spreadsheet.insertSheet("AEGIS_Test");
  }

  sheet.getRange(1, 1).setValue("MEU Aegis Sheets access OK");
  Logger.log("Sheet OK: " + spreadsheet.getUrl());
  return "Google Sheets access OK";
}

function testDriveOnly() {
  const folders = DriveApp.getFoldersByName("MEU_AEGIS_Test");
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("MEU_AEGIS_Test");
  Logger.log("Drive OK: " + folder.getUrl());
  return "Google Drive access OK";
}
