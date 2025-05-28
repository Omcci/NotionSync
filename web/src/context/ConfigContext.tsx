import { useQuery } from '@tanstack/react-query'
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { ConfigRepo, ContextConfigSettings, ConfigContextType } from '../../types/context'

const initialConfig: ContextConfigSettings = {
  repository: '',
  organization: '',
  githubToken: '',
  notionToken: '',
}

const ConfigContext = createContext<ConfigContextType>({
  config: initialConfig,
  setConfig: () => { },
  fetchConfig: () => { },
  updateFormValues: () => { },
  fetchUserRepos: async () => [],
})

const fetchConfig = async (): Promise<ContextConfigSettings> => {
  const response = await fetch('/api/config')
  if (!response.ok) {
    throw new Error('Error fetching config')
  }
  return await response.json()
}

const fetchUserRepos = async (username: string): Promise<ConfigRepo[]> => {
  const response = await fetch(`/api/repos?username=${username}`)
  if (!response.ok) throw new Error('Error fetching repos')
  const data = await response.json()
  return data.repos || []
}

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<ContextConfigSettings>(initialConfig)

  const { data: fetchedConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['config'],
    queryFn: () => fetchConfig(),
    enabled: false,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (fetchedConfig) {
      setConfig(fetchedConfig)
    }
  }, [fetchedConfig])

  useEffect(() => {
    refetchConfig()
  }, [refetchConfig])

  const updateFormValues = (repo: string, org: string) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      repository: repo,
      organization: org,
    }))
  }

  // Wrapper function that uses React Query for fetching user repos
  const fetchUserReposWithQuery = async (username: string): Promise<ConfigRepo[]> => {
    return fetchUserRepos(username)
  }

  return (
    <ConfigContext.Provider
      value={{
        config,
        setConfig,
        fetchConfig,
        updateFormValues,
        fetchUserRepos: fetchUserReposWithQuery,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfigContext = () => useContext(ConfigContext)
