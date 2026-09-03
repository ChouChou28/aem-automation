import { Gift } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { createModule } from "@/modules/base";
import type { ResultRow, RunContext } from "@/modules/types";

const ENDPOINT =
  "https://p6-ap-author.samsung.com/pim/core/workflow/v6/startaemdirectworkflow";

/**
 * Product/page-specific values captured from the sample cURL. These identify
 * the AEM product family the workflow runs against. They are constant for now;
 * parameterize them when a real product lookup is wired in.
 */
const PRODUCT_DEFAULTS = {
  familyName: "top-mount-freezer-RT22FGRADB1",
  fmyId: "388392",
  requestId: "2254422",
  iaCode: "08030500",
  pageUrl:
    "/th/refrigerators/top-mount-freezer/top-mount-freezer-rt22fgradb1-234l-black-rt22fgradb1-st/",
};

/** Promotions and Others — starts an AEM direct-update workflow for a ticket. */
export const promotionsModule = createModule({
  id: "promotions",
  label: "Promotions and Others",
  icon: Gift,
  description: "Start AEM direct-update workflows for promotion tickets",
  targetUrl: ENDPOINT,
  exportName: "promotions-workflow",
  flows: [{ id: "open-workflow", label: "Open Workflow" }],
  fields: [
    {
      name: "ticketId",
      label: "Ticket ID",
      type: "text",
      placeholder: "WSC20200018-32262",
      hint: "Publishing request ticket number",
      required: true,
    },
    {
      name: "siteCode",
      label: "Site Code",
      type: "text",
      defaultValue: "th",
      placeholder: "th",
      required: true,
      validate: (v) =>
        /^[a-z]{2}$/i.test(v.trim())
          ? undefined
          : "Site code must be a 2-letter code (e.g. th)",
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      placeholder: "WSC20200018-32262 desc",
      hint: "Sent as both requestContent and requestDesc",
      required: true,
    },
  ],
  handler: openWorkflow,
});

async function openWorkflow(ctx: RunContext): Promise<ResultRow[]> {
  const { values, cookies, logger, signal } = ctx;
  const ticketId = String(values.ticketId || "").trim();
  const site = String(values.siteCode || "th").trim();
  const description = String(values.description || "").trim();

  if (!ticketId) throw new Error("Ticket ID is required");

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const requestTitle = `[${site}] ${PRODUCT_DEFAULTS.familyName} / Product / Direct Update / ${ticketId}`;

  // Multipart body — field order/values mirror the captured request.
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
    fmyId: PRODUCT_DEFAULTS.fmyId,
    requestId: PRODUCT_DEFAULTS.requestId,
    requestDate: today,
    workType: "DU",
    requestClassCode: "R-FMY-P",
    processType: "DM",
    requestTitle,
    requestDesc: description,
    pageUrl: PRODUCT_DEFAULTS.pageUrl,
    dueDate: today,
    priority: "",
    iaCode: PRODUCT_DEFAULTS.iaCode,
    embargoFlag: "undefined",
    embargoDt: "undefined",
  };

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);

  logger.step(`Starting direct workflow for ticket ${ticketId} (site ${site})`);
  logger.info(`Request title: ${requestTitle}`);

  const res = await apiRequest({
    url: ENDPOINT,
    method: "POST",
    body: form,
    headers: { "x-requested-with": "XMLHttpRequest" },
    cookies,
    signal,
  });

  const responseText =
    typeof res.data === "string"
      ? res.data
      : res.data
        ? JSON.stringify(res.data)
        : "";

  if (!res.ok) {
    // res.error carries the server statusMessage (auth fail or e.g. JIRA
    // "Payload is in running workflow"). Auth failures also raise the popup.
    const message = res.error || `Workflow request failed (HTTP ${res.status})`;
    logger.error(message, res.authFailed ? "Re-syncing cookies…" : undefined);
    throw new Error(message);
  }

  logger.success(`Workflow started — HTTP ${res.status}`);

  return [
    {
      ticketId,
      siteCode: site,
      requestTitle,
      description,
      httpStatus: res.status,
      response: responseText.slice(0, 1000),
      submittedAt: new Date().toISOString(),
    },
  ];
}
