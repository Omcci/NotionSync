import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SettingsIcon } from "../../public/icon/SettingsIcon"
import HeaderV0 from "@/components/HeaderV0"
import SyncStatus from "@/components/SyncStatus"
import BranchSelector from "@/components/BranchSelector"
import CommitLog from "@/components/CommitLog"

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
        <CommitLog />
      </main>
    </div>
  )
}

export default DashboardV0
