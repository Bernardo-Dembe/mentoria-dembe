
import { supabase, isConfigured } from "./supabase-client.js";
import { STORAGE_BUCKET } from "./config.js";
import { escapeHTML, moneyAOA } from "./common.js";

const $ = s => document.querySelector(s);

const loginView = $("#login-view");
const dashboard = $("#dashboard-view");

let currentUser = null;

// MENSAGENS
function message(el, text, error = false) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", error);
}

// VERIFICAR CONFIGURAÇÃO
function requireConfig() {
  if (!isConfigured || !supabase) {
    message(
      $("#login-message"),
      "Configure a URL e a chave pública em js/config.js antes de utilizar o painel.",
      true
    );

    if ($("#login-form")) {
      $("#login-form").querySelector("button").disabled = true;
    }

    return false;
  }

  return true;
}

// VERIFICAR ADMINISTRADOR
async function isAdmin(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data?.role === "admin";
}

// ABRIR PAINEL
async function showDashboard(user) {
  try {
    if (!(await isAdmin(user.id))) {
      await supabase.auth.signOut();

      message(
        $("#login-message"),
        "Esta conta não tem permissões de administrador.",
        true
      );

      return;
    }

    currentUser = user;

    loginView.hidden = true;
    dashboard.hidden = false;

    $("#admin-email").textContent = user.email || "Administrador";

    await refreshLists();

  } catch (e) {
    message(
      $("#login-message"),
      "Não foi possível validar as permissões: " + e.message,
      true
    );
  }
}

// LOGIN
$("#login-form").addEventListener("submit", async e => {
  e.preventDefault();

  if (!requireConfig()) return;

  const btn = e.currentTarget.querySelector("button");

  btn.disabled = true;

  message($("#login-message"), "A autenticar...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: $("#email").value.trim(),
    password: $("#password").value
  });

  btn.disabled = false;

  if (error) {
    message(
      $("#login-message"),
      "Não foi possível entrar. Verifique o e-mail e a palavra-passe.",
      true
    );

    return;
  }

  await showDashboard(data.user);
});

// TERMINAR SESSÃO
$("#logout-button").addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

// RECUPERAR SESSÃO
if (requireConfig()) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    await showDashboard(session.user);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      dashboard.hidden = true;
      loginView.hidden = false;
      currentUser = null;
    }
  });
}

// SEPARADORES
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(b => {
      b.classList.toggle("active", b === btn);
    });

    $("#courses-panel").hidden = btn.dataset.tab !== "courses";
    $("#products-panel").hidden = btn.dataset.tab !== "products";
  });
});

// LIMPAR FORMULÁRIOS
function resetForm(type) {
  const form = $("#" + type + "-form");

  form.reset();

  $("#" + type + "-id").value = "";

  form.hidden = false;

  $("#" + type + "-form-title").textContent =
    type === "course" ? "Adicionar curso" : "Adicionar produto";

  $("#" + type + "-save-message").textContent = "";

  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

$("#new-course").addEventListener("click", () => {
  resetForm("course");
});

$("#new-product").addEventListener("click", () => {
  resetForm("product");
});

// CANCELAR EDIÇÃO
document.querySelectorAll(".cancel-editor").forEach(b => {
  b.addEventListener("click", () => {
    b.closest("form").hidden = true;
  });
});

// ENVIAR IMAGENS
async function uploadImage(file, folder) {
  if (!file) return null;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Utilize uma imagem JPG, PNG ou WebP.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const safe = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-");

  const path = `${folder}/${crypto.randomUUID()}-${safe}`;

  const { error } = await supabase
    .storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase
    .storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ACTUALIZAR LISTAS
async function refreshLists() {
  const [c, p] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
  ]);

  if (c.error || p.error) {
    message(
      $("#dashboard-message"),
      "Erro ao carregar dados: " + (c.error || p.error).message,
      true
    );

    return;
  }

  const courseRows = c.data || [];
  const productRows = p.data || [];

  $("#course-total").textContent =
    courseRows.filter(x => x.status === "published").length;

  $("#product-total").textContent =
    productRows.filter(x => x.status === "published").length;

  renderList("course", courseRows);
  renderList("product", productRows);
}

// MOSTRAR PREÇO DO CURSO
function coursePrice(price) {
  if (price === null || price === undefined || price === "" || Number(price) === 0) {
    return "Gratuito";
  }

  return moneyAOA(price);
}

// MOSTRAR REGISTOS
function renderList(type, rows) {
  const target = type === "course"
    ? $("#admin-courses-list")
    : $("#admin-products-list");

  if (!rows.length) {
    target.innerHTML = `
      <div class="empty-state">
        Ainda não existem registos. Utilize o botão acima para adicionar.
      </div>
    `;

    return;
  }

  target.innerHTML = rows.map(r => `
    <div class="admin-row">

      ${
        r.image_url
          ? `<img src="${escapeHTML(r.image_url)}" alt="">`
          : `<div class="row-placeholder"></div>`
      }

      <div class="admin-row-info">

        <strong>
          ${escapeHTML(r.title)}

          <span class="status-pill ${r.status === "published" ? "published" : ""}">
            ${
              r.status === "published"
                ? "Publicado"
                : r.status === "sold_out"
                  ? "Esgotado"
                  : "Rascunho"
            }
          </span>
        </strong>

        <small>
          ${
            type === "course"
              ? `${escapeHTML(r.category || "Curso")} · ${coursePrice(r.price)} · ${escapeHTML(r.duration || "Duração não definida")}`
              : moneyAOA(r.price)
          }
        </small>

      </div>

      <div class="row-actions">

        <button
          class="small-action"
          data-edit="${r.id}"
          data-type="${type}">
          Editar
        </button>

        <button
          class="small-action danger"
          data-delete="${r.id}"
          data-type="${type}">
          Eliminar
        </button>

      </div>

    </div>
  `).join("");

  target.querySelectorAll("[data-edit]").forEach(b => {
    b.addEventListener("click", () => {
      editRecord(
        type,
        rows.find(r => r.id === b.dataset.edit)
      );
    });
  });

  target.querySelectorAll("[data-delete]").forEach(b => {
    b.addEventListener("click", () => {
      deleteRecord(type, b.dataset.delete);
    });
  });
}

