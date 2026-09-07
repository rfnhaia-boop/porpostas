import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginClientByEmail } from "@/lib/clientAuth";
import bcrypt from "bcryptjs";

// Login por e-mail + senha. A pessoa pode ter vários cadastros de cliente com
// o mesmo e-mail (empresas diferentes do dono) — basta a senha bater com um.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Preencha e-mail e senha." }, { status: 400 });
    }
    const normalized = String(email).trim().toLowerCase();

    const clients = await prisma.client.findMany({
      where: { email: { equals: normalized, mode: "insensitive" }, passwordHash: { not: null } },
      select: { passwordHash: true },
    });
    if (clients.length === 0) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    let ok = false;
    for (const c of clients) {
      if (c.passwordHash && (await bcrypt.compare(password, c.passwordHash))) {
        ok = true;
        break;
      }
    }
    if (!ok) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    await loginClientByEmail(normalized);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao fazer login." }, { status: 500 });
  }
}
