import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { Play, BookOpen, Palette, Users, Lock, CheckCircle, GraduationCap } from "lucide-react";
import { useTutorialGuide } from "@/contexts/TutorialGuideContext";

const tutorials = [
  {
    title: "Primeiros Passos na Queenify",
    icon: BookOpen,
    steps: [
      { title: "Criando sua conta", description: "Vá em Configurações > Perfil e preencha seus dados pessoais. Adicione uma foto de perfil profissional.", target: "/configuracoes" },
      { title: "Navegando pelo dashboard", description: "Explore o menu lateral: Dashboard mostra seus números. Clique em cada seção para conhecer.", target: "/dashboard" },
      { title: "Cadastrando seu primeiro produto", description: "Vá em Meus Produtos > clique em 'Novo Produto'. Preencha nome, preço e descrição.", target: "/meus-produtos" },
      { title: "Configurando o checkout", description: "Após criar o produto, acesse os links de checkout. Personalize cores e textos.", target: "/meus-produtos" },
      { title: "Formas de pagamento", description: "Em Configurações > Pagamento, cadastre sua chave PIX e dados bancários para receber.", target: "/configuracoes" },
      { title: "Gerando seu link de venda", description: "No seu produto, clique em 'Divulgar' para copiar o link de checkout.", target: "/meus-produtos" },
      { title: "Primeira venda na prática", description: "Compartilhe seu link nas redes sociais. Acompanhe em tempo real na aba Vendas.", target: "/vendas" },
      { title: "Dicas para iniciantes", description: "Use o Marketplace para se afiliar a outros produtos. Use o Boost para ganhar visibilidade.", target: "/marketplace" },
    ],
  },
  {
    title: "Dominando o Checkout",
    icon: Palette,
    steps: [
      { title: "Cores e branding no checkout", description: "Em Configurações > Aparência, escolha suas cores. Elas serão aplicadas automaticamente ao checkout.", target: "/configuracoes" },
      { title: "Adicionando sua logo", description: "Faça upload da sua logo no perfil. Ela aparecerá no checkout e na página pública.", target: "/configuracoes" },
      { title: "Textos persuasivos", description: "Edite a descrição do produto com gatilhos mentais. Destaque benefícios, não características.", target: "/meus-produtos" },
      { title: "Order bumps", description: "Adicione ofertas complementares no checkout para aumentar o ticket médio.", target: "/meus-produtos" },
      { title: "Teste A/B de checkout", description: "Crie variações do checkout e compare taxas de conversão em Relatórios.", target: "/relatorios" },
      { title: "Otimização para mobile", description: "Teste seu checkout no celular. A maioria dos compradores usa dispositivos móveis.", target: "/meus-produtos" },
    ],
  },
  {
    title: "Estratégias de Afiliados",
    icon: Users,
    steps: [
      { title: "Como funciona o programa de afiliados", description: "Vá em Afiliados para gerenciar. Defina comissões no cadastro do produto.", target: "/afiliados" },
      { title: "Definindo comissões estratégicas", description: "Em Meus Produtos > edite a taxa de comissão. Recomendamos entre 30% e 60%.", target: "/meus-produtos" },
      { title: "Recrutando afiliados de qualidade", description: "Publique seu produto no Marketplace. Afiliados interessados enviarão pedidos.", target: "/marketplace" },
      { title: "Criando materiais de divulgação", description: "Prepare banners, copies e vídeos. Disponibilize na descrição do produto.", target: "/meus-produtos" },
      { title: "Monitorando desempenho", description: "Acompanhe vendas por afiliado em Relatórios > Top Afiliados.", target: "/relatorios" },
    ],
  },
];

const Tutoriais = () => {
  const { startGuide, isStepComplete } = useTutorialGuide();
  const [activeTutorial, setActiveTutorial] = useState(0);

  const current = tutorials[activeTutorial];
  const currentCompleted = current.steps.filter((s) =>
    isStepComplete(activeTutorial, s.title)
  ).length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Tutoriais</h1>
        <p className="text-sm text-muted-foreground">Aprenda a usar a Queenify do zero ao avançado.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="space-y-2">
          {tutorials.map((t, i) => {
            const completed = t.steps.filter((s) => isStepComplete(i, s.title)).length;
            return (
              <button
                key={i}
                onClick={() => setActiveTutorial(i)}
                className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                  activeTutorial === i
                    ? "bg-primary/10 border border-primary/30"
                    : "glass-card hover:border-primary/20"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTutorial === i ? "bg-primary/20" : "bg-secondary"}`}>
                  <t.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.steps.length} passos • {completed}/{t.steps.length} concluídos
                  </p>
                </div>
              </button>
            );
          })}
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <p className="text-sm font-display font-semibold text-foreground">Aulas Queenify</p>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Aprenda o básico sobre marketing digital.</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Em breve</span>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <current.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground">{current.title}</h2>
                  <p className="text-xs text-muted-foreground">{current.steps.length} passos</p>
                </div>
              </div>
              {current.steps.length > 0 && (
                <button
                  onClick={() => startGuide(current, activeTutorial)}
                  className="flex items-center gap-2 px-4 py-2 gradient-gold rounded-lg text-sm font-semibold text-primary-foreground"
                >
                  <Play className="w-4 h-4" /> Iniciar Tutorial Guiado
                </button>
              )}
            </div>

            <div className="space-y-2">
              {current.steps.map((step, i) => {
                const complete = isStepComplete(activeTutorial, step.title);
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      complete
                        ? "border-success/30 bg-success/5"
                        : "border-border hover:border-primary/20 hover:bg-secondary/30"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${complete ? "bg-success/20" : "bg-secondary"}`}>
                      {complete ? <CheckCircle className="w-4 h-4 text-success" /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${complete ? "text-success line-through" : "text-foreground"}`}>{step.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{step.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex-shrink-0">
                      {step.target}
                    </span>
                  </div>
                );
              })}
            </div>

            {current.steps.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  Progresso: {currentCompleted}/{current.steps.length} passos concluídos
                </p>
                <div className="w-full h-2 rounded-full bg-secondary mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(currentCompleted / current.steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Tutoriais;
