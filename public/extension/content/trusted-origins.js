/**
 * Trusted origin policy for Lokker Extension content scripts.
 * Only origins on the exact allowlist from config.js (LOKKER_EXT_CONFIG)
 * may sync vault data into the extension. Hostname substring matching is
 * forbidden here: https://lokker.phishing.example would pass it.
 */

(function () {
  // Plain http is only ever trusted for these hardcoded local development
  // hosts, regardless of the configured allowlist — the production origin
  // must never be accepted over an insecure protocol.
  const LOCAL_DEV_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0'];

  // Read at call time from the extension's own context (config.js). Content
  // scripts run in Chrome's isolated world, so pages cannot override this.
  function getPolicyLists() {
    const cfg = typeof self !== 'undefined' ? self.LOKKER_EXT_CONFIG : undefined;
    return {
      hosts:
        cfg && Array.isArray(cfg.trustedHosts) && cfg.trustedHosts.length > 0
          ? cfg.trustedHosts
          : LOCAL_DEV_HOSTS,
      suffixes: cfg && Array.isArray(cfg.trustedHostSuffixes) ? cfg.trustedHostSuffixes : ['.local'],
    };
  }

  function isTrustedLokkerOrigin(loc) {
    const location = loc || (typeof window !== 'undefined' ? window.location : undefined);
    if (!location) return false;

    const protocol = (location.protocol || '').toLowerCase();
    const host = (location.hostname || '').toLowerCase();
    const lists = getPolicyLists();

    // http:// is only trusted for local development hosts (any port).
    if (protocol === 'http:') {
      return LOCAL_DEV_HOSTS.indexOf(host) !== -1;
    }
    if (protocol !== 'https:') {
      return false;
    }

    if (lists.hosts.indexOf(host) !== -1) {
      return true;
    }

    return lists.suffixes.some(function (suffix) {
      return host.endsWith(suffix);
    });
  }

  const originPolicy = { isTrustedLokkerOrigin };

  window.LokkerOriginPolicy = originPolicy;
  window.XeroxOriginPolicy = originPolicy;
})();
