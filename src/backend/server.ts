// 🐝 Hive Backend - Your App Logic
// 👉 PUT YOUR BACKEND LOGIC HERE
// All functions exported here can be called from the frontend via bindings

// Example: Simple counter state
let counter = 0;

export function getCounter() {
  return counter;
}

export function incrementCounter() {
  counter++;
  return counter;
}

export function decrementCounter() {
  counter--;
  return counter;
}

export function resetCounter() {
  counter = 0;
  return counter;
}
