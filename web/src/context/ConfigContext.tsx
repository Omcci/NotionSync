import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ConfigSettings {
  repository: string;
  organization: string;
  githubToken: string;
  notionToken: string;
}

interface ConfigContextType {
  config: ConfigSettings;
  setConfig: React.Dispatch<React.SetStateAction<ConfigSettings>>;
  fetchConfig: () => void;
}

const initialConfig: ConfigSettings = {
  repository: "",
  organization: "",
  githubToken: "",
  notionToken: "",
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigSettings>(initialConfig);

  const fetchConfig = async () => {
    const response = await fetch('/api/config');
    const data = await response.json();
    setConfig(data);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, setConfig, fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfigContext must be used within a ConfigProvider");
  }
  return context;
};
