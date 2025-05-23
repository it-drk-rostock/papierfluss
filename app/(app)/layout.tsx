import { AppLayout } from "@/components/app-layout";

export const metadata = {
  title: "My Mantine app",
  description: "I have followed setup instructions carefully",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
