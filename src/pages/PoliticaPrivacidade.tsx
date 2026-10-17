import LegalLayout from "@/components/LegalLayout";

const PoliticaPrivacidade = () => (
  <LegalLayout title="Política de Privacidade">
    <p>Esta Política de Privacidade descreve como a Queenify coleta, utiliza, armazena, compartilha e protege as informações pessoais dos seus Usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e demais legislações aplicáveis. A sua privacidade é prioridade para nós.</p>

    <h2>1. Informações que Coletamos</h2>
    <h3>1.1 Dados fornecidos diretamente pelo Usuário</h3>
    <ul>
      <li><strong>Dados de cadastro:</strong> nome completo, e-mail, telefone, senha (armazenada com hash bcrypt, nunca em texto plano)</li>
      <li><strong>Dados fiscais e financeiros:</strong> CPF ou CNPJ (para pagamentos e obrigações fiscais), dados bancários e chave PIX (para saques)</li>
      <li><strong>Dados de verificação (KYC):</strong> documento de identidade com foto (RG, CNH ou passaporte), selfie de verificação biométrica, comprovante de endereço</li>
      <li><strong>Dados de perfil (opcionais):</strong> foto de perfil, biografia, redes sociais vinculadas</li>
      <li><strong>Dados de produtos:</strong> conteúdos de cursos, descrições, imagens e vídeos enviados pelo Produtor</li>
      <li><strong>Dados de comunicação:</strong> mensagens de suporte, denúncias, avaliações e feedbacks enviados pelo Usuário</li>
    </ul>
    <h3>1.2 Dados coletados automaticamente</h3>
    <ul>
      <li><strong>Dados técnicos:</strong> endereço IP, tipo e versão do navegador, sistema operacional, resolução de tela, modelo do dispositivo</li>
      <li><strong>Dados de navegação:</strong> páginas visitadas, tempo de permanência, cliques, scrolls, origem do tráfego</li>
      <li><strong>Dados de geolocalização:</strong> localização aproximada baseada no IP (não utilizamos GPS)</li>
      <li><strong>Dados de conversão:</strong> funil de checkout, taxas de conclusão de compra, UTMs</li>
      <li><strong>Identificadores únicos:</strong> cookies, identificadores de dispositivo e tokens de sessão</li>
    </ul>
    <h3>1.3 Dados de terceiros</h3>
    <ul>
      <li><strong>Processadores de pagamento:</strong> confirmação de transações e dados de cobrança</li>
      <li><strong>Serviços de antifraude:</strong> análise de risco, fingerprinting de dispositivos e score de crédito</li>
      <li><strong>Plataformas de anúncios:</strong> dados de conversão e performance de campanhas (quando o Produtor utiliza o Queenify Ads)</li>
    </ul>

    <h2>2. Bases Legais para o Tratamento (Art. 7º, LGPD)</h2>
    <p>O tratamento de dados pessoais pela Queenify está fundamentado nas seguintes bases legais:</p>
    <ul>
      <li><strong>Execução de contrato (Art. 7º, V):</strong> processar pagamentos, liberar saques, entregar produtos adquiridos, gerir comissões de afiliados, manter a Conta Digital</li>
      <li><strong>Consentimento (Art. 7º, I):</strong> envio de comunicações de marketing, newsletters, notificações opcionais e cookies não essenciais</li>
      <li><strong>Legítimo interesse (Art. 7º, IX):</strong> prevenção a fraudes, melhoria de serviços, analytics internos, personalização da experiência e segurança da Plataforma</li>
      <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> manutenção de registros fiscais, prevenção à lavagem de dinheiro (PLD/FT), atendimento a ordens judiciais</li>
      <li><strong>Proteção ao crédito (Art. 7º, X):</strong> verificação de identidade para operações financeiras, gestão de saldos negativos e chargebacks</li>
      <li><strong>Exercício regular de direitos (Art. 7º, VI):</strong> em processos judiciais, administrativos ou arbitrais</li>
    </ul>

    <h2>3. Como Utilizamos seus Dados</h2>
    <ul>
      <li>Processar pagamentos, transferências, saques e antecipações</li>
      <li>Verificar identidade e prevenir fraudes (KYC/AML/PLD/FT)</li>
      <li>Personalizar a experiência na Plataforma</li>
      <li>Enviar notificações sobre vendas, saques, atualizações, alertas de segurança e comunicações transacionais</li>
      <li>Gerar relatórios, analytics e dashboards para o Produtor</li>
      <li>Operar o sistema de anúncios integrado (Queenify Ads), incluindo segmentação e otimização de campanhas</li>
      <li>Melhorar nossos serviços e desenvolver novas funcionalidades</li>
      <li>Cumprir obrigações legais, regulatórias e fiscais</li>
      <li>Mediar disputas entre Produtores e Compradores</li>
      <li>Detectar e prevenir abusos, spam, atividades fraudulentas e uso irregular da Plataforma</li>
    </ul>

    <h2>4. Compartilhamento de Dados</h2>
    <p>A Queenify <strong>não vende, aluga ou comercializa seus dados pessoais</strong>. Podemos compartilhar informações estritamente necessárias com:</p>
    <ul>
      <li><strong>Processadores de pagamento:</strong> dados necessários para viabilizar transações financeiras (nome, CPF/CNPJ, valor da transação)</li>
      <li><strong>Autoridades competentes:</strong> quando exigido por lei, ordem judicial, investigação policial, requisição do Ministério Público ou determinação da ANPD</li>
      <li><strong>Compradores:</strong> dados mínimos para entrega do produto (e-mail de acesso à área de membros)</li>
      <li><strong>Produtores:</strong> dados de Compradores necessários para suporte e entrega do produto adquirido</li>
      <li><strong>Serviços de infraestrutura:</strong> provedores de hospedagem, CDN e armazenamento em nuvem (com acordos de confidencialidade e DPA)</li>
      <li><strong>Prestadores de serviço de antifraude:</strong> dados transacionais para análise de risco</li>
      <li><strong>Plataformas de anúncios (Google, Meta):</strong> dados de conversão anonimizados quando o Produtor utiliza integrações de anúncios</li>
    </ul>

    <h2>5. Armazenamento e Segurança</h2>
    <p>Seus dados são armazenados em servidores seguros com as seguintes medidas de proteção:</p>
    <ul>
      <li><strong>Criptografia em repouso:</strong> AES-256 para dados sensíveis</li>
      <li><strong>Criptografia em trânsito:</strong> TLS 1.3 para todas as comunicações</li>
      <li><strong>Controle de acesso:</strong> princípio do menor privilégio para funcionários e sistemas</li>
      <li><strong>Autenticação de dois fatores (2FA):</strong> disponível para todos os Usuários</li>
      <li><strong>Backups:</strong> cópias de segurança automatizadas com retenção de 30 dias</li>
      <li><strong>Monitoramento:</strong> detecção de intrusão, alertas em tempo real e logs de auditoria</li>
      <li><strong>Senhas:</strong> armazenadas com hash bcrypt, nunca em texto plano</li>
      <li><strong>PCI DSS:</strong> conformidade com padrões de segurança para dados de cartão de pagamento</li>
    </ul>

    <h2>6. Seus Direitos (LGPD — Art. 18)</h2>
    <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos:</p>
    <ul>
      <li><strong>Confirmação e acesso:</strong> confirmar a existência de tratamento e acessar todos os dados pessoais que possuímos sobre você</li>
      <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
      <li><strong>Anonimização, bloqueio ou eliminação:</strong> solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD</li>
      <li><strong>Portabilidade:</strong> solicitar a transferência de seus dados a outro fornecedor de serviço (em formato estruturado e interoperável)</li>
      <li><strong>Eliminação com consentimento:</strong> solicitar a exclusão de dados pessoais tratados com base no consentimento</li>
      <li><strong>Informação:</strong> ser informado sobre entidades públicas e privadas com as quais compartilhamos seus dados</li>
      <li><strong>Revogação do consentimento:</strong> revogar o consentimento a qualquer momento, sem prejudicar o tratamento anterior</li>
      <li><strong>Oposição:</strong> opor-se a tratamento de dados em desconformidade com a LGPD</li>
      <li><strong>Revisão de decisões automatizadas:</strong> solicitar revisão de decisões tomadas exclusivamente com base em tratamento automatizado</li>
    </ul>
    <p>Para exercer qualquer destes direitos, entre em contato pelo e-mail <strong>privacidade@queenify.com.br</strong>. O prazo de resposta é de até 15 (quinze) dias úteis, conforme regulamentação da ANPD.</p>

    <h2>7. Cookies e Tecnologias de Rastreamento</h2>
    <p>Utilizamos os seguintes tipos de cookies:</p>
    <ul>
      <li><strong>Cookies essenciais:</strong> necessários para autenticação, segurança, carrinho de compras e funcionamento da Plataforma (não podem ser desabilitados)</li>
      <li><strong>Cookies analíticos:</strong> permitem entender como os Usuários interagem com a Plataforma, gerando métricas de desempenho (podem ser gerenciados nas configurações)</li>
      <li><strong>Cookies de marketing:</strong> utilizados para personalização de conteúdo, campanhas publicitárias e rastreamento de conversão (requerem consentimento explícito)</li>
      <li><strong>Cookies de rastreamento de afiliados:</strong> identificam a origem da venda para atribuição correta de comissões</li>
    </ul>
    <p>Você pode gerenciar suas preferências de cookies através das configurações do seu navegador ou, quando disponível, através do banner de consentimento da Plataforma.</p>

    <h2>8. Retenção de Dados</h2>
    <p>Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta Política:</p>
    <ul>
      <li><strong>Dados cadastrais:</strong> enquanto a conta estiver ativa + 5 anos após encerramento</li>
      <li><strong>Dados financeiros e fiscais:</strong> mínimo de 5 anos, conforme legislação tributária (CTN) e PLD</li>
      <li><strong>Dados de verificação (KYC):</strong> enquanto a conta estiver ativa + 5 anos</li>
      <li><strong>Logs de acesso:</strong> 6 meses, conforme Marco Civil da Internet (Art. 15)</li>
      <li><strong>Dados de navegação e analytics:</strong> 12 meses</li>
      <li><strong>Dados de anúncios:</strong> enquanto a campanha estiver ativa + 12 meses para relatórios</li>
    </ul>

    <h2>9. Transferência Internacional de Dados</h2>
    <p>Seus dados podem ser processados em servidores localizados fora do Brasil (infraestrutura em nuvem). Nestes casos, garantimos que os provedores ofereçam nível de proteção compatível com a LGPD, mediante cláusulas contratuais padrão (SCCs) e acordos de processamento de dados (DPAs).</p>

    <h2>10. Menores de Idade</h2>
    <p>A Plataforma é destinada exclusivamente a maiores de 18 anos. Não coletamos intencionalmente dados de menores de 18 anos. Caso identifiquemos coleta indevida, os dados serão excluídos imediatamente e a conta será encerrada, sem direito a indenização.</p>

    <h2>11. Incidentes de Segurança</h2>
    <p>Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a Queenify comunicará à Autoridade Nacional de Proteção de Dados (ANPD) e aos titulares afetados, conforme previsto no Art. 48 da LGPD, em prazo razoável, informando:</p>
    <ul>
      <li>A natureza dos dados pessoais afetados</li>
      <li>Os titulares envolvidos</li>
      <li>As medidas técnicas e de segurança utilizadas para proteção dos dados</li>
      <li>Os riscos relacionados ao incidente</li>
      <li>As medidas adotadas para reverter ou mitigar os efeitos do incidente</li>
      <li>Os motivos da demora, caso a comunicação não seja imediata</li>
    </ul>

    <h2>12. Contato do Encarregado de Dados (DPO)</h2>
    <p>Para exercer seus direitos, tirar dúvidas ou registrar reclamações sobre o tratamento de dados pessoais:</p>
    <ul>
      <li><strong>E-mail:</strong> privacidade@queenify.com.br</li>
      <li><strong>Canal de atendimento:</strong> Ouvidoria da Queenify</li>
      <li><strong>Prazo de resposta:</strong> até 15 dias úteis</li>
    </ul>
    <p>Caso não esteja satisfeito com a resposta, você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) através do site <strong>www.gov.br/anpd</strong>.</p>

    <p className="text-xs text-muted-foreground mt-8">Última atualização: Abril de 2026.</p>
  </LegalLayout>
);

export default PoliticaPrivacidade;
