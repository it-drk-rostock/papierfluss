import { Title } from "@mantine/core";
import { Suspense } from "react";
import { SurveyCreatorWidget } from "./_components/survey-designer";
export default function Page() {
  return (
    <>
      <Title order={1}>Designer</Title>
      <Suspense fallback={<div>Loading...</div>}>
        <SurveyCreatorWidget />
      </Suspense>
    </>
  );
}
