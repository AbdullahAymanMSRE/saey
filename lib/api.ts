/** Thin fetch wrapper so every react-query call surfaces API errors the same way. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message)
  }
}

export async function api<T = unknown>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, ...rest } = init ?? {}

  const res = await fetch(path, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...rest.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  const payload = await res
    .json()
    .catch(() => null as unknown as Record<string, unknown> | null)

  if (!res.ok) {
    const body = payload as
      | { error?: string; issues?: { path?: (string | number)[]; message?: string }[] }
      | null

    // A bare "Invalid profile" tells the agency nothing about which field is
    // wrong, so the failing paths are folded into the message they actually see.
    const detail = body?.issues
      ?.slice(0, 3)
      .map((issue) =>
        [issue.path?.join("."), issue.message].filter(Boolean).join(": "),
      )
      .filter(Boolean)
      .join(" · ")

    const message =
      [body?.error, detail].filter(Boolean).join(" - ") ||
      `Request failed (${res.status})`

    throw new ApiError(res.status, message, payload)
  }

  return payload as T
}
