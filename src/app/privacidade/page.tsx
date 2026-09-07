import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Fechô',
  description: 'Como a plataforma Fechô coleta, usa e protege os dados.',
};

const ATUALIZADO = '7 de setembro de 2026';

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-5 py-16 transition-colors">
      <article className="mx-auto w-full max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6A00] mb-2">Fechô</p>
        <h1 className="text-3xl font-black tracking-tight mb-2">Política de Privacidade</h1>
        <p className="text-xs text-[var(--text-muted)] mb-10">Última atualização: {ATUALIZADO}</p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold mb-2">1. Quem somos</h2>
            <p className="text-[var(--text-muted)]">
              O <strong>Fechô</strong> é uma plataforma da NEX para agências e prestadores de serviço
              montarem propostas, acompanharem a execução dos projetos e receberem pagamentos.
              Contato: <a className="text-[#FF6A00]" href="mailto:new.flow.sys@gmail.com">new.flow.sys@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. Dados que coletamos</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--text-muted)]">
              <li>
                <strong>Conta:</strong> nome, e-mail e foto de perfil — informados no cadastro por
                e-mail/senha ou obtidos do seu login Google (escopos de e-mail e perfil básico).
              </li>
              <li>
                <strong>Dados da operação:</strong> informações que você cadastra na plataforma —
                empresa, clientes, propostas, serviços, valores, comprovantes de pagamento e mensagens.
              </li>
              <li>
                <strong>Uso:</strong> registros técnicos de acesso (data, endereço IP, ações) para
                segurança e funcionamento do serviço.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. Como usamos</h2>
            <p className="text-[var(--text-muted)]">
              Para autenticar seu acesso, operar as funções da plataforma (gerar propostas, controlar
              execução e cobranças), enviar e-mails transacionais relacionados aos seus projetos e
              manter a segurança da conta. Não usamos seus dados para publicidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. Cookies</h2>
            <p className="text-[var(--text-muted)]">
              Usamos um cookie de sessão estritamente necessário para manter você autenticado.
              Sem ele, o login não funciona. Não usamos cookies de rastreamento de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. Compartilhamento</h2>
            <p className="text-[var(--text-muted)]">
              Não vendemos nem alugamos seus dados. Compartilhamos apenas com prestadores necessários
              para operar o serviço: hospedagem em servidor próprio, <strong>Google</strong> (login),
              e <strong>Resend</strong> (envio de e-mails). Cada um trata os dados apenas para a
              finalidade contratada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. Retenção e exclusão</h2>
            <p className="text-[var(--text-muted)]">
              Mantemos seus dados enquanto sua conta estiver ativa. Você pode solicitar a exclusão da
              conta e dos dados associados a qualquer momento pelo e-mail de contato; atendemos em até
              30 dias, salvo obrigação legal de retenção.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. Seus direitos (LGPD)</h2>
            <p className="text-[var(--text-muted)]">
              Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, além de
              revogar consentimentos. Basta escrever para{' '}
              <a className="text-[#FF6A00]" href="mailto:new.flow.sys@gmail.com">new.flow.sys@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">8. Segurança</h2>
            <p className="text-[var(--text-muted)]">
              Todo o tráfego é criptografado (HTTPS). Senhas são armazenadas com hash. O acesso aos
              dados é restrito ao necessário para operar a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">9. Alterações</h2>
            <p className="text-[var(--text-muted)]">
              Podemos atualizar esta política. Mudanças relevantes serão comunicadas na plataforma ou
              por e-mail, e a data de “última atualização” no topo é sempre revisada.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--text-muted)]">
          <Link href="/termos" className="text-[#FF6A00] hover:underline">Termos de Uso</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:underline">Voltar ao login</Link>
        </div>
      </article>
    </main>
  );
}
