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
    }
  }
} finally {
  socket.close();
}
