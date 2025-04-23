import { Title } from "@mantine/core";

export const metadata = {
  title: "My Mantine app",
  description: "I have followed setup instructions carefully",
};

export default async function Layout({
  params,
  children,
}: {
  params: { id: string };
  children: React.ReactNode;
}) {
  const { id } = await params;
  return (
    <>
      <Title order={1}>Formular {id}</Title>
      {children}
    </>
  );
}
