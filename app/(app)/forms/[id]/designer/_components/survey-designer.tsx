"use client";

import { useState } from "react";
import { ICreatorOptions } from "survey-creator-core";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import "survey-creator-core/i18n/german";

const defaultCreatorOptions: ICreatorOptions = {
  showTranslationTab: true,
};

export const SurveyCreatorWidget = (props: {
  json?: object;
  options?: ICreatorOptions;
}) => {
  const [creator, setCreator] = useState<SurveyCreator>();

  if (!creator) {
    const newCreator = new SurveyCreator(
      props.options || defaultCreatorOptions
    );
    newCreator.saveSurveyFunc = (
      no: number,
      callback: (num: number, status: boolean) => void
    ) => {
      console.log(JSON.stringify(newCreator?.JSON));
      callback(no, true);
    };
    setCreator(newCreator);
  }

  if (creator) {
    creator.JSON = props.json || [];
    creator.locale = "de";
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <SurveyCreatorComponent creator={creator} />
    </div>
  );
};
