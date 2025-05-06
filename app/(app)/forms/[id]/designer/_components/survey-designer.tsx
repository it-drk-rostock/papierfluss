import React from "react";
import { SurveyDesignerForm } from "./survey-designer-form";
import { getDesigner } from "../_actions";

export const SurveyDesigner = async ({ id }: { id: string }) => {
  const designer = await getDesigner(id);
 

  return <SurveyDesignerForm json={designer?.schema as object} />;
};
