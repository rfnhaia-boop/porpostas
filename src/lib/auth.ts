import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from './prisma';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  user: {
    // Cada usuário pertence a uma Company. Não é aceito do cliente — resolvido no hook abaixo.
    additionalFields: {
      companyId: { type: 'string', required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // 1º signup adota a Company órfã (sem usuários) que já existe; os demais criam empresa nova.
          const orphan = await prisma.company.findFirst({
            where: { users: { none: {} } },
            orderBy: { createdAt: 'asc' },
          });
          const company =
            orphan ??
            (await prisma.company.create({
              data: { name: user.name || 'Minha Empresa', email: user.email },
            }));
          return { data: { ...user, companyId: company.id } };
        },
      },
    },
  },

  plugins: [nextCookies()], // precisa ser o último
});
