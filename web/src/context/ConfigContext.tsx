import { useQuery } from '@tanstack/react-query'
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

interface Repo {
  id: string
  name: string
  org: string
}

interface ConfigSettings {
  repository: string
  organization: string
  githubToken: string
  notionToken: string
}

interface ConfigContextType {
  config: ConfigSettings
  setConfig: (config: ConfigSettings) => void
  fetchConfig: () => void
  updateFormValues: (repo: string, org: string) => void
  fetchUserRepos: (username: string) => Promise<Repo[]>
}

const initialConfig: ConfigSettings = {
  repository: '',
  organization: '',
  githubToken: '',
  notionToken: '',
}

const ConfigContext = createContext<ConfigContextType>({
  config: initialConfig,
  setConfig: () => {},
  fetchConfig: () => {},
  updateFormValues: () => {},
  fetchUserRepos: async () => [],
})

const fetchConfig = async (): Promise<ConfigSettings> => {
  const response = await fetch('/api/config')
  if (!response.ok) {
    throw new Error('Error fetching config')
  }
  return await response.json()
}

const fetchUserRepos = async (username: string): Promise<Repo[]> => {
  const response = await fetch(`/api/repos?username=${username}`)
  if (!response.ok) throw new Error('Error fetching repos')
  const data = await response.json()
  return data.repos || []
}

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<ConfigSettings>(initialConfig)

  const { data: fetchedConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['config'],
    queryFn: () => fetchConfig(),
    enabled: false,
    refetchOnWindowFocus: false,
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

  return (
    <ConfigContext.Provider
      value={{
        config,
        setConfig,
        fetchConfig,
        updateFormValues,
        fetchUserRepos,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfigContext = () => useContext(ConfigContext)
