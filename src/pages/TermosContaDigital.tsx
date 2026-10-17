import LegalLayout from "@/components/LegalLayout";

const TermosContaDigital = () => (
  <LegalLayout title="Área Financeira — disponibilidade e condições">
    <p className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-foreground">
      <strong>Status:</strong> a Queenify ainda não confirmou uma conta de pagamento ou serviço de saque em produção. Os dados exibidos no painel não comprovam disponibilidade de fundos.
    </p>

    <h2>1. Dados financeiros</h2>
    <p>
      A área Financeira pode exibir registros associados à conta. A origem, a conciliação e a liberação dos valores dependem de uma integração de pagamento validada. Confirme qualquer divergência com o suporte antes de tomar decisões financeiras.
    </p>

    <h2>2. Saques</h2>
    <p>
      A solicitação e a transferência de saques estão indisponíveis nesta prévia. Valor mínimo, documentos exigidos, chave de destino, tarifas e prazo de processamento ainda não foram confirmados.
    </p>

    <h2>3. Relatórios e tributos</h2>
    <p>
      Relatórios gerados pela plataforma são informativos e não substituem extratos do provedor, documentos fiscais ou orientação contábil. Os procedimentos de conciliação e informes financeiros precisam ser validados antes do lançamento.
    </p>

    <h2>4. Termos definitivos</h2>
    <p>
      As condições de movimentação financeira serão publicadas depois da seleção do provedor, dos testes de pagamento e saque e da revisão jurídica. Não envie senhas, códigos de autenticação ou chaves privadas ao suporte.
    </p>

    <p className="text-xs text-muted-foreground mt-8">Página provisória para a prévia da plataforma. Integração financeira e revisão jurídica pendentes.</p>
  </LegalLayout>
);

export default TermosContaDigital;
