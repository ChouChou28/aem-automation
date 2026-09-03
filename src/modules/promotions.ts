import { Gift } from "lucide-react";
import { apiRequest, extractMessage, type ApiResult } from "@/lib/api";
import { createModule } from "@/modules/base";
import type { ResultRow, RunContext } from "@/modules/types";

const API_ROOT = "https://p6-ap-author.samsung.com/pim/core/workflow/v6";
const ENDPOINTS = {
  search: "https://p6-ap-author.samsung.com/pim/b2c/product/detail/main/v6/list",
  modelInfo: "https://p6-ap-author.samsung.com/pim/b2c/product/detail/basic/v6/info",
  validate: `${API_ROOT}/selectcountofinvalidworkflow`,
  requestId: `${API_ROOT}/getnewrequestid`,
  start: `${API_ROOT}/startaemdirectworkflow`,
};

export const promotionsModule = createModule({
  id: "promotions",
  label: "Promotions and Others",
  icon: Gift,
  description: "Start AEM direct-update workflows for promotion tickets",
  targetUrl: ENDPOINTS.start,
  exportName: "promotions-workflow",
  flows: [{ id: "open-workflow", label: "Open Workflow" }],
  fields: [
    {
      name: "siteCode",
      label: "Site Code",
      type: "text",
      defaultValue: "th",
      placeholder: "th",
      required: true,
      validate: (value) =>
        /^[a-z]{2}$/i.test(value.trim())
          ? undefined
          : "Site code must be a 2-letter code (e.g. th)",
    },
    {
      name: "modelCode",
      label: "Model Code",
      type: "text",
      placeholder: "WA17CG6441BYST",
      hint: "Used as modelKeyword to find the exact AEM model code",
      required: true,
    },
    {
      name: "requestTitle",
      label: "Request Title",
      type: "text",
      placeholder: "Enter a Site Code and Model Code to generate the title",
      hint: "Generated from the selected site's product family information",
      readOnly: true,
      fullWidth: true,
    },
    {
      name: "ticketId",
      label: "Publishing Request Ticket Number",
      type: "text",
      placeholder: "WSC20200018-32262",
      hint: "Publishing request ticket number",
      required: true,
    },
    {
      name: "description",
      label: "Request Description",
      type: "text",
      placeholder: "WSC20200018-32262 desc",
      hint: "Sent as both requestContent and requestDesc",
      required: true,
      fullWidth: true,
    },
  ],
  preview: {
    dependencies: ["siteCode", "modelCode"],
    targets: ["requestTitle"],
    resolve: resolveRequestPreview,
  },
  handler: openWorkflow,
});

async function resolveRequestPreview(
  values: Record<string, string | boolean>,
  cookies: RunContext["cookies"],
  signal: AbortSignal
): Promise<Record<string, string>> {
  const site = String(values.siteCode || "").trim();
  const modelCode = String(values.modelCode || "").trim();
  const { modelInfo } = await resolveWorkflowModel(site, modelCode, cookies, signal);
  return {
    requestTitle: `[${site}] ${modelInfo.familyEngName} / Product / Direct Update /`,
  };
}

