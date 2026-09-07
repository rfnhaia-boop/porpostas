import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso — Fechô',
  description: 'Condições de uso da plataforma Fechô.',
};

const ATUALIZADO = '7 de setembro de 2026';

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-5 py-16 transition-colors">
      <article className="mx-auto w-full max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6A00] mb-2">Fechô</p>
        <h1 className="text-3xl font-black tracking-tight mb-2">Termos de Uso</h1>
        <p className="text-xs text-[var(--text-muted)] mb-10">Última atualização: {ATUALIZADO}</p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold mb-2">1. O serviço</h2>
            <p className="text-[var(--text-muted)]">
              O <strong>Fechô</strong> é uma plataforma da NEX para criar propostas comerciais,
              acompanhar a execução de projetos e organizar cobranças. Ao criar uma conta, você
              concorda com estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. Sua conta</h2>
            <p className="text-[var(--text-muted)]">
              Você é responsável por manter suas credenciais em segurança e por toda atividade
              realizada na sua conta. Avise-nos imediatamente em caso de uso não autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. Seu conteúdo</h2>
            <p className="text-[var(--text-muted)]">
              Os dados que você cadastra (clientes, propostas, valores, arquivos) são seus. Você
              declara ter autorização para tratá-los e é responsável pela veracidade e pelo uso
              conforme a legislação aplicável. Não use a plataforma para conteúdo ilícito, fraude
              ou spam.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. Disponibilidade</h2>
            <p className="text-[var(--text-muted)]">
              Trabalhamos para manter o serviço no ar, mas ele é fornecido “como está”, sem garantia
              de disponibilidade ininterrupta. Podemos fazer manutenções e evoluções a qualquer
              momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. Encerramento</h2>
            <p className="text-[var(--text-muted)]">
              Você pode encerrar sua conta quando quiser. Podemos suspender ou encerrar contas que
              violem estes termos ou que representem risco à plataforma e a outros usuários.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. Limitação de responsabilidade</h2>
            <p className="text-[var(--text-muted)]">
              Na máxima extensão permitida em lei, a NEX não se responsabiliza por lucros cessantes
              ou danos indiretos decorrentes do uso ou da indisponibilidade do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. Contato</h2>
            <p className="text-[var(--text-muted)]">
              Dúvidas sobre estes termos:{' '}
              <a className="text-[#FF6A00]" href="mailto:new.flow.sys@gmail.com">new.flow.sys@gmail.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--text-muted)]">
          <Link href="/privacidade" className="text-[#FF6A00] hover:underline">Política de Privacidade</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:underline">Voltar ao login</Link>
        </div>
      </article>
    </main>
  );
}
