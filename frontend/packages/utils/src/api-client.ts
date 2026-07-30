import type { AuthClient } from "./auth/auth-client";
import { parseApiError } from "./auth/auth-errors";

export class ApiClientBase {
  constructor(
    protected readonly client: AuthClient,
    protected readonly apiBaseUrl: string,
  ) {}

  protected apiPath(segment: string): string {
    const base = this.apiBaseUrl.replace(/\/$/, "");
    const normalized = segment.startsWith("/") ? segment : `/${segment}`;
    return `${base}/api/v1${normalized}`;
  }

  protected async getJson<T>(segment: string): Promise<T> {
    const response = await this.client.fetch(this.apiPath(segment), { method: "GET" });
    return this.readJson<T>(response);
  }

  protected async postJson<T>(segment: string, body: unknown): Promise<T> {
    const response = await this.client.fetch(this.apiPath(segment), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.readJson<T>(response);
  }

  protected async patchJson<T>(segment: string, body: unknown): Promise<T> {
    const response = await this.client.fetch(this.apiPath(segment), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return this.readJson<T>(response);
  }

  protected async postVoid(segment: string, body?: unknown): Promise<void> {
    const response = await this.client.fetch(this.apiPath(segment), {
      method: "POST",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw await parseApiError(response);
    }
  }

  protected async putVoid(segment: string, body?: unknown): Promise<void> {
    const response = await this.client.fetch(this.apiPath(segment), {
      method: "PUT",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw await parseApiError(response);
    }
  }

  protected async deleteVoid(segment: string): Promise<void> {
    const response = await this.client.fetch(this.apiPath(segment), { method: "DELETE" });
    if (!response.ok) {
      throw await parseApiError(response);
    }
  }

  protected async readJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await parseApiError(response);
    }
    return (await response.json()) as T;
  }

  protected async postFormData<T>(segment: string, body: FormData): Promise<T> {
    const response = await this.client.fetch(this.apiPath(segment), {
      method: "POST",
      body,
    });
    return this.readJson<T>(response);
  }
}
