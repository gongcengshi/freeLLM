import { ProxyAgent, fetch as undiciFetch, type RequestInit } from 'undici';

let proxyAgent: ProxyAgent | null = null;
let proxyChecked = false;

function getProxyUrl(): string | null {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || process.env.https_proxy || process.env.http_proxy || process.env.all_proxy;
  if (proxy) return proxy;
  return null;
}

function getProxyAgent(): ProxyAgent | null {
  if (proxyChecked) return proxyAgent;
  proxyChecked = true;

  const proxyUrl = getProxyUrl();
  if (proxyUrl) {
    console.log(`[proxy] Using proxy: ${proxyUrl}`);
    proxyAgent = new ProxyAgent(proxyUrl);
  } else {
    console.log('[proxy] No proxy detected, using direct connection');
  }
  return proxyAgent;
}

export async function proxyFetch(url: string, options: RequestInit): Promise<Response> {
  const agent = getProxyAgent();
  if (agent) {
    return undiciFetch(url, { ...options, dispatcher: agent } as any);
  }
  return undiciFetch(url, options);
}
