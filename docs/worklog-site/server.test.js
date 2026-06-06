const fs = require("fs");
const os = require("os");
const path = require("path");
const vm = require("vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const { createWorklogServer } = require("./server");

const SITE_DIR = __dirname;
const ROOT_DIR = path.resolve(SITE_DIR, "..", "..");
const TODO_PATH = path.join(ROOT_DIR, "TODO.md");
const DATA_PATH = path.join(SITE_DIR, "worklog-data.js");

function loadPendingTodoItems() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(DATA_PATH, "utf8"), context);
  return context.window.WORKLOG_PENDING_ITEMS.filter((item) => item.sourceType === "todo");
}

function validationPayload(item) {
  return {
    id: item.id,
    title: item.title,
    source: item.source,
    sourceType: item.sourceType,
    cardStatus: item.status,
    todoReference: item.todoReference
  };
}

async function startServer(validationFile) {
  const server = createWorklogServer({ validationFile });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`
  };
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

test("all generated TODO cards keep an exact source reference", () => {
  const todoItems = loadPendingTodoItems();
  const todoLines = fs.readFileSync(TODO_PATH, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);

  assert.equal(new Set(todoItems.map((item) => item.id)).size, todoItems.length);

  for (const item of todoItems) {
    assert.equal(item.sourceType, "todo");
    assert.equal(Array.isArray(item.legacyIds), true);
    assert.equal(item.legacyIds.length, 1);
    assert.equal(item.todoReference.file, "TODO.md");
    assert.equal(todoLines[item.todoReference.line - 1].trim(), item.todoReference.markdown);
    assert.ok(item.todoReference.section);
    assert.ok(item.todoReference.taskText);
  }
});

test("shared validations support add, remove, deduplicate and reload", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lcg-worklog-validation-"));
  const validationFile = path.join(tempDir, "validation-data.json");
  const todoItems = loadPendingTodoItems();
  const [firstItem, secondItem] = todoItems;
  const todoLines = fs.readFileSync(TODO_PATH, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);

  assert.ok(firstItem);
  assert.ok(secondItem);
  assert.notEqual(firstItem.id, secondItem.id);

  let running = await startServer(validationFile);

  try {
    await requestJson(`${running.baseUrl}/api/validations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validationPayload(firstItem))
    });

    let stored = JSON.parse(fs.readFileSync(validationFile, "utf8"));
    assert.equal(stored.validations.length, 1);
    assert.equal(stored.validations[0].id, firstItem.id);
    assert.equal(stored.validations[0].status, "done");
    assert.ok(stored.validations[0].validatedAt);
    assert.deepEqual(
      stored.validations[0].todoReference,
      JSON.parse(JSON.stringify(firstItem.todoReference))
    );

    await requestJson(`${running.baseUrl}/api/validations/${encodeURIComponent(firstItem.id)}`, {
      method: "DELETE"
    });

    stored = JSON.parse(fs.readFileSync(validationFile, "utf8"));
    assert.equal(stored.validations.length, 0);

    for (const item of [firstItem, firstItem, secondItem]) {
      await requestJson(`${running.baseUrl}/api/validations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationPayload(item))
      });
    }

    stored = JSON.parse(fs.readFileSync(validationFile, "utf8"));
    assert.equal(stored.validations.length, 2);
    assert.equal(new Set(stored.validations.map((entry) => entry.id)).size, 2);

    for (const validation of stored.validations) {
      const reference = validation.todoReference;
      assert.equal(todoLines[reference.line - 1].trim(), reference.markdown);
      assert.equal(todoLines.filter((line) => line.trim() === reference.markdown).length, 1);
    }

    await stopServer(running.server);
    running = await startServer(validationFile);

    const reloaded = await requestJson(`${running.baseUrl}/api/validations`);
    assert.equal(reloaded.validations.length, 2);
    assert.deepEqual(
      new Set(reloaded.validations.map((entry) => entry.id)),
      new Set([firstItem.id, secondItem.id])
    );

    const sessionValidation = {
      id: "session-test-validation-source",
      title: "Carte de session test",
      source: "Session Codex",
      sourceType: "session",
      cardStatus: "A verifier"
    };
    await requestJson(`${running.baseUrl}/api/validations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionValidation)
    });

    const withSession = await requestJson(`${running.baseUrl}/api/validations`);
    const storedSession = withSession.validations.find((entry) => entry.id === sessionValidation.id);
    assert.equal(storedSession.sourceType, "session");
    assert.equal(storedSession.todoReference, null);
  } finally {
    if (running.server.listening) await stopServer(running.server);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
