/*
 * Bloques de Tienda y Contenido de esta web (diseño por bloques de Lynkia, 06-11-2026).
 *
 * Lo que va en cada bloque (que productos, cual se destaca, que informacion se ve y en cuantas columnas) se decide en
 * el editor y se guarda al publicar. Este script pide en cada visita los datos del momento (precio en la moneda de
 * quien visita, agotados, fechas) y los pinta en los huecos [data-lynkia-block]. En la vista previa del editor los
 * datos van dentro de la pagina (#lynkia-site-data) y no se pide nada.
 */
(function () {
  var ZERO = ["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "vnd", "vuv", "xaf", "xof", "xpf"];
  var THREE = ["bhd", "jod", "kwd", "omr", "tnd"];
  var preview = !!document.getElementById("lynkia-site-data");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function money(cents, currency, locale) {
    var code = (currency || "eur").toLowerCase();
    var digits = ZERO.indexOf(code) >= 0 ? 0 : THREE.indexOf(code) >= 0 ? 3 : 2;
    var amount = (cents || 0) / Math.pow(10, digits);
    try {
      return amount.toLocaleString(locale === "en" ? "en-US" : "es-ES", {
        style: "currency",
        currency: code.toUpperCase(),
        minimumFractionDigits: amount % 1 === 0 ? 0 : digits,
        maximumFractionDigits: digits,
      });
    } catch (e) {
      return amount.toFixed(digits) + " " + code.toUpperCase();
    }
  }

  function when(iso, locale) {
    try {
      return new Date(iso).toLocaleString(locale === "en" ? "en-US" : "es-ES", { dateStyle: "medium", timeStyle: "short" });
    } catch (e) {
      return "";
    }
  }

  function price(item, block, data) {
    if (!block.show.price) return "";
    if (item.free) return '<span class="lk-price">' + esc(data.texts.free) + "</span>";
    if (item.price_cents == null) return "";
    var old =
      block.show.compare_price !== false && item.compare_cents && item.compare_cents > item.price_cents
        ? "<s>" + esc(money(item.compare_cents, item.currency, data.locale)) + "</s>"
        : "";
    var from = item.price_from ? esc(data.texts.from) + " " : "";
    return '<span class="lk-price">' + old + from + esc(money(item.price_cents, item.currency, data.locale)) + "</span>";
  }

  // Varias fotos: se deslizan (con el dedo, o con las flechas al pasar el raton), con puntos que marcan la actual.
  function photos(item, data) {
    var list = item.images && item.images.length ? item.images : item.image ? [item.image] : [];
    if (list.length < 2) return list.length ? '<img src="' + esc(list[0]) + '" alt="" loading="lazy">' : "";
    var slides = "";
    var dots = "";
    for (var i = 0; i < list.length; i++) {
      slides += '<img src="' + esc(list[i]) + '" alt="" loading="lazy" draggable="false">';
      dots += i === 0 ? '<i class="on"></i>' : "<i></i>";
    }
    return (
      '<div class="lk-slides">' + slides + "</div>" +
      '<span class="lk-slide-btn lk-slide-prev" role="button" aria-label="' + esc(data.texts.prev || "") + '" aria-disabled="true">&#8249;</span>' +
      '<span class="lk-slide-btn lk-slide-next" role="button" aria-label="' + esc(data.texts.next || "") + '">&#8250;</span>' +
      '<span class="lk-dots" aria-hidden="true">' + dots + "</span>"
    );
  }

  function wireSlides(root) {
    var tracks = root.querySelectorAll(".lk-slides");
    for (var i = 0; i < tracks.length; i++) {
      (function (track) {
        var media = track.parentNode;
        var dots = media.querySelectorAll(".lk-dots i");
        var prev = media.querySelector(".lk-slide-prev");
        var next = media.querySelector(".lk-slide-next");
        var frame = 0;
        function update() {
          frame = 0;
          var index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
          for (var d = 0; d < dots.length; d++) dots[d].className = d === index ? "on" : "";
          if (prev) prev.setAttribute("aria-disabled", index <= 0 ? "true" : "false");
          if (next) next.setAttribute("aria-disabled", index >= dots.length - 1 ? "true" : "false");
        }
        track.addEventListener("scroll", function () {
          if (!frame) frame = window.requestAnimationFrame(update);
        }, { passive: true });
        function go(step) {
          return function (e) {
            // La tarjeta es un enlace: pasar de foto no la abre.
            e.preventDefault();
            e.stopPropagation();
            track.scrollBy({ left: step * track.clientWidth, behavior: "smooth" });
          };
        }
        if (prev) prev.addEventListener("click", go(-1));
        if (next) next.addEventListener("click", go(1));
      })(tracks[i]);
    }
  }

  function card(item, block, data, featured) {
    var media =
      '<div class="lk-card-media">' +
      photos(item, data) +
      (featured ? '<span class="lk-badge">' + esc(data.texts.featured) + "</span>" : "") +
      (item.sold_out ? '<span class="lk-badge lk-badge-out">' + esc(data.texts.sold_out) + "</span>" : "") +
      "</div>";
    var meta = [];
    if (block.show.date && item.date) meta.push(when(item.date, data.locale));
    if (block.show.date && item.location) meta.push(item.location);
    var body =
      '<div class="lk-card-body">' +
      (item.kind_label ? '<span class="lk-card-kind">' + esc(item.kind_label) + "</span>" : "") +
      '<span class="lk-card-title">' + esc(item.title) + "</span>" +
      (item.rating && item.rating.count
        ? '<span class="lk-card-rating"><span class="lk-stars" style="--r:' + item.rating.average + '"></span>' + esc(String(item.rating.average).replace(".", ",")) + " <span>(" + item.rating.count + ")</span></span>"
        : "") +
      (meta.length ? '<span class="lk-card-meta">' + esc(meta.join(" · ")) + "</span>" : "") +
      (block.show.description && item.description ? '<span class="lk-card-desc">' + esc(item.description) + "</span>" : "") +
      '<span class="lk-card-foot">' +
      price(item, block, data) +
      (block.show.button && !item.sold_out ? '<span class="lk-btn">' + esc(block.button_label) + "</span>" : "") +
      "</span></div>";
    var target = preview ? ' target="_blank" rel="noopener"' : "";
    return '<a class="lk-card' + (featured ? " lk-featured" : "") + '" href="' + esc(item.url) + '"' + target + ">" + media + body + "</a>";
  }

  // Botones de categoria encima de las tarjetas (13-11-2026): filtran en la propia pagina, sin pedir nada. `?categoria=lanas`
  // en el enlace deja marcada esa categoria.
  function wantedSlug() {
    var m = /[?&]categoria=([^&#]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function paint(slot, block, data, active) {
    var chip = active ? block.filters.filter(function (f) { return f.id === active; })[0] : null;
    var ids = chip ? chip.ids : null;
    function inside(item) {
      if (!ids) return true;
      var own = item.category_ids || [];
      for (var k = 0; k < own.length; k++) if (ids.indexOf(own[k]) >= 0) return true;
      return false;
    }
    var html = block.featured && inside(block.featured) ? card(block.featured, block, data, true) : "";
    for (var j = 0; j < block.items.length; j++) if (inside(block.items[j])) html += card(block.items[j], block, data, false);
    slot.innerHTML = html || '<p class="lk-empty">' + esc(block.empty || data.texts.empty) + "</p>";
    wireSlides(slot);
  }

  // Categorias con foto (16-11-2026): si el creador las enseña con foto, cada boton es una ficha redonda con su foto (o su inicial si no la tiene),
  // en una fila que se desliza en el movil. Sus estilos viajan aqui para que tambien las webs ya publicadas los tengan.
  var TILE_CSS =
    ".lk-filters.lk-tiles{display:flex;flex-wrap:nowrap;gap:18px;overflow-x:auto;padding:4px 4px 12px;margin-bottom:18px;scrollbar-width:none;-webkit-overflow-scrolling:touch}" +
    ".lk-tiles::-webkit-scrollbar{display:none}.lk-tiles .lk-tile:first-child{margin-left:auto}.lk-tiles .lk-tile:last-child{margin-right:auto}" +
    ".lk-tile{appearance:none;background:none;border:0;padding:0;font:inherit;color:var(--text,#111);cursor:pointer;flex:0 0 auto;width:84px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}" +
    ".lk-tile-img{width:76px;height:76px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(var(--accent-rgb,17,17,17),.1);color:var(--accent,#111);font-weight:700;font-size:1.5rem;border:2px solid transparent;outline:2px solid transparent;outline-offset:2px;transition:outline-color .15s ease,transform .15s ease}" +
    ".lk-tile-img img{width:100%;height:100%;object-fit:cover;display:block}.lk-tile-img svg{width:28px;height:28px}" +
    ".lk-tile:hover .lk-tile-img{transform:translateY(-2px)}.lk-tile:focus-visible .lk-tile-img{outline-color:var(--accent,#111)}" +
    ".lk-tile.on .lk-tile-img{outline-color:var(--accent,#111)}.lk-tile-name{font-size:.82rem;font-weight:600;line-height:1.2;max-width:100%;overflow-wrap:anywhere}.lk-tile.on .lk-tile-name{color:var(--accent,#111)}" +
    "@media (min-width:640px){.lk-tile{width:104px}.lk-tile-img{width:92px;height:92px}}";
  var ALL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>';

  // Categorias en texto (22-11-2026): sus estilos viajan aqui por lo mismo que los de las fichas. Una web diseñada con la IA antes de que
  // existieran las categorias no los tiene en su hoja de estilos, y sus botones salian en crudo, con el gris del navegador. Se ponen los
  // primeros del <head> para que la hoja de la propia web siga mandando si ya los define (las de bloques y las nuevas los traen).
  var CHIP_CSS =
    ".lk-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}" +
    ".lk-chip{appearance:none;font:inherit;font-size:.85rem;font-weight:600;padding:.4rem .95rem;border-radius:999px;border:1px solid var(--line,rgba(127,127,127,.35));background:transparent;color:var(--text,inherit);cursor:pointer;transition:background .15s ease,border-color .15s ease}" +
    ".lk-chip:hover{border-color:rgba(var(--accent-rgb,17,17,17),.7)}" +
    ".lk-chip:focus-visible{outline:2px solid var(--accent,#111);outline-offset:2px}" +
    ".lk-chip.on{background:var(--accent,#111);border-color:var(--accent,#111);color:var(--ink,#fff)}";

  function tilesWanted(block) {
    if (block.filter_style !== "images") return false;
    for (var i = 0; i < block.filters.length; i++) if (block.filters[i].image) return true;
    return false;
  }

  function injectCss(id, css, first) {
    if (document.getElementById(id)) return;
    var style = document.createElement("style");
    style.id = id;
    style.appendChild(document.createTextNode(css));
    if (first && document.head.firstChild) document.head.insertBefore(style, document.head.firstChild);
    else document.head.appendChild(style);
  }

  function filters(slot, block, data) {
    var bar = slot.previousElementSibling;
    if (!bar || !bar.classList || !bar.classList.contains("lk-filters")) {
      bar = document.createElement("div");
      bar.className = "lk-filters";
      slot.parentNode.insertBefore(bar, slot);
    }
    var slug = wantedSlug();
    var active = "";
    for (var i = 0; i < block.filters.length; i++) if (block.filters[i].slug === slug) active = block.filters[i].id;
    var tiles = tilesWanted(block);
    if (tiles) injectCss("lk-tile-css", TILE_CSS);
    else injectCss("lk-chip-css", CHIP_CSS, true);
    bar.className = tiles ? "lk-filters lk-tiles" : "lk-filters";
    function draw() {
      var html;
      if (tiles) {
        html =
          '<button type="button" class="lk-tile' + (active ? "" : " on") + '" data-cat=""><span class="lk-tile-img">' + ALL_ICON + '</span><span class="lk-tile-name">' + esc(data.texts.all) + "</span></button>";
        for (var t = 0; t < block.filters.length; t++) {
          var g = block.filters[t];
          var picture = g.image ? '<img src="' + esc(g.image) + '" alt="" loading="lazy">' : esc(String(g.name || "?").charAt(0).toUpperCase());
          html += '<button type="button" class="lk-tile' + (active === g.id ? " on" : "") + '" data-cat="' + esc(g.id) + '"><span class="lk-tile-img">' + picture + '</span><span class="lk-tile-name">' + esc(g.name) + "</span></button>";
        }
      } else {
        html = '<button type="button" class="lk-chip' + (active ? "" : " on") + '" data-cat="">' + esc(data.texts.all) + "</button>";
        for (var n = 0; n < block.filters.length; n++) {
          var f = block.filters[n];
          html += '<button type="button" class="lk-chip' + (active === f.id ? " on" : "") + '" data-cat="' + esc(f.id) + '">' + esc(f.name) + "</button>";
        }
      }
      bar.innerHTML = html;
    }
    bar.onclick = function (e) {
      var target = e.target && e.target.closest ? e.target.closest("[data-cat]") : null;
      if (!target) return;
      active = target.getAttribute("data-cat") || "";
      draw();
      paint(slot, block, data, active);
    };
    draw();
    return active;
  }

  function render(data) {
    var byId = {};
    (data.blocks || []).forEach(function (b) {
      byId[b.id] = b;
    });
    var slots = document.querySelectorAll("[data-lynkia-block]");
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var block = byId[slot.getAttribute("data-lynkia-block")];
      if (!block) {
        // Un hueco que ya no esta en lo publicado (la web se edito a mano o con la IA despues): se oculta entero.
        var section = slot.closest ? slot.closest(".lk-block") : null;
        (section || slot).style.display = "none";
        continue;
      }
      var active = block.filters && block.filters.length > 1 ? filters(slot, block, data) : "";
      paint(slot, block, data, active);
    }
  }

  // El carrito de la cabecera (14-11-2026): [data-lynkia-cart] lleva a su carrito y enseña cuantos articulos tiene. El carrito vive
  // en el navegador, por tienda (lynkia_cart_<usuario>), asi que el numero solo se puede leer cuando su web y su tienda comparten
  // direccion (su subdominio o su dominio); si no, el enlace funciona igual y no hay numero.
  var CART_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L20.4 8H6.1"/><circle cx="9.5" cy="19.2" r="1.3"/><circle cx="17" cy="19.2" r="1.3"/></svg>';
  var cartWired = false;
  var cartState = null;

  function cartCount(handle) {
    try {
      var raw = JSON.parse(window.localStorage.getItem("lynkia_cart_" + handle) || "[]");
      var n = 0;
      for (var i = 0; i < (raw.length || 0); i++) n += Number(raw[i] && raw[i].quantity) || 0;
      return n;
    } catch (e) {
      return 0;
    }
  }

  function paintCart() {
    var links = document.querySelectorAll("[data-lynkia-cart]");
    if (!cartState) return;
    var n = cartState.same ? cartCount(cartState.handle) : 0;
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.classList.add("lk-cart"); // la que escribe la IA no lleva clase: asi toma los mismos estilos
      a.setAttribute("href", cartState.store.replace(/\/$/, "") + "/carrito");
      // Una pieza vacia (la que escribe la IA) se rellena con el icono y el nombre; la que ya viene hecha solo se actualiza.
      if (!a.querySelector(".lk-cart-count")) {
        a.innerHTML = CART_ICON + '<span class="lk-cart-label">' + esc(cartState.label) + '</span><span class="lk-cart-count" hidden></span>';
      }
      var badge = a.querySelector(".lk-cart-count");
      badge.textContent = n > 99 ? "99+" : String(n);
      if (n > 0) badge.removeAttribute("hidden");
      else badge.setAttribute("hidden", "");
      a.setAttribute("aria-label", n > 0 ? cartState.label + " (" + n + ")" : cartState.label);
    }
  }

  function cart(handle, store, label) {
    if (!handle || !store || !document.querySelector("[data-lynkia-cart]")) return;
    var same = false;
    try {
      same = new URL(store, window.location.href).origin === window.location.origin;
    } catch (e) {}
    cartState = { handle: handle, store: store, same: same, label: label || (cartState && cartState.label) || "Cart" };
    paintCart();
    if (cartWired) return;
    cartWired = true;
    window.addEventListener("storage", paintCart);
    window.addEventListener("pageshow", paintCart);
  }

  // La newsletter (16-11-2026): [data-lynkia-newsletter] se rellena con un formulario para apuntarse (email y casilla de consentimiento) que
  // manda la suscripcion a Lynkia y deja a la persona pendiente de confirmar desde un email. Los textos vienen en el idioma de quien visita;
  // la propia web puede poner los suyos con data-title, data-text, data-button y data-consent (un atributo vacio oculta ese texto).
  var NL_CSS =
    ".lk-nl{max-width:620px;margin:0 auto;text-align:center;color:var(--text,inherit);font:inherit}" +
    ".lk-nl-title{margin:0 0 .5rem;font-family:var(--head,inherit);font-size:clamp(1.5rem,4vw,2.1rem);line-height:1.15;font-weight:700}" +
    ".lk-nl-text{margin:0 0 1.25rem;color:var(--muted,inherit);opacity:.9;line-height:1.55}" +
    ".lk-nl-form{position:relative;text-align:left}.lk-nl-row{display:flex;flex-wrap:wrap;gap:10px}" +
    ".lk-nl-input{flex:1 1 220px;min-width:0;font:inherit;font-size:1rem;padding:.8rem 1rem;border-radius:var(--r-sm,10px);border:1px solid var(--line,rgba(127,127,127,.35));background:var(--surface,transparent);color:var(--text,inherit);outline:none;transition:border-color .15s ease,box-shadow .15s ease}" +
    ".lk-nl-input:focus{border-color:var(--accent,#111);box-shadow:0 0 0 3px rgba(var(--accent-rgb,17,17,17),.18)}" +
    ".lk-nl-btn{appearance:none;font:inherit;font-weight:700;font-size:1rem;padding:.8rem 1.4rem;border-radius:var(--r-sm,10px);border:0;background:var(--accent,#111);color:var(--ink,#fff);cursor:pointer;transition:filter .15s ease,transform .15s ease}" +
    ".lk-nl-btn:hover{filter:brightness(1.08)}.lk-nl-btn:active{transform:translateY(1px)}.lk-nl-btn[disabled]{opacity:.6;cursor:default}" +
    ".lk-nl-btn:focus-visible,.lk-nl-consent input:focus-visible{outline:2px solid var(--accent,#111);outline-offset:2px}" +
    ".lk-nl-consent{display:flex;gap:.6rem;align-items:flex-start;margin-top:.9rem;font-size:.85rem;line-height:1.4;color:var(--muted,inherit);cursor:pointer}" +
    ".lk-nl-consent input{margin-top:.15rem;width:1.05rem;height:1.05rem;flex:0 0 auto;accent-color:var(--accent,#111)}" +
    ".lk-nl-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}" +
    ".lk-nl-msg{min-height:1.3em;margin:.75rem 0 0;font-size:.9rem;color:var(--muted,inherit)}.lk-nl-msg.err{color:#c0392b}" +
    ".lk-nl-done{display:flex;gap:.75rem;align-items:center;justify-content:center;padding:1rem 1.2rem;border-radius:var(--r,14px);border:1px solid var(--line,rgba(127,127,127,.35));background:rgba(var(--accent-rgb,17,17,17),.07);text-align:left;line-height:1.45}" +
    ".lk-nl-done svg{flex:0 0 auto;width:1.5rem;height:1.5rem;color:var(--accent,#111)}" +
    "@media (max-width:520px){.lk-nl-btn{flex:1 1 100%}}";
  var NL_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/></svg>';
  var nlWired = false;

  function nlText(root, name, fallback) {
    return root.hasAttribute(name) ? root.getAttribute(name) : fallback;
  }

  function newsletters(handle, api, tx, isPreview) {
    var roots = document.querySelectorAll("[data-lynkia-newsletter]");
    if (!roots.length || !tx || nlWired) return;
    nlWired = true;
    injectCss("lk-nl-css", NL_CSS);
    for (var i = 0; i < roots.length; i++) {
      (function (root, n) {
        var title = nlText(root, "data-title", tx.title);
        var text = nlText(root, "data-text", tx.text);
        var button = nlText(root, "data-button", tx.button);
        var consent = nlText(root, "data-consent", tx.consent);
        var id = "lk-nl-" + n;
        root.innerHTML =
          '<div class="lk-nl">' +
          (title ? '<h2 class="lk-nl-title">' + esc(title) + "</h2>" : "") +
          (text ? '<p class="lk-nl-text">' + esc(text) + "</p>" : "") +
          '<form class="lk-nl-form" novalidate>' +
          '<div class="lk-nl-row"><input class="lk-nl-input" type="email" name="email" required autocomplete="email" inputmode="email" placeholder="' + esc(tx.email) + '" aria-label="' + esc(tx.email) + '">' +
          '<button class="lk-nl-btn" type="submit">' + esc(button) + "</button></div>" +
          '<label class="lk-nl-consent" for="' + id + '"><input id="' + id + '" type="checkbox" name="consent"><span>' + esc(consent) + "</span></label>" +
          '<input class="lk-nl-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<p class="lk-nl-msg" role="status" aria-live="polite"></p></form></div>';
        var form = root.querySelector("form");
        var msg = root.querySelector(".lk-nl-msg");
        var submit = root.querySelector(".lk-nl-btn");
        function say(message, bad) {
          msg.textContent = message || "";
          msg.className = "lk-nl-msg" + (bad ? " err" : "");
        }
        function done(message) {
          form.outerHTML = '<div class="lk-nl-done" role="status">' + NL_CHECK + "<span>" + esc(message) + "</span></div>";
        }
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var email = (form.elements.email.value || "").replace(/^\s+|\s+$/g, "");
          if (!/^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$/.test(email)) return say(tx.email_needed, true), form.elements.email.focus();
          if (!form.elements.consent.checked) return say(tx.consent_needed, true), form.elements.consent.focus();
          if (isPreview) return say(tx.preview, false);
          submit.disabled = true;
          say(tx.sending, false);
          fetch(api + "/public/newsletter/" + encodeURIComponent(handle), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, consent: true, website: form.elements.website.value || "" }),
          })
            .then(function (res) {
              return res.json().then(function (body) {
                return { ok: res.ok, body: body };
              });
            })
            .then(function (r) {
              if (r.ok) return done(r.body.status === "already" ? tx.already : tx.pending);
              submit.disabled = false;
              say(typeof r.body.detail === "string" ? r.body.detail : tx.error, true);
            })
            .catch(function () {
              submit.disabled = false;
              say(tx.error, true);
            });
        });
      })(roots[i], i);
    }
  }

  function clear() {
    var skeletons = document.querySelectorAll("[data-lynkia-block] .lk-skel");
    for (var i = 0; i < skeletons.length; i++) skeletons[i].parentNode.removeChild(skeletons[i]);
  }

  function start() {
    var inline = document.getElementById("lynkia-site-data");
    if (inline) {
      try {
        var seed = JSON.parse(inline.textContent);
        cart(seed.handle, seed.store_url, (seed.texts && seed.texts.cart) || "Cart");
        newsletters(seed.handle, "", seed.newsletter, true);
        render(seed);
      } catch (e) {
        clear();
      }
      return;
    }
    var cfgEl = document.getElementById("lynkia-site-config");
    if (!cfgEl) return clear();
    var cfg = JSON.parse(cfgEl.textContent);
    // Antes de saber nada mas, el carrito ya apunta a donde estaba al publicar (la API lo corrige con la direccion de ahora).
    cart(cfg.handle, cfg.store, document.documentElement.lang === "en" ? "Cart" : "Carrito");
    if (!window.fetch) return clear();
    // ?currency=usd en el enlace (desde una app o una campaña) fija la moneda durante esta visita.
    var match = /[?&]currency=([a-z]{3})/i.exec(window.location.search);
    var url = cfg.api + "/public/site/" + encodeURIComponent(cfg.handle) + (match ? "?currency=" + match[1].toLowerCase() : "");
    fetch(url)
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (data) cart(data.handle, data.store_url, data.texts && data.texts.cart);
        if (data) newsletters(cfg.handle, cfg.api, data.newsletter, false);
        if (data && data.published) render(data);
        else clear();
      })
      .catch(clear);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
