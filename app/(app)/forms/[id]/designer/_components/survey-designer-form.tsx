"use client";

import { useState } from "react";
import { ICreatorOptions } from "survey-creator-core";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import "survey-creator-core/i18n/german";
import { useParams } from "next/navigation";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { updateForm } from "../_actions";
import { Box, LoadingOverlay } from "@mantine/core";
const defaultCreatorOptions: ICreatorOptions = {
  showTranslationTab: true,
};

export const SurveyDesignerForm = (props: {
  json?: object;
  options?: ICreatorOptions;
}) => {
  const [creator, setCreator] = useState<SurveyCreator>();
  const { id } = useParams<{ id: string }>();
  const { execute, status } = useEnhancedAction({
    action: updateForm,
    hideModals: true,
  });

  if (!creator) {
    const newCreator = new SurveyCreator(
      props.options || defaultCreatorOptions
    );
    newCreator.saveSurveyFunc = async (
      no: number,
      callback: (num: number, status: boolean) => void
    ) => {
      try {
        const surveyJSON = newCreator.JSON;
        execute({
          id,
          schema: surveyJSON,
        });
        callback(no, true);
      } catch (error) {
        console.error("Failed to save survey:", error);
        callback(no, false);
      }
    };
    setCreator(newCreator);
  }

  if (creator) {
    creator.JSON = props.json || [];
    // Disable the save button while saving is in progress
    creator.isAutoSave = false;
    creator.locale = "de";
  }

  return (
    <Box h="100vh" w="100%" pos="relative">
      <LoadingOverlay
        visible={status === "executing"}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <SurveyCreatorComponent creator={creator} />
    </Box>
  );
};
