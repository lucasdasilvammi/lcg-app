#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const http = require("http");

const SITE_DIR = __dirname;
const PROJECT_ROOT = path.resolve(SITE_DIR, "..", "..");
const ASSET_ROOT = path.join(PROJECT_ROOT, "client", "public", "assets");
const DEFAULT_VALIDATION_FILE = path.join(SITE_DIR, "validation-data.json");
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4173;
const MAX_BODY_BYTES = 100 * 1024;

const STATIC_FILES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/app.js", "app.js"],
  ["/session-data.js", "session-data.js"],
  ["/worklog-data.js", "worklog-data.js"]
]);

function emptyValidationData() {
  return {
    version: 1,
    updatedAt: null,
    validations: []
  };
}

function ensureValidationFile(filePath) {
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(emptyValidationData(), null, 2)}\n`, "utf8");
}

function readValidationData(filePath) {
  ensureValidationFile(filePath);
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));

  if (!parsed || !Array.isArray(parsed.validations)) {
    throw new Error("validation-data.json must contain a validations array.");
  }

  return {
    version: 1,
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    validations: parsed.validations
  };
}

function writeValidationData(filePath, data) {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  const output = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(temporaryPath, output, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

function requireShortString(value, field, maxLength = 500) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }

  return value.trim().slice(0, maxLength);
}

function optionalString(value, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeTodoReference(value) {
  if (!value || typeof value !== "object") {
    throw new Error("todoReference is required for TODO.md cards.");
  }

  const line = Number(value.line);
  if (!Number.isInteger(line) || line < 1) {
    throw new Error("todoReference.line must be a positive integer.");
  }

  return {
    file: requireShortString(value.file, "todoReference.file", 120),
    line,
    section: requireShortString(value.section, "todoReference.section", 500),
    taskText: requireShortString(value.taskText, "todoReference.taskText", 2000),
    markdown: requireShortString(value.markdown, "todoReference.markdown", 2500)
  };
}

function normalizeValidationInput(value, existing) {
  if (!value || typeof value !== "object") {
    throw new Error("A validation object is required.");
  }

  const sourceType = requireShortString(value.sourceType, "sourceType", 40);
  if (!["todo", "session", "worklog"].includes(sourceType)) {
    throw new Error("sourceType must be todo, session or worklog.");
  }

  return {
    id: requireShortString(value.id, "id", 500),
    title: requireShortString(value.title, "title", 500),
    source: requireShortString(value.source, "source", 200),
    sourceType,
    status: "done",
    cardStatus: optionalString(value.cardStatus, 200),
    validatedAt: existing?.validatedAt || new Date().toISOString(),
    todoReference: sourceType === "todo" ? normalizeTodoReference(value.todoReference) : null
  };
}

function sendJson(response, statusCode, value) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store"
  });
  response.end(text);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".html") return "text/html; charset=utf-8";
  if (extension === ".css") return "text/css; charset=utf-8";
  if (extension === ".js") return "text/javascript; charset=utf-8";
  if (extension === ".ttf") return "font/ttf";
  if (extension === ".woff") return "font/woff";
  if (extension === ".woff2") return "font/woff2";
  return "application/octet-stream";
}

function serveFile(response, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    sendText(response, 404, "Not found");
    return;
  }

  const content = fs.readFileSync(filePath);
  response.writeHead(200, {
    "Content-Type": getContentType(filePath),
    "Content-Length": content.length,
    "Cache-Control": "no-cache"
  });
  response.end(content);
}

function resolveAssetPath(pathname) {
  const prefix = "/client/public/assets/";
  if (!pathname.startsWith(prefix)) return null;

  const relativePath = decodeURIComponent(pathname.slice(prefix.length));
  const resolvedPath = path.resolve(ASSET_ROOT, relativePath);
  const assetRootWithSeparator = `${ASSET_ROOT}${path.sep}`;

  if (resolvedPath !== ASSET_ROOT && !resolvedPath.startsWith(assetRootWithSeparator)) {
    return null;
  }

  return resolvedPath;
}

function createWorklogServer(options = {}) {
  const validationFile = path.resolve(options.validationFile || DEFAULT_VALIDATION_FILE);
  ensureValidationFile(validationFile);
  let writeQueue = Promise.resolve();

  function queueValidationUpdate(update) {
    const operation = writeQueue.then(() => {
      const current = readValidationData(validationFile);
      const next = update(current);
      writeValidationData(validationFile, next);
      return next;
    });

    writeQueue = operation.catch(() => {});
    return operation;
  }

  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const pathname = url.pathname;

      if (request.method === "GET" && pathname === "/api/health") {
        sendJson(response, 200, { ok: true, validationFile });
        return;
      }

      if (request.method === "GET" && pathname === "/api/validations") {
        sendJson(response, 200, readValidationData(validationFile));
        return;
      }

      if (request.method === "POST" && pathname === "/api/validations") {
        const body = await readJsonBody(request);
        let storedValidation = null;
        const nextData = await queueValidationUpdate((current) => {
          const existing = current.validations.find((entry) => entry.id === body.id);
          storedValidation = normalizeValidationInput(body, existing);
          const validations = current.validations.filter((entry) => entry.id !== storedValidation.id);
          validations.push(storedValidation);
          validations.sort((a, b) => a.validatedAt.localeCompare(b.validatedAt));

          return {
            version: 1,
            updatedAt: new Date().toISOString(),
            validations
          };
        });

        sendJson(response, 200, {
          validation: storedValidation,
          updatedAt: nextData.updatedAt
        });
        return;
      }

      if (request.method === "DELETE" && pathname.startsWith("/api/validations/")) {
        const id = decodeURIComponent(pathname.slice("/api/validations/".length));
        if (!id) {
          sendJson(response, 400, { error: "Validation id is required." });
          return;
        }

        let removed = false;
        const nextData = await queueValidationUpdate((current) => {
          const validations = current.validations.filter((entry) => {
            if (entry.id === id) {
              removed = true;
              return false;
            }
            return true;
          });

          return {
            version: 1,
            updatedAt: new Date().toISOString(),
            validations
          };
        });

        sendJson(response, 200, {
          removed,
          id,
          updatedAt: nextData.updatedAt
        });
        return;
      }

      if (request.method === "GET" || request.method === "HEAD") {
        const staticFile = STATIC_FILES.get(pathname);
        if (staticFile) {
          serveFile(response, path.join(SITE_DIR, staticFile));
          return;
        }

        const assetPath = resolveAssetPath(pathname);
        if (assetPath) {
          serveFile(response, assetPath);
          return;
        }
      }

      sendText(response, 404, "Not found");
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : "Unexpected server error."
      });
    }
  });
}

if (require.main === module) {
  const host = process.env.WORKLOG_HOST || DEFAULT_HOST;
  const port = Number(process.env.WORKLOG_PORT || DEFAULT_PORT);
  const server = createWorklogServer();

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Le port ${port} est deja utilise. Le serveur Worklog est peut-etre deja lance.`);
      console.error(`Essaie d'abord d'ouvrir http://${host}:${port}`);
      process.exitCode = 1;
      return;
    }

    throw error;
  });

  server.listen(port, host, () => {
    console.log(`Worklog site: http://${host}:${port}`);
    console.log(`Shared validations: ${DEFAULT_VALIDATION_FILE}`);
  });
}

module.exports = {
  createWorklogServer,
  readValidationData,
  DEFAULT_VALIDATION_FILE
};
