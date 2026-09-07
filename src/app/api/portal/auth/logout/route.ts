import { NextResponse } from "next/server";
import { logoutClient } from "@/lib/clientAuth";

export async function POST() {
  await logoutClient();
  return NextResponse.json({ success: true });
}
