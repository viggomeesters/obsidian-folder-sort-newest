import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const PLUGIN_ID = "folder-sort-newest";
const DEFAULT_PORT = 9222;

async function main() {
  if (process.platform === "linux" && os.release().toLowerCase().includes("microsoft") && !process.env.FOLDER_SORT_CDP_WINDOWS_NODE) {
    const scriptPath = path.resolve(process.argv[1]);
    const wslpath = spawnSync("wslpath", ["-w", scriptPath], { encoding: "utf8" });
    if (wslpath.status !== 0) throw new Error(`wslpath failed: ${wslpath.stderr || wslpath.stdout}`);
    const command = `$env:FOLDER_SORT_CDP_WINDOWS_NODE='1'; node '${wslpath.stdout.trim().replaceAll("'", "''")}'`;
    const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", command], { stdio: "inherit" });
    process.exit(result.status ?? 1);
  }

  const target = await findTarget("127.0.0.1", DEFAULT_PORT);
  const client = await CdpClient.connect(target.webSocketDebuggerUrl);
  try {
    await client.send("Runtime.enable");
    const result = await evaluateSmoke(client);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    client.close();
  }
}

async function findTarget(host, port) {
  const response = await fetch(`http://${host}:${port}/json/list`);
  if (!response.ok) throw new Error(`CDP endpoint returned ${response.status}`);
  const targets = await response.json();
  const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  if (!target) throw new Error("No CDP page target found");
  return target;
}

async function evaluateSmoke(client) {
  const response = await client.send("Runtime.evaluate", {
    expression: `(${browserSmoke.toString()})(${JSON.stringify({ pluginId: PLUGIN_ID })})`,
    awaitPromise: true,
    returnByValue: true,
    timeout: 60_000,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text ?? JSON.stringify(response.exceptionDetails));
  return response.result.value;
}

async function browserSmoke({ pluginId }) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const assert = (condition, message, details = {}) => {
    if (!condition) {
      const error = new Error(message);
      error.details = details;
      throw error;
    }
  };
  const getFolderOrder = () => [...document.querySelectorAll(".nav-files-container > div > .tree-item .nav-folder-title")]
    .map((element) => element.getAttribute("data-path") ?? element.textContent?.trim() ?? "")
    .filter((path) => !path.includes("/"));

  assert(window.app?.vault?.getName?.() === "obsidian-test-vault", "Wrong vault is open", { vault: window.app?.vault?.getName?.() });

  if (window.app.plugins.plugins[pluginId]) {
    await window.app.plugins.disablePlugin(pluginId);
    await window.app.plugins.unloadPlugin(pluginId);
    await sleep(500);
  }

  const before = getFolderOrder();
  await window.app.plugins.loadPlugin(pluginId);
  await sleep(800);
  const view = window.app.workspace.getLeavesOfType("file-explorer")[0]?.view;
  view?.requestSort?.();
  await sleep(800);
  const afterEnable = getFolderOrder();

  await window.app.plugins.disablePlugin(pluginId);
  await sleep(800);
  view?.requestSort?.();
  await sleep(800);
  const afterDisable = getFolderOrder();

  const sortedDescending = [...afterEnable].sort((left, right) => right.localeCompare(left, undefined, { sensitivity: "base", numeric: true }));
  assert(afterEnable.length >= 3, "Not enough folders to prove folder ordering", { afterEnable });
  assert(JSON.stringify(afterEnable) === JSON.stringify(sortedDescending), "Folders were not sorted Z-to-A after enabling plugin", { afterEnable, sortedDescending });
  assert(JSON.stringify(afterDisable) !== JSON.stringify(afterEnable), "Disabling plugin did not restore native order", { afterDisable, afterEnable });

  return { ok: true, before, afterEnable, afterDisable };
}

class CdpClient {
  static connect(url) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      const client = new CdpClient(socket);
      socket.addEventListener("open", () => resolve(client), { once: true });
      socket.addEventListener("error", (event) => reject(new Error(event.message ?? "WebSocket connection failed")), { once: true });
    });
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.socket.addEventListener("message", (event) => this.onMessage(event));
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  close() {
    this.socket.close();
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(`${message.error.message}: ${message.error.data ?? ""}`.trim()));
    else pending.resolve(message.result);
  }
}

await main();
