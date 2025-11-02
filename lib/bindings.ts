// 🥐 Bunery Core Bindings System
// Clean, type-safe binding system for Frontend ↔ Backend communication

import type { Webview } from "webview-bun";

type BindingHandler = (...args: any[]) => any | Promise<any>;
type BindingMap = Record<string, BindingHandler>;

/**
 * Register multiple bindings at once
 * Auto-prefixes with __ and handles JSON serialization
 */
export function registerBindings(webview: Webview, bindings: BindingMap) {
  for (const [name, handler] of Object.entries(bindings)) {
    const bindingName = name.startsWith("__") ? name : `__${name}`;
    
    // webview.bind expects a SYNC function that returns string directly
    webview.bind(bindingName, (argsJson: string) => {
      try {
        // Parse arguments if provided
        const args = argsJson && argsJson.trim() ? JSON.parse(argsJson) : undefined;
        
        // Call handler (must be sync!)
        const result = handler(args);
        
        // Serialize and return
        return JSON.stringify(result);
      } catch (error) {
        // Return error in consistent format
        return JSON.stringify({
          error: true,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
}

/**
 * Create a typed binding helper for the frontend
 * Usage: const api = createBindingClient(['getCounter', 'increment']);
 */
export function generateBindingTypes(bindings: BindingMap): string {
  const types = Object.keys(bindings).map((name) => {
    const bindingName = name.startsWith("__") ? name : `__${name}`;
    return `  ${bindingName}: (args?: any) => Promise<string>;`;
  });

  return `
declare global {
  interface Window {
${types.join("\n")}
  }
}
`.trim();
}

/**
 * Helper for frontend: Auto-parse JSON responses
 */
export const bindingHelpers = `
// Auto-generated binding helpers
async function call(binding: string, args?: any) {
  const fn = (window as any)[binding];
  if (!fn) throw new Error(\`Binding \${binding} not found\`);
  
  const resultStr = await fn(args ? JSON.stringify(args) : undefined);
  const result = JSON.parse(resultStr);
  
  if (result.error) {
    throw new Error(result.message);
  }
  
  return result;
}

// Export convenient API
export const api = {
  call,
  // Add your bindings here for autocomplete
};
`.trim();

