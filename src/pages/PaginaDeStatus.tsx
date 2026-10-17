import LegalLayout from "@/components/LegalLayout";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const services = [
  { name: "Plataforma Queenify", status: "operational" },
  { name: "Checkout / QueeniPay", status: "operational" },
  { name: "Marketplace de Afiliados", status: "operational" },
  { name: "API de Integrações", status: "operational" },
  { name: "Área de Membros", status: "operational" },
  { name: "Dashboard & Relatórios", status: "operational" },
  { name: "Sistema de Notificações", status: "operational" },
  { name: "CDN / Entrega de Conteúdo", status: "operational" },
];

const statusConfig = {
  operational: { icon: CheckCircle, label: "Operacional", color: "text-green-400" },
  degraded: { icon: AlertTriangle, label: "Degradado", color: "text-yellow-400" },
  outage: { icon: XCircle, label: "Indisponível", color: "text-red-400" },
};

const PaginaDeStatus = () => (
  <LegalLayout title="Página de Status">
    <p>Acompanhe em tempo real o status de todos os serviços da Queenify. Esta página é atualizada automaticamente.</p>

    <div className="mt-8 space-y-3">
      {services.map((s) => {
        const cfg = statusConfig[s.status as keyof typeof statusConfig];
        return (
          <div key={s.name} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
            <span className="text-sm font-medium text-foreground">{s.name}</span>
            <div className={`flex items-center gap-2 ${cfg.color}`}>
              <cfg.icon className="w-4 h-4" />
              <span className="text-xs font-semibold">{cfg.label}</span>
            </div>
          </div>
        );
      })}
    </div>

    <h2>Histórico de Incidentes</h2>
    <p>Nenhum incidente registrado nos últimos 90 dias.</p>

    <h2>Manutenção Programada</h2>
    <p>Não há manutenções programadas no momento. Eventuais manutenções serão comunicadas com antecedência mínima de 48 horas por e-mail e avisos na plataforma.</p>

    <h2>Como reportar problemas</h2>
    <p>Se você está enfrentando problemas que não aparecem nesta página, entre em contato pelo WhatsApp ou e-mail <strong>suporte@queenify.com.br</strong>.</p>
  </LegalLayout>
);

export default PaginaDeStatus;
