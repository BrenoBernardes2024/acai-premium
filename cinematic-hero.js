import * as THREE from "./vendor/three.module.js";
import { createAthlete, createFootball } from "./athlete-model.js";

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const range = (value, start, end) => smooth((value - start) / (end - start));

const poses = [
  {
    at: 0,
    hip: 0.12,
    knee: 0.29,
    leftHip: -0.04,
    leftKnee: 0.045,
    torso: -0.05,
    turn: -0.21,
    head: -0.18,
    leftArm: -0.25,
    rightArm: 0.18,
    leftSpread: -0.3,
    rightSpread: 0.25,
    leftElbow: -0.3,
    rightElbow: -0.37,
  },
  {
    at: 0.26,
    hip: 0.55,
    knee: 1.17,
    leftHip: 0.05,
    leftKnee: 0.08,
    torso: 0.14,
    turn: 0.28,
    head: -0.22,
    leftArm: 0.49,
    rightArm: -0.72,
    leftSpread: -0.7,
    rightSpread: 0.54,
    leftElbow: -0.58,
    rightElbow: -0.65,
  },
  {
    at: 0.39,
    hip: 0.36,
    knee: 1.08,
    leftHip: 0.07,
    leftKnee: 0.1,
    torso: 0.13,
    turn: 0.16,
    head: -0.27,
    leftArm: 0.3,
    rightArm: -0.6,
    leftSpread: -0.76,
    rightSpread: 0.68,
    leftElbow: -0.6,
    rightElbow: -0.75,
  },
  {
    at: 0.49,
    hip: -0.72,
    knee: 0.13,
    leftHip: 0.075,
    leftKnee: 0.08,
    torso: 0.12,
    turn: -0.18,
    head: -0.22,
    leftArm: -0.38,
    rightArm: 0.54,
    leftSpread: -0.69,
    rightSpread: 0.53,
    leftElbow: -0.41,
    rightElbow: -0.58,
  },
  {
    at: 0.67,
    hip: -1.25,
    knee: 0.18,
    leftHip: 0.03,
    leftKnee: 0.08,
    torso: 0.075,
    turn: -0.39,
    head: -0.04,
    leftArm: -0.49,
    rightArm: 0.71,
    leftSpread: -0.41,
    rightSpread: 0.37,
    leftElbow: -0.46,
    rightElbow: -0.63,
  },
  {
    at: 1,
    hip: -0.91,
    knee: 0.36,
    leftHip: -0.04,
    leftKnee: 0.06,
    torso: -0.045,
    turn: -0.29,
    head: 0.06,
    leftArm: -0.29,
    rightArm: 0.39,
    leftSpread: -0.3,
    rightSpread: 0.22,
    leftElbow: -0.37,
    rightElbow: -0.41,
  },
];

function poseAt(progress) {
  let i = 0;
  while (i < poses.length - 2 && progress > poses[i + 1].at) i++;
  const a = poses[i],
    b = poses[i + 1];
  const t = smooth((progress - a.at) / (b.at - a.at));
  return Object.fromEntries(
    Object.keys(a)
      .filter((key) => key !== "at")
      .map((key) => [key, lerp(a[key], b[key], t)]),
  );
}

function applyPose(athlete, progress, origin) {
  const pose = poseAt(progress);
  athlete.root.position.copy(origin);
  // Keep the supporting foot planted rather than sliding the complete avatar.
  athlete.root.position.y =
    -0.065 +
    0.79 * (1 - Math.cos(pose.leftHip)) +
    0.72 * (1 - Math.cos(pose.leftHip + pose.leftKnee));
  athlete.hips.right.rotation.set(pose.hip, 0, -0.055);
  athlete.knees.right.rotation.x = pose.knee;
  const footPitch = lerp(0.12, -0.25, range(progress, 0.5, 0.67));
  athlete.ankles.right.rotation.x = lerp(
    -0.04,
    -pose.hip - pose.knee + footPitch,
    range(progress, 0.39, 0.49),
  );
  athlete.hips.left.rotation.set(pose.leftHip, 0, 0.025);
  athlete.knees.left.rotation.x = pose.leftKnee;
  athlete.ankles.left.rotation.x = -pose.leftHip - pose.leftKnee;
  athlete.torso.rotation.set(pose.torso, pose.turn, -0.045);
  athlete.head.rotation.set(0.02, pose.head, -0.035);
  athlete.shoulders.left.rotation.set(pose.leftArm, 0, pose.leftSpread);
  athlete.shoulders.right.rotation.set(pose.rightArm, 0, pose.rightSpread);
  athlete.elbows.left.rotation.x = pose.leftElbow;
  athlete.elbows.right.rotation.x = pose.rightElbow;
  athlete.root.updateMatrixWorld(true);
}

