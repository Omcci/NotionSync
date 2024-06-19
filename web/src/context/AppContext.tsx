import React, { createContext, useContext, useState, ReactNode } from "react";

interface Repo {
  id: string;
  name: string;
  org: string;
}
interface AppContextType {
  repos: Repo[];
  setRepos: (repos: Repo[]) => void;
  selectedRepo: Repo | null;
  setSelectedRepo: (repo: Repo | null) => void;
  org: string;
  setOrg: (org: string) => void;
}

const initialState: AppContextType = {
  repos: [],
  setRepos: () => {},
  selectedRepo: null,
  setSelectedRepo: () => {},
  org: "",
  setOrg: () => {},
};

const AppContext = createContext<AppContextType>(initialState);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [org, setOrg] = useState<string>("");

  const value = { repos, setRepos, selectedRepo, setSelectedRepo, org, setOrg};
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
