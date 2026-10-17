import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { XCircle, CheckCircle, ExternalLink } from "lucide-react";

interface SolicitarSaqueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pixTypes = ["CPF", "Telefone", "CNPJ", "Chave Aleatória", "E-mail"];

const SolicitarSaqueSheet = ({ open, onOpenChange }: SolicitarSaqueSheetProps) => {
  const [pixType, setPixType] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");

  // Mock verification status
  const verifications = [
    { label: "Cadastrar chave PIX", done: false, action: "Cadastrar PIX" },
    { label: "Verificar documentos (identidade + selfie)", done: false, action: "Verificar Documentos" },
  ];

  const allVerified = verifications.every((v) => v.done);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">Solicitar Saque</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Verificações */}
          <div className="glass-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Verificações necessárias</p>
            {verifications.map((v, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {v.done ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-xs ${v.done ? "text-success" : "text-destructive"}`}>{v.label}</span>
                </div>
                {!v.done && (
                  <button className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {v.action} <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {!allVerified && (
              <p className="text-[10px] text-destructive mt-1">Complete todas as verificações para solicitar um saque.</p>
            )}
            <div className="mt-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-[10px] text-primary font-medium">⏱ Tolerância de processamento: até 15 minutos após a solicitação.</p>
            </div>
          </div>

          {/* Tipo de PIX */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Tipo de chave PIX</label>
            <div className="flex flex-wrap gap-2">
              {pixTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setPixType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    pixType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Chave PIX */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Chave PIX</label>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Digite sua chave PIX"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Quanto deseja sacar?</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="R$ 0,00"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Saldo disponível: R$ 12.450,80</p>
          </div>

          <button
            disabled={!allVerified}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
              allVerified
                ? "gradient-gold text-primary-foreground hover:opacity-90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            Solicitar Saque
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SolicitarSaqueSheet;
