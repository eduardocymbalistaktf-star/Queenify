import LegalLayout from "@/components/LegalLayout";

const TermosQueeniPay = () => (
  <LegalLayout title="QueeniPay — disponibilidade e condições">
    <p className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-foreground">
      <strong>Status:</strong> a operação do QueeniPay ainda não foi confirmada para uso comercial. Esta página não estabelece taxas, prazos ou uma oferta de processamento de pagamentos.
    </p>

    <h2>1. Disponibilidade</h2>
    <p>
      A exibição de opções de pagamento na Queenify não confirma que uma cobrança esteja habilitada. Antes de aceitar pedidos reais, a Queenify precisa validar o provedor responsável, o fluxo de aprovação, notificações, reembolsos, disputas e conciliação.
    </p>

    <h2>2. Taxas e meios de pagamento</h2>
    <p>
      As taxas, os meios de pagamento, o parcelamento, eventuais reservas e os custos de antecipação estão em validação. As condições definitivas devem ser apresentadas ao usuário antes da ativação e da primeira transação.
    </p>

    <h2>3. Reembolsos e repasses</h2>
    <p>
      O processamento de reembolsos, chargebacks e repasses depende da integração com o provedor de pagamento e ainda requer testes ponta a ponta. Não há prazo de liberação ou de saque confirmado nesta prévia.
    </p>

    <h2>4. Termos definitivos</h2>
    <p>
      Os termos comerciais e operacionais do serviço precisam ser atualizados e revisados antes do lançamento. Consulte as condições exibidas na plataforma e fale com suporte@queenify.com.br em caso de dúvida. Não informe dados completos de cartão ou credenciais pelo suporte.
    </p>

    <p className="text-xs text-muted-foreground mt-8">Página provisória para a prévia da plataforma. Revisão jurídica e validação do provedor pendentes.</p>
  </LegalLayout>
);

export default TermosQueeniPay;
