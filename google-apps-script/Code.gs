const AEGIS_CONFIG = {
  spreadsheetName: "MEU AEGIS Database",
  rootFolderName: "MEU_AEGIS",
  dashboardPassword: "safepersonmeutm",
  timezone: "Europe/Bucharest"
};

const AEGIS_HEADERS = {
  Participants: [
    "Participant_ID",
    "Participant_Code",
    "Name",
    "Email",
    "Phone",
    "Delegation",
    "Role",
    "Accommodation",
    "Emergency_Contact_Flag",
    "Notes"
  ],
  Daily_Pulse: [
    "Pulse_ID",
    "Submission_Timestamp",
    "Activity_Date",
    "Participant_Code",
    "Participant_Name",
    "Email",
    "Phone",
    "Delegation",
    "Mood_Score",
    "Stress_Score",
    "Fatigue_Score",
    "Safety_Feeling",
    "Respect_Feeling",
    "Inclusion_Feeling",
    "Discomfort_Today",
    "SafePerson_Awareness",
    "Logistics_Rating",
    "Practical_Issues",
    "Social_Safety",
    "Pressure_Concern",
    "Transport_Return",
    "Contact_Request",
    "Open_Note",
    "Risk_Score",
    "Risk_Flag",
    "Risk_Reasons",
    "Followup_Created",
    "Source",
    "Consent"
  ],
  Pulse_Risk_Flags: [
    "Flag_ID",
    "Created_At",
    "Source_Type",
    "Source_ID",
    "Case_ID",
    "Severity",
    "Risk_Score",
    "Reason",
    "Contact_Request",
    "Owner",
    "Status",
    "Due_Date"
  ],
  Support_Requests: [
    "Request_ID",
    "Case_ID",
    "Created_At",
    "Source",
    "Participant_Code",
    "Participant_Name",
    "Email",
    "Phone",
    "Urgency",
    "Preferred_Channel",
    "Desired_Support",
    "Consent_Boundary",
    "Message",
    "Severity",
    "Status",
    "Owner",
    "Due_Date",
    "Consent"
  ],
  Confidential_Reports: [
    "Report_ID",
    "Case_ID",
    "Created_At",
    "Participant_Code",
    "Participant_Name",
    "Email",
    "Phone",
    "Report_Type",
    "Urgency",
    "Narrative",
    "Incident_Date",
    "Incident_Time",
    "Location",
    "People_Involved",
    "Visibility",
    "Desired_Step",
    "Contact_Preference",
    "Severity",
    "Status",
    "Owner",
    "Due_Date",
    "Evidence_Folder_URL",
    "Evidence_File_URLS",
    "Consent"
  ],
  Case_Actions: [
    "Action_ID",
    "Case_ID",
    "Created_At",
    "Owner",
    "Action_Type",
    "Note",
    "Next_Action",
    "Due_Date",
    "Status",
    "Severity"
  ],
  Operational_Tickets: [
    "Ticket_ID",
    "Created_At",
    "Source",
    "Source_ID",
    "Category",
    "Priority",
    "Location",
    "Description",
    "Participant_Code",
    "Email",
    "Status",
    "Assigned_Team",
    "Due_Date",
    "Evidence_File_URLS",
    "Consent"
  ],
  Evidence_Index: [
    "Evidence_ID",
    "Created_At",
    "Related_Type",
    "Related_ID",
    "Case_ID",
    "Ticket_ID",
    "File_Name",
    "Mime_Type",
    "Size_Bytes",
    "Drive_File_ID",
    "Drive_URL",
    "Folder_URL",
    "Retention_Status"
  ],
  Daily_Digest: [
    "Digest_ID",
    "Date",
    "Created_At",
    "Response_Count",
    "Safety_Climate_Pct",
    "Avg_Mood",
    "Avg_Stress",
    "Avg_Fatigue",
    "Contact_Requests",
    "Open_Risk_Flags",
    "Open_Cases",
    "Open_Tickets",
    "Recommended_Actions"
  ],
  Access_Audit: [
    "Audit_ID",
    "Timestamp",
    "Action",
    "Actor",
    "Result",
    "Detail"
  ]
};

