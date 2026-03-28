import { GoogleGenAI, Type } from '@google/genai';

import {
  inferProjectFromName,
  normalizeDateLabel,
  normalizeProjectName,
  round2,
  sortDailyData,
  type Campaign,
  type DailyData,
  type FinancialSummary,
  type ObjectiveData,
  type ProjectData,
  type ReportAnalysisResult,
} from '../src/lib/report-data.js';

export interface AnalyzeReportRequest {
  content: string;
  mimeType: string;
  isText?: boolean;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

const REPORT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: ['financials', 'projects', 'objectives', 'dailyData', 'campaigns'],
  properties: {
    financials: {
      type: Type.OBJECT,
      required: ['totalBilled', 'fundsAdded', 'netSpend', 'vat', 'fundingGap', 'coveragePercent'],
      properties: {
        totalBilled: { type: Type.NUMBER },
        fundsAdded: { type: Type.NUMBER },
        netSpend: { type: Type.NUMBER },
        vat: { type: Type.NUMBER },
        fundingGap: { type: Type.NUMBER },
        coveragePercent: { type: Type.NUMBER },
      },
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['name', 'internal', 'estimated', 'vat', 'share'],
        properties: {
          name: { type: Type.STRING },
          internal: { type: Type.NUMBER },
          estimated: { type: Type.NUMBER },
          vat: { type: Type.NUMBER },
          share: { type: Type.NUMBER },
        },
      },
    },
    objectives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['name', 'value'],
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.NUMBER },
        },
      },
    },
    dailyData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['date', 'billed', 'topup'],
        properties: {
          date: { type: Type.STRING },
          billed: { type: Type.NUMBER },
          topup: { type: Type.NUMBER },
        },
      },
    },
    campaigns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ['name', 'project', 'account', 'spend', 'vat', 'clicks', 'ctr', 'cpc', 'status'],
        properties: {
          name: { type: Type.STRING },
          project: { type: Type.STRING },
          account: { type: Type.STRING },
          spend: { type: Type.NUMBER },
          vat: { type: Type.NUMBER },
          clicks: { type: Type.NUMBER },
          ctr: { type: Type.NUMBER },
          cpc: { type: Type.NUMBER },
          status: { type: Type.STRING },
        },
      },
    },
  },
} as const;

const REPORT_PROMPT = `You are a marketing finance analyst. Extract structured data from a Facebook Ads report and return only valid JSON that matches the provided schema.

Rules:
1. Preserve monetary precision to 2 decimal places.
2. financials.totalBilled must include VAT.
3. financials.netSpend must be before VAT.
4. Each project must include internal budget, estimated net spend, VAT, and share percentage.
5. dailyData.date must use MM-DD format.
6. Each campaign must include a project field that maps to one of the extracted projects whenever possible.
7. If a value is missing, return 0 for numbers and an empty string for text rather than omitting fields.
8. Return JSON only. No markdown fences, no explanation.`;

const ALLOWED_MIME_TYPES = new Set([
  'application/json',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_TEXT_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return round2(value);
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]+/g, '');
    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) {
      return round2(parsed);
    }
  }

  return round2(fallback);
}

function normalizeProjects(input: unknown): ProjectData[] {
  const projects = Array.isArray(input)
    ? input
        .map((entry) => {
          const item = asObject(entry);
          const name = normalizeProjectName(asString(item.name));
          const estimated = toFiniteNumber(item.estimated);
          const vat = toFiniteNumber(item.vat);
          const total = estimated + vat;

          if (!name || total <= 0) {
            return null;
          }

          return {
            name,
            internal: toFiniteNumber(item.internal),
            estimated,
            vat,
            share: toFiniteNumber(item.share),
          } satisfies ProjectData;
        })
        .filter((project): project is ProjectData => project !== null)
    : [];

  const totalProjectSpend = projects.reduce((sum, project) => sum + project.estimated + project.vat, 0);

  return projects.map((project) => ({
    ...project,
    share:
      project.share > 0
        ? project.share
        : totalProjectSpend > 0
          ? round2(((project.estimated + project.vat) / totalProjectSpend) * 100)
          : 0,
  }));
}

function normalizeFinancials(input: unknown, projects: ProjectData[]): FinancialSummary {
  const item = asObject(input);
  const derivedNetSpend = round2(projects.reduce((sum, project) => sum + project.estimated, 0));
  const derivedVat = round2(projects.reduce((sum, project) => sum + project.vat, 0));
  const totalBilled = toFiniteNumber(item.totalBilled, derivedNetSpend + derivedVat);
  const fundsAdded = toFiniteNumber(item.fundsAdded);
  const vat = toFiniteNumber(item.vat, derivedVat);
  const netSpend = toFiniteNumber(item.netSpend, derivedNetSpend || totalBilled - vat);
  const fundingGap = round2(totalBilled - fundsAdded);
  const coveragePercent = totalBilled > 0 ? round2((fundsAdded / totalBilled) * 100) : 0;

  return {
    totalBilled,
    fundsAdded,
    netSpend,
    vat,
    fundingGap,
    coveragePercent,
  };
}

