(function () {
  "use strict";

  const CLIENT_VERSION = "2026.05.19";
  const MAX_FILE_COUNT = 5;
  const MAX_FILE_BYTES = 6 * 1024 * 1024;

  const state = {
    apiUrl: window.AEGIS_CONFIG?.API_URL || "",
    dashboardPassword: sessionStorage.getItem("aegis.dashboardPassword") || ""
  };

  const views = Array.from(document.querySelectorAll(".view"));
  const navButtons = Array.from(document.querySelectorAll("[data-nav]"));
  const viewTitle = document.getElementById("viewTitle");
  const connectionDot = document.getElementById("connectionDot");
  const connectionText = document.getElementById("connectionText");
  const toastRegion = document.getElementById("toastRegion");
  const dashboardPasswordInput = document.getElementById("dashboardPassword");

  init();

  function init() {
    setTodayDefaults();
    hydrateInputs();
    bindNavigation();
    bindForms();
    bindDashboard();
    setConnectionState(Boolean(state.apiUrl), state.apiUrl ? "Google backend ready" : "Backend URL missing");

    const initial = normalizeRoute(location.hash.replace("#", "")) || "overview";
    showView(initial, false);
  }

  function setTodayDefaults() {
    const today = new Date().toISOString().slice(0, 10);
    document.querySelectorAll('input[type="date"][name="activityDate"]').forEach((input) => {
      if (!input.value) input.value = today;
    });
  }

  function hydrateInputs() {
    if (dashboardPasswordInput) dashboardPasswordInput.value = state.dashboardPassword;
  }

  function bindNavigation() {
    navButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const target = event.currentTarget.dataset.nav;
        if (target) showView(target);
      });
    });

    window.addEventListener("hashchange", () => {
      const target = normalizeRoute(location.hash.replace("#", "")) || "overview";
      showView(target, false);
    });
  }

  function showView(target, pushHash = true) {
    const normalized = normalizeRoute(target);
    const view = document.getElementById(`view-${normalized}`);
    if (!view) return;

    views.forEach((item) => item.classList.toggle("is-visible", item === view));
    navButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.nav === normalized);
    });

    viewTitle.textContent = view.dataset.title || "MEU Aegis";
    if (pushHash) history.pushState(null, "", `#${normalized}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function normalizeRoute(value) {
    return String(value || "")
      .trim()
      .replace(/^view-/, "")
      .replace(/_/g, "-");
  }

  function bindForms() {
    document.querySelectorAll(".aegis-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const action = form.dataset.action;
        if (!action) return;

        const submitButton = form.querySelector('[type="submit"]');
        setSubmitting(submitButton, true);

        try {
          const payload = serializeForm(form);
          const files = await collectFiles(form);
          const result = await apiCall(action, { payload, files });
          showSubmissionResult(action, result);
          form.reset();
          setTodayDefaults();
        } catch (error) {
          showToast("Submission failed", error.message, true);
        } finally {
          setSubmitting(submitButton, false);
        }
      });
    });
  }

  function bindDashboard() {
    const loadButton = document.getElementById("loadDashboardButton");
    const digestButton = document.getElementById("digestButton");

    loadButton?.addEventListener("click", async () => {
      const password = dashboardPasswordInput.value.trim();
      if (!password) {
        showToast("Password required", "Enter the Safe Person password to load the restricted dashboard.", true);
        return;
      }

      setSubmitting(loadButton, true);
      try {
        const result = await apiCall("getDashboard", { password });
        state.dashboardPassword = password;
        sessionStorage.setItem("aegis.dashboardPassword", password);
        renderDashboard(result.dashboard);
        showToast("Dashboard loaded", "Restricted summary was read from Google Sheets.");
      } catch (error) {
        showToast("Dashboard locked", error.message, true);
      } finally {
        setSubmitting(loadButton, false);
      }
    });

    digestButton?.addEventListener("click", async () => {
      const password = dashboardPasswordInput.value.trim();
      if (!password) {
        showToast("Password required", "Enter the Safe Person password before generating a digest.", true);
        return;
      }

      setSubmitting(digestButton, true);
      try {
        const result = await apiCall("generateDailyDigest", { password });
        showToast("Daily digest generated", `Digest ${result.digestId} was written to Google Sheets.`);
      } catch (error) {
        showToast("Digest failed", error.message, true);
      } finally {
        setSubmitting(digestButton, false);
      }
    });
  }

  function serializeForm(form) {
    const data = {};

    Array.from(form.elements).forEach((field) => {
      if (!field.name || field.disabled || field.type === "file") return;

      if (field.type === "checkbox") {
        if (!field.checked) return;
        addValue(data, field.name, field.value || "Yes");
        return;
      }

      if (field.type === "radio") {
        if (!field.checked) return;
        data[field.name] = field.value;
        return;
      }

      data[field.name] = field.value.trim ? field.value.trim() : field.value;
    });

    return data;
  }

  function addValue(target, key, value) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = Array.isArray(target[key]) ? target[key].concat(value) : [target[key], value];
    } else {
      target[key] = value;
    }
  }

  async function collectFiles(form) {
    const inputs = Array.from(form.querySelectorAll('input[type="file"]'));
    const files = [];

    for (const input of inputs) {
      for (const file of Array.from(input.files || [])) {
        if (files.length >= MAX_FILE_COUNT) {
          throw new Error(`Please upload no more than ${MAX_FILE_COUNT} files per submission.`);
        }
        if (file.size > MAX_FILE_BYTES) {
          throw new Error(`${file.name} is larger than 6 MB. Please upload a smaller file.`);
        }
        files.push(await fileToPayload(file, input.name));
      }
    }

    return files;
  }

  function fileToPayload(file, fieldName) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve({
          fieldName,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          data: result.includes(",") ? result.split(",").pop() : result
        });
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  async function apiCall(action, body = {}) {
    const url = (state.apiUrl || "").trim();
    if (!url) {
      throw new Error("The Apps Script Web App URL is not configured. Add it to config.js before publishing.");
    }

    const response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action,
        clientVersion: CLIENT_VERSION,
        source: "github-pages",
        ...body
      })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("The backend returned a non-JSON response. Check the Apps Script deployment URL.");
    }

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Request failed with status ${response.status}.`);
    }

    setConnectionState(true, "Backend online");
    return data;
  }

  function renderDashboard(dashboard) {
    if (!dashboard) return;

    const kpis = [
      ["Responses today", dashboard.kpis?.responsesToday ?? 0],
      ["Safety climate", formatPercent(dashboard.kpis?.safetyClimatePct)],
      ["Open high risk", dashboard.kpis?.openHighRisk ?? 0],
      ["Contact requests", dashboard.kpis?.contactRequests ?? 0],
      ["Open cases", dashboard.kpis?.openCases ?? 0],
      ["Open tickets", dashboard.kpis?.openTickets ?? 0],
      ["Avg. stress", formatNumber(dashboard.kpis?.avgStress)],
      ["Avg. fatigue", formatNumber(dashboard.kpis?.avgFatigue)]
    ];

    document.getElementById("kpiGrid").innerHTML = kpis
      .map(([label, value]) => `<article class="kpi-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`)
      .join("");

    renderTrends(dashboard.trends || []);
    renderRows("riskTableBody", dashboard.risks || [], [
      ["id", "id"],
      ["severity", "severity", "badge"],
      ["reason", "reason"],
      ["status", "status"]
    ]);
    renderRows("caseTableBody", dashboard.cases || [], [
      ["caseId", "caseId"],
      ["type", "type"],
      ["severity", "severity", "badge"],
      ["dueDate", "dueDate"]
    ]);
    renderRows("ticketTableBody", dashboard.tickets || [], [
      ["ticketId", "ticketId"],
      ["category", "category"],
      ["priority", "priority", "badge"],
      ["status", "status"]
    ]);
  }

  function renderTrends(trends) {
    const list = document.getElementById("trendList");
    if (!trends.length) {
      list.innerHTML = '<p class="muted">No daily pulse data yet.</p>';
      return;
    }

    list.innerHTML = trends
      .map((item) => {
        const pct = Number(item.safetyClimatePct || 0);
        return `
          <div class="trend-item">
            <header>
              <strong>${escapeHtml(item.date || "Unknown date")}</strong>
              <span>${escapeHtml(item.responses || 0)} responses | ${formatPercent(pct)} safe/mostly safe | ${escapeHtml(item.flags || 0)} flags</span>
            </header>
            <div class="trend-track"><div class="trend-fill" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>
          </div>
        `;
      })
      .join("");
  }

  function renderRows(tbodyId, rows, columns) {
    const body = document.getElementById(tbodyId);
    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="${columns.length}">No open items.</td></tr>`;
      return;
    }

    body.innerHTML = rows
      .map((row) => {
        const cells = columns
          .map(([, key, type]) => {
            const value = row[key] || "-";
            if (type === "badge") {
              return `<td><span class="badge ${escapeHtml(String(value).toLowerCase())}">${escapeHtml(value)}</span></td>`;
            }
            return `<td>${escapeHtml(value)}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");
  }

  function showSubmissionResult(action, result) {
    const labels = {
      submitDailyPulse: "Daily pulse submitted",
      submitSupportRequest: "Safe Person request submitted",
      submitConfidentialReport: "Confidential report submitted",
      submitOperationalTicket: "Practical issue submitted"
    };

    const details = [
      result.id && `ID: ${result.id}`,
      result.caseId && `Case: ${result.caseId}`,
      result.ticketId && `Ticket: ${result.ticketId}`,
      result.riskFlag ? "A Safe Person review flag was created." : ""
    ]
      .filter(Boolean)
      .join(" ");

    showToast(labels[action] || "Submission received", details || "Your response was written to Google Sheets.");
  }

  function setSubmitting(button, isSubmitting) {
    if (!button) return;
    button.disabled = isSubmitting;
    if (isSubmitting) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Working...";
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  function setConnectionState(isOnline, text) {
    connectionDot.classList.toggle("is-online", Boolean(isOnline));
    connectionText.textContent = text;
  }

  function showToast(title, message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " is-error" : ""}`;
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message || "")}</span>`;
    toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 6800);
  }

  function formatPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    return `${Math.round(number)}%`;
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    return number.toFixed(1);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
