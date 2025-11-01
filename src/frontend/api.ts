// 🐝 Type-safe API wrapper for Hive bindings

interface BindingResult<T> {
  value?: T;
  error?: boolean;
  message?: string;
}

async function call<T>(binding: string, args?: any): Promise<T> {
  const fn = (window as any)[`__${binding}`];
  if (!fn) throw new Error(`Binding ${binding} not found`);
  
  const resultStr = await fn(args ? JSON.stringify(args) : undefined);
  const result: BindingResult<T> = JSON.parse(resultStr);
  
  if (result.error) {
    throw new Error(result.message || 'Unknown error');
  }
  
  return result as T;
}

// Type-safe API
export const api = {
  getCounter: () => call<{ value: number }>('getCounter'),
  increment: () => call<{ value: number }>('increment'),
  decrement: () => call<{ value: number }>('decrement'),
  reset: () => call<{ value: number }>('reset'),
};

