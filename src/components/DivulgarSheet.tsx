import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link2, Copy, Image, FileText, ExternalLink } from "lucide-react";

interface DivulgarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: { nome: string } | null;
}

const checkoutLinks = [
  { id: 1, nome: "Checkout Principal", url: "https://queenify.com/checkout/abc123" },
  { id: 2, nome: "Checkout Promo", url: "https://queenify.com/checkout/promo456" },
];

const materiais = [
  { id: 1, tipo: "Imagem", nome: "Banner 1080x1080", icon: Image },
  { id: 2, tipo: "Imagem", nome: "Stories 1080x1920", icon: Image },
  { id: 3, tipo: "Documento", nome: "Copy de vendas.pdf", icon: FileText },
];

const DivulgarSheet = ({ open, onOpenChange, produto }: DivulgarSheetProps) => {
  const isMobile = useIsMobile();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const content = (
    <div className="flex flex-col gap-6 p-2">
      {/* Checkout Links */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Links de Checkout</p>
        <p className="text-xs text-muted-foreground">Compartilhe estes links para vender seu produto.</p>
        {checkoutLinks.map((link) => (
          <div key={link.id} className="flex items-center gap-2 p-3 bg-secondary/50 border border-border rounded-lg">
            <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground font-medium">{link.nome}</p>
              <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
            </div>
            <button
              onClick={() => handleCopy(link.url, link.id)}
              className={`flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg transition-colors ${
                copiedId === link.id ? "bg-success/20 text-success" : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              <Copy className="w-3 h-3" />
              {copiedId === link.id ? "Copiado!" : "Copiar"}
            </button>
          </div>
        ))}
      </div>

      {/* Materiais de Divulgação */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Materiais de Divulgação</p>
        <p className="text-xs text-muted-foreground">Materiais disponibilizados pelo produtor para divulgação.</p>
        {materiais.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <m.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground font-medium">{m.nome}</p>
              <p className="text-[10px] text-muted-foreground">{m.tipo}</p>
            </div>
            <button className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
              <ExternalLink className="w-3 h-3" /> Baixar
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display">Divulgar — {produto?.nome}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
        <SheetHeader>
          <SheetTitle className="font-display">Divulgar — {produto?.nome}</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
};

export default DivulgarSheet;
