import React from "react";
import HeaderV0 from "@/components/HeaderV0";
import SyncStatus from "@/components/SyncStatus";
import BranchSelector from "@/components/BranchSelector";
import CommitLog from "@/components/commit-log/CommitLog";
import ConfigSettings from "@/components/config-settings/ConfigSettings";

const DashboardV0 = () => {
  return (
    <div className="flex flex-col">
      <HeaderV0 />
      <main className="flex-1 bg-gray-100 dark:bg-gray-800 p-6">
        <SyncStatus />
        <BranchSelector />
        <ConfigSettings />
        <CommitLog />
      </main>
    </div>
  );
};

export default DashboardV0;
