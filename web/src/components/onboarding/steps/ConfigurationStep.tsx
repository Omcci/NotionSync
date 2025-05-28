import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

const ConfigurationStep: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Configure Sync Settings</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Set up your default sync preferences. You can customize these for each
          repository later.
        </p>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Default Branch Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="main-branch" defaultChecked />
              <label htmlFor="main-branch" className="text-sm font-medium">
                Track main/master branch by default
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="dev-branch" />
              <label htmlFor="dev-branch" className="text-sm font-medium">
                Track development branches
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="feature-branch" />
              <label htmlFor="feature-branch" className="text-sm font-medium">
                Track feature branches
              </label>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sync Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manual"
                  name="sync-frequency"
                  defaultChecked
                />
                <label htmlFor="manual" className="text-sm font-medium">
                  Manual sync only
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="hourly" name="sync-frequency" />
                <label htmlFor="hourly" className="text-sm font-medium">
                  Every hour
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="daily" name="sync-frequency" />
                <label htmlFor="daily" className="text-sm font-medium">
                  Daily
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ConfigurationStep
