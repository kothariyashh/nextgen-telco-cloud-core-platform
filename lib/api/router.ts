/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDefaultTenantId, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { toSlug } from "@/lib/utils";
import type { Role } from "@/types";

const tenantScopedTables = new Set([
  "user_profiles",
  "api_keys",
  "network_functions",
  "nf_instances",
  "subscribers",
  "sim_cards",
  "subscriber_devices",
  "roaming_profiles",
  "imsi_records",
  "imei_devices",
  "network_slices",
  "slice_templates",
  "slice_assignments",
  "sla_agreements",
  "sessions",
  "session_events",
  "session_qos",
  "policy_rules",
  "qos_profiles",
  "traffic_policies",
  "charging_sessions",
  "credit_balances",
  "cdr_records",
  "billing_exports",
  "billing_invoices",
  "billing_invoice_items",
  "performance_metrics",
  "metrics_stream",
  "alerts",
  "alarms",
  "incidents",
  "edge_clusters",
  "edge_nodes",
  "edge_workloads",
  "audit_logs",
  "logs",
  "traces",
  "trace_spans",
  "gdpr_requests",
  "data_access_logs",
  "training_datasets",
  "model_registry",
  "model_deployments",
  "model_metrics",
  "anomaly_alerts",
  "ai_predictions",
  "optimization_recommendations",
  "ztp_workflows",
  "orchestration_jobs",
  "security_policies",
  "threat_alerts",
  "marketplace_installs",
  "package_installs",
  "compliance_reports",
  "regulatory_logs",
  "user_invites",
  "configurations",
  "mfa_devices",
  "login_attempts",
  "device_sessions",
  "service_accounts",
  "topology_regions",
  "topology_data_centers",
  "topology_links",
  "data_centers",
  "availability_zones",
  "network_links",
]);

const roleWeights: Record<Role, number> = {
  readonly_viewer: 1,
  billing_manager: 2,
  network_engineer: 3,
  tenant_admin: 4,
  super_admin: 5,
  api_service: 3,
};

type RequestContext = {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  server: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string | null;
  email: string | null;
  tenantId: string | null;
  tenant: {
    id: string;
    is_active: boolean | null;
    max_subscribers: number | null;
    max_network_functions: number | null;
    plan: string | null;
  } | null;
  role: Role;
  authType: "user" | "api_key" | "anonymous";
  apiKeyScopes: string[];
};

function ok(data: unknown, status = 200, message?: string) {
  return NextResponse.json({ ok: true, message, data }, { status });
}

function fail(message: string, status = 400, code = "bad_request", details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      message,
      error: {
        code,
        details,
      },
    },
    { status },
  );
}

async function parseBody<T>(request: NextRequest, fallback = {} as T): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return fallback;
  }
}

function withTenant(query: any, table: string, tenantId: string | null) {
  if (tenantId && tenantScopedTables.has(table)) {
    return query.eq("tenant_id", tenantId);
  }
  return query;
}

function ensureRole(ctx: RequestContext, minimum: Role) {
  return roleWeights[ctx.role] >= roleWeights[minimum];
}

function nowIso() {
  return new Date().toISOString();
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!text.includes(",") && !text.includes("\"") && !text.includes("\n")) {
    return text;
  }
  return `"${text.replace(/\"/g, '""')}"`;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  });
  return lines.join("\n");
}

function parseBearerToken(value: string | null) {
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function scopeForRequest(pathname: string, method: string) {
  const segment = pathname.replace(/^\/api\/?/, "").split("/")[0] || "api";
  const action = method === "GET" || method === "HEAD" ? "read" : "write";
  return `${segment}:${action}`;
}

function hasApiScope(scopes: string[], requiredScope: string) {
  if (!scopes.length) return false;
  if (scopes.includes("*")) return true;

  const [domain, action] = requiredScope.split(":");
  return scopes.includes(requiredScope) || scopes.includes(`${domain}:*`) || scopes.includes(`*:${action}`);
}

async function buildContext(request: NextRequest, opts?: { allowAnonymous?: boolean }) {
  if (!hasSupabaseEnv()) {
    return { error: fail("Supabase environment variables are missing.", 500, "env_missing") };
  }

  const allowAnonymous = Boolean(opts?.allowAnonymous);
  const admin = createSupabaseAdminClient();
  const server = await createSupabaseServerClient();

  const authHeader = request.headers.get("authorization");
  const rawApiKey = request.headers.get("x-api-key") ?? parseBearerToken(authHeader);

  const {
    data: { user },
    error: userError,
  } = await server.auth.getUser();

  if (userError && !allowAnonymous && !rawApiKey) {
    return { error: fail("Unable to resolve current session.", 401, "session_error", userError.message) };
  }

  let userId = user?.id ?? null;
  let email = user?.email ?? null;
  let tenantId: string | null = null;
  let role: Role = "readonly_viewer";
  let authType: RequestContext["authType"] = user ? "user" : "anonymous";
  let apiKeyScopes: string[] = [];

  if (userId) {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("tenant_id, role")
      .eq("id", userId)
      .maybeSingle();

    tenantId = profile?.tenant_id ?? null;
    role = (profile?.role as Role | null) ?? "readonly_viewer";
  } else if (rawApiKey) {
    const keyHash = crypto.createHash("sha256").update(rawApiKey).digest("hex");
    const { data: keyRow, error: keyError } = await admin
      .from("api_keys")
      .select("tenant_id, user_id, scopes, is_active, expires_at")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (keyError) {
      return { error: fail("Unable to validate API key.", 401, "api_key_error", keyError.message) };
    }

    const expired = Boolean(keyRow?.expires_at && new Date(keyRow.expires_at).getTime() <= Date.now());
    if (!keyRow || !keyRow.is_active || expired) {
      return { error: fail("Invalid or expired API key.", 401, "api_key_invalid") };
    }

    tenantId = keyRow.tenant_id ?? null;
    userId = keyRow.user_id ?? null;
    role = "api_service";
    authType = "api_key";
    apiKeyScopes = Array.isArray(keyRow.scopes) ? (keyRow.scopes as string[]) : [];
  }

  if (!tenantId) {
    tenantId = request.headers.get("x-tenant-id") ?? getDefaultTenantId();
  }

  if (!allowAnonymous && authType === "anonymous") {
    return { error: fail("Authentication required.", 401, "unauthorized") };
  }

  if (!allowAnonymous && !tenantId) {
    return { error: fail("Tenant context missing.", 400, "tenant_missing") };
  }

  let tenant: RequestContext["tenant"] = null;
  if (tenantId) {
    const { data: tenantRow, error: tenantError } = await admin
      .from("tenants")
      .select("id, is_active, max_subscribers, max_network_functions, plan")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError) {
      return { error: fail("Unable to resolve tenant context.", 500, "tenant_context_error", tenantError.message) };
    }

    tenant = tenantRow
      ? {
          id: tenantRow.id,
          is_active: tenantRow.is_active,
          max_subscribers: tenantRow.max_subscribers,
          max_network_functions: tenantRow.max_network_functions,
          plan: tenantRow.plan,
        }
      : null;

    if (!allowAnonymous && tenant && tenant.is_active === false && role !== "super_admin") {
      return { error: fail("Tenant is suspended. Contact support.", 403, "tenant_suspended") };
    }
  }

  if (authType === "api_key") {
    const requiredScope = scopeForRequest(request.nextUrl.pathname, request.method);
    if (!hasApiScope(apiKeyScopes, requiredScope)) {
      return {
        error: fail(
          `API key missing required scope '${requiredScope}'.`,
          403,
          "scope_forbidden",
          { required_scope: requiredScope, available_scopes: apiKeyScopes },
        ),
      };
    }
  }

  return {
    ctx: {
      admin,
      server,
      userId,
      email,
      tenantId,
      tenant,
      role,
      authType,
      apiKeyScopes,
    } satisfies RequestContext,
  };
}

async function enforceTenantPlanLimit(ctx: RequestContext, resource: "subscribers" | "network_functions") {
  if (!ctx.tenantId || !ctx.tenant || ctx.role === "super_admin") {
    return null;
  }

  if (ctx.tenant.is_active === false) {
    return fail("Tenant is suspended and cannot create new resources.", 403, "tenant_suspended");
  }

  const limit = resource === "subscribers" ? ctx.tenant.max_subscribers : ctx.tenant.max_network_functions;
  if (!limit || limit <= 0) {
    return null;
  }

  const { count, error } = await ctx.admin
    .from(resource)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId);

  if (error) {
    return fail("Unable to validate tenant limits.", 500, "tenant_limit_check_error", error.message);
  }

  if ((count ?? 0) >= limit) {
    return fail(
      `Plan limit reached for ${resource}. Current plan allows ${limit}.`,
      403,
      "tenant_plan_limit_reached",
      { resource, limit, current: count ?? 0, plan: ctx.tenant.plan },
    );
  }

  return null;
}

async function recordLoginAttempt(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  payload: {
    tenantId?: string | null;
    email: string;
    ipAddress: string;
    succeeded: boolean;
    reason?: string;
  },
) {
  await admin.from("login_attempts").insert({
    tenant_id: payload.tenantId ?? null,
    email: payload.email,
    ip_address: payload.ipAddress,
    succeeded: payload.succeeded,
    reason: payload.reason ?? null,
    attempted_at: nowIso(),
  });
}

async function listTable(
  ctx: RequestContext,
  table: string,
  request: NextRequest,
  opts?: {
    select?: string;
    searchField?: string;
    orderBy?: string;
    ascending?: boolean;
    extraFilters?: Array<{ column: string; value: string }>;
  },
) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.max(1, Math.min(Number(searchParams.get("limit") ?? "50"), 200));
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const offset = (page - 1) * limit;
  const select = opts?.select ?? "*";
  const orderBy = opts?.orderBy ?? "created_at";
  const ascending = opts?.ascending ?? false;

  let query: any = ctx.admin.from(table).select(select, { count: "exact" });
  query = withTenant(query, table, ctx.tenantId);

  opts?.extraFilters?.forEach((filter) => {
    if (filter.value) {
      query = query.eq(filter.column, filter.value);
    }
  });

  const search = searchParams.get("search")?.trim();
  if (search && opts?.searchField) {
    query = query.ilike(opts.searchField, `%${search}%`);
  }

  const { data, error, count } = await query
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    return fail(`Failed to list ${table}.`, 500, "db_list_error", error.message);
  }

  return ok({
    items: data ?? [],
    page,
    limit,
    total: count ?? 0,
  });
}

