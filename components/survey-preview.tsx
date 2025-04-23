"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";

export const SurveyPreview = (props: { json: any }) => {
  const model = new Model(props.json);
  model.readOnly = true;
  return <Survey model={model} />;
};
