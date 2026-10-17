import LegalLayout from "@/components/LegalLayout";

const TermosQueeniPay = () => (
  <LegalLayout title="Termos de Uso — QueeniPay">
    <p>O QueeniPay é o sistema de processamento e intermediação de pagamentos integrado à Plataforma Queenify. Estes termos são complementares aos Termos de Uso gerais e regulam especificamente os serviços de pagamento oferecidos pela Queenify.</p>

    <h2>1. Natureza do Serviço</h2>
    <p>O QueeniPay <strong>não é uma instituição financeira, banco, fintech regulamentada ou instituição de pagamento autorizada pelo Banco Central do Brasil</strong>. Trata-se de um sistema de intermediação de pagamentos que conecta Compradores a processadores de pagamento parceiros homologados, viabilizando transações seguras na Plataforma. O QueeniPay pode, conforme o amadurecimento regulatório, buscar as autorizações necessárias junto ao Banco Central do Brasil.</p>

    <h2>2. Serviços de Pagamento</h2>
    <p>O QueeniPay oferece:</p>
    <ul>
      <li>Processamento de pagamentos via PIX, cartão de crédito (bandeiras Visa, Mastercard, Elo, Amex) e boleto bancário</li>
      <li>Parcelamento em até 12x no cartão de crédito</li>
      <li>Split de pagamento automático para co-produtores e afiliados, com divisão proporcional configurável</li>
      <li>Sistema de escrow (custódia) durante o período de garantia do produto</li>
      <li>Transferências para chave PIX do Produtor</li>
      <li>Antecipação de recebíveis de cartão de crédito</li>
      <li>Recuperação automatizada de pagamentos negados (SmartPay™)</li>
      <li>Recuperação de carrinhos abandonados com sequência automatizada</li>
      <li>Checkout personalizado com integração nativa de provas sociais e garantias</li>
    </ul>

    <h2>3. Taxas</h2>
    <h3>3.1 Taxa Padrão</h3>
    <p>As taxas por Transação aprovada são: <strong>PIX: 6,99% + R$ 1,49</strong>; <strong>Cartão de Crédito: 7,99% + R$ 1,49</strong>; <strong>Boleto Bancário: 7,99% + R$ 1,49</strong>. A taxa incide sobre o Valor Bruto da venda (incluindo parcelamentos) e é descontada automaticamente antes da liberação ao Produtor.</p>
    <h3>3.2 Taxas Adicionais</h3>
    <ul>
      <li><strong>Antecipação de recebíveis:</strong> 3,49% adicional sobre o valor antecipado, permitindo receber em 2 dias úteis independente do parcelamento</li>
      <li><strong>Saque expresso (quando disponível):</strong> R$ 3,90 por operação</li>
    </ul>
    <h3>3.3 Isenções</h3>
    <p><strong>Não há taxas</strong> para: adesão à Plataforma, mensalidade, manutenção de conta, upload de produtos, criação de links de checkout, uso da área de membros ou acesso ao marketplace de afiliados.</p>
    <h3>3.4 Tributação</h3>
    <p>As taxas cobradas pelo QueeniPay referem-se à intermediação de pagamento e licenciamento de software. <strong>Impostos sobre os rendimentos do Produtor (IRPF, IRPJ, ISS, CSLL, PIS, COFINS, etc.) são de responsabilidade exclusiva do Produtor.</strong> A Queenify não realiza retenção de impostos na fonte e não emite notas fiscais em nome dos Produtores.</p>

    <h2>4. Prazos de Liberação</h2>
    <p>Os valores são liberados ao Produtor após a expiração do período de garantia do produto (7, 15 ou 30 dias), conforme:</p>
    <ul>
      <li><strong>PIX:</strong> 2 dias úteis após aprovação e término da garantia</li>
      <li><strong>Boleto:</strong> 2 dias úteis após compensação bancária e término da garantia</li>
      <li><strong>Cartão de crédito (sem antecipação):</strong> 2 a 15 dias úteis, conforme número de parcelas</li>
      <li><strong>Cartão de crédito (com antecipação):</strong> 2 dias úteis + taxa de antecipação</li>
    </ul>
    <p>Em caso de suspeita de fraude ou atividade irregular, os prazos podem ser estendidos para análise, e a Queenify reserva-se o direito de reter valores durante a investigação.</p>

    <h2>5. Escrow e Garantias</h2>
    <p>Os valores das vendas ficam retidos em escrow durante o período de garantia definido pelo Produtor. Este mecanismo garante:</p>
    <ul>
      <li>O direito de arrependimento do Comprador (art. 49 do CDC — compras à distância)</li>
      <li>A proteção contra fraudes e chargebacks</li>
      <li>A integridade e confiabilidade das transações na Plataforma</li>
    </ul>
    <p>Após a expiração do prazo de garantia sem contestação ou reembolso, o valor é automaticamente liberado para o saldo disponível do Produtor.</p>

    <h2>6. Chargebacks e Disputas</h2>
    <p>Em caso de chargeback (contestação de compra pelo titular do cartão junto à operadora):</p>
    <ul>
      <li>O valor da transação será debitado do saldo do Produtor, incluindo eventuais taxas da operadora</li>
      <li>A Queenify atuará como mediadora, fornecendo evidências à administradora do cartão</li>
      <li>A <strong>decisão final cabe exclusivamente à operadora do cartão</strong>, e a Queenify não tem ingerência sobre o resultado</li>
      <li>Caso o Produtor não possua saldo, o valor será registrado como saldo negativo</li>
      <li>Saldo negativo será descontado automaticamente de vendas futuras</li>
      <li>Saldo negativo não regularizado em 4 meses pode ser encaminhado a órgãos de proteção ao crédito</li>
    </ul>
    <p>Produtores com taxa de chargeback acima de 2% do volume total podem ter suas contas suspensas ou encerradas, sem prejuízo de outras medidas previstas nos Termos de Uso.</p>

    <h2>7. Prevenção a Fraudes e PLD/FT</h2>
    <p>Em cumprimento à Lei nº 9.613/1998 (Lei de Lavagem de Dinheiro), regulamentações do COAF e melhores práticas internacionais, a Queenify implementa:</p>
    <ul>
      <li>Identificação e verificação de clientes (KYC — Know Your Customer)</li>
      <li>Monitoramento contínuo de transações atípicas e padrões suspeitos</li>
      <li>Análise de risco e fingerprinting de dispositivos</li>
      <li>Comunicação de operações suspeitas às autoridades competentes (COAF)</li>
      <li>Manutenção de registros de transações por prazo mínimo de 5 (cinco) anos</li>
      <li>Recusa de transações com indícios de lavagem de dinheiro ou financiamento do terrorismo</li>
    </ul>

    <h2>8. Conformidade e Segurança</h2>
    <p>O QueeniPay opera em conformidade com:</p>
    <ul>
      <li>Regulamentações do Banco Central do Brasil aplicáveis a arranjos de pagamento</li>
      <li>Normas PCI DSS (Payment Card Industry Data Security Standard) para segurança de dados de cartão</li>
      <li>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</li>
      <li>Código de Defesa do Consumidor (Lei nº 8.078/1990)</li>
      <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
      <li>Lei de Lavagem de Dinheiro (Lei nº 9.613/1998)</li>
    </ul>

    <h2>9. Obrigações do Comprador</h2>
    <p>O Comprador deve manter forma de pagamento válida e é responsável por fornecer dados corretos. Ao realizar uma compra, o Comprador autoriza o processamento do pagamento pela Queenify e concorda com as condições de reembolso estabelecidas pelo Produtor (respeitado o mínimo legal de 7 dias). O Comprador é responsável por verificar a adequação do produto antes da expiração do prazo de garantia.</p>

    <h2>10. Poderes Outorgados pelo Produtor</h2>
    <p>Ao aceitar estes Termos, o Produtor nomeia e constitui a Queenify como sua mandatária para tomar as providências necessárias relativas à gestão de Recebíveis gerados na Plataforma, incluindo a instrução de liquidação, gestão de agenda de recebíveis junto a entidades registradoras, e substabelecimento dos poderes a terceiros para fins de processamento de pagamentos.</p>

    <p className="text-xs text-muted-foreground mt-8">Última atualização: Abril de 2026.</p>
  </LegalLayout>
);

export default TermosQueeniPay;
