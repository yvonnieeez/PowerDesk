import axios, { type InternalAxiosRequestConfig } from "axios";
import { config, logger } from "../config.js";
import { ERROR_MESSAGES } from "../errors.js";
import { BotError } from "./errors.js";

interface RequestMetadata {
  startTime: number;
}

const apiClient = axios.create({
  baseURL: config.BACKEND_BASE_URL,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

const requestTimes = new WeakMap<InternalAxiosRequestConfig, RequestMetadata>();

apiClient.interceptors.request.use((req) => {
  requestTimes.set(req, { startTime: Date.now() });
  return req;
});

apiClient.interceptors.response.use(
  (response) => {
    const meta = requestTimes.get(response.config);
    const duration = meta ? Date.now() - meta.startTime : 0;
    logger.debug(
      {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration,
      },
      "Backend HTTP request completed",
    );

    const body = response.data;
    if (body && typeof body === "object" && "success" in body) {
      if (body.success === false) {
        const errorMsg = body.error ?? "Unknown backend error";
        throw new BotError(
          typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg),
          "BACKEND_ERROR",
          response.status,
        );
      }
      response.data = body.data;
    }
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url ?? "unknown";
      const method = error.config?.method?.toUpperCase() ?? "GET";

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        logger.error({ url, method }, "Backend unreachable");
        throw new BotError(
          ERROR_MESSAGES.BACKEND_UNREACHABLE,
          "BACKEND_UNREACHABLE",
        );
      }

      if (status && status >= 500) {
        logger.error({ status, url, method }, "Backend server error");
        throw new BotError(ERROR_MESSAGES.BACKEND_5XX, "BACKEND_5XX", status);
      }

      if (status === 404) {
        const data = error.response?.data;
        const errorMsg =
          data && typeof data === "object" && "error" in data
            ? String(data.error)
            : "Not found";
        throw new BotError(errorMsg, "NOT_FOUND", 404);
      }

      logger.error({ status, url, method }, "HTTP request failed");
      throw new BotError(
        "Something went wrong talking to the office server.",
        "HTTP_ERROR",
        status,
      );
    }
    throw error;
  },
);

export { apiClient };
