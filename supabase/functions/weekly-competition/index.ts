import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const secret = Deno.env.get("WEEKLY_COMPETITION_SECRET");
  const supplied = req.headers.get("x-cron-secret") || "";
  if (!secret) return new Response("Scheduled job is not configured", { status: 503, headers: corsHeaders });
  const expectedBytes = new TextEncoder().encode(secret);
  const suppliedBytes = new TextEncoder().encode(supplied);
  if (expectedBytes.length !== suppliedBytes.length) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }
  let mismatch = 0;
  for (let i = 0; i < expectedBytes.length; i++) mismatch |= expectedBytes[i] ^ suppliedBytes[i];
  if (mismatch !== 0) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Calculate current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    // Previous week
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
    const prevWeekEnd = new Date(weekStart);

    const weekStartStr = prevWeekStart.toISOString().split("T")[0];

    // Check if we already processed this week
    const { data: existing } = await supabase
      .from("weekly_competitions")
      .select("id")
      .eq("week_start", weekStartStr)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Already processed", week: weekStartStr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all completed sales from last week
    const { data: sales } = await supabase
      .from("sales")
      .select("user_id, product_id, amount")
      .eq("status", "completed")
      .gte("sold_at", prevWeekStart.toISOString())
      .lt("sold_at", prevWeekEnd.toISOString());

    if (!sales || sales.length === 0) {
      return new Response(JSON.stringify({ message: "No sales last week", week: weekStartStr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate by user
    const userSales: Record<string, { totalAmount: number; totalCount: number; topProduct: string; productAmounts: Record<string, number> }> = {};
    for (const sale of sales) {
      if (!userSales[sale.user_id]) {
        userSales[sale.user_id] = { totalAmount: 0, totalCount: 0, topProduct: "", productAmounts: {} };
      }
      userSales[sale.user_id].totalAmount += Number(sale.amount);
      userSales[sale.user_id].totalCount += 1;
      userSales[sale.user_id].productAmounts[sale.product_id] = (userSales[sale.user_id].productAmounts[sale.product_id] || 0) + Number(sale.amount);
    }

    // Find top product per user
    for (const uid of Object.keys(userSales)) {
      const prods = userSales[uid].productAmounts;
      userSales[uid].topProduct = Object.entries(prods).sort((a, b) => b[1] - a[1])[0][0];
    }

    // Check eligibility: only Gold (100k+) and Crown (500k+), and not on cooldown
    const eligibleUsers: string[] = [];
    for (const uid of Object.keys(userSales)) {
      // Check total lifetime sales for level
      const { data: allSales } = await supabase
        .from("sales")
        .select("amount")
        .eq("user_id", uid)
        .eq("status", "completed");

      const totalRevenue = (allSales || []).reduce((sum, s) => sum + Number(s.amount), 0);
      if (totalRevenue < 100000) continue; // Must be Gold or Crown

      // Check cooldown
      const { data: stats } = await supabase
        .from("user_competition_stats")
        .select("cooldown_until")
        .eq("user_id", uid)
        .maybeSingle();

      if (stats?.cooldown_until) {
        const cooldownDate = new Date(stats.cooldown_until);
        if (cooldownDate > prevWeekStart) continue; // Still on cooldown
      }

      eligibleUsers.push(uid);
    }

    if (eligibleUsers.length === 0) {
      return new Response(JSON.stringify({ message: "No eligible users", week: weekStartStr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find winner (highest sales amount among eligible)
    let winnerId = eligibleUsers[0];
    for (const uid of eligibleUsers) {
      if (userSales[uid].totalAmount > userSales[winnerId].totalAmount) {
        winnerId = uid;
      }
    }

    const winnerData = userSales[winnerId];
    const totalRevenue = await (async () => {
      const { data } = await supabase.from("sales").select("amount").eq("user_id", winnerId).eq("status", "completed");
      return (data || []).reduce((s, r) => s + Number(r.amount), 0);
    })();
    const level = totalRevenue >= 500000 ? "Crown" : "Gold";

    // Insert competition record
    await supabase.from("weekly_competitions").insert({
      week_start: weekStartStr,
      winner_user_id: winnerId,
      winner_product_id: winnerData.topProduct,
      total_sales_count: winnerData.totalCount,
      total_sales_amount: winnerData.totalAmount,
      stars_earned: 1,
      boost_awarded: true,
    });

    // Update or create competition stats
    const { data: existingStats } = await supabase
      .from("user_competition_stats")
      .select("*")
      .eq("user_id", winnerId)
      .maybeSingle();

    const newCooldown = new Date(weekStart);
    newCooldown.setUTCDate(newCooldown.getUTCDate() + 7); // Cooldown for next week
    const cooldownStr = newCooldown.toISOString().split("T")[0];

    if (existingStats) {
      const newStars = existingStats.total_stars + 1;
      await supabase.from("user_competition_stats").update({
        total_stars: newStars,
        has_top1_badge: newStars >= 5,
        cooldown_until: cooldownStr,
        level_at_win: level,
      }).eq("user_id", winnerId);
    } else {
      await supabase.from("user_competition_stats").insert({
        user_id: winnerId,
        total_stars: 1,
        has_top1_badge: false,
        cooldown_until: cooldownStr,
        level_at_win: level,
      });
    }

    // Award 7-day boost
    const boostEnd = new Date();
    boostEnd.setUTCDate(boostEnd.getUTCDate() + 7);
    await supabase.from("boost_purchases").insert({
      user_id: winnerId,
      plan_id: "7d",
      product_id: winnerData.topProduct,
      price_paid: 0,
      starts_at: new Date().toISOString(),
      ends_at: boostEnd.toISOString(),
      auto_renew: false,
      payment_method: "competition",
      renewal_status: "active",
    });

    // Create notification for winner
    await supabase.from("notifications").insert({
      user_id: winnerId,
      title: "🏆 Parabéns! Você é o Top 1 da semana!",
      message: `Você conquistou o Top 1 em vendas com R$ ${winnerData.totalAmount.toFixed(2)}! Ganhou um Boost de 7 dias e +1 estrela.`,
      type: "competition",
    });

    return new Response(JSON.stringify({
      success: true,
      week: weekStartStr,
      winner: winnerId,
      totalAmount: winnerData.totalAmount,
      stars: (existingStats?.total_stars || 0) + 1,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
