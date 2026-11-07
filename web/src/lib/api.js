import { useCallback, useEffect, useRef, useState } from "react";
import { COPY } from "@/copy.js";

export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : null;
  if (res.status === 401 && !url.startsWith("/api/auth/")) onUnauthorized();
  if (!res.ok) throw new ApiError(res.status, data?.error ?? "server_error");
  return data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body = {}) => request("POST", url, body),
  put: (url, body = {}) => request("PUT", url, body),
  patch: (url, body) => request("PATCH", url, body),
  del: (url) => request("DELETE", url),
};

export const errorText = (err) => COPY.ERRORS[err instanceof ApiError ? err.code : "default"] ?? COPY.ERRORS.default;

export function useApi(url) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const current = useRef(url);
  const load = useCallback(() => {
    current.current = url;
    if (!url) return setState({ data: null, error: null, loading: false });
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get(url).then(
      (data) => current.current === url && setState({ data, error: null, loading: false }),
      (error) => current.current === url && setState({ data: null, error, loading: false }),
    );
  }, [url]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}
