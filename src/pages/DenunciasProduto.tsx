import LegalLayout from "@/components/LegalLayout";

const DenunciasProduto = () => (
  <LegalLayout title="Denúncias de Produto">
    <h2>1. O que pode ser denunciado</h2>
    <p>A Queenify leva a sério a qualidade e legalidade dos produtos comercializados em sua plataforma. Você pode denunciar produtos que:</p>
    <ul>
      <li>Contenham informações falsas ou enganosas</li>
      <li>Violem direitos autorais ou propriedade intelectual de terceiros</li>
      <li>Promovam atividades ilegais, discriminatórias ou prejudiciais</li>
      <li>Não entreguem o conteúdo prometido na página de vendas</li>
      <li>Utilizem táticas de marketing abusivas ou enganosas</li>
      <li>Violem a <a href={`${import.meta.env.BASE_URL}politica-de-conteudo`} className="text-primary hover:underline">Política de Conteúdo</a> da Queenify</li>
    </ul>

    <h2>2. Como fazer uma denúncia</h2>
    <p>Envie sua denúncia para <strong>denuncias@queenify.com.br</strong> contendo:</p>
    <ol>
      <li>Link do produto denunciado</li>
      <li>Motivo detalhado da denúncia</li>
      <li>Evidências (prints, links, documentos)</li>
      <li>Seus dados de contato (para acompanhamento)</li>
    </ol>

    <h2>3. Processo de Análise</h2>
    <p>Todas as denúncias são analisadas pela equipe de compliance da Queenify em até 5 dias úteis. Durante a análise, o produto pode ser temporariamente suspenso. O denunciante e o produtor serão notificados sobre o resultado.</p>

    <h2>4. Medidas Aplicáveis</h2>
    <ul>
      <li>Notificação e solicitação de adequação ao produtor</li>
      <li>Suspensão temporária do produto</li>
      <li>Remoção definitiva do produto da plataforma</li>
      <li>Suspensão ou encerramento da conta do produtor</li>
      <li>Reembolso aos compradores prejudicados</li>
    </ul>

    <h2>5. Proteção ao Denunciante</h2>
    <p>A identidade do denunciante é mantida em sigilo durante todo o processo. Denúncias de boa-fé não geram penalidades ao denunciante.</p>
  </LegalLayout>
);

export default DenunciasProduto;
