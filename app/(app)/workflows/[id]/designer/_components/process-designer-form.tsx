"use client";

import { useState, useEffect } from "react";
import { ICreatorOptions } from "survey-creator-core";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import "survey-creator-core/i18n/german";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { updateProcessForm } from "../_actions";
import { createSignedUploadUrls } from "@/server/utils/create-signed-upload-url";
import {
  Box,
  LoadingOverlay,
  Drawer,
  Stack,
  Textarea,
  Button,
} from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { showNotification } from "@/utils/notification";
import { useCompletion } from "@ai-sdk/react";
import { useForm } from "@mantine/form";

const defaultCreatorOptions: ICreatorOptions = {
  showTranslationTab: true,
  showThemeTab: true,
};

export const ProcessDesignerForm = (props: {
  processId: string;
  json?: object;
  theme?: object;
  name: string;
  description: string | null;
}) => {
  // Create the upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      files,
      processId,
    }: {
      files: { fileName: string; contentType: string }[];
      processId: string;
    }) => {
      const response = await createSignedUploadUrls(files, processId);
      if (!response.files?.length) throw new Error("Failed to get upload URLs");
      return response;
    },
  });

  const { execute, status } = useEnhancedAction({
    action: updateProcessForm,
    hideModals: true,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [creator] = useState(() => {
    // Initialize creator only once
    const newCreator = new SurveyCreator(defaultCreatorOptions);

    // Set up save functionality
    newCreator.saveSurveyFunc = async (
      no: number,
      callback: (num: number, status: boolean) => void
    ) => {
      try {
        const surveyJSON = newCreator.JSON;
        const themeJSON = newCreator.theme;
        execute({
          id: props.processId,
          schema: surveyJSON,
          theme: themeJSON,
        });
        callback(no, true);
      } catch {
        callback(no, false);
      }
    };

    // Add AI generator action to toolbar
    newCreator.toolbar.addAction({
      id: "ai-generator",
      visible: true,
      title: "KI Agent",
      action: () => setDrawerOpen(true),
      innerCss: "sv-action-bar-item--secondary",
      showTitle: true,
      location: "end",
    });

    // Set initial properties
    newCreator.isAutoSave = false;
    newCreator.locale = "de";
    newCreator.applyCreatorTheme(props.theme);

    // Set survey title and description from process
    newCreator.survey.title = props.name;
    newCreator.survey.description = props.description || "";

    // Update file upload handler to use mutation
    newCreator.onUploadFile.add(async (_, options) => {
      try {
        const file = options.files[0];

        // Get signed URL using mutation
        const uploadData = await uploadMutation.mutateAsync({
          files: [{ fileName: file.name, contentType: file.type }],
          processId: props.processId,
        });

        if (!uploadData.files?.[0]?.url || !uploadData.files?.[0]?.fileUrl) {
          showNotification("Datei hochladen fehlgeschlagen", "error");
          options.callback("error");
          return;
        }

        // Upload file using signed URL
        await fetch(uploadData.files[0].url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        showNotification("Datei hochgeladen", "success");
        options.callback("success", uploadData.files[0].fileUrl);
      } catch {
        showNotification("Datei hochladen fehlgeschlagen", "error");
        options.callback("error");
      }
    });

    return newCreator;
  });

  // Add Mantine form
  const form = useForm({
    initialValues: {
      prompt: "",
    },
    validate: {
      prompt: (value) =>
        value.length < 3 ? "Prompt must be at least 3 characters" : null,
    },
  });

  // Simplify completion hook without complex types
  const { isLoading, complete } = useCompletion({
    api: "/api/ai/form",
    body: {
      currentForm: creator?.JSON,
    },
    onFinish: (prompt, completion) => {
      try {
        const surveyJSON = JSON.parse(completion);
        if (creator) {
          creator.JSON = surveyJSON;
        }
      } catch (e) {
        console.error("Failed to parse AI generated survey:", e);
      }
    },
  });

  // Create a wrapped submit handler using Mantine form
  const handleFormSubmit = form.onSubmit((values) => {
    complete(values.prompt);
    form.reset();
  });

  // Update JSON and theme when props change
  useEffect(() => {
    if (creator) {
      if (props.json) {
        creator.JSON = props.json;
      }
      if (props.theme) {
        creator.theme = props.theme;
      }
      // Update title and description when they change
      creator.survey.title = props.name;
      creator.survey.description = props.description || "";
    }
  }, [creator, props.json, props.theme, props.name, props.description]);

  return (
    <Box h="calc(100vh - 60px)" w="100%" pos="relative">
      <LoadingOverlay
        visible={status === "executing"}
        zIndex={1000}
        overlayProps={{ radius: "sm", blur: 2 }}
      />
      <SurveyCreatorComponent key="survey-creator" creator={creator} />

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="right"
        title="KI Formular Generator"
        padding="md"
      >
        <Stack>
          <form onSubmit={handleFormSubmit}>
            <Textarea
              {...form.getInputProps("prompt")}
              placeholder="Beschreibe das Formular, das du erstellen möchtest, falls du schon eins erstellt hast wird es mit einbezogen und du kannst Änderungen an deinem aktuellen vornehmen ansonsten wird ein neues erstellt"
              mb="sm"
            />
            <Button type="submit" loading={isLoading} fullWidth>
              Generieren
            </Button>
          </form>
        </Stack>
      </Drawer>
    </Box>
  );
};
