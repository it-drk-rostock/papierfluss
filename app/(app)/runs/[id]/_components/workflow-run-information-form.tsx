"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React, { useMemo } from "react";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { saveProcessRunInformation } from "../_actions";

interface FormSubmissionProps {
  id: string;
  form: {
    id: string;
    schema: Record<string, unknown>;
  };
  information: Record<string, unknown> | null;
  informationData: Record<string, unknown> | null;
  data: Record<string, unknown> | null;
  status: "open" | "ongoing" | "completed";
}

export const WorkflowRunInformationForm = ({
  submission,
}: {
  submission: FormSubmissionProps;
}) => {
  const { execute: executeUpdate, status: statusUpdate } = useEnhancedAction({
    action: saveProcessRunInformation,
    hideModals: true,
  });

  // Memoize the SurveyJS Model to prevent recreation on every render
  const model = useMemo(() => {
    const surveyModel = new Model(submission.information);
    surveyModel.locale = "de";
    surveyModel.data = submission.informationData;
    surveyModel.showCompleteButton = false;
    surveyModel.readOnly = submission.status === "completed";

    surveyModel.addNavigationItem({
      id: "save-process",
      title: "Speichern",
      innerCss: "sd-btn save-form",
      action: () => {
        const dataToSave = { ...surveyModel.data };
        executeUpdate({ id: submission.id, data: dataToSave });
      },
    });

    /* surveyModel.addNavigationItem({
      id: "pdf-export",
      title: "PDF Export",
      action: () => savePdf(surveyModel.data),
    }); */

    return surveyModel;
  }, [
    submission.form.id,
    submission.information,
    submission.informationData,
    submission.status,
    executeUpdate,
  ]);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={statusUpdate === "executing"} />
      <Survey model={model} />
    </Box>
  );
};
