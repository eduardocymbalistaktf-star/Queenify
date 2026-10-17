import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Zap, Clock, ShieldCheck, ArrowRight, CheckCircle, HelpCircle, Calculator, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import queenifyBee from "@/assets/queenify-bee.png";
import BackButton from "@/components/BackButton";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const paymentMethods = [
  { method: "PIX", fee: "6,99% + R$1,49", rate: 0.0699, fixed: 1.49, release: "2 dias úteis", icon: Zap, highlight: true },
  { method: "Boleto Bancário", fee: "7,99% + R$1,49", rate: 0.0799, fixed: 1.49, release: "2 dias úteis", icon: Clock },
  { method: "Cartão à Vista", fee: "7,99% + R$1,49", rate: 0.0799, fixed: 1.49, release: "2 a 15 dias", icon: CreditCard },
  { method: "Cartão Parcelado", fee: "7,99% + R$1,49 + juros", rate: 0.0799, fixed: 1.49, release: "2 a 15 dias", icon: CreditCard, note: "Juros repassados ao comprador" },
];

const included = [
  "Checkout personalizado com sua marca",
  "Área de membros completa",
  "Sistema de afiliados integrado",
  "Marketplace de afiliados",
  "Suporte 7 dias por semana",
  "Relatórios e analytics detalhados",
  "Co-produção com divisão automática",
  "Notificações em tempo real",
  "Saque rápido via PIX",
  "Gerenciador de Anúncios (em breve)",
];

const chartData = [
  { name: "Queenify", taxa: 6.99, fill: "hsl(var(--primary))" },
  { name: "Kiwify", taxa: 8.99, fill: "hsl(var(--muted-foreground) / 0.5)" },
  { name: "Hotmart", taxa: 9.90, fill: "hsl(var(--muted-foreground) / 0.5)" },
  { name: "Eduzz", taxa: 8.50, fill: "hsl(var(--muted-foreground) / 0.5)" },
  { name: "Monetizze", taxa: 12.00, fill: "hsl(var(--muted-foreground) / 0.5)" },
];

const comparisons = [
  { platform: "Queenify", fee: "A partir de 6,99%", pixRelease: "2 dias", cardRelease: "2-15 dias", highlight: true },
  { platform: "Concorrente A", fee: "9,90% + R$1,00", pixRelease: "14 dias", cardRelease: "30 dias" },
  { platform: "Concorrente B", fee: "7,99% + R$2,49", pixRelease: "7 dias", cardRelease: "30 dias" },
  { platform: "Concorrente C", fee: "12,00%", pixRelease: "2 dias", cardRelease: "30 dias" },
];

