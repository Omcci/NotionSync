import React, { createContext, useContext, useState, ReactNode } from "react";

interface Repo {
  id: string;
  name: string;
}
interface AppContextType {
  repos: Repo[];
  setRepos: (repos: Repo[]) => void;
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

export const AppProvider = ({ children }: AppProviderProps) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");

  const value = { repos, setRepos, selectedRepoId, setSelectedRepoId };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
