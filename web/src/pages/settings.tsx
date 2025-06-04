import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/context/UserContext'
import RepositoryManager from '@/components/RepositoryManager'
import GitHubAccessManager from '@/components/GitHubAccessManager'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import ModeToggle from '@/components/ModeToggle'
import {
  Settings as SettingsIcon,
  GitBranch,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Github,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

const SettingsPage: React.FC = () => {
  const { user, isLoading } = useUser()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('repositories')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Handle URL tab parameter
    if (router.isReady && router.query.tab) {
      setActiveTab(router.query.tab as string)
    }
  }, [router.isReady, router.query.tab])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const userInfo = user?.user_metadata || {}

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your account, repositories, and sync preferences
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger
            value="repositories"
            className="flex items-center space-x-2"
          >
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">Repositories</span>
          </TabsTrigger>
          <TabsTrigger
            value="github-access"
            className="flex items-center space-x-2"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub Access</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center space-x-2"
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="flex items-center space-x-2"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories">
          <RepositoryManager />
        </TabsContent>

        <TabsContent value="github-access">
          <GitHubAccessManager />
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                {userInfo.avatar_url && (
                  <Image
                    src={userInfo.avatar_url}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">
                    {userInfo.full_name || userInfo.name || 'Unknown User'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    @{userInfo.user_name || userInfo.preferred_username}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">GitHub Username</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {userInfo.user_name ||
                      userInfo.preferred_username ||
                      'Not available'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {user?.email || 'Not available'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Type</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Badge variant="outline">GitHub OAuth</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Member Since</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : 'Not available'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Receive updates about your repositories
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get notified about important events
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Summary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Receive a weekly summary of your activity
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Appearance Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Theme</h4>
                  <div className="flex space-x-4">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                      className="flex items-center space-x-2"
                    >
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                      className="flex items-center space-x-2"
                    >
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                      className="flex items-center space-x-2"
                    >
                      <Monitor className="w-4 h-4" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Integrations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Github className="w-8 h-8" />
                    <div>
                      <h4 className="font-medium">GitHub</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Connected and syncing
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                  <div className="flex items-center space-x-3">
                    <Database className="w-8 h-8" />
                    <div>
                      <h4 className="font-medium">Notion</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Coming soon
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage
