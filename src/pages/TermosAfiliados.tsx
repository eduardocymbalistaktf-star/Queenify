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

const TermosAfiliados = () => (
  <div className="relative">
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <FloatingOrb className="w-[500px] h-[500px] -top-40 -left-40 bg-primary/10 blur-[140px]" />
      <FloatingOrb className="w-[400px] h-[400px] top-1/3 -right-32 bg-amber-500/8 blur-[120px]" />
      <FloatingOrb className="w-[350px] h-[350px] bottom-1/4 left-1/4 bg-yellow-600/6 blur-[100px]" />
      <GoldenStreak className="w-[300px] top-[15%] left-[10%] rotate-[25deg]" />
      <GoldenStreak className="w-[250px] top-[50%] right-[5%] -rotate-[15deg]" />
      <GlowDot className="top-[12%] left-[85%]" />
      <GlowDot className="top-[40%] left-[8%]" />
      <GlowDot className="top-[70%] right-[12%]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px]" />
    </div>

    <div className="relative z-10">
      <LegalLayout title="Termos do Programa de Afiliados Queenify">
        <p>
          Estes Termos do Programa de Afiliados ("Termos de Afiliação") regulam a relação entre a Queenify Tecnologia
          Ltda. ("Plataforma") e os usuários que atuam como afiliados ("Afiliados") promovendo produtos de terceiros
          ("Produtores") por meio do marketplace de afiliados da Queenify. Ao aderir ao programa, o Afiliado declara
          ter lido, compreendido e concordado integralmente com estes termos.
        </p>

        <h2>1. Definições</h2>
        <ul>
          <li><strong>Produtor:</strong> Usuário da Queenify que criou e disponibilizou um produto digital para venda, podendo aceitar ou recusar afiliados.</li>
          <li><strong>Afiliado:</strong> Usuário da Queenify que promove produtos de Produtores em troca de comissão sobre vendas realizadas.</li>
          <li><strong>Link de Afiliado:</strong> URL exclusivo e rastreável gerado pela plataforma para atribuição de vendas ao Afiliado.</li>
          <li><strong>Comissão:</strong> Percentual do valor líquido da venda destinado ao Afiliado, definido pelo Produtor.</li>
          <li><strong>Cookie de Rastreamento:</strong> Mecanismo técnico que vincula o visitante ao Afiliado por um período determinado.</li>
          <li><strong>Marketplace de Afiliados:</strong> Ambiente dentro da Queenify onde Afiliados podem descobrir, solicitar afiliação e promover produtos.</li>
        </ul>

        <h2>2. Elegibilidade e Cadastro</h2>
        <ol>
          <li>O Afiliado deve possuir conta ativa e verificada na plataforma Queenify;</li>
          <li>Ter capacidade civil plena ou representação legal adequada;</li>
          <li>Fornecer dados cadastrais verdadeiros, completos e atualizados, incluindo dados bancários para recebimento;</li>
          <li>Aceitar integralmente estes Termos de Afiliação, os Termos de Uso e a Política de Privacidade da Queenify;</li>
          <li>A adesão ao programa de afiliados de cada produto está sujeita à aprovação do respectivo Produtor;</li>
          <li>A Queenify reserva-se o direito de recusar ou cancelar o cadastro de Afiliados a qualquer momento, mediante justificativa.</li>
        </ol>

        <h2>3. Regras de Comissão</h2>

        <h3>3.1. Definição de Comissão</h3>
        <ul>
          <li>A comissão é definida exclusivamente pelo Produtor para cada produto;</li>
          <li>O percentual mínimo de comissão é de <strong>30% (trinta por cento)</strong> do valor líquido da venda;</li>
          <li>O percentual máximo é de <strong>85% (oitenta e cinco por cento)</strong> do valor líquido;</li>
          <li>O Produtor pode alterar o percentual de comissão a qualquer momento, sendo a nova taxa aplicável apenas a vendas futuras;</li>
          <li>"Valor líquido" e eventuais descontos devem ser detalhados nas condições comerciais antes da venda; as taxas da plataforma ainda estão em validação.</li>
        </ul>

        <h3>3.2. Atribuição de Vendas</h3>
        <ul>
          <li>A atribuição depende dos registros de rastreamento disponíveis e do provedor de pagamento;</li>
          <li>A Queenify ainda não confirmou prazo de cookie, regra de last-click ou tratamento de vendas sem rastreamento;</li>
          <li>Order bumps, upsells e demais ofertas precisam de validação no fluxo de pagamento antes de receberem comissão.</li>
        </ul>

        <h3>3.3. Pagamento de Comissões</h3>
        <ul>
          <li>Os painéis podem exibir valores registrados, mas o pagamento de comissão ainda não está habilitado para uso comercial;</li>
          <li>Prazo, método, mínimo de saque e regras de estorno não estão confirmados;</li>
          <li>A apuração e os relatórios precisam ser verificados com vendas reais de teste antes do lançamento.</li>
        </ul>

        <h2>4. Obrigações do Afiliado</h2>
        <ol>
          <li>Promover produtos de forma ética, transparente e em conformidade com a legislação brasileira;</li>
          <li>Identificar claramente o caráter publicitário de suas divulgações, conforme o Código de Defesa do Consumidor (arts. 36 e 37) e as diretrizes do CONAR;</li>
          <li>Não fazer promessas falsas, enganosas ou exageradas sobre os produtos promovidos;</li>
          <li>Utilizar exclusivamente os links de afiliado fornecidos pela plataforma para rastreamento;</li>
          <li>Respeitar a identidade visual e as diretrizes de divulgação estabelecidas pelo Produtor;</li>
          <li>Não adulterar, modificar ou redirecionar links de afiliado para fins fraudulentos;</li>
          <li>Manter dados bancários atualizados para recebimento de comissões;</li>
          <li>Cumprir integralmente a LGPD ao coletar ou tratar dados pessoais em suas ações de marketing.</li>
        </ol>

        <h2>5. Práticas Proibidas</h2>
        <p>É expressamente vedado ao Afiliado:</p>

        <h3>5.1. Fraudes e Manipulação</h3>
        <ul>
          <li>Realizar autocompras (comprar através do próprio link de afiliado);</li>
          <li>Utilizar bots, scripts ou qualquer automação para gerar cliques ou vendas artificiais;</li>
          <li>Criar contas falsas para simular vendas ou inflar métricas;</li>
          <li>Manipular cookies de rastreamento para roubar atribuição de outros afiliados;</li>
          <li>Praticar "cookie stuffing" — inserir cookies de afiliado sem interação do usuário;</li>
          <li>Utilizar técnicas de "typosquatting" — registrar domínios similares a marcas para capturar tráfego.</li>
        </ul>

        <h3>5.2. Spam e Comunicações Indesejadas</h3>
        <ul>
          <li>Enviar e-mails em massa não solicitados (spam) contendo links de afiliado;</li>
          <li>Publicar links de afiliado em comentários, fóruns ou redes sociais de forma indiscriminada e não contextual;</li>
          <li>Utilizar mensagens diretas automatizadas (DMs) em redes sociais para divulgação;</li>
          <li>Criar grupos ou listas de transmissão em aplicativos de mensagem exclusivamente para spam de links.</li>
        </ul>

        <h3>5.3. Publicidade Enganosa</h3>
        <ul>
          <li>Utilizar depoimentos falsos, capturas de tela fabricadas ou provas sociais fictícias;</li>
          <li>Garantir resultados financeiros específicos ("ganhe R$10.000 em 7 dias");</li>
          <li>Omitir informações relevantes sobre o produto, como preço, prazo de garantia ou forma de entrega;</li>
          <li>Usar técnicas de "cloaking" para exibir conteúdo diferente para usuários e plataformas;</li>
          <li>Veicular anúncios que simulem notificações de sistema, alertas falsos ou mensagens de urgência fabricadas;</li>
          <li>Criar páginas que imitem a identidade visual da Queenify ou do Produtor sem autorização.</li>
        </ul>

        <h3>5.4. Uso Indevido de Marca</h3>
        <ul>
          <li>Registrar domínios contendo "queenify" ou variações sem autorização;</li>
          <li>Fazer campanhas de anúncios pagos utilizando a marca "Queenify" ou do Produtor como palavra-chave, salvo autorização expressa;</li>
          <li>Criar perfis em redes sociais que se passem pela Queenify ou por Produtores;</li>
          <li>Utilizar logos, materiais visuais ou conteúdos protegidos por direitos autorais sem permissão.</li>
        </ul>

        <h2>6. Obrigações do Produtor</h2>
        <ul>
          <li>Definir percentual de comissão justo e dentro dos limites estabelecidos (30% a 85%);</li>
          <li>Fornecer materiais de divulgação adequados e atualizados aos Afiliados;</li>
          <li>Comunicar alterações de preço, comissão ou condições com antecedência razoável;</li>
          <li>Não rejeitar vendas legítimas de Afiliados por motivos injustificados;</li>
          <li>Garantir a qualidade e entrega do produto conforme anunciado;</li>
          <li>Responder a solicitações de afiliação em até 7 (sete) dias corridos.</li>
        </ul>

        <h2>7. Marketplace de Afiliados</h2>
        <ul>
          <li>O marketplace exibe produtos disponíveis para afiliação com informações como categoria, preço, comissão, avaliação e número de afiliados;</li>
          <li>O Afiliado pode solicitar afiliação a qualquer produto disponível;</li>
          <li>A aprovação é feita exclusivamente pelo Produtor, podendo aceitar ou recusar a seu critério;</li>
          <li>O Produtor pode ativar ou desativar o programa de afiliados para cada produto individualmente;</li>
          <li>Rankings e destaques no marketplace são baseados em desempenho real de vendas.</li>
        </ul>

        <h2>8. Responsabilidade Tributária e Fiscal</h2>
        <ul>
          <li>O Afiliado é o único responsável pelo cumprimento de suas obrigações tributárias perante a Receita Federal e demais órgãos;</li>
          <li>Comissões recebidas constituem renda tributável e devem ser declaradas no Imposto de Renda;</li>
          <li>Afiliados que atuam como pessoa física devem observar os limites de faturamento para obrigatoriedade de registro como MEI ou empresa;</li>
          <li>A Queenify disponibiliza relatórios de comissões para fins de declaração fiscal;</li>
          <li>A Queenify não realiza retenção de impostos na fonte sobre comissões de afiliados.</li>
        </ul>

        <h2>9. Suspensão e Exclusão</h2>

        <h3>9.1. A Queenify ou o Produtor poderão suspender ou excluir o Afiliado nos seguintes casos:</h3>
        <ul>
          <li>Violação de qualquer disposição destes Termos de Afiliação;</li>
          <li>Prática de fraude, manipulação de métricas ou atividades ilegais;</li>
          <li>Recebimento de denúncias fundamentadas de compradores ou Produtores;</li>
          <li>Inatividade superior a 12 (doze) meses consecutivos;</li>
          <li>Determinação judicial ou administrativa;</li>
          <li>Comprometimento da reputação da plataforma ou dos Produtores.</li>
        </ul>

        <h3>9.2. Efeitos da Suspensão/Exclusão</h3>
        <ul>
          <li>Links de afiliado são imediatamente desativados;</li>
          <li>Comissões pendentes e já aprovadas serão pagas normalmente;</li>
          <li>Comissões em período de garantia podem ser retidas até confirmação;</li>
          <li>O Afiliado mantém acesso a relatórios históricos por 90 (noventa) dias;</li>
          <li>Em caso de fraude comprovada, todos os saldos serão retidos e a Queenify reserva-se o direito de buscar reparação por perdas e danos.</li>
        </ul>

        <h2>10. Limitação de Responsabilidade</h2>
        <ul>
          <li>A Queenify atua como intermediadora e não garante volume de vendas ou resultados específicos;</li>
          <li>O Produtor é o único responsável pela qualidade, entrega e suporte do produto;</li>
          <li>O Afiliado é o único responsável por suas ações de divulgação e conteúdo publicado;</li>
          <li>A Queenify não se responsabiliza por disputas entre Produtor e Afiliado que não envolvam a plataforma;</li>
          <li>A responsabilidade total da Queenify está limitada ao valor de comissões efetivamente devidas ao Afiliado.</li>
        </ul>

        <h2>11. Propriedade Intelectual</h2>
        <ul>
          <li>O Afiliado não adquire qualquer direito sobre os produtos promovidos, suas marcas ou conteúdos;</li>
          <li>Materiais de divulgação fornecidos pelo Produtor são licenciados exclusivamente para promoção na Queenify;</li>
          <li>A marca "Queenify" e todos os seus elementos visuais são de propriedade exclusiva da Queenify Tecnologia Ltda.;</li>
          <li>É proibida a reprodução, modificação ou distribuição de materiais da plataforma sem autorização.</li>
        </ul>

        <h2>12. Conformidade Legal</h2>
        <p>Estes Termos foram elaborados em conformidade com:</p>
        <ul>
          <li>Código de Defesa do Consumidor (Lei nº 8.078/1990) — Arts. 36 e 37 (publicidade);</li>
          <li>Marco Civil da Internet (Lei nº 12.965/2014);</li>
          <li>Lei Geral de Proteção de Dados (Lei nº 13.709/2018);</li>
          <li>Código Brasileiro de Autorregulamentação Publicitária (CONAR);</li>
          <li>Código Civil Brasileiro (Lei nº 10.406/2002) — Arts. 710 a 721 (contrato de agência e distribuição);</li>
          <li>Lei de Direitos Autorais (Lei nº 9.610/1998);</li>
          <li>Regulamentações da Receita Federal sobre tributação de rendimentos.</li>
        </ul>

        <h2>13. Alterações nos Termos</h2>
        <p>
          A Queenify reserva-se o direito de atualizar estes Termos de Afiliação a qualquer momento.
          Alterações significativas serão comunicadas com antecedência mínima de 15 (quinze) dias por meio
          de notificação no dashboard e/ou e-mail cadastrado. O uso continuado do programa após a entrada
          em vigor das alterações constitui aceitação dos novos termos.
        </p>

        <h2>14. Disposições Gerais</h2>
        <ul>
          <li>Estes Termos são regidos pelas leis da República Federativa do Brasil;</li>
          <li>Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias;</li>
          <li>A tolerância quanto ao descumprimento de qualquer disposição não constitui renúncia;</li>
          <li>Caso qualquer cláusula seja considerada inválida, as demais permanecerão em pleno vigor;</li>
          <li>A relação entre Afiliado e Queenify <strong>não constitui vínculo empregatício</strong>, sociedade, associação ou representação comercial;</li>
          <li>Estes Termos constituem o acordo integral entre as partes no que diz respeito ao programa de afiliados.</li>
        </ul>

        <h2>15. Contato</h2>
        <p>Para dúvidas sobre o programa de afiliados:</p>
        <ul>
          <li>E-mail: <strong>afiliados@queenify.com.br</strong></li>
          <li>Suporte: <strong>suporte@queenify.com.br</strong></li>
          <li>WhatsApp: Canal oficial</li>
        </ul>

        <p className="text-xs text-muted-foreground mt-10 pt-6 border-t border-border">
          Ao aderir ao programa de afiliados da Queenify, o Afiliado declara estar ciente e de acordo com todos os
          termos e condições descritos neste documento.
        </p>
      </LegalLayout>
    </div>
  </div>
);

export default TermosAfiliados;
