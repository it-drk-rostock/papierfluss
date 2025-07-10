"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React from "react";
import {
  FormSubmissionProps,
  reviewFormSubmission,
  submitFormSubmission,
  updateFormSubmission,
  withdrawFormSubmission,
} from "../_actions";
import { modals } from "@mantine/modals";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { ButtonAction } from "@/components/button-action";
import { FormSubmissionStatusForm } from "./form-submission-status-form";
import {
  createSignedUploadUrls,
  deleteFiles,
} from "@/server/utils/create-signed-upload-url";
import { useMutation } from "@tanstack/react-query";
import { showNotification } from "@/utils/notification";
import { IDocOptions, SurveyPDF } from "survey-pdf";
import { FormSubmissionSubmitForm } from "./form-submission-archive-form";

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

  const pdfDocOptions: IDocOptions = {
    fontSize: 12,
  };

  const savePdf = (surveyData: any) => {
    const surveyPdf = new SurveyPDF(submission.form.schema, pdfDocOptions);
    surveyPdf.data = surveyData;
    surveyPdf.save();
  };

  // Create upload and delete mutations
  const uploadMutation = useMutation({
    mutationFn: async ({
      files,
      formId,
    }: {
      files: { fileName: string; contentType: string }[];
      formId: string;
    }) => {
      const response = await createSignedUploadUrls(files, formId);
      if (!response.files?.length) throw new Error("Failed to get upload URLs");
      return response;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileUrls: string[]) => {
      const response = await deleteFiles(fileUrls);
      if (!response.success) throw new Error("Failed to delete files");
      return response;
    },
  });

  const model = new Model(submission.form.schema);
  model.locale = "de";

  model.data = submission.data;
  model.showCompleteButton = false;
  model.readOnly = submission.status !== "ongoing";

  // Handle file uploads
  model.onUploadFiles.add(async (_, options) => {
    try {
      // 1. Get signed URLs for upload
      const uploadData = await createSignedUploadUrls(
        options.files.map((file) => ({
          fileName: file.name,
          contentType: file.type,
        })),
        submission.form.id
      );

      if (!uploadData.files?.length) {
        options.callback([], ["Failed to get upload URLs"]);
        return;
      }

      // 2. Upload files using signed URLs
      const uploadPromises = options.files.map(async (file, index) => {
        const fileData = uploadData.files[index];

        await fetch(fileData.url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Return in the format SurveyJS expects
        return {
          file: file,
          content: fileData.fileUrl,
        };
      });

      const results = await Promise.all(uploadPromises);
      showNotification("Dateien hochgeladen", "success");
      options.callback(results);
    } catch (error) {
      showNotification("Fehler beim Hochladen der Dateien", "error");
      console.error("Upload error:", error);
      options.callback([], ["An error occurred during file upload"]);
    }
  });

  // Handle file deletion
  model.onClearFiles.add(async (_, options) => {
    try {
      if (!options.value || options.value.length === 0) {
        return options.callback("success");
      }

      const filesToDelete = options.fileName
        ? options.value.filter((item) => item.name === options.fileName)
        : options.value;

      if (filesToDelete.length === 0) {
        return options.callback("error");
      }

      const fileUrls = filesToDelete.map((file) => file.content);
      await deleteFiles(fileUrls);
      showNotification("Dateien gelöscht", "success");
      options.callback("success");
    } catch (error) {
      showNotification("Fehler beim Löschen der Dateien", "error");
      console.error("Delete error:", error);
      options.callback("error");
    }
  });

  // Only add navigation items if submission status is "ongoing"
  if (submission.status === "ongoing") {
    model.addNavigationItem({
      id: "withdraw-form",
      title: "Formular zurückziehen",
      innerCss: "sd-btn withdraw-form",
      action: () => {
        modals.open({
          closeOnClickOutside: false,
          title: "Formular zurückziehen",
          children: (
            <ButtonAction
              fullWidth
              action={withdrawFormSubmission}
              values={{ id: submission.id }}
              hideNotification={true}
            >
              Formular zurückziehen
            </ButtonAction>
          ),
        });
      },
    });
    model.addNavigationItem({
      id: "save-form",
      title: "Speichern",
      innerCss: "sd-btn save-form",
      action: () => {
        const dataToSave = { ...model.data };

        executeUpdate({ id: submission.id, data: dataToSave });
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
          children: <FormSubmissionSubmitForm id={submission.id} />,
        });
      },
    });
  }

  model.addNavigationItem({
    id: "pdf-export",
    title: "PDF Export",
    action: () => savePdf(model.data),
  });

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

  if (submission.status === "inReview") {
    model.addNavigationItem({
      id: "edit-form",
      title: "Formular überarbeiten",
      innerCss: "sd-btn edit-form",
      action: () => {
        modals.open({
          closeOnClickOutside: false,
          title: "Formular überarbeiten",
          children: (
            <FormSubmissionStatusForm id={submission.id} status="ongoing" />
          ),
        });
      },
    });
    model.addNavigationItem({
      id: "reject-form",
      title: "Formular ablehnen",
      innerCss: "sd-btn reject-form",
      action: () => {
        modals.open({
          closeOnClickOutside: false,
          title: "Formular ablehnen",
          children: (
            <FormSubmissionStatusForm id={submission.id} status="rejected" />
          ),
        });
      },
    });
    model.addNavigationItem({
      id: "complete-form",
      title: "Formular genehmigen",
      innerCss: "sd-btn complete-form",
      action: () => {
        modals.open({
          closeOnClickOutside: false,
          title: "Formular genehmigen",
          children: (
            <FormSubmissionStatusForm id={submission.id} status="completed" />
          ),
        });
      },
    });

    model.addNavigationItem({
      id: "archive-form",
      title: "Formular archivieren",
      innerCss: "sd-btn archive-form",
      action: () => {
        modals.open({
          closeOnClickOutside: false,
          title: "Formular archivieren",
          children: (
            <FormSubmissionStatusForm id={submission.id} status="archived" />
          ),
        });
      },
    });
  }

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={
          statusUpdate === "executing" ||
          statusReview === "executing" ||
          uploadMutation.isPending ||
          deleteMutation.isPending
        }
      />
      <Survey model={model} />
    </Box>
  );
};