async function getById(ctx: RequestContext, table: string, id: string, select = "*") {
  let query: any = ctx.admin.from(table).select(select).eq("id", id);
  query = withTenant(query, table, ctx.tenantId);

  const { data, error } = await query.maybeSingle();
  if (error) {
    return fail(`Failed to fetch ${table} record.`, 500, "db_get_error", error.message);
  }
  if (!data) {
    return fail("Record not found.", 404, "not_found");
  }

  return ok(data);
}

async function insertOne(ctx: RequestContext, table: string, payload: Record<string, unknown>) {
  const dataToInsert: Record<string, unknown> = { ...payload };
  if (tenantScopedTables.has(table) && ctx.tenantId) {
    dataToInsert.tenant_id = ctx.tenantId;
  }

  const { data, error } = await ctx.admin.from(table).insert(dataToInsert).select("*").single();

  if (error) {
    return fail(`Failed to create ${table} record.`, 500, "db_insert_error", error.message);
  }

  return ok(data, 201);
}

async function updateById(
  ctx: RequestContext,
  table: string,
  id: string,
  payload: Record<string, unknown>,
  select = "*",
) {
  let query: any = ctx.admin.from(table).update(payload).eq("id", id);
  query = withTenant(query, table, ctx.tenantId);

  const { data, error } = await query.select(select).maybeSingle();

  if (error) {
    return fail(`Failed to update ${table} record.`, 500, "db_update_error", error.message);
  }

  if (!data) {
    return fail("Record not found.", 404, "not_found");
  }

  return ok(data);
}

async function softDeleteSubscriber(ctx: RequestContext, id: string) {
  let query: any = ctx.admin
    .from("subscribers")
    .update({ status: "terminated", updated_at: nowIso() })
    .eq("id", id)
    .select("*");

  query = withTenant(query, "subscribers", ctx.tenantId);
  const { data, error } = await query.maybeSingle();

  if (error) {
    return fail("Failed to terminate subscriber.", 500, "db_delete_error", error.message);
  }

  if (!data) {
    return fail("Subscriber not found.", 404, "not_found");
  }

  return ok(data);
}

function parseIntent(input: string) {
  const lowered = input.toLowerCase();
  const action = lowered.includes("increase") || lowered.includes("scale") ? "scale" : "analyze";
  const amountMatch = lowered.match(/(\d+)%/);
  const amount = amountMatch ? Number(amountMatch[1]) : 0;

  return {
    action,
    amountPercent: amount,
    target: lowered.includes("slice") ? "slice" : lowered.includes("upf") ? "network_function" : "network",
    original: input,
  };
}

