// Serviço de autenticação. Tokens continuam armazenados no padrão já usado pelo projeto.
import { API_CONFIG } from '../config/api';

class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'user_data';
    this.baseURL = API_CONFIG.BASE_URL;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getToken() {
    if (typeof window !== 'undefined') return localStorage.getItem(this.tokenKey);
    return null;
  }

  getUser() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      this.clearAuthData();
      return null;
    }
  }

  setAuthData(token, user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  updateUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
  }

  clearAuthData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  async login(username, password) {
    if (!username || !password) throw new Error('Usuário e senha são obrigatórios');

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Usuário ou senha incorretos');
    }

    const data = await response.json();
    const user = {
      id: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      perfilId: null,
      privacyConsent: data.privacyConsent === true,
      privacyConsentVersion: data.privacyConsentVersion || null
    };

    this.setAuthData(data.token, user);
    return { success: true, user, token: data.token };
  }

  logout() {
    this.clearAuthData();
    if (typeof window !== 'undefined') window.location.href = '/';
  }

  async validateToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/validate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        this.clearAuthData();
        return false;
      }
      const valid = await response.json().catch(() => false);
      if (valid !== true) this.clearAuthData();
      return valid === true;
    } catch (error) {
      console.error('Erro na validação do token:', error);
      return false;
    }
  }

  getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

const authService = new AuthService();
export default authService;
