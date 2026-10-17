// Public Key do Mercado Pago (sandbox).
// Public Keys SÃO seguras no frontend por design — é o token público da aplicação.
// Para LIVE, troque por VITE_MERCADO_PAGO_PUBLIC_KEY_LIVE.
export const MP_PUBLIC_KEY = "TEST-d61c2222-10cc-4b21-9333-265cb8849c02";

let mpInstance: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Carrega o SDK web do Mercado Pago via <script> e inicializa MP.
 * Retorna a instância de MercadoPago para criar card tokens.
 */
export function loadMercadoPago(): Promise<any> {
  if (mpInstance) return Promise.resolve(mpInstance);
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-mp-sdk]");
    const init = () => {
      try {
        // @ts-expect-error - MP é injetado globalmente pelo script
        const MP = window.MercadoPago;
        if (!MP) return reject(new Error("MercadoPago SDK indisponível"));
        mpInstance = new MP(MP_PUBLIC_KEY, { locale: "pt-BR" });
        resolve(mpInstance);
      } catch (e) {
        reject(e);
      }
    };

    if (existing) {
      // @ts-expect-error
      if (window.MercadoPago) init();
      else existing.addEventListener("load", init, { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.dataset.mpSdk = "1";
    s.onload = init;
    s.onerror = () => reject(new Error("Falha ao carregar SDK Mercado Pago"));
    document.head.appendChild(s);
  });

  return initPromise;
}

export interface CardTokenInput {
  cardNumber: string;       // só dígitos
  cardholderName: string;
  cardExpirationMonth: string; // "MM"
  cardExpirationYear: string;  // "YY" ou "YYYY"
  securityCode: string;
  identificationType: "CPF";
  identificationNumber: string; // CPF só dígitos
}

export interface CardTokenResult {
  id: string;                  // card_token
  payment_method_id: string;   // ex: "visa", "master"
  issuer_id?: string;
}

/**
 * Tokeniza dados de cartão no front via SDK MP, e detecta payment_method_id.
 * Retorna { id (card_token), payment_method_id, issuer_id }.
 */
export async function createCardToken(data: CardTokenInput): Promise<CardTokenResult> {
  const mp = await loadMercadoPago();

  // Detecta a bandeira (payment_method_id) a partir do BIN
  const bin = data.cardNumber.slice(0, 8);
  let payment_method_id = "";
  let issuer_id: string | undefined;
  try {
    const pmRes = await mp.getPaymentMethods({ bin });
    const pm = pmRes?.results?.[0];
    if (pm) {
      payment_method_id = pm.id;
      issuer_id = pm.issuer?.id ? String(pm.issuer.id) : undefined;
    }
  } catch (e) {
    console.warn("getPaymentMethods falhou:", e);
  }

  // Cria o token de cartão
  const token = await mp.createCardToken({
    cardNumber: data.cardNumber,
    cardholderName: data.cardholderName,
    cardExpirationMonth: data.cardExpirationMonth,
    cardExpirationYear: data.cardExpirationYear.length === 2
      ? `20${data.cardExpirationYear}`
      : data.cardExpirationYear,
    securityCode: data.securityCode,
    identificationType: data.identificationType,
    identificationNumber: data.identificationNumber,
  });

  if (!token?.id) {
    throw new Error("Não foi possível tokenizar o cartão. Verifique os dados.");
  }

  return {
    id: token.id,
    payment_method_id: payment_method_id || token.payment_method_id || "visa",
    issuer_id,
  };
}
