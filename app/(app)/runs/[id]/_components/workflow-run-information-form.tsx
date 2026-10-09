"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React, { useEffect, useMemo } from "react";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { useAuthSession } from "@/hooks/use-auth-session";
import { saveProcessRunInformation } from "../_actions";
import {
  computeSurveyVariables,
  applySurveyVariables,
  FormProcessItem,
} from "./apply-survey-variables";

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
  allProcesses?: FormProcessItem[];
}

export const WorkflowRunInformationForm = ({
  submission,
  allProcesses,
}: {
  submission: FormSubmissionProps;
  allProcesses?: FormProcessItem[];
}) => {
  const { session } = useAuthSession();
  const currentUserEmail = session?.user.email ?? "";
  const { execute: executeUpdate, status: statusUpdate } = useEnhancedAction({
    action: saveProcessRunInformation,
    hideModals: true,
  });

  const surveyVariables = useMemo(() => {
    return computeSurveyVariables(
      currentUserEmail,
      allProcesses ?? submission.allProcesses,
    );
  }, [currentUserEmail, allProcesses, submission.allProcesses]);

  // Memoize the SurveyJS Model to prevent recreation on every render
  const model = useMemo(() => {
    const surveyModel = new Model(submission.information);
    surveyModel.locale = "de";
    applySurveyVariables(surveyModel, surveyVariables);
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

  // Update runtime context without recreating the model or resetting answers.
  useEffect(() => {
    applySurveyVariables(model, surveyVariables);
  }, [model, surveyVariables]);

  return (
    <Box pos="relative">
      <LoadingOverlay visible={statusUpdate === "executing"} />
      <Survey model={model} />
    </Box>
  );
};
