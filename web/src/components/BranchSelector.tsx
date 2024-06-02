import { use, useEffect, useState } from "react";
import { EyeIcon } from "../../public/icon/EyeIcon";
import { GitBranchIcon } from "../../public/icon/GitBranchIcon";
import { GithubIcon } from "../../public/icon/GithubIcon";
import { NotebookIcon } from "../../public/icon/NotebookIcon";
import SelectComponent from "./SelectComponent";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useAppContext } from "@/context/AppContext";

interface Branch {
  name: string;
  label?: string;
  status: string;
  actions: Array<{ name: string; icon: JSX.Element }>;
}

const BranchSelector = () => {
  const { selectedRepo } = useAppContext();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  // TODO : Add branches state to context
  useEffect(() => {
    if (selectedRepo) {
      fetchBranches(selectedRepo.name);
    }
  }, [selectedRepo]);

  const fetchBranches = async (repoName: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/api/branches?repoName=${encodeURIComponent(
      repoName
    )}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Error fetching branches: ${response.status}`);
      }
      console.log("Fetched branches:", data.branches || []);
      const detailedBranches = (data.branches || []).map(
        (branchName: string) => ({
          name: branchName,
          status: branchName === "main" ? "Tracked" : "Untracked",
          actions: [
            { name: "View", icon: <EyeIcon /> },
            { name: "Github", icon: <GithubIcon /> },
            { name: "Notebook", icon: <NotebookIcon /> },
          ],
        })
      );

      setBranches(detailedBranches);
    } catch (error: any) {
      console.error("Failed to fetch branches:", error.message);
    }
  };
  const handleBranchSelect = (branchName: any) => {
    setSelectedBranch(branchName);
  };

  const branchOptions = branches.map((branch) => ({
    value: branch.name,
    label: branch.label || branch.name,
  }));
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Branch Selector</h2>
        <div className="flex items-center gap-4">
          <SelectComponent
            placeholder="Select a branch"
            options={branchOptions}
            value={selectedBranch}
            onChange={handleBranchSelect}
          />
          <div className="flex items-center gap-2">
            <Checkbox defaultChecked id="track-branch" />
            <Label
              className="text-sm font-medium leading-none"
              htmlFor="track-branch"
            >
              Track Branch
            </Label>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-4 py-2 text-left">Branch</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {branches.map((branch, idx) => (
              <tr key={idx} className="border-b dark:border-gray-700">
                <td className="px-4 py-3 flex items-center gap-2">
                  <GitBranchIcon className="w-5 h-5" />
                  {branch.name}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={`bg-${
                      branch.status === "Tracked"
                        ? "green-100 text-green-500 dark:bg-green-900 dark:text-green-400"
                        : "red-100 text-red-500 dark:bg-red-900 dark:text-red-400"
                    }`}
                    variant="outline"
                  >
                    {branch.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {branch.actions.map((action, actionIdx) => (
                    <Button key={actionIdx} size="icon" variant="ghost">
                      {action.icon}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchSelector;