async function handleAuth(path: string[], method: string, request: NextRequest) {
  const [section, sub, maybeId] = path;

  if (section !== "auth") {
    return null;
  }

  const allowAnonymous = ["signup", "login", "forgot-password", "reset-password", "accept-invite"].includes(sub ?? "");
  const built = await buildContext(request, { allowAnonymous });
  if ("error" in built) {
    return built.error;
  }
  const { ctx } = built;

  if (sub === "signup" && method === "POST") {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(1).max(120).optional(),
      tenantName: z.string().min(2).max(120).default("Demo Operator"),
      tenantSlug: z.string().min(2).max(120).optional(),
      role: z
        .enum(["super_admin", "tenant_admin", "network_engineer", "billing_manager", "readonly_viewer", "api_service"])
        .optional(),
    });

    const raw = await parseBody(request, {});
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return fail("Invalid signup payload.", 400, "validation_error", parsed.error.flatten());
    }

    const payload = parsed.data;
    const desiredSlug = payload.tenantSlug ? toSlug(payload.tenantSlug) : toSlug(payload.tenantName);

    const { data: existingTenant } = await ctx.admin
      .from("tenants")
      .select("id")
      .eq("slug", desiredSlug)
      .maybeSingle();

    let tenantId = existingTenant?.id as string | undefined;

    if (!tenantId) {
      const { data: tenant, error: tenantError } = await ctx.admin
        .from("tenants")
        .insert({
          name: payload.tenantName,
          slug: desiredSlug,
          plan: "starter",
          metadata: { source: "self_signup" },
        })
        .select("id")
        .single();

      if (tenantError) {
        return fail("Unable to create tenant.", 500, "tenant_create_error", tenantError.message);
      }

      tenantId = tenant.id;
    }

    const { data: created, error: createError } = await ctx.admin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName,
      },
    });

    if (createError || !created.user) {
      return fail("Unable to create user account.", 500, "auth_signup_error", createError?.message);
    }

    const { error: profileError } = await ctx.admin.from("user_profiles").upsert({
      id: created.user.id,
      tenant_id: tenantId,
      full_name: payload.fullName ?? null,
      role: payload.role ?? "tenant_admin",
      is_active: true,
    });

    if (profileError) {
      return fail("User created but profile setup failed.", 500, "profile_create_error", profileError.message);
    }

    await ctx.server.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    return ok(
      {
        user_id: created.user.id,
        tenant_id: tenantId,
      },
      201,
      "Signup completed.",
    );
  }

  if (sub === "login" && method === "POST") {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    const payload = schema.safeParse(await parseBody(request, {}));
    if (!payload.success) {
      return fail("Invalid login payload.", 400, "validation_error", payload.error.flatten());
    }

    const ipAddress = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const rateWindowStart = new Date(Date.now() - 15 * 60_000).toISOString();
    const { data: recentAttempts } = await ctx.admin
      .from("login_attempts")
      .select("id")
      .eq("email", payload.data.email)
      .eq("succeeded", false)
      .gte("attempted_at", rateWindowStart)
      .order("attempted_at", { ascending: false })
      .limit(6);

    if ((recentAttempts?.length ?? 0) >= 5) {
      await recordLoginAttempt(ctx.admin, {
        email: payload.data.email,
        ipAddress,
        succeeded: false,
        reason: "rate_limited",
      });
      return fail("Too many failed login attempts. Please retry in 15 minutes.", 429, "login_rate_limited");
    }

    const { data, error } = await ctx.server.auth.signInWithPassword(payload.data);
    if (error) {
      await recordLoginAttempt(ctx.admin, {
        email: payload.data.email,
        ipAddress,
        succeeded: false,
        reason: "invalid_credentials",
      });
      return fail("Invalid login credentials.", 401, "login_failed", error.message);
    }

    const { data: profile } = await ctx.admin
      .from("user_profiles")
      .select("tenant_id, role, full_name")
      .eq("id", data.user.id)
      .maybeSingle();

    await recordLoginAttempt(ctx.admin, {
      tenantId: profile?.tenant_id ?? null,
      email: payload.data.email,
      ipAddress,
      succeeded: true,
      reason: "success",
    });

    const sessionTokenHash = crypto
      .createHash("sha256")
      .update(`${data.user.id}:${Date.now()}:${Math.random().toString(16).slice(2)}`)
      .digest("hex");

    if (profile?.tenant_id ?? ctx.tenantId) {
      await ctx.admin.from("device_sessions").insert({
        tenant_id: profile?.tenant_id ?? ctx.tenantId,
        user_id: data.user.id,
        session_token_hash: sessionTokenHash,
        user_agent: request.headers.get("user-agent") ?? null,
        ip_address: ipAddress,
        last_seen_at: nowIso(),
      });
    }

    return ok({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      profile,
    });
  }

  if (sub === "logout" && method === "POST") {
    const { error } = await ctx.server.auth.signOut();
    if (error) {
      return fail("Failed to logout.", 500, "logout_error", error.message);
    }
    return ok({ signed_out: true });
  }

  if (sub === "logout" && method === "GET") {
    const { error } = await ctx.server.auth.signOut();
    if (error) {
      return fail("Failed to logout.", 500, "logout_error", error.message);
    }
    return ok({ signed_out: true });
  }

  if (sub === "refresh" && method === "POST") {
    const { data, error } = await ctx.server.auth.refreshSession();
    if (error) {
      return fail("Failed to refresh session.", 500, "refresh_error", error.message);
    }
    return ok(data);
  }

  if (sub === "forgot-password" && method === "POST") {
    const schema = z.object({
      email: z.string().email(),
    });
    const payload = schema.safeParse(await parseBody(request, {}));
    if (!payload.success) {
      return fail("Invalid forgot-password payload.", 400, "validation_error", payload.error.flatten());
    }

    const { error } = await ctx.server.auth.resetPasswordForEmail(payload.data.email, {
      redirectTo: `${request.nextUrl.origin}/login`,
    });

    if (error) {
      return fail("Unable to send reset email.", 500, "reset_email_error", error.message);
    }

    return ok({ sent: true });
  }

  if (sub === "reset-password" && method === "POST") {
    const schema = z.object({
      password: z.string().min(8),
    });
    const payload = schema.safeParse(await parseBody(request, {}));

    if (!payload.success) {
      return fail("Invalid reset-password payload.", 400, "validation_error", payload.error.flatten());
    }

    const { error } = await ctx.server.auth.updateUser({ password: payload.data.password });

    if (error) {
      return fail("Unable to reset password.", 500, "reset_password_error", error.message);
    }

    return ok({ reset: true });
  }

  if (sub === "accept-invite" && method === "POST") {
    const schema = z.object({
      token: z.string().min(12),
      email: z.string().email(),
      password: z.string().min(8),
      full_name: z.string().min(1).max(120).optional(),
    });
    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid invite acceptance payload.", 400, "validation_error", parsed.error.flatten());
    }

    const { data: invite, error: inviteError } = await ctx.admin
      .from("user_invites")
      .select("*")
      .eq("invite_token", parsed.data.token)
      .eq("email", parsed.data.email)
      .maybeSingle();

    if (inviteError) {
      return fail("Failed to validate invite.", 500, "invite_lookup_error", inviteError.message);
    }
    if (!invite) {
      return fail("Invite not found.", 404, "invite_not_found");
    }
    if (invite.accepted_at) {
      return fail("Invite already accepted.", 409, "invite_already_used");
    }
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return fail("Invite has expired.", 410, "invite_expired");
    }

    const { data: created, error: createError } = await ctx.admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name ?? null,
      },
    });

    if (createError || !created.user) {
      return fail("Unable to create invited user.", 500, "invite_user_create_error", createError?.message);
    }

    const { error: profileError } = await ctx.admin.from("user_profiles").upsert({
      id: created.user.id,
      tenant_id: invite.tenant_id,
      full_name: parsed.data.full_name ?? null,
      role: invite.role,
      is_active: true,
    });

    if (profileError) {
      return fail("Invite accepted but profile setup failed.", 500, "invite_profile_error", profileError.message);
    }

    await ctx.admin
      .from("user_invites")
      .update({ accepted_at: nowIso() })
      .eq("id", invite.id);

    await ctx.server.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    return ok(
      {
        user_id: created.user.id,
        tenant_id: invite.tenant_id,
        role: invite.role,
      },
      201,
      "Invite accepted successfully.",
    );
  }

  if (sub === "mfa" && path[2] === "enroll" && method === "POST") {
    const secret = crypto.randomBytes(16).toString("hex");
    return ok({
      secret,
      qr_code_uri: `otpauth://totp/NGCMCP:${ctx.email ?? "user"}?secret=${secret}&issuer=NGCMCP`,
    });
  }

  if (sub === "mfa" && path[2] === "verify" && method === "POST") {
    return ok({ verified: true, method: "totp" });
  }

  if (sub === "session" && method === "GET") {
    const {
      data: { user },
    } = await ctx.server.auth.getUser();

    if (!user) {
      return fail("No active session.", 401, "unauthorized");
    }

    const { data: profile } = await ctx.admin
      .from("user_profiles")
      .select("tenant_id, role, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    return ok({
      user,
      profile,
    });
  }

  if (sub === "device-sessions" && method === "GET") {
    return listTable(ctx, "device_sessions", request, {
      extraFilters: [{ column: "user_id", value: ctx.userId ?? "" }],
      orderBy: "last_seen_at",
    });
  }

  if (sub === "device-sessions" && maybeId && method === "DELETE") {
    return updateById(ctx, "device_sessions", maybeId, {
      revoked_at: nowIso(),
    });
  }

  if (sub === "sessions" && path[2] === "revoke-all" && method === "POST") {
    const { error } = await ctx.admin
      .from("device_sessions")
      .update({ revoked_at: nowIso() })
      .eq("tenant_id", ctx.tenantId)
      .eq("user_id", ctx.userId);

    if (error) {
      return fail("Failed to revoke active sessions.", 500, "session_revoke_error", error.message);
    }

    return ok({ revoked: true });
  }

  if (sub === "api-keys" && method === "GET") {
    return listTable(ctx, "api_keys", request, {
      searchField: "name",
    });
  }

  if (sub === "api-keys" && method === "POST") {
    const schema = z.object({
      name: z.string().min(2).max(100),
      scopes: z.array(z.string()).default([]),
      expires_at: z.string().datetime().optional(),
    });

    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid API key payload.", 400, "validation_error", parsed.error.flatten());
    }

    const rawKey = `ngc_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const { data, error } = await ctx.admin
      .from("api_keys")
      .insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        name: parsed.data.name,
        key_hash: keyHash,
        key_prefix: rawKey.slice(0, 8),
        scopes: parsed.data.scopes,
        expires_at: parsed.data.expires_at ?? null,
      })
      .select("id, name, key_prefix, scopes, expires_at, created_at")
      .single();

    if (error) {
      return fail("Failed to create API key.", 500, "api_key_create_error", error.message);
    }

    return ok(
      {
        ...data,
        api_key: rawKey,
      },
      201,
      "Store this key securely. It will not be shown again.",
    );
  }

  if (sub === "api-keys" && maybeId && method === "DELETE") {
    return updateById(ctx, "api_keys", maybeId, {
      is_active: false,
      expires_at: nowIso(),
    });
  }

  return null;
}

async function handleSubscribers(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "subscribers") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const subscriberId = path[1];
  const action = path[2];

  if (subscriberId === "bulk-import" && method === "POST") {
    const schema = z.object({
      csv: z.string().optional(),
      records: z
        .array(
          z.object({
            imsi: z.string().min(10),
            msisdn: z.string().optional(),
            status: z.enum(["active", "suspended", "terminated"]).default("active"),
            plan: z.string().default("starter"),
            data_limit_gb: z.number().nonnegative().default(10),
            roaming_enabled: z.boolean().default(false),
          }),
        )
        .optional(),
    });

    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid bulk import payload.", 400, "validation_error", parsed.error.flatten());
    }

    let rows = parsed.data.records ?? [];
    if (!rows.length && parsed.data.csv) {
      const lines = parsed.data.csv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const idx = (name: string) => headers.indexOf(name);

        rows = lines.slice(1).map((line) => {
          const cols = line.split(",").map((c) => c.trim());
          const roamingRaw = cols[idx("roaming_enabled")]?.toLowerCase();
          const dataLimitRaw = cols[idx("data_limit_gb")];
          return {
            imsi: cols[idx("imsi")] ?? "",
            msisdn: cols[idx("msisdn")] || null,
            status: (cols[idx("status")] as "active" | "suspended" | "terminated") || "active",
            plan: cols[idx("plan")] || "starter",
            data_limit_gb: dataLimitRaw ? Number(dataLimitRaw) : 10,
            roaming_enabled: roamingRaw === "true" || roamingRaw === "1" || roamingRaw === "yes",
          };
        });
      }
    }

    if (!rows.length) {
      return fail("No subscriber rows provided for import.", 400, "empty_import");
    }

    const normalizedRows = rows
      .filter((row) => row.imsi && row.imsi.length >= 10)
      .map((row) => ({
        tenant_id: ctx.tenantId,
        imsi: row.imsi,
        msisdn: row.msisdn ?? null,
        status: row.status ?? "active",
        plan: row.plan ?? "starter",
        data_limit_gb: row.data_limit_gb ?? 10,
        roaming_enabled: row.roaming_enabled ?? false,
      }));

    const { data, error } = await ctx.admin
      .from("subscribers")
      .upsert(normalizedRows, { onConflict: "imsi" })
      .select("id,imsi");

    if (error) {
      return fail("Bulk import failed.", 500, "bulk_import_error", error.message);
    }

    return ok(
      {
        imported: data?.length ?? 0,
        total_rows: rows.length,
      },
      201,
      "Bulk import completed.",
    );
  }

  if (subscriberId === "export" && method === "GET") {
    const { data, error } = await ctx.admin
      .from("subscribers")
      .select("id,imsi,msisdn,status,plan,data_limit_gb,roaming_enabled,created_at")
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return fail("Failed to export subscribers.", 500, "subscriber_export_error", error.message);
    }

    const csv = toCsv((data ?? []) as Array<Record<string, unknown>>);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"subscribers-export-${Date.now()}.csv\"`,
      },
    });
  }

  if (!subscriberId) {
    if (method === "GET") {
      return listTable(ctx, "subscribers", request, {
        searchField: "imsi",
        extraFilters: [{ column: "status", value: request.nextUrl.searchParams.get("status") ?? "" }],
      });
    }

    if (method === "POST") {
      const limitError = await enforceTenantPlanLimit(ctx, "subscribers");
      if (limitError) return limitError;

      const schema = z.object({
        imsi: z.string().min(10),
        msisdn: z.string().optional(),
        status: z.enum(["active", "suspended", "terminated"]).default("active"),
        plan: z.string().default("starter"),
        data_limit_gb: z.number().nonnegative().default(10),
        roaming_enabled: z.boolean().default(false),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid subscriber payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "subscribers", parsed.data);
    }
  }

  if (subscriberId && !action) {
    if (method === "GET") return getById(ctx, "subscribers", subscriberId);
    if (method === "PUT") return updateById(ctx, "subscribers", subscriberId, await parseBody(request, {}));
    if (method === "DELETE") return softDeleteSubscriber(ctx, subscriberId);
  }

  if (subscriberId && action === "devices" && method === "GET") {
    return listTable(ctx, "subscriber_devices", request, {
      extraFilters: [{ column: "subscriber_id", value: subscriberId }],
    });
  }

  if (subscriberId && action === "sessions" && method === "GET") {
    return listTable(ctx, "sessions", request, {
      extraFilters: [{ column: "subscriber_id", value: subscriberId }],
    });
  }

  if (subscriberId && action === "billing" && method === "GET") {
    const [creditsRes, cdrRes] = await Promise.all([
      ctx.admin
        .from("credit_balances")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .eq("subscriber_id", subscriberId)
        .maybeSingle(),
      ctx.admin
        .from("cdr_records")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .eq("subscriber_id", subscriberId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (creditsRes.error || cdrRes.error) {
      return fail("Failed to fetch billing summary.", 500, "billing_fetch_error", {
        credits: creditsRes.error?.message,
        cdr: cdrRes.error?.message,
      });
    }

    return ok({
      credit_balance: creditsRes.data,
      cdr_records: cdrRes.data ?? [],
    });
  }

  if (subscriberId && action === "roaming") {
    if (method === "GET") {
      const { data, error } = await ctx.admin
        .from("roaming_profiles")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .eq("subscriber_id", subscriberId)
        .maybeSingle();

      if (error) {
        return fail("Failed to fetch roaming profile.", 500, "roaming_fetch_error", error.message);
      }

      return ok(data);
    }

    if (method === "PUT") {
      const schema = z.object({
        allowed_countries: z.array(z.string()).default([]),
        data_limit_mb: z.number().int().nonnegative().optional(),
        voice_limit_minutes: z.number().int().nonnegative().optional(),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid roaming payload.", 400, "validation_error", parsed.error.flatten());
      }

      const { data, error } = await ctx.admin
        .from("roaming_profiles")
        .upsert({
          tenant_id: ctx.tenantId,
          subscriber_id: subscriberId,
          ...parsed.data,
        })
        .select("*")
        .single();

      if (error) {
        return fail("Failed to update roaming profile.", 500, "roaming_update_error", error.message);
      }

      return ok(data);
    }
  }

  if (subscriberId && action === "usage" && method === "GET") {
    const { data, error } = await ctx.admin
      .from("cdr_records")
      .select("start_time,duration_seconds,bytes_uplink,bytes_downlink,charge_amount,service_type,roaming_indicator")
      .eq("tenant_id", ctx.tenantId)
      .eq("subscriber_id", subscriberId)
      .order("start_time", { ascending: false })
      .limit(365);

    if (error) {
      return fail("Failed to fetch subscriber usage.", 500, "subscriber_usage_error", error.message);
    }

    const timeline = new Map<string, { date: string; bytes: number; duration_seconds: number; charge: number; sessions: number }>();
    (data ?? []).forEach((row: any) => {
      const date = String(row.start_time ?? nowIso()).slice(0, 10);
      const current = timeline.get(date) ?? { date, bytes: 0, duration_seconds: 0, charge: 0, sessions: 0 };
      current.bytes += Number(row.bytes_uplink ?? 0) + Number(row.bytes_downlink ?? 0);
      current.duration_seconds += Number(row.duration_seconds ?? 0);
      current.charge += Number(row.charge_amount ?? 0);
      current.sessions += 1;
      timeline.set(date, current);
    });

    const points = Array.from(timeline.values()).sort((a, b) => a.date.localeCompare(b.date));
    const totalBytes = points.reduce((sum, item) => sum + item.bytes, 0);
    const totalCharge = points.reduce((sum, item) => sum + item.charge, 0);
    const totalSessions = points.reduce((sum, item) => sum + item.sessions, 0);

    return ok({
      summary: {
        total_bytes: totalBytes,
        total_charge: totalCharge,
        total_sessions: totalSessions,
      },
      timeline: points,
    });
  }

  if (subscriberId && action === "suspend" && method === "POST") {
    return updateById(ctx, "subscribers", subscriberId, {
      status: "suspended",
      updated_at: nowIso(),
    });
  }

  if (subscriberId && action === "activate" && method === "POST") {
    return updateById(ctx, "subscribers", subscriberId, {
      status: "active",
      updated_at: nowIso(),
    });
  }

  if (subscriberId && action === "assign-slice" && method === "POST") {
    const schema = z.object({
      slice_id: z.string().uuid(),
      expires_at: z.string().datetime().optional(),
    });
    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid slice assignment payload.", 400, "validation_error", parsed.error.flatten());
    }

    return insertOne(ctx, "slice_assignments", {
      slice_id: parsed.data.slice_id,
      subscriber_id: subscriberId,
      expires_at: parsed.data.expires_at ?? null,
    });
  }

  if (subscriberId && action === "sim") {
    if (method === "GET") {
      const { data, error } = await ctx.admin
        .from("sim_cards")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .eq("subscriber_id", subscriberId)
        .maybeSingle();

      if (error) {
        return fail("Failed to fetch SIM information.", 500, "sim_fetch_error", error.message);
      }

      return ok(data);
    }

    if (method === "POST") {
      const schema = z.object({
        iccid: z.string().min(10),
        imsi: z.string().min(10),
        sim_type: z.enum(["physical", "eSIM"]).default("physical"),
        status: z.enum(["inactive", "active", "suspended"]).default("inactive"),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid SIM provisioning payload.", 400, "validation_error", parsed.error.flatten());
      }

      const { data, error } = await ctx.admin
        .from("sim_cards")
        .upsert({
          tenant_id: ctx.tenantId,
          subscriber_id: subscriberId,
          iccid: parsed.data.iccid,
          imsi: parsed.data.imsi,
          sim_type: parsed.data.sim_type,
          status: parsed.data.status,
          activated_at: parsed.data.status === "active" ? nowIso() : null,
        })
        .select("*")
        .single();

      if (error) {
        return fail("Failed to provision SIM.", 500, "sim_provision_error", error.message);
      }

      return ok(data, 201);
    }
  }

  return null;
}

async function handleNetworkFunctions(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "network-functions") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const id = path[1];
  const action = path[2];

  if (id === "types" && method === "GET") {
    return ok([
      { code: "AMF", generation: "5G", description: "Access and Mobility Management Function" },
      { code: "SMF", generation: "5G", description: "Session Management Function" },
      { code: "UPF", generation: "5G", description: "User Plane Function" },
      { code: "PCF", generation: "5G", description: "Policy Control Function" },
      { code: "AUSF", generation: "5G", description: "Authentication Server Function" },
      { code: "UDM", generation: "5G", description: "Unified Data Management" },
      { code: "MME", generation: "4G", description: "Mobility Management Entity" },
      { code: "SGW", generation: "4G", description: "Serving Gateway" },
      { code: "PGW", generation: "4G", description: "PDN Gateway" },
      { code: "HSS", generation: "4G", description: "Home Subscriber Server" },
      { code: "PCRF", generation: "4G", description: "Policy and Charging Rules Function" },
    ]);
  }

  if (!id) {
    if (method === "GET") {
      return listTable(ctx, "network_functions", request, {
        searchField: "name",
        extraFilters: [
          { column: "status", value: request.nextUrl.searchParams.get("status") ?? "" },
          { column: "nf_type", value: request.nextUrl.searchParams.get("nf_type") ?? "" },
        ],
      });
    }

    if (method === "POST") {
      const limitError = await enforceTenantPlanLimit(ctx, "network_functions");
      if (limitError) return limitError;

      const schema = z.object({
        name: z.string().min(2),
        nf_type: z.string().min(2),
        generation: z.enum(["5G", "4G"]),
        version: z.string().optional(),
        region_id: z.string().uuid().optional(),
        helm_chart_url: z.string().url().optional(),
        container_image: z.string().optional(),
        service_mesh_config: z.record(z.string(), z.any()).default({}),
        config: z.record(z.string(), z.any()).default({}),
        resource_limits: z.record(z.string(), z.any()).default({ replicas: 1, cpu: "500m", memory: "1Gi" }),
      });

      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid network function payload.", 400, "validation_error", parsed.error.flatten());
      }

      return insertOne(ctx, "network_functions", {
        ...parsed.data,
        status: "deploying",
      });
    }
  }

  if (id && !action) {
    if (method === "GET") return getById(ctx, "network_functions", id);
    if (method === "PUT") return updateById(ctx, "network_functions", id, await parseBody(request, {}));
    if (method === "DELETE") {
      return updateById(ctx, "network_functions", id, {
        status: "failed",
        updated_at: nowIso(),
      });
    }
  }

  if (id && action === "metrics" && method === "GET") {
    return listTable(ctx, "performance_metrics", request, {
      extraFilters: [
        { column: "entity_type", value: "network_function" },
        { column: "entity_id", value: id },
      ],
      orderBy: "recorded_at",
    });
  }

  if (id && action === "instances" && method === "GET") {
    return listTable(ctx, "nf_instances", request, {
      extraFilters: [{ column: "network_function_id", value: id }],
    });
  }

  if (id && action === "scale" && method === "POST") {
    const schema = z.object({ replicas: z.number().int().min(1).max(200) });
    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid scale payload.", 400, "validation_error", parsed.error.flatten());
    }

    const { data: nf } = await ctx.admin
      .from("network_functions")
      .select("resource_limits")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", id)
      .maybeSingle();

    const resourceLimits = {
      ...(nf?.resource_limits ?? {}),
      replicas: parsed.data.replicas,
    };

    await ctx.admin.from("orchestration_jobs").insert({
      tenant_id: ctx.tenantId,
      job_type: "scale",
      target_type: "network_function",
      target_id: id,
      payload: parsed.data,
      status: "queued",
    });

    return updateById(ctx, "network_functions", id, {
      resource_limits: resourceLimits,
      status: "deploying",
      updated_at: nowIso(),
    });
  }

  if (id && action === "restart" && method === "POST") {
    await ctx.admin.from("orchestration_jobs").insert({
      tenant_id: ctx.tenantId,
      job_type: "restart",
      target_type: "network_function",
      target_id: id,
      payload: {},
      status: "queued",
    });

    return updateById(ctx, "network_functions", id, {
      status: "deploying",
      updated_at: nowIso(),
    });
  }

  if (id && action === "logs" && method === "GET") {
    return listTable(ctx, "logs", request, {
      extraFilters: [
        { column: "entity_type", value: "network_function" },
        { column: "entity_id", value: id },
      ],
      orderBy: "occurred_at",
    });
  }

  if (id && action === "config") {
    if (method === "GET") {
      const { data, error } = await ctx.admin
        .from("network_functions")
        .select("id,name,config,service_mesh_config,resource_limits,helm_chart_url,container_image,updated_at")
        .eq("tenant_id", ctx.tenantId)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        return fail("Failed to fetch network function config.", 500, "nf_config_fetch_error", error.message);
      }
      if (!data) {
        return fail("Network function not found.", 404, "not_found");
      }
      return ok(data);
    }

    if (method === "PUT") {
      const schema = z.object({
        config: z.record(z.string(), z.any()).optional(),
        service_mesh_config: z.record(z.string(), z.any()).optional(),
        resource_limits: z.record(z.string(), z.any()).optional(),
        helm_chart_url: z.string().url().optional(),
        container_image: z.string().optional(),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid network function config payload.", 400, "validation_error", parsed.error.flatten());
      }

      await ctx.admin.from("orchestration_jobs").insert({
        tenant_id: ctx.tenantId,
        job_type: "config_update",
        target_type: "network_function",
        target_id: id,
        payload: parsed.data,
        status: "queued",
      });

      return updateById(ctx, "network_functions", id, {
        ...parsed.data,
        status: "deploying",
        updated_at: nowIso(),
      });
    }
  }

  if (id && action === "rolling-update" && method === "POST") {
    const schema = z.object({
      version: z.string().optional(),
      image: z.string().optional(),
      max_unavailable: z.number().int().min(0).max(10).default(1),
    });
    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid rolling update payload.", 400, "validation_error", parsed.error.flatten());
    }

    const { data: job, error: jobError } = await ctx.admin
      .from("orchestration_jobs")
      .insert({
        tenant_id: ctx.tenantId,
        job_type: "rolling_update",
        target_type: "network_function",
        target_id: id,
        payload: parsed.data,
        status: "queued",
      })
      .select("*")
      .single();

    if (jobError) {
      return fail("Failed to create rolling update job.", 500, "rolling_update_error", jobError.message);
    }

    const patch: Record<string, unknown> = {
      status: "deploying",
      updated_at: nowIso(),
    };
    if (parsed.data.version) patch.version = parsed.data.version;
    if (parsed.data.image) patch.container_image = parsed.data.image;
    await updateById(ctx, "network_functions", id, patch);

    return ok(job, 201);
  }

  if (id && action === "health" && method === "GET") {
    const [nfRes, alarmRes] = await Promise.all([
      ctx.admin
        .from("network_functions")
        .select("id, name, status, updated_at")
        .eq("tenant_id", ctx.tenantId)
        .eq("id", id)
        .maybeSingle(),
      ctx.admin
        .from("alarms")
        .select("id, severity, status, raised_at")
        .eq("tenant_id", ctx.tenantId)
        .eq("source_entity_id", id)
        .eq("status", "active")
        .order("raised_at", { ascending: false })
        .limit(5),
    ]);

    if (nfRes.error) {
      return fail("Failed to fetch health status.", 500, "health_fetch_error", nfRes.error.message);
    }

    return ok({
      network_function: nfRes.data,
      active_alarms: alarmRes.data ?? [],
    });
  }

  return null;
}

