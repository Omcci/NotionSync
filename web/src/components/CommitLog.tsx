import { CalendarDaysIcon } from "../../public/icon/CalendarDaysIcon";
import { EyeIcon } from "../../public/icon/EyeIcon";
import { FilterIcon } from "../../public/icon/FilterIcon";
import { GitBranchIcon } from "../../public/icon/GitBranchIcon";
import { GitCommitVerticalIcon } from "../../public/icon/GitCommitVerticalIcon";
import { GithubIcon } from "../../public/icon/GithubIcon";
import { NotebookIcon } from "../../public/icon/NotebookIcon";
import { UserIcon } from "../../public/icon/UserIcon";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

const CommitLog = () => {
  const filters = [
    {
      name: "Branch",
      icon: GitBranchIcon,
    },
    {
      name: "Author",
      icon: UserIcon,
    },
    {
      name: "Date Range",
      icon: CalendarDaysIcon,
    },
  ];

  const theader = ["Commit", "Branch", "Author", "Date", "Status", "Actions"];
  const lines = [
    {
      commit: "Implement new feature",
      branch: "feature/new-page",
      author: "John Doe",
      date: "May 15, 2024",
      status: "Failed",
      actions: ["View", "Github", "Notebook"],
    },
    {
      commit: "Fix bug in login flow",
      branch: "bugfix/login",
      author: "Jane Smith",
      date: "May 14, 2024",
      status: "",
      actions: ["View", "Github", "Notebook"],
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Commit Log</h2>
        <div className="flex items-center gap-4">
          <Input
            className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 text-sm"
            placeholder="Search commits..."
            type="search"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2" variant="outline">
                <FilterIcon className="w-5 h-5" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filters.map((filter) => (
                <DropdownMenuCheckboxItem key={filter.name}>
                  <filter.icon className="w-5 h-5 mr-1" />
                  <span>{filter.name}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {theader.map((header) => (
                <th key={header} className="px-4 py-2 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr className="border-b dark:border-gray-700">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <GitCommitVerticalIcon className="w-5 h-5" />
                  <span className="font-medium">Implement new feature</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <GitBranchIcon className="w-5 h-5" />
                  <span>feature/new-page</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <span>John Doe</span>
                </div>
              </td>
              <td className="px-4 py-3">May 15, 2024</td>
              <td className="px-4 py-3">
                <Badge
                  className="bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400"
                  variant="outline"
                >
                  Failed
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost">
                    <EyeIcon className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <GithubIcon className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <NotebookIcon className="w-5 h-5" />
                  </Button>
                </div>
              </td>
            </tr>
            <tr className="border-b dark:border-gray-700">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <GitCommitVerticalIcon className="w-5 h-5" />
                  <span className="font-medium">Fix bug in login flow</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <GitBranchIcon className="w-5 h-5" />
                  <span>bugfix/login</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <span>Jane Smith</span>
                </div>
              </td>
              <td className="px-4 py-3">May 14, 2024</td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommitLog;