const AEGIS_FOLDERS = {
  governance: "00 Governance & Policies",
  dailyPulse: "01 Daily Pulse Responses - Restricted",
  safeCases: "02 Safe Person Cases - Safe Persons Only",
  evidence: "03 Evidence Vault - Restricted by Case ID",
  operations: "04 Operational Tickets - Need-to-Know",
  reports: "05 Anonymized Reports & Dashboards",
  archive: "99 Archive - Retention Controlled"
};

function setupAegis() {
  let stage = "starting setup";
  try {
    const props = PropertiesService.getScriptProperties();
    let spreadsheet;
    const existingSpreadsheetId = props.getProperty("SPREADSHEET_ID");

    stage = "opening or creating spreadsheet";
    if (existingSpreadsheetId) {
      spreadsheet = SpreadsheetApp.openById(existingSpreadsheetId);
    } else {
      spreadsheet = getActiveOrCreateSpreadsheet_();
      props.setProperty("SPREADSHEET_ID", spreadsheet.getId());
    }

    stage = "creating Drive root folder";
    const root = getOrCreateRootFolder_();
    props.setProperty("DRIVE_ROOT_ID", root.getId());

    stage = "creating Drive subfolders";
    Object.keys(AEGIS_FOLDERS).forEach(function (key) {
      const folder = getOrCreateChildFolder_(root, AEGIS_FOLDERS[key]);
      props.setProperty("DRIVE_FOLDER_" + key.toUpperCase(), folder.getId());
    });

    stage = "creating Google Sheet tabs";
    Object.keys(AEGIS_HEADERS).forEach(function (sheetName) {
      Logger.log("Creating/checking tab: " + sheetName);
      ensureSheet_(spreadsheet, sheetName, AEGIS_HEADERS[sheetName]);
    });

    stage = "saving dashboard password";
    if (!props.getProperty("DASHBOARD_PASSWORD")) {
      props.setProperty("DASHBOARD_PASSWORD", AEGIS_CONFIG.dashboardPassword);
    }

    SpreadsheetApp.flush();

    Logger.log("MEU AEGIS setup complete");
    Logger.log("Spreadsheet: " + spreadsheet.getUrl());
    Logger.log("Drive root: " + root.getUrl());
    Logger.log("Dashboard password: " + props.getProperty("DASHBOARD_PASSWORD"));

    return {
      spreadsheetUrl: spreadsheet.getUrl(),
      driveRootUrl: root.getUrl(),
      dashboardPassword: props.getProperty("DASHBOARD_PASSWORD")
    };
  } catch (error) {
    Logger.log("MEU AEGIS setup failed at stage: " + stage);
    Logger.log(error && error.stack ? error.stack : error);
    throw new Error("MEU AEGIS setup failed at stage: " + stage + ". " + (error.message || error));
  }
}

function testAegisAccess() {
  const spreadsheet = getActiveOrCreateSpreadsheet_();
  const root = getOrCreateRootFolder_();
  Logger.log("Sheets access OK: " + spreadsheet.getName());
  Logger.log("Drive access OK: " + root.getName());
  return "Sheets and Drive access OK";
}

function doGet() {
  return json_({
    ok: true,
    service: "MEU Aegis Google Workspace backend",
    version: "2026.05.19"
  });
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = body.action || "ping";

    if (action === "ping") {
      return json_({
        ok: true,
        service: "MEU Aegis Google Workspace backend",
        version: "2026.05.19"
      });
    }

    if (action === "submitDailyPulse") {
      return json_(withLock_(function () {
        return submitDailyPulse_(body.payload || {}, body.files || []);
      }));
    }

    if (action === "submitSupportRequest") {
      return json_(withLock_(function () {
        return submitSupportRequest_(body.payload || {});
      }));
    }

    if (action === "submitConfidentialReport") {
      return json_(withLock_(function () {
        return submitConfidentialReport_(body.payload || {}, body.files || []);
      }));
    }

    if (action === "submitOperationalTicket") {
      return json_(withLock_(function () {
        return submitOperationalTicket_(body.payload || {}, body.files || []);
      }));
    }

    if (action === "getDashboard") {
      return json_(getDashboard_(body));
    }

    if (action === "generateDailyDigest") {
      return json_(withLock_(function () {
        return generateDailyDigest_(body);
      }));
    }

    throw new Error("Unknown action: " + action);
  } catch (error) {
    return json_({
      ok: false,
      error: error.message || String(error)
    });
  }
}

