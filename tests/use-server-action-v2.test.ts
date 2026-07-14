import { describe, expect, it } from "vitest";
import { getFriendlyErrorMessage } from "@/hooks/use-server-action-v2";

describe("getFriendlyErrorMessage", () => {
  it("should return fallback message for null/undefined/empty input", () => {
    expect(getFriendlyErrorMessage(null)).toBe(
      "Aktion fehlgeschlagen, versuchen Sie es später erneut"
    );
    expect(getFriendlyErrorMessage(undefined)).toBe(
      "Aktion fehlgeschlagen, versuchen Sie es später erneut"
    );
  });

  it("should extract validation error messages from standard schema issues format", () => {
    const error = {
      code: "BAD_REQUEST",
      status: 400,
      message: "Bad Request",
      data: {
        issues: [
          { path: ["name"], message: "Name ist erforderlich" },
          { path: ["email"], message: "Ungültige E-Mail-Adresse" },
        ],
      },
    };
    expect(getFriendlyErrorMessage(error)).toBe(
      "Validierungsfehler: name: Name ist erforderlich, email: Ungültige E-Mail-Adresse"
    );
  });

  it("should extract error messages nested in data.error", () => {
    const errorString = {
      data: {
        error: "Custom error string",
      },
    };
    expect(getFriendlyErrorMessage(errorString)).toBe("Custom error string");

    const errorObject = {
      data: {
        error: {
          message: "Custom error message in object",
        },
      },
    };
    expect(getFriendlyErrorMessage(errorObject)).toBe(
      "Custom error message in object"
    );
  });

  it("should use a custom message if it is not a generic error message", () => {
    const customError = new Error("Spezifischer Fehler");
    expect(getFriendlyErrorMessage(customError)).toBe("Spezifischer Fehler");

    const genericError = new Error("Internal Server Error");
    expect(getFriendlyErrorMessage(genericError)).toBe(
      "Aktion fehlgeschlagen, versuchen Sie es später erneut"
    );
  });

  it("should translate standard ORPC and HTTP codes to friendly German messages", () => {
    expect(getFriendlyErrorMessage({ code: "UNAUTHORIZED" })).toBe(
      "Sie müssen angemeldet sein, um diese Aktion auszuführen."
    );
    expect(getFriendlyErrorMessage({ status: 401 })).toBe(
      "Sie müssen angemeldet sein, um diese Aktion auszuführen."
    );

    expect(getFriendlyErrorMessage({ code: "FORBIDDEN" })).toBe(
      "Sie haben keine Berechtigung für diese Aktion."
    );
    expect(getFriendlyErrorMessage({ status: 403 })).toBe(
      "Sie haben keine Berechtigung für diese Aktion."
    );

    expect(getFriendlyErrorMessage({ code: "NOT_FOUND" })).toBe(
      "Die angeforderte Ressource wurde nicht gefunden."
    );
    expect(getFriendlyErrorMessage({ status: 404 })).toBe(
      "Die angeforderte Ressource wurde nicht gefunden."
    );

    expect(getFriendlyErrorMessage({ code: "CONFLICT" })).toBe(
      "Es ist ein Konflikt aufgetreten. Bitte versuchen Sie es erneut."
    );
    expect(getFriendlyErrorMessage({ code: "TOO_MANY_REQUESTS" })).toBe(
      "Zu viele Anfragen. Bitte warten Sie einen Moment."
    );
  });
});
