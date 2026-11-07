const JWT_KEYS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TITLE_LENGTH = 140;
const MAX_AUTHOR_LENGTH = 140;
const MAX_SUBJECT_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 500;
const VALID_TRACKS = new Set(["PCM", "PCB", "Commerce", "Humanities"]);
const VALID_GRADES = new Set(["XI", "XII", "SUPPLEMENTAL"]);
const VALID_LICENSES = new Set(["CC-BY", "CC-BY-SA", "PUBLIC-DOMAIN", "OER"]);
const SQL_COLUMNS = `id, title, author, subject, track, grade, description, license, file_size, status, created_at`;

let signingKeysPromise;
let signingKeysExpiry = 0;
let signingKeysCacheControl = "public, max-age=3600";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function configuredOrigins(env) {
  return (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin || !configuredOrigins(env).includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Expose-Headers": "Content-Length, Content-Disposition, ETag",
    "Vary": "Origin",
  };
}

function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function authorizedResponse(data, status, cors, cacheControl = "no-store") {
  return jsonResponse(data, status, { ...cors, "Cache-Control": cacheControl });
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  let binary;
  try {
    binary = atob(padded);
  } catch {
    throw new HttpError(401, "The sign-in token is not valid.");
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJwtPart(value) {
  const bytes = decodeBase64Url(value);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(401, "The sign-in token is not valid.");
  }
}

async function getFirebaseSigningKeys() {
  if (signingKeysPromise && Date.now() < signingKeysExpiry) return signingKeysPromise;
  signingKeysPromise = fetch(JWT_KEYS_URL, {
    headers: { "Accept": "application/json" },
  }).then(async (response) => {
    if (!response.ok) throw new HttpError(502, "Could not verify sign-in with Firebase.");
    signingKeysCacheControl = response.headers.get("Cache-Control") || signingKeysCacheControl;
    const cacheDuration = Number(signingKeysCacheControl.match(/max-age=(\d+)/)?.[1] || 3600);
    signingKeysExpiry = Date.now() + Math.min(Math.max(cacheDuration, 300), 86400) * 1000;
    return response.json();
  }).catch((error) => {
    signingKeysPromise = undefined;
    signingKeysExpiry = 0;
    throw error;
  });
  return signingKeysPromise;
}

async function authenticate(request, env) {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token || !env.FIREBASE_PROJECT_ID) throw new HttpError(401, "Sign in with a verified email or Google account first.");

  const segments = token.split(".");
  if (segments.length !== 3) throw new HttpError(401, "The sign-in token is not valid.");
  const header = decodeJwtPart(segments[0]);
  const claims = decodeJwtPart(segments[1]);
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new HttpError(401, "The sign-in token is not valid.");
  }

  const keys = await getFirebaseSigningKeys();
  const key = keys.keys?.find((candidate) => candidate.kid === header.kid);
  if (!key) throw new HttpError(401, "The sign-in token has expired. Sign in again.");

  let verified;
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      key,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    verified = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      decodeBase64Url(segments[2]),
      new TextEncoder().encode(`${segments[0]}.${segments[1]}`),
    );
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "Could not verify your Firebase sign-in.");
  }
  if (!verified) throw new HttpError(401, "The sign-in token is not valid.");

  const now = Math.floor(Date.now() / 1000);
  const projectId = env.FIREBASE_PROJECT_ID;
  if (claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}`
      || typeof claims.sub !== "string" || !claims.sub
      || !Number.isInteger(claims.exp) || claims.exp <= now
      || !Number.isInteger(claims.iat) || claims.iat > now + 60
      || !Number.isInteger(claims.auth_time) || claims.auth_time > now + 60
      || !claims.firebase?.sign_in_provider
      || claims.firebase.sign_in_provider === "anonymous") {
    throw new HttpError(401, "Sign in with a verified email or Google account to use the community shelf.");
  }
  return { uid: claims.sub };
}

function adminUids(env) {
  return new Set((env.ADMIN_UIDS || "").split(",").map((uid) => uid.trim()).filter(Boolean));
}

async function adminUser(request, env) {
  const user = await authenticate(request, env);
  if (!adminUids(env).has(user.uid)) throw new HttpError(403, "This action is reserved for Study Shelf moderators.");
  return user;
}

function publicBook(row, requestUrl) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    subject: row.subject,
    track: row.track,
    grade: row.grade,
    description: row.description,
    license: row.license,
    fileSize: row.file_size,
    status: row.status,
    createdAt: row.created_at,
    downloadUrl: new URL(`/api/books/${encodeURIComponent(row.id)}/file`, requestUrl).href,
  };
}

function requiredText(value, label, maxLength) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized || normalized.length > maxLength || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(normalized)) {
    throw new HttpError(400, `${label} is required and must be at most ${maxLength} characters.`);
  }
  return normalized;
}

function contentDispositionFilename(title) {
  const safe = title.normalize("NFKC").replace(/[^a-zA-Z0-9._ -]/g, "_").trim().slice(0, 100) || "shared-book";
  return `inline; filename="${safe.replace(/["\\]/g, "_")}.pdf"`;
}

