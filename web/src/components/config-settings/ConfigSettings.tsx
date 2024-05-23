import { SettingsIcon } from "../../../public/icon/SettingsIcon";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="repository">Repository</Label>
            <Input defaultValue="my-project" id="repository" type="text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input defaultValue="acme-inc" id="organization" type="text" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-token">GitHub Token</Label>
            <Input defaultValue="*****" id="github-token" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notion-token">Notion Token</Label>
            <Input defaultValue="*****" id="notion-token" type="password" />
          </div>
        </div>
      </div>
    );
}

export default ConfigSettings;