async function openWorkflow(ctx: RunContext): Promise<ResultRow[]> {
  const { values, cookies, logger, signal } = ctx;
  const modelCode = String(values.modelCode || "").trim();
  const ticketId = String(values.ticketId || "").trim();
  const site = String(values.siteCode || "th").trim();
  const description = String(values.description || "").trim();

  if (!modelCode) throw new Error("Model Code is required");
  if (!ticketId) throw new Error("Publishing Request Ticket Number is required");

  logger.step(`1/5 Searching AEM for model keyword ${modelCode}`);
  const searchResult = await searchModel(site, modelCode, cookies, signal);
  logger.success(`Resolved exact model code ${searchResult.modelCode}`);

  logger.step(`2/5 Resolving model information for ${searchResult.modelCode}`);
  const modelInfo = await fetchModelInfo(searchResult, cookies, signal);
  logger.success(`Resolved model URL for ${modelInfo.modelCode}`);

  logger.step("3/5 Checking for invalid workflows in this product family");
  const validationResponse = await apiRequest({
    url: ENDPOINTS.validate,
    method: "POST",
    body: formUrlEncoded({ siteCode: site, fmyId: modelInfo.familyId }),
    headers: { "x-requested-with": "XMLHttpRequest" },
    cookies,
    signal,
  });
  assertApiSuccess(validationResponse, "Workflow validation");

  const invalidCount = extractNumber(validationResponse.data, [
    "invalidWorkflowCount",
    "invalidCount",
    "count",
    "data",
    "result",
  ]);
  if (invalidCount === undefined) {
    throw new Error("Workflow validation returned an unrecognized response");
  }
  if (invalidCount > 0) {
    throw new Error(
      `Cannot start: ${invalidCount} invalid workflow(s) exist for this product family`
    );
  }
  logger.success("No invalid family workflow found");

  logger.step("4/5 Reserving a new workflow request ID");
  const requestIdResponse = await apiRequest({
    url: ENDPOINTS.requestId,
    method: "POST",
    body: formUrlEncoded({ siteCode: site }),
    headers: { "x-requested-with": "XMLHttpRequest" },
    cookies,
    signal,
  });
  assertApiSuccess(requestIdResponse, "Request ID allocation");

  const requestId = extractNumber(requestIdResponse.data, [
    "requestId",
    "newRequestId",
    "reqId",
    "data",
    "result",
  ]);
  if (requestId === undefined || requestId <= 0) {
    throw new Error("Request ID allocation returned an unrecognized response");
  }
  const requestIdText = String(requestId);
  logger.success(`Reserved request ID ${requestIdText}`);

  const today = new Date().toISOString().slice(0, 10);
  const requestTitle = `[${site}] ${modelInfo.familyEngName} / Product / Direct Update /`;
  const fields: Record<string, string> = {
    redirectUrl: "",
    today,
    displayFlag: "Y",
    eppDisplayFlag: "N",
    displayNoType: "P",
    inputRedirectUrl: "",
    requestContent: description,
    publishingRequestTicketNum: ticketId,
    siteCode: site,
    fmyId: modelInfo.familyId,
    requestId: requestIdText,
    requestDate: today,
    workType: "DU",
    requestClassCode: "R-FMY-P",
    processType: "DM",
    requestTitle,
    requestDesc: description,
    pageUrl: modelInfo.modelUrl,
    dueDate: today,
    priority: "",
    iaCode: searchResult.iaCode,
    embargoFlag: "undefined",
    embargoDt: "undefined",
  };

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);

  logger.step(`5/5 Starting direct workflow for ticket ${ticketId} (site ${site})`);
  logger.info(`Request title: ${requestTitle}`);
  const startResponse = await apiRequest({
    url: ENDPOINTS.start,
    method: "POST",
    body: form,
    headers: { "x-requested-with": "XMLHttpRequest" },
    cookies,
    signal,
  });
  assertApiSuccess(startResponse, "Workflow start");

  const responseText =
    typeof startResponse.data === "string"
      ? startResponse.data
      : startResponse.data
        ? JSON.stringify(startResponse.data)
        : "";
  logger.success(`Workflow started — HTTP ${startResponse.status}`);

  return [{
    ticketId,
    modelCode: modelInfo.modelCode,
    modelUrl: modelInfo.modelUrl,
    familyEngName: modelInfo.familyEngName,
    requestId: requestIdText,
    siteCode: site,
    requestTitle,
    description,
    httpStatus: startResponse.status,
    response: responseText.slice(0, 1000),
    submittedAt: new Date().toISOString(),
}];
}

interface ModelInfoResponse {
  statusCode?: number;
  statusMessage?: string;
  data?: {
    basicInfo?: Array<{
      siteCode?: string | null;
      familyId?: string | null;
      familyEngName?: string | null;
    }>;
    modelUrlList?: Array<{
      siteCode?: string | null;
      modelCode?: string | null;
      modelUrl?: string | null;
    }>;
  };
}

interface ModelSearchResponse {
  statusCode?: number;
  statusMessage?: string;
  data?: {
    records?: string | number;
    list?: ModelSearchRow[] | null;
  };
}

interface ModelSearchRow {
  siteCode?: string | null;
  modelCode?: string | null;
  modelName?: string | null;
  familyId?: string | null;
  familyName?: string | null;
  iaCode?: string | null;
}

interface ResolvedSearchModel {
  siteCode: string;
  modelCode: string;
  familyId: string;
  familyName: string;
  iaCode: string;
}

async function resolveWorkflowModel(
  siteCode: string,
  modelKeyword: string,
  cookies: RunContext["cookies"],
  signal: AbortSignal
) {
  const searchResult = await searchModel(siteCode, modelKeyword, cookies, signal);
  const modelInfo = await fetchModelInfo(searchResult, cookies, signal);
  return { searchResult, modelInfo };
}

async function searchModel(
  siteCode: string,
  modelKeyword: string,
  cookies: RunContext["cookies"],
  signal: AbortSignal
): Promise<ResolvedSearchModel> {
  const response = await apiRequest<ModelSearchResponse>({
    url: buildModelSearchUrl(siteCode, modelKeyword),
    method: "GET",
    headers: { "x-requested-with": "XMLHttpRequest" },
    cookies,
    signal,
  });
  assertApiSuccess(response, "Model search");

  const rows = response.data?.data?.list?.filter(Boolean) ?? [];
  const normalizedKeyword = modelKeyword.trim().toLowerCase();
  const exact = rows.find(
    (row) => row.modelCode?.trim().toLowerCase() === normalizedKeyword
  );
  const selected = exact ?? (rows.length === 1 ? rows[0] : undefined);

  if (!selected) {
    if (rows.length > 1) {
      const candidates = rows
        .map((row) => row.modelCode)
        .filter(Boolean)
        .slice(0, 5)
        .join(", ");
      throw new Error(
        `Model keyword "${modelKeyword}" is ambiguous. Use an exact code${candidates ? `: ${candidates}` : ""}`
      );
    }
    throw new Error(`No model found for site ${siteCode} and keyword ${modelKeyword}`);
  }

  const resolved = {
    siteCode: selected.siteCode?.trim() || siteCode,
    modelCode: selected.modelCode?.trim() || "",
    familyId: selected.familyId?.trim() || "",
    familyName: selected.familyName?.trim() || "",
    iaCode: selected.iaCode?.trim() || "",
  };
  const missing = Object.entries(resolved)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new Error(`Model search result is missing: ${missing.join(", ")}`);
  }
  return resolved;
}

