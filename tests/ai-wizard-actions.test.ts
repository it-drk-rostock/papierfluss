import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateWizardStep1AI,
  generateWizardStep2AI,
  generateWizardStep3AI,
  generateWizardStep4AI,
} from "@/server/formsv2/ai-wizard-actions";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { generateText } from "ai";

vi.mock("@/server/utils/auth-query", () => ({ authQuery: vi.fn() }));

vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: {
    object: vi.fn((opts) => opts),
  },
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn().mockReturnValue("mocked-model"),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    team: {
      findMany: vi.fn(),
    },
  },
}));

describe("AI Wizard Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authQuery).mockResolvedValue({
      user: { id: "user-1", role: "admin" },
    } as never);
    vi.mocked(prisma.team.findMany).mockResolvedValue([
      { name: "IT Team" },
      { name: "HR Team" },
    ] as never);
  });

  it("generateWizardStep1AI generates title and description", async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: {
        title: "IT Support Anforderung",
        description: "Formular für Hardware-Defekte",
      },
    } as never);

    const res = await generateWizardStep1AI("Hardware defekt");
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Hardware defekt"),
      })
    );
    expect(res.title).toBe("IT Support Anforderung");
  });

  it("generateWizardStep2AI generates status array", async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: {
        statuses: ["Entwurf", "In Bearbeitung", "Abgeschlossen"],
      },
    } as never);

    const res = await generateWizardStep2AI("Status für IT Support");
    expect(res.statuses).toEqual(["Entwurf", "In Bearbeitung", "Abgeschlossen"]);
  });

  it("generateWizardStep3AI generates transitions based on statuses", async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: {
        transitions: [{ from: "Entwurf", to: "In Bearbeitung" }],
      },
    } as never);

    const res = await generateWizardStep3AI("Übergang von Entwurf zu Bearbeitung", {
      statuses: ["Entwurf", "In Bearbeitung"],
    });
    expect(res.transitions).toEqual([{ from: "Entwurf", to: "In Bearbeitung" }]);
  });

  it("generateWizardStep4AI generates custom actions with roles and target status", async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: {
        actions: [{ label: "Freigeben", role: "IT Team", toStatus: "Abgeschlossen" }],
      },
    } as never);

    const res = await generateWizardStep4AI("Freigabe durch IT", {
      statuses: ["Entwurf", "Abgeschlossen"],
    });
    expect(res.actions).toEqual([
      { label: "Freigeben", role: "IT Team", toStatus: "Abgeschlossen" },
    ]);
  });
});