// PREENCHER CAMPOS
function setVal(id, value) {
  const el = $("#" + id);

  if (el) {
    el.value = value ?? "";
  }
}

// EDITAR REGISTOS
function editRecord(type, r) {
  resetForm(type);

  $("#" + type + "-form-title").textContent =
    type === "course" ? "Editar curso" : "Editar produto";

  setVal(type + "-id", r.id);

  if (type === "course") {

    [
      "title",
      "category",
      "summary",
      "description",
      "objectives",
      "content",
      "modality",
      "location",
      "status"
    ].forEach(k => {
      setVal("course-" + k, r[k]);
    });

    setVal("course-how", r.how_it_works);

    // PREÇO E DURAÇÃO
    setVal("course-price", r.price);
    setVal("course-duration", r.duration);

    $("#course-featured").checked = !!r.featured;

  } else {

    [
      "title",
      "price",
      "description",
      "location",
      "status"
    ].forEach(k => {
      setVal("product-" + k, r[k]);
    });

  }
}

// ELIMINAR REGISTOS
async function deleteRecord(type, id) {
  if (!confirm("Tem a certeza de que pretende eliminar este registo?")) {
    return;
  }

  const { error } = await supabase
    .from(type === "course" ? "courses" : "products")
    .delete()
    .eq("id", id);

  if (error) {
    message(
      $("#dashboard-message"),
      "Não foi possível eliminar: " + error.message,
      true
    );
  } else {
    message($("#dashboard-message"), "Registo eliminado.");

    await refreshLists();
  }
}

// GUARDAR CURSOS
$("#course-form").addEventListener("submit", async e => {
  e.preventDefault();

  const msg = $("#course-save-message");

  message(msg, "A guardar...");

  const btn = e.submitter;

  if (btn) btn.disabled = true;

  try {
    const id = $("#course-id").value;

    let image_url = null;

    if ($("#course-image").files[0]) {
      image_url = await uploadImage(
        $("#course-image").files[0],
        "courses"
      );
    }

    const priceValue = $("#course-price").value.trim();

    const price = priceValue === ""
      ? 0
      : Number(priceValue);

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Introduza um preço válido.");
    }

    const payload = {
      title: $("#course-title").value.trim(),
      category: $("#course-category").value.trim(),
      summary: $("#course-summary").value.trim(),
      description: $("#course-description").value.trim(),
      objectives: $("#course-objectives").value.trim(),
      content: $("#course-content").value.trim(),
      how_it_works: $("#course-how").value.trim(),
      modality: $("#course-modality").value.trim(),
      location: $("#course-location").value.trim(),

      // NOVOS CAMPOS
      price: price,
      duration: $("#course-duration").value.trim(),

      status: $("#course-status").value,
      featured: $("#course-featured").checked,
      updated_at: new Date().toISOString()
    };

    if (image_url) {
      payload.image_url = image_url;
    }

    const query = id
      ? supabase.from("courses").update(payload).eq("id", id)
      : supabase.from("courses").insert(payload);

    const { error } = await query;

    if (error) throw error;

    message(msg, "Curso guardado com sucesso.");

    e.target.hidden = true;

    await refreshLists();

  } catch (err) {

    message(msg, "Erro: " + err.message, true);

  } finally {

    if (btn) btn.disabled = false;

  }
});

// GUARDAR PRODUTOS
$("#product-form").addEventListener("submit", async e => {
  e.preventDefault();

  const msg = $("#product-save-message");

  message(msg, "A guardar...");

  const btn = e.submitter;

  if (btn) btn.disabled = true;

  try {
    const id = $("#product-id").value;

    let image_url = null;

    if ($("#product-image").files[0]) {
      image_url = await uploadImage(
        $("#product-image").files[0],
        "products"
      );
    }

    const payload = {
      title: $("#product-title").value.trim(),
      price: Number($("#product-price").value),
      description: $("#product-description").value.trim(),
      location: $("#product-location").value.trim(),
      status: $("#product-status").value,
      updated_at: new Date().toISOString()
    };

    if (image_url) {
      payload.image_url = image_url;
    }

    const query = id
      ? supabase.from("products").update(payload).eq("id", id)
      : supabase.from("products").insert(payload);

    const { error } = await query;

    if (error) throw error;

    message(msg, "Produto guardado com sucesso.");

    e.target.hidden = true;

    await refreshLists();

  } catch (err) {

    message(msg, "Erro: " + err.message, true);

  } finally {

    if (btn) btn.disabled = false;

  }
});
