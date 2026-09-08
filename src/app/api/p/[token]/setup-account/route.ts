import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginClientByEmail } from "@/lib/clientAuth";
import { checkPortalClaim } from "@/lib/portalClaim";
import bcrypt from "bcryptjs";
import { extractToken } from "@/lib/slug";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token: rawToken } = await params;
    const token = extractToken(rawToken);

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 40) : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email.trim() || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha precisa de pelo menos 8 caracteres." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Trava anti-sequestro: proposta aceita, palavra-chave conferida (se houver),
    // e acesso ainda não configurado pra outra identidade.
    const gate = await checkPortalClaim(token, normalizedEmail);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.client.update({
      where: { id: gate.client.id },
      data: {
        email: normalizedEmail,
        phone,
        passwordHash,
        portalClaimedAt: gate.client.portalClaimedAt ?? new Date(),
      },
    });

    await loginClientByEmail(normalizedEmail);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[setup-account]", err);
    return NextResponse.json({ error: "Erro ao configurar conta." }, { status: 500 });
  }
}
