// 🥐 Bunery Bindings - Frontend ↔ Backend Communication
// 👉 REGISTER YOUR BACKEND FUNCTIONS HERE

import type { Webview } from "webview-bun";
import { registerBindings as register } from "../../lib/bindings";
import * as backend from "./server";

export function registerBindings(webview: Webview) {
  register(webview, {
    getCounter: () => ({ value: backend.getCounter() }),
    increment: () => ({ value: backend.incrementCounter() }),
    decrement: () => ({ value: backend.decrementCounter() }),
    reset: () => ({ value: backend.resetCounter() }),
  });
}