function submitDailyPulse_(payload, files) {
  const data = cleanPayload_(payload);
  requireConsent_(data);

  const pulseId = newId_("PULSE");
  const now = nowIso_();
  const risk = evaluateDailyPulse_(data);
  const practicalIssues = listToText_(data.practicalIssues);
  let caseId = "";
  let ticketId = "";
  let followupCreated = "No";

  const needsContact = hasMeaningfulValue_(data.contactRequest) && data.contactRequest !== "No";
  if (needsContact) {
    caseId = newId_("CASE");
    followupCreated = "Yes";
    appendObject_("Support_Requests", {
      Request_ID: newId_("REQ"),
      Case_ID: caseId,
      Created_At: now,
      Source: "Daily Pulse",
      Participant_Code: data.participantCode,
      Participant_Name: data.participantName,
      Email: data.email,
      Phone: data.phone,
      Urgency: contactRequestToUrgency_(data.contactRequest),
      Preferred_Channel: data.email ? "Email" : "Safe Person follow-up",
      Desired_Support: "Follow-up requested from daily pulse",
      Consent_Boundary: "Safe Person only",
      Message: data.openNote,
      Severity: risk.severity,
      Status: "New",
      Owner: "",
      Due_Date: dueDateFor_(risk.severity),
      Consent: data.consent
    });
    appendObject_("Case_Actions", {
      Action_ID: newId_("ACTION"),
      Case_ID: caseId,
      Created_At: now,
      Owner: "",
      Action_Type: "Intake created",
      Note: "Created automatically from daily pulse contact request.",
      Next_Action: "Safe Person triage",
      Due_Date: dueDateFor_(risk.severity),
      Status: "New",
      Severity: risk.severity
    });
  }

  if (data.logisticsRating === "No" || practicalIssues) {
    ticketId = newId_("TICKET");
    appendObject_("Operational_Tickets", {
      Ticket_ID: ticketId,
      Created_At: now,
      Source: "Daily Pulse",
      Source_ID: pulseId,
      Category: practicalIssues || "Logistics",
      Priority: risk.score >= 5 ? "High" : "Medium",
      Location: "",
      Description: data.openNote || "Practical issue flagged in daily pulse.",
      Participant_Code: data.participantCode,
      Email: data.email,
      Status: "New",
      Assigned_Team: ownerForCategory_(practicalIssues),
      Due_Date: dueDateFor_("Medium"),
      Evidence_File_URLS: "",
      Consent: data.consent
    });
  }

  appendObject_("Daily_Pulse", {
    Pulse_ID: pulseId,
    Submission_Timestamp: now,
    Activity_Date: data.activityDate || today_(),
    Participant_Code: data.participantCode,
    Participant_Name: data.participantName,
    Email: data.email,
    Phone: data.phone,
    Delegation: data.delegation,
    Mood_Score: data.moodScore,
    Stress_Score: data.stressScore,
    Fatigue_Score: data.fatigueScore,
    Safety_Feeling: data.safetyFeeling,
    Respect_Feeling: data.respectFeeling,
    Inclusion_Feeling: data.inclusionFeeling,
    Discomfort_Today: data.discomfortToday,
    SafePerson_Awareness: data.safePersonAwareness,
    Logistics_Rating: data.logisticsRating,
    Practical_Issues: practicalIssues,
    Social_Safety: data.socialSafety,
    Pressure_Concern: data.pressureConcern,
    Transport_Return: data.transportReturn,
    Contact_Request: data.contactRequest,
    Open_Note: data.openNote,
    Risk_Score: risk.score,
    Risk_Flag: risk.flag ? "Yes" : "No",
    Risk_Reasons: risk.reasons.join("; "),
    Followup_Created: followupCreated,
    Source: "GitHub Pages",
    Consent: data.consent
  });

  if (risk.flag) {
    appendRiskFlag_("Daily Pulse", pulseId, caseId, risk, data.contactRequest);
  }

  return {
    ok: true,
    id: pulseId,
    caseId: caseId,
    ticketId: ticketId,
    riskFlag: risk.flag
  };
}

