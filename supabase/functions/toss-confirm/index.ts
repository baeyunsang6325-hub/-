// 토스페이먼츠 결제 승인 (Supabase Edge Function)
// 필요한 시크릿:  supabase secrets set TOSS_SECRET_KEY=test_gsk_...
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 Supabase가 자동 제공)
import { createClient } from "npm:@supabase/supabase-js@2";

const MEMBERSHIP_FEE = 100000; // 클라이언트 금액 조작 방지를 위해 서버에서 고정

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  const secretKey = Deno.env.get("TOSS_SECRET_KEY");
  if (!secretKey) return json({ ok: false, message: "서버에 TOSS_SECRET_KEY가 설정되지 않았습니다." }, 500);

  let paymentKey: string, orderId: string, amount: number;
  try {
    ({ paymentKey, orderId, amount } = await req.json());
  } catch {
    return json({ ok: false, message: "잘못된 요청입니다." }, 400);
  }
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return json({ ok: false, message: "결제 정보가 누락되었습니다." }, 400);
  }
  if (amount !== MEMBERSHIP_FEE) {
    return json({ ok: false, message: "결제 금액이 회비와 일치하지 않습니다." }, 400);
  }

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(secretKey + ":"),
      "Content-Type": "application/json",
      "Idempotency-Key": orderId,
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const payment = await res.json();

  if (!res.ok) {
    return json({ ok: false, code: payment.code, message: payment.message ?? "결제 승인에 실패했습니다." }, 400);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error } = await supabase.from("payments").upsert({
    order_id: payment.orderId,
    payment_key: payment.paymentKey,
    order_name: payment.orderName,
    amount: payment.totalAmount,
    method: payment.method,
    status: payment.status,
    approved_at: payment.approvedAt,
    raw: payment,
  }, { onConflict: "order_id" });
  if (error) console.error("payments insert failed", error); // 결제 자체는 승인됨 — 로그로 추적

  return json({ ok: true, orderId: payment.orderId, amount: payment.totalAmount, method: payment.method });
});
