// 🥐 Bunery Frontend - Modern, Minimal, Fast

// Simple binding wrapper that matches our new Promise-based API
async function callBinding<T>(name: string): Promise<T> {
  const fn = (window as any)[`__${name}`];
  if (!fn) throw new Error(`Binding ${name} not found`);
  
  // Call with empty args array (no parameters needed for counter)
  const result = await fn();
  
  if (result && result.error) {
    throw new Error(result.message || 'Unknown error');
  }
  
  return result as T;
}

// API
const api = {
  getCounter: () => callBinding<{ value: number }>('getCounter'),
  increment: () => callBinding<{ value: number }>('increment'),
  decrement: () => callBinding<{ value: number }>('decrement'),
  reset: () => callBinding<{ value: number }>('reset'),
};

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept();
  if (import.meta.hot.data.initialized) loadCounter();
  else import.meta.hot.data.initialized = true;
    }

// DOM Cache
const counter = document.getElementById('counter')!;

// State
let currentValue = 0;

// Update UI with animation
function updateCounter(value: number) {
  currentValue = value;
  counter.textContent = String(value);
  counter.classList.add('pulse');
  setTimeout(() => counter.classList.remove('pulse'), 300);
}

// Load initial state
async function loadCounter() {
  try {
    const { value } = await api.getCounter();
    updateCounter(value);
  } catch (error) {
    console.error('Failed to load counter:', error);
  }
}

// Actions
(window as any).increment = async () => {
  const { value } = await api.increment();
  updateCounter(value);
};

(window as any).decrement = async () => {
  const { value } = await api.decrement();
  updateCounter(value);
};

(window as any).reset = async () => {
  const { value } = await api.reset();
  updateCounter(value);
};

// Initialize
loadCounter();
