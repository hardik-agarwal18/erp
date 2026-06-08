"use client";

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type { ApiErrorPayload } from "./types";

const DEFAULT_TIMEOUT_MS = 15_000;
const ACCESS_TOKEN_STORAGE_KEY = "pl.accessToken";
const ACTIVE_ORGANIZATION_STORAGE_KEY = "pl.activeOrganizationId";
const CSRF_COOKIE_NAME = "csrfToken";

type AuthRuntimeConfig = {
  getAccessToken: () => string | null;
  getOrganizationId: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onUnauthorized: () => void;
};

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const runtimeConfig: AuthRuntimeConfig = {
  getAccessToken: () => null,
  getOrganizationId: () => null,
  refreshAccessToken: async () => null,
  onUnauthorized: () => undefined,
};

let refreshPromise: Promise<string | null> | null = null;

const isBrowser = typeof window !== "undefined";

function readCookie(name: string) {
  if (!isBrowser) {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function shouldRefresh(error: AxiosError<ApiErrorPayload>) {
  const requestConfig = error.config;
  const requestUrl = requestConfig?.url ?? "";

  if (!requestConfig || requestConfig._retry) {
    return false;
  }

  if (error.response?.status !== 401) {
    return false;
  }

  return !requestUrl.includes("/auth/login") && !requestUrl.includes("/auth/refresh");
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = runtimeConfig.getAccessToken();
  const organizationId = runtimeConfig.getOrganizationId();
  const csrfToken = readCookie(CSRF_COOKIE_NAME);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (organizationId) {
    config.headers["x-organization-id"] = organizationId;
  }

  if (csrfToken) {
    config.headers["x-csrf-token"] = csrfToken;
  }

  if (process.env.NODE_ENV !== "production") {
    // Keep request logging lightweight so local integration debugging is easier.
    console.info("[api:request]", config.method?.toUpperCase(), config.url);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[api:response]", response.status, response.config.url);
    }

    return response;
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    if (!shouldRefresh(error)) {
      throw normalizeApiError(error);
    }

    if (!refreshPromise) {
      refreshPromise = runtimeConfig.refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const accessToken = await refreshPromise;

    if (!accessToken || !error.config) {
      runtimeConfig.onUnauthorized();
      throw normalizeApiError(error);
    }

    error.config._retry = true;
    error.config.headers.Authorization = `Bearer ${accessToken}`;

    return apiClient.request(error.config);
  },
);

export function configureApiClient(config: Partial<AuthRuntimeConfig>) {
  Object.assign(runtimeConfig, config);
}

export function getStoredAccessToken() {
  return isBrowser ? window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) : null;
}

export function setStoredAccessToken(accessToken: string | null) {
  if (!isBrowser) {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredOrganizationId() {
  return isBrowser ? window.localStorage.getItem(ACTIVE_ORGANIZATION_STORAGE_KEY) : null;
}

export function setStoredOrganizationId(organizationId: string | null) {
  if (!isBrowser) {
    return;
  }

  if (organizationId) {
    window.localStorage.setItem(ACTIVE_ORGANIZATION_STORAGE_KEY, organizationId);
    return;
  }

  window.localStorage.removeItem(ACTIVE_ORGANIZATION_STORAGE_KEY);
}

export function normalizeApiError(error: unknown) {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error ? error : new Error("Unexpected application error");
  }

  const message =
    error.response?.data?.message ??
    error.message ??
    "Unexpected API error";

  const normalized = new Error(message) as Error & {
    status?: number;
    details?: Record<string, string[]>;
  };

  normalized.status = error.response?.status;
  normalized.details = error.response?.data?.errors;

  return normalized;
}
