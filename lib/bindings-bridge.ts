/**
 * 🔗 Bunery Bindings Bridge
 * 
 * Connects TypeScript callbacks with bunery-webview's message passing system
 * This runs in the Bun backend and handles messages from the webview
 */

export class BindingsBridge {
  private bindings: Map<string, Function> = new Map();
  
  /**
   * Register a binding that can be called from the webview
   */
  register(name: string, callback: Function): void {
    this.bindings.set(name, callback);
  }
  
  /**
   * Handle a message from the webview
   * This should be called by the C message handler
   */
  async handleMessage(bindingName: string, argsJson: string): Promise<string> {
    const binding = this.bindings.get(bindingName);
    
    if (!binding) {
      return JSON.stringify({ error: `Binding '${bindingName}' not found` });
    }
    
    try {
      // Parse args
      const args = JSON.parse(argsJson);
      
      // Call binding (webview-bun style: seq, req)
      // We pass empty seq and args as req
      const result = await binding("", argsJson);
      
      // Return result as JSON
      return typeof result === "string" ? result : JSON.stringify(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return JSON.stringify({ error: errorMsg });
    }
  }
  
  /**
   * Get all registered binding names
   */
  getBindings(): string[] {
    return Array.from(this.bindings.keys());
  }
}

export const globalBridge = new BindingsBridge();

