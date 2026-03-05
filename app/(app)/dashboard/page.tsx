import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  AspectRatio,
  Divider,
  Loader,
  Title,
} from "@mantine/core";
import { Suspense } from "react";
import { Teams } from "./_components/teams";
import { FormSubmissions } from "./_components/form-submissions";

export default function Page() {
  return (
    <>
      <Title order={1}>Übersicht</Title>
      <Divider />
      <Title order={2}>Meine Bereiche</Title>
      <Suspense fallback={<Loader />}>
        <Teams />
      </Suspense>
      {/* <Title order={2}>Meine Formulare</Title>
      <Suspense fallback={<Loader />}>
        <FormSubmissions />
      </Suspense> */}
      <Divider />
      <Title order={2}>Anleitungen Formularservice</Title>
      <Accordion variant="contained">
        <AccordionItem value="Übersicht / Dashboard">
          <AccordionControl>Übersicht / Dashboard</AccordionControl>
          <AccordionPanel>
            <AspectRatio ratio={16 / 9}>
              <video
                controls
                preload="none"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              >
                <source
                  src="https://seaweedfs.drk-rostock.de/media/FMS_Übersicht_converted.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </AspectRatio>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="Formularservice Portale">
          <AccordionControl>Formularservice Portale</AccordionControl>
          <AccordionPanel>
            <AspectRatio ratio={16 / 9}>
              <video
                controls
                preload="none"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              >
                <source
                  src="https://seaweedfs.drk-rostock.de/media/FMS_Portal_Übersicht_converted.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </AspectRatio>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="Formularservice Portale Formulare Detailiert">
          <AccordionControl>
            Formularservice Portale Formulare Detailiert
          </AccordionControl>
          <AccordionPanel>
            <AspectRatio ratio={16 / 9}>
              <video
                controls
                preload="none"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              >
                <source
                  src="https://seaweedfs.drk-rostock.de/media/FMS_Formular_Übersicht_converted.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </AspectRatio>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </>
  );
}
