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

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<ConfigSettings>(initialConfig)

  const fetchConfig = async () => {
    const response = await fetch('/api/config')
    const data = await response.json()
    setConfig(data)
  }

  const fetchUserRepos = async (username: string) => {
    const response = await fetch(`/api/repos?username=${username}`)
    const data = await response.json()
    return data.repos || []
  }

  useEffect(() => {
    fetchConfig()
  }, [])

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
