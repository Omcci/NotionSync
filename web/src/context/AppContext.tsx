import React, { createContext, useContext, useState, ReactNode } from "react";

interface Repo {
  id: string;
  name: string;
  org: string;
}

interface SyncStatus {
  lastSyncDate: string | null;
  errorBranch: string | null;
  statusMessage: string | null;
}

interface AppContextType {
  repos: Repo[];
  setRepos: (repos: Repo[]) => void;
  selectedRepo: Repo | null;
  setSelectedRepo: (repo: Repo | null) => void;
  syncStatus: SyncStatus | null;
  setSyncStatus: (status: SyncStatus | null) => void;
}

const initialState: AppContextType = {
  repos: [],
  setRepos: () => {},
  selectedRepo: null,
  setSelectedRepo: () => {},
  syncStatus: null,
  setSyncStatus: () => {},
};

const AppContext = createContext<AppContextType>(initialState);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const value = {
    repos,
    setRepos,
    selectedRepo,
    setSelectedRepo,
    syncStatus,
    setSyncStatus,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
