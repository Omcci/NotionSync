import { FolderSyncIcon } from "../../public/icon/FolderSyncIcon";
import { GithubIcon } from "../../public/icon/GithubIcon";
import { RepeatIcon } from "../../public/icon/RepeatIcon";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { useToast } from "./ui/use-toast";
import { useEffect, useState } from "react";
// import { signIn, signOut, useSession } from "next-auth/react";
//TODO : add session with github oauth
//TODO : display user friendly message of sync status

const HeaderV0 = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  // const { data: session } = useSession();
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const username = process.env.USERNAME || "Omcci";

  useEffect(() => {
    fetchUserRepos(username);
  }, [username]);

  const fetchUserRepos = async (username: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/api/repos?username=${username}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching repositories: ${response.status}`);
      }
      const data = await response.json();
      if (response.ok) {
        setRepos(data.repos);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch repositories.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch repositories.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/sync?action=sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
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
    <header className="py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost">
          <GithubIcon className="w-5 h-5 mr-2" />
          Login with GitHub
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          disabled={!repos.length}
        >
          <option value="">Select a repository</option>
          {repos.map((repo) => (
            <option key={repo} value={repo}>
              {repo}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          onClick={handleSync}
          disabled={!selectedRepo || loading}
        >
          <FolderSyncIcon className="w-5 h-5 mr-2" />
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
