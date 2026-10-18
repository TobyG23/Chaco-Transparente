// Local-only browser smoke check; run against a locally served static export.
import { setTimeout as delay } from "node:timers/promises";

const base = process.argv[2] ?? "http://127.0.0.1:8765";
const debug = process.argv[3] ?? "http://127.0.0.1:9223";
const routes = [
  "/",
  "/datos/",
  "/fuentes/",
  "/metodologia/",
  "/proyecto/",
  "/estado/",
  "/404/",
];
const targets = await (await fetch(`${debug}/json`)).json();
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No browser page available");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let sequence = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const response = JSON.parse(data);
  if (!response.id) return;
  const waiter = pending.get(response.id);
  if (!waiter) return;
  pending.delete(response.id);
  if (response.error) waiter.reject(new Error(response.error.message));
  else waiter.resolve(response.result);
});
function call(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
function check(condition, description, state) {
  if (condition) return;
  console.error(`FAIL ${description}: ${JSON.stringify(state)}`);
  process.exitCode = 1;
}
const explorerSnapshot = `(() => {
  const explorer = document.querySelector('.explorer');
  if (!explorer) return null;
  const controls = explorer.querySelectorAll('.explorer-controls select');
  const rows = [...explorer.querySelectorAll('tbody tr')];
  const pageButtons = explorer.querySelectorAll('.explorer-pages button');
  return {
    status: explorer.querySelector('[role="status"]')?.textContent.trim(),
    badge: explorer.querySelector('.demo-badge')?.textContent.trim(),
    view: controls[0]?.value,
    search: explorer.querySelector('input[type="search"]')?.value,
    category: controls[1]?.value,
    source: controls[2]?.value,
    categories: [...(controls[1]?.options ?? [])].map((option) => option.value),
    column: explorer.querySelector('thead th:nth-child(2)')?.textContent.trim(),
    amountSort: explorer.querySelector('thead th:nth-child(4)')?.getAttribute('aria-sort'),
    rows: rows.map((row) => [...row.cells].map((cell) => cell.textContent.trim())),
    page: explorer.querySelector('.explorer-pages span')?.textContent.trim(),
    previousDisabled: pageButtons[0]?.disabled,
    nextDisabled: pageButtons[1]?.disabled,
    alert: explorer.querySelector('[role="alert"]')?.textContent.trim(),
    busy: Boolean(explorer.querySelector('[aria-busy="true"]')),
    width: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth
  };
})()`;
async function snapshot() {
  return evaluate(explorerSnapshot);
}
async function waitForExplorer(description, predicate) {
  let state;
  for (let attempt = 0; attempt < 50; attempt++) {
    state = await snapshot();
    if (state && predicate(state)) {
      check(
        state.contentWidth <= state.width + 1,
        `${description} page overflow`,
        state,
      );
      console.log(`explorer ${description}: ${JSON.stringify(state)}`);
      return state;
    }
    await delay(100);
  }
  throw new Error(
    `Timed out waiting for explorer ${description}: ${JSON.stringify(state)}`,
  );
}
async function setControl(selector, value) {
  await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) throw new Error('Missing explorer control');
    const prototype = element instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  })()`);
}
async function clickExplorer(selector) {
  await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) throw new Error('Missing explorer button');
    element.click();
  })()`);
}
async function pressEnter() {
  await call("Input.dispatchKeyEvent", {
    type: "char",
    text: "\r",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
  await call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
  });
}
async function checkExplorer(width) {
  const label = `${width}px`;
  let state = await waitForExplorer(
    `${label} hydration`,
    (s) =>
      s.status === "8 resultados sintéticos · página 1 de 2" &&
      s.rows.length === 5,
  );
  check(
    state.badge?.includes("no son registros oficiales"),
    `${label} synthetic label`,
    state,
  );
  check(
    state.view === "finalidad" && state.previousDisabled && !state.nextDisabled,
    `${label} initial view and pagination`,
    state,
  );

  await setControl('.explorer-controls select[aria-label="Vista"]', "objeto");
  state = await waitForExplorer(
    `${label} view change`,
    (s) =>
      s.view === "objeto" &&
      s.column?.includes("Objeto ficticio") &&
      s.categories.includes("Lápices mágicos") &&
      !s.categories.includes("Taller de cometas"),
  );
  check(
    state.rows.length === 5 &&
      state.search === "" &&
      state.category === "" &&
      state.source === "",
    `${label} view reset`,
    state,
  );

  await setControl('.explorer-controls input[type="search"]', "LAPICES");
  state = await waitForExplorer(
    `${label} search`,
    (s) =>
      s.status?.startsWith("2 resultados sintéticos") && s.rows.length === 2,
  );
  check(
    state.rows.every((row) => row[1] === "Lápices mágicos"),
    `${label} search rows`,
    state,
  );
  await setControl(
    '.explorer-controls input[type="search"]',
    "sin coincidencias",
  );
  state = await waitForExplorer(
    `${label} empty search`,
    (s) =>
      s.status === "0 resultados sintéticos · página 1 de 1" &&
      s.rows.length === 0,
  );
  check(!state.page && !state.alert, `${label} empty results`, state);
  await setControl('.explorer-controls input[type="search"]', "");
  await waitForExplorer(
    `${label} clear search`,
    (s) => s.search === "" && s.status?.startsWith("8 resultados sintéticos"),
  );

  await setControl(
    ".explorer-controls label:nth-child(3) select",
    "Lápices mágicos",
  );
  state = await waitForExplorer(
    `${label} category filter`,
    (s) => s.category === "Lápices mágicos" && s.rows.length === 2,
  );
  check(
    state.status?.startsWith("2 resultados sintéticos"),
    `${label} category results`,
    state,
  );

  await setControl(
    ".explorer-controls label:nth-child(4) select",
    "Caja de colores",
  );
  state = await waitForExplorer(
    `${label} source filter`,
    (s) =>
      s.source === "Caja de colores" &&
      s.rows.length === 1 &&
      s.status?.startsWith("1 resultado sintético"),
  );
  check(
    state.rows[0]?.[0] === "Club Cometa" && state.rows[0]?.[3] === "35",
    `${label} combined filters`,
    state,
  );

  await setControl(
    '.explorer-controls select[aria-label="Vista"]',
    "finalidad",
  );
  state = await waitForExplorer(
    `${label} reset filters`,
    (s) =>
      s.view === "finalidad" &&
      s.search === "" &&
      s.category === "" &&
      s.source === "" &&
      s.rows.length === 5 &&
      s.page === "Página 1 de 2",
  );

  await clickExplorer(".explorer-pages button:last-child");
  state = await waitForExplorer(
    `${label} next page`,
    (s) => s.page === "Página 2 de 2" && s.rows.length === 3,
  );
  check(
    !state.previousDisabled && state.nextDisabled,
    `${label} last page buttons`,
    state,
  );
  await clickExplorer(".explorer-pages button:first-child");
  state = await waitForExplorer(
    `${label} previous page`,
    (s) => s.page === "Página 1 de 2" && s.rows.length === 5,
  );
  check(
    state.previousDisabled && !state.nextDisabled,
    `${label} first page buttons`,
    state,
  );

  await call("Page.bringToFront");
  await evaluate(
    `document.querySelector('.explorer-table thead th:nth-child(4) button').focus()`,
  );
  check(
    await evaluate(
      `document.activeElement === document.querySelector('.explorer-table thead th:nth-child(4) button')`,
    ),
    `${label} keyboard focus`,
  );
  await pressEnter();
  state = await waitForExplorer(
    `${label} keyboard sort ascending`,
    (s) => s.amountSort === "ascending" && s.rows[0]?.[3] === "30",
  );
  await pressEnter();
  state = await waitForExplorer(
    `${label} keyboard sort descending`,
    (s) => s.amountSort === "descending" && s.rows[0]?.[3] === "200",
  );

  await clickExplorer(".demo-diagnostics summary");
  await clickExplorer(".demo-diagnostics button");
  state = await waitForExplorer(
    `${label} simulated error`,
    (s) =>
      Boolean(s.alert) &&
      s.status === "No se pudo cargar la demostración sintética.",
  );
  check(
    state.rows.length === 0 && state.alert.includes("Ningún recurso oficial"),
    `${label} error hides rows`,
    state,
  );
  await clickExplorer('.explorer-message[role="alert"] button');
  state = await waitForExplorer(
    `${label} retry`,
    (s) =>
      s.status === "8 resultados sintéticos · página 1 de 2" &&
      s.rows.length === 5,
  );
  check(
    !state.alert &&
      state.amountSort === "descending" &&
      state.rows[0]?.[3] === "200",
    `${label} retry restores explorer`,
    state,
  );
}
try {
  await call("Page.enable");
  await call("Runtime.enable");
  for (const width of [320, 390, 1440]) {
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 500,
    });
    for (const route of routes) {
      await call("Page.navigate", { url: `${base}${route}` });
      for (let attempt = 0; attempt < 30; attempt++) {
        await delay(100);
        if (await evaluate("document.readyState === 'complete'")) break;
      }
      const state = await evaluate(`(() => ({
        title: document.title,
        path: location.pathname,
        ready: document.readyState,
        heading: document.querySelector('h1')?.textContent,
        width: document.documentElement.clientWidth,
        contentWidth: document.documentElement.scrollWidth,
        links: [...document.querySelectorAll('.primary-nav a')].length,
        current: document.querySelectorAll('.primary-nav [aria-current="page"]').length,
        main: Boolean(document.querySelector('main#contenido')),
        skip: Boolean(document.querySelector('a[href="#contenido"]')),
        focus: getComputedStyle(document.querySelector('main')).outlineStyle,
        error: document.body.textContent.includes('Error response'),
        privacy: [...document.querySelectorAll('footer a')].some((link) => link.pathname === '/proyecto/' && link.hash === '#privacidad'),
        notice: location.pathname === '/proyecto/' ? Boolean(document.querySelector('#privacidad')) : true
      }))()`);
      console.log(`${width}px ${route} ${JSON.stringify(state)}`);
      if (route === "/" && width === 320) {
        await call("Input.dispatchKeyEvent", {
          type: "rawKeyDown",
          key: "Tab",
          code: "Tab",
          windowsVirtualKeyCode: 9,
        });
        await call("Input.dispatchKeyEvent", {
          type: "keyUp",
          key: "Tab",
          code: "Tab",
          windowsVirtualKeyCode: 9,
        });
        const firstFocus = await evaluate(
          "document.activeElement?.textContent?.trim()",
        );
        await call("Input.dispatchKeyEvent", {
          type: "rawKeyDown",
          key: "Enter",
          code: "Enter",
          windowsVirtualKeyCode: 13,
        });
        await call("Input.dispatchKeyEvent", {
          type: "keyUp",
          key: "Enter",
          code: "Enter",
          windowsVirtualKeyCode: 13,
        });
        const skipState = await evaluate(
          "({ id: document.activeElement?.id, outline: getComputedStyle(document.querySelector('main')).outlineStyle })",
        );
        console.log(
          `keyboard skip: ${JSON.stringify({ firstFocus, skipState })}`,
        );
        if (
          firstFocus !== "Saltar al contenido" ||
          skipState.id !== "contenido" ||
          skipState.outline === "none"
        )
          process.exitCode = 1;
      }
      if (
        !state.heading ||
        state.path !== route ||
        state.ready !== "complete" ||
        !state.main ||
        !state.skip ||
        state.links !== 6 ||
        state.current !== (route === "/404/" ? 0 : 1) ||
        !state.privacy ||
        !state.notice ||
        state.error ||
        state.contentWidth > state.width + 1
      ) {
        process.exitCode = 1;
      }
      if (route === "/datos/") await checkExplorer(width);
    }
  }
} finally {
  socket.close();
}
