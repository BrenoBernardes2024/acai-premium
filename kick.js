import * as THREE from "./vendor/three.module.js";
import { createBoot, setBootColor } from "./boot-model.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const variants = {
  volt: {
    name: "VOLT",
    color: "#d7f65b",
    label: "Verde elétrico",
    number: "01",
    background: "#e4eacb",
  },
  shadow: {
    name: "SHADOW",
    color: "#343934",
    label: "Preto carbono",
    number: "02",
    background: "#dde0d9",
  },
  flare: {
    name: "FLARE",
    color: "#ff6b43",
    label: "Laranja solar",
    number: "03",
    background: "#efded4",
  },
};
const price = 89990;
const money = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let activeColor = "volt";
let rotationEnabled = !reducedMotion.matches;
let sceneState;
let selectedVariant = "volt";
let selectedSize = null;
let toastTimer;
const thumbnails = {};

function bootSVG(variant) {
  const { color, name } = variants[variant];
  return `<svg viewBox="0 0 600 300" role="img" aria-label="Chuteira BRENO 10 ${name}"><path d="M70 185C100 165 132 148 176 151L203 89L247 80L263 133C330 125 358 153 430 162C478 168 524 178 525 207C518 229 92 244 61 221Z" fill="${color}"/><path d="m178 151 30-56 38-8 17 46-33 19Z" fill="#222721"/><path d="M62 214q215 29 462-5l-3 19q-203 35-452 1Z" fill="#252925"/><path d="m260 165 60-9-35 25 72-8-67 42 16-26-60 9Z" fill="${variant === "shadow" ? "#d7f65b" : "#1e241b"}"/><path d="m267 146 34 15m-20-14 29 15m-13-14 28 13m-11-12 24 12" fill="none" stroke="#e6e9d9" stroke-width="5"/><g fill="#222721"><path d="m110 235 5 19h18l5-17M181 242l5 20h17l5-19M348 238l5 20h17l5-21M459 230l5 20h17l5-23"/></g></svg>`;
}

function productArt(variant) {
  return thumbnails[variant]
    ? `<img src="${thumbnails[variant]}" alt="Chuteira BRENO 10 ${variants[variant].name}" width="640" height="420">`
    : bootSVG(variant);
}
$$("[data-boot-art]").forEach((el) => {
  el.innerHTML = productArt(el.dataset.bootArt);
});

