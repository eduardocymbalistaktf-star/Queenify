import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle, ShoppingCart, CreditCard, Users, Shield, Settings, Smartphone, Headphones } from "lucide-react";
import queenifyBee from "@/assets/queenify-bee.png";
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
      { q: "Preciso pagar para começar a usar a Queenify?", a: "Não. Criar sua conta é 100% gratuito. Você pode cadastrar seus produtos e configurar todo o checkout sem nenhum custo. A Queenify só cobra uma taxa quando uma venda é realizada e aprovada." },
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
      { q: "Quais formas de pagamento são aceitas?", a: "PIX (aprovação instantânea), Cartão de Crédito (parcelamento em até 12x), e Boleto Bancário. Todas as formas estão disponíveis automaticamente." },
      { q: "Como funciona o Vendas 1-Click?", a: "Quando um comprador salva os dados do cartão em qualquer checkout da Queenify, ele pode finalizar compras futuras com um único clique, sem precisar preencher dados novamente." },
    ],
  },
  {
    name: "Pagamentos e Saques",
    icon: CreditCard,
    questions: [
      { q: "Qual a taxa por venda?", a: "PIX: 6,99% + R$1,49 por venda aprovada. Cartão e Boleto: 7,99% + R$1,49. Não há mensalidades, taxas de adesão ou custos ocultos." },
      { q: "Em quanto tempo recebo meu dinheiro?", a: "PIX e Boleto: 2 dias úteis. Cartão de Crédito: 2 a 15 dias (com opção de antecipação para 2 dias mediante taxa adicional de 3,49%)." },
      { q: "Como funciona o saque?", a: "No dashboard, vá em 'Financeiro' > 'Solicitar Saque'. Escolha o valor e confirme. O dinheiro é enviado via PIX para a chave cadastrada." },
      { q: "Existe valor mínimo para saque?", a: "Sim, o valor mínimo para saque é R$20,00. Não há limite máximo." },
      { q: "O que é o Escrow?", a: "O Escrow é um sistema de proteção que retém o valor da venda durante o período de garantia do produto. Após expirar a garantia sem pedido de reembolso, o valor é liberado automaticamente." },
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
      { q: "Meus dados estão seguros?", a: "Sim. Utilizamos criptografia de ponta a ponta, autenticação de dois fatores (2FA), e estamos em conformidade com PCI DSS para processamento de pagamentos." },
      { q: "Como funciona o reembolso?", a: "Se o comprador solicitar reembolso dentro do prazo de garantia definido por você (7, 15 ou 30 dias), o valor é devolvido automaticamente. Você pode analisar cada caso no painel de vendas." },
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
            <img src={queenifyBee} alt="Queenify" className="w-8 h-8" />
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
