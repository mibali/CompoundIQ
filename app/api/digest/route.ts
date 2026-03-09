import { NextResponse } from "next/server";
import { callLLM, type AIProvider } from "@/lib/llm";

const SYSTEM_PROMPT = `You are a friendly, expert personal finance advisor writing a weekly portfolio digest for a beginner retail investor.
Your tone is warm, clear, and encouraging — like a knowledgeable friend, not a financial robot.
Never use jargon without explaining it. Never give advice to buy or sell specific stocks.
Write in natural flowing paragraphs. No bullet points, no headers, no markdown.
Maximum 280 words. Always end with a brief encouraging sentence about long-term investing.`;

interface DigestRequest {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  monthlyContribution: number;
  currency: string;
  topHoldings: { ticker: string; companyName: string | null; weight: number; pnlPercent: number }[];
  sectorAllocation: { sector: string; weight: number }[];
  beta: number;
  sharpeRatio: number | null;
  dividendYield: number;
}

export async function POST(request: Request) {
  const aiKey = request.headers.get("X-AI-Key");
  const aiProvider = (request.headers.get("X-AI-Provider") ?? "anthropic") as AIProvider;

  if (!aiKey) {
    return NextResponse.json({ error: "No AI API key provided" }, { status: 401 });
  }

  let body: DigestRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sym = body.currency === "GBP" ? "£" : "$";
  const fmt = (n: number) =>
    `${sym}${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

  const pnlSign = body.totalPnL >= 0 ? "+" : "-";
  const topHoldingsText = body.topHoldings.length === 0
    ? "No individual holdings data available"
    : body.topHoldings
        .slice(0, 5)
        .map((h) => `${h.companyName ?? h.ticker} (${h.weight.toFixed(1)}% of portfolio, ${h.pnlPercent >= 0 ? "+" : ""}${h.pnlPercent.toFixed(1)}% return)`)
        .join(", ");

  const sectorText = body.sectorAllocation
    .slice(0, 4)
    .map((s) => `${s.sector} ${s.weight.toFixed(1)}%`)
    .join(", ");

  const userPrompt = `Write a weekly portfolio digest for this investor.

Portfolio snapshot:
- Current value: ${fmt(body.totalValue)}
- Total invested: ${fmt(body.totalInvested)}
- Unrealised P&L: ${pnlSign}${fmt(Math.abs(body.totalPnL))} (${body.totalPnLPercent >= 0 ? "+" : ""}${body.totalPnLPercent.toFixed(1)}%)
- Monthly contribution: ${fmt(body.monthlyContribution)}/mo
- Portfolio beta: ${body.beta} (vs market = 1.0)
${body.sharpeRatio !== null ? `- Sharpe ratio: ${body.sharpeRatio}` : ""}
${body.dividendYield > 0 ? `- Dividend yield: ${body.dividendYield.toFixed(2)}% annually` : ""}

Top holdings: ${topHoldingsText}
Sector breakdown: ${sectorText}

Write the digest now. Remember: no bullet points, no headers, 280 words max, encourage long-term thinking.`;

  try {
    const result = await callLLM(aiProvider, aiKey, SYSTEM_PROMPT, userPrompt);
    return NextResponse.json({ digest: result.content, provider: result.provider, model: result.model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM call failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
