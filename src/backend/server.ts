// 🐝 Hive Backend - Server & State Management
// 👉 PUT YOUR BACKEND LOGIC HERE

import { serve } from "bun";

// Example: In-memory data store (replace with your own!)
let users: Array<{ id: number; name: string; email: string }> = [];
let nextId = 1;

// Export functions for direct access from webview bindings
export function getUsers() {
  return users;
}

export function createUser(name: string, email: string) {
  if (!name || !email) {
    throw new Error("Name and email required");
  }
  const user = { id: nextId++, name, email };
  users.push(user);
  return user;
}

export function deleteUser(id: number) {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error("User not found");
  }
  users.splice(index, 1);
  return { success: true };
}

import config from "../../hive.config";

// Minimal server with HMR support for development
const server = serve({
  port: config.server.port,
  development: config.server.hmr ? { hmr: true } : false,
  fetch() {
    // Server is running but not serving HTTP traffic
    // All communication happens through webview bindings
    return new Response("Hive server running", { status: 200 });
  },
});

console.log(`🌐 Server running on ${server.url}`);

export default server;
export const port = server.port;
