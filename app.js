// X & Z Decoraciones: portada con fundido, indice filtrable, visor y mensajes de WhatsApp prellenados.
const WHATSAPP = "573162764191";
const enlaceWhatsApp = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
const quieroUna = (titulo) => enlaceWhatsApp(`Hola, vi en su página la decoración "${titulo}" y quiero una así. Mi evento es el día __ en __.`);
const porId = Object.fromEntries(DECORACIONES.map((d) => [d.id, d]));
const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Portada: las fotos cambian como luz que se mueve en un cuarto
(() => {
  const fotos = [...document.querySelectorAll(".portada-fotos img")];
  const pie = document.querySelector(".portada-pie");
  if (fotos.length < 2 || reducido) return;
  let i = 0;
  const siguiente = () => {
    if (document.hidden) return;
    const actual = fotos[i];
    i = (i + 1) % fotos.length;
    const nueva = fotos[i];
    if (!nueva.complete) { i = fotos.indexOf(actual); return; }
    nueva.classList.add("activa");
    actual.classList.remove("activa");
    if (pie) pie.textContent = nueva.dataset.titulo;
  };
  setInterval(siguiente, 6000);
})();

// Con movimiento reducido el video queda quieto en su primer cuadro
if (reducido) document.querySelectorAll("video[autoplay]").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });

// Visor de una decoracion con todas sus fotos
const visor = document.querySelector(".visor");
const visorTitulo = visor.querySelector("h2");
const visorFotos = visor.querySelector(".visor-fotos");
const visorDetalle = visor.querySelector(".visor-abajo p");
const visorBoton = visor.querySelector(".visor-abajo .boton");
let volverA = null;
function abrir(id, desde) {
  const d = porId[id];
  if (!d) return;
  volverA = desde;
  visorTitulo.textContent = d.titulo;
  visorDetalle.textContent = d.detalle;
  visorBoton.href = quieroUna(d.titulo);
  visorFotos.innerHTML = d.fotos.map((f, n) =>
    `<img src="${f.src}-1200.webp" srcset="${f.src}-600.webp 600w, ${f.src}-1200.webp 1200w" sizes="(max-width: 48em) 86vw, 60vw"
      width="1200" height="${Math.round(1200 * f.p)}" alt="${d.titulo}, foto ${n + 1} de ${d.fotos.length}" ${n > 1 ? 'loading="lazy"' : ""}>`).join("");
  visorFotos.scrollLeft = 0;
  visor.classList.add("abierto");
  visor.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  visor.querySelector(".visor-cerrar").focus();
  history.pushState({ visor: id }, "", `#${id}`);
}
function cerrar(desdeHistorial) {
  if (!visor.classList.contains("abierto")) return;
  visor.classList.remove("abierto");
  visor.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (volverA) volverA.focus();
  if (!desdeHistorial) history.back();
}
visor.querySelector(".visor-cerrar").addEventListener("click", () => cerrar(false));
addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(false); });
addEventListener("popstate", () => cerrar(true));
document.addEventListener("click", (e) => {
  const disparador = e.target.closest("[data-abrir]");
  if (!disparador) return;
  e.preventDefault();
  abrir(disparador.dataset.abrir, disparador);
});
// Un link con #montaje (el que se comparte por WhatsApp) abre ese montaje de una vez
if (porId[location.hash.slice(1)]) {
  const id = location.hash.slice(1);
  history.replaceState(null, "", location.pathname);
  abrir(id, document.querySelector("#montajes h2"));
}

// Enlaces "Quiero una así" ya escritos en la pagina
document.querySelectorAll("[data-quiero]").forEach((a) => { a.href = quieroUna(a.dataset.quiero); });

