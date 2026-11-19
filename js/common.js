
import { WHATSAPP_NUMBER } from "./config.js";

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
export function moneyAOA(value) {
  return new Intl.NumberFormat("pt-AO", { style:"currency", currency:"AOA", maximumFractionDigits:0 }).format(Number(value || 0));
}
export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
export function imageOrPlaceholder(url, alt = "") {
  return url ? `<img class="card-image" src="${escapeHTML(url)}" alt="${escapeHTML(alt)}" loading="lazy">` :
    `<div class="card-placeholder" aria-label="Imagem não disponível">MD</div>`;
}
export function showConfigWarning() {
  return `<div class="empty-state">O website ainda não está ligado ao Supabase. Configure a URL e a chave em <strong>js/config.js</strong> para carregar os conteúdos.</div>`;
}
