import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";
import { Search, Filter, CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const produtos = ["Todos", "Curso de Tráfego Pago", "E-book Marketing Digital", "Mentoria VIP"];

const afiliados = [
  { name: "Maria Santos", email: "maria@email.com", badge: "Elite", badgeColor: "bg-primary text-primary-foreground", comissao: "R$ 4.820,50", vendas: 1245, produto: "Curso de Tráfego Pago", status: "ativo" },
  { name: "Lucas Andrade", email: "lucas@email.com", badge: "Pro", badgeColor: "bg-success text-success-foreground", comissao: "R$ 2.450,30", vendas: 870, produto: "E-book Marketing Digital", status: "ativo" },
  { name: "Ana Souza", email: "ana@email.com", badge: "Avançado", badgeColor: "bg-[hsl(25,95%,53%)] text-foreground", comissao: "R$ 1.205,80", vendas: 623, produto: "Curso de Tráfego Pago", status: "ativo" },
  { name: "Pedro Lima", email: "pedro@email.com", badge: "Pro", badgeColor: "bg-success text-success-foreground", comissao: "R$ 980,40", vendas: 410, produto: "Mentoria VIP", status: "ativo" },
  { name: "Carla Mendes", email: "carla@email.com", badge: "Bronze", badgeColor: "bg-muted text-muted-foreground", comissao: "R$ 875,20", vendas: 315, produto: "E-book Marketing Digital", status: "ativo" },
];

const pedidos = [
  { name: "Rafael Costa", email: "rafael@email.com", produto: "Curso de Tráfego Pago", data: "Hoje, 14:30", mensagem: "Tenho experiência com tráfego pago e gostaria de promover seu curso." },
  { name: "Juliana Ferreira", email: "juliana@email.com", produto: "E-book Marketing Digital", data: "Ontem, 09:15", mensagem: "Trabalho com marketing digital há 3 anos e tenho uma audiência qualificada." },
  { name: "Bruno Oliveira", email: "bruno@email.com", produto: "Mentoria VIP", data: "Há 2 dias", mensagem: "Sou mentor e gostaria de indicar sua mentoria para meus alunos." },
];

const AfiliadosGerenciar = () => {
  const [activeTab, setActiveTab] = useState<"afiliados" | "pedidos">("afiliados");
  const [produtoFilter, setProdutoFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [selectedPedido, setSelectedPedido] = useState<typeof pedidos[0] | null>(null);

  const filteredAfiliados = afiliados.filter(a => {
    const matchProduto = produtoFilter === "Todos" || a.produto === produtoFilter;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchProduto && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Gerenciar Afiliados</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus afiliados e aprove novos pedidos.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("afiliados")}
          className={`text-xs px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
            activeTab === "afiliados" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Afiliados Ativos
        </button>
        <button
          onClick={() => setActiveTab("pedidos")}
          className={`text-xs px-4 py-2 rounded-full transition-colors flex items-center gap-2 relative ${
            activeTab === "pedidos" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Pedidos de Afiliação
          {pedidos.length > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">{pedidos.length}</span>
          )}
        </button>
      </div>

      {activeTab === "afiliados" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar afiliado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={produtoFilter}
                onChange={(e) => setProdutoFilter(e.target.value)}
                className="bg-secondary border border-border text-sm text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {produtos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Afiliados List */}
          <div className="space-y-3">
            {filteredAfiliados.map((a) => (
              <div key={a.name} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {a.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground font-medium">{a.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.badgeColor}`}>{a.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.produto}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{a.comissao}</p>
                  <p className="text-xs text-muted-foreground">{a.vendas} vendas</p>
                </div>
              </div>
            ))}
            {filteredAfiliados.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum afiliado encontrado.</div>
            )}
          </div>
        </>
      )}

      {activeTab === "pedidos" && (
        <div className="space-y-3">
          {pedidos.map((p, i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.produto} · {p.data}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPedido(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Ver detalhes
                </button>
                <button className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {pedidos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum pedido pendente.</div>
          )}
        </div>
      )}

      {/* Pedido Detail Sheet */}
      <Sheet open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
        <SheetContent className="sm:max-w-md overflow-auto bg-background border-border">
          <SheetHeader>
            <SheetTitle className="font-display">Pedido de Afiliação</SheetTitle>
          </SheetHeader>
          {selectedPedido && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {selectedPedido.name.charAt(0)}
                </div>
                <div>
                  <p className="text-foreground font-medium">{selectedPedido.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPedido.email}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Produto</p>
                <p className="text-sm text-foreground font-medium">{selectedPedido.produto}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                <p className="text-sm text-foreground">{selectedPedido.mensagem}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Data do pedido</p>
                <p className="text-sm text-foreground">{selectedPedido.data}</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Aceitar
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Recusar
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default AfiliadosGerenciar;
