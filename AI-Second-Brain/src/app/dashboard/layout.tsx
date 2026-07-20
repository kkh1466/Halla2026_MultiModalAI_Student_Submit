import { Chatbot } from "@/components/Chatbot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Chatbot />
    </>
  );
}