async function fetchModelInfo(
  model: ResolvedSearchModel,
  cookies: RunContext["cookies"],
  signal: AbortSignal
) {
  const response = await apiRequest<ModelInfoResponse>({
    url: buildModelInfoUrl(model),
    method: "GET",
    headers: { "x-requested-with": "XMLHttpRequest" },
    cookies,
    signal,
  });
  assertApiSuccess(response, "Model information lookup");
  return resolveModelInfo(response.data, model.siteCode, model.modelCode);
}

function buildModelSearchUrl(siteCode: string, modelKeyword: string): string {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 180);
  const timestamp = String(Date.now());
  const params = new URLSearchParams({
    siteCode,
    iaCode: "00000000",
    CategoryGroup: "",
    CategoryType: "",
    CategorySub: "",
    CategorySSub: "",
    oldNewFlag: "",
    periodType: "1",
    periodStartDate: startDate.toISOString().slice(0, 10),
    periodEndDate: endDate.toISOString().slice(0, 10),
    displayFlag: "",
    modelType: "All",
    modelKeyword,
    iaTypeCd: "IA002",
    _search: "false",
    nd: timestamp,
    rows: "10",
    page: "1",
    sidx: "",
    sord: "asc",
    _: timestamp,
  });
  return `${ENDPOINTS.search}?${params}`;
}

function buildModelInfoUrl(model: ResolvedSearchModel): string {
  const params = new URLSearchParams({
    siteCode: model.siteCode,
    familyName: model.familyName,
    familyId: model.familyId,
    iaCode: model.iaCode,
    packageUseFlag: "N",
    OnlygetPageUrl: "false",
    _: String(Date.now()),
  });
  return `${ENDPOINTS.modelInfo}?${params}`;
}

function resolveModelInfo(
  response: ModelInfoResponse | null,
  siteCode: string,
  modelCode: string
): { familyId: string; familyEngName: string; modelCode: string; modelUrl: string } {
  const data = response?.data;
  if (!data) throw new Error("Model information response does not contain data");

  const same = (left: string | null | undefined, right: string) =>
    left?.trim().toLowerCase() === right.trim().toLowerCase();
  const model = data.modelUrlList?.find(
    (item) => same(item.siteCode, siteCode) && same(item.modelCode, modelCode)
  );
  if (!model?.modelUrl || !model.modelCode) {
    throw new Error(`No model URL found for site ${siteCode} and model ${modelCode}`);
  }

  const basicInfo = data.basicInfo?.find(
    (item) => same(item.siteCode, siteCode) && Boolean(item.familyEngName)
  );
  if (!basicInfo?.familyEngName || !basicInfo.familyId) {
    throw new Error(`Family information was not found for site ${siteCode}`);
  }

  return {
    familyId: basicInfo.familyId,
    familyEngName: basicInfo.familyEngName,
    modelCode: model.modelCode,
    modelUrl: model.modelUrl,
  };
}

function formUrlEncoded(values: Record<string, string>): URLSearchParams {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) body.set(key, value);
  return body;
}

function assertApiSuccess(response: ApiResult, step: string): void {
  if (response.status === 0 && response.error === "Aborted") {
    throw new DOMException("Aborted", "AbortError");
  }
  const applicationStatus =
    response.data && typeof response.data === "object"
      ? asNumber((response.data as Record<string, unknown>).statusCode)
      : undefined;
  if (!response.ok) {
    throw new Error(response.error || `${step} failed (HTTP ${response.status})`);
  }
  if (applicationStatus !== undefined && applicationStatus >= 400) {
    throw new Error(extractMessage(response.data) || `${step} failed (status ${applicationStatus})`);
  }
}

/** Extract a numeric scalar from either a bare value or a typical AEM wrapper. */
function extractNumber(data: unknown, preferredKeys: string[]): number | undefined {
  const scalar = asNumber(data);
  if (scalar !== undefined) return scalar;
  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;
  for (const key of preferredKeys) {
    if (!(key in record)) continue;
    const direct = asNumber(record[key]);
    if (direct !== undefined) return direct;
    const nested = extractNumber(record[key], preferredKeys);
    if (nested !== undefined) return nested;
  }
  for (const [key, value] of Object.entries(record)) {
    if (/^(status|statusCode|httpStatus|code)$/i.test(key)) continue;
    const nested = extractNumber(value, preferredKeys);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\s*\d+\s*$/.test(value)) {
    return Number(value.trim());
  }
  return undefined;
}
