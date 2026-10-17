import { Link } from "react-router-dom";
import { FileText, Shield, CreditCard, Scale, Monitor, Megaphone, Users, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";

const termos = [
  { icon: Scale, label: "Termos de Uso", path: "/termos-de-uso", desc: "Regras gerais da plataforma" },
  { icon: Shield, label: "Política de Privacidade", path: "/politica-de-privacidade", desc: "Como tratamos seus dados (LGPD)" },
  { icon: FileText, label: "Política de Conteúdo", path: "/politica-de-conteudo", desc: "Regras sobre conteúdo permitido" },
  { icon: Monitor, label: "Licença de Software", path: "/licenca-de-software", desc: "Termos de uso do software" },
  { icon: CreditCard, label: "Termos QueeniPay", path: "/termos-queenipay", desc: "Regras do sistema de pagamento" },
  { icon: CreditCard, label: "Termos da Conta Digital", path: "/termos-conta-digital", desc: "Regras da conta digital" },
  { icon: Megaphone, label: "Termos de Anúncios", path: "/termos-anuncios", desc: "Política de publicidade" },
  { icon: Users, label: "Termos de Afiliados", path: "/termos-afiliados", desc: "Regras do programa de afiliados" },
];

const Termos = () => (
  <DashboardLayout>
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-foreground mb-1">Termos e Políticas</h1>
      <p className="text-sm text-muted-foreground mb-6">Documentos legais da plataforma Queenify</p>

      <div className="grid gap-3">
        {termos.map(({ icon: Icon, label, path, desc }) => (
          <Link
            key={path}
            to={path}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all group"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </Link>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default Termos;
