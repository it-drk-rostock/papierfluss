import { BaseLayout } from "@components/base-layout";
import { SignInForm } from "./_components/sign-in-form";
import { Space } from "@mantine/core";

export default function Home() {
  return (
    <BaseLayout>
      <Space h="10vh" />
      <SignInForm />
    </BaseLayout>
  );
}