function submitSupportRequest_(payload) {
  const data = cleanPayload_(payload);
  requireConsent_(data);

  const requestId = newId_("REQ");
  const caseId = newId_("CASE");
  const now = nowIso_();
  const severity = severityFromUrgency_(data.urgency, "Support request");

  appendObject_("Support_Requests", {
    Request_ID: requestId,
    Case_ID: caseId,
    Created_At: now,
    Source: "Safe Person Request",
    Participant_Code: data.participantCode,
    Participant_Name: data.participantName,
    Email: data.email,
    Phone: data.phone,
    Urgency: data.urgency,
    Preferred_Channel: data.preferredChannel,
    Desired_Support: data.desiredSupport,
    Consent_Boundary: data.consentBoundary,
    Message: data.message,
    Severity: severity,
    Status: "New",
    Owner: "",
    Due_Date: dueDateFor_(severity),
    Consent: data.consent
  });

  appendObject_("Case_Actions", {
    Action_ID: newId_("ACTION"),
    Case_ID: caseId,
    Created_At: now,
    Owner: "",
    Action_Type: "Intake created",
    Note: "Safe Person support request submitted by participant.",
    Next_Action: "Contact participant through preferred channel",
    Due_Date: dueDateFor_(severity),
    Status: "New",
    Severity: severity
  });

  appendRiskFlag_("Support Request", requestId, caseId, {
    severity: severity,
    score: severity === "Critical" ? 10 : severity === "High" ? 7 : 4,
    reasons: ["Participant requested Safe Person support"],
    flag: true
  }, data.urgency);

  return {
    ok: true,
    id: requestId,
    caseId: caseId,
    riskFlag: true
  };
}

function submitConfidentialReport_(payload, files) {
  const data = cleanPayload_(payload);
  requireConsent_(data);

  const reportId = newId_("REPORT");
  const caseId = newId_("CASE");
  const now = nowIso_();
  const severity = severityFromUrgency_(data.urgency, data.reportType);
  const evidenceFolder = getCaseEvidenceFolder_(caseId);
  const savedFiles = saveFiles_(files || [], evidenceFolder, {
    relatedType: "Confidential Report",
    relatedId: reportId,
    caseId: caseId,
    ticketId: ""
  });

  appendObject_("Confidential_Reports", {
    Report_ID: reportId,
    Case_ID: caseId,
    Created_At: now,
    Participant_Code: data.participantCode,
    Participant_Name: data.participantName,
    Email: data.email,
    Phone: data.phone,
    Report_Type: data.reportType,
    Urgency: data.urgency,
    Narrative: data.narrative,
    Incident_Date: data.incidentDate,
    Incident_Time: data.incidentTime,
    Location: data.location,
    People_Involved: data.peopleInvolved,
    Visibility: data.visibility,
    Desired_Step: data.desiredStep,
    Contact_Preference: data.contactPreference,
    Severity: severity,
    Status: "New",
    Owner: "",
    Due_Date: dueDateFor_(severity),
    Evidence_Folder_URL: evidenceFolder.getUrl(),
    Evidence_File_URLS: savedFiles.join("; "),
    Consent: data.consent
  });

  appendObject_("Case_Actions", {
    Action_ID: newId_("ACTION"),
    Case_ID: caseId,
    Created_At: now,
    Owner: "",
    Action_Type: "Intake created",
    Note: "Confidential situation report submitted.",
    Next_Action: "Safe Person triage",
    Due_Date: dueDateFor_(severity),
    Status: "New",
    Severity: severity
  });

  appendRiskFlag_("Confidential Report", reportId, caseId, {
    severity: severity,
    score: severity === "Critical" ? 10 : severity === "High" ? 8 : 5,
    reasons: [data.reportType || "Confidential report submitted"],
    flag: true
  }, data.contactPreference);

  return {
    ok: true,
    id: reportId,
    caseId: caseId,
    riskFlag: true
  };
}

function submitOperationalTicket_(payload, files) {
  const data = cleanPayload_(payload);
  requireConsent_(data);

  const ticketId = newId_("TICKET");
  const folder = getOperationalTicketFolder_(ticketId);
  const savedFiles = saveFiles_(files || [], folder, {
    relatedType: "Operational Ticket",
    relatedId: ticketId,
    caseId: "",
    ticketId: ticketId
  });

  appendObject_("Operational_Tickets", {
    Ticket_ID: ticketId,
    Created_At: nowIso_(),
    Source: "Practical Issue Form",
    Source_ID: "",
    Category: data.category,
    Priority: data.priority,
    Location: data.location,
    Description: data.description,
    Participant_Code: data.participantCode,
    Email: data.email,
    Status: "New",
    Assigned_Team: ownerForCategory_(data.category),
    Due_Date: dueDateFor_(data.priority === "High" ? "High" : "Medium"),
    Evidence_File_URLS: savedFiles.join("; "),
    Consent: data.consent
  });

  return {
    ok: true,
    id: ticketId,
    ticketId: ticketId,
    riskFlag: false
  };
}

