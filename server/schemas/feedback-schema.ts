import { z } from "zod";

export const FeedbackSchema = z.object({
  feedback: z.string().min(1, "Feedback darf nicht leer sein"),
  path: z.string().min(1),
});
