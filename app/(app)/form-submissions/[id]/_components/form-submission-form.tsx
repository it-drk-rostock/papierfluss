"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";

import React from "react";
import { FormSubmissionProps } from "../_actions";

export const FormSubmissionForm = ({
  submission,
}: {
  submission: FormSubmissionProps;
}) => {
  const model = new Model(submission.form.schema);
  model.locale = "de";
  model.data = submission.data;

  return <Survey model={model} />;
};
