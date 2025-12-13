// src/services/authService.ts
import { authClient, tokenManager } from '@/lib/client';
import { API_CONFIG } from '@/lib/apiConfig';
import { 
  LoginPayload, 
  LoginResponse, 
  RefreshTokenPayload,
  RefreshTokenResponse,
  TokenVerifyPayload,
  TokenVerifyResponse,
  LogoutPayload,
  LogoutResponse,
  User 
} from '@/types/authTypes';

const USER_KEY = 'celiyo_user';

// Decode a JWT access token safely and return its payload
function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

class AuthService {
  // Login
  async login(payload: LoginPayload): Promise<User> {
    try {

      const response = await authClient.post<any>(
        API_CONFIG.AUTH.LOGIN,
        payload
      );


      // Handle the actual API response structure
      const { tokens, user: userData } = response.data;
      const access = tokens.access;
      const refresh = tokens.refresh;

        access: access ? 'Yes ✓' : 'No ✗',
        refresh: refresh ? 'Yes ✓' : 'No ✗'
      });

      // Decode JWT to get tenant info and modules
      const decoded = parseJwt(access);

      // Build proper user object with tenant structure
      const user: User = {
        id: userData.id,
        email: userData.email,
        tenant: {
          id: userData.tenant || decoded?.tenant_id || '',
          name: userData.tenant_name || '',
          slug: decoded?.tenant_slug || '',
          enabled_modules: decoded?.enabled_modules || []
        },
        roles: userData.roles || [],
        preferences: userData.preferences || {}
      };


      // Store tokens and user temporarily
      tokenManager.setAccessToken(access);
      tokenManager.setRefreshToken(refresh);

      // Fetch full user details including preferences if not in login response
      if (!userData.preferences) {
        try {
          const userDetailUrl = API_CONFIG.AUTH.USERS.DETAIL.replace(':id', userData.id);
          const userDetailResponse = await authClient.get(userDetailUrl);
          user.preferences = userDetailResponse.data?.preferences || {};
        } catch (prefError) {
          user.preferences = {};
        }
      }

      // Apply theme preference
      if (user.preferences?.theme) {
        this.applyThemePreference(user.preferences.theme);
      }

      // Store user with preferences
      this.setUser(user);

      // Verify storage
      const storedAccess = tokenManager.getAccessToken();
      const storedRefresh = tokenManager.getRefreshToken();
      const storedUser = this.getUser();

