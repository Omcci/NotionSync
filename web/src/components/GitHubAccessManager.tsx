import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/components/ui/use-toast'
import { reauthorizeGitHub } from '@/lib/login'
import { Organization } from '../../types/github'
import {
    RefreshCw,
    ExternalLink,
    Shield,
    Users,
    AlertTriangle,
    CheckCircle,
    Settings,
    GitBranch
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import Image from 'next/image'

const fetchOrganizations = async (githubToken: string): Promise<Organization[]> => {
    const response = await fetch('/api/github/organizations', {
        headers: {
            Authorization: `Bearer ${githubToken}`,
        },
    })
    if (!response.ok) {
        throw new Error('Failed to fetch organizations')
    }
    const data = await response.json()
    return data.organizations || []
}

const GitHubAccessManager: React.FC = () => {
    const [showReauthDialog, setShowReauthDialog] = useState(false)
    const { githubToken, user } = useUser()
    const { toast } = useToast()
    const {
        data: organizations = [],
        isLoading,
        refetch,
        error
    } = useQuery({
        queryKey: ['github-organizations', githubToken],
        queryFn: () => fetchOrganizations(githubToken!),
        enabled: !!githubToken,
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        retry: (failureCount, error) => {
            if (error?.message?.includes('401') || error?.message?.includes('403')) {
                return false
            }
            return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })

    React.useEffect(() => {
        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch GitHub organizations',
                variant: 'destructive',
            })
        }
    }, [error, toast])

    const handleRefresh = () => {
        refetch()
    }

    const handleReauthorize = async () => {
        try {
            await reauthorizeGitHub()
            toast({
                title: 'Redirecting to GitHub',
                description: 'You will be redirected to GitHub to update your permissions',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to initiate reauthorization',
                variant: 'destructive',
            })
        }
    }

    const getRoleColor = (role?: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            case 'member':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }
    }

    const userInfo = user?.user_metadata || {}

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">GitHub Access Management</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Manage your GitHub organization access and permissions
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Settings className="w-4 h-4 mr-2" />
                                Update Access
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update GitHub Access</DialogTitle>
                                <DialogDescription>
                                    To change your organization permissions or add access to new organizations,
                                    you need to re-authorize with GitHub.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                                                Important Note
                                            </h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                                Re-authorization will temporarily sign you out and redirect you to GitHub
                                                where you can update your organization permissions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <Button onClick={handleReauthorize} className="flex-1">
                                        Re-authorize Now
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Current GitHub Connection</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        {userInfo.avatar_url && (
                            <Image
                                src={userInfo.avatar_url}
                                alt="GitHub Avatar"
                                width={48}
                                height={48}
                                className="rounded-full"
                            />
                        )}
                        <div className="flex-1">
                            <h3 className="font-semibold">
                                {userInfo.full_name || userInfo.name || 'GitHub User'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                @{userInfo.user_name || userInfo.preferred_username}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline" className="text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Connected
                                </Badge>
                                <Badge variant="outline">
                                    Scopes: repo, read:org, read:user
                                </Badge>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://github.com/${userInfo.user_name || userInfo.preferred_username}`, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span>Organization Access ({organizations.length})</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                        </div>
                    ) : organizations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No organization access found</p>
                            <p className="text-sm">
                                You may need to request access from organization owners or re-authorize
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setShowReauthDialog(true)}
                            >
                                Update Access
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {organizations.map((org) => (
                                <Card key={org.id} className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Image
                                                    src={org.avatar_url}
                                                    alt={`${org.login} avatar`}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full"
                                                />
                                                <div>
                                                    <h3 className="font-semibold">{org.login}</h3>
                                                    {org.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {org.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge className={getRoleColor(org.role)}>
                                                            {org.role || 'member'}
                                                        </Badge>
                                                        <span className="text-xs text-gray-500">
                                                            <GitBranch className="w-3 h-3 inline mr-1" />
                                                            {org.public_repos} public repos
                                                            {org.total_private_repos && ` • ${org.total_private_repos} private repos`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="text-right text-xs text-gray-500">
                                                    <div>Admin: {org.permissions?.admin ? '✓' : '✗'}</div>
                                                    <div>Push: {org.permissions?.push ? '✓' : '✗'}</div>
                                                    <div>Pull: {org.permissions?.pull ? '✓' : '✗'}</div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(org.html_url, '_blank')}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        <h4 className="font-medium mb-2">Common Issues:</h4>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>
                                <strong>Missing organizations:</strong> You may need to request access from organization owners
                            </li>
                            <li>
                                <strong>Limited permissions:</strong> Contact your organization admin to upgrade your role
                            </li>
                            <li>
                                <strong>Can&apos;t see private repos:</strong> Re-authorize to grant additional permissions
                            </li>
                        </ul>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://docs.github.com/en/organizations/managing-access-to-your-organizations-repositories', '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            GitHub Docs
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('https://github.com/settings/applications', '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Manage Apps
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default GitHubAccessManager 