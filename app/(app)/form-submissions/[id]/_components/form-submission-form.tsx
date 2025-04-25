"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React, { useState } from "react";
import {
  FormSubmissionProps,
  reviewFormSubmission,
  submitFormSubmission,
  updateFormSubmission,
} from "../_actions";
import { ModalButton } from "@/components/modal-button";
import { modals } from "@mantine/modals";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { ButtonAction } from "@/components/button-action";

export const FormSubmissionForm = ({
  submission,
}: {
  submission: FormSubmissionProps;
}) => {
  const { execute: executeUpdate, status: statusUpdate } = useEnhancedAction({
    action: updateFormSubmission,
    hideModals: true,
  });
  const { execute: executeReview, status: statusReview } = useEnhancedAction({
    action: reviewFormSubmission,
    hideModals: true,
  });
  const model = new Model(submission.form.schema);
  model.locale = "de";
  model.data = submission.data;

  // Disable default complete button
  model.showCompleteButton = false;
  model.readOnly = submission.status === "submitted";

  // Only add navigation items if submission status is "ongoing"
  if (submission.status === "ongoing") {
    model.addNavigationItem({
      id: "save-form",
      title: "Speichern",
      innerCss: "sd-btn save-form",
      action: () => {
        executeUpdate({ id: submission.id, data: model.data });
      },
    });
    model.addNavigationItem({
      id: "submit-form",
      title: "Formular einreichen",
      innerCss: "sd-btn submit-form",
      action: () => {
        modals.open({
          closeOnClickOutside: false,
          title: "Formular einreichen",
          children: (
            <ButtonAction
              fullWidth
              action={submitFormSubmission}
              values={{ id: submission.id, data: model.data }}
            >
              Formular einreichen
            </ButtonAction>
          ),
        });
      },
    });
  }

  if (submission.status === "submitted") {
    model.addNavigationItem({
      id: "review-form",
      title: "Formular überprüfen",
      innerCss: "sd-btn review-form",
      action: () => {
        executeReview({ id: submission.id });
      },
    });
  }

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={statusUpdate === "executing" || statusReview === "executing"}
      />
      <Survey model={model} />
    </Box>
  );
};
