"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { WelcomeSlide } from "../components/dashboard/WelcomeSlide";
import MainDashboard from "../components/dashboard/MainDashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stage, setStage] = useState<"welcome" | "main">("welcome");

  const user = session?.user as
    | (NonNullable<typeof session>["user"] & {
        nickname?: string | null;
        role?: string | null;
      })
    | undefined;

  const displayName = user?.name || user?.nickname || "";
  const userRole = user?.role || "";

  useEffect(() => {
    if (status === "loading") return;

    const timer = window.setTimeout(() => {
      setStage("main");
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <div className="min-h-screen bg-[#010307]">
      {stage === "welcome" && <WelcomeSlide userName={displayName} role={userRole} />}
      {stage === "main" && <MainDashboard />}
    </div>
  );
}