function updateRotationButton() {
  const button = $("#rotation-toggle");
  button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${rotationEnabled ? '<path d="M9 6v12M15 6v12"/>' : '<path d="m9 5 10 7-10 7Z"/>'}</svg>`;
  button.setAttribute("aria-pressed", String(rotationEnabled));
  button.setAttribute(
    "aria-label",
    rotationEnabled ? "Pausar rotação automática" : "Ativar rotação automática",
  );
}
updateRotationButton();

function changeColor(variant) {
  activeColor = variant;
  const config = variants[variant];
  $$("[data-color]").forEach((button) => {
    const selected = button.dataset.color === variant;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $("#color-name").textContent = `${config.number} / ${config.name}`;
  $("#scene").setAttribute(
    "aria-label",
    `Modelo 3D da chuteira BRENO 10 ${config.name}. Arraste para girar.`,
  );
  if (sceneState) setBootColor(sceneState.boot, config.color);
  const fallback = $("#boot-fallback");
  fallback.style.filter =
    variant === "shadow"
      ? "grayscale(1) brightness(.32) drop-shadow(0 35px 16px #0002)"
      : variant === "flare"
        ? "hue-rotate(290deg) drop-shadow(0 35px 16px #0002)"
        : "";
}
$$("[data-color]").forEach((button) =>
  button.addEventListener("click", () => changeColor(button.dataset.color)),
);

function setupScene() {
  const host = $("#scene");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute(
    "aria-label",
    "Chuteira em 3D. Use as setas do teclado ou arraste para girar.",
  );
  canvas.setAttribute("tabindex", "0");
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(3.8, 3.2, 8);
  camera.lookAt(0.1, 0.0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x66734d, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {
    left: -5,
    right: 5,
    top: 5,
    bottom: -5,
    near: 0.1,
    far: 20,
  });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.04;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe9ffd2, 1.4);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  const front = new THREE.DirectionalLight(0xffffff, 0.4);
  front.position.set(1, 1, 6);
  scene.add(front);
  const boot = createBoot({ color: variants.volt.color });
  const rest = { x: -0.08, y: -0.37, z: 0.14 };
  boot.rotation.set(rest.x, rest.y, rest.z);
  scene.add(boot);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ opacity: 0.14 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.77;
  ground.receiveShadow = true;
  scene.add(ground);
  sceneState = { boot, renderer, camera, rest };
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    // Keep the entire boot framed even in a tall, narrow mobile viewport.
    camera.fov = THREE.MathUtils.radToDeg(
      2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(19)) / camera.aspect),
    );
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  // Render collection previews from the same actual 3D model, without extra canvases.
  const previousPosition = camera.position.clone();
  camera.position.set(3, 2.3, 6.2);
  camera.lookAt(0, 0.5, 0);
  camera.aspect = 640 / 420;
  camera.fov = 28;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(1);
  renderer.setSize(640, 420);
  ground.visible = false;
  for (const [variant, config] of Object.entries(variants)) {
    setBootColor(boot, config.color);
    renderer.render(scene, camera);
    thumbnails[variant] = canvas.toDataURL("image/png");
  }
  ground.visible = true;
  setBootColor(boot, variants[activeColor].color);
  camera.position.copy(previousPosition);
  camera.lookAt(0.1, 0.0, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  resize();
  $$("[data-boot-art]").forEach((el) => {
    el.innerHTML = productArt(el.dataset.bootArt);
  });
  $("#scene-loading").hidden = true;
  $("#product-stage").classList.add("scene-ready");
  let visible = true;
  let dragging = false;
  let pointer;
  let yaw = rest.y;
  let pitch = rest.x;
  let lastTime = 0;
  let phase = 0;
  let frame;
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.02 },
  ).observe(host);
  const animate = (time) => {
    frame = requestAnimationFrame(animate);
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (!visible || document.hidden) return;
    if (rotationEnabled && !dragging) phase += delta * 0.42;
    boot.rotation.y = yaw + (rotationEnabled ? Math.sin(phase) * 0.32 : 0);
    boot.rotation.x = pitch;
    boot.position.y =
      reducedMotion.matches || !rotationEnabled
        ? 0
        : Math.sin(phase * 1.6) * 0.06;
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(animate);
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragging = true;
    if (rotationEnabled) yaw += Math.sin(phase) * 0.32;
    rotationEnabled = false;
    updateRotationButton();
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointer?.id) return;
    yaw += (event.clientX - pointer.x) * 0.008;
    pitch = THREE.MathUtils.clamp(
      pitch + (event.clientY - pointer.y) * 0.005,
      -0.8,
      0.8,
    );
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  const endDrag = () => {
    dragging = false;
    pointer = null;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("lostpointercapture", endDrag);
  canvas.addEventListener("keydown", (event) => {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    rotationEnabled = false;
    updateRotationButton();
    if (event.key === "ArrowLeft") yaw -= 0.15;
    if (event.key === "ArrowRight") yaw += 0.15;
    if (event.key === "ArrowUp") pitch = Math.max(-0.8, pitch - 0.1);
    if (event.key === "ArrowDown") pitch = Math.min(0.8, pitch + 0.1);
    if (event.key === "Home") {
      yaw = rest.y;
      pitch = rest.x;
    }
  });
  $("#rotation-toggle").addEventListener("click", () => {
    if (rotationEnabled) yaw += Math.sin(phase) * 0.32;
    rotationEnabled = !rotationEnabled;
    phase = 0;
    updateRotationButton();
  });
  $("#view-reset").addEventListener("click", () => {
    yaw = rest.y;
    pitch = rest.x;
    phase = 0;
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) rotationEnabled = false;
    updateRotationButton();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    $("#product-stage").classList.add("scene-failed");
    $("#scene-loading").hidden = true;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    $("#product-stage").classList.remove("scene-failed");
    resize();
    lastTime = performance.now();
    frame = requestAnimationFrame(animate);
  });
}
try {
  setupScene();
} catch (error) {
  console.warn("Visualização 3D indisponível neste dispositivo.", error);
  $("#scene-loading").hidden = true;
  $("#product-stage").classList.add("scene-failed");
  $("#rotation-toggle").disabled = true;
  $("#view-reset").disabled = true;
  $(".drag-hint").textContent = "VISUALIZAÇÃO DO PRODUTO";
}

const techDetails = {
  upper: {
    index: "01",
    word: "KNIT",
    title: "Sinta o jogo de perto.",
    copy: "Textura em malha, perfil limpo e um cabedal que envolve o pé. Uma conexão direta entre você, a bola e a próxima jogada.",
  },
  sole: {
    index: "02",
    word: "GRIP",
    title: "A próxima arrancada começa aqui.",
    copy: "Um solado de perfil esportivo, com travas distribuídas para o campo. A geometria acompanha a intenção de cada mudança de direção.",
  },
  fit: {
    index: "03",
    word: "FIT",
    title: "Personalidade que veste bem.",
    copy: "Colarinho em malha e ajuste por cadarços. Escolha o seu tamanho e encontre o encaixe para entrar em campo do seu jeito.",
  },
};
$$("[data-tech]").forEach((button) =>
  button.addEventListener("click", () => {
    const detail = techDetails[button.dataset.tech];
    $$("[data-tech]").forEach((el) => {
      el.classList.toggle("active", el === button);
      el.setAttribute("aria-pressed", String(el === button));
    });
    $("#tech-visual").dataset.detail = button.dataset.tech;
    $(".tech-word").textContent = detail.word;
    $("#tech-index").textContent = detail.index;
    $("#tech-name").textContent = detail.title;
    $("#tech-copy").textContent = detail.copy;
  }),
);

$(".menu-toggle").addEventListener("click", () => {
  const open = $(".mobile-nav").hidden;
  $(".mobile-nav").hidden = !open;
  $(".menu-toggle").setAttribute("aria-expanded", String(open));
  $(".menu-toggle").setAttribute(
    "aria-label",
    open ? "Fechar menu" : "Abrir menu",
  );
});
$$(".mobile-nav a").forEach((link) =>
  link.addEventListener("click", () => {
    $(".mobile-nav").hidden = true;
    $(".menu-toggle").setAttribute("aria-expanded", "false");
    $(".menu-toggle").setAttribute("aria-label", "Abrir menu");
  }),
);

$$("dialog").forEach((dialog) => {
  dialog
    .querySelectorAll("[data-close]")
    .forEach((button) =>
      button.addEventListener("click", () => dialog.close()),
    );
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  });
});
$("#product-dialog").setAttribute("aria-labelledby", "dialog-name");
$("#bag-dialog").setAttribute("aria-label", "Sua sacola");
$("#info-dialog").setAttribute("aria-label", "Informações");

function updateProduct(variant) {
  selectedVariant = variant;
  $("#dialog-name").textContent = `BRENO 10 — ${variants[variant].name}`;
  $("#dialog-art").innerHTML = productArt(variant);
  $("#dialog-art").style.background = variants[variant].background;
  $$("[data-dialog-color]").forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.dialogColor === variant),
    ),
  );
  changeColor(variant);
}
function openProduct(variant) {
  updateProduct(variant);
  selectedSize = null;
  $$("[data-size]").forEach((button) =>
    button.setAttribute("aria-pressed", "false"),
  );
  $("#size-feedback").textContent = "Escolha um tamanho para continuar.";
  $("#size-feedback").classList.remove("error");
  $("#product-dialog").showModal();
}
$$("[data-product]").forEach((button) =>
  button.addEventListener("click", () => openProduct(button.dataset.product)),
);
$$("[data-dialog-color]").forEach((button) =>
  button.addEventListener("click", () =>
    updateProduct(button.dataset.dialogColor),
  ),
);
$$("[data-size]").forEach((button) =>
  button.addEventListener("click", () => {
    selectedSize = button.dataset.size;
    $$("[data-size]").forEach((el) =>
      el.setAttribute("aria-pressed", String(el === button)),
    );
    $("#size-feedback").textContent = `Tamanho ${selectedSize} selecionado.`;
    $("#size-feedback").classList.remove("error");
  }),
);

function readBag() {
  try {
    const stored = JSON.parse(localStorage.getItem("kick-breno-bag") || "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .filter(
        (item) =>
          item &&
          Object.hasOwn(variants, item.variant) &&
          /^\d{2}$/.test(String(item.size)) &&
          +item.size >= 37 &&
          +item.size <= 44 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= 10,
      )
      .map((item) => ({
        variant: item.variant,
        size: String(item.size),
        quantity: item.quantity,
      }));
  } catch {
    return [];
  }
}
let bag = readBag();
function saveBag() {
  try {
    localStorage.setItem("kick-breno-bag", JSON.stringify(bag));
  } catch {
    /* The bag still works without browser storage. */
  }
  renderBag();
}
function renderBag() {
  const count = bag.reduce((total, item) => total + item.quantity, 0);
  $("#bag-count").textContent = `(${count})`;
  $("#drawer-count").textContent = `(${count})`;
  $(".bag-toggle").setAttribute(
    "aria-label",
    `Abrir sacola, ${count} ${count === 1 ? "item" : "itens"}`,
  );
  $("#bag-summary").hidden = !count;
  $("#bag-total").textContent = money(count * price);
  $("#copy-feedback").textContent = "";
  if (!count) {
    $("#bag-items").innerHTML =
      '<div class="empty-bag"><span aria-hidden="true"><svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></span><h3>O JOGO COMEÇA AQUI.</h3><p>Sua sacola ainda está vazia.<br>Encontre a edição que tem a sua personalidade.</p><button class="button button-dark" id="continue-shopping">EXPLORAR A COLEÇÃO <span aria-hidden="true"><svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></span></button></div>';
    $("#continue-shopping").addEventListener("click", () => {
      $("#bag-dialog").close();
      $("#colecao").scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    });
    return;
  }
  $("#bag-items").innerHTML = bag
    .map(
      (item, index) =>
        `<article class="bag-item"><div class="bag-item-art">${productArt(item.variant)}</div><div><h3>BRENO 10 — ${variants[item.variant].name}</h3><p>${variants[item.variant].label} / BR ${item.size}</p><p>${money(price * item.quantity)}</p><div class="bag-item-actions"><div class="quantity-control"><button data-quantity="${index}" data-delta="-1" aria-label="Diminuir quantidade de ${variants[item.variant].name}, tamanho ${item.size}" ${item.quantity === 1 ? "disabled" : ""}>−</button><span>${item.quantity}</span><button data-quantity="${index}" data-delta="1" aria-label="Aumentar quantidade de ${variants[item.variant].name}, tamanho ${item.size}" ${item.quantity >= 10 ? "disabled" : ""}>+</button></div><button class="remove-item" data-remove="${index}" aria-label="Remover ${variants[item.variant].name}, tamanho ${item.size}">Remover</button></div></div></article>`,
    )
    .join("");
  $$("[data-quantity]").forEach((button) =>
    button.addEventListener("click", () => {
      const index = +button.dataset.quantity;
      const delta = +button.dataset.delta;
      bag[index].quantity = Math.max(
        1,
        Math.min(10, bag[index].quantity + delta),
      );
      saveBag();
      const nextButton = $(`[data-quantity="${index}"][data-delta="${delta}"]`);
      if (nextButton && !nextButton.disabled) nextButton.focus();
    }),
  );
  $$("[data-remove]").forEach((button) =>
    button.addEventListener("click", () => {
      const index = +button.dataset.remove;
      bag.splice(index, 1);
      saveBag();
      ($("[data-remove]") || $("#continue-shopping")).focus();
    }),
  );
}
renderBag();
$(".bag-toggle").addEventListener("click", () => $("#bag-dialog").showModal());
function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
$("#add-to-bag").addEventListener("click", () => {
  if (!selectedSize) {
    $("#size-feedback").textContent =
      "Selecione seu tamanho antes de adicionar à sacola.";
    $("#size-feedback").classList.add("error");
    $("[data-size]").focus();
    return;
  }
  const existing = bag.find(
    (item) => item.variant === selectedVariant && item.size === selectedSize,
  );
  if (existing?.quantity >= 10) {
    $("#size-feedback").textContent =
      "Você já tem 10 unidades desta combinação na sacola.";
    return;
  }
  if (existing) existing.quantity++;
  else bag.push({ variant: selectedVariant, size: selectedSize, quantity: 1 });
  saveBag();
  $("#product-dialog").close();
  toast(
    `BRENO 10 ${variants[selectedVariant].name} · BR ${selectedSize} adicionada à sacola.`,
  );
  $("#bag-dialog").showModal();
});
$("#copy-bag").addEventListener("click", async () => {
  const text = [
    "MINHA SELEÇÃO KICK — BRENO 10",
    ...bag.map(
      (item) =>
        `${item.quantity}× BRENO 10 ${variants[item.variant].name} · BR ${item.size} · ${money(item.quantity * price)}`,
    ),
    `Subtotal: ${money(bag.reduce((total, item) => total + item.quantity * price, 0))}`,
    "Coleção conceitual. Nenhum pagamento realizado.",
  ].join("\n");
  try {
    if (!navigator.clipboard?.writeText)
      throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    $("#copy-feedback").textContent =
      "Seleção copiada. Agora você pode compartilhar.";
  } catch {
    $("#info-content").innerHTML =
      '<h2>SUA SELEÇÃO</h2><p>Selecione o texto abaixo para copiar e compartilhar.</p><textarea id="selection-text" readonly aria-label="Resumo da seleção"></textarea>';
    $("#selection-text").value = text;
    $("#info-dialog").showModal();
    $("#selection-text").focus();
    $("#selection-text").select();
  }
});
$("#size-guide-open").addEventListener("click", () => {
  $("#info-content").innerHTML =
    "<h2>ENCONTRE SEU TAMANHO.</h2><p>Meça o pé do calcanhar ao dedo mais longo. Medidas de referência para o conceito BRENO 10.</p><table><thead><tr><th>Tamanho BR</th><th>Comprimento do pé</th></tr></thead><tbody>" +
    [37, 38, 39, 40, 41, 42, 43, 44]
      .map(
        (size, index) =>
          `<tr><td>${size}</td><td>${(24.5 + index * 0.5).toFixed(1).replace(".", ",")} cm</td></tr>`,
      )
      .join("") +
    "</tbody></table><p>O ajuste pode variar. Prefira experimentar antes de uma compra real.</p>";
  $("#info-dialog").showModal();
});
$("#about-open").addEventListener("click", () => {
  $("#info-content").innerHTML =
    "<h2>YOUR GAME.<br>YOUR SIGNATURE.</h2><p>KICK é uma marca conceitual criada para o universo do Breno. Uma identidade original que une futebol, personalidade e design.</p><p>A BRENO 10 é apresentada em três cores, com um modelo 3D exclusivo. Esta experiência não representa uma parceria oficial com fabricantes ou atletas profissionais.</p>";
  $("#info-dialog").showModal();
});
$("#year").textContent = new Date().getFullYear();
