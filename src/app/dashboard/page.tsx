'use client';

import { useEffect } from "react";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import OverviewStats from "@/components/dashboard/OverviewStats";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard - ToolkitHub';
  }, []);

  return (
    <div className="space-y-6">
      <DashboardTopBar />
      <OverviewStats />
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>
        <div className="xl:col-span-3">
          <QuickActions />
        </div>
      </section>
    </div>
  );
}
