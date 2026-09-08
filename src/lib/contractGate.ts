// Trava de início por contrato: quando a proposta exige contrato assinado, o
// aceite do cliente NÃO inicia a execução. Ela só começa (in_progress + startedAt)
// quando o dono anexa o contrato. Enquanto isso, fica "aprovada, aguardando contrato".

type GateShape = {
  requiresSignedContract?: boolean | null;
  status?: string | null;
  contractFileName?: string | null;
  startedAt?: string | Date | null;
};

/** A proposta foi aceita mas está travada esperando o contrato assinado ser anexado. */
export function awaitingContract(p: GateShape): boolean {
  return (
    !!p.requiresSignedContract &&
    p.status === 'approved' &&
    !p.contractFileName &&
    !p.startedAt
  );
}