const Taxas = () => {
  const [calcValue, setCalcValue] = useState("");
  const saleValue = parseFloat(calcValue) || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={queenifyBee} alt="Queenify" className="w-8 h-8" />
            <span className="font-display text-xl font-bold">Queenify</span>
          </Link>
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <Link to="/signup" className="px-4 py-2 text-sm font-semibold gradient-gold rounded-lg text-primary-foreground">Cadastrar</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Transparência total
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl font-display font-bold mb-4">
            Você só paga se <span className="text-primary">vender</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Sem mensalidades, sem taxas de adesão, sem surpresas. Cadastre-se gratuitamente e pague apenas uma taxa por venda aprovada.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="glass-card p-6 border-primary/30 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">PIX</p>
              <div className="text-3xl font-display font-bold text-primary">6,99%</div>
              <p className="text-xs text-muted-foreground mt-1">+ R$1,49 por venda</p>
            </div>
            <div className="glass-card p-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cartão</p>
              <div className="text-3xl font-display font-bold text-foreground">7,99%</div>
              <p className="text-xs text-muted-foreground mt-1">+ R$1,49 por venda</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Payment methods */}
      <section className="py-16 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-5xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-display font-bold text-center mb-10">
            Taxas por Método de Pagamento
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((pm) => (
              <motion.div key={pm.method} variants={fadeUp} className={`glass-card p-6 text-center ${pm.highlight ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
                <pm.icon className={`w-8 h-8 mx-auto mb-3 ${pm.highlight ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-display font-bold text-foreground mb-2">{pm.method}</h3>
                <p className="text-xl font-bold text-primary mb-1">{pm.fee}</p>
                <p className="text-xs text-muted-foreground">Liberação: {pm.release}</p>
                {pm.note && <p className="text-[10px] text-muted-foreground mt-1 italic">{pm.note}</p>}
                {pm.highlight && <span className="inline-block mt-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">Menor taxa</span>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Calculator */}
      <section className="py-16 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-center">Calculadora de Taxas</h2>
          </motion.div>
          <motion.p variants={fadeUp} className="text-sm text-muted-foreground text-center mb-8">
            Simule quanto você recebe por venda em cada método de pagamento
          </motion.p>

          <motion.div variants={fadeUp} className="glass-card p-6 mb-6">
            <label className="text-sm text-muted-foreground mb-2 block">Valor do produto (R$)</label>
            <input
              type="number"
              value={calcValue}
              onChange={(e) => setCalcValue(e.target.value)}
              placeholder="Ex: 197,00"
              className="w-full bg-secondary rounded-lg px-4 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </motion.div>

          {saleValue > 0 && (
            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.filter(pm => pm.method !== "Cartão Parcelado").map((pm) => {
                const fee = saleValue * pm.rate + pm.fixed;
                const net = saleValue - fee;
                return (
                  <div key={pm.method} className={`glass-card p-5 ${pm.highlight ? "border-primary/30" : ""}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <pm.icon className={`w-4 h-4 ${pm.highlight ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-semibold text-foreground">{pm.method}</span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor da venda</span>
                        <span className="text-foreground">R$ {saleValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa Queenify</span>
                        <span className="text-destructive">− R$ {fee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border pt-1.5 flex justify-between">
                        <span className="font-semibold text-foreground">Você recebe</span>
                        <span className="font-bold text-primary text-lg">R$ {net.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {saleValue > 0 && (
            <motion.p variants={fadeUp} className="text-[11px] text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
              <Receipt className="w-3 h-3" />
              No cartão parcelado, os juros são repassados ao comprador — você recebe o mesmo valor do cartão à vista.
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* What's included */}
      <section className="py-16 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-display font-bold text-center mb-10">
            O que está incluso na taxa
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {included.map((item) => (
              <motion.div key={item} variants={fadeUp} className="flex items-center gap-3 glass-card p-4">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Chart comparison */}
      <section className="py-16 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-display font-bold text-center mb-3">
            Compare e escolha
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm text-muted-foreground text-center mb-10">
            Taxa mínima por venda aprovada (%) — quanto menor, melhor para você
          </motion.p>

          <motion.div variants={fadeUp} className="glass-card p-6 mb-10">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 14]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="category" dataKey="name" width={90} stroke="hsl(var(--muted-foreground))" fontSize={13} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Taxa"]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "13px" }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  itemStyle={{ color: "hsl(var(--muted-foreground))" }}
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                />
                <Bar dataKey="taxa" radius={[0, 6, 6, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-muted-foreground text-center mt-2">* Valores aproximados com base em informações públicas. Taxas podem variar conforme volume e plano.</p>
          </motion.div>

          {/* Table */}
          <motion.div variants={fadeUp} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-display font-bold text-muted-foreground">Plataforma</th>
                  <th className="text-center py-3 px-4 font-display font-bold text-muted-foreground">Taxa</th>
                  <th className="text-center py-3 px-4 font-display font-bold text-muted-foreground">PIX</th>
                  <th className="text-center py-3 px-4 font-display font-bold text-muted-foreground">Cartão</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c) => (
                  <tr key={c.platform} className={`border-b border-border ${c.highlight ? "bg-primary/5" : ""}`}>
                    <td className={`py-3 px-4 font-semibold ${c.highlight ? "text-primary" : "text-foreground"}`}>{c.platform}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{c.fee}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{c.pixRelease}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{c.cardRelease}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ pricing */}
      <section className="py-16 px-4 border-t border-border">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Dúvidas sobre taxas?</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-xl font-display font-bold mb-4">
            Ainda tem perguntas?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm text-muted-foreground mb-6">
            Acesse nossa Central de Ajuda ou fale com nosso suporte via WhatsApp.
          </motion.p>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
            <Link to="/ajuda" className="px-6 py-2.5 gradient-gold rounded-xl text-sm font-bold text-primary-foreground hover:opacity-90 transition-all">Central de Ajuda</Link>
            <Link to="/faq" className="px-6 py-2.5 glass-card text-sm font-semibold text-foreground hover:border-primary/30 transition-colors flex items-center gap-2">
              FAQ <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">Pronto para começar?</h2>
          <p className="text-muted-foreground mb-6">Crie sua conta gratuitamente e comece a vender hoje mesmo.</p>
          <Link to="/signup" className="inline-flex px-8 py-3.5 gradient-gold rounded-xl text-base font-bold text-primary-foreground hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/20">
            Cadastrar agora
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Queenify. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Taxas;
