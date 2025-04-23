import { Title } from "@mantine/core";
import { Suspense } from "react";
import { SurveyDesigner } from "./_components/survey-designer.tsx";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  return (
    <>
      <Title order={1}>Designer</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <SurveyDesigner id={id} />
      </Suspense>
    </>
  );
}
