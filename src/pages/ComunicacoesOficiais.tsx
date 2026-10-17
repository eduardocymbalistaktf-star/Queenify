import LegalLayout from "@/components/LegalLayout";

const ComunicacoesOficiais = () => (
  <LegalLayout title="Comunicações Oficiais de Autoridades">
    <h2>1. Objetivo</h2>
    <p>Esta página centraliza informações sobre comunicações oficiais recebidas ou emitidas em atendimento a solicitações de autoridades públicas, conforme exigido pela legislação brasileira. A Queenify se compromete com a transparência no cumprimento de suas obrigações legais e regulatórias.</p>

    <h2>2. Cumprimento de Ordens Judiciais</h2>
    <p>A Queenify cumpre integralmente todas as ordens judiciais recebidas, incluindo, mas não se limitando a:</p>
    <ul>
      <li>Ordens de remoção de conteúdo (Marco Civil da Internet — Lei nº 12.965/2014, Art. 19)</li>
      <li>Solicitações de fornecimento de dados cadastrais e registros de acesso mediante decisão judicial (Art. 10, §1º e Art. 22 do Marco Civil)</li>
      <li>Bloqueio, penhora, arresto ou qualquer constrição judicial sobre valores de Usuários</li>
      <li>Preservação de registros de acesso a aplicações de internet (Art. 15 do Marco Civil — 6 meses)</li>
      <li>Cumprimento de determinações do SISBAJUD (Sistema de Busca de Ativos do Poder Judiciário)</li>
      <li>Atendimento a ofícios requisitórios e mandados de busca e apreensão digital</li>
    </ul>

    <h2>3. Cooperação com Autoridades</h2>
    <p>A Queenify coopera com as seguintes autoridades quando formalmente solicitada, nos limites da legislação vigente:</p>
    <ul>
      <li><strong>Poder Judiciário:</strong> cumprimento de decisões judiciais de todas as instâncias</li>
      <li><strong>Ministério Público:</strong> atendimento a procedimentos investigatórios e inquéritos civis</li>
      <li><strong>Polícia Civil e Federal:</strong> fornecimento de informações em inquéritos policiais com autorização judicial</li>
      <li><strong>PROCON e órgãos de defesa do consumidor:</strong> atendimento a reclamações e procedimentos administrativos</li>
      <li><strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong> cumprimento de determinações relacionadas à LGPD</li>
      <li><strong>Receita Federal do Brasil:</strong> atendimento a requisições fiscais e tributárias</li>
      <li><strong>COAF (Conselho de Controle de Atividades Financeiras):</strong> comunicação de operações suspeitas conforme Lei nº 9.613/1998</li>
      <li><strong>Banco Central do Brasil:</strong> atendimento a regulamentações aplicáveis a arranjos de pagamento</li>
      <li><strong>SENACON:</strong> atendimento a procedimentos de defesa do consumidor em âmbito federal</li>
    </ul>

    <h2>4. Transparência e Notificação</h2>
    <p>A Queenify se compromete a informar os Usuários sobre solicitações de dados sempre que legalmente permitido. Caso haja sigilo judicial ou determinação expressa de não comunicação, a notificação será feita após o levantamento do sigilo ou cessação da restrição.</p>

    <h2>5. Relatório de Transparência</h2>
    <p>A Queenify publica semestralmente um relatório de transparência informando:</p>
    <ul>
      <li>Número total de solicitações recebidas de autoridades</li>
      <li>Tipos de solicitação (remoção de conteúdo, fornecimento de dados, bloqueio de valores)</li>
      <li>Autoridade solicitante (por categoria)</li>
      <li>Resultado (atendida, recusada, parcialmente atendida)</li>
      <li>Tempo médio de resposta</li>
    </ul>
    <p>O próximo relatório será disponibilizado em julho de {new Date().getFullYear()}.</p>

    <h2>6. Contato Institucional</h2>
    <p>Autoridades públicas podem direcionar comunicações oficiais para:</p>
    <ul>
      <li><strong>E-mail:</strong> juridico@queenify.com.br</li>
      <li><strong>Horário de atendimento:</strong> dias úteis, das 9h às 18h (horário de Brasília)</li>
    </ul>
    <p>Comunicações recebidas fora do horário comercial serão processadas no próximo dia útil. Solicitações urgentes com indicação expressa de urgência serão priorizadas.</p>

    <p className="text-xs text-muted-foreground mt-8">Última atualização: Abril de 2026.</p>
  </LegalLayout>
);

export default ComunicacoesOficiais;
