import { useState } from "react";

const Dashboard = () => {
  const [syncStatus, setSyncStatus] = useState("");
  const handleSync = async () => {
    setSyncStatus("Syncing...");
    const response = await fetch("/api/sync", { method: "POST" });
    const data = await response.json();
    setSyncStatus(data.message);
    return (
      <>
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-50">
          <header className="w-full max-w-5xl text-sm font-mono">
            <h1 className="text-3xl font-semibold text-center">
              {" "}
              <code className="mb-6 text-4xl font-bold">Dashboard</code>
            </h1>
          </header>
          <div className="m-4">
            <button
              onClick={handleSync}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Start Sync
            </button>
            <div id="syncStatus">{syncStatus}</div>
          </div>
        </main>
      </>
    );
  };
};

export default Dashboard;