// Indice: que celebras -> las tarjetas de esa ocasion, cada una abre su visor
(() => {
  const lista = document.querySelector(".tarjetas");
  const filtros = document.querySelector(".filtros");
  const contador = document.querySelector(".contador");
  if (!lista) return;
  const orden = Object.keys(CATEGORIAS);
  const decoraciones = [...DECORACIONES].sort((a, b) => orden.indexOf(a.cat) - orden.indexOf(b.cat));
  const inicial = "baby"; // una lista corta para empezar; "Todas" sigue a un toque
  filtros.innerHTML = [`<button class="filtro" type="button" data-cat="" aria-pressed="false">Todas</button>`,
    ...orden.filter((c) => decoraciones.some((d) => d.cat === c))
      .map((c) => `<button class="filtro" type="button" data-cat="${c}" aria-pressed="${c === inicial}">${CATEGORIAS[c]}</button>`)].join("");
  const pintar = (cat) => {
    const elegidas = decoraciones.filter((d) => !cat || d.cat === cat);
    lista.innerHTML = elegidas.map((d) =>
      `<li class="tarjeta"><button type="button" data-abrir="${d.id}">
        <figure><img src="${d.fotos[0].src}-600.webp" width="600" height="${Math.round(600 * d.fotos[0].p)}" loading="lazy" alt="${d.titulo}"></figure>
        <span class="tarjeta-nombre">${d.titulo}<small>${d.fotos.length} fotos</small></span>
        <span class="tarjeta-detalle">${d.detalle}</span></button></li>`).join("");
    contador.textContent = `${elegidas.length} montajes${cat ? ` de ${CATEGORIAS[cat].toLowerCase()}` : ""}`;
  };
  filtros.addEventListener("click", (e) => {
    const b = e.target.closest(".filtro");
    if (!b) return;
    filtros.querySelectorAll(".filtro").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    pintar(b.dataset.cat);
  });
  pintar(inicial);
})();

// Servicios: al pasar o tocar un servicio, la foto y el texto de al lado muestran un montaje de ese tipo
(() => {
  const explica = document.querySelector(".explica p");
  const foto = document.querySelector(".explica img");
  if (!explica || !foto) return;
  const servicios = [...document.querySelectorAll(".grupo li[data-explica]")];
  servicios.forEach((li) => {
    const poner = () => {
      servicios.forEach((x) => x.classList.toggle("activo", x === li));
      explica.textContent = li.dataset.explica;
      const src = `${li.dataset.foto}-1200.webp`;
      if (!li.dataset.foto || foto.getAttribute("src") === src) return;
      const nueva = new Image();
      nueva.src = src;
      foto.classList.add("cambiando");
      nueva.decode().catch(() => {}).then(() => { foto.src = src; foto.alt = li.textContent; foto.classList.remove("cambiando"); });
    };
    li.addEventListener("pointerenter", poner);
    li.addEventListener("focus", poner);
    li.addEventListener("click", poner);
  });
})();

// Como reservar: flechas y barra de avance de la fila
(() => {
  const fila = document.querySelector(".fila");
  const barra = document.querySelector(".progreso span");
  if (!fila) return;
  const actualizar = () => {
    const max = fila.scrollWidth - fila.clientWidth;
    const visible = fila.clientWidth / fila.scrollWidth;
    barra.style.width = `${Math.min(100, (visible + (max ? fila.scrollLeft / max : 1) * (1 - visible)) * 100)}%`;
  };
  fila.addEventListener("scroll", actualizar, { passive: true });
  addEventListener("resize", actualizar);
  document.querySelectorAll(".flechas button").forEach((b) => b.addEventListener("click", () => {
    fila.scrollBy({ left: Number(b.dataset.dir) * 332, behavior: reducido ? "auto" : "smooth" });
  }));
  actualizar();
})();

// Entradas: cada parte de la seccion aparece una vez, en orden de lectura
(() => {
  const objetivos = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) { objetivos.forEach((el) => el.classList.add("dentro")); return; }
  // la persiana empieza recortada a altura cero y el observador no la ve: se vigila su contenedor
  const vigilado = new Map();
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) {
      (vigilado.get(e.target) || []).forEach((el) => el.classList.add("dentro"));
      io.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
  objetivos.forEach((el) => {
    const blanco = el.classList.contains("persiana") ? el.parentElement : el;
    vigilado.set(blanco, [...(vigilado.get(blanco) || []), el]);
  });
  vigilado.forEach((_, blanco) => io.observe(blanco));
  // respaldo: si el observador se retrasa (pestanas en segundo plano, navegadores viejos), el scroll revela
  let pendiente = false;
  addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    setTimeout(() => {
      pendiente = false;
      vigilado.forEach((els, blanco) => {
        const r = blanco.getBoundingClientRect();
        if (r.top < innerHeight * 0.95 && r.bottom > 0) els.forEach((el) => el.classList.add("dentro"));
      });
    }, 150);
  }, { passive: true });
  addEventListener("load", () => setTimeout(() => objetivos.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) el.classList.add("dentro");
  }), 2500));
})();
