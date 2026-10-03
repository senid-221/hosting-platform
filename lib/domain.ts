import crypto from "node:crypto";

export function normalizeDomain(value:string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/$/,"").split("/")[0];
}

export function createVerificationToken() {
  return "hosting-verification=" + crypto.randomBytes(24).toString("hex");
}

export function isValidDomain(value:string) {
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value);
}
