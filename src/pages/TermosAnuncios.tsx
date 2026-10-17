import LegalLayout from "@/components/LegalLayout";
import { motion } from "framer-motion";

const FloatingOrb = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
  />
);

const GoldenStreak = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute h-[1px] pointer-events-none ${className}`}
    style={{ background: "linear-gradient(90deg, transparent, hsl(43 96% 56% / 0.25), transparent)" }}
    animate={{ scaleX: [0, 1, 0], opacity: [0, 0.6, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
  />
);

const GlowDot = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute w-1.5 h-1.5 rounded-full pointer-events-none ${className}`}
    style={{ background: "hsl(43 96% 56% / 0.5)", boxShadow: "0 0 8px hsl(43 96% 56% / 0.3)" }}
    animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  />
);

const TermosAnuncios = () => (
  <div className="relative">
    {/* Background effects */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <FloatingOrb className="w-[500px] h-[500px] -top-40 -left-40 bg-primary/10 blur-[140px]" />
      <FloatingOrb className="w-[400px] h-[400px] top-1/3 -right-32 bg-amber-500/8 blur-[120px]" />
      <FloatingOrb className="w-[350px] h-[350px] bottom-1/4 left-1/4 bg-yellow-600/6 blur-[100px]" />
      <GoldenStreak className="w-[300px] top-[15%] left-[10%] rotate-[25deg]" />
      <GoldenStreak className="w-[250px] top-[45%] right-[5%] -rotate-[15deg]" />
      <GoldenStreak className="w-[200px] bottom-[30%] left-[20%] rotate-[40deg]" />
      <GlowDot className="top-[12%] left-[85%]" />
      <GlowDot className="top-[35%] left-[8%]" />
      <GlowDot className="top-[60%] right-[12%]" />
      <GlowDot className="top-[80%] left-[45%]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px]" />
    </div>

    <div className="relative z-10">
      <LegalLayout title="Termos e Políticas do Queenify Ads">
        <p>
          Estes Termos e Políticas de Publicidade ("Políticas de Anúncios") regem o uso da ferramenta de
          gerenciamento e veiculação de anúncios integrada à plataforma Queenify ("Queenify Ads"). Ao utilizar
          o Queenify Ads, o Anunciante declara ter lido, compreendido e concordado integralmente com estes termos.
        </p>

        <h2>1. Definições</h2>
        <ul>
          <li><strong>Plataforma:</strong> Queenify Tecnologia Ltda., pessoa jurídica responsável pela operação do Queenify Ads.</li>
          <li><strong>Anunciante:</strong> Pessoa física ou jurídica que cria, gerencia ou veicula anúncios por meio do Queenify Ads.</li>
          <li><strong>Anúncio:</strong> Qualquer material publicitário — incluindo textos, imagens, vídeos, áudios e links — submetido para veiculação.</li>
          <li><strong>Campanha:</strong> Conjunto organizado de anúncios com objetivo, orçamento e segmentação definidos.</li>
          <li><strong>Criativo:</strong> Conteúdo visual ou audiovisual utilizado como peça publicitária.</li>
          <li><strong>Conta de Anúncios:</strong> Conta vinculada ao perfil do Anunciante na plataforma Queenify para gerenciamento de campanhas.</li>
        </ul>

        <h2>2. Elegibilidade e Responsabilidade do Anunciante</h2>
        <p>Para utilizar o Queenify Ads, o Anunciante deve:</p>
        <ol>
          <li>Possuir conta ativa e verificada na plataforma Queenify;</li>
          <li>Ter capacidade civil plena ou representação legal adequada;</li>
          <li>Fornecer informações cadastrais verdadeiras, completas e atualizadas;</li>
          <li>Cumprir integralmente a legislação brasileira aplicável, incluindo o Código de Defesa do Consumidor (CDC — Lei nº 8.078/1990), o Marco Civil da Internet (Lei nº 12.965/2014), a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e as normas do CONAR;</li>
          <li>Ser o único responsável pelo conteúdo, veracidade e legalidade de seus anúncios.</li>
        </ol>

        <h2>3. Conteúdo Proibido</h2>
        <p>É expressamente vedada a veiculação de anúncios que contenham, promovam ou estejam associados a:</p>

        <h3>3.1. Produtos e Serviços Proibidos</h3>
        <ul>
          <li>Drogas ilícitas, substâncias controladas ou apetrechos para consumo;</li>
          <li>Armas de fogo, munições, explosivos ou armas brancas;</li>
          <li>Tabaco, cigarros eletrônicos (vapes), narguilé e produtos derivados;</li>
          <li>Bebidas alcoólicas sem as devidas restrições etárias e advertências legais;</li>
          <li>Medicamentos controlados, suplementos não registrados na ANVISA ou produtos com alegações terapêuticas não comprovadas;</li>
          <li>Jogos de azar não regulamentados pela legislação brasileira vigente;</li>
          <li>Serviços financeiros não autorizados pelo Banco Central, CVM ou SUSEP;</li>
          <li>Produtos falsificados, pirateados ou que infrinjam propriedade intelectual de terceiros;</li>
          <li>Documentos falsos, diplomas fraudulentos ou certificações ilegítimas.</li>
        </ul>

        <h3>3.2. Conteúdo Restrito</h3>
        <ul>
          <li>Conteúdo sexual explícito, pornográfico ou que explore a nudez;</li>
          <li>Conteúdo que incite violência, discriminação, ódio racial, religioso, étnico, de gênero ou orientação sexual;</li>
          <li>Material que promova bullying, assédio, intimidação ou perseguição;</li>
          <li>Conteúdo terrorista, extremista ou que glorifique atos violentos;</li>
          <li>Conteúdo que explore menores de idade em qualquer contexto;</li>
          <li>Informações comprovadamente falsas (fake news) ou teorias conspiratórias prejudiciais à saúde pública;</li>
          <li>Esquemas de pirâmide financeira, marketing multinível fraudulento ou promessas de enriquecimento garantido.</li>
        </ul>

        <h3>3.3. Práticas Publicitárias Proibidas</h3>
        <ul>
          <li>Publicidade enganosa ou abusiva nos termos do CDC (arts. 36 e 37);</li>
          <li>Uso de depoimentos falsos, resultados fabricados ou provas sociais fictícias;</li>
          <li>Clickbait excessivo ou títulos sensacionalistas que não reflitam o conteúdo;</li>
          <li>Técnicas de "cloaking" — exibir conteúdo diferente para usuários e sistemas de revisão;</li>
          <li>Coleta não autorizada de dados pessoais via formulários, landing pages ou pixels;</li>
          <li>Redirecionamentos automáticos para sites maliciosos ou downloads não autorizados;</li>
          <li>Simulação de interfaces de sistema operacional, alertas de vírus ou notificações falsas;</li>
          <li>Uso indevido de marcas, logos ou identidade visual de terceiros sem autorização;</li>
          <li>Anúncios que reproduzam a identidade visual da Queenify para confundir o usuário.</li>
        </ul>

        <h2>4. Políticas de Segmentação e Dados</h2>

        <h3>4.1. Segmentação de Público</h3>
        <p>O Anunciante pode segmentar seu público por critérios como localização, idade, interesses e comportamento, desde que:</p>
        <ul>
          <li>Não utilize critérios de segmentação para fins discriminatórios (raça, religião, orientação sexual, condição de saúde, etc.);</li>
          <li>Respeite as faixas etárias mínimas definidas pela legislação para cada categoria de produto;</li>
          <li>Não segmente menores de 18 anos para produtos ou serviços restritos;</li>
          <li>Não utilize dados sensíveis (conforme art. 5º, II da LGPD) para segmentação sem base legal adequada.</li>
        </ul>

        <h3>4.2. Pixel de Rastreamento e Cookies</h3>
        <ul>
          <li>O Queenify Ads oferece pixel nativo para rastreamento de conversões;</li>
          <li>O Anunciante é responsável por informar seus visitantes sobre o uso de cookies e obter consentimento quando exigido pela LGPD;</li>
          <li>Dados coletados pelo pixel são armazenados em conformidade com a Política de Privacidade da Queenify;</li>
          <li>É proibido o uso do pixel para coletar dados além do escopo autorizado.</li>
        </ul>

        <h3>4.3. Remarketing e Audiências Personalizadas</h3>
        <ul>
          <li>Listas de remarketing devem ser compostas exclusivamente por dados obtidos com consentimento válido;</li>
          <li>É proibido o upload de listas de e-mails ou telefones obtidos sem autorização dos titulares;</li>
          <li>Audiências semelhantes (lookalike) são geradas pela plataforma com base em dados anonimizados;</li>
          <li>O Anunciante não terá acesso a dados pessoais individuais dos membros de audiências.</li>
        </ul>

        <h2>5. Processo de Revisão e Aprovação</h2>

        <h3>5.1. Revisão Automatizada e Manual</h3>
        <ul>
          <li>Todos os anúncios são submetidos a uma revisão automatizada antes da veiculação;</li>
          <li>A Queenify reserva-se o direito de realizar revisão manual adicional a qualquer momento;</li>
          <li>O prazo de revisão é de até 24 (vinte e quatro) horas úteis, podendo ser estendido em casos complexos;</li>
          <li>A aprovação de um anúncio não isenta o Anunciante de responsabilidade pelo conteúdo.</li>
        </ul>

        <h3>5.2. Decisões de Revisão</h3>
        <ul>
          <li><strong>Aprovado:</strong> O anúncio atende às políticas e será veiculado conforme configuração;</li>
          <li><strong>Aprovado com restrições:</strong> O anúncio é veiculado com limitações de alcance ou segmentação;</li>
          <li><strong>Reprovado:</strong> O anúncio viola uma ou mais políticas. O Anunciante pode corrigir e resubmeter;</li>
          <li><strong>Suspenso:</strong> O anúncio em veiculação foi removido por violação detectada posteriormente.</li>
        </ul>

        <h3>5.3. Recurso</h3>
        <p>
          O Anunciante pode solicitar revisão de decisões de reprovação ou suspensão em até 15 (quinze) dias
          corridos, mediante justificativa fundamentada pelo canal de suporte (suporte@queenify.com.br).
          A decisão em sede de recurso é definitiva.
        </p>

        <h2>6. Cobrança, Orçamento e Pagamento</h2>

        <h3>6.1. Modelos de Cobrança</h3>
        <ul>
          <li><strong>CPC (Custo por Clique):</strong> Cobrança por cada clique válido no anúncio;</li>
          <li><strong>CPM (Custo por Mil Impressões):</strong> Cobrança a cada 1.000 impressões do anúncio;</li>
          <li><strong>CPA (Custo por Aquisição):</strong> Cobrança por conversão realizada (quando disponível).</li>
        </ul>

        <h3>6.2. Orçamento</h3>
        <ul>
          <li>O Anunciante define orçamento diário ou total para cada campanha;</li>
          <li>A plataforma pode consumir até 20% acima do orçamento diário para otimização, compensando em dias subsequentes;</li>
          <li>O orçamento total da campanha nunca será excedido;</li>
          <li>Campanhas sem saldo disponível serão automaticamente pausadas.</li>
        </ul>

        <h3>6.3. Pagamento</h3>
        <ul>
          <li>Os pagamentos são processados via Queenify Pay (gateway integrado);</li>
          <li>Métodos aceitos: cartão de crédito, PIX e saldo da conta Queenify;</li>
          <li>Faturas são emitidas mensalmente e disponíveis na área financeira do dashboard;</li>
          <li>Em caso de inadimplência superior a 5 (cinco) dias úteis, as campanhas ativas serão suspensas;</li>
          <li>Valores em aberto poderão ser inscritos em órgãos de proteção ao crédito após 30 (trinta) dias.</li>
        </ul>

        <h2>7. Propriedade Intelectual</h2>
        <ul>
          <li>O Anunciante declara possuir todos os direitos necessários sobre o conteúdo de seus anúncios;</li>
          <li>Ao submeter um anúncio, o Anunciante concede à Queenify licença não exclusiva para exibição, distribuição e cache do material durante o período de veiculação;</li>
          <li>A Queenify não adquire direitos de propriedade sobre os criativos do Anunciante;</li>
          <li>Denúncias de violação de propriedade intelectual podem ser reportadas em denuncias@queenify.com.br e serão tratadas conforme a Lei nº 9.610/1998 (Direitos Autorais) e a Lei nº 9.279/1996 (Propriedade Industrial).</li>
        </ul>

        <h2>8. Métricas, Relatórios e Transparência</h2>
        <ul>
          <li>A Queenify fornece relatórios detalhados de desempenho (impressões, cliques, CTR, conversões, custo por resultado);</li>
          <li>As métricas são atualizadas em intervalos regulares, podendo haver delay de até 4 (quatro) horas;</li>
          <li>A Queenify emprega sistemas de detecção de tráfego inválido (bots, cliques fraudulentos, impressões artificiais);</li>
          <li>Cliques e impressões identificados como fraudulentos são automaticamente excluídos da cobrança;</li>
          <li>O Anunciante pode contestar métricas em até 30 (trinta) dias após o período de veiculação.</li>
        </ul>

        <h2>9. Regras Específicas por Categoria</h2>

        <h3>9.1. Produtos Digitais e Infoprodutos</h3>
        <ul>
          <li>É obrigatório indicar claramente que se trata de produto digital;</li>
          <li>Promessas de resultados devem incluir disclaimer: "Resultados podem variar. Não há garantia de resultado específico.";</li>
          <li>Depoimentos utilizados devem ser reais e verificáveis;</li>
          <li>É obrigatório informar o prazo de garantia conforme configurado no produto.</li>
        </ul>

        <h3>9.2. Serviços Financeiros e Investimentos</h3>
        <ul>
          <li>Anúncios de produtos financeiros devem incluir avisos de risco obrigatórios;</li>
          <li>É proibido garantir retornos financeiros específicos;</li>
          <li>O Anunciante deve possuir as licenças e registros necessários (CVM, BACEN, SUSEP);</li>
          <li>Disclaimer obrigatório: "Investimentos envolvem riscos. Rentabilidade passada não garante resultados futuros."</li>
        </ul>

        <h3>9.3. Saúde e Bem-estar</h3>
        <ul>
          <li>Alegações de saúde devem ser respaldadas por evidências científicas;</li>
          <li>É proibido afirmar que um produto cura, trata ou previne doenças sem registro na ANVISA;</li>
          <li>Imagens de "antes e depois" devem ser reais e não manipuladas digitalmente;</li>
          <li>Suplementos alimentares devem exibir o número de registro na ANVISA.</li>
        </ul>

        <h3>9.4. Educação e Cursos</h3>
        <ul>
          <li>É obrigatório informar a carga horária e o formato de entrega (online, presencial, híbrido);</li>
          <li>Certificações mencionadas devem ser legítimas e verificáveis;</li>
          <li>É proibido garantir aprovação em concursos, vestibulares ou processos seletivos;</li>
          <li>Cursos gratuitos não podem condicionar o acesso à compra de outros produtos sem aviso prévio.</li>
        </ul>

        <h2>10. Suspensão e Encerramento de Conta</h2>

        <h3>10.1. A Queenify poderá suspender ou encerrar a Conta de Anúncios nos seguintes casos:</h3>
        <ul>
          <li>Violação reiterada destas Políticas de Anúncios;</li>
          <li>Tentativa de burlar o sistema de revisão (cloaking, redirects, conteúdo dinâmico);</li>
          <li>Uso da plataforma para atividades ilícitas;</li>
          <li>Inadimplência financeira não regularizada;</li>
          <li>Determinação judicial ou administrativa;</li>
          <li>Atividades que comprometam a segurança ou reputação da plataforma.</li>
        </ul>

        <h3>10.2. Efeitos da Suspensão</h3>
        <ul>
          <li>Todas as campanhas ativas são imediatamente pausadas;</li>
          <li>Saldos de créditos de anúncio não utilizados permanecem retidos até resolução;</li>
          <li>O Anunciante mantém acesso aos relatórios de campanhas anteriores por 90 (noventa) dias;</li>
          <li>Em caso de encerramento definitivo, saldos remanescentes serão reembolsados em até 30 (trinta) dias, descontadas eventuais pendências.</li>
        </ul>

        <h2>11. Limitação de Responsabilidade</h2>
        <ul>
          <li>A Queenify não garante resultados específicos de desempenho de campanhas;</li>
          <li>A plataforma não se responsabiliza por interrupções temporárias no serviço de veiculação;</li>
          <li>O Anunciante é o único responsável por danos causados a terceiros decorrentes de seus anúncios;</li>
          <li>A responsabilidade total da Queenify está limitada ao valor efetivamente pago pelo Anunciante nos últimos 12 (doze) meses;</li>
          <li>A Queenify não se responsabiliza por variações de desempenho decorrentes de fatores externos (concorrência, sazonalidade, mudanças de mercado).</li>
        </ul>

        <h2>12. Indenização</h2>
        <p>
          O Anunciante concorda em indenizar e isentar a Queenify, seus diretores, funcionários e parceiros de quaisquer
          reclamações, perdas, danos, custos e despesas (incluindo honorários advocatícios) decorrentes de: (a) violação
          destes Termos; (b) conteúdo de anúncios veiculados; (c) violação de direitos de terceiros; (d) descumprimento
          de legislação aplicável.
        </p>

        <h2>13. Conformidade Legal</h2>
        <p>Estes Termos foram elaborados em conformidade com:</p>
        <ul>
          <li>Constituição Federal — Art. 5º, IX (liberdade de expressão) e Art. 220, §§ 3º e 4º (restrições à publicidade);</li>
          <li>Código de Defesa do Consumidor (Lei nº 8.078/1990) — Arts. 36 e 37 (publicidade enganosa e abusiva);</li>
          <li>Marco Civil da Internet (Lei nº 12.965/2014) — Arts. 18 a 21 (responsabilidade de provedores);</li>
          <li>Lei Geral de Proteção de Dados (Lei nº 13.709/2018) — Arts. 7º, 11 e 18 (bases legais e direitos do titular);</li>
          <li>Código Brasileiro de Autorregulamentação Publicitária (CONAR);</li>
          <li>Estatuto da Criança e do Adolescente (Lei nº 8.069/1990) — Arts. 76 e 79 (proteção do menor na publicidade);</li>
          <li>Lei de Direitos Autorais (Lei nº 9.610/1998);</li>
          <li>Lei de Propriedade Industrial (Lei nº 9.279/1996);</li>
          <li>Regulamentações da ANVISA sobre publicidade de alimentos, suplementos e cosméticos.</li>
        </ul>

        <h2>14. Alterações nas Políticas</h2>
        <p>
          A Queenify reserva-se o direito de atualizar estas Políticas de Anúncios a qualquer momento.
          Alterações significativas serão comunicadas com antecedência mínima de 15 (quinze) dias por meio
          de notificação no dashboard e/ou e-mail cadastrado. O uso continuado do Queenify Ads após a entrada
          em vigor das alterações constitui aceitação dos novos termos.
        </p>

        <h2>15. Disposições Gerais</h2>
        <ul>
          <li>Estes Termos são regidos pelas leis da República Federativa do Brasil;</li>
          <li>Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias;</li>
          <li>A tolerância quanto ao descumprimento de qualquer disposição não constitui renúncia;</li>
          <li>Caso qualquer cláusula seja considerada inválida, as demais permanecerão em pleno vigor;</li>
          <li>Estes Termos constituem o acordo integral entre as partes no que diz respeito ao uso do Queenify Ads.</li>
        </ul>

        <h2>16. Canal de Denúncia de Anúncios</h2>
        <p>
          Qualquer pessoa pode denunciar anúncios que violem estas políticas por meio dos seguintes canais:
        </p>
        <ul>
          <li>E-mail: <strong>denuncias@queenify.com.br</strong></li>
          <li>Formulário: <strong>queenify.com.br/denuncias-de-produto</strong></li>
          <li>WhatsApp: Canal oficial de suporte</li>
        </ul>
        <p>
          Denúncias serão analisadas em até 48 (quarenta e oito) horas úteis. O denunciante receberá
          retorno sobre a decisão tomada.
        </p>

        <h2>17. Contato</h2>
        <p>
          Para dúvidas sobre estas Políticas de Anúncios, entre em contato:
        </p>
        <ul>
          <li>E-mail: <strong>ads@queenify.com.br</strong></li>
          <li>Suporte: <strong>suporte@queenify.com.br</strong></li>
          <li>WhatsApp: Canal oficial</li>
        </ul>

        <p className="text-xs text-muted-foreground mt-10 pt-6 border-t border-border">
          Ao utilizar o Queenify Ads, o Anunciante declara estar ciente e de acordo com todos os termos
          e condições descritos neste documento.
        </p>
      </LegalLayout>
    </div>
  </div>
);

export default TermosAnuncios;
