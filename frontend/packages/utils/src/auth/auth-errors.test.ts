import { describe, expect, it } from "vitest";

import { AuthError, humanizeAuthFailure, parseApiError } from "./auth-errors";

describe("parseApiError", () => {
  it("formats FastAPI validation detail arrays as readable French text", async () => {
    const response = new Response(
      JSON.stringify({
        detail: [
          {
            type: "missing",
            loc: ["body", "file"],
            msg: "Field required",
            input: null,
          },
        ],
      }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );

    const error = await parseApiError(response);
    expect(error.message).toBe("Field required");
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.status).toBe(422);
  });

  it("keeps AppError string detail", async () => {
    const response = new Response(
      JSON.stringify({
        detail: "Format non supporté. Utilisez JPG, PNG ou WEBP.",
        code: "PROFILE_MEDIA_INVALID_TYPE",
        errors: [],
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );

    const error = await parseApiError(response);
    expect(error.message).toBe("Format non supporté. Utilisez JPG, PNG ou WEBP.");
    expect(error.code).toBe("PROFILE_MEDIA_INVALID_TYPE");
  });
});

describe("humanizeAuthFailure", () => {
  it("never returns [object Object] for validation errors", () => {
    const message = humanizeAuthFailure(
      new AuthError("UNKNOWN_ERROR", "Field required", 422),
      "Impossible d'envoyer l'image.",
    );
    expect(message).toBe("Field required");
    expect(message).not.toContain("[object Object]");
  });
});
