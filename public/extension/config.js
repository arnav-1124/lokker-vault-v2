/**
 * Lokker Extension environment configuration.
 * The extension ships without a build step, so this file is its .env:
 * update `appOrigin` and the trusted lists here when the web app moves
 * to a new deployment origin. Loaded before popup.js and before every
 * content-script injection (see popup.html + manifest.json).
 */

(function () {
  // Public origin of the Lokker web app (no trailing slash).
  const appOrigin = 'https://lokker-vault.vercel.app';

  // Exact hosts allowed to sync vault data into the extension over https.
  // Hostname substring matching is forbidden (spoofing).
  const trustedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'lokker-vault.vercel.app'];

  // Anchored suffixes: only proper subdomains match (vault.e2b.app yes,
  // evil-e2b.app no). Add future production/preview hosts here.
  const trustedHostSuffixes = ['.local', '.e2b.app'];

  self.LOKKER_EXT_CONFIG = Object.freeze({
    appOrigin: appOrigin,
    trustedHosts: trustedHosts,
    trustedHostSuffixes: trustedHostSuffixes,
  });
})();
