import { useAppContext } from "@/context/AppContext";
import { CircleAlertIcon } from "../../public/icon/CircleAlertIcon";
import { useEffect } from "react";
import { format } from "date-fns";

const SyncStatus = () => {
  const { syncStatus, setSyncStatus } = useAppContext();
  const fetchSyncStatus = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/api/syncStatus`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching sync status: ${response.status}`);
      }
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getEmojiTime = (date: Date) => {
    const hours = date.getHours();
    return hours >= 6 && hours < 18 ? "🌞" : "🌜";
  };

  const formattedDate = syncStatus
    ? `${format(
        new Date(syncStatus.lastSyncDate!),
        "dd-MM-yyyy HH:mm:ss"
      )} ${getEmojiTime(new Date(syncStatus.lastSyncDate!))}`
    : "Loading ...";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Last Sync Status</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Last successful sync: {""}
            <span className="font-bold">{formattedDate}</span>
          </p>
        </div>
        {syncStatus && syncStatus.errorBranch && (
          <div>
            <p className="text-red-500 dark:text-red-400">
              <CircleAlertIcon className="w-5 h-5 mr-2 inline" />
              {syncStatus.statusMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatus;
