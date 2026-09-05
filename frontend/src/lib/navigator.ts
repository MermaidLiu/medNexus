import { getApiBase } from "./api-base";

export interface DiseaseArea {
  id: string;
  name: string;
  icon: string;
  topics: string[];
}

export interface NavigatorConfig {
  platform: string;
  vertical: string;
  tagline: string;
  disease_areas: DiseaseArea[];
  suggested_questions: string[];
  read_compute_do: Array<{
    id: string;
    title: string;
    subtitle: string;
    description: string;
    steps: string[];
  }>;
  featured_trials: Array<{
    name: string;
    disease: string;
    finding: string;
  }>;
  app_tools: Array<{ name: string; category: string; desc: string }>;
}

export interface NavigatorSearchResult {
  query: string;
  answer: string;
  pico?: Record<string, string>;
  refined_question?: string;
  papers: Array<Record<string, unknown>>;
  related_trials: Array<{ name: string; disease: string; finding: string }>;
  suggested_followups: string[];
  source: string;
}

export async function fetchNavigatorConfig(): Promise<NavigatorConfig> {
  const res = await fetch(`${getApiBase()}/api/v1/navigator/config`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`配置加载失败 (${res.status})`);
  return res.json();
}

export async function navigatorSearch(query: string): Promise<NavigatorSearchResult> {
  const res = await fetch(`${getApiBase()}/api/v1/navigator/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`搜索失败 (${res.status})`);
  return res.json();
}
