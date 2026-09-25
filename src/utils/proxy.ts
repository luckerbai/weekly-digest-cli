import { EnvHttpProxyAgent, setGlobalDispatcher, fetch } from 'undici'

/**
 * 统一 fetch 出口：
 * - 从 undici 导入（与 setGlobalDispatcher 使用同一实例，代理才能生效）
 * - 识别 HTTPS_PROXY / HTTP_PROXY / ALL_PROXY 环境变量
 */
export function configureProxy() {
  const proxy = process.env.HTTPS_PROXY
    ?? process.env.https_proxy
    ?? process.env.HTTP_PROXY
    ?? process.env.http_proxy
    ?? process.env.ALL_PROXY
    ?? process.env.all_proxy

  if (proxy) {
    setGlobalDispatcher(new EnvHttpProxyAgent())
  }
}

export { fetch as httpFetch }
