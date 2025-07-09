"use client";

import { useState, useEffect } from "react";
import { ICreatorOptions } from "survey-creator-core";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";
import "survey-creator-core/i18n/german";
import { useParams } from "next/navigation";
import { useEnhancedAction } from "@/hooks/use-enhanced-action";
import { updateForm } from "../_actions";
import { createSignedUploadUrls } from "@/server/utils/create-signed-upload-url";
import {
  Box,
  LoadingOverlay,
  Drawer,
  Stack,
  Textarea,
  Button,
} from "@mantine/core";
import { useCompletion } from "@ai-sdk/react";
import { useForm } from "@mantine/form";
import { useMutation } from "@tanstack/react-query";
import { showNotification } from "@/utils/notification";

const defaultCreatorOptions: ICreatorOptions = {
  showTranslationTab: true,
  showThemeTab: true,
};

export const SurveyDesignerForm = (props: {
  json?: object;
  theme?: object;
}) => {
  // Create the upload mutation
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

  const { id } = useParams<{ id: string }>();
  const { execute, status } = useEnhancedAction({
    action: updateForm,
    hideModals: true,
  });

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
          id,
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

    // Update file upload handler to use mutation
    newCreator.onUploadFile.add(async (_, options) => {
      try {
        const file = options.files[0];

        // Get signed URL using mutation
        const uploadData = await uploadMutation.mutateAsync({
          files: [{ fileName: file.name, contentType: file.type }],
          formId: id,
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
      } catch (error) {
        showNotification("Datei hochladen fehlgeschlagen", "error");
        options.callback("error");
      }
    });

    return newCreator;
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

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
  const { completion, isLoading, complete } = useCompletion({
    api: "/api/ai/form",

    body: {
      currentForm: creator?.JSON,
    },

    onFinish: (prompt, completion) => {
      console.log(prompt, completion);
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

  console.log(completion, complete);

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
    }
  }, [creator, props.json, props.theme /* , creator?.JSON */]);

  return (
    <Box h="100vh" w="100%" pos="relative">
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
