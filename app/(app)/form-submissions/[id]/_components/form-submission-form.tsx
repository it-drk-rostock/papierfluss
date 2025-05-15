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
import { handleFileUpload, deleteFile } from "@/server/utils/file-operations";

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

  // Add file upload handler using the file-operations utility
  model.onUploadFiles.add(async (_, options) => {
    try {
      const results = await handleFileUpload(options.files);
      options.callback(results);
    } catch (error) {
      console.error("Upload error:", error);
      options.callback(
        [],
        [`An error occurred during file upload. ${error.message}`]
      );
    }
  });

  // Add file deletion handler using the file-operations utility
  model.onClearFiles.add(async (_, options) => {
    if (!options.value || options.value.length === 0) {
      return options.callback("success");
    }

    const filesToDelete = options.fileName
      ? options.value.filter((item: any) => item.name === options.fileName)
      : options.value;

    if (filesToDelete.length === 0) {
      console.error(`File with name ${options.fileName} is not found`);
      return options.callback("error");
    }

    try {
      const results = await Promise.all(
        filesToDelete.map((file: any) => deleteFile(file.content))
      );

      if (results.every((res) => res === "success")) {
        options.callback("success");
      } else {
        options.callback("error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      options.callback("error");
    }
  });

  // Add custom CSS and click handlers for file previews
  React.useEffect(() => {
    // Add custom CSS to indicate clickable previews
    const style = document.createElement("style");
    style.innerHTML = `
      .sd-file__image-wrapper, .sd-file__preview-item {
        cursor: pointer;
        transition: transform 0.2s;
      }
      .sd-file__image-wrapper:hover, .sd-file__preview-item:hover {
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);

    // Function to handle image clicks
    const handleImageClick = (event) => {
      const imageWrapper = event.target.closest(".sd-file__image-wrapper");
      const previewItem = event.target.closest(".sd-file__preview-item");

      if (!(imageWrapper || previewItem)) return;

      // Find the file URL
      let fileUrl = null;

      // Try to find an image element and get its src
      const imgElement = (imageWrapper || previewItem)?.querySelector("img");
      if (imgElement?.src) {
        fileUrl = imgElement.src;
      } else {
        // Try to find the file data in the survey model
        const questionRoot = event.target.closest("[data-name]");
        if (questionRoot) {
          const questionName = questionRoot.getAttribute("data-name");
          const questionValue = model.getQuestionByName(questionName)?.value;

          if (Array.isArray(questionValue) && questionValue.length > 0) {
            const items = Array.from(
              document.querySelectorAll(".sd-file__preview-item")
            );
            const clickedItemIndex = items.findIndex(
              (item) => item === previewItem || item.contains(imageWrapper)
            );

            if (clickedItemIndex >= 0 && questionValue[clickedItemIndex]) {
              fileUrl = questionValue[clickedItemIndex].content;
            }
          }
        }
      }

      // Download the file if URL was found
      if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.target = "_blank";
        link.download = "";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    // Add a global click event listener
    document.addEventListener("click", handleImageClick, true);

    return () => {
      document.head.removeChild(style);
      document.removeEventListener("click", handleImageClick, true);
    };
  }, [model]);

  // Add file download handler (keep this for the SurveyJS built-in download button)
  model.onDownloadFile.add(async (_, options) => {
    try {
      const fileUrl = options.content;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.target = "_blank";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      options.callback("success");
    } catch (error) {
      console.error("Download error:", error);
      options.callback("error", `Failed to download file: ${error.message}`);
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
