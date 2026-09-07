import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { WHATSAPP_TEMPLATES } from '@/lib/whatsappTemplates';

export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const overrides = await prisma.whatsappTemplate.findMany({ where: { companyId } });
  const byKey = new Map(overrides.map((o) => [o.key, o]));

  const list = Object.values(WHATSAPP_TEMPLATES).map((def) => {
    const o = byKey.get(def.key);
    return {
      key: def.key,
      label: def.label,
      vars: def.vars,
      enabled: o ? o.enabled : true,
      body: o?.body?.trim() ? o.body : def.body,
      custom: !!o,
      default: { body: def.body },
    };
  });
  return Response.json(list);
}
