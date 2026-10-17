import { Link } from "react-router-dom";
import queenifyBee from "@/assets/queenify-bee.png";
import BackButton from "@/components/BackButton";

const LegalLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
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
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold mb-2">{title}</h1>
      <p className="text-xs text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
      <div className="prose prose-sm prose-invert max-w-none space-y-6 text-sm text-muted-foreground leading-relaxed [&_h2]:text-lg [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1">
        {children}
      </div>
    </main>
    <footer className="border-t border-border py-6 text-center">
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Queenify. Todos os direitos reservados.</p>
    </footer>
  </div>
);

export default LegalLayout;
