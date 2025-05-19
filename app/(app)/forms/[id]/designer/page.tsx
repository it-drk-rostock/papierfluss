import { Title } from "@mantine/core";
import { Suspense } from "react";
import { SurveyDesigner } from "./_components/survey-designer";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <Title order={1}>Designer</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <SurveyDesigner params={params} />
      </Suspense>
    </>
  );
}
