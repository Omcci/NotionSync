import React, { createContext, useContext, useState, ReactNode } from "react";

interface Repo {
  id: string;
  name: string;
}
interface AppContextType {
  repos: Repo[];
  setRepos: (repos: Repo[]) => void;
  selectedRepo: Repo | null;
  setSelectedRepo: (repo: Repo | null) => void;
}

const initialState: AppContextType = {
  repos: [],
  setRepos: () => {},
  selectedRepo: null,
  setSelectedRepo: () => {},
};

const AppContext = createContext<AppContextType>(initialState);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  const value = { repos, setRepos, selectedRepo, setSelectedRepo };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
