import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle, ShoppingCart, CreditCard, Users, Shield, Settings, Smartphone, Headphones } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import BackButton from "@/components/BackButton";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

type FaqCategory = {
  name: string;
  icon: any;
  questions: { q: string; a: string }[];
};

const categories: FaqCategory[] = [
  {
    name: "Começando",
    icon: HelpCircle,
    questions: [
      { q: "Preciso pagar para começar a usar a Queenify?", a: "A Queenify não anuncia uma mensalidade nesta página. Custos por venda e condições comerciais devem ser confirmados com o suporte antes de divulgar seu produto." },
      { q: "Como crio minha conta?", a: "Clique em 'Cadastrar agora', preencha seus dados (nome, e-mail, senha) e confirme seu e-mail. Em poucos minutos, você terá acesso completo ao dashboard." },
      { q: "Que tipo de produto posso vender?", a: "Qualquer produto digital: cursos online, e-books, mentorias, templates, softwares, áreas de membros, podcasts premium, e mais. Produtos físicos não são suportados no momento." },
      { q: "Preciso ter CNPJ para vender?", a: "Não. Você pode vender como pessoa física (CPF) ou jurídica (CNPJ). Para saques, basta ter uma conta bancária ou chave PIX vinculada ao seu CPF/CNPJ." },
    ],
  },
  {
    name: "Vendas e Checkout",
    icon: ShoppingCart,
    questions: [
      { q: "Como personalizo o checkout do meu produto?", a: "No dashboard, acesse 'Meus Produtos', selecione o produto e vá na aba de Checkout. Lá você pode alterar cores, adicionar sua logo, customizar textos e até adicionar order bumps." },
      { q: "O checkout funciona no celular?", a: "Sim! O checkout da Queenify é 100% responsivo e otimizado para dispositivos móveis. Seus clientes podem comprar de qualquer lugar." },
      { q: "Quais formas de pagamento são aceitas?", a: "O checkout está sendo integrado ao Mercado Pago. As formas disponíveis para uma compra são as que aparecem no checkout desse produto; confirme a configuração da conta antes de anunciar PIX, cartão ou boleto." },
      { q: "Como funciona o Vendas 1-Click?", a: "A finalização de compras com um clique ainda não está disponível. O checkout pode preencher nome e e-mail, mas o cliente precisa concluir a etapa de pagamento." },
    ],
  },
  {
    name: "Pagamentos e Saques",
    icon: CreditCard,
    questions: [
      { q: "Qual a taxa por venda?", a: "As tarifas definitivas dependem das condições comerciais e do meio de pagamento configurado. Confirme os valores diretamente com o suporte antes de precificar ou anunciar um produto." },
      { q: "Em quanto tempo recebo meu dinheiro?", a: "O prazo depende do provedor e da modalidade da transação. A QueenIA não consegue consultar sua conta ou confirmar um prazo individual; peça a confirmação ao suporte." },
      { q: "Como funciona o saque?", a: "Abra Financeiro no dashboard para ver as opções habilitadas para sua conta. Se a solicitação de saque não estiver disponível, fale com suporte@queenify.com.br." },
      { q: "Existe valor mínimo para saque?", a: "O valor mínimo e os limites dependem das regras de saque habilitadas para sua conta. Confirme com o suporte antes de movimentar seu saldo." },
      { q: "O que é o Escrow?", a: "A retenção e a liberação dos valores dependem do provedor de pagamento e das regras comerciais configuradas. Confirme a política oficial com o suporte antes de prometer um prazo de liberação." },
    ],
  },
  {
    name: "Afiliados",
    icon: Users,
    questions: [
      { q: "Como funciona o programa de afiliados?", a: "Ao cadastrar um produto, você define a porcentagem de comissão para afiliados. Eles encontram seu produto no Marketplace de Afiliados e solicitam afiliação. Após aprovação, recebem um link único de divulgação." },
      { q: "Posso escolher quem se afilia ao meu produto?", a: "Sim! Você pode definir afiliação automática (qualquer pessoa pode se afiliar) ou manual (você aprova cada solicitação). Também pode definir requisitos mínimos." },
      { q: "Como o afiliado recebe a comissão?", a: "A comissão é calculada automaticamente em cada venda. O afiliado pode sacar pelo seu próprio dashboard seguindo as mesmas regras de prazo." },
      { q: "O que é co-produção?", a: "Co-produção permite que dois ou mais produtores dividam automaticamente a receita de um produto. Ideal para parcerias e colaborações." },
    ],
  },
  {
    name: "Segurança",
    icon: Shield,
    questions: [
      { q: "Meus dados estão seguros?", a: "A Queenify usa autenticação da Supabase e mantém controles de acesso no banco. Não afirmamos criptografia ponta a ponta nem certificação PCI DSS própria. Nunca compartilhe senha, código de autenticação ou dados completos do cartão no suporte." },
      { q: "Como funciona o reembolso?", a: "A solicitação e o processamento de reembolso dependem do meio de pagamento e das regras do pedido. Não prometemos reembolso automático; fale com suporte@queenify.com.br para confirmar o procedimento." },
      { q: "O que acontece se meu produto for denunciado?", a: "Nossa equipe analisa cada denúncia individualmente. Se o produto violar as políticas da plataforma (plágio, conteúdo proibido), ele pode ser removido. Você será notificado e terá a chance de se manifestar." },
    ],
  },
  {
    name: "Conta e Configurações",
    icon: Settings,
    questions: [
      { q: "Como altero meus dados de pagamento?", a: "No dashboard, vá em 'Configurações' > aba 'Financeiro'. Lá você pode atualizar sua chave PIX, dados bancários e informações de cobrança." },
      { q: "Posso ter mais de um produto?", a: "Sim! Não há limite de produtos. Você pode criar quantos produtos quiser, cada um com seu próprio checkout, preço e configurações de afiliados." },
      { q: "Como funciona o perfil público?", a: "Seu perfil público mostra seus produtos, nível na plataforma e informações que você escolher compartilhar. Você pode personalizá-lo em 'Configurações' > 'Perfil'." },
    ],
  },
  {
    name: "App Mobile",
    icon: Smartphone,
    questions: [
      { q: "Existe um app da Queenify?", a: "O app mobile da Queenify está em desenvolvimento. Em breve você poderá acompanhar vendas, receber notificações e gerenciar produtos direto do celular." },
      { q: "Posso acessar o dashboard pelo celular?", a: "Sim! O dashboard da Queenify é totalmente responsivo e funciona perfeitamente em qualquer navegador mobile." },
    ],
  },
];

