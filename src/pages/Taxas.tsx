import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import queenifyBee from "@/assets/queenify-bee-blue.png";
import BackButton from "@/components/BackButton";

const Taxas = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Queenify — início">
          <img src={queenifyBee} alt="" className="h-8 w-8" />
          <span className="font-display text-xl font-bold">Queenify</span>
        </Link>
        <BackButton fallbackPath="/" />
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="glass-card rounded-3xl p-7 text-center sm:p-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard className="h-7 w-7" />
        </div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Transparência de cobrança
        </p>
        <h1 className="mb-4 text-3xl font-display font-bold sm:text-4xl">Taxas e prazos</h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Estamos validando as condições comerciais e a configuração do provedor de pagamentos. Os percentuais e prazos exibidos em versões anteriores não estão confirmados e foram removidos para evitar informação incorreta.
        </p>
        <div className="mt-7 rounded-2xl border border-border bg-secondary/60 p-4 text-left text-sm leading-relaxed text-muted-foreground">
          Antes de anunciar um produto ou estimar um saque, confirme os custos e os prazos com o suporte Queenify. Uma calculadora só será exibida quando as tarifas forem oficialmente validadas.
        </div>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="mailto:suporte@queenify.com.br?subject=Taxas%20e%20prazos%20Queenify" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            Consultar suporte <ArrowRight className="h-4 w-4" />
          </a>
          <Link to="/faq" className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">Ver perguntas frequentes</Link>
        </div>
      </div>
    </main>

    <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Queenify. Todos os direitos reservados.</footer>
  </div>
);

export default Taxas;
