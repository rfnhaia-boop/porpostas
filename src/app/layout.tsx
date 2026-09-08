import type { Metadata } from 'next';
import { Inter, Fraunces, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Tipografia das propostas: serif de display com caráter editorial + grotesca refinada.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-grotesque', display: 'swap' });

export const metadata: Metadata = {
  title: 'Fechô',
  description: 'Propostas Arquiteturais de Alta Performance',
  icons: { icon: '/havi-icon-48.png', apple: '/havi-icon-512.png' },
};

// Aplica o tema (classe .dark no <html>) antes do React hidratar — sem flash, sem mismatch.
const themeScript = `(function(){try{var t=localStorage.getItem('nex-theme')||'dark';document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} ${bricolage.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