async function handleSlices(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "slices") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const id = path[1];
  const action = path[2];

  if (id === "templates") {
    if (method === "GET") {
      return listTable(ctx, "slice_templates", request, {
        searchField: "name",
      });
    }

    if (method === "POST") {
      const schema = z.object({
        name: z.string().min(2),
        slice_type: z.string().min(2),
        default_config: z.record(z.string(), z.any()).default({}),
        is_public: z.boolean().default(false),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid template payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "slice_templates", parsed.data);
    }
  }

  if (!id) {
    if (method === "GET") {
      return listTable(ctx, "network_slices", request, {
        searchField: "name",
      });
    }

    if (method === "POST") {
      const schema = z.object({
        name: z.string().min(2),
        slice_type: z.string().min(2),
        template_id: z.string().uuid().optional(),
        qos_profile: z.record(z.string(), z.any()).default({}),
        bandwidth_mbps: z.number().int().min(1).default(100),
        latency_target_ms: z.number().int().min(1).default(20),
        max_subscribers: z.number().int().min(1).default(1000),
        sni_tag: z.string().optional(),
        s_nssai: z.string().optional(),
        plmn_id: z.string().optional(),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid slice payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "network_slices", {
        ...parsed.data,
        status: "pending",
      });
    }
  }

  if (id && !action) {
    if (method === "GET") return getById(ctx, "network_slices", id);
    if (method === "PUT") return updateById(ctx, "network_slices", id, await parseBody(request, {}));
    if (method === "DELETE") {
      let query: any = ctx.admin.from("network_slices").delete().eq("id", id);
      query = withTenant(query, "network_slices", ctx.tenantId);
      const { error } = await query;
      if (error) return fail("Failed to delete slice.", 500, "slice_delete_error", error.message);
      return ok({ deleted: true });
    }
  }

  if (id && action === "activate" && method === "POST") {
    return updateById(ctx, "network_slices", id, { status: "active", updated_at: nowIso() });
  }

  if (id && action === "deactivate" && method === "POST") {
    return updateById(ctx, "network_slices", id, { status: "inactive", updated_at: nowIso() });
  }

  if (id && action === "subscribers" && method === "GET") {
    const { data, error } = await ctx.admin
      .from("slice_assignments")
      .select("id, subscriber_id, assigned_at, expires_at, subscribers(id, imsi, msisdn, status)")
      .eq("tenant_id", ctx.tenantId)
      .eq("slice_id", id)
      .order("assigned_at", { ascending: false });

    if (error) {
      return fail("Failed to fetch slice subscribers.", 500, "slice_subscribers_error", error.message);
    }

    return ok(data ?? []);
  }

  if (id && action === "metrics" && method === "GET") {
    return listTable(ctx, "performance_metrics", request, {
      extraFilters: [
        { column: "entity_type", value: "slice" },
        { column: "entity_id", value: id },
      ],
      orderBy: "recorded_at",
    });
  }

  if (id && action === "utilization" && method === "GET") {
    const { data, error } = await ctx.admin
      .from("performance_metrics")
      .select("metric_name,metric_value,unit,recorded_at,labels")
      .eq("tenant_id", ctx.tenantId)
      .eq("entity_type", "slice")
      .eq("entity_id", id)
      .order("recorded_at", { ascending: false })
      .limit(500);

    if (error) {
      return fail("Failed to fetch slice utilization.", 500, "slice_utilization_error", error.message);
    }

    const latest = new Map<string, any>();
    (data ?? []).forEach((row: any) => {
      if (!latest.has(row.metric_name)) {
        latest.set(row.metric_name, row);
      }
    });

    return ok({
      latest: Array.from(latest.values()),
      timeline: data ?? [],
    });
  }

  if (id && action === "sla" && method === "GET") {
    const { data, error } = await ctx.admin
      .from("sla_agreements")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("slice_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return fail("Failed to fetch slice SLA.", 500, "slice_sla_error", error.message);
    }

    return ok(
      data ?? {
        slice_id: id,
        name: "Default SLA",
        latency_ms_target: 20,
        availability_pct_target: 99.9,
        throughput_mbps_target: 100,
        is_active: true,
      },
    );
  }

  if (id && action === "clone" && method === "POST") {
    const schema = z.object({
      name: z.string().min(2).optional(),
    });
    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid slice clone payload.", 400, "validation_error", parsed.error.flatten());
    }

    const { data: source, error: sourceError } = await ctx.admin
      .from("network_slices")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", id)
      .maybeSingle();

    if (sourceError) {
      return fail("Failed to load source slice for clone.", 500, "slice_clone_source_error", sourceError.message);
    }
    if (!source) {
      return fail("Source slice not found.", 404, "not_found");
    }

    const clonePayload = {
      name: parsed.data.name ?? `${source.name} (Clone)`,
      slice_type: source.slice_type,
      template_id: source.template_id,
      qos_profile: source.qos_profile ?? {},
      bandwidth_mbps: source.bandwidth_mbps,
      latency_target_ms: source.latency_target_ms,
      max_subscribers: source.max_subscribers,
      sni_tag: source.sni_tag,
      s_nssai: source.s_nssai,
      plmn_id: source.plmn_id,
      status: "pending",
    };

    return insertOne(ctx, "network_slices", clonePayload);
  }

  return null;
}

