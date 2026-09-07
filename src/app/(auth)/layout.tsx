export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12 transition-colors">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--foreground)]">
            NE<span className="text-[#FF6A00]">X</span>
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Fechô
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
