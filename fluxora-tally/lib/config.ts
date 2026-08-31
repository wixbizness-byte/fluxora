const DEFAULT_SUPABASE_URL = "https://qglayytocxhnbqmjkwnc.supabase.co";
export function getRuntimeConfig() {
  return {
    sitePassword: process.env.SITE_PASSWORD?.trim() ?? "",
    sessionSecret: process.env.SESSION_SECRET?.trim() ?? "",
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
    supabaseUrl: process.env.SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL,
  };
}
export function isConfigured() {
  const config = getRuntimeConfig();
  return Boolean(config.sitePassword && config.sessionSecret && config.supabaseSecretKey);
}
