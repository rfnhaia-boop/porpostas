import { prisma } from '@/lib/prisma';
import { getCurrentCompanyId } from '@/lib/company';
import { EMAIL_TEMPLATES } from '@/lib/emailTemplates';

// Lista todos os e-mails automáticos: padrão do código + o que a empresa editou.
export async function GET() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) return Response.json({ error: 'Não autenticado.' }, { status: 401 });

  const overrides = await prisma.emailTemplate.findMany({ where: { companyId } });
  const byKey = new Map(overrides.map((o) => [o.key, o]));

  const list = Object.values(EMAIL_TEMPLATES).map((def) => {
    const o = byKey.get(def.key);
    return {
      key: def.key,
      label: def.label,
      audience: def.audience,
      vars: def.vars,
      enabled: o ? o.enabled : true,
      subject: o?.subject?.trim() ? o.subject : def.subject,
      title: o?.title?.trim() ? o.title : def.title,
      body: o?.body?.trim() ? o.body : def.body,
      custom: !!o,
      default: { subject: def.subject, title: def.title, body: def.body },
    };
  });

  return Response.json(list);
}
