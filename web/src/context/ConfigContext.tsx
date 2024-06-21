import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ConfigSettings {
  repository: string;
  organization: string;
  githubToken: string;
  notionToken: string;
}

interface ConfigContextType {
  config: ConfigSettings;
  setConfig: (config: ConfigSettings) => void;
  fetchConfig: () => void;
  updateFormValues: (repo: string, org: string) => void;
}

const initialConfig: ConfigSettings = {
  repository: "",
  organization: "",
  githubToken: "",
  notionToken: "",
};

const ConfigContext = createContext<ConfigContextType>({
  config: initialConfig,
  setConfig: () => {},
  fetchConfig: () => {},
  updateFormValues: () => {},
});

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<ConfigSettings>(initialConfig);

  const fetchConfig = async () => {
    const response = await fetch("/api/config");
    const data = await response.json();
    setConfig(data);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateFormValues = (repo: string, org: string) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      repository: repo,
      organization: org,
    }));
  };

  return (
    <ConfigContext.Provider
      value={{ config, setConfig, fetchConfig, updateFormValues }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => useContext(ConfigContext);