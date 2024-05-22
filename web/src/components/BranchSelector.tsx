import { EyeIcon } from "../../public/icon/EyeIcon";
import { GitBranchIcon } from "../../public/icon/GitBranchIcon";
import { GithubIcon } from "../../public/icon/GithubIcon";
import { NotebookIcon } from "../../public/icon/NotebookIcon";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const BranchSelector = () => {
  const branches = [
    {
      name: "main",
      status: "Tracked",
      actions: ["View", "Github", "Notebook"],
    },
    {
      name: "develop",
      status: "Tracked",
      actions: ["View", "Github", "Notebook"],
    },
    {
      name: "feature/new-page",
      status: "Error",
      actions: ["View", "Github", "Notebook"],
    },
    {
      name: "bugfix/login",
      status: "Tracked",
      actions: ["View", "Github", "Notebook"],
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Branch Selector</h2>
        <div className="flex items-center gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              <SelectItem value="main">main</SelectItem>
              <SelectItem value="develop">develop</SelectItem>
              <SelectItem value="feature/new-page">feature/new-page</SelectItem>
              <SelectItem value="bugfix/login">bugfix/login</SelectItem>
            </SelectContent>
          </Select>
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

          {branches.map((branch, idx) => (
            <tbody key={idx} >
              <tr className="border-b dark:border-gray-700">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GitBranchIcon className="w-5 h-5" />
                    <span>{branch.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      branch.status === "Tracked"
                        ? "bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-400"
                        : "bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400"
                    }
                    variant="outline"
                  >
                    {branch.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {branch.actions.map((action, idx) => (
                      <Button size="icon" variant="ghost" key={idx}>
                        {action === "View" && <EyeIcon className="w-5 h-5" />}
                        {action === "Github" && (
                          <GithubIcon className="w-5 h-5" />
                        )}
                        {action === "Notebook" && (
                          <NotebookIcon className="w-5 h-5" />
                        )}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
};

export default BranchSelector;
