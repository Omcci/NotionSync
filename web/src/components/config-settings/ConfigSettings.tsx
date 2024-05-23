import { SettingsIcon } from "../../../public/icon/SettingsIcon";
import { Button } from "../ui/button";
import ConfigSettingsForm from "./ConfigSettingsForm";

const ConfigSettings = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Configuration Settings</h2>
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2" variant="outline">
            <SettingsIcon className="w-5 h-5" />
            Edit Settings
          </Button>
        </div>
      </div>
      <ConfigSettingsForm />
    </div>
  );
};

export default ConfigSettings;