const FAQ = () => {
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("Começando");
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");

  const currentCat = categories.find((c) => c.name === activeCategory)!;

  const filteredQuestions = search.trim()
    ? categories.flatMap((c) => c.questions.filter((q) => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())))
    : currentCat.questions;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo size="small" />
            <span className="font-display text-xl font-bold">Queenify</span>
          </Link>
          <BackButton fallbackPath="/" />
        </div>
      </header>

      <section className="py-16 px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-display font-bold mb-4">
            Perguntas <span className="text-primary">Frequentes</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto mb-8">
            Encontre respostas para as dúvidas mais comuns sobre a Queenify.
          </motion.p>
          <motion.div variants={fadeUp} className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar pergunta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </motion.div>
        </motion.div>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {!search.trim() && (
            <div className="flex gap-2 flex-wrap mb-8 justify-center">
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setActiveCategory(c.name); setOpenQ(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                    activeCategory === c.name ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <c.icon className="w-3 h-3" />
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {filteredQuestions.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
                <button onClick={() => setOpenQ(openQ === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                  <motion.div animate={{ rotate: openQ === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openQ === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-5 pb-5"><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma pergunta encontrada. Tente outro termo.</p>
            </div>
          )}

          {/* Support button */}
          <div className="text-center mt-10">
            <p className="text-sm text-muted-foreground mb-4">Não encontrou o que procurava?</p>
            <a
              href="mailto:suporte@queenify.com.br?subject=Ajuda%20Queenify"
              className="inline-flex items-center gap-2 px-6 py-3 gradient-gold rounded-xl text-sm font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/20"
            >
              <Headphones className="w-4 h-4" /> Falar com o Suporte
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Queenify. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default FAQ;
