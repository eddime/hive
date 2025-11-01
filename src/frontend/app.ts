// 🐝 Hive Frontend - Your App Logic
// 👉 PUT YOUR FRONTEND CODE HERE

// API base URL (auto-injected by Hive)
const API_BASE_URL = (window as any).API_BASE_URL || "http://localhost:3000";

// Hot Module Replacement - keeps your app state during development
if (import.meta.hot) {
  import.meta.hot.accept();
  
  if (!import.meta.hot.data.initialized) {
    console.log("🔥 Hot Reload: First load");
    import.meta.hot.data.initialized = true;
  } else {
    console.log("🔥 Hot Reload: Module updated");
    loadUsers(); // Reload data after hot update
  }
}

// API utility functions
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const url = API_BASE_URL + endpoint;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Get Bun version (injected by the app or from API)
async function loadVersion() {
  const versionElement = document.getElementById("bun-version");
  if (!versionElement) return;
  
  // First try to get version from injected window variable
  if ((window as any).BUN_VERSION) {
    versionElement.textContent = (window as any).BUN_VERSION;
    return;
  }
  
  // Fallback: try to get from API
  try {
    const data = await apiRequest("/api/version");
    versionElement.textContent = data.version;
  } catch (error) {
    console.error("Failed to load version:", error);
    versionElement.textContent = "Unknown";
  }
}

// Load and display users (use binding if available, fallback to API)
async function loadUsers() {
  try {
    let users;
    if ((window as any).__getUsers) {
      // Use webview binding
      console.log("Loading users via binding");
      const resultStr = await (window as any).__getUsers();
      console.log("Users raw response:", resultStr);
      users = JSON.parse(resultStr);
      console.log("Parsed users:", users);
    } else {
      // Fallback to HTTP API
      users = await apiRequest("/api/users");
    }
    renderUsers(users);
  } catch (error) {
    console.error("Failed to load users - detailed:", error);
    console.error("Error message:", (error as any).message);
    showError("Failed to load users. Please try again.");
  }
}

// Render users list
function renderUsers(users: Array<{ id: number; name: string; email: string }>) {
  const usersList = document.getElementById("users-list");
  if (!usersList) return;

  if (users.length === 0) {
    usersList.innerHTML = '<p class="empty-state">No users yet. Add one above!</p>';
    return;
  }

  usersList.innerHTML = users
    .map(
      (user) => `
    <div class="user-card">
      <div class="user-info">
        <h3>${escapeHtml(user.name)}</h3>
        <p>${escapeHtml(user.email)}</p>
      </div>
      <button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>
    </div>
  `
    )
    .join("");
}

// Create new user (use binding if available, fallback to API)
async function createUser(name: string, email: string) {
  try {
    console.log("Creating user:", name, email);
    
    if ((window as any).__createUser) {
      // Use webview binding
      console.log("Using binding to create user");
      const args = JSON.stringify({ name, email });
      console.log("Sending to backend:", args);
      const resultStr = await (window as any).__createUser(args);
      console.log("Received from backend:", resultStr);
      const result = JSON.parse(resultStr);
      console.log("Parsed result:", result);
    } else {
      // Fallback to HTTP API
      console.log("Using HTTP API to create user");
      await apiRequest("/api/users", {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
    }

    // Clear form
    const nameInput = document.getElementById("user-name") as HTMLInputElement;
    const emailInput = document.getElementById("user-email") as HTMLInputElement;
    if (nameInput) nameInput.value = "";
    if (emailInput) emailInput.value = "";

    // Reload users
    await loadUsers();
  } catch (error) {
    console.error("Failed to create user - detailed error:", error);
    console.error("Error type:", typeof error);
    console.error("Error message:", (error as any).message);
    console.error("Error stack:", (error as any).stack);
    showError(`Failed to create user: ${(error as any).message || error}`);
  }
}

// Delete user (use binding if available, fallback to API)
async function deleteUser(id: number) {
  if (!confirm("Are you sure you want to delete this user?")) {
    return;
  }

  try {
    if ((window as any).__deleteUser) {
      // Use webview binding
      const resultStr = await (window as any).__deleteUser(String(id));
      JSON.parse(resultStr); // Just to validate response
    } else {
      // Fallback to HTTP API
      await apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      });
    }

    // Reload users
    await loadUsers();
  } catch (error) {
    console.error("Failed to delete user:", error);
    showError("Failed to delete user. Please try again.");
  }
}

// Show error message
function showError(message: string) {
  const container = document.querySelector(".container");
  if (!container) return;

  let errorDiv = document.querySelector(".error") as HTMLElement;
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.className = "error";
    container.appendChild(errorDiv);
  }

  errorDiv.textContent = message;
  setTimeout(() => {
    if (errorDiv) {
      errorDiv.remove();
    }
  }, 5000);
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Test backend connection using webview bindings
async function testBackend() {
  const responseElement = document.getElementById("backend-response");
  const button = document.getElementById("test-backend-btn") as HTMLButtonElement;
  
  if (!responseElement || !button) return;
  
  button.disabled = true;
  button.textContent = "⏳ Testing...";
  responseElement.textContent = "Calling backend via binding...";
  responseElement.style.color = "white";
  
  try {
    console.log("Checking if __pingBackend exists:", typeof (window as any).__pingBackend);
    
    if (!(window as any).__pingBackend) {
      throw new Error("__pingBackend binding not found!");
    }
    
    const startTime = performance.now();
    // Use webview binding instead of HTTP request
    const resultStr = await (window as any).__pingBackend();
    console.log("Received from backend:", resultStr);
    const data = JSON.parse(resultStr);
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    responseElement.textContent = `✅ ${data.message} (${responseTime}ms) - Bun ${data.bunVersion}`;
    responseElement.style.color = "#4ade80";
  } catch (error) {
    console.error("Backend test failed:", error);
    responseElement.textContent = `❌ Backend binding failed: ${error}`;
    responseElement.style.color = "#f87171";
  } finally {
    button.disabled = false;
    button.textContent = "🔄 Test Backend Connection";
  }
}

// Make functions available globally
(window as any).deleteUser = deleteUser;
(window as any).testBackend = testBackend;

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Load initial data
  loadVersion();
  loadUsers();

  // Setup form handler
  const form = document.getElementById("user-form") as HTMLFormElement;
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("user-name") as HTMLInputElement;
      const emailInput = document.getElementById(
        "user-email"
      ) as HTMLInputElement;

      if (nameInput && emailInput) {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (name && email) {
          await createUser(name, email);
        }
      }
    });
  }
  
  // Setup test backend button
  const testBtn = document.getElementById("test-backend-btn");
  if (testBtn) {
    testBtn.addEventListener("click", testBackend);
  }
});
