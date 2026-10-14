import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ status: "ok", services: getHealthStatus() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
