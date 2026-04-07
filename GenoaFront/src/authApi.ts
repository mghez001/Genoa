import Constants from 'expo-constants';
import { Platform } from 'react-native';

export class AuthApiError extends Error {
  constructor(message: string, public status = 0, public code?: string) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const configuredApiBaseUrl = (Constants.expoConfig?.extra as any)?.apiBaseUrl;

function getExpoHostApiBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0];

  if (!host) {
    return null;
  }

  return `http://${host}:3000/api`;
}

function getDefaultApiBaseUrl() {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  return 'http://localhost:3000/api';
}

const API_BASE_URL = configuredApiBaseUrl ?? getExpoHostApiBaseUrl() ?? getDefaultApiBaseUrl();

async function apiRequest(path: string, init: RequestInit = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new AuthApiError(
      `Impossible de joindre le serveur (${API_BASE_URL}). Vérifiez l'URL de l'API et que le backend est démarré.`,
      0,
      'NETWORK_ERROR'
    );
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    throw new AuthApiError(
      payload?.message ?? 'Une erreur inattendue est survenue.',
      response.status,
      payload?.error
    );
  }

  return payload;
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginUser(input: { email: string; password: string }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getCurrentUser(token: string) {
  return apiRequest('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logoutUser(token: string) {
  return apiRequest('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getPendingUsers(token: string) {
  return apiRequest('/users/pending', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getApprovedUsers(token: string) {
  return apiRequest('/users', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function approvePendingUser(token: string, userId: string) {
  return apiRequest(`/users/${userId}/approve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateUserRole(token: string, userId: string, role: string) {
  return apiRequest(`/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
}

export async function rejectPendingUser(token: string, userId: string) {
  return apiRequest(`/users/${userId}/reject`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export { API_BASE_URL };