function getDashboard_(body) {
  validateDashboardPassword_(body.password || "");
  appendAudit_("getDashboard", "Safe Person", "Allowed", "Dashboard summary loaded");

  return {
    ok: true,
    dashboard: buildDashboard_()
  };
}

function generateDailyDigest_(body) {
  validateDashboardPassword_(body.password || "");

  const date = body.date || today_();
  const dashboard = buildDashboard_(date);
  const digestId = newId_("DIGEST");
  const actions = recommendedActions_(dashboard.kpis);

  appendObject_("Daily_Digest", {
    Digest_ID: digestId,
    Date: date,
    Created_At: nowIso_(),
    Response_Count: dashboard.kpis.responsesToday,
    Safety_Climate_Pct: dashboard.kpis.safetyClimatePct,
    Avg_Mood: dashboard.kpis.avgMood,
    Avg_Stress: dashboard.kpis.avgStress,
    Avg_Fatigue: dashboard.kpis.avgFatigue,
    Contact_Requests: dashboard.kpis.contactRequests,
    Open_Risk_Flags: dashboard.kpis.openRiskFlags,
    Open_Cases: dashboard.kpis.openCases,
    Open_Tickets: dashboard.kpis.openTickets,
    Recommended_Actions: actions.join("; ")
  });

  appendAudit_("generateDailyDigest", "Safe Person", "Allowed", "Digest " + digestId + " generated");

  return {
    ok: true,
    digestId: digestId,
    recommendedActions: actions
  };
}

function buildDashboard_(date) {
  const pulses = getSheetObjects_("Daily_Pulse");
  const flags = getSheetObjects_("Pulse_Risk_Flags");
  const support = getSheetObjects_("Support_Requests");
  const reports = getSheetObjects_("Confidential_Reports");
  const tickets = getSheetObjects_("Operational_Tickets");
  const targetDate = date || today_();
  const todayPulses = pulses.filter(function (row) {
    return normalizeDateString_(row.Activity_Date) === targetDate;
  });
  const pulseScope = todayPulses.length ? todayPulses : pulses;
  const openFlags = flags.filter(function (row) {
    return isOpenStatus_(row.Status);
  });
  const openCases = support
    .map(function (row) {
      return {
        caseId: row.Case_ID,
        type: "Support",
        severity: row.Severity || "Medium",
        dueDate: normalizeDateString_(row.Due_Date),
        status: row.Status || "New"
      };
    })
    .concat(reports.map(function (row) {
      return {
        caseId: row.Case_ID,
        type: row.Report_Type || "Confidential",
        severity: row.Severity || "High",
        dueDate: normalizeDateString_(row.Due_Date),
        status: row.Status || "New"
      };
    }))
    .filter(function (row) {
      return isOpenStatus_(row.status);
    });
  const openTickets = tickets.filter(function (row) {
    return isOpenStatus_(row.Status);
  });

  return {
    kpis: {
      responsesToday: todayPulses.length,
      totalResponses: pulses.length,
      safetyClimatePct: safetyClimatePct_(pulseScope),
      avgMood: avg_(pulseScope, "Mood_Score"),
      avgStress: avg_(pulseScope, "Stress_Score"),
      avgFatigue: avg_(pulseScope, "Fatigue_Score"),
      contactRequests: todayPulses.filter(function (row) {
        return hasMeaningfulValue_(row.Contact_Request) && row.Contact_Request !== "No";
      }).length,
      openRiskFlags: openFlags.length,
      openHighRisk: openFlags.filter(function (row) {
        return ["High", "Critical"].indexOf(row.Severity) !== -1;
      }).length,
      openCases: openCases.length,
      openTickets: openTickets.length
    },
    trends: buildTrends_(pulses, flags),
    risks: openFlags.slice(-12).reverse().map(function (row) {
      return {
        id: row.Source_ID || row.Flag_ID,
        severity: row.Severity || "Medium",
        reason: row.Reason || "-",
        status: row.Status || "New"
      };
    }),
    cases: openCases.slice(-12).reverse(),
    tickets: openTickets.slice(-12).reverse().map(function (row) {
      return {
        ticketId: row.Ticket_ID,
        category: row.Category || "-",
        priority: row.Priority || "Medium",
        status: row.Status || "New"
      };
    })
  };
}

