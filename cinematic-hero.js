import * as THREE from "./vendor/three.module.js";
import { createFootball } from "./athlete-model.js";

// Original photographic keyframes: scroll controls the edit and camera.
// No timer, wheel interception, touch interception or scroll lock.
const shots = [
  { file: "01-preparation", at: 0, focus: 0.75, zoom: 0.025 },
  { file: "02-windup", at: 0.14, focus: 0.74, zoom: 0.03 },
  { file: "03-contact", at: 0.29, focus: 0.65, zoom: 0.035 },
  { file: "04-flight", at: 0.42, focus: 0.3, zoom: 0.025 },
  { file: "05-goal", at: 0.59, focus: 0.81, zoom: 0.055 },
  { file: "06-net", at: 0.7, focus: 0.81, zoom: 0.055 },
  { file: "07-boot", at: 0.83, focus: 0.76, zoom: 0.045 },
  { file: "08-close", at: 0.94, focus: 0.68, zoom: 0.025 },
];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const range = (p, a, b) => smooth((p - a) / (b - a));
const asset = (shot) =>
  new URL(`./assets/film/${shot.file}.webp`, import.meta.url).href;

function createBallPass(host) {
  // Photos work without WebGL. The optional real 3D ball passes toward the
  // audience before the camera follows the scored goal.
  const probe = document.createElement("canvas");
  const context = probe.getContext("webgl2") || probe.getContext("webgl");
  if (!context) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: probe,
      context,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.3));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "film-ball-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    camera.position.z = 6;
    scene.add(new THREE.HemisphereLight(0xf5fff4, 0x172b15, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3.6);
    key.position.set(-3, 4, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd7f65b, 1.4);
    rim.position.set(4, 0, -2);
    scene.add(rim);
    const ball = createFootball(0.4);
    scene.add(ball);
    let lost = false;
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      lost = true;
      renderer.domElement.hidden = true;
    });
    renderer.domElement.addEventListener("webglcontextrestored", () => {
      lost = false;
    });
    return {
      resize(w, h) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      },
      render(p, mobile) {
        const showing = !lost && p > 0.445 && p < 0.585;
        renderer.domElement.hidden = !showing;
        if (!showing) return;
        const t = clamp((p - 0.445) / 0.14);
        const near = Math.sin(Math.PI * t);
        const z = near * 4.15;
        const visibleHeight =
          2 * Math.tan(THREE.MathUtils.degToRad(19)) * (6 - z);
        const visibleWidth = visibleHeight * camera.aspect;
        ball.position.set(
          mix(mobile ? 0.08 : 0.16, mobile ? 0.14 : 0.24, t) * visibleWidth,
          (mobile ? -0.15 : 0.015) * visibleHeight,
          z,
        );
        ball.rotation.set(t * 6.5, t * 8, t * 3);
        const alpha = range(p, 0.445, 0.465) * (1 - range(p, 0.56, 0.585));
        renderer.domElement.style.opacity = alpha;
        renderer.render(scene, camera);
      },
    };
  } catch {
    if (renderer) renderer.dispose();
    probe.remove();
    return null;
  }
}

