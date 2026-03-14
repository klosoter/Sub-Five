export type UserInfo = {
  id: string;
  username: string | null;
  display_name: string;
  is_guest: boolean;
};

class AuthStore {
  user: UserInfo | null = null;
  private listeners: Set<() => void> = new Set();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  get isLoggedIn(): boolean {
    return this.user !== null;
  }

  get displayName(): string {
    return this.user?.display_name ?? '';
  }

  async checkSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      this.user = data.user;
      this.notify();
    } catch {
      this.user = null;
      this.notify();
    }
  }

  async register(username: string, password: string, displayName: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name: displayName }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    this.user = data.user;
    this.notify();
    return data.user;
  }

  async login(username: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    this.user = data.user;
    this.notify();
    return data.user;
  }

  async loginAsGuest(displayName: string) {
    const res = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName }),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    this.user = data.user;
    this.notify();
    return data.user;
  }

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    this.user = null;
    this.notify();
  }
}

export const authStore = new AuthStore();
