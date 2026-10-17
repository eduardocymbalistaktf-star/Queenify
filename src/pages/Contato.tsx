import LegalLayout from "@/components/LegalLayout";
import { Mail } from "lucide-react";

const channels = [
  { icon: Mail, title: "E-mail de contato", description: "Para questões detalhadas. Não envie senhas, códigos de autenticação ou dados completos de pagamento.", link: "mailto:suporte@queenify.com.br?subject=Ajuda%20Queenify", linkText: "suporte@queenify.com.br", highlight: true },
];

const Contato = () => (
  <LegalLayout title="Contato">
    <p>Entre em contato com a equipe Queenify. Estamos aqui para ajudar produtores, afiliados e compradores.</p>

    <div className="mt-8 grid gap-4">
      {channels.map((ch) => (
        <a key={ch.title} href={ch.link}
          className={`flex items-start gap-4 p-5 rounded-xl border transition-colors ${ch.highlight ? "border-primary/40 bg-primary/[0.04] hover:bg-primary/[0.08]" : "border-border bg-card/50 hover:bg-card"}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ch.highlight ? "bg-primary/20" : "bg-primary/10"}`}>
            <ch.icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground mb-1">{ch.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{ch.description}</p>
            <span className="text-xs font-medium text-primary">{ch.linkText}</span>
          </div>
        </a>
      ))}
    </div>

    <h2>Disponibilidade</h2>
    <p>Os canais automatizados e os prazos de resposta estão em configuração. O envio de e-mail depende da disponibilidade do endereço informado.</p>

    <h2>Para Autoridades e Questões Jurídicas</h2>
    <p>Solicitações oficiais de autoridades públicas devem ser encaminhadas para: <strong>juridico@queenify.com.br</strong></p>

    <h2>Ouvidoria</h2>
    <p>Se sua demanda não foi resolvida pelos canais acima, acesse nossa <a href={`${import.meta.env.BASE_URL}ouvidoria`} className="text-primary hover:underline">Ouvidoria</a>.</p>
  </LegalLayout>
);

export default Contato;
