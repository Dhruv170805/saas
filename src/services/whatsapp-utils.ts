/**
 * Generate a "One-Tap" WhatsApp sharing link.
 * Browser-safe: Zero dependencies on Node.js native modules.
 */
export function generateWhatsAppShareUrl(phone: string, text: string): string {
  const encodedText = encodeURIComponent(text);
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}/?text=${encodedText}`;
}
