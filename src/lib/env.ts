export function getHealthStatus() {
  return {
    demo: process.env.SCAMLENS_DEMO_MODE === "true",
    textAi: Boolean(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_MODEL),
    imageAi: Boolean(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_MODEL),
    history: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    sharedRateLimit: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
  };
}