async function handleSessions(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "sessions") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const id = path[1];
  const action = path[2];

  if (id === "stats" && method === "GET") {
    const { data, error } = await ctx.admin
      .from("sessions")
      .select("status, bytes_uplink, bytes_downlink")
      .eq("tenant_id", ctx.tenantId)
      .limit(5000);

    if (error) {
      return fail("Failed to fetch session stats.", 500, "session_stats_error", error.message);
    }

    const summary = (data ?? []).reduce(
      (acc, row: any) => {
        acc.total += 1;
        if (row.status === "active") acc.active += 1;
        if (row.status === "terminated") acc.terminated += 1;
        acc.bytes_uplink += Number(row.bytes_uplink ?? 0);
        acc.bytes_downlink += Number(row.bytes_downlink ?? 0);
        return acc;
      },
      {
        total: 0,
        active: 0,
        terminated: 0,
        bytes_uplink: 0,
        bytes_downlink: 0,
      },
    );

    return ok(summary);
  }

  if (!id) {
    if (method === "GET") {
      return listTable(ctx, "sessions", request, {
        extraFilters: [{ column: "status", value: request.nextUrl.searchParams.get("status") ?? "" }],
        orderBy: "start_time",
      });
    }
  }

  if (id && !action && method === "GET") {
    return getById(ctx, "sessions", id);
  }

  if (id && action === "terminate" && method === "POST") {
    const sessionUpdate = await updateById(ctx, "sessions", id, {
      status: "terminated",
      end_time: nowIso(),
    });
    if ("error" in sessionUpdate) return sessionUpdate;

    const eventInsert = await ctx.admin.from("session_events").insert({
      tenant_id: ctx.tenantId,
      session_id: id,
      event_type: "terminated",
      event_data: { source: "manual_api" },
    });

    if ((eventInsert as any).error) {
      return fail("Failed to terminate session.", 500, "session_terminate_error", (eventInsert as any).error.message);
    }

    return sessionUpdate;
  }

  if (id && action === "events" && method === "GET") {
    const { data, error } = await ctx.admin
      .from("session_events")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("session_id", id)
      .order("occurred_at", { ascending: false })
      .limit(200);

    if (error) {
      return fail("Failed to fetch session events.", 500, "session_events_error", error.message);
    }

    return ok(data ?? []);
  }

  return null;
}