function buildTrends_(pulses, flags) {
  const grouped = {};
  pulses.forEach(function (row) {
    const date = normalizeDateString_(row.Activity_Date) || "Unknown";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(row);
  });

  return Object.keys(grouped)
    .sort()
    .slice(-7)
    .map(function (date) {
      const rows = grouped[date];
      const flagCount = flags.filter(function (flag) {
        return normalizeDateString_(flag.Created_At) === date;
      }).length;
      return {
        date: date,
        responses: rows.length,
        safetyClimatePct: safetyClimatePct_(rows),
        stressAvg: avg_(rows, "Stress_Score"),
        flags: flagCount
      };
    });
}

function evaluateDailyPulse_(data) {
  let score = 0;
  const reasons = [];

  function add(points, reason) {
    score += points;
    reasons.push(reason);
  }

  const mood = Number(data.moodScore || 0);
  const stress = Number(data.stressScore || 0);
  const fatigue = Number(data.fatigueScore || 0);

  if (mood > 0 && mood <= 2) add(1, "Low wellbeing score");
  if (stress >= 4) add(stress === 5 ? 2 : 1, "High stress");
  if (fatigue >= 4) add(fatigue === 5 ? 2 : 1, "High fatigue");
  if (isNegativeAnswer_(data.safetyFeeling)) add(3, "Participant did not feel safe");
  if (isSensitiveAnswer_(data.safetyFeeling)) add(2, "Participant avoided safety answer");
  if (isNegativeAnswer_(data.respectFeeling)) add(2, "Respect concern");
  if (isNegativeAnswer_(data.inclusionFeeling)) add(1, "Inclusion concern");
  if (data.discomfortToday === "Yes") add(3, "Discomfort reported");
  if (data.discomfortToday === "A little") add(1, "Minor discomfort reported");
  if (isSensitiveAnswer_(data.discomfortToday)) add(2, "Participant avoided discomfort answer");
  if (["No", "Not sure"].indexOf(data.safePersonAwareness) !== -1) add(1, "Safe Person contact not clear");
  if (data.logisticsRating === "No") add(1, "Practical issue affecting wellbeing");
  if (data.socialSafety === "No") add(3, "Social activity safety concern");
  if (data.pressureConcern === "Yes") add(3, "Pressure to drink/stay/participate");
  if (data.pressureConcern === "A little") add(1, "Minor social pressure signal");
  if (data.transportReturn === "No") add(2, "Return transport concern");
  if (hasMeaningfulValue_(data.contactRequest) && data.contactRequest !== "No") add(2, "Safe Person contact requested");

  let severity = "Low";
  if (score >= 8) severity = "High";
  else if (score >= 4) severity = "Medium";
  if (data.contactRequest === "Only if urgent" && score >= 4) severity = "High";

  return {
    score: score,
    flag: score >= 2,
    severity: severity,
    reasons: reasons.length ? reasons : ["No automated risk reason"]
  };
}

function severityFromUrgency_(urgency, category) {
  if (urgency === "Immediate") return "Critical";
  if (["Harassment", "Discrimination", "Safety", "Medical"].indexOf(category) !== -1) return "High";
  if (urgency === "Today") return "High";
  return "Medium";
}

function appendRiskFlag_(sourceType, sourceId, caseId, risk, contactRequest) {
  appendObject_("Pulse_Risk_Flags", {
    Flag_ID: newId_("FLAG"),
    Created_At: nowIso_(),
    Source_Type: sourceType,
    Source_ID: sourceId,
    Case_ID: caseId || "",
    Severity: risk.severity,
    Risk_Score: risk.score,
    Reason: risk.reasons.join("; "),
    Contact_Request: contactRequest || "",
    Owner: "",
    Status: "New",
    Due_Date: dueDateFor_(risk.severity)
  });
}

