import React, { createContext, useContext, useState, ReactNode } from "react";

interface AppContextType {
  repos: string[];
  setRepos: (repos: string[]) => void;
  selectedRepoId: string;
  setSelectedRepoId: (id: string) => void;
}

const initialState: AppContextType = {
  repos: [],
  setRepos: () => {},
  selectedRepoId: "",
  setSelectedRepoId: () => {},
};

const AppContext = createContext<AppContextType>(initialState);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [repos, setRepos] = useState<string[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");

  const value = {
    repos,
    setRepos,
    selectedRepoId,
    setSelectedRepoId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