function errorResponse(error, fallback, cors) {
  if (error instanceof HttpError) {
    return authorizedResponse({ error: error.message }, error.status, cors);
  }
  console.error(fallback, error);
  return authorizedResponse({ error: fallback }, 500, cors);
}

async function listBooks(request, env, cors) {
  let ownerUid = null;
  const authorization = request.headers.get("Authorization");
  if (authorization) ownerUid = (await authenticate(request, env)).uid;

  const url = new URL(request.url);
  const track = url.searchParams.get("track");
  const grade = url.searchParams.get("grade");
  if (track && !VALID_TRACKS.has(track)) throw new HttpError(400, "The study track is not valid.");
  if (grade && grade !== "ALL" && !VALID_GRADES.has(grade)) throw new HttpError(400, "The class filter is not valid.");
  const clauses = ["(status = 'approved'"];
  const bindings = [];
  if (ownerUid) {
    clauses[0] += " OR owner_uid = ?";
    bindings.push(ownerUid);
  }
  clauses[0] += ")";
  if (track === "PCM" || track === "PCB") {
    clauses.push("(track = ? OR (subject COLLATE NOCASE IN ('Physics', 'Chemistry') AND track IN ('PCM', 'PCB')))");
    bindings.push(track);
  } else if (track === "Commerce" || track === "Humanities") {
    clauses.push("(track = ? OR (subject COLLATE NOCASE = 'Economics' AND track IN ('Commerce', 'Humanities')))");
    bindings.push(track);
  } else if (track) {
    clauses.push("track = ?");
    bindings.push(track);
  }
  if (grade && grade !== "ALL") {
    clauses.push("(grade = ? OR grade = 'SUPPLEMENTAL')");
    bindings.push(grade);
  }
  const query = `SELECT ${SQL_COLUMNS}${ownerUid ? ", owner_uid" : ""} FROM community_books WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 200`;
  const result = await env.DB.prepare(query).bind(...bindings).all();
  return authorizedResponse({
    books: result.results.map((row) => ({
      ...publicBook(row, request.url),
      canDelete: Boolean(ownerUid && (row.owner_uid === ownerUid || adminUids(env).has(ownerUid))),
    })),
  }, 200, cors, "no-store");
}

