import { ApiError } from "@/lib/api/errors";

type TeedyConfig = {
  baseUrl: string;
  username: string;
  password: string;
  language: string;
};

type TeedyUploadResult = {
  documentId: string;
  fileId: string;
  sizeBytes: number;
};

function getTeedyConfig(): TeedyConfig {
  const baseUrl = process.env.TEEDY_BASE_URL?.replace(/\/+$/, "");
  const username = process.env.TEEDY_USERNAME;
  const password = process.env.TEEDY_PASSWORD;
  const language = process.env.TEEDY_LANGUAGE ?? "eng";

  if (!baseUrl || !username || !password) {
    throw new ApiError(503, "teedy_not_configured", "Teedy file storage is not configured.");
  }

  return { baseUrl, username, password, language };
}

function getAuthToken(setCookie: string | null): string {
  const authCookie = setCookie
    ?.split(/,(?=\s*auth_token=)/)
    .flatMap((cookie) => cookie.split(";"))
    .map((part) => part.trim())
    .find((part) => part.startsWith("auth_token="));

  const token = authCookie?.slice("auth_token=".length);
  if (!token) {
    throw new ApiError(502, "teedy_login_failed", "Teedy did not return an auth token.");
  }
  return token;
}

async function login(config: TeedyConfig): Promise<string> {
  const body = new URLSearchParams({
    username: config.username,
    password: config.password,
    remember: "true",
  });

  const response = await fetch(`${config.baseUrl}/api/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new ApiError(502, "teedy_login_failed", "Could not log in to Teedy.");
  }

  return getAuthToken(response.headers.get("set-cookie"));
}

async function teedyFetch(path: string, init: RequestInit = {}) {
  const config = getTeedyConfig();
  const token = await login(config);
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Cookie: `auth_token=${token}`,
    },
  });

  return { response, config };
}

async function createDocument(title: string, description: string): Promise<string> {
  const config = getTeedyConfig();
  const token = await login(config);
  const body = new URLSearchParams({
    title: title.slice(0, 100) || "Crop Data Attachment",
    description: description.slice(0, 4000),
    language: config.language,
  });

  const response = await fetch(`${config.baseUrl}/api/document`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `auth_token=${token}`,
    },
    body,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.id) {
    throw new ApiError(502, "teedy_document_failed", "Could not create a Teedy document.");
  }

  return json.id as string;
}

export async function uploadToTeedy(input: {
  cropDataId: string;
  file: File;
  title?: string | null;
}): Promise<TeedyUploadResult> {
  const documentId = await createDocument(
    input.file.name,
    `Crop Data ${input.cropDataId}${input.title ? ` - ${input.title}` : ""}`
  );

  const formData = new FormData();
  formData.append("id", documentId);
  formData.append("file", input.file, input.file.name);

  const { response } = await teedyFetch("/api/file", {
    method: "PUT",
    body: formData,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.id) {
    throw new ApiError(502, "teedy_upload_failed", "Could not upload the file to Teedy.");
  }

  return {
    documentId,
    fileId: json.id as string,
    sizeBytes: Number(json.size ?? input.file.size),
  };
}

export async function getTeedyFileData(fileId: string, size?: "web" | "thumb" | "content") {
  const params = size ? `?size=${encodeURIComponent(size)}` : "";
  const { response } = await teedyFetch(`/api/file/${encodeURIComponent(fileId)}/data${params}`);

  if (!response.ok || !response.body) {
    throw new ApiError(502, "teedy_download_failed", "Could not download the file from Teedy.");
  }

  return response;
}

export async function deleteTeedyFile(fileId: string) {
  const { response } = await teedyFetch(`/api/file/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new ApiError(502, "teedy_delete_failed", "Could not delete the file from Teedy.");
  }
}

export async function deleteTeedyDocument(documentId: string) {
  const { response } = await teedyFetch(`/api/document/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new ApiError(502, "teedy_delete_failed", "Could not delete the document from Teedy.");
  }
}