        accessTokenStored: storedAccess ? 'Yes ✓' : 'No ✗',
        refreshTokenStored: storedRefresh ? 'Yes ✓' : 'No ✗',
        userStored: storedUser ? 'Yes ✓' : 'No ✗',
        tenantId: storedUser?.tenant?.id,
        modules: storedUser?.tenant?.enabled_modules,
        preferences: storedUser?.preferences
      });

      return user;
    } catch (error: any) {

      // Clear any stale data
      this.clearAuth();

      const message = error.response?.data?.error ||
                     error.response?.data?.email?.[0] ||
                     error.response?.data?.password?.[0] ||
                     'Login failed. Please check your credentials.';
      throw new Error(message);
    }
  }

  // Apply theme preference to document
  private applyThemePreference(theme: 'light' | 'dark'): void {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (error) {
    }
  }

  // Apply all preferences from stored user (for app initialization)
  applyStoredPreferences(): void {
    try {
      const user = this.getUser();
      if (user?.preferences) {

        // Apply theme
        if (user.preferences.theme) {
          this.applyThemePreference(user.preferences.theme);
        }

        // You can add more preference applications here as needed
      }
    } catch (error) {
    }
  }

  // Get user preferences
  getUserPreferences() {
    const user = this.getUser();
    return user?.preferences || {};
  }

  // Update user preferences in storage
  updateUserPreferences(preferences: any): void {
    const user = this.getUser();
    if (user) {
      user.preferences = { ...user.preferences, ...preferences };
      this.setUser(user);

      // Apply theme if it changed
      if (preferences.theme) {
        this.applyThemePreference(preferences.theme);
      }

    }
  }

  // Refresh token
  async refreshToken(): Promise<string> {
    try {
      
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authClient.post<RefreshTokenResponse>(
        API_CONFIG.AUTH.REFRESH,
        { refresh: refreshToken }
      );

      const { access, refresh } = response.data;


      // Update tokens
      tokenManager.setAccessToken(access);
      if (refresh) {
        tokenManager.setRefreshToken(refresh);
      }

      return access;
    } catch (error: any) {
      
      // Clear auth data if refresh fails
      this.clearAuth();
      
      const message = error.response?.data?.error || 'Token refresh failed';
      throw new Error(message);
    }
  }

  // Verify token
  async verifyToken(token?: string): Promise<boolean> {
    try {
      const tokenToVerify = token || tokenManager.getAccessToken();
      if (!tokenToVerify) {
        return false;
      }

      const response = await authClient.post<TokenVerifyResponse>(
        API_CONFIG.AUTH.VERIFY,
        { token: tokenToVerify }
      );

      return response.data.valid;
    } catch (error) {
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        // Call logout endpoint to invalidate tokens on server
        await authClient.post<LogoutResponse>(
          API_CONFIG.AUTH.LOGOUT,
          { refresh: refreshToken }
        );
      }
    } catch (error) {
    } finally {
      // Always clear local auth data
      this.clearAuth();
    }
  }

  // Get current user (from localStorage)
  getCurrentUser(): User | null {
    return this.getUser();
  }

  // Token methods
  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  getRefreshToken(): string | null {
    return tokenManager.getRefreshToken();
  }

  setAccessToken(token: string): void {
    tokenManager.setAccessToken(token);
  }

  setRefreshToken(token: string): void {
    tokenManager.setRefreshToken(token);
  }

  removeTokens(): void {
    tokenManager.removeTokens();
  }

  // User methods
  getUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const hasToken = tokenManager.hasAccessToken();
    const hasUser = !!this.getUser();
    
    
    return hasToken && hasUser;
  }

  // Check if user has access to specific module
  hasModuleAccess(module: string): boolean {
    const user = this.getUser();

    // If user object already has structured tenant with enabled_modules, use it
    const tenant: any = (user as any)?.tenant;
    if (tenant && typeof tenant === 'object' && Array.isArray(tenant.enabled_modules)) {
      const hasAccess = tenant.enabled_modules.includes(module);
      return hasAccess;
    }

    // Fallback to claims from access token (supports backend that places modules in JWT)
    const access = tokenManager.getAccessToken();
    const decoded: any = access ? parseJwt(access) : null;

    // Super admin has access to all modules
    if (decoded?.is_super_admin) {
      return true;
    }

    const enabledFromToken: string[] | undefined = decoded?.enabled_modules;
    const hasAccess = Array.isArray(enabledFromToken) ? enabledFromToken.includes(module) : false;
    
    return hasAccess;
  }

  // Get user's tenant information
  getTenant() {
    const user: any = this.getUser();
    const tenant = user?.tenant;

    // If tenant is already a structured object, return it
    if (tenant && typeof tenant === 'object') {
      return tenant;
    }

    // Fallback: build minimal tenant object from JWT claims (supports backend where user.tenant is an ID string)
    const access = tokenManager.getAccessToken();
    const decoded: any = access ? parseJwt(access) : null;

    if (decoded?.tenant_id) {
      return {
        id: decoded.tenant_id,
        name: user?.tenant_name || '', // optional, may come in auth response
        slug: decoded.tenant_slug || '',
        enabled_modules: Array.isArray(decoded?.enabled_modules) ? decoded.enabled_modules : [],
      };
    }

    return null;
  }

  // Get user's roles
  getUserRoles() {
    const user = this.getUser();
    return user?.roles || [];
  }

  // Clear all auth data
  clearAuth(): void {
    this.removeTokens();
    this.removeUser();
  }

  // Legacy methods for backward compatibility
  getToken(): string | null {
    return this.getAccessToken();
  }

  setToken(token: string): void {
    this.setAccessToken(token);
  }

  removeToken(): void {
    tokenManager.removeToken();
  }

  hasToken(): boolean {
    return tokenManager.hasToken();
  }
}

export const authService = new AuthService();