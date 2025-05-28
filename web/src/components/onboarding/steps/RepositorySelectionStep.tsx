import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RepositorySelectionStepProps } from '../types'

const RepositorySelectionStep: React.FC<RepositorySelectionStepProps> = ({
  availableRepos,
  selectedRepos,
  isLoading,
  onRepoToggle,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Your Repositories</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose which repositories you&apos;d like to sync with Notion. You can
          change this later.
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-3">
          {availableRepos.map((repo) => (
            <Card
              key={repo.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedRepos.has(repo.id)}
                    onCheckedChange={() => onRepoToggle(repo.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{repo.name}</h3>
                      {repo.private && (
                        <Badge variant="secondary" className="text-xs">
                          Private
                        </Badge>
                      )}
                      {repo.language && (
                        <Badge variant="outline" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {repo.owner}/{repo.name}
                    </p>
                    {repo.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {repo.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="text-center text-sm text-gray-500">
        Selected {selectedRepos.size} of {availableRepos.length} repositories
      </div>
    </div>
  )
}

export default RepositorySelectionStep
