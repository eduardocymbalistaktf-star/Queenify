import { Globe } from "lucide-react";
import { useAuditEnv } from "@/hooks/useAuditEnv";
import { Link } from "react-router-dom";

interface Props {
  onChange?: (url: string) => void;
}

const AuditEnvSelector = ({ onChange }: Props) => {
  const { envs, activeUrl, setActiveUrl } = useAuditEnv();

  const handle = (url: string) => {
    setActiveUrl(url);
    onChange?.(url);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe className="w-3.5 h-3.5" /> Ambiente:
      </div>
      <div className="flex gap-1 flex-wrap">
        {envs.map(e => (
          <button
            key={e.url}
            onClick={() => handle(e.url)}
            title={e.url}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              activeUrl === e.url
                ? "bg-primary/15 border-primary/30 text-primary"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>
      <Link
        to="/dashboard/audit/headers"
        className="text-[11px] text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
      >
        configurar
      </Link>
    </div>
  );
};

export default AuditEnvSelector;
