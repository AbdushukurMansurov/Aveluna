/** Staff accounts sign in with a short login (e.g. "abd9"); auth needs an email, so logins map to a fixed internal domain. */
export const LOGIN_DOMAIN = "aveluna.uz";
export const ADMIN_LOGIN = "abd9";

export function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

export function isValidLogin(login: string) {
  return /^[a-z0-9._-]{3,32}$/.test(normalizeLogin(login));
}

export function toAuthEmail(loginOrEmail: string) {
  const v = normalizeLogin(loginOrEmail);
  return v.includes("@") ? v : `${v}@${LOGIN_DOMAIN}`;
}
