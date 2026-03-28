export interface FinancialSummary {
  totalBilled: number;
  fundsAdded: number;
  netSpend: number;
  vat: number;
  fundingGap: number;
  coveragePercent: number;
}

export interface ProjectData {
  name: string;
  internal: number;
  estimated: number;
  vat: number;
  share: number;
}

export interface ObjectiveData {
  name: string;
  value: number;
  color: string;
}

export interface DailyData {
  date: string;
  billed: number;
  topup: number;
}

export interface Campaign {
  name: string;
  project?: string;
  account: string;
  spend: number;
  vat: number;
  clicks: number;
  ctr: number;
  cpc: number;
  status: string;
}

export interface ReportAnalysisResult {
  financials: FinancialSummary;
  projects: ProjectData[];
  objectives: ObjectiveData[];
  dailyData: DailyData[];
  campaigns: Campaign[];
}

const PROJECT_TOKEN_SEPARATOR = /[^\p{L}\p{N}]+/gu;

export const OBJECTIVE_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export function round2(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function normalizeProjectName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeDateLabel(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);

  if (!match) {
    return trimmed;
  }

  return `${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
}

function toComparableKey(value: string): string {
  return normalizeProjectName(value)
    .toLowerCase()
    .split(PROJECT_TOKEN_SEPARATOR)
    .filter(Boolean)
    .join(' ');
}

function toSortNumber(value: string): number {
  const normalized = normalizeDateLabel(value);
  const match = normalized.match(/^(\d{2})-(\d{2})$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(match[1]) * 100 + Number(match[2]);
}

export function sortDailyData(items: DailyData[]): DailyData[] {
  return [...items].sort((left, right) => {
    const sortValue = toSortNumber(left.date) - toSortNumber(right.date);

    if (sortValue !== 0) {
      return sortValue;
    }

    return left.date.localeCompare(right.date);
  });
}

export function inferProjectFromName(name: string, projectNames: string[]): string | undefined {
  const comparableName = ` ${toComparableKey(name)} `;

  for (const projectName of projectNames) {
    const comparableProject = toComparableKey(projectName);

    if (comparableProject && comparableName.includes(` ${comparableProject} `)) {
      return projectName;
    }
  }

  let bestMatch: { name: string; score: number } | undefined;

  for (const projectName of projectNames) {
    const score = toComparableKey(projectName)
      .split(' ')
      .filter((token) => token.length > 2)
      .reduce((count, token) => (comparableName.includes(` ${token} `) ? count + 1 : count), 0);

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: projectName, score };
    }
  }

  return bestMatch?.name;
}
