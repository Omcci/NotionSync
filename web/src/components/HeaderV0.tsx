import { Toggle } from "@radix-ui/react-toggle";
import { FolderSyncIcon } from "../../public/icon/FolderSyncIcon";
import { GithubIcon } from "../../public/icon/GithubIcon";
import { RepeatIcon } from "../../public/icon/RepeatIcon";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { useState } from "react";

const HeaderV0 = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/sync`, { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: data.message });
      } else {
        toast({
          title: "Error",
          description: data.details || "Sync failed. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Sync failed. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <header className=" py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost">
          <GithubIcon className="w-5 h-5 mr-2" />
          Login with GitHub
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost">
          <FolderSyncIcon className="w-5 h-5 mr-2" onClick={handleSync} />
          {loading ? "Syncing..." : "Start Sync"}
        </Button>
        <Toggle aria-label="Automatic Sync">
          <RepeatIcon className="w-5 h-5" />
        </Toggle>
      </div>
    </header>
  );
};

export default HeaderV0;