function saveFiles_(files, folder, context) {
  if (!files || !files.length) return [];

  return files.map(function (file) {
    const bytes = Utilities.base64Decode(file.data || "");
    const safeName = sanitizeFileName_(file.name || "evidence");
    const blob = Utilities.newBlob(bytes, file.type || "application/octet-stream", safeName);
    const driveFile = folder.createFile(blob);

    appendObject_("Evidence_Index", {
      Evidence_ID: newId_("EVID"),
      Created_At: nowIso_(),
      Related_Type: context.relatedType,
      Related_ID: context.relatedId,
      Case_ID: context.caseId,
      Ticket_ID: context.ticketId,
      File_Name: safeName,
      Mime_Type: file.type || "application/octet-stream",
      Size_Bytes: file.size || bytes.length,
      Drive_File_ID: driveFile.getId(),
      Drive_URL: driveFile.getUrl(),
      Folder_URL: folder.getUrl(),
      Retention_Status: "Active"
    });

    return driveFile.getUrl();
  });
}

function appendObject_(sheetName, object) {
  const spreadsheet = getSpreadsheet_();
  const headers = AEGIS_HEADERS[sheetName];
  const sheet = ensureSheet_(spreadsheet, sheetName, headers);
  const row = headers.map(function (header) {
    return valueForSheet_(object[header]);
  });
  sheet.appendRow(row);
}

function getSheetObjects_(sheetName) {
  const spreadsheet = getSpreadsheet_();
  const sheet = ensureSheet_(spreadsheet, sheetName, AEGIS_HEADERS[sheetName]);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function (value) {
    return String(value || "");
  });

  return values.slice(1).filter(function (row) {
    return row.some(function (cell) {
      return cell !== "";
    });
  }).map(function (row) {
    const object = {};
    headers.forEach(function (header, index) {
      object[header] = formatCell_(row[index]);
    });
    return object;
  });
}

function ensureSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const hasHeader = current.some(function (value) {
    return String(value || "").trim();
  });

  if (!hasHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const missing = headers.filter(function (header) {
      return current.indexOf(header) === -1;
    });
    if (missing.length) {
      sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    }
  }

  sheet.setFrozenRows(1);
  return sheet;
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) {
    setupAegis();
    spreadsheetId = props.getProperty("SPREADSHEET_ID");
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getActiveOrCreateSpreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (error) {
    // Standalone Apps Script projects do not always have an active spreadsheet.
  }
  return SpreadsheetApp.create(AEGIS_CONFIG.spreadsheetName);
}

function getOrCreateRootFolder_() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty("DRIVE_ROOT_ID");
  if (folderId) return DriveApp.getFolderById(folderId);

  const existing = DriveApp.getFoldersByName(AEGIS_CONFIG.rootFolderName);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(AEGIS_CONFIG.rootFolderName);
}

function getOrCreateChildFolder_(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function getCaseEvidenceFolder_(caseId) {
  const root = getOrCreateRootFolder_();
  const evidenceRoot = getOrCreateChildFolder_(root, AEGIS_FOLDERS.evidence);
  return getOrCreateChildFolder_(evidenceRoot, caseId);
}

function getOperationalTicketFolder_(ticketId) {
  const root = getOrCreateRootFolder_();
  const operationsRoot = getOrCreateChildFolder_(root, AEGIS_FOLDERS.operations);
  return getOrCreateChildFolder_(operationsRoot, ticketId);
}

function validateDashboardPassword_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty("DASHBOARD_PASSWORD") || AEGIS_CONFIG.dashboardPassword;
  if (String(password || "") !== expected) {
    appendAudit_("getDashboard", "Unknown", "Denied", "Invalid Safe Person password");
    throw new Error("Invalid Safe Person password.");
  }
}

