import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CircleAlert, Mail } from "lucide-react";

interface SolicitarSaqueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SolicitarSaqueSheet = ({ open, onOpenChange }: SolicitarSaqueSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full overflow-y-auto border-border bg-card sm:max-w-lg">
      <SheetHeader>
        <SheetTitle className="text-foreground">Saques</SheetTitle>
      </SheetHeader>
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">Solicitação de saque indisponível</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A Queenify ainda não conclui pagamentos de saque. Não informe sua chave PIX nesta tela. A disponibilidade e os procedimentos serão publicados depois da integração com o provedor financeiro.
            </p>
          </div>
        </div>
        <a href="mailto:suporte@queenify.com.br?subject=Disponibilidade%20de%20saques%20Queenify" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
          <Mail className="h-4 w-4" /> Consultar suporte
        </a>
      </div>
    </SheetContent>
  </Sheet>
);

export default SolicitarSaqueSheet;