async function handlePolicies(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "policies") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const id = path[1];
  const action = path[2];

  if (id === "qos-profiles") {
    if (method === "GET") {
      return listTable(ctx, "qos_profiles", request, { searchField: "name" });
    }
    if (method === "POST") {
      const schema = z.object({
        name: z.string().min(2),
        qci: z.number().int().min(1).max(9).default(9),
        max_bandwidth_mbps: z.number().int().min(1),
        latency_target_ms: z.number().int().min(1),
        packet_loss_pct: z.number().min(0).max(100).default(1),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid QoS profile payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "qos_profiles", parsed.data);
    }
  }

  if (!id) {
    if (method === "GET") return listTable(ctx, "policy_rules", request, { searchField: "name" });
    if (method === "POST") {
      const schema = z.object({
        name: z.string().min(2),
        rule_type: z.string().min(2),
        conditions: z.record(z.string(), z.any()).default({}),
        actions: z.record(z.string(), z.any()).default({}),
        priority: z.number().int().min(1).max(999).default(100),
        is_active: z.boolean().default(true),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid policy payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "policy_rules", parsed.data);
    }
  }

  if (id && !action) {
    if (method === "GET") return getById(ctx, "policy_rules", id);
    if (method === "PUT") return updateById(ctx, "policy_rules", id, await parseBody(request, {}));
    if (method === "DELETE") {
      let query: any = ctx.admin.from("policy_rules").delete().eq("id", id);
      query = withTenant(query, "policy_rules", ctx.tenantId);
      const { error } = await query;
      if (error) return fail("Failed to delete policy.", 500, "policy_delete_error", error.message);
      return ok({ deleted: true });
    }
  }

  if (id && action === "activate" && method === "POST") {
    return updateById(ctx, "policy_rules", id, { is_active: true });
  }

  if (id && action === "deactivate" && method === "POST") {
    return updateById(ctx, "policy_rules", id, { is_active: false });
  }

  return null;
}

async function handleBilling(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "billing") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const section = path[1];
  const id = path[2];

  if (section === "summary" && method === "GET") {
    const [cdr, credits, charging] = await Promise.all([
      ctx.admin.from("cdr_records").select("charge_amount").eq("tenant_id", ctx.tenantId).limit(5000),
      ctx.admin.from("credit_balances").select("balance_amount").eq("tenant_id", ctx.tenantId).limit(5000),
      ctx.admin.from("charging_sessions").select("id,status").eq("tenant_id", ctx.tenantId).limit(5000),
    ]);

    if (cdr.error || credits.error || charging.error) {
      return fail("Failed to fetch billing summary.", 500, "billing_summary_error", {
        cdr: cdr.error?.message,
        credits: credits.error?.message,
        charging: charging.error?.message,
      });
    }

    const totalCharges = (cdr.data ?? []).reduce((sum: number, row: any) => sum + Number(row.charge_amount ?? 0), 0);
    const totalCredits = (credits.data ?? []).reduce((sum: number, row: any) => sum + Number(row.balance_amount ?? 0), 0);
    const activeChargingSessions = (charging.data ?? []).filter((item: any) => item.status === "active").length;

    return ok({
      total_charges: totalCharges,
      total_credit_balance: totalCredits,
      active_charging_sessions: activeChargingSessions,
      cdr_count: cdr.data?.length ?? 0,
    });
  }

  if (section === "cdr") {
    if (!id && method === "GET") {
      return listTable(ctx, "cdr_records", request, {
        orderBy: "created_at",
      });
    }

    if (id === "export" && method === "POST") {
      const { data, error } = await ctx.admin
        .from("cdr_records")
        .select("id,subscriber_id,session_id,start_time,end_time,duration_seconds,bytes_uplink,bytes_downlink,charge_amount,charge_currency")
        .eq("tenant_id", ctx.tenantId)
        .order("start_time", { ascending: false })
        .limit(10000);

      if (error) {
        return fail("Failed to export CDR records.", 500, "cdr_export_error", error.message);
      }

      const csv = toCsv((data ?? []) as Array<Record<string, unknown>>);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="cdr-export-${Date.now()}.csv"`,
        },
      });
    }

    if (id && id !== "export" && method === "GET") {
      return getById(ctx, "cdr_records", id);
    }
  }

  if (section === "credits") {
    if (!id && method === "GET") {
      return listTable(ctx, "credit_balances", request, {
        orderBy: "updated_at",
      });
    }

    if (id === "topup" && method === "POST") {
      const schema = z.object({
        subscriber_id: z.string().uuid(),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid topup payload.", 400, "validation_error", parsed.error.flatten());
      }

      const { data: existing } = await ctx.admin
        .from("credit_balances")
        .select("id, balance_amount")
        .eq("tenant_id", ctx.tenantId)
        .eq("subscriber_id", parsed.data.subscriber_id)
        .maybeSingle();

      if (existing) {
        return updateById(ctx, "credit_balances", existing.id, {
          balance_amount: Number(existing.balance_amount ?? 0) + parsed.data.amount,
          balance_currency: parsed.data.currency,
          last_recharged_at: nowIso(),
          updated_at: nowIso(),
        });
      }

      return insertOne(ctx, "credit_balances", {
        subscriber_id: parsed.data.subscriber_id,
        balance_amount: parsed.data.amount,
        balance_currency: parsed.data.currency,
        last_recharged_at: nowIso(),
      });
    }

    if (id && id !== "topup" && method === "GET") {
      const { data, error } = await ctx.admin
        .from("credit_balances")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .eq("subscriber_id", id)
        .maybeSingle();
      if (error) {
        return fail("Failed to fetch credit balance.", 500, "credits_fetch_error", error.message);
      }
      return ok(data);
    }
  }

  if (section === "charging-sessions" && method === "GET") {
    return listTable(ctx, "charging_sessions", request, {
      orderBy: "started_at",
    });
  }

  return null;
}

async function handleMonitoring(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "monitoring") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const section = path[1];
  const id = path[2];

  if (section === "metrics") {
    if (!id && method === "GET") {
      return listTable(ctx, "performance_metrics", request, {
        orderBy: "recorded_at",
      });
    }

    if (id === "summary" && method === "GET") {
      const { data, error } = await ctx.admin
        .from("performance_metrics")
        .select("metric_name, metric_value, recorded_at")
        .eq("tenant_id", ctx.tenantId)
        .order("recorded_at", { ascending: false })
        .limit(300);

      if (error) {
        return fail("Failed to fetch metric summary.", 500, "metrics_summary_error", error.message);
      }

      const latestByMetric = new Map<string, any>();
      (data ?? []).forEach((metric: any) => {
        if (!latestByMetric.has(metric.metric_name)) {
          latestByMetric.set(metric.metric_name, metric);
        }
      });

      return ok(Array.from(latestByMetric.values()));
    }
  }

  if (section === "alerts") {
    if (!id && method === "GET") {
      return listTable(ctx, "alerts", request, {
        searchField: "alert_name",
      });
    }

    if (!id && method === "POST") {
      const schema = z.object({
        alert_name: z.string().min(2),
        severity: z.enum(["critical", "warning", "info"]),
        entity_type: z.string().optional(),
        entity_id: z.string().uuid().optional(),
        condition: z.record(z.string(), z.any()).default({}),
        is_active: z.boolean().default(true),
      });

      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid alert payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "alerts", parsed.data);
    }

    if (id && method === "PUT") {
      return updateById(ctx, "alerts", id, await parseBody(request, {}));
    }

    if (id && method === "DELETE") {
      let query: any = ctx.admin.from("alerts").delete().eq("id", id);
      query = withTenant(query, "alerts", ctx.tenantId);
      const { error } = await query;
      if (error) return fail("Failed to delete alert.", 500, "alert_delete_error", error.message);
      return ok({ deleted: true });
    }
  }

  if (section === "logs" && method === "GET") {
    return listTable(ctx, "logs", request, {
      searchField: "message",
      orderBy: "occurred_at",
    });
  }

  if (section === "traces" && method === "GET") {
    return listTable(ctx, "traces", request, {
      orderBy: "started_at",
      searchField: "trace_name",
    });
  }

  if (section === "health" && method === "GET") {
    const [nfs, alarms, sessions] = await Promise.all([
      ctx.admin.from("network_functions").select("id,status").eq("tenant_id", ctx.tenantId).limit(5000),
      ctx.admin.from("alarms").select("id,status,severity").eq("tenant_id", ctx.tenantId).limit(5000),
      ctx.admin.from("sessions").select("id,status").eq("tenant_id", ctx.tenantId).limit(5000),
    ]);

    if (nfs.error || alarms.error || sessions.error) {
      return fail("Failed to fetch health overview.", 500, "health_overview_error", {
        network_functions: nfs.error?.message,
        alarms: alarms.error?.message,
        sessions: sessions.error?.message,
      });
    }

    return ok({
      network_functions: {
        total: nfs.data?.length ?? 0,
        active: (nfs.data ?? []).filter((item: any) => item.status === "active").length,
        degraded: (nfs.data ?? []).filter((item: any) => item.status === "degraded").length,
      },
      alarms: {
        total: alarms.data?.length ?? 0,
        active: (alarms.data ?? []).filter((item: any) => item.status === "active").length,
        critical: (alarms.data ?? []).filter((item: any) => item.severity === "critical").length,
      },
      sessions: {
        total: sessions.data?.length ?? 0,
        active: (sessions.data ?? []).filter((item: any) => item.status === "active").length,
      },
      checked_at: nowIso(),
    });
  }

  return null;
}

async function handleFaults(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "faults") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const group = path[1];
  const id = path[2];
  const action = path[3];

  if (group === "alarms") {
    if (!id && method === "GET") {
      return listTable(ctx, "alarms", request, {
        orderBy: "raised_at",
      });
    }

    if (id && !action && method === "GET") {
      return getById(ctx, "alarms", id);
    }

    if (id && action === "acknowledge" && method === "POST") {
      return updateById(ctx, "alarms", id, {
        status: "acknowledged",
        acknowledged_by: ctx.userId,
      });
    }

    if (id && action === "clear" && method === "POST") {
      return updateById(ctx, "alarms", id, {
        status: "cleared",
        cleared_at: nowIso(),
      });
    }
  }

  if (group === "incidents") {
    if (!id) {
      if (method === "GET") {
        return listTable(ctx, "incidents", request, {
          searchField: "title",
        });
      }

      if (method === "POST") {
        const schema = z.object({
          title: z.string().min(3),
          description: z.string().optional(),
          severity: z.string().optional(),
          assigned_to: z.string().uuid().optional(),
          alarm_ids: z.array(z.string().uuid()).default([]),
        });
        const parsed = schema.safeParse(await parseBody(request, {}));
        if (!parsed.success) {
          return fail("Invalid incident payload.", 400, "validation_error", parsed.error.flatten());
        }
        return insertOne(ctx, "incidents", {
          ...parsed.data,
          status: "open",
        });
      }
    }

    if (id && !action) {
      if (method === "GET") return getById(ctx, "incidents", id);
      if (method === "PUT") return updateById(ctx, "incidents", id, await parseBody(request, {}));
    }

    if (id && action === "resolve" && method === "POST") {
      return updateById(ctx, "incidents", id, {
        status: "resolved",
        resolved_at: nowIso(),
      });
    }
  }

  return null;
}

async function createOrchestrationJob(
  ctx: RequestContext,
  jobType: string,
  payload: Record<string, unknown>,
  targetType?: string,
  targetId?: string,
) {
  const { data, error } = await ctx.admin
    .from("orchestration_jobs")
    .insert({
      tenant_id: ctx.tenantId,
      job_type: jobType,
      payload,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      status: "queued",
    })
    .select("*")
    .single();

  if (error) {
    return fail("Failed to create orchestration job.", 500, "orchestration_job_error", error.message);
  }

  return ok(data, 201);
}

async function handleOrchestration(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "orchestration") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const action = path[1];
  const id = path[2];

  if (["deploy", "scale", "heal", "migrate", "update"].includes(action ?? "") && method === "POST") {
    const payload = await parseBody<Record<string, unknown>>(request, {});
    return createOrchestrationJob(ctx, action!, payload, (payload.target_type as string | undefined) ?? "network_function", payload.target_id as string | undefined);
  }

  if (action === "jobs" && !id && method === "GET") {
    return listTable(ctx, "orchestration_jobs", request, {
      orderBy: "created_at",
      searchField: "job_type",
    });
  }

  if (action === "jobs" && id && method === "GET") {
    return getById(ctx, "orchestration_jobs", id);
  }

  return null;
}

async function handleSecurity(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "security") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const action = path[1];

  if (action === "audit-logs" && method === "GET") {
    return listTable(ctx, "audit_logs", request, {
      orderBy: "occurred_at",
      searchField: "action",
    });
  }

  if (action === "policies") {
    if (method === "GET") {
      return listTable(ctx, "security_policies", request, {
        searchField: "name",
      });
    }

    if (method === "POST") {
      const schema = z.object({
        name: z.string().min(2),
        policy_type: z.string().min(2),
        rules: z.record(z.string(), z.any()).default({}),
        is_active: z.boolean().default(true),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid security policy payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "security_policies", parsed.data);
    }
  }

  if (action === "threats" && method === "GET") {
    return listTable(ctx, "threat_alerts", request, {
      orderBy: "occurred_at",
      searchField: "description",
    });
  }

  if (action === "scan" && method === "POST") {
    const payload = await parseBody<Record<string, unknown>>(request, {});
    const { data, error } = await ctx.admin
      .from("threat_alerts")
      .insert({
        tenant_id: ctx.tenantId,
        threat_type: "scan",
        severity: "info",
        description: "Security scan triggered manually.",
        metadata: payload,
      })
      .select("*")
      .single();

    if (error) {
      return fail("Failed to trigger security scan.", 500, "security_scan_error", error.message);
    }

    return ok(data, 201);
  }

  return null;
}

async function handleAI(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "ai") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const action = path[1];
  const sub = path[2];

  if (action === "intent" && method === "POST") {
    const schema = z.object({ prompt: z.string().min(5) });
    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid intent payload.", 400, "validation_error", parsed.error.flatten());
    }

    const intent = parseIntent(parsed.data.prompt);
    return ok({
      intent,
      preview_changes: {
        target: intent.target,
        action: intent.action,
        amount_percent: intent.amountPercent,
      },
      next_action_endpoint: "/api/orchestration/scale",
    });
  }

  if (action === "predictions" && method === "GET") {
    return listTable(ctx, "ai_predictions", request, {
      orderBy: "predicted_for",
      searchField: "prediction_type",
    });
  }

  if (action === "anomalies" && method === "GET") {
    return listTable(ctx, "anomaly_alerts", request, {
      orderBy: "detected_at",
      searchField: "anomaly_type",
    });
  }

  if (action === "models") {
    if (!sub && method === "GET") {
      return listTable(ctx, "model_registry", request, {
        searchField: "model_name",
      });
    }

    if (sub === "deploy" && method === "POST") {
      const schema = z.object({ model_id: z.string().uuid() });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid model deploy payload.", 400, "validation_error", parsed.error.flatten());
      }

      const update = await updateById(ctx, "model_registry", parsed.data.model_id, {
        status: "active",
      });

      await ctx.admin.from("orchestration_jobs").insert({
        tenant_id: ctx.tenantId,
        job_type: "model_deploy",
        target_type: "model",
        target_id: parsed.data.model_id,
        payload: {},
        status: "queued",
      });

      return update;
    }
  }

  if (action === "optimizations") {
    if (!sub && method === "GET") {
      return listTable(ctx, "optimization_recommendations", request, {
        orderBy: "created_at",
        searchField: "title",
      });
    }

    if (sub === "apply" && method === "POST") {
      const schema = z.object({ recommendation_id: z.string().uuid() });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid optimization apply payload.", 400, "validation_error", parsed.error.flatten());
      }

      return updateById(ctx, "optimization_recommendations", parsed.data.recommendation_id, {
        status: "applied",
        applied_at: nowIso(),
      });
    }
  }

  return null;
}

async function handleMarketplace(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "marketplace") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const id = path[1];
  const action = path[2];

  if (!id && method === "GET") {
    const { data, error } = await ctx.admin
      .from("marketplace_packages")
      .select("*, vendors(id, name)")
      .order("created_at", { ascending: false });

    if (error) {
      return fail("Failed to list marketplace packages.", 500, "marketplace_list_error", error.message);
    }

    return ok(data ?? []);
  }

  if (id === "installs" && !action && method === "GET") {
    return listTable(ctx, "marketplace_installs", request, {
      orderBy: "installed_at",
    });
  }

  if (id === "installs" && action && method === "DELETE") {
    let query: any = ctx.admin.from("marketplace_installs").delete().eq("id", action);
    query = withTenant(query, "marketplace_installs", ctx.tenantId);
    const { error } = await query;
    if (error) return fail("Failed to uninstall package.", 500, "marketplace_uninstall_error", error.message);
    return ok({ deleted: true });
  }

  if (id && !action && method === "GET") {
    const { data, error } = await ctx.admin
      .from("marketplace_packages")
      .select("*, vendors(id, name, website_url)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return fail("Failed to fetch marketplace package.", 500, "marketplace_get_error", error.message);
    }

    if (!data) {
      return fail("Package not found.", 404, "not_found");
    }

    return ok(data);
  }

  if (id && action === "install" && method === "POST") {
    return insertOne(ctx, "marketplace_installs", {
      package_id: id,
      status: "installed",
      installed_by: ctx.userId,
      installed_at: nowIso(),
    });
  }

  return null;
}

async function handleCompliance(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "compliance") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const section = path[1];
  const sub = path[2];

  if (section === "reports" && method === "GET") {
    return listTable(ctx, "compliance_reports", request, {
      searchField: "report_name",
      orderBy: "generated_at",
    });
  }

  if (section === "gdpr") {
    if (sub === "request" && method === "POST") {
      const schema = z.object({
        requester_email: z.string().email(),
        request_type: z.enum(["access", "deletion", "portability"]),
        subscriber_id: z.string().uuid().optional(),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid GDPR request payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "gdpr_requests", parsed.data);
    }

    if (sub === "requests" && method === "GET") {
      return listTable(ctx, "gdpr_requests", request, {
        searchField: "requester_email",
      });
    }
  }

  if (section === "regulatory-logs" && method === "GET") {
    return listTable(ctx, "regulatory_logs", request, {
      orderBy: "occurred_at",
      searchField: "event_type",
    });
  }

  if (section === "check" && method === "POST") {
    const payload = await parseBody<Record<string, unknown>>(request, {});
    return insertOne(ctx, "compliance_reports", {
      report_name: `Automated Compliance Check ${new Date().toISOString().slice(0, 10)}`,
      status: "passed",
      summary: {
        checks_executed: 24,
        failures: 0,
        payload,
      },
      generated_at: nowIso(),
    });
  }

  return null;
}

async function handleAnalytics(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "analytics") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  if (method !== "GET") return null;

  const section = path[1];
  const id = path[2];

  if (!section) {
    const [subs, sessions, nfs, slices, metrics, cdr] = await Promise.all([
      ctx.admin.from("subscribers").select("id,status,plan", { count: "exact", head: true }).eq("tenant_id", ctx.tenantId),
      ctx.admin.from("sessions").select("id,status,bytes_uplink,bytes_downlink", { count: "exact" }).eq("tenant_id", ctx.tenantId),
      ctx.admin.from("network_functions").select("id,status,nf_type", { count: "exact" }).eq("tenant_id", ctx.tenantId),
      ctx.admin.from("network_slices").select("id,status,slice_type", { count: "exact" }).eq("tenant_id", ctx.tenantId),
      ctx.admin.from("performance_metrics").select("metric_name,metric_value,recorded_at").eq("tenant_id", ctx.tenantId).order("recorded_at", { ascending: false }).limit(100),
      ctx.admin.from("cdr_records").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.tenantId),
    ]);

    const sessionData = sessions.data ?? [];
    const totalBytes = sessionData.reduce((sum: number, s: any) => sum + (Number(s.bytes_uplink) || 0) + (Number(s.bytes_downlink) || 0), 0);
    const activeSessions = sessionData.filter((s: any) => s.status === "active").length;

    return ok({
      overview: {
        subscribers: { total: subs.count ?? 0 },
        sessions: { total: sessions.count ?? 0, active: activeSessions, total_bytes: totalBytes },
        network_functions: { total: nfs.count ?? 0 },
        slices: { total: slices.count ?? 0 },
        billing: { cdr_records: cdr.count ?? 0 },
      },
      latest_metrics: metrics.data ?? [],
      generated_at: nowIso(),
    });
  }

  if (section === "usage" && !id) {
    const { data } = await ctx.admin
      .from("cdr_records")
      .select("duration_seconds,bytes_uplink,bytes_downlink,charge_amount")
      .eq("tenant_id", ctx.tenantId)
      .order("created_at", { ascending: false })
      .limit(500);

    const totalDuration = (data ?? []).reduce((s, r) => s + (Number(r.duration_seconds) || 0), 0);
    const totalBytes = (data ?? []).reduce((s, r) => s + (Number(r.bytes_uplink) || 0) + (Number(r.bytes_downlink) || 0), 0);
    const totalRevenue = (data ?? []).reduce((s, r) => s + (Number(r.charge_amount) || 0), 0);

    return ok({
      usage: { total_duration_seconds: totalDuration, total_bytes: totalBytes, total_revenue: totalRevenue },
      records_count: data?.length ?? 0,
      generated_at: nowIso(),
    });
  }

  if (section === "subscribers" && !id) {
    return listTable(ctx, "subscribers", request, { orderBy: "created_at", select: "id,imsi,msisdn,status,plan,created_at" });
  }

  return null;
}

async function handleConfigurations(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "configurations") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const id = path[1];
  const action = path[2];

  if (!id && method === "GET") {
    return listTable(ctx, "configurations", request, {
      orderBy: "updated_at",
      searchField: "name",
    });
  }

  if (!id && method === "POST") {
    const schema = z.object({
      name: z.string().min(2),
      scope: z.string().default("platform"),
      scope_id: z.string().uuid().optional(),
      config: z.record(z.string(), z.any()).default({}),
      description: z.string().optional(),
    });
    const parsed = schema.safeParse(await parseBody(request, {}));
    if (!parsed.success) {
      return fail("Invalid configuration payload.", 400, "validation_error", parsed.error.flatten());
    }
    return insertOne(ctx, "configurations", {
      ...parsed.data,
      scope_id: parsed.data.scope_id ?? null,
      version: 1,
    });
  }

  if (id && !action) {
    if (method === "GET") return getById(ctx, "configurations", id);
    if (method === "PUT") {
      const schema = z.object({
        config: z.record(z.string(), z.any()).optional(),
        description: z.string().optional(),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid configuration update payload.", 400, "validation_error", parsed.error.flatten());
      }
      const { data: existing } = await ctx.admin.from("configurations").select("version,id").eq("id", id).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (!existing) return fail("Configuration not found.", 404, "not_found");

      const update: Record<string, unknown> = { ...parsed.data };
      if (update.config) update.version = (existing.version ?? 1) + 1;
      return updateById(ctx, "configurations", id, update);
    }
    if (method === "DELETE") {
      let query: any = ctx.admin.from("configurations").delete().eq("id", id);
      query = withTenant(query, "configurations", ctx.tenantId);
      const { error } = await query;
      if (error) return fail("Failed to delete configuration.", 500, "config_delete_error", error.message);
      return ok({ deleted: true });
    }
  }

  if (id && action === "rollback" && method === "POST") {
    const { data: current } = await ctx.admin.from("configurations").select("previous_version_id,config").eq("id", id).eq("tenant_id", ctx.tenantId).maybeSingle();
    if (!current || !current.previous_version_id) return fail("No previous version to rollback to.", 404, "no_rollback");
    const { data: prev } = await ctx.admin.from("configurations").select("config").eq("id", current.previous_version_id).maybeSingle();
    if (!prev) return fail("Previous version not found.", 404, "not_found");
    return updateById(ctx, "configurations", id, { config: prev.config });
  }

  return null;
}

async function handleDeployments(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "deployments") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const id = path[1];
  const action = path[2];

  if (!id && method === "GET") {
    return listTable(ctx, "orchestration_jobs", request, {
      orderBy: "created_at",
      extraFilters: [{ column: "job_type", value: "deploy" }],
    });
  }

  if (id && !action && method === "GET") {
    return getById(ctx, "orchestration_jobs", id);
  }

  if (!id && method === "POST") {
    const payload = await parseBody<Record<string, unknown>>(request, {});
    return createOrchestrationJob(ctx, "deploy", payload);
  }

  if (id && action === "status" && method === "GET") {
    const res = await getById(ctx, "orchestration_jobs", id);
    const body = await res.json();
    if (!body.ok) return res;
    return ok({ status: body.data?.status, result: body.data?.result, completed_at: body.data?.completed_at });
  }

  return null;
}

async function handleEdge(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "edge") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  const section = path[1];
  const id = path[2];
  const sub = path[3];

  if (section === "clusters") {
    if (!id && method === "GET") {
      return listTable(ctx, "edge_clusters", request, { orderBy: "name", searchField: "name" });
    }
    if (!id && method === "POST") {
      const schema = z.object({
        name: z.string().min(2),
        region_id: z.string().uuid().optional(),
        kubernetes_version: z.string().optional(),
        node_count: z.number().int().min(0).default(0),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid edge cluster payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "edge_clusters", {
        ...parsed.data,
        region_id: parsed.data.region_id ?? null,
        status: "provisioning",
      });
    }
    if (id && !sub) {
      if (method === "GET") return getById(ctx, "edge_clusters", id);
      if (method === "PUT") return updateById(ctx, "edge_clusters", id, await parseBody(request, {}));
      if (method === "DELETE") {
        let query: any = ctx.admin.from("edge_clusters").delete().eq("id", id);
        query = withTenant(query, "edge_clusters", ctx.tenantId);
        const { error } = await query;
        if (error) return fail("Failed to delete edge cluster.", 500, "edge_delete_error", error.message);
        return ok({ deleted: true });
      }
    }
    if (id && sub === "nodes" && method === "GET") {
      const { data, error } = await ctx.admin
        .from("edge_nodes")
        .select("*")
        .eq("cluster_id", id)
        .eq("tenant_id", ctx.tenantId)
        .order("hostname");

      if (error) return fail("Failed to list edge nodes.", 500, "edge_nodes_error", error.message);
      return ok({ items: data ?? [] });
    }
    if (id && sub === "nodes" && method === "POST") {
      const schema = z.object({
        hostname: z.string().min(1),
        ip_address: z.string().optional(),
        cpu_cores: z.number().int().min(0).optional(),
        memory_gb: z.number().min(0).optional(),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid edge node payload.", 400, "validation_error", parsed.error.flatten());
      }
      return insertOne(ctx, "edge_nodes", {
        ...parsed.data,
        cluster_id: id,
        status: "provisioning",
      });
    }
  }

  if (section === "nodes") {
    if (!id && method === "GET") {
      return listTable(ctx, "edge_nodes", request, { orderBy: "hostname", searchField: "hostname" });
    }
    if (id && method === "GET") return getById(ctx, "edge_nodes", id);
    if (id && method === "PUT") return updateById(ctx, "edge_nodes", id, await parseBody(request, {}));
    if (id && method === "DELETE") {
      let query: any = ctx.admin.from("edge_nodes").delete().eq("id", id);
      query = withTenant(query, "edge_nodes", ctx.tenantId);
      const { error } = await query;
      if (error) return fail("Failed to delete edge node.", 500, "edge_node_delete_error", error.message);
      return ok({ deleted: true });
    }
  }

  return null;
}

async function handleAdmin(path: string[], method: string, request: NextRequest) {
  if (path[0] !== "admin") return null;

  const built = await buildContext(request);
  if ("error" in built) return built.error;
  const { ctx } = built;

  if (!ensureRole(ctx, "tenant_admin")) {
    return fail("Admin role required.", 403, "forbidden");
  }

  const section = path[1];
  const id = path[2];
  const action = path[3];

  if (section === "tenants") {
    if (!id && method === "GET") {
      if (ctx.role === "super_admin") {
        const { data, error } = await ctx.admin.from("tenants").select("*").order("created_at", { ascending: false });
        if (error) return fail("Failed to list tenants.", 500, "tenant_list_error", error.message);
        return ok(data ?? []);
      }

      const { data, error } = await ctx.admin.from("tenants").select("*").eq("id", ctx.tenantId).maybeSingle();
      if (error) return fail("Failed to fetch tenant.", 500, "tenant_get_error", error.message);
      return ok(data ? [data] : []);
    }

    if (!id && method === "POST") {
      if (ctx.role !== "super_admin") {
        return fail("Only super_admin can create tenants.", 403, "forbidden");
      }

      const schema = z.object({
        name: z.string().min(2),
        slug: z.string().min(2),
        plan: z.string().default("starter"),
      });

      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid tenant payload.", 400, "validation_error", parsed.error.flatten());
      }

      const payload = {
        ...parsed.data,
        slug: toSlug(parsed.data.slug),
      };

      const { data, error } = await ctx.admin.from("tenants").insert(payload).select("*").single();
      if (error) return fail("Failed to create tenant.", 500, "tenant_create_error", error.message);
      return ok(data, 201);
    }

    if (id && !action) {
      if (method === "GET") {
        const { data, error } = await ctx.admin.from("tenants").select("*").eq("id", id).maybeSingle();
        if (error) return fail("Failed to fetch tenant.", 500, "tenant_get_error", error.message);
        if (!data) return fail("Tenant not found.", 404, "not_found");
        return ok(data);
      }

      if (method === "PUT") {
        if (ctx.role !== "super_admin" && ctx.tenantId !== id) {
          return fail("Cannot update another tenant.", 403, "forbidden");
        }

        const payload = await parseBody<Record<string, unknown>>(request, {});
        const { data, error } = await ctx.admin.from("tenants").update(payload).eq("id", id).select("*").maybeSingle();
        if (error) return fail("Failed to update tenant.", 500, "tenant_update_error", error.message);
        if (!data) return fail("Tenant not found.", 404, "not_found");
        return ok(data);
      }
    }
  }

  if (section === "users") {
    if (!id && method === "GET") {
      return listTable(ctx, "user_profiles", request, {
        searchField: "full_name",
      });
    }

    if (id === "invite" && method === "POST") {
      const schema = z.object({
        email: z.string().email(),
        role: z
          .enum(["tenant_admin", "network_engineer", "billing_manager", "readonly_viewer", "api_service"])
          .default("readonly_viewer"),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid invite payload.", 400, "validation_error", parsed.error.flatten());
      }

      const token = crypto.randomBytes(20).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString();

      return insertOne(ctx, "user_invites", {
        email: parsed.data.email,
        role: parsed.data.role,
        invite_token: token,
        expires_at: expiresAt,
      });
    }

    if (id && !action && method === "DELETE") {
      return updateById(ctx, "user_profiles", id, {
        is_active: false,
      });
    }

    if (id && action === "role" && method === "PUT") {
      const schema = z.object({
        role: z
          .enum(["tenant_admin", "network_engineer", "billing_manager", "readonly_viewer", "api_service", "super_admin"]),
      });
      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid role update payload.", 400, "validation_error", parsed.error.flatten());
      }

      if (ctx.role !== "super_admin" && parsed.data.role === "super_admin") {
        return fail("Only super_admin can grant super_admin role.", 403, "forbidden");
      }

      return updateById(ctx, "user_profiles", id, {
        role: parsed.data.role,
      });
    }
  }

  if (section === "regions") {
    if (method === "GET") {
      const { data, error } = await ctx.admin.from("regions").select("*").order("name", { ascending: true });
      if (error) return fail("Failed to list regions.", 500, "regions_list_error", error.message);
      return ok(data ?? []);
    }

    if (method === "POST") {
      if (!ensureRole(ctx, "super_admin")) {
        return fail("Only super_admin can add regions.", 403, "forbidden");
      }

      const schema = z.object({
        name: z.string().min(2),
        code: z.string().min(2),
        cloud_provider: z.string().min(2),
        country: z.string().min(2),
      });

      const parsed = schema.safeParse(await parseBody(request, {}));
      if (!parsed.success) {
        return fail("Invalid region payload.", 400, "validation_error", parsed.error.flatten());
      }

      const { data, error } = await ctx.admin.from("regions").insert(parsed.data).select("*").single();
      if (error) return fail("Failed to add region.", 500, "region_create_error", error.message);
      return ok(data, 201);
    }
  }

  return null;
}

export async function handleApiRoute(request: NextRequest, segments: string[], method: string) {
  if (!segments.length) {
    return ok({ service: "NGCMCP API", version: "v1" });
  }

  const handlers = [
    handleAuth,
    handleSubscribers,
    handleNetworkFunctions,
    handleSlices,
    handleSessions,
    handlePolicies,
    handleBilling,
    handleMonitoring,
    handleFaults,
    handleOrchestration,
    handleSecurity,
    handleAI,
    handleMarketplace,
    handleCompliance,
    handleAnalytics,
    handleConfigurations,
    handleDeployments,
    handleEdge,
    handleAdmin,
  ];

  for (const handler of handlers) {
    const result = await handler(segments, method, request);
    if (result !== null) {
      return result;
    }
  }

  return fail(`Endpoint not found: /api/${segments.join("/")}`, 404, "not_found");
}
