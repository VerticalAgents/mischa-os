import { ReactNode } from "react";
import { RepSidebar } from "@/components/rep/RepSidebar";

interface RepLayoutProps {
  children: ReactNode;
}

export default function RepLayout({ children }: RepLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <RepSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}