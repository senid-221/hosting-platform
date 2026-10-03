import crypto from "node:crypto";

const key=process.env.SECRETS_ENCRYPTION_KEY;
if(!key) console.warn("SECRETS_ENCRYPTION_KEY is not configured; database credentials cannot be safely persisted.");

function secretKey(){
  if(!key) throw new Error("SECRETS_ENCRYPTION_KEY is required");
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptSecret(value:string){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",secretKey(),iv);
  const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return [iv.toString("base64"),cipher.getAuthTag().toString("base64"),encrypted.toString("base64")].join(".");
}

export function decryptSecret(value:string){
  const [iv,tag,data]=value.split(".");
  const decipher=crypto.createDecipheriv("aes-256-gcm",secretKey(),Buffer.from(iv,"base64"));
  decipher.setAuthTag(Buffer.from(tag,"base64"));
  return Buffer.concat([decipher.update(Buffer.from(data,"base64")),decipher.final()]).toString("utf8");
}
