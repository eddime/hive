// 🐝 Hive Bindings - Frontend ↔ Backend Communication
// 👉 REGISTER YOUR BACKEND FUNCTIONS HERE
// All bindings are prefixed with __ to avoid naming conflicts

import type { Webview } from "webview-bun";

export function registerBindings(
  webview: Webview,
  serverUrl: string,
  getUsers: () => any[],
  createUser: (name: string, email: string) => any,
  deleteUser: (id: number) => any
) {
  // Ping test
  webview.bind("__pingBackend", () => {
    console.log("✅ pingBackend called");
    return JSON.stringify({
      message: "Backend is alive! 🎉",
      timestamp: new Date().toISOString(),
      bunVersion: Bun.version,
      serverUrl,
    });
  });

  // Get users
  webview.bind("__getUsers", () => {
    console.log("✅ getUsers called");
    const users = getUsers();
    return JSON.stringify(users);
  });

  // Create user
  webview.bind("__createUser", (args: string) => {
    console.log("✅ createUser called:", args);
    try {
      const { name, email } = JSON.parse(args);
      const user = createUser(name, email);
      console.log("User created:", user);
      return JSON.stringify(user);
    } catch (error) {
      console.error("❌ createUser error:", error);
      throw error;
    }
  });

  // Delete user
  webview.bind("__deleteUser", (idStr: string) => {
    console.log("✅ deleteUser called:", idStr);
    try {
      const id = parseInt(idStr);
      const result = deleteUser(id);
      return JSON.stringify(result);
    } catch (error) {
      console.error("❌ deleteUser error:", error);
      throw error;
    }
  });

  // Fullscreen toggle binding
  webview.bind("__toggleFullscreen", () => {
    console.log("✅ toggleFullscreen called");
    // Note: Fullscreen is handled via HTML5 Fullscreen API in the frontend
    return JSON.stringify({ success: true });
  });

  console.log("✅ Webview bindings registered");
}

