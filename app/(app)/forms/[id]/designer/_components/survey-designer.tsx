import React from "react";
import { getDesigner } from "../_actions";
import { SurveyDesignerForm } from "./survey-designer-form";

export const SurveyDesigner = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const formId = (await params).id;
  const designer = await getDesigner(formId);

  return <SurveyDesignerForm json={designer?.schema as object} />;
};
