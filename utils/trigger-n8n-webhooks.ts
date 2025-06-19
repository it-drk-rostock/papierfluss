export const triggerN8nWebhooks = async (webhookIds: string[], submissionContext: any) => {
  const webhookPromises = webhookIds.map((webhookId) =>
    fetch(`${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${webhookId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
      },
      body: JSON.stringify({
        submissionContext,
      }),
    })
  );

  await Promise.all(webhookPromises);
};