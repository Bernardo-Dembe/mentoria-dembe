
import { supabase, isConfigured } from "./supabase-client.js";
import { escapeHTML, moneyAOA, whatsappLink, imageOrPlaceholder, showConfigWarning } from "./common.js";

const $ = s => document.querySelector(s);
if ($("#year")) $("#year").textContent = new Date().getFullYear();
if ($("#menu-toggle") && $("#main-nav")) {
  $("#menu-toggle").addEventListener("click", () => $("#main-nav").classList.toggle("open"));
  document.querySelectorAll("#main-nav a").forEach(a => a.addEventListener("click", () => $("#main-nav").classList.remove("open")));
}

let courses = [], products = [];
function courseCard(c) {
  const summary = c.summary || c.description || "";
  return `<article class="content-card">${imageOrPlaceholder(c.image_url,c.title)}<div class="card-body">
    <span class="card-category">${escapeHTML(c.category || "Formação")}</span><h3>${escapeHTML(c.title)}</h3>
    <p>${escapeHTML(summary.slice(0,150))}${summary.length>150?"…":""}</p>
    <div class="card-bottom"><span></span><a class="card-link" href="./curso.html?id=${encodeURIComponent(c.id)}">Ver detalhes →</a></div></div></article>`;
}
function productCard(p) {
  return `<article class="content-card">${imageOrPlaceholder(p.image_url,p.title)}<div class="card-body">
    <span class="card-category">${p.status==="sold_out"?"Esgotado":"Produto disponível"}</span><h3>${escapeHTML(p.title)}</h3>
    <p>${escapeHTML((p.description||"").slice(0,130))}</p><div class="card-bottom"><strong class="card-price">${moneyAOA(p.price)}</strong><a class="card-link" href="./produto.html?id=${encodeURIComponent(p.id)}">Ver produto →</a></div></div></article>`;
}
function renderCourses() {
  const q = ($("#course-search").value || "").toLowerCase();
  const list = courses.filter(c => `${c.title} ${c.category||""} ${c.summary||""}`.toLowerCase().includes(q));
  $("#course-count").textContent = `${list.length} curso(s)`;
  $("#courses-grid").innerHTML = list.length ? list.map(courseCard).join("") : `<div class="empty-state">Ainda não existem cursos publicados nesta categoria.</div>`;
}
function renderProducts() {
  const q = ($("#product-search").value || "").toLowerCase();
  const list = products.filter(p => `${p.title} ${p.description||""} ${p.location||""}`.toLowerCase().includes(q);
  $("#product-count").textContent = `${list.length} produto(s)`;
  $("#products-grid").innerHTML = list.length ? list.map(productCard).join("") : `<div class="empty-state">Ainda não existem produtos publicados.</div>`;
}
if ($("#course-search")) $("#course-search").addEventListener("input", renderCourses);
if ($("#product-search")) $("#product-search").addEventListener("input", renderProducts);

async function load() {
  if (!isConfigured) {
    $("#courses-grid").innerHTML = showConfigWarning();
    $("#products-grid").innerHTML = showConfigWarning();
    return;
  }
  const [c,p] = await Promise.all([
    supabase.from("courses").select("*").eq("status","published").order("created_at",{ascending:false}),
    supabase.from("products").select("*").eq("status","published").order("created_at",{ascending:false})
  ]);
  if (c.error) $("#courses-grid").innerHTML = `<div class="empty-state">Não foi possível carregar os cursos. Verifique a configuração do Supabase.</div>`;
  else { courses = c.data || []; renderCourses(); }
  if (p.error) $("#products-grid").innerHTML = `<div class="empty-state">Não foi possível carregar os produtos. Verifique a configuração do Supabase.</div>`;
  else { products = p.data || []; renderProducts(); }
}
if ($("#courses-grid") || $("#products-grid")) load();

// Páginas de detalhe usam estes parâmetros sem depender de uma framework.
const params = new URLSearchParams(location.search);
if (location.pathname.endsWith("/curso.html") || location.pathname.endsWith("curso.html")) {
  document.body.innerHTML = `<header class="site-header"><a class="brand" href="./index.html"><img src="./assets/logo.svg" alt=""><span>MENTORIA <b>DEMBE</b><small>FORMAÇÃO · CONHECIMENTO · NEGÓCIOS</small></span></a><a href="./index.html" class="text-link">← Voltar</a></header><main class="detail-wrap" id="detail"><div class="empty-state">A carregar curso...</div></main>`;
  if (isConfigured) {
    const {data,error} = await supabase.from("courses").select("*").eq("id",params.get("id")).eq("status","published").maybeSingle();
    const el = document.querySelector("#detail");
    if (error || !data) el.innerHTML = `<div class="empty-state">Curso não encontrado ou indisponível.</div>`;
    else {
      const lines = v => (v||"").split("\n").filter(Boolean).map(x=>`<li>${escapeHTML(x)}</li>`).join("");
      el.innerHTML = `<article class="detail-card">${imageOrPlaceholder(data.image_url,data.title)}<div class="detail-content"><span class="eyebrow">${escapeHTML(data.category||"FORMAÇÃO")}</span><h1>${escapeHTML(data.title)}</h1><p class="detail-lead">${escapeHTML(data.summary||"")}</p><h2>Sobre o curso</h2><p>${escapeHTML(data.description||"")}</p>${data.objectives?`<h2>Objetivos</h2><ul>${lines(data.objectives)}</ul>`:""}${data.content?`<h2>Conteúdo programático</h2><ul>${lines(data.content)}</ul>`:""}${data.how_it_works?`<h2>Como vai funcionar</h2><p>${escapeHTML(data.how_it_works)}</p>`:""}<div class="detail-meta">${data.modality?`<p><b>Modalidade:</b> ${escapeHTML(data.modality)}</p>`:""}${data.location?`<p><b>Localização:</b> ${escapeHTML(data.location)}</p>`:""}</div><div class="contact-actions"><a class="button" href="${whatsappLink("Olá, gostaria de obter informações sobre o curso: "+data.title)}" target="_blank" rel="noopener">Contactar pelo WhatsApp</a><a class="button button-outline" href="tel:+244947466217">Ligar ao formador</a></div></div></article>`;
    }
  }
}
if (location.pathname.endsWith("/produto.html") || location.pathname.endsWith("produto.html")) {
  document.body.innerHTML = `<header class="site-header"><a class="brand" href="./index.html"><img src="./assets/logo.svg" alt=""><span>MENTORIA <b>DEMBE</b></span><small>LOJA</small></a><a href="./index.html#produtos" class="text-link">← Voltar aos produtos</a></header><main class="detail-wrap" id="detail"><div class="empty-state">A carregar produto...</div></main>`;
  if (isConfigured) {
    const {data,error} = await supabase.from("products").select("*").eq("id",params.get("id")).eq("status","published").maybeSingle();
    const el = document.querySelector("#detail");
    if (error || !data) el.innerHTML = `<div class="empty-state">Produto não encontrado ou indisponível.</div>`;
    else el.innerHTML = `<article class="detail-card">${imageOrPlaceholder(data.image_url,data.title)}<div class="detail-content"><span class="eyebrow">PRODUTO</span><h1>${escapeHTML(data.title)}</h1><div class="detail-price">${moneyAOA(data.price)}</div><h2>Descrição</h2><p>${escapeHTML(data.description||"")}</p>${data.location?`<p><b>Localização:</b> ${escapeHTML(data.location)}</p>`:""}<div class="contact-actions">${data.status==="sold_out"?`<span class="status-pill">Esgotado</span>`:`<a class="button" href="${whatsappLink("Olá, tenho interesse no produto: "+data.title+" — "+moneyAOA(data.price))}" target="_blank" rel="noopener">Comprar pelo WhatsApp</a>`}<a class="button button-outline" href="tel:+244947466217">Ligar</a></div></div></article>`;
  }
}
