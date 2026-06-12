type SupabaseRequestInit = RequestInit & {
  prefer?: string;
};

function getSupabaseUrl() {
  const raw = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();

  return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/g, "");
}

function getSupabaseServiceKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ""
  ).trim();
}

export function assertSupabaseServerConfig() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();

  if (!url || !key) {
    throw new Error("缺少 Supabase 服务端环境变量，请配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。");
  }

  return { url, key };
}

async function requestSupabase<T>(path: string, init: SupabaseRequestInit) {
  const { url, key } = assertSupabaseServerConfig();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: init.prefer ?? "return=representation",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase 请求失败: ${response.status}`);
  }

  if (response.status === 204) {
    return [] as T[];
  }

  return (await response.json()) as T[];
}

export async function selectList<T>(path: string) {
  return requestSupabase<T>(path, { method: "GET", prefer: undefined });
}

export async function selectSingle<T>(path: string) {
  const rows = await selectList<T>(path);
  return rows[0] ?? null;
}

export async function insertRows<T>(path: string, payload: unknown, prefer?: string) {
  return requestSupabase<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
    prefer,
  });
}

export async function patchRows<T>(path: string, payload: unknown, prefer?: string) {
  return requestSupabase<T>(path, {
    method: "PATCH",
    body: JSON.stringify(payload),
    prefer,
  });
}

export async function deleteRows<T>(path: string, prefer?: string) {
  return requestSupabase<T>(path, {
    method: "DELETE",
    prefer,
  });
}
