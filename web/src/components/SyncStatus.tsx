import { CircleAlertIcon } from "../../public/icon/CircleAlertIcon";

const SyncStatus = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Last Sync Status</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Last successful sync:
            <span className="font-medium">May 15, 2024 at 10:30 AM</span>
          </p>
        </div>
        <div>
          <p className="text-red-500 dark:text-red-400">
            <CircleAlertIcon className="w-5 h-5 mr-2 inline" />
            Error syncing branch 'feature/new-page'
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyncStatus;