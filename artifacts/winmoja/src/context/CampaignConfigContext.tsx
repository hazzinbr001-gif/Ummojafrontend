import { createContext, useContext, useState, useEffect } from "react";

interface CampaignConfig {
  candidateName: string;
  constituency: string;
  county: string;
  electionYear: number;
  wards: string[];
  partyName: string | null;
  setupComplete: boolean;
}

interface CampaignConfigContextValue {
  config: CampaignConfig | null;
  isLoading: boolean;
  setupComplete: boolean;
  wards: string[];
  refresh: () => void;
}

const DEFAULT_WARDS = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5"];

const CampaignConfigContext = createContext<CampaignConfigContextValue>({
  config: null,
  isLoading: true,
  setupComplete: false,
  wards: DEFAULT_WARDS,
  refresh: () => {},
});

export function CampaignConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = () => {
    setIsLoading(true);
    fetch("/api/config", { credentials: "include" })
      .then(r => r.json())
      .then(data => setConfig(data))
      .catch(() => setConfig(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchConfig(); }, []);

  return (
    <CampaignConfigContext.Provider value={{
      config,
      isLoading,
      setupComplete: config?.setupComplete ?? false,
      wards: config?.wards ?? DEFAULT_WARDS,
      refresh: fetchConfig,
    }}>
      {children}
    </CampaignConfigContext.Provider>
  );
}

export function useCampaignConfig() {
  return useContext(CampaignConfigContext);
}
