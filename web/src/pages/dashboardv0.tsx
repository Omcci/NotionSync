import React from 'react'
import HeaderV0 from '@/components/HeaderV0'
import SyncStatus from '@/components/SyncStatus'
import BranchSelector from '@/components/BranchSelector'
import CommitLog from '@/components/commit-log/CommitLog'

// TODO : Move the github login in header outside of the dashboard
const DashboardV0 = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeaderV0 />
      <div className="px-4">
        <h1 className="text-2xl font-bold ">Dashboard.</h1>
        <h3 className="text-lg text-gray-400 mb-4 ">
          {' '}
          Monitor your repositories and branches.{' '}
        </h3>
      </div>
      <main className="flex-1 bg-gray-100 dark:bg-gray-800 p-6">
        <SyncStatus />
        <BranchSelector />
        <CommitLog />
      </main>
    </div>
  )
}

export default DashboardV0
