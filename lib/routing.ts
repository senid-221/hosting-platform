export function projectHostname(slug:string, baseDomain=process.env.PLATFORM_BASE_DOMAIN ?? "apps.localhost") {
  const safe=slug.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/^-+|-+$/g,"");
  return `${safe}.${baseDomain}`;
}
export function projectUrl(slug:string) {
  return `${process.env.PLATFORM_PUBLIC_PROTOCOL ?? "https"}://${projectHostname(slug)}`;
}
