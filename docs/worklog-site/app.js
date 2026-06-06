(function () {
  const generatedDoneItems = Array.isArray(window.WORKLOG_DONE_ITEMS)
    ? window.WORKLOG_DONE_ITEMS
    : Array.isArray(window.WORKLOG_ITEMS)
      ? window.WORKLOG_ITEMS
      : [];
  const generatedPendingItems = Array.isArray(window.WORKLOG_PENDING_ITEMS)
    ? window.WORKLOG_PENDING_ITEMS
    : Array.isArray(window.TODO_ITEMS)
      ? window.TODO_ITEMS
      : [];
  const sessionDoneItems = Array.isArray(window.WORKLOG_SESSION_DONE_ITEMS) ? window.WORKLOG_SESSION_DONE_ITEMS : [];
  const sessionPendingItems = Array.isArray(window.WORKLOG_SESSION_PENDING_ITEMS) ? window.WORKLOG_SESSION_PENDING_ITEMS : [];
  const meta = window.WORKLOG_META || {};
  const SCOPE_STORAGE_KEY = "lcg-worklog-scope-overrides";
  const BOARD_STORAGE_KEY = "lcg-worklog-board-overrides";
  const VALIDATION_API_URL = "/api/validations";

  const state = {
    view: "done",
    pendingScope: "all",
    category: "Tout",
    query: ""
  };

  let scopeOverrides = loadJsonStorage(SCOPE_STORAGE_KEY);
  let boardOverrides = loadJsonStorage(BOARD_STORAGE_KEY);
  let sharedValidations = new Map();
  let activeModalItemId = null;
  let syncState = {
    mode: "loading",
    title: "Connexion au fichier partage...",
    detail: "Lecture de validation-data.json."
  };
  const allItems = sortItems([
    ...sessionDoneItems,
    ...sessionPendingItems,
    ...generatedDoneItems,
    ...generatedPendingItems
  ]);
  migrateLegacyOverrides();

  const boardSwitch = document.querySelector(".board-switch");
  const scopeSwitch = document.querySelector("#scope-switch");
  const cardsGrid = document.querySelector("#cards-grid");
  const filterList = document.querySelector("#filter-list");
  const searchInput = document.querySelector("#search-input");
  const visibleCount = document.querySelector("#visible-count");
  const totalCount = document.querySelector("#total-count");
  const doneTotal = document.querySelector("#done-total");
  const pendingTotal = document.querySelector("#pending-total");
  const pendingV1Total = document.querySelector("#pending-v1-total");
  const pendingLaterTotal = document.querySelector("#pending-later-total");
  const sourceCount = document.querySelector("#source-count");
  const currentViewLabel = document.querySelector("#current-view-label");
  const dataBreakdown = document.querySelector("#data-breakdown");
  const emptyState = document.querySelector("#empty-state");
  const syncStatus = document.querySelector("#sync-status");
  const syncStatusTitle = document.querySelector("#sync-status-title");
  const syncStatusDetail = document.querySelector("#sync-status-detail");
  const syncRetry = document.querySelector("#sync-retry");
  const modal = document.querySelector("#modal");
  const modalContent = document.querySelector("#modal-content");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function sortItems(items) {
    return [...items].sort((a, b) => {
      const aKey = a.sortKey || "";
      const bKey = b.sortKey || "";
      if (aKey !== bKey) return bKey.localeCompare(aKey);
      return Number(a.sourceOrder || 0) - Number(b.sourceOrder || 0);
    });
  }

  function loadJsonStorage(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || "{}");
    } catch {
      return {};
    }
  }

  function saveJsonStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The page still works if localStorage is unavailable.
    }
  }

  function migrateLegacyOverrides() {
    let boardChanged = false;
    let scopeChanged = false;

    for (const item of allItems) {
      for (const legacyId of item.legacyIds || []) {
        if (!Object.prototype.hasOwnProperty.call(boardOverrides, item.id)
          && Object.prototype.hasOwnProperty.call(boardOverrides, legacyId)) {
          boardOverrides[item.id] = boardOverrides[legacyId];
          boardChanged = true;
        }

        if (!Object.prototype.hasOwnProperty.call(scopeOverrides, item.id)
          && Object.prototype.hasOwnProperty.call(scopeOverrides, legacyId)) {
          scopeOverrides[item.id] = scopeOverrides[legacyId];
          scopeChanged = true;
        }

        if (Object.prototype.hasOwnProperty.call(boardOverrides, legacyId)) {
          delete boardOverrides[legacyId];
          boardChanged = true;
        }

        if (Object.prototype.hasOwnProperty.call(scopeOverrides, legacyId)) {
          delete scopeOverrides[legacyId];
          scopeChanged = true;
        }
      }
    }

    if (boardChanged) saveJsonStorage(BOARD_STORAGE_KEY, boardOverrides);
    if (scopeChanged) saveJsonStorage(SCOPE_STORAGE_KEY, scopeOverrides);
  }

  function getSourceType(item) {
    if (["todo", "session", "worklog"].includes(item?.sourceType)) return item.sourceType;
    if (item?.source === "TODO.md") return "todo";
    if (item?.source === "Session Codex") return "session";
    return "worklog";
  }

  function getItemBoard(item) {
    if (sharedValidations.has(item.id)) return "done";
    return boardOverrides[item.id] || item.type || "done";
  }

  function setLocalItemBoard(item, board) {
    if (!item || !["done", "pending"].includes(board)) return;

    if (board === item.type) {
      delete boardOverrides[item.id];
    } else {
      boardOverrides[item.id] = board;
    }

    saveJsonStorage(BOARD_STORAGE_KEY, boardOverrides);
  }

  function clearLocalBoardOverride(item) {
    if (!item || !Object.prototype.hasOwnProperty.call(boardOverrides, item.id)) return;
    delete boardOverrides[item.id];
    saveJsonStorage(BOARD_STORAGE_KEY, boardOverrides);
  }

  function getValidationStorage(item) {
    if (sharedValidations.has(item.id)) return "shared";
    if (getItemBoard(item) === "done" && boardOverrides[item.id] === "done") return "local";
    return "source";
  }

  function getItemScope(item) {
    if (getItemBoard(item) !== "pending") return "done";
    return scopeOverrides[item.id] || item.scope || "v1";
  }

  function setItemScope(item, scope) {
    if (!item || getItemBoard(item) !== "pending") return;

    if (scope === (item.scope || "v1")) {
      delete scopeOverrides[item.id];
    } else {
      scopeOverrides[item.id] = scope;
    }

    saveJsonStorage(SCOPE_STORAGE_KEY, scopeOverrides);
  }

  function getScopeLabel(scope) {
    return scope === "later" ? "Plus tard" : "V1";
  }

  function getWhenLabel(item, { includeMissingTime = false } = {}) {
    const date = item.date || "Date non notee";
    if (item.time) return `${date} - ${item.time}`;
    if (includeMissingTime && item.timePrecision === "date") return `${date} - heure non notee`;
    return date;
  }

  function formatValidationDate(value) {
    if (!value) return "Date non disponible";

    try {
      return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function setSyncState(mode, title, detail) {
    syncState = { mode, title, detail };
    renderSyncStatus();
  }

  function renderSyncStatus() {
    if (!syncStatus) return;

    syncStatus.dataset.state = syncState.mode;
    syncStatusTitle.textContent = syncState.title;
    syncStatusDetail.textContent = syncState.detail;
    syncRetry.hidden = !["local", "error"].includes(syncState.mode);
  }

  async function requestJson(url, options) {
    const response = await window.fetch(url, options);
    let body = {};

    try {
      body = await response.json();
    } catch {
      // The status code still gives a useful error if the body is not JSON.
    }

    if (!response.ok) {
      throw new Error(body.error || `Erreur HTTP ${response.status}.`);
    }

    return body;
  }

  function buildValidationPayload(item) {
    const sourceType = getSourceType(item);

    return {
      id: item.id,
      title: item.title,
      source: item.source,
      sourceType,
      cardStatus: item.status,
      todoReference: sourceType === "todo" ? item.todoReference : null
    };
  }

  function refreshOpenModal() {
    if (activeModalItemId && modal.classList.contains("is-open")) {
      openModal(activeModalItemId);
    }
  }

  async function loadSharedValidations() {
    setSyncState("loading", "Connexion au fichier partage...", "Lecture de validation-data.json.");

    try {
      const data = await requestJson(VALIDATION_API_URL);
      sharedValidations = new Map(
        (Array.isArray(data.validations) ? data.validations : []).map((validation) => [validation.id, validation])
      );

      for (const item of allItems) {
        if (sharedValidations.has(item.id) && boardOverrides[item.id] === "done") {
          delete boardOverrides[item.id];
        }
      }
      saveJsonStorage(BOARD_STORAGE_KEY, boardOverrides);

      setSyncState(
        "shared",
        "Fichier partage connecte",
        `${sharedValidations.size} validation(s) chargee(s) depuis validation-data.json.`
      );
      render();
      refreshOpenModal();
    } catch (error) {
      setSyncState(
        "local",
        "Mode local seulement",
        `Impossible de lire validation-data.json. Lance le serveur Worklog puis reessaie. ${error.message}`
      );
      render();
      refreshOpenModal();
    }
  }

  async function saveSharedValidation(item) {
    setSyncState("saving", "Enregistrement en cours...", `Sauvegarde de "${item.title}" dans validation-data.json.`);

    const data = await requestJson(VALIDATION_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildValidationPayload(item))
    });

    sharedValidations.set(item.id, data.validation);
    clearLocalBoardOverride(item);
    setSyncState(
      "shared",
      "Validation enregistree dans le fichier partage",
      `${item.title} est maintenant lisible par Codex dans validation-data.json.`
    );
  }

  async function removeSharedValidation(item) {
    setSyncState("saving", "Mise a jour en cours...", `Retrait de "${item.title}" dans validation-data.json.`);

    await requestJson(`${VALIDATION_API_URL}/${encodeURIComponent(item.id)}`, {
      method: "DELETE"
    });

    sharedValidations.delete(item.id);
    setLocalItemBoard(item, "pending");
    setSyncState(
      "shared",
      "Validation retiree du fichier partage",
      `${item.title} est de nouveau en attente.`
    );
  }

  async function changeItemBoard(item, board) {
    if (!item || !["done", "pending"].includes(board)) return false;

    if (board === "done") {
      try {
        await saveSharedValidation(item);
        return true;
      } catch (error) {
        setLocalItemBoard(item, "done");
        setSyncState(
          "error",
          "Validation gardee localement",
          `L'ecriture du fichier a echoue. La carte est faite seulement dans ce navigateur. ${error.message}`
        );
        return true;
      }
    }

    if (sharedValidations.has(item.id)) {
      try {
        await removeSharedValidation(item);
        return true;
      } catch (error) {
        setSyncState(
          "error",
          "Impossible de retirer la validation partagee",
          `La carte reste faite dans validation-data.json. ${error.message}`
        );
        return false;
      }
    }

    setLocalItemBoard(item, "pending");
    return true;
  }

  function getDoneItems() {
    return allItems.filter((item) => getItemBoard(item) === "done");
  }

  function getPendingItems() {
    return allItems.filter((item) => getItemBoard(item) === "pending");
  }

  function getPendingScopeCounts() {
    return getPendingItems().reduce((counts, item) => {
      counts[getItemScope(item)] += 1;
      return counts;
    }, { v1: 0, later: 0 });
  }

  function matchesQuery(item) {
    if (!state.query) return true;

    const board = getItemBoard(item);
    const haystack = normalize([
      item.title,
      item.fullTitle,
      item.summary,
      item.date,
      item.time,
      item.category,
      item.status,
      item.impact,
      item.source,
      item.sourceKind,
      item.reviewNote,
      item.aiNote,
      board === "pending" ? "en attente" : "fait",
      getScopeLabel(getItemScope(item)),
      ...(item.details || []),
      ...(item.files || [])
    ].join(" "));

    return haystack.includes(normalize(state.query));
  }

  function matchesCategory(item) {
    return state.category === "Tout" || item.category === state.category;
  }

  function matchesPendingScope(item) {
    if (state.view !== "pending" || state.pendingScope === "all") return true;
    return getItemScope(item) === state.pendingScope;
  }

  function getCurrentItems() {
    return state.view === "pending" ? getPendingItems() : getDoneItems();
  }

  function getCategories() {
    return ["Tout", ...Array.from(new Set(getCurrentItems().map((item) => item.category))).sort()];
  }

  function getVisibleItems() {
    return getCurrentItems().filter((item) => matchesCategory(item) && matchesPendingScope(item) && matchesQuery(item));
  }

  function WorklogCard(item) {
    const board = getItemBoard(item);
    const scope = getItemScope(item);
    const validationStorage = getValidationStorage(item);
    const scopePill = board === "pending"
      ? `<span class="pill pill--scope-${escapeHtml(scope)}">${escapeHtml(getScopeLabel(scope))}</span>`
      : "";
    const boardPill = board !== item.type
      ? `<span class="pill pill--manual">${board === "pending" ? "Remis en attente" : "Marque fait"}</span>`
      : "";
    const aiPill = item.aiValidated
      ? '<span class="pill pill--ai">IA valide</span>'
      : "";
    const reviewPill = item.humanReview
      ? '<span class="pill pill--review">A verifier humainement</span>'
      : "";
    const storagePill = validationStorage === "shared"
      ? '<span class="pill pill--shared">Fichier partage</span>'
      : validationStorage === "local"
        ? '<span class="pill pill--local">Local seulement</span>'
        : "";

    return `
      <button class="worklog-card" type="button" data-id="${escapeHtml(item.id)}" data-type="${escapeHtml(board)}" data-scope="${escapeHtml(scope)}" data-category="${escapeHtml(item.category)}">
        <div class="worklog-card__meta">
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.status)}</span>
          ${scopePill}
          ${boardPill}
          ${storagePill}
          ${aiPill}
          ${reviewPill}
          <span class="pill">${escapeHtml(item.source)}</span>
        </div>
        <h2 class="worklog-card__title">${escapeHtml(item.title)}</h2>
        <p class="worklog-card__summary">${escapeHtml(item.summary)}</p>
        <div class="worklog-card__footer">
          <span>${escapeHtml(getWhenLabel(item))}</span>
          <span>Ouvrir</span>
        </div>
      </button>
    `;
  }

  function renderFilters() {
    const categories = getCategories();
    filterList.innerHTML = categories
      .map((category) => `
        <button class="filter-button" type="button" data-category-filter="${escapeHtml(category)}" aria-pressed="${category === state.category}">
          ${escapeHtml(category)}
        </button>
      `)
      .join("");
  }

  function renderCards() {
    const visibleItems = getVisibleItems();
    const currentItems = getCurrentItems();
    const doneItems = getDoneItems();
    const pendingItems = getPendingItems();
    const pendingScopeCounts = getPendingScopeCounts();

    cardsGrid.innerHTML = visibleItems.map(WorklogCard).join("");
    visibleCount.textContent = visibleItems.length;
    totalCount.textContent = currentItems.length;
    doneTotal.textContent = doneItems.length;
    pendingTotal.textContent = pendingItems.length;
    pendingV1Total.textContent = pendingScopeCounts.v1;
    pendingLaterTotal.textContent = pendingScopeCounts.later;
    sourceCount.textContent = (meta?.sources?.length || 2) + (sessionDoneItems.length || sessionPendingItems.length ? 1 : 0);
    currentViewLabel.textContent = state.view === "pending" ? "entrees en attente" : "entrees faites";
    dataBreakdown.textContent = `Tri: plus recent d'abord. Base: ${sessionDoneItems.length + sessionPendingItems.length} cartes session, ${meta?.counts?.worklogSections || 0} sections worklog, ${meta?.counts?.todoDone || 0} points TODO valides, ${pendingScopeCounts.v1} points V1, ${pendingScopeCounts.later} idees plus tard et ${sharedValidations.size} validations partagees.`;
    emptyState.hidden = visibleItems.length > 0;
  }

  function renderBoardSwitch() {
    boardSwitch.querySelectorAll("[data-view]").forEach((button) => {
      const isActive = button.dataset.view === state.view;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderScopeSwitch() {
    scopeSwitch.hidden = state.view !== "pending";
    scopeSwitch.querySelectorAll("[data-scope-filter]").forEach((button) => {
      const isActive = button.dataset.scopeFilter === state.pendingScope;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function render() {
    renderSyncStatus();
    renderBoardSwitch();
    renderScopeSwitch();
    renderFilters();
    renderCards();
  }

  function openModal(itemId) {
    const item = allItems.find((entry) => entry.id === itemId);
    if (!item) return;

    activeModalItemId = itemId;
    const board = getItemBoard(item);
    const scope = getItemScope(item);
    const sourceType = getSourceType(item);
    const validationStorage = getValidationStorage(item);
    const sharedValidation = sharedValidations.get(item.id);
    const nextScope = scope === "later" ? "v1" : "later";
    const nextBoard = board === "pending" ? "done" : "pending";
    const scopeInfo = board === "pending"
      ? `
        <div class="modal__info">
          <span>Priorite</span>
          <strong>${escapeHtml(getScopeLabel(scope))}</strong>
        </div>
      `
      : "";
    const reviewInfo = item.humanReview
      ? `
        <div class="modal__info modal__info--review">
          <span>Verification humaine</span>
          <strong>${escapeHtml(item.reviewNote || "A verifier en usage reel.")}</strong>
        </div>
      `
      : "";
    const aiInfo = item.aiValidated
      ? `
        <div class="modal__info modal__info--ai">
          <span>Validation IA</span>
          <strong>${escapeHtml(item.aiNote || "Valide par tests automatises.")}</strong>
        </div>
      `
      : "";
    const validationInfo = validationStorage === "shared"
      ? `
        <div class="modal__info modal__info--shared">
          <span>Stockage de la validation</span>
          <strong>Fichier partage - ${escapeHtml(formatValidationDate(sharedValidation?.validatedAt))}</strong>
        </div>
      `
      : validationStorage === "local"
        ? `
          <div class="modal__info modal__info--local">
            <span>Stockage de la validation</span>
            <strong>Local seulement - Codex ne peut pas encore lire ce choix</strong>
          </div>
        `
        : "";
    const todoReferenceInfo = sourceType === "todo" && item.todoReference
      ? `
        <div class="modal__info">
          <span>Reference TODO.md</span>
          <strong>Ligne ${escapeHtml(item.todoReference.line)} - ${escapeHtml(item.todoReference.section)}</strong>
        </div>
      `
      : `
        <div class="modal__info">
          <span>Type de source</span>
          <strong>${sourceType === "session" ? "Carte de session Codex" : "Entree du worklog"}</strong>
        </div>
      `;
    const scopeAction = board === "pending"
      ? `
        <button class="modal__scope-button" type="button" data-scope-action="${escapeHtml(nextScope)}" data-item-id="${escapeHtml(item.id)}">
          ${scope === "later" ? "Remettre dans la V1" : "Mettre cette carte a plus tard"}
        </button>
      `
      : "";
    const syncAction = validationStorage === "local" && board === "done"
      ? `
        <button class="modal__sync-button" type="button" data-sync-validation data-item-id="${escapeHtml(item.id)}">
          Enregistrer cette validation dans le fichier partage
        </button>
      `
      : "";
    const storageNote = validationStorage === "shared"
      ? "Cette validation est enregistree dans validation-data.json. Codex peut la lire, mais TODO.md ne sera jamais modifie automatiquement."
      : validationStorage === "local"
        ? "Cette validation existe seulement dans ce navigateur. Lance le serveur puis utilise le bouton d'enregistrement partage."
        : "Les changements de tableau utilisent le serveur Worklog. TODO.md reste intact tant que tu ne demandes pas explicitement a Codex de le mettre a jour.";

    modalContent.innerHTML = `
      <div data-category="${escapeHtml(item.category)}">
        <div class="worklog-card__meta">
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.status)}</span>
          ${board === "pending" ? `<span class="pill pill--scope-${escapeHtml(scope)}">${escapeHtml(getScopeLabel(scope))}</span>` : ""}
          ${board !== item.type ? `<span class="pill pill--manual">${board === "pending" ? "Remis en attente" : "Marque fait"}</span>` : ""}
          ${validationStorage === "shared" ? '<span class="pill pill--shared">Fichier partage</span>' : ""}
          ${validationStorage === "local" ? '<span class="pill pill--local">Local seulement</span>' : ""}
          ${item.aiValidated ? '<span class="pill pill--ai">IA valide</span>' : ""}
          ${item.humanReview ? '<span class="pill pill--review">A verifier humainement</span>' : ""}
          <span class="pill">${escapeHtml(item.sourceKind || item.source)}</span>
        </div>
        <h2 id="modal-title">${escapeHtml(item.title)}</h2>
        <p class="modal__summary">${escapeHtml(item.summary)}</p>

        <div class="modal__grid">
          <div class="modal__info">
            <span>Date / heure</span>
            <strong>${escapeHtml(getWhenLabel(item, { includeMissingTime: true }))}</strong>
          </div>
          <div class="modal__info">
            <span>Impact</span>
            <strong>${escapeHtml(item.impact)}</strong>
          </div>
          <div class="modal__info">
            <span>Source</span>
            <strong>${escapeHtml(item.source)} - ${escapeHtml(sourceType)}</strong>
          </div>
          <div class="modal__info">
            <span>Tableau</span>
            <strong>${escapeHtml(board === "pending" ? "A faire / en attente" : "Fait")}</strong>
          </div>
          ${scopeInfo}
          ${todoReferenceInfo}
          ${validationInfo}
          ${aiInfo}
          ${reviewInfo}
        </div>

        <ul class="details-list">
          ${(item.details || []).map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}
        </ul>

        <div class="file-list" aria-label="Fichiers concernes">
          ${(item.files || []).map((file) => `<span class="pill">${escapeHtml(file)}</span>`).join("")}
        </div>
        <div class="modal__actions">
          <button class="modal__board-button" type="button" data-board-action="${escapeHtml(nextBoard)}" data-item-id="${escapeHtml(item.id)}">
            ${board === "pending" ? "Marquer cette carte comme faite" : "Remettre cette carte en attente"}
          </button>
          ${syncAction}
          ${scopeAction}
          <p class="modal__scope-note">
            ${escapeHtml(storageNote)}
          </p>
        </div>
      </div>
    `;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal__close").focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeModalItemId = null;
  }

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCards();
  });

  boardSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;

    state.view = button.dataset.view;
    state.category = "Tout";
    state.pendingScope = "all";
    render();
  });

  scopeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scope-filter]");
    if (!button) return;

    state.pendingScope = button.dataset.scopeFilter;
    renderScopeSwitch();
    renderCards();
  });

  filterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-filter]");
    if (!button) return;

    state.category = button.dataset.categoryFilter;
    render();
  });

  cardsGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-id]");
    if (!card) return;

    openModal(card.dataset.id);
  });

  modal.addEventListener("click", async (event) => {
    const boardButton = event.target.closest("[data-board-action]");
    if (boardButton) {
      const item = allItems.find((entry) => entry.id === boardButton.dataset.itemId);
      const requestedBoard = boardButton.dataset.boardAction;
      const originalLabel = boardButton.textContent;
      boardButton.disabled = true;
      boardButton.textContent = "Enregistrement...";

      const changed = await changeItemBoard(item, requestedBoard);
      if (!changed) {
        render();
        openModal(boardButton.dataset.itemId);
        return;
      }

      if (state.view !== requestedBoard) state.view = requestedBoard;
      state.category = "Tout";
      state.pendingScope = "all";
      render();
      openModal(boardButton.dataset.itemId);
      boardButton.disabled = false;
      boardButton.textContent = originalLabel;
      return;
    }

    const syncButton = event.target.closest("[data-sync-validation]");
    if (syncButton) {
      const item = allItems.find((entry) => entry.id === syncButton.dataset.itemId);
      syncButton.disabled = true;
      syncButton.textContent = "Enregistrement...";

      try {
        await saveSharedValidation(item);
      } catch (error) {
        setSyncState(
          "error",
          "Ecriture du fichier impossible",
          `La validation reste locale. ${error.message}`
        );
      }

      render();
      openModal(syncButton.dataset.itemId);
      return;
    }

    const scopeButton = event.target.closest("[data-scope-action]");
    if (scopeButton) {
      const item = allItems.find((entry) => entry.id === scopeButton.dataset.itemId);
      setItemScope(item, scopeButton.dataset.scopeAction);
      render();
      openModal(scopeButton.dataset.itemId);
      return;
    }

    if (event.target.closest("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  syncRetry?.addEventListener("click", () => {
    loadSharedValidations();
  });

  render();
  loadSharedValidations();
})();
