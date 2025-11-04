// 🥐 Bunery Runtime API Types

/**
 * File System API
 */
export interface BuneryFS {
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  readDir(path: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  remove(path: string): Promise<void>;
  mkdir(path: string, recursive?: boolean): Promise<void>;
  stat(path: string): Promise<FileStats>;
}

export interface FileStats {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  modified: number;
  created: number;
}

/**
 * Operating System API
 */
export interface BuneryOS {
  platform(): Promise<'darwin' | 'win32' | 'linux'>;
  version(): Promise<string>;
  arch(): Promise<'x64' | 'arm64'>;
  info(): Promise<OSInfo>;
  env(name: string): Promise<string | undefined>;
}

export interface OSInfo {
  platform: string;
  version: string;
  arch: string;
  hostname: string;
  username: string;
}

/**
 * Window Control API
 */
export interface BuneryWindow {
  setTitle(title: string): Promise<void>;
  minimize(): Promise<void>;
  maximize(): Promise<void>;
  restore(): Promise<void>;
  close(): Promise<void>;
  setSize(width: number, height: number): Promise<void>;
  setPosition(x: number, y: number): Promise<void>;
  setFullscreen(enabled: boolean): Promise<void>;
  getState(): Promise<WindowState>;
}

export interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
}

/**
 * Dialog API
 */
export interface BuneryDialog {
  open(options?: OpenDialogOptions): Promise<string | string[] | null>;
  save(options?: SaveDialogOptions): Promise<string | null>;
  message(options: MessageDialogOptions): Promise<number>;
  confirm(message: string): Promise<boolean>;
}

export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
  multiple?: boolean;
  directory?: boolean;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface MessageDialogOptions {
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'error';
  buttons?: string[];
}

/**
 * Storage API
 */
export interface BuneryStorage {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

/**
 * Shell API
 */
export interface BuneryShell {
  execute(command: string): Promise<ShellResult>;
  open(url: string): Promise<void>;
  openPath(path: string): Promise<void>;
}

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Clipboard API
 */
export interface BuneryClipboard {
  writeText(text: string): Promise<void>;
  readText(): Promise<string>;
}

/**
 * App API
 */
export interface BuneryApp {
  getVersion(): Promise<string>;
  getName(): Promise<string>;
  quit(): Promise<void>;
  getPaths(): Promise<AppPaths>;
}

export interface AppPaths {
  app: string;
  userData: string;
  temp: string;
  home: string;
  documents: string;
  downloads: string;
}

/**
 * Main Bunery API
 */
export interface BuneryAPI {
  fs: BuneryFS;
  os: BuneryOS;
  window: BuneryWindow;
  dialog: BuneryDialog;
  storage: BuneryStorage;
  shell: BuneryShell;
  clipboard: BuneryClipboard;
  app: BuneryApp;
  invoke<T = any>(name: string, ...args: any[]): Promise<T>;
}