function cubic(a, b, c, d, t, result) {
  const u = 1 - t;
  return result
    .copy(a)
    .multiplyScalar(u * u * u)
    .addScaledVector(b, 3 * u * u * t)
    .addScaledVector(c, 3 * u * t * t)
    .addScaledVector(d, t * t * t);
}

function softShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,.55)");
  gradient.addColorStop(0.35, "rgba(0,0,0,.3)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function line(scene, coordinates, color, opacity) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    coordinates.map((p) => new THREE.Vector3(...p)),
  );
  const object = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  scene.add(object);
  return object;
}

export function initCinematicHero() {
  const track = document.querySelector("#experiencia");
  if (!track) return;
  const host = document.querySelector("#film-scene");
  const sticky = track.querySelector(".film-sticky");
  const copy = track.querySelector(".film-copy");
  const impactCopy = track.querySelector(".film-impact-copy");
  const outro = track.querySelector(".film-outro");
  const flash = track.querySelector(".film-flash");
  const toggle = document.querySelector("#film-motion");
  const play = document.querySelector("#film-play");
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer,
    frame,
    active = true,
    paused = false,
    reduced = motionPreference.matches;
  let targetProgress = 0,
    currentProgress = 0,
    frozenProgress = 0,
    start = 0,
    travel = 1;
  let visible = true,
    lastTime = 0,
    lastPhase = "",
    lastPaint = 0;
  let resizeObserver, intersectionObserver;

  const icon = (playing) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${playing ? '<path d="M9 6v12M15 6v12"/>' : '<path d="m9 5 10 7-10 7Z"/>'}</svg>`;
  function updateMotionUI() {
    const running = active && !paused && !reduced;
    toggle.setAttribute("aria-pressed", String(running));
    toggle.setAttribute(
      "aria-label",
      running ? "Pausar animação da hero" : "Ativar animação da hero",
    );
    toggle.innerHTML = icon(running);
    toggle.disabled = reduced || !active;
    document.querySelector("#film-cue-label").textContent =
      reduced || !active
        ? "CONHEÇA A BRENO 10"
        : currentProgress > 0.91
          ? "VOLTAR À JOGADA"
          : "ROLE PARA DAR O CHUTE";
  }
  function setStaticMode(value) {
    track.classList.toggle("is-static", value);
    if (value) {
      targetProgress = 0;
      currentProgress = 0;
    }
    updateMotionUI();
  }
  function readScroll() {
    targetProgress =
      reduced || !active ? 0 : clamp((scrollY - start) / travel, 0, 1);
  }
  function updateLayout() {
    start = track.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, track.offsetHeight - sticky.offsetHeight);
    readScroll();
  }
  function updateCopy(progress) {
    const first = 1 - range(progress, 0.27, 0.47);
    const middle =
      range(progress, 0.33, 0.48) * (1 - range(progress, 0.68, 0.83));
    const end = range(progress, 0.91, 0.99);
    copy.style.opacity = first;
    copy.style.transform = `translate3d(0,${-progress * 55}px,0)`;
    copy.style.visibility = first < 0.02 ? "hidden" : "visible";
    impactCopy.style.opacity = middle;
    impactCopy.style.transform = `translate3d(0,${(1 - middle) * 30}px,0)`;
    outro.style.opacity = end;
    outro.style.transform = `translate3d(0,${(1 - end) * 28}px,0)`;
    outro.style.visibility = end < 0.02 ? "hidden" : "visible";
    // Inactive CTA must not remain reachable behind the foreground animation.
    copy.inert = first < 0.02;
    outro.inert = end < 0.02;
    flash.style.opacity = Math.max(
      0,
      (1 - Math.abs(progress - 0.49) / 0.016) * 0.1,
    );
    track.style.setProperty("--shot-progress", progress);
    track.dataset.progress = progress.toFixed(3);
    const phase =
      progress < 0.39
        ? "ready"
        : progress < 0.51
          ? "contact"
          : progress < 0.91
            ? "flight"
            : "finish";
    if (phase !== lastPhase) {
      lastPhase = phase;
      track.dataset.phase = phase;
      const labels = {
        ready: "01 / PREPARAÇÃO",
        contact: "02 / O CHUTE",
        flight: "03 / SEM LIMITES",
        finish: "04 / SEU JOGO",
      };
      document.querySelector("#film-phase").textContent = labels[phase];
      host.setAttribute(
        "aria-label",
        {
          ready: "Jogador digital Breno preparando o chute.",
          contact: "O jogador acerta a bola com a chuteira BRENO 10.",
          flight:
            "A bola avança em direção à câmera, como se estivesse saindo da tela.",
          finish: "Fim da jogada. Conheça a chuteira BRENO 10.",
        }[phase],
      );
    }
    document.querySelector("#film-percentage").textContent =
      `${String(Math.round(progress * 100)).padStart(2, "0")}%`;
    document.querySelector("#film-cue-label").textContent =
      reduced || !active
        ? "CONHEÇA A BRENO 10"
        : progress > 0.91
          ? "VOLTAR À JOGADA"
          : "ROLE PARA DAR O CHUTE";
  }
  function fallback(error) {
    if (error)
      console.warn(
        "A cena cinematográfica está usando a alternativa ilustrada.",
        error,
      );
    active = false;
    if (frame) cancelAnimationFrame(frame);
    track.classList.add("film-unavailable");
    document.querySelector("#film-loading").hidden = true;
    setStaticMode(true);
    updateCopy(0);
    updateLayout();
  }

  play.addEventListener("click", () => {
    if (reduced || !active) {
      document
        .querySelector("#produto")
        .scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      return;
    }
    if (paused) {
      paused = false;
      updateMotionUI();
    }
    window.scrollTo({
      top: currentProgress > 0.91 ? start : start + travel * 0.995,
      behavior: "smooth",
    });
  });
  toggle.addEventListener("click", () => {
    if (reduced || !active) return;
    paused = !paused;
    frozenProgress = currentProgress;
    updateMotionUI();
  });
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", updateLayout, { passive: true });
  motionPreference.addEventListener("change", () => {
    reduced = motionPreference.matches;
    setStaticMode(reduced || !active);
    updateLayout();
  });
  setStaticMode(reduced);

  try {
    const mobile = innerWidth < 761;
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.15 : 1.4));
    renderer.setClearColor(0x0f160f, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f160f, 0.037);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 75);
    const baseCamera = new THREE.Vector3(),
      lookTarget = new THREE.Vector3();
    scene.add(new THREE.HemisphereLight(0xe8efdf, 0x26351d, 1.25));
    const key = new THREE.DirectionalLight(0xfff4e6, 3.4);
    key.position.set(-3, 6, 5);
    key.castShadow = !mobile;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -5,
      right: 5,
      top: 6,
      bottom: -5,
      near: 0.1,
      far: 25,
    });
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd7f65b, 3.5);
    rim.position.set(2, 4, -4);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xbdcfb1, 0.85);
    fill.position.set(6, 2, 4);
    scene.add(fill);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({
        color: 0x101a11,
        roughness: 0.94,
        metalness: 0.04,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.014;
    floor.receiveShadow = true;
    scene.add(floor);
    const fieldOpacity = mobile ? 0.11 : 0.18;
    for (const x of [-5, -2.5, 0, 2.5, 5])
      line(
        scene,
        [
          [x, 0.006, -10],
          [x, 0.006, 14],
        ],
        0x7c9567,
        fieldOpacity,
      );
    for (const z of [-8, -4, 0, 4, 8, 12])
      line(
        scene,
        [
          [-12, 0.006, z],
          [12, 0.006, z],
        ],
        0x7c9567,
        fieldOpacity,
      );
    const circle = [];
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      circle.push([Math.cos(a) * 3.4, 0.008, Math.sin(a) * 3.4 - 1]);
    }
    line(scene, circle, 0xd7f65b, 0.16);
    line(
      scene,
      [
        [-5, 0.008, 3.8],
        [5, 0.008, 3.8],
      ],
      0xd7f65b,
      0.24,
    );
    const backdrop = new THREE.Group();
    scene.add(backdrop);
    for (const x of [1.8, 3.8, 5.8]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 5.5, 0.018),
        new THREE.MeshBasicMaterial({
          color: 0xb5d871,
          transparent: true,
          opacity: 0.18,
        }),
      );
      bar.position.set(x, 2.1, -4.6);
      bar.rotation.z = -0.28;
      backdrop.add(bar);
    }

    const athlete = createAthlete();
    scene.add(athlete.root);
    const origin = new THREE.Vector3();
    const ball = createFootball(0.285);
    scene.add(ball);
    ball.traverse((object) => {
      if (object.isMesh) object.material.transparent = true;
    });
    const ballOrigin = new THREE.Vector3(),
      controlA = new THREE.Vector3(),
      controlB = new THREE.Vector3(),
      endpoint = new THREE.Vector3();
    const forward = new THREE.Vector3(),
      work = new THREE.Vector3();
    const contactRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.33, 0.008, 6, 64),
      new THREE.MeshBasicMaterial({
        color: 0xd7f65b,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    contactRing.rotation.x = -Math.PI / 2;
    scene.add(contactRing);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({
        map: softShadow(),
        transparent: true,
        depthWrite: false,
        opacity: 0.8,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    const athleteShadow = shadow.clone();
    athleteShadow.material = shadow.material.clone();
    athleteShadow.scale.set(1.5, 1.9, 1);
    athleteShadow.position.set(0, 0.012, 0);
    scene.add(athleteShadow);

    const dustCount = 90;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities = [];
    for (let i = 0; i < dustCount; i++) {
      const angle = i * 2.399963;
      const strength = 0.35 + ((i * 17) % 31) / 31;
      dustVelocities.push(
        new THREE.Vector3(
          Math.cos(angle) * strength,
          0.15 + ((i * 13) % 23) / 28,
          Math.sin(angle) * strength,
        ),
      );
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(dustPositions, 3),
    );
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: 0xe1f9a7,
        size: 0.018,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    scene.add(dust);
    const trails = [];
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(28 * 3), 3),
      );
      const trail = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: i === 1 ? 0xf2f4e9 : 0xd7f65b,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      scene.add(trail);
      trails.push(trail);
    }
    function resize() {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const narrow = width < 761;
      renderer.setPixelRatio(Math.min(devicePixelRatio, narrow ? 1.15 : 1.4));
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.fov = narrow ? 49 : 35;
      camera.updateProjectionMatrix();
      origin.set(narrow ? 0.36 : 2.15, 0, -0.35);
      baseCamera.set(
        narrow ? 3.5 : 4.4,
        narrow ? 2.65 : 2.55,
        narrow ? 8.2 : 8.0,
      );
      lookTarget.set(narrow ? -0.25 : 0.12, narrow ? 2.1 : 1.5, 0);
      applyPose(athlete, 0.49, origin);
      athlete.kickingToe.getWorldPosition(ballOrigin);
      ballOrigin.add(new THREE.Vector3(0, -0.03, 0.23));
      contactRing.position.set(ballOrigin.x, 0.013, ballOrigin.z);
      athleteShadow.position.set(origin.x, 0.012, origin.z);
      updateLayout();
      lastPaint = -1;
    }
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(sticky);
    resize();
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      fallback();
    });
    renderer.domElement.addEventListener("webglcontextrestored", () => {
      active = true;
      track.classList.remove("film-unavailable");
      setStaticMode(reduced);
      resize();
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    });

    function render(progress) {
      applyPose(athlete, progress, origin);
      const cameraMove = range(progress, 0.28, 0.59);
      camera.position.set(
        lerp(baseCamera.x, baseCamera.x - 0.75, cameraMove),
        lerp(baseCamera.y, baseCamera.y + 0.13, cameraMove),
        lerp(baseCamera.z, baseCamera.z - 0.65, cameraMove),
      );
      camera.lookAt(lookTarget.x, lookTarget.y, lookTarget.z);
      camera.getWorldDirection(forward);
      const flight = clamp((progress - 0.49) / 0.45, 0, 1);
      controlA.copy(ballOrigin).add(new THREE.Vector3(-0.3, 1.6, 1.3));
      endpoint.copy(camera.position).addScaledVector(forward, -1.2);
      controlB
        .copy(camera.position)
        .addScaledVector(forward, 2.2)
        .add(new THREE.Vector3(0.38, 0.32, 0));
      cubic(ballOrigin, controlA, controlB, endpoint, flight, ball.position);
      ball.rotation.set(0.25 + flight * 10, -0.3 + flight * 5, flight * 2);
      ball.visible = progress < 0.955;
      const ballFade = 1 - range(progress, 0.925, 0.955);
      ball.traverse((object) => {
        if (object.isMesh) object.material.opacity = ballFade;
      });
      const burst = clamp((progress - 0.49) / 0.19, 0, 1);
      contactRing.scale.setScalar(1 + burst * 7);
      contactRing.material.opacity = progress < 0.49 ? 0 : (1 - burst) * 0.34;
      shadow.position.set(ball.position.x, 0.011, ball.position.z);
      shadow.material.opacity = 0.7 * (1 - range(progress, 0.49, 0.66));
      for (let i = 0; i < dustCount; i++) {
        const velocity = dustVelocities[i];
        dustPositions[i * 3] = ballOrigin.x + velocity.x * burst * 1.4;
        dustPositions[i * 3 + 1] = Math.max(
          0.025,
          0.06 + velocity.y * burst * 0.75 - burst * burst * 0.45,
        );
        dustPositions[i * 3 + 2] = ballOrigin.z + velocity.z * burst * 1.4;
      }
      dustGeometry.attributes.position.needsUpdate = true;
      dust.material.opacity =
        progress < 0.49 ? 0 : Math.sin(burst * Math.PI) * 0.75;
      for (let index = 0; index < trails.length; index++) {
        const trail = trails[index];
        const positions = trail.geometry.attributes.position.array;
        for (let j = 0; j < 28; j++) {
          const sample = Math.max(0, flight - (1 - j / 27) * 0.23);
          cubic(ballOrigin, controlA, controlB, endpoint, sample, work);
          work.x += (index - 1) * 0.025;
          work.y += index * 0.014;
          positions[j * 3] = work.x;
          positions[j * 3 + 1] = work.y;
          positions[j * 3 + 2] = work.z;
        }
        trail.geometry.attributes.position.needsUpdate = true;
        trail.material.opacity =
          range(progress, 0.51, 0.58) *
          (1 - range(progress, 0.86, 0.93)) *
          0.16;
      }
      // Lighting follows the ball only near the audience; the final pass clears the screen.
      track.dataset.ballDepth = ball.position
        .distanceTo(camera.position)
        .toFixed(3);
      renderer.render(scene, camera);
      updateCopy(progress);
    }
    function animate(time) {
      frame = requestAnimationFrame(animate);
      const elapsed = Math.min((time - lastTime) / 1000, 0.06);
      lastTime = time;
      if (!visible || document.hidden || !active) return;
      const target = reduced ? 0 : paused ? frozenProgress : targetProgress;
      currentProgress = lerp(
        currentProgress,
        target,
        1 - Math.exp(-elapsed * 13),
      );
      if (Math.abs(currentProgress - target) < 0.0004) currentProgress = target;
      const changed = Math.abs(currentProgress - lastPaint) > 0.00005;
      if (!changed && track.classList.contains("film-ready")) return;
      lastPaint = currentProgress;
      render(currentProgress);
      track.classList.add("film-ready");
      document.querySelector("#film-loading").hidden = true;
    }
    render(0);
    track.classList.add("film-ready");
    document.querySelector("#film-loading").hidden = true;
    frame = requestAnimationFrame(animate);
  } catch (error) {
    if (renderer) {
      renderer.dispose();
      host.replaceChildren();
    }
    if (resizeObserver) resizeObserver.disconnect();
    if (intersectionObserver) intersectionObserver.disconnect();
    fallback(error);
  }
}
