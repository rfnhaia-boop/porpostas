import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginClientByEmail } from "@/lib/clientAuth";
import bcrypt from "bcryptjs"; // Assuming bcrypt is installed or we can use another hash
import { extractToken } from "@/lib/slug";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token: rawToken } = await params;
    const token = extractToken(rawToken);
    
    const body = await req.json();
    const { email, phone, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // 1. Find the proposal
    console.log("[DEBUG] rawToken:", rawToken);
    console.log("[DEBUG] extracted token:", token);
    const proposal = await prisma.proposal.findUnique({
      where: { publicToken: token },
      include: { client: true }
    });
    console.log("[DEBUG] proposal found:", proposal?.id, "clientId:", proposal?.clientId);

    if (!proposal || !proposal.clientId) {
      return NextResponse.json({ error: "Proposta inválida ou sem cliente vinculado." }, { status: 404 });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const normalizedEmail = String(email).trim().toLowerCase();

    // 3. Update Client
    await prisma.client.update({
      where: { id: proposal.clientId },
      data: { email: normalizedEmail, phone, passwordHash },
    });

    // 4. Log in the client (identidade = e-mail)
    await loginClientByEmail(normalizedEmail);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao configurar conta." }, { status: 500 });
  }
}
