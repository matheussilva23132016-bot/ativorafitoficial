type SearchParamsLike = {
  has?: (key: string) => boolean;
  get?: (key: string) => string | null;
};

export function isLocalConfigRequest(_urlLike: { hostname: string; searchParams: SearchParamsLike }) {
  return false;
}

export function isLocalConfigBrowser(_searchParams?: SearchParamsLike) {
  return false;
}

export function isLocalDevelopmentHostBrowser() {
  return false;
}
