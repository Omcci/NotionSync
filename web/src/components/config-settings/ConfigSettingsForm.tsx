import { Input } from "../ui/input";
import { Label } from "../ui/label";

const ConfigSettingsForm = () => {
  return (
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
  );
};

export default ConfigSettingsForm;
