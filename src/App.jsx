import React, { useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  Database,
  Settings2,
  ShieldCheck,
  Search,
  Download,
  KeyRound,
  ChevronRight,
  Sparkles,
  X,
  Bot,
  User,
} from "lucide-react";

// ------------------------- Sample Metadata Lake ------------------------- //
const DATASETS = [
  {
    id: "sales_orders_v1",
    name: "sales_orders",
    domain: "sales",
    description:
      "Orders placed on the web store. Includes order amounts, payment status, and customer references.",
    owner: "data.sales@company.com",
    tags: ["gold", "pci-scope"],
    datasource: "postgres://warehouse/sales",
    updatedAt: "2025-08-15",
    columns: [
      { name: "order_id", type: "uuid", description: "Primary key." },
      { name: "customer_id", type: "uuid" },
      {
        name: "email",
        type: "text",
        tags: ["pii", "contact"],
        description: "Customer email.",
      },
      { name: "amount", type: "numeric", description: "Order amount in INR." },
      { name: "payment_status", type: "text", tags: ["pci"] },
      { name: "created_at", type: "timestamptz" },
    ],
    lineage: {
      upstream: ["raw_events"],
      downstream: ["sales_kpi_daily", "marketing_attribution"],
    },
  },
  {
    id: "customers_v2",
    name: "customers",
    domain: "sales",
    description: "Customer master. One row per user.",
    owner: "data.crm@company.com",
    tags: ["silver", "pii"],
    datasource: "s3://datalake/curated/customers/",
    updatedAt: "2025-08-04",
    columns: [
      { name: "customer_id", type: "uuid" },
      {
        name: "full_name",
        type: "text",
        tags: ["pii"],
        description: "User full name.",
      },
      { name: "email", type: "text", tags: ["pii", "contact"] },
      { name: "phone", type: "text", tags: ["pii", "contact"] },
      { name: "signup_dt", type: "date" },
      { name: "segment", type: "text", tags: ["ml-feature"] },
    ],
    lineage: {
      upstream: ["crm_export"],
      downstream: ["sales_orders", "marketing_attribution"],
    },
  },
];

// ----------------------------- Utilities ------------------------------ //
function includesAny(hay, needles) {
  const l = String(hay || "").toLowerCase();
  return needles.some((n) => l.includes(String(n).toLowerCase()));
}

function searchDatasets(rawQuery) {
  const q = String(rawQuery || "").trim().toLowerCase();
  if (!q) return { results: DATASETS, reason: "Empty query → showing all datasets" };

  let filtered = DATASETS.filter(
    (d) =>
      includesAny(d.name, [q]) ||
      includesAny(d.description, [q]) ||
      includesAny(d.owner, [q])
  );

  return { results: filtered, reason: "keyword search" };
}

function Badge({ children }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">
      {children}
    </span>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b pb-1 text-gray-700 dark:text-gray-200">
      <Icon className="h-4 w-4 text-indigo-500" />
      <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
    </div>
  );
}

// ----------------------------- Main App ------------------------------ //
export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! Ask me about datasets, columns, owners, PII, or lineage. Example: ‘show datasets with PII in sales’",
    },
  ]);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(null);
  const inputRef = useRef(null);

  const handleAsk = (q) => {
    const userQ = String(q ?? query).trim();
    if (!userQ) return;
    setMessages((m) => [...m, { role: "user", content: userQ }]);
    setQuery("");

    const { results, reason } = searchDatasets(userQ);
    let assistantText = `🔎 Search reason: ${reason}\n\n`;

    assistantText += results.length
      ? results.map((d) => `• ${d.name} — owner: ${d.owner}`).join("\n")
      : "No datasets matched.";

    setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/70 to-white p-4 text-gray-900 dark:from-gray-950 dark:to-black dark:text-gray-100">
      {/* Top Bar */}
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border bg-white/80 px-4 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Metadata Assistant</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {DATASETS.length} datasets indexed
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto mt-4 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
        {/* Explorer */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border bg-white/80 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <SectionTitle icon={Search} title="Explorer" />
            <div className="mb-3 flex items-center gap-2 rounded-xl border bg-white px-2 py-1 shadow-inner dark:border-gray-800 dark:bg-gray-950">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                placeholder="Search datasets…"
                className="w-full bg-transparent text-sm outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleAsk(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3">
              {DATASETS.map((d) => (
                <div
                  key={d.id}
                  onClick={() => setFocus(d)}
                  className="cursor-pointer rounded-xl border bg-white/90 p-3 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-500" />
                    <h4 className="font-medium">{d.name}</h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {d.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="md:col-span-2 flex flex-col rounded-2xl border bg-white/80 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  m.role === "assistant" ? "" : "justify-end"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="mt-1 rounded-full bg-indigo-600 p-1 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-xl border px-3 py-2 text-sm shadow-sm ${
                    m.role === "assistant"
                      ? "bg-white dark:border-gray-800 dark:bg-gray-950"
                      : "bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/30"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="mt-1 rounded-full bg-gray-700 p-1 text-white">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border-t p-3 dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1 shadow-inner dark:border-gray-800 dark:bg-gray-950">
              <MessageCircle className="h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Ask something…"
                className="w-full bg-transparent text-sm outline-none"
              />
              <button
                onClick={() => handleAsk()}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side sheet */}
      {focus && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm">
          <div className="m-4 w-[480px] rounded-2xl border bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-500" />
                <h3 className="font-semibold">{focus.name} • 360</h3>
              </div>
              <button
                onClick={() => setFocus(null)}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {focus.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge>Owner: {focus.owner}</Badge>
              <Badge>Domain: {focus.domain}</Badge>
              <Badge>Updated: {focus.updatedAt}</Badge>
            </div>
            <SectionTitle icon={Settings2} title="Columns" />
            <div className="flex flex-wrap gap-1 text-xs">
              {focus.columns.map((c) => (
                <span
                  key={c.name}
                  className="rounded-md bg-gray-100 px-2 py-0.5 dark:bg-gray-800"
                >
                  {c.name}: <span className="opacity-70">{c.type}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