function normalizeObjectives(input: unknown): ObjectiveData[] {
  return Array.isArray(input)
    ? input
        .map((entry) => {
          const item = asObject(entry);
          const name = asString(item.name);

          if (!name) {
            return null;
          }

          return {
            name,
            value: toFiniteNumber(item.value),
            color: '',
          } satisfies ObjectiveData;
        })
        .filter((objective): objective is ObjectiveData => objective !== null)
    : [];
}

function normalizeDailyData(input: unknown): DailyData[] {
  const dailyData = Array.isArray(input)
    ? input
        .map((entry) => {
          const item = asObject(entry);
          const date = normalizeDateLabel(asString(item.date));

          if (!date) {
            return null;
          }

          return {
            date,
            billed: toFiniteNumber(item.billed),
            topup: toFiniteNumber(item.topup),
          } satisfies DailyData;
        })
        .filter((entry): entry is DailyData => entry !== null)
    : [];

  return sortDailyData(dailyData);
}

function normalizeCampaigns(input: unknown, projectNames: string[]): Campaign[] {
  return Array.isArray(input)
    ? input
        .map((entry): Campaign | null => {
          const item = asObject(entry);
          const name = asString(item.name);

          if (!name) {
            return null;
          }

          const explicitProject = normalizeProjectName(asString(item.project));
          const project = explicitProject || inferProjectFromName(name, projectNames) || '';

          return {
            name,
            project,
            account: asString(item.account),
            spend: toFiniteNumber(item.spend),
            vat: toFiniteNumber(item.vat),
            clicks: toFiniteNumber(item.clicks),
            ctr: toFiniteNumber(item.ctr),
            cpc: toFiniteNumber(item.cpc),
            status: asString(item.status, 'Fair'),
          };
        })
        .filter((campaign): campaign is Campaign => campaign !== null)
    : [];
}

function normalizeReportAnalysis(input: unknown): ReportAnalysisResult {
  const result = asObject(input);
  const projects = normalizeProjects(result.projects);
  const projectNames = projects.map((project) => project.name);

  return {
    financials: normalizeFinancials(result.financials, projects),
    projects,
    objectives: normalizeObjectives(result.objectives),
    dailyData: normalizeDailyData(result.dailyData),
    campaigns: normalizeCampaigns(result.campaigns, projectNames),
  };
}

function estimateBase64Bytes(content: string): number {
  const padding = content.endsWith('==') ? 2 : content.endsWith('=') ? 1 : 0;
  return Math.floor((content.length * 3) / 4) - padding;
}

function assertAnalyzeReportRequest(payload: unknown): AnalyzeReportRequest {
  const body = asObject(payload);
  const content = asString(body.content);
  const mimeType = asString(body.mimeType);
  const isText = Boolean(body.isText);

  if (!content) {
    throw new ApiError(400, 'Missing report content.');
  }

  if (!mimeType) {
    throw new ApiError(400, 'Missing report mime type.');
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ApiError(415, 'Unsupported report file type.');
  }

  const contentSize = isText ? Buffer.byteLength(content, 'utf8') : estimateBase64Bytes(content);

  if (contentSize > (isText ? MAX_TEXT_BYTES : MAX_FILE_BYTES)) {
    throw new ApiError(413, 'Uploaded report is too large for analysis.');
  }

  return { content, mimeType, isText };
}

export async function analyzeReportPayload(payload: unknown): Promise<ReportAnalysisResult> {
  const request = assertAnalyzeReportRequest(payload);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, 'Missing GEMINI_API_KEY on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const response = request.isText
    ? await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: `${REPORT_PROMPT}\n\nReport content:\n${request.content}` }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: REPORT_RESPONSE_SCHEMA,
        },
      })
    : await ai.models.generateContent({
        model,
        contents: [
          { parts: [{ text: REPORT_PROMPT }] },
          { parts: [{ inlineData: { data: request.content, mimeType: request.mimeType } }] },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: REPORT_RESPONSE_SCHEMA,
        },
      });

  const rawText = response.text;

  if (!rawText) {
    throw new ApiError(502, 'Gemini returned an empty response.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new ApiError(502, 'Gemini returned invalid JSON.');
  }

  const result = normalizeReportAnalysis(parsed);

  if (result.projects.length === 0 && result.campaigns.length === 0) {
    throw new ApiError(422, 'AI response did not contain usable report data.');
  }

  return result;
}

export function formatApiError(error: unknown): { statusCode: number; message: string } {
  if (error instanceof ApiError) {
    return { statusCode: error.statusCode, message: error.message };
  }

  if (error instanceof Error) {
    return { statusCode: 500, message: error.message };
  }

  return { statusCode: 500, message: 'Unexpected server error.' };
}
