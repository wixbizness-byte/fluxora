import DashboardClient from "./dashboard-client";
import LoginCard from "./login-card";
import { isConfigured } from "../lib/config";
import { hasSession } from "../lib/session";
export const dynamic = "force-dynamic";
export default async function Home() {
  const configured = isConfigured();
  const signedIn = configured ? await hasSession() : false;
  return signedIn ? <DashboardClient /> : <LoginCard configured={configured} />;
}