async function createBook(request, env, cors) {
  const user = await authenticate(request, env);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.type !== "application/pdf" || file.size < 8 || file.size > MAX_FILE_BYTES) {
    throw new HttpError(400, "Choose a PDF file between 8 bytes and 20 MB.");
  }
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") throw new HttpError(400, "This file does not have a valid PDF signature.");

  const title = requiredText(form.get("title"), "Book title", MAX_TITLE_LENGTH);
  const author = requiredText(form.get("author"), "Author / attribution", MAX_AUTHOR_LENGTH);
  const subject = requiredText(form.get("subject"), "Subject", MAX_SUBJECT_LENGTH);
  const description = requiredText(form.get("description"), "Description", MAX_DESCRIPTION_LENGTH);
  const track = requiredText(form.get("track"), "Study path", 30);
  const grade = requiredText(form.get("grade"), "Class", 20);
  const license = requiredText(form.get("license"), "License", 30);
  if (!VALID_TRACKS.has(track) || !VALID_GRADES.has(grade) || !VALID_LICENSES.has(license)) {
    throw new HttpError(400, "Choose a valid stream, class, and redistribution license.");
  }
  if (form.get("rightsConfirmed") !== "on") {
    throw new HttpError(400, "Confirm that you have permission to publish this book.");
  }

  const dailyLimit = Math.min(Math.max(Number(env.MAX_UPLOADS_PER_DAY) || 5, 1), 20);
  const usage = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM community_books WHERE owner_uid = ? AND created_at >= ?",
  ).bind(user.uid, new Date(Date.now() - 86400000).toISOString()).first();
  if (usage.count >= dailyLimit) throw new HttpError(429, `The community upload limit is ${dailyLimit} files per account per day.`);

  const id = crypto.randomUUID();
  const objectKey = `community/${id}.pdf`;
  const createdAt = new Date().toISOString();
  let savedToBucket = false;
  try {
    await env.BOOKS.put(objectKey, file.stream(), {
      httpMetadata: { contentType: "application/pdf", cacheControl: "private, no-store" },
      customMetadata: { bookId: id },
    });
    savedToBucket = true;
    await env.DB.prepare(
      `INSERT INTO community_books (id, owner_uid, title, author, subject, track, grade, description, license, object_key, file_size, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    ).bind(id, user.uid, title, author, subject, track, grade, description, license, objectKey, file.size, createdAt).run();
  } catch (error) {
    if (savedToBucket) {
      try {
        await env.BOOKS.delete(objectKey);
      } catch (cleanupError) {
        console.error(`Could not clean up failed upload ${id}.`, cleanupError);
        throw new HttpError(500, "The book could not be cataloged and its private file could not be cleaned up. Contact a moderator.");
      }
    }
    if (error instanceof HttpError) throw error;
    console.error(`Could not save uploaded book ${id}.`, error);
    throw new HttpError(500, "Could not safely save this book. Try again later.");
  }

  const row = { id, title, author, subject, track, grade, description, license, file_size: file.size, status: "pending", created_at: createdAt };
  return authorizedResponse({ book: publicBook(row, request.url) }, 201, cors);
}

async function serveBook(id, request, env, cors) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new HttpError(404, "This community book was not found.");
  }
  const row = await env.DB.prepare(
    `SELECT ${SQL_COLUMNS}, owner_uid, object_key FROM community_books WHERE id = ?`,
  ).bind(id).first();
  if (!row) throw new HttpError(404, "This community book was not found.");
  let canManage = false;
  if (row.status !== "approved" || request.headers.has("Authorization")) {
    const token = request.headers.get("Authorization");
    if (token) {
      const user = await authenticate(request, env);
      canManage = user.uid === row.owner_uid || adminUids(env).has(user.uid);
    }
  }
  if (row.status !== "approved" && !canManage) throw new HttpError(404, "This community book is not publicly available.");

  const object = await env.BOOKS.get(row.object_key);
  if (!object) throw new HttpError(410, "The community book file is no longer available.");
  return new Response(object.body, {
    headers: {
      ...cors,
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDispositionFilename(row.title),
      "Content-Length": String(object.size),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": cors["Access-Control-Allow-Origin"]
        ? `default-src 'none'; frame-ancestors ${cors["Access-Control-Allow-Origin"]}`
        : "default-src 'none'; frame-ancestors 'none'",
      "Cache-Control": row.status === "approved" ? "public, max-age=3600" : "private, no-store",
      "ETag": object.httpEtag,
    },
  });
}

async function listModerationQueue(request, env, cors) {
  await adminUser(request, env);
  const result = await env.DB.prepare(
    `SELECT ${SQL_COLUMNS}, owner_uid FROM community_books WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100`,
  ).all();
  return authorizedResponse({ books: result.results.map((row) => ({ ...publicBook(row, request.url), ownerUid: row.owner_uid })) }, 200, cors);
}

async function reviewBook(id, request, env, cors) {
  const moderator = await adminUser(request, env);
  const body = await request.json().catch(() => null);
  if (!body || !["approved", "rejected"].includes(body.status)) {
    throw new HttpError(400, "Choose approved or rejected.");
  }
  const result = await env.DB.prepare(
    "UPDATE community_books SET status = ?, reviewed_at = ?, reviewer_uid = ? WHERE id = ? AND status = 'pending'",
  ).bind(body.status, new Date().toISOString(), moderator.uid, id).run();
  if (!result.meta.changes) throw new HttpError(404, "This pending community book was not found.");
  const row = await env.DB.prepare(
    `SELECT ${SQL_COLUMNS} FROM community_books WHERE id = ?`,
  ).bind(id).first();
  return authorizedResponse({ book: publicBook(row, request.url) }, 200, cors);
}

async function deleteBook(id, request, env, cors) {
  const user = await authenticate(request, env);
  const row = await env.DB.prepare(
    "SELECT id, owner_uid, object_key FROM community_books WHERE id = ?",
  ).bind(id).first();
  if (!row) throw new HttpError(404, "This community book was not found.");
  if (row.owner_uid !== user.uid && !adminUids(env).has(user.uid)) {
    throw new HttpError(403, "Only the uploader or a Study Shelf moderator can remove this book.");
  }
  await env.BOOKS.delete(row.object_key);
  try {
    await env.DB.prepare("DELETE FROM community_books WHERE id = ?").bind(id).run();
  } catch (error) {
    console.error(`Could not remove catalog record for deleted book ${id}.`, error);
    throw new HttpError(500, "The file has been removed, but its catalog record could not be cleaned up. Contact a moderator.");
  }
  return authorizedResponse({ deleted: true }, 200, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") {
      return cors
        ? new Response(null, { status: 204, headers: cors })
        : new Response(null, { status: 403 });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path === "/api/health" && request.method === "GET" && !request.headers.has("Origin")) {
      return authorizedResponse({ status: "ok", feature: "community-books", maxFileBytes: MAX_FILE_BYTES }, 200, {});
    }
    if (!cors && !request.headers.has("Origin") && request.method === "GET") {
      const publicFileRoute = path.match(/^\/api\/books\/([0-9a-f-]{36})\/file$/i);
      if (publicFileRoute) {
        try { return await serveBook(publicFileRoute[1], request, env, {}); }
        catch (error) {
          return errorResponse(error, "Could not open this community book.", {});
        }
      }
    }
    if (!cors) return jsonResponse({ error: "This website origin is not permitted." }, 403, { "Cache-Control": "no-store" });

    if (path === "/api/health" && request.method === "GET") {
      return authorizedResponse({ status: "ok", feature: "community-books", maxFileBytes: MAX_FILE_BYTES }, 200, cors, "no-store");
    }
    if (path === "/api/books" && request.method === "GET") {
      try { return await listBooks(request, env, cors); }
      catch (error) {
        return errorResponse(error, "Could not load community books.", cors);
      }
    }
    if (path === "/api/books" && request.method === "POST") {
      try { return await createBook(request, env, cors); }
      catch (error) {
        return errorResponse(error, "Could not upload this book.", cors);
      }
    }
    if (path === "/api/admin/books" && request.method === "GET") {
      try { return await listModerationQueue(request, env, cors); }
      catch (error) {
        return errorResponse(error, "Could not load the review queue.", cors);
      }
    }

    const fileRoute = path.match(/^\/api\/books\/([0-9a-f-]{36})\/file$/i);
    if (fileRoute && request.method === "GET") {
      try { return await serveBook(fileRoute[1], request, env, cors); }
      catch (error) {
        return errorResponse(error, "Could not open this community book.", cors);
      }
    }
    const adminReviewRoute = path.match(/^\/api\/admin\/books\/([0-9a-f-]{36})$/i);
    if (adminReviewRoute && request.method === "PATCH") {
      try { return await reviewBook(adminReviewRoute[1], request, env, cors); }
      catch (error) {
        return errorResponse(error, "Could not review this book.", cors);
      }
    }
    const deleteRoute = path.match(/^\/api\/books\/([0-9a-f-]{36})$/i);
    if (deleteRoute && request.method === "DELETE") {
      try { return await deleteBook(deleteRoute[1], request, env, cors); }
      catch (error) {
        return errorResponse(error, "Could not delete this book.", cors);
      }
    }
    return authorizedResponse({ error: "This community shelf endpoint does not exist." }, 404, cors);
  },
};
