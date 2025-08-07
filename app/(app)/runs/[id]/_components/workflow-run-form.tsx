"use client";

import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import "survey-core/i18n/german";
import { Box, LoadingOverlay } from "@mantine/core";
import React, { useMemo } from "react";
import { modals } from "@mantine/modals";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { ButtonAction } from "@/components/button-action";
import {
  createSignedUploadUrls,
  deleteFiles,
} from "@/server/utils/create-signed-upload-url";
import { useMutation } from "@tanstack/react-query";
import { showNotification } from "@/utils/notification";
import { IDocOptions, SurveyPDF } from "survey-pdf";
import { completeProcessRun, saveProcessRun } from "../_actions";

interface FormSubmissionProps {
  id: string;
  form: {
    id: string;
    schema: Record<string, unknown>;
  };
  data: Record<string, unknown> | null;
  status: "open" | "ongoing" | "completed";
}

interface FileItem {
  name: string;
  content: string;
}

export const WorkflowRunForm = ({
  submission,
}: {
  submission: FormSubmissionProps;
}) => {
  const { execute: executeUpdate, status: statusUpdate } = useEnhancedAction({
    action: saveProcessRun,
    hideModals: true,
  });

  const pdfDocOptions: IDocOptions = {
    fontSize: 12,
  };

  const savePdf = (surveyData: Record<string, unknown>) => {
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
      if (!response.files?.length)
        throw new Error("Fehler beim Hochladen der Dateien");
      return response;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileUrls: string[]) => {
      const response = await deleteFiles(fileUrls);
      if (!response.success) throw new Error("Fehler beim Löschen der Dateien");
      return response;
    },
  });

  // Memoize the SurveyJS Model to prevent recreation on every render
  const model = useMemo(() => {
    const surveyModel = new Model(submission.form.schema);
    surveyModel.locale = "de";
    surveyModel.data = submission.data;
    surveyModel.showCompleteButton = false;
    surveyModel.readOnly = submission.status === "completed";

    // Handle file uploads
    surveyModel.onUploadFiles.add(async (_, options) => {
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
          options.callback([], ["Fehler beim Hochladen der Dateien"]);
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
      } catch {
        showNotification("Fehler beim Hochladen der Dateien", "error");
        options.callback([], ["Fehler beim Hochladen der Dateien"]);
      }
    });

    // Handle file deletion
    surveyModel.onClearFiles.add(async (_, options) => {
      try {
        if (!options.value || options.value.length === 0) {
          return options.callback("success");
        }

        const filesToDelete = options.fileName
          ? options.value.filter(
              (item: FileItem) => item.name === options.fileName
            )
          : options.value;

        if (filesToDelete.length === 0) {
          return options.callback("error");
        }

        const fileUrls = filesToDelete.map((file: FileItem) => file.content);
        await deleteFiles(fileUrls);
        showNotification("Dateien gelöscht", "success");
        options.callback("success");
      } catch {
        showNotification("Fehler beim Löschen der Dateien", "error");
        options.callback("error");
      }
    });

    surveyModel.addNavigationItem({
      id: "save-process",
      title: "Speichern",
      innerCss: "sd-btn save-form",
      action: () => {
        const dataToSave = { ...surveyModel.data };
        executeUpdate({ id: submission.id, data: dataToSave });
      },
    });
    surveyModel.addNavigationItem({
      id: "submit-process",
      title: "Prozess abschließen",
      innerCss: "sd-btn submit-form",
      action: () => {
        modals.open({
          closeOnClickOutside: false,
          title: "Prozess abschließen",
          children: (
            <ButtonAction
              fullWidth
              action={completeProcessRun}
              values={{ id: submission.id }}
            >
              Prozess abschließen
            </ButtonAction>
          ),
        });
      },
    });

    surveyModel.addNavigationItem({
      id: "pdf-export",
      title: "PDF Export",
      action: () => savePdf(surveyModel.data),
    });

    return surveyModel;
  }, [
    submission.form.id,
    submission.form.schema,
    submission.data,
    submission.status,
    executeUpdate,
  ]);

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={
          statusUpdate === "executing" ||
          uploadMutation.isPending ||
          deleteMutation.isPending
        }
      />
      <Survey model={model} />
    </Box>
  );
};
