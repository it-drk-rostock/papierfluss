"use server";

import { N8nWorkflow } from "../n8n/_actions";

export const getN8nCronjobsWorkflows = async (name?: string) => {
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL;
  const apiKey = process.env.N8N_API_KEY;

  if (!n8nUrl || !apiKey) {
    throw new Error("N8N configuration missing");
  }

  const fullUrl = `${n8nUrl}/api/v1/workflows?active=true&tags=fms-cronjobs${
    name ? `&name=${name}` : ""
  }`;

  const response = await fetch(fullUrl, {
    headers: {
      "X-N8N-API-KEY": apiKey,
    },
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(`N8N API Error: ${response.status} - ${text}`);
  }

  const data = (await response.json()) as { data: N8nWorkflow[] };

  return data.data.map((workflow) => ({
    id: workflow.id.toString(),
    name: workflow.name,
  }));
};

export type N8nCronjobsProps = Awaited<
  ReturnType<typeof getN8nCronjobsWorkflows>
>;
