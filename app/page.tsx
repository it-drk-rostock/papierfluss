import { BaseLayout } from "@components/base-layout";
import { SignInForm } from "./_components/sign-in-form";
import { AspectRatio, Container, Space, Stack, Title } from "@mantine/core";

export default function Home() {
  return (
    <BaseLayout>
      <Space h="10vh" />
      <SignInForm />
      <Container size="sm" mt="xl">
        <Stack gap="md">
          <Title order={3} ta="center">
            Anleitung Anmeldung
          </Title>
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
                src="https://seaweedfs.drk-rostock.de/media/anmeldung_fms.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </AspectRatio>
        </Stack>
      </Container>
    </BaseLayout>
  );
}
