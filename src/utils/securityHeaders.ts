
export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ttguzgouurqopeccvzve.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://ttguzgouurqopeccvzve.supabase.co wss://ttguzgouurqopeccvzve.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export function applySecurityHeaders() {
  if (typeof document !== 'undefined') {
    // Add CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = SECURITY_HEADERS['Content-Security-Policy'];
    document.head.appendChild(cspMeta);
    
    // Add other security headers via meta tags where possible
    const xFrameOptions = document.createElement('meta');
    xFrameOptions.httpEquiv = 'X-Frame-Options';
    xFrameOptions.content = SECURITY_HEADERS['X-Frame-Options'];
    document.head.appendChild(xFrameOptions);
  }
}