export function initCinematicHero() {
  const track = document.querySelector("#experiencia");
  if (!track) return;
  const sticky = track.querySelector(".film-sticky");
  const host = document.querySelector("#film-scene");
  const still = document.querySelector("#film-still");
  const loading = document.querySelector("#film-loading");
  const toggle = document.querySelector("#film-motion");
  const play = document.querySelector("#film-play");
  const copy = track.querySelector(".film-copy");
  const impact = track.querySelector(".film-impact-copy");
  const goal = track.querySelector(".film-goal-copy");
  const outro = track.querySelector(".film-outro");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  canvas.className = "film-photo-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d", { alpha: false });
  let active = !!ctx,
    reduced = motion.matches,
    paused = false;
  let start = 0,
    travel = 1,
    target = 0,
    progress = 0,
    frozen = 0;
  let width = 0,
    height = 0,
    ratio = 1,
    visible = true;
  let frame = 0,
    lastTime = 0,
    lastPaint = -1,
    lastPhase = "";
  let ball = null,
    queueStarted = false,
    loaded = 0;
  const images = new Array(shots.length);

  function controls() {
    const running = active && !paused && !reduced;
    toggle.disabled = reduced || !active;
    toggle.setAttribute("aria-pressed", String(running));
    toggle.setAttribute(
      "aria-label",
      running ? "Pausar animação da hero" : "Retomar animação da hero",
    );
    toggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${running ? '<path d="M9 6v12M15 6v12"/>' : '<path d="m9 5 10 7-10 7Z"/>'}</svg>`;
    const label =
      reduced || !active
        ? "CONHEÇA A BRENO 10"
        : progress > 0.92
          ? "REVIVER A JOGADA"
          : paused
            ? "JOGADA PAUSADA"
            : "ROLE PARA VIVER A JOGADA";
    document.querySelector("#film-cue-label").textContent = label;
    play.setAttribute(
      "aria-label",
      reduced || !active
        ? "Conhecer a chuteira BRENO 10"
        : progress > 0.92
          ? "Voltar ao início da jogada"
          : "Avançar para a próxima cena da jogada",
    );
  }
  function readScroll() {
    target = reduced || !active ? 0 : clamp((scrollY - start) / travel);
    wake();
  }
  function layout() {
    const rect = host.getBoundingClientRect();
    width = Math.round(rect.width);
    height = Math.round(rect.height);
    ratio = Math.min(devicePixelRatio || 1, width < 761 ? 1.5 : 1.4);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (ball) ball.resize(width, height);
    start = track.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, track.offsetHeight - sticky.offsetHeight);
    lastPaint = -1;
    readScroll();
  }
  function staticMode() {
    track.classList.toggle("is-static", reduced || !active);
    if (reduced || !active) {
      progress = 0;
      target = 0;
      paused = false;
    }
    controls();
    layout();
  }
  function copyState(el, opacity, offset = 24) {
    el.style.opacity = opacity;
    el.style.visibility = opacity < 0.015 ? "hidden" : "visible";
    el.style.transform = `translate3d(0,${(1 - opacity) * offset}px,0)`;
    el.inert = opacity < 0.015;
  }
  function updateCopy(p) {
    copyState(copy, 1 - range(p, 0.18, 0.29), -24);
    copyState(impact, range(p, 0.28, 0.34) * (1 - range(p, 0.49, 0.56)));
    copyState(goal, range(p, 0.6, 0.66) * (1 - range(p, 0.75, 0.81)));
    copyState(outro, range(p, 0.86, 0.94));
    track.style.setProperty("--shot-progress", p);
    track.dataset.progress = p.toFixed(3);
    const phase =
      p < 0.26
        ? "ready"
        : p < 0.39
          ? "contact"
          : p < 0.61
            ? "flight"
            : p < 0.79
              ? "goal"
              : p < 0.92
                ? "detail"
                : "finish";
    if (lastPhase !== phase) {
      lastPhase = phase;
      track.dataset.phase = phase;
      const phases = {
        ready: [
          "01 / INSTINTO",
          "Jogador realista da KICK preparando um chute em um estádio à noite.",
        ],
        contact: [
          "02 / O CHUTE",
          "A chuteira BRENO 10 acerta a bola; a grama molhada se espalha.",
        ],
        flight: [
          "03 / TRAJETÓRIA",
          "A bola avança em direção à câmera e a jogada segue para o gol.",
        ],
        goal: [
          "04 / É GOL",
          "A bola entra no canto do gol e faz a rede reagir.",
        ],
        detail: [
          "05 / ASSINATURA",
          "A câmera retorna aos pés do jogador e se aproxima da chuteira.",
        ],
        finish: [
          "06 / BRENO 10",
          "Close final da chuteira BRENO 10 verde elétrico, com gotas de água e detalhes do material.",
        ],
      };
      document.querySelector("#film-phase").textContent = phases[phase][0];
      host.setAttribute("aria-label", phases[phase][1]);
    }
    document.querySelector("#film-percentage").textContent =
      `${String(Math.round(p * 100)).padStart(2, "0")}%`;
    controls();
  }

  function drawPhoto(image, shot, local, alpha) {
    if (!image || !alpha) return;
    ctx.globalAlpha = alpha;
    const mobile = width < 761;
    // A dedicated lower frame preserves the player's head and boots on phones.
    const boxY = mobile ? height * 0.34 : 0;
    const boxH = mobile ? height * 0.59 : height;
    const zoom = 1 + shot.zoom * local;
    const base = Math.max(
      width / image.naturalWidth,
      boxH / image.naturalHeight,
    );
    const scale = base * zoom;
    const iw = image.naturalWidth * scale,
      ih = image.naturalHeight * scale;
    const focal = mobile ? shot.focus : 0.54;
    let x = clamp(width * (mobile ? 0.6 : 0.54) - iw * focal, width - iw, 0);
    const y = boxY + (boxH - ih) * 0.47;
    if (mobile) {
      const bgScale = Math.max(
        width / image.naturalWidth,
        height / image.naturalHeight,
      );
      const bw = image.naturalWidth * bgScale,
        bh = image.naturalHeight * bgScale;
      ctx.drawImage(
        image,
        (width - bw) * shot.focus,
        (height - bh) * 0.5,
        bw,
        bh,
      );
      ctx.fillStyle = "rgba(4,10,8,.87)";
      ctx.fillRect(0, 0, width, height);
    }
    if (mobile && shots.indexOf(shot) >= 6) {
      // Fit the product silhouette, keeping both heel and toe in a tall screen.
      const size =
        Math.min(
          width / (image.naturalWidth * 0.7),
          boxH / image.naturalHeight,
        ) * zoom;
      const sw = image.naturalWidth * size,
        sh = image.naturalHeight * size;
      x = width * 0.5 - sw * 0.64;
      ctx.drawImage(image, x, boxY + (boxH - sh) * 0.55, sw, sh);
    } else ctx.drawImage(image, x, y, iw, ih);
    ctx.globalAlpha = 1;
  }
  function nearestImage(index) {
    if (images[index]) return index;
    for (let step = 1; step < shots.length; step++) {
      if (images[index - step]) return index - step;
      if (images[index + step]) return index + step;
    }
    return -1;
  }
  function paint(p) {
    if (!ctx || !width || !height || !loaded) {
      updateCopy(p);
      return;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#050b09";
    ctx.fillRect(0, 0, width, height);
    let i = 0;
    while (i < shots.length - 1 && p >= shots[i + 1].at) i++;
    const next = Math.min(i + 1, shots.length - 1);
    const local = clamp(
      (p - shots[i].at) / ((shots[next].at || 1) - shots[i].at || 0.06),
    );
    // Different camera angles use a brief editorial transition; a long
    // dissolve would show two stadiums and two players at the same time.
    const cut = i === 3 || i === 5;
    const blend =
      next === i ? 0 : range(local, cut ? 0.85 : 0.5, cut ? 0.98 : 0.78);
    const a = nearestImage(i),
      b = nearestImage(next);
    if (a >= 0) drawPhoto(images[a], shots[a], local, 1);
    if (b >= 0 && b !== a) drawPhoto(images[b], shots[b], local * 0.3, blend);
    track.dataset.scene = String(blend > 0.5 ? b + 1 : a + 1).padStart(2, "0");
    track.dataset.blend = blend.toFixed(3);
    if (width < 761) {
      const fade = ctx.createLinearGradient(0, height * 0.28, 0, height * 0.48);
      fade.addColorStop(0, "#050b09");
      fade.addColorStop(1, "rgba(5,11,9,0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, width, height * 0.48);
    }
    const flash = (1 - Math.abs(p - 0.58) / 0.015) * 0.09;
    track.querySelector(".film-flash").style.opacity = Math.max(0, flash);
    if (ball) ball.render(p, width < 761);
    updateCopy(p);
  }
  function tick(time) {
    frame = 0;
    if (!visible || document.hidden) return;
    const elapsed = Math.min((time - (lastTime || time - 16)) / 1000, 0.064);
    lastTime = time;
    const desired = reduced || !active ? 0 : paused ? frozen : target;
    progress = mix(progress, desired, 1 - Math.exp(-elapsed * 14));
    if (Math.abs(progress - desired) < 0.0003) progress = desired;
    if (Math.abs(progress - lastPaint) > 0.00002) {
      paint(progress);
      lastPaint = progress;
    }
    if (Math.abs(progress - desired) > 0.0001)
      frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!frame && visible && !document.hidden) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  function loadImage(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        images[index] = img;
        loaded++;
        track.dataset.framesLoaded = String(loaded);
        lastPaint = -1;
        wake();
        resolve();
      };
      img.onerror = () => {
        track.dataset.framesFailed = String(
          Number(track.dataset.framesFailed || 0) + 1,
        );
        resolve();
      };
      img.src = asset(shots[index]);
    });
  }
  async function loadRemaining() {
    if (queueStarted || reduced || !active) return;
    queueStarted = true;
    let next = 1;
    async function worker() {
      while (next < shots.length) {
        const i = next++;
        await loadImage(i);
      }
    }
    await Promise.all([worker(), worker()]);
  }
  function fallback() {
    active = false;
    track.classList.add("film-unavailable");
    loading.hidden = true;
    staticMode();
    paint(0);
  }

  toggle.addEventListener("click", () => {
    if (reduced || !active) return;
    paused = !paused;
    frozen = progress;
    controls();
    wake();
  });
  play.addEventListener("click", () => {
    if (reduced || !active) {
      document
        .querySelector("#produto")
        .scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      return;
    }
    paused = false;
    controls();
    const next =
      progress > 0.92
        ? 0
        : Math.min(1, shots.find((shot) => shot.at > progress + 0.04)?.at ?? 1);
    window.scrollTo({ top: start + travel * next, behavior: "smooth" });
  });
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", layout, { passive: true });
  document.addEventListener("visibilitychange", wake);
  motion.addEventListener("change", () => {
    reduced = motion.matches;
    if (!reduced && active && loaded && !ball) ball = createBallPass(host);
    staticMode();
    loadRemaining();
  });
  new ResizeObserver(layout).observe(sticky);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  }).observe(sticky);
  if (!ctx) {
    fallback();
    return;
  }
  host.append(canvas);
  staticMode();
  updateCopy(0);
  loadImage(0).then(() => {
    if (!loaded) {
      fallback();
      return;
    }
    track.classList.add("film-ready");
    still.hidden = true;
    loading.hidden = true;
    if (!reduced) ball = createBallPass(host);
    layout();
    paint(progress);
    loadRemaining();
  });
}
