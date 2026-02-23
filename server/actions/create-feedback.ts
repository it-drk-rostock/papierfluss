"use server";

import { authorized } from "@/lib/orpc/middleware";
import { formatError } from "@/utils/format-error";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";
import { onError, onSuccess } from "@orpc/server";
import { FeedbackSchema } from "../schemas/feedback-schema";

export const createFeedback = authorized
  .input(FeedbackSchema)
  .handler(async ({ input, context }) => {
    const { feedback, path, rating } = input;

    const submissionContext = {
      feedback,
      path,
      rating,
      userEmail: context.user.email,
      userName: context.user.name,
      app: "FMS",
    };
    try {
      await triggerN8nWebhooks(["internal-apps-feedback"], submissionContext);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Feedback erstellt",
    };
  })

  .actionable({
    context: async () => ({}),
    interceptors: [
      onSuccess(async (output) => {
        return output;
      }),
      onError(async (error: any) => {
        return { error: error };
      }),
    ],
  });
