import { redirect } from "next/navigation";
import { MFASetup } from "@/components/auth/MFASetup";
import { SSOButton } from "@/components/auth/SSOButton";
import { AdminScreen } from "@/components/modules/AdminScreen";
import { AIScreen } from "@/components/modules/AIScreen";
import { BillingScreen } from "@/components/modules/BillingScreen";
import { DashboardScreen } from "@/components/modules/DashboardScreen";
import { MonitoringScreen } from "@/components/modules/MonitoringScreen";
import { NetworkFunctionsScreen } from "@/components/modules/NetworkFunctionsScreen";
import { SettingsScreen } from "@/components/modules/SettingsScreen";
import { SubscribersScreen } from "@/components/modules/SubscribersScreen";
import { AppRouteView } from "@/components/shared/AppRouteView";
import { ApiKeyManager } from "@/components/shared/ApiKeyManager";
import { BillingExportPanel } from "@/components/shared/BillingExportPanel";
import { IntentConsole } from "@/components/shared/IntentConsole";
import { appRouteRegistry, fallbackRouteMeta } from "@/lib/app-routes";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

function resolveMeta(slug: string[]) {
  const fullPath = `/app/${slug.join("/")}`;

  if (appRouteRegistry[fullPath]) {
    return { meta: appRouteRegistry[fullPath], fullPath };
  }

  if (slug.length > 1) {
    const dynamicPath = `/app/${slug.slice(0, -1).join("/")}/[id]`;
    if (appRouteRegistry[dynamicPath]) {
      return { meta: appRouteRegistry[dynamicPath], fullPath };
    }
  }

  return { meta: fallbackRouteMeta, fullPath };
}

function resolveEndpoint(endpoint: string | undefined, slug: string[]) {
  if (!endpoint) return undefined;
  if (!endpoint.includes("[id]")) return endpoint;
  const id = slug.at(-1);
  return id ? endpoint.replace("[id]", id) : undefined;
}

export default async function ProtectedRoutePage({ params }: Props) {
  const { slug = [] } = await params;

  if (!slug.length) {
    redirect("/app/dashboard");
  }

  const section = slug[0];
  const isRootSection = slug.length === 1;

  const { meta, fullPath } = resolveMeta(slug);
  const endpoint = resolveEndpoint(meta.endpoint, slug);

  const specialScreens = {
    dashboard: section === "dashboard" && isRootSection ? <DashboardScreen /> : null,
    networkFunctions: section === "network-functions" && isRootSection ? <NetworkFunctionsScreen /> : null,
    subscribers: section === "subscribers" && isRootSection ? <SubscribersScreen /> : null,
    monitoring: section === "monitoring" && isRootSection ? <MonitoringScreen /> : null,
    billing: section === "billing" && isRootSection ? <BillingScreen /> : null,
    admin: section === "admin" && isRootSection ? <AdminScreen /> : null,
    ai: section === "ai" && isRootSection ? <AIScreen /> : null,
    settings: section === "settings" && isRootSection ? <SettingsScreen /> : null,
  };

  const customScreen =
    specialScreens.dashboard ??
    specialScreens.networkFunctions ??
    specialScreens.subscribers ??
    specialScreens.monitoring ??
    specialScreens.billing ??
    specialScreens.admin ??
    specialScreens.ai ??
    specialScreens.settings;

  return (
    <div className="space-y-4">
      {customScreen ?? <AppRouteView title={meta.title} description={meta.description} endpoint={endpoint} createHref={meta.createHref} routePath={fullPath} />}

      {fullPath === "/app/ai/intent" ? <IntentConsole /> : null}
      {fullPath === "/app/settings/api-keys" ? <ApiKeyManager /> : null}
      {fullPath === "/app/billing/exports" ? <BillingExportPanel /> : null}
      {fullPath === "/app/settings/mfa" ? <MFASetup title="Multi-Factor Authentication" /> : null}
      {fullPath === "/app/settings/sso" ? <SSOButton title="Configure SAML / OAuth SSO" /> : null}
    </div>
  );
}