function appendAudit_(action, actor, result, detail) {
  appendObject_("Access_Audit", {
    Audit_ID: newId_("AUDIT"),
    Timestamp: nowIso_(),
    Action: action,
    Actor: actor,
    Result: result,
    Detail: detail
  });
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function withLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function cleanPayload_(payload) {
  const clean = {};
  Object.keys(payload || {}).forEach(function (key) {
    const value = payload[key];
    if (Array.isArray(value)) {
      clean[key] = value.map(function (item) {
        return String(item || "").trim();
      }).filter(Boolean);
    } else if (value === null || value === undefined) {
      clean[key] = "";
    } else {
      clean[key] = String(value).trim();
    }
  });
  return clean;
}

function requireConsent_(data) {
  if (data.consent !== "Yes") {
    throw new Error("Consent acknowledgement is required.");
  }
}

function newId_(prefix) {
  const stamp = Utilities.formatDate(new Date(), AEGIS_CONFIG.timezone, "yyyyMMdd-HHmmss");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return prefix + "-" + stamp + "-" + random;
}

function nowIso_() {
  return Utilities.formatDate(new Date(), AEGIS_CONFIG.timezone, "yyyy-MM-dd HH:mm:ss");
}

function today_() {
  return Utilities.formatDate(new Date(), AEGIS_CONFIG.timezone, "yyyy-MM-dd");
}

function dueDateFor_(severity) {
  const date = new Date();
  if (severity === "Low") date.setDate(date.getDate() + 2);
  if (severity === "Medium") date.setDate(date.getDate() + 1);
  return Utilities.formatDate(date, AEGIS_CONFIG.timezone, "yyyy-MM-dd");
}

function valueForSheet_(value) {
  if (Array.isArray(value)) return value.join("; ");
  if (value === null || value === undefined) return "";
  return value;
}

function formatCell_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, AEGIS_CONFIG.timezone, "yyyy-MM-dd HH:mm:ss");
  }
  return value === null || value === undefined ? "" : String(value);
}

function normalizeDateString_(value) {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : text;
}

function hasMeaningfulValue_(value) {
  return String(value || "").trim() !== "";
}

function listToText_(value) {
  if (Array.isArray(value)) return value.join("; ");
  return String(value || "");
}

function isNegativeAnswer_(value) {
  return value === "No";
}

function isSensitiveAnswer_(value) {
  return value === "Prefer not to say";
}

function isOpenStatus_(status) {
  const closed = ["Closed", "Resolved", "Done", "Cancelled"];
  return closed.indexOf(String(status || "New")) === -1;
}

function contactRequestToUrgency_(contactRequest) {
  if (contactRequest === "Yes, today" || contactRequest === "Only if urgent") return "Today";
  if (contactRequest === "Yes, tomorrow") return "Not urgent";
  return "Not urgent";
}

function ownerForCategory_(category) {
  const text = String(category || "");
  if (text.indexOf("Accommodation") !== -1) return "Operations - Accommodation";
  if (text.indexOf("Food") !== -1) return "Operations - Food";
  if (text.indexOf("Transport") !== -1) return "Operations - Transport";
  if (text.indexOf("Venue") !== -1) return "Operations - Venue";
  if (text.indexOf("Accessibility") !== -1) return "Operations - Accessibility";
  if (text.indexOf("Schedule") !== -1) return "Operations - Program";
  return "Operations";
}

function avg_(rows, key) {
  const values = rows.map(function (row) {
    return Number(row[key]);
  }).filter(function (value) {
    return isFinite(value) && value > 0;
  });
  if (!values.length) return 0;
  return Math.round((values.reduce(function (sum, value) {
    return sum + value;
  }, 0) / values.length) * 10) / 10;
}

function safetyClimatePct_(rows) {
  if (!rows.length) return 0;
  const safe = rows.filter(function (row) {
    return row.Safety_Feeling === "Yes" || row.Safety_Feeling === "Mostly";
  }).length;
  return Math.round((safe / rows.length) * 100);
}

function recommendedActions_(kpis) {
  const actions = [];
  if (kpis.openHighRisk > 0) actions.push("Review high or critical risk items before the next activity block");
  if (kpis.contactRequests > 0) actions.push("Assign a Safe Person owner to each contact request");
  if (kpis.avgFatigue >= 4) actions.push("Review schedule load and recovery windows");
  if (kpis.openTickets > 0) actions.push("Assign operations owners for unresolved practical tickets");
  if (kpis.safetyClimatePct && kpis.safetyClimatePct < 85) actions.push("Discuss safety climate signals in the restricted daily briefing");
  if (!actions.length) actions.push("No immediate escalation pattern detected; continue daily monitoring");
  return actions;
}

function sanitizeFileName_(name) {
  return String(name || "file")
    .replace(/[\\/:*?"<>|#%{}[\]~]/g, "-")
    .slice(0, 140);
}
