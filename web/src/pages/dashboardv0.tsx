import React from "react"
import { Button } from "@/components/ui/button"
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenu } from "@/components/ui/dropdown-menu"
import { GitCommitVerticalIcon } from "../../public/icon/GitCommitVerticalIcon"
import { GithubIcon } from "../../public/icon/GithubIcon"
import { UserIcon } from "../../public/icon/UserIcon"
import { GitBranchIcon } from "../../public/icon/GitBranchIcon"
import { EyeIcon } from "../../public/icon/EyeIcon"
import { CalendarDaysIcon } from "../../public/icon/CalendarDaysIcon"
import { FilterIcon } from "../../public/icon/FilterIcon"
import { NotebookIcon } from "../../public/icon/NotebookIcon"
import { SettingsIcon } from "../../public/icon/SettingsIcon"
import HeaderV0 from "@/components/HeaderV0"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SyncStatus from "@/components/SyncStatus"
import BranchSelector from "@/components/BranchSelector"

const DashboardV0 = () => {
  return (
    <div className="flex flex-col h-screen">
      <HeaderV0 />
      <main className="flex-1 bg-gray-100 dark:bg-gray-800 p-6">
       <SyncStatus />
        <BranchSelector />
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
                  <DropdownMenuCheckboxItem>
                    <GitBranchIcon className="w-5 h-5 mr-2" />
                    Branch
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    <UserIcon className="w-5 h-5 mr-2" />
                    Author
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>
                    <CalendarDaysIcon className="w-5 h-5 mr-2" />
                    Date Range
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left">Commit</th>
                  <th className="px-4 py-2 text-left">Branch</th>
                  <th className="px-4 py-2 text-left">Author</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
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
                    <Badge className="bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400" variant="outline">
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
      </main>
    </div>
  )
}

export default DashboardV0
