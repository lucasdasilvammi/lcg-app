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

  const state = {
    view: "done",
    pendingScope: "all",
    category: "Tout",
    query: ""
  };

  let scopeOverrides = loadJsonStorage(SCOPE_STORAGE_KEY);
  let boardOverrides = loadJsonStorage(BOARD_STORAGE_KEY);
  const allItems = sortItems([
    ...sessionDoneItems,
    ...sessionPendingItems,
    ...generatedDoneItems,
    ...generatedPendingItems
  ]);

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

  function getItemBoard(item) {
    return boardOverrides[item.id] || item.type || "done";
  }

  function setItemBoard(item, board) {
    if (!item || !["done", "pending"].includes(board)) return;

    if (board === item.type) {
      delete boardOverrides[item.id];
    } else {
      boardOverrides[item.id] = board;
    }

    saveJsonStorage(BOARD_STORAGE_KEY, boardOverrides);
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

    return `
      <button class="worklog-card" type="button" data-id="${escapeHtml(item.id)}" data-type="${escapeHtml(board)}" data-scope="${escapeHtml(scope)}" data-category="${escapeHtml(item.category)}">
        <div class="worklog-card__meta">
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.status)}</span>
          ${scopePill}
          ${boardPill}
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
    dataBreakdown.textContent = `Tri: plus recent d'abord. Base: ${sessionDoneItems.length + sessionPendingItems.length} cartes session, ${meta?.counts?.worklogSections || 0} sections worklog, ${meta?.counts?.todoDone || 0} points TODO valides, ${pendingScopeCounts.v1} points V1 et ${pendingScopeCounts.later} idees plus tard.`;
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
    renderBoardSwitch();
    renderScopeSwitch();
    renderFilters();
    renderCards();
  }

  function openModal(itemId) {
    const item = allItems.find((entry) => entry.id === itemId);
    if (!item) return;

    const board = getItemBoard(item);
    const scope = getItemScope(item);
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
    const scopeAction = board === "pending"
      ? `
        <button class="modal__scope-button" type="button" data-scope-action="${escapeHtml(nextScope)}" data-item-id="${escapeHtml(item.id)}">
          ${scope === "later" ? "Remettre dans la V1" : "Mettre cette carte a plus tard"}
        </button>
      `
      : "";

    modalContent.innerHTML = `
      <div data-category="${escapeHtml(item.category)}">
        <div class="worklog-card__meta">
          <span class="pill">${escapeHtml(item.category)}</span>
          <span class="pill">${escapeHtml(item.status)}</span>
          ${board === "pending" ? `<span class="pill pill--scope-${escapeHtml(scope)}">${escapeHtml(getScopeLabel(scope))}</span>` : ""}
          ${board !== item.type ? `<span class="pill pill--manual">${board === "pending" ? "Remis en attente" : "Marque fait"}</span>` : ""}
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
            <strong>${escapeHtml(item.source)}</strong>
          </div>
          <div class="modal__info">
            <span>Tableau</span>
            <strong>${escapeHtml(board === "pending" ? "A faire / en attente" : "Fait")}</strong>
          </div>
          ${scopeInfo}
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
          ${scopeAction}
          <p class="modal__scope-note">
            Ces choix sont sauvegardes dans ce navigateur. Ils ne modifient pas encore TODO.md ou WORKLOG.md.
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

  modal.addEventListener("click", (event) => {
    const boardButton = event.target.closest("[data-board-action]");
    if (boardButton) {
      const item = allItems.find((entry) => entry.id === boardButton.dataset.itemId);
      setItemBoard(item, boardButton.dataset.boardAction);
      if (state.view !== boardButton.dataset.boardAction) state.view = boardButton.dataset.boardAction;
      state.category = "Tout";
      state.pendingScope = "all";
      render();
      openModal(boardButton.dataset.itemId);
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

  render();
})();
