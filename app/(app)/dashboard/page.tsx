import Link from "next/link";

export default function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Link href="/admin">Admin</Link>
    </>
  );
}
