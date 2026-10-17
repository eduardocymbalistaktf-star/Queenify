import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useSales } from "@/hooks/useSupabaseData";

interface AllAfiliadosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AllAfiliadosSheet = ({ open, onOpenChange }: AllAfiliadosSheetProps) => {
  const { data: sales = [], isLoading } = useSales();

  const afiliados = useMemo(() => {
    const map: Record<string, { vendas: number; comissao: number }> = {};
    sales.filter((s: any) => s.affiliate_name && s.status === "completed").forEach((s: any) => {
      const name = s.affiliate_name!;
      if (!map[name]) map[name] = { vendas: 0, comissao: 0 };
      map[name].vendas += 1;
      map[name].comissao += Number(s.commission_amount || 0);
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b.comissao - a.comissao)
      .map(([name, data]) => ({ name, ...data }));
  }, [sales]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
        <SheetHeader>
          <SheetTitle className="font-display">Todos os Afiliados</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : afiliados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum afiliado encontrado.</p>
          ) : (
            afiliados.map((a, i) => (
              <div key={a.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-sm text-foreground font-medium">{a.name}</span>
                    <p className="text-xs text-muted-foreground">
                      R$ {a.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">{a.vendas}</span>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AllAfiliadosSheet;
