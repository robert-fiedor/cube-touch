import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const defaultLoomisParams = {
  craniumRadius: 1,
  craniumScaleX: 0.9,
  craniumScaleY: 1,
  craniumScaleZ: 0.95,
  sidePlaneOffsetX: 0.58,
  sidePlaneRadiusY: 0.72,
  sidePlaneRadiusZ: 0.52,
  faceHeight: 1.55,
  jawWidthTop: 1.05,
  jawWidthBottom: 0.45,
  jawDepth: 0.7,
  chinY: -1.45,
  hairlineY: 0.45,
  browY: 0,
  noseY: -0.48,
  chinLineY: -1.45,
  showCranium: true,
  showSidePlanes: true,
  showCenterLine: true,
  showBrowLine: true,
  showThirds: true,
  showJaw: true,
  showNeck: false,
};

const toggleMap = [
  ["showCranium", "Cranium"],
  ["showSidePlanes", "Side planes"],
  ["showCenterLine", "Center line"],
  ["showBrowLine", "Brow line"],
  ["showThirds", "Thirds"],
  ["showJaw", "Jaw"],
  ["showNeck", "Neck"],
];

const sliderConfig = [
  ["craniumScaleX", "Width", 0.65, 1.2, 0.01],
  ["craniumScaleY", "Height", 0.75, 1.25, 0.01],
  ["craniumScaleZ", "Depth", 0.65, 1.2, 0.01],
  ["sidePlaneOffsetX", "Side offset", 0.35, 0.82, 0.01],
  ["jawWidthTop", "Jaw top", 0.75, 1.35, 0.01],
  ["jawWidthBottom", "Chin width", 0.25, 0.75, 0.01],
  ["jawDepth", "Jaw depth", 0.35, 1.0, 0.01],
  ["chinY", "Chin", -1.8, -1.15, 0.01],
  ["hairlineY", "Hairline", 0.2, 0.7, 0.01],
  ["noseY", "Nose", -0.75, -0.25, 0.01],
];

class LoomisHeadBuilder {
  constructor(params = {}) {
    this.params = { ...defaultLoomisParams, ...params };
    this.materials = {
      cranium: new THREE.MeshStandardMaterial({
        color: 0xdfe5ea,
        transparent: true,
        opacity: 0.42,
        roughness: 0.74,
        metalness: 0.02,
        depthWrite: false,
      }),
      sidePlane: new THREE.MeshStandardMaterial({
        color: 0xc4ccd5,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true,
      }),
      sidePlaneGhost: new THREE.MeshBasicMaterial({
        color: 0xaeb8c1,
        transparent: true,
        opacity: 0.07,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
      }),
      jaw: new THREE.MeshStandardMaterial({
        color: 0xd7dde3,
        transparent: true,
        opacity: 0.48,
        roughness: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      neck: new THREE.MeshStandardMaterial({
        color: 0xe7ebef,
        transparent: true,
        opacity: 0.38,
        roughness: 0.8,
      }),
      occluder: new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: true,
        depthTest: true,
      }),
      line: new THREE.MeshBasicMaterial({ color: 0x11181d, depthTest: true, depthWrite: false }),
      lineSoft: new THREE.MeshBasicMaterial({ color: 0x33414d, depthTest: true, depthWrite: false }),
      lineAccent: new THREE.MeshBasicMaterial({ color: 0x0f6bff, depthTest: true, depthWrite: false }),
    };
  }

  setParams(params) {
    this.params = { ...this.params, ...params };
  }

  build() {
    const group = new THREE.Group();
    group.name = "LoomisHead";

    if (this.params.showCranium) group.add(this.buildCraniumOccluder());
    if (this.params.showCranium) group.add(this.buildCranium());
    if (this.params.showSidePlanes) group.add(this.buildSidePlanes());
    if (this.params.showJaw) group.add(this.buildJaw());
    if (this.params.showNeck) group.add(this.buildNeck());
    group.add(this.buildGuideLines());

    return group;
  }

  buildCranium() {
    const p = this.params;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.craniumRadius, 64, 36),
      this.materials.cranium,
    );
    mesh.scale.set(p.craniumScaleX, p.craniumScaleY, p.craniumScaleZ);
    mesh.renderOrder = 1;
    return mesh;
  }

  buildCraniumOccluder() {
    const p = this.params;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(p.craniumRadius, 64, 36),
      this.materials.occluder,
    );
    mesh.scale.set(p.craniumScaleX, p.craniumScaleY, p.craniumScaleZ);
    mesh.renderOrder = 0;
    return mesh;
  }

  buildSidePlanes() {
    const p = this.params;
    const group = new THREE.Group();
    const segments = 72;

    [-1, 1].forEach((side) => {
      const discGeometry = new THREE.CircleGeometry(1, segments);
      const ghostDisc = new THREE.Mesh(discGeometry.clone(), this.materials.sidePlaneGhost);
      ghostDisc.position.x = side * p.sidePlaneOffsetX;
      ghostDisc.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      ghostDisc.scale.set(p.sidePlaneRadiusZ, p.sidePlaneRadiusY, 1);
      ghostDisc.renderOrder = 4;
      group.add(ghostDisc);

      const disc = new THREE.Mesh(discGeometry, this.materials.sidePlane);
      disc.position.x = side * p.sidePlaneOffsetX;
      disc.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      disc.scale.set(p.sidePlaneRadiusZ, p.sidePlaneRadiusY, 1);
      disc.renderOrder = 3;
      group.add(disc);

      group.add(this.tube(this.ovalPoints(side * p.sidePlaneOffsetX, p.sidePlaneRadiusY, p.sidePlaneRadiusZ, side), 0.01, this.materials.lineSoft));
      group.add(this.tube([
        new THREE.Vector3(side * p.sidePlaneOffsetX, -p.sidePlaneRadiusY, 0.004 * side),
        new THREE.Vector3(side * p.sidePlaneOffsetX, p.sidePlaneRadiusY, 0.004 * side),
      ], 0.007, this.materials.lineSoft));
      group.add(this.tube([
        new THREE.Vector3(side * p.sidePlaneOffsetX, p.browY, -p.sidePlaneRadiusZ),
        new THREE.Vector3(side * p.sidePlaneOffsetX, p.browY, p.sidePlaneRadiusZ),
      ], 0.009, this.materials.line));
    });

    return group;
  }

  buildGuideLines() {
    const p = this.params;
    const group = new THREE.Group();

    if (p.showBrowLine) {
      group.add(this.tube(this.horizontalWrapPoints(p.browY, 1.02, true), 0.013, this.materials.lineAccent));
    }

    if (p.showCenterLine) {
      group.add(this.tube(this.centerLinePoints(), 0.012, this.materials.line));
    }

    if (p.showThirds) {
      [
        [p.hairlineY, this.materials.lineSoft],
        [p.noseY, this.materials.lineSoft],
        [p.chinLineY, this.materials.lineSoft],
      ].forEach(([y, material]) => {
        group.add(this.tube(this.horizontalWrapPoints(y, 0.62, false), 0.009, material));
      });

      group.add(this.tube([
        new THREE.Vector3(-p.jawWidthTop / 2, -0.18, 0.405),
        new THREE.Vector3(-p.jawWidthBottom / 2, p.chinY, 0.43),
      ], 0.009, this.materials.lineSoft));
      group.add(this.tube([
        new THREE.Vector3(p.jawWidthTop / 2, -0.18, 0.405),
        new THREE.Vector3(p.jawWidthBottom / 2, p.chinY, 0.43),
      ], 0.009, this.materials.lineSoft));
    }

    return group;
  }

  buildJaw() {
    const p = this.params;
    const topY = -0.15;
    const frontZ = 0.38;
    const backZ = frontZ - p.jawDepth;
    const vertices = [
      [-p.jawWidthTop / 2, topY, frontZ],
      [p.jawWidthTop / 2, topY, frontZ],
      [-p.jawWidthBottom / 2, p.chinY, frontZ + 0.03],
      [p.jawWidthBottom / 2, p.chinY, frontZ + 0.03],
      [-p.jawWidthTop / 2, topY, backZ],
      [p.jawWidthTop / 2, topY, backZ],
      [-p.jawWidthBottom / 2, p.chinY, backZ + 0.13],
      [p.jawWidthBottom / 2, p.chinY, backZ + 0.13],
    ];
    const indices = [
      0, 2, 1, 1, 2, 3,
      4, 5, 6, 5, 7, 6,
      0, 4, 2, 4, 6, 2,
      1, 3, 5, 5, 3, 7,
      0, 1, 4, 1, 5, 4,
      2, 6, 3, 3, 6, 7,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices.flat(), 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const group = new THREE.Group();
    const occluder = new THREE.Mesh(geometry.clone(), this.materials.occluder);
    occluder.renderOrder = 0;
    group.add(occluder);

    const mesh = new THREE.Mesh(geometry, this.materials.jaw);
    mesh.renderOrder = 1;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x172026, transparent: true, opacity: 0.5, depthTest: true, depthWrite: false }),
    );
    edges.renderOrder = 5;
    mesh.add(edges);
    group.add(mesh);
    return group;
  }

  buildNeck() {
    const p = this.params;
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, 0.9, 20),
      this.materials.neck,
    );
    neck.position.set(0, p.chinY - 0.46, -0.06);
    return neck;
  }

  toJSON() {
    const p = this.params;
    return {
      type: "loomis-head",
      version: "1.0",
      params: {
        craniumRadius: p.craniumRadius,
        craniumScaleX: p.craniumScaleX,
        craniumScaleY: p.craniumScaleY,
        craniumScaleZ: p.craniumScaleZ,
        sidePlaneOffsetX: p.sidePlaneOffsetX,
        sidePlaneRadiusY: p.sidePlaneRadiusY,
        sidePlaneRadiusZ: p.sidePlaneRadiusZ,
        faceHeight: p.faceHeight,
        jawWidthTop: p.jawWidthTop,
        jawWidthBottom: p.jawWidthBottom,
        jawDepth: p.jawDepth,
        chinY: p.chinY,
        hairlineY: p.hairlineY,
        browY: p.browY,
        noseY: p.noseY,
        chinLineY: p.chinLineY,
      },
      visibility: {
        cranium: p.showCranium,
        sidePlanes: p.showSidePlanes,
        centerLine: p.showCenterLine,
        browLine: p.showBrowLine,
        thirds: p.showThirds,
        jaw: p.showJaw,
        neck: p.showNeck,
      },
    };
  }

  fromJSON(preset) {
    const visibility = preset.visibility || {};
    this.setParams({
      ...(preset.params || {}),
      showCranium: visibility.cranium ?? this.params.showCranium,
      showSidePlanes: visibility.sidePlanes ?? this.params.showSidePlanes,
      showCenterLine: visibility.centerLine ?? this.params.showCenterLine,
      showBrowLine: visibility.browLine ?? this.params.showBrowLine,
      showThirds: visibility.thirds ?? this.params.showThirds,
      showJaw: visibility.jaw ?? this.params.showJaw,
      showNeck: visibility.neck ?? this.params.showNeck,
    });
  }

  horizontalWrapPoints(y, widthScale, fullWrap) {
    const p = this.params;
    const points = [];
    const xRadius = p.craniumScaleX * p.craniumRadius * widthScale;
    const yRatio = THREE.MathUtils.clamp(Math.abs(y) / (p.craniumScaleY * p.craniumRadius), 0, 0.98);
    const zRadius = p.craniumScaleZ * p.craniumRadius * Math.sqrt(1 - yRatio * yRatio);
    const start = fullWrap ? 0 : Math.PI * 0.17;
    const end = fullWrap ? Math.PI * 2 : Math.PI * 0.83;
    const steps = fullWrap ? 96 : 44;

    for (let i = 0; i <= steps; i += 1) {
      const t = start + ((end - start) * i) / steps;
      points.push(new THREE.Vector3(Math.cos(t) * xRadius, y, Math.sin(t) * zRadius + 0.02));
    }
    return points;
  }

  centerLinePoints() {
    const p = this.params;
    const points = [];
    const top = p.craniumScaleY * p.craniumRadius * 0.96;
    const bottom = p.chinY;
    const steps = 66;

    for (let i = 0; i <= steps; i += 1) {
      const y = top + ((bottom - top) * i) / steps;
      let z = 0.42;
      if (y >= -0.2) {
        const yRatio = THREE.MathUtils.clamp(Math.abs(y) / (p.craniumScaleY * p.craniumRadius), 0, 0.98);
        z = p.craniumScaleZ * p.craniumRadius * Math.sqrt(1 - yRatio * yRatio) + 0.025;
      }
      points.push(new THREE.Vector3(0, y, z));
    }
    return points;
  }

  ovalPoints(x, radiusY, radiusZ, side) {
    const points = [];
    for (let i = 0; i <= 96; i += 1) {
      const t = (Math.PI * 2 * i) / 96;
      points.push(new THREE.Vector3(x + 0.004 * side, Math.sin(t) * radiusY, Math.cos(t) * radiusZ));
    }
    return points;
  }

  tube(points, radius, material) {
    const curve = points.length === 2
      ? new THREE.LineCurve3(points[0], points[1])
      : new THREE.CatmullRomCurve3(points, false, "centripetal");
    const geometry = new THREE.TubeGeometry(curve, Math.max(2, points.length * 2), radius, 8, false);
    const group = new THREE.Group();
    const ghostMaterial = material.clone();
    ghostMaterial.transparent = true;
    ghostMaterial.opacity = 0.12;
    ghostMaterial.depthTest = false;
    ghostMaterial.depthWrite = false;

    const ghost = new THREE.Mesh(geometry.clone(), ghostMaterial);
    ghost.renderOrder = 4;
    group.add(ghost);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 6;
    group.add(mesh);
    return group;
  }
}

const canvas = document.querySelector("#scene");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.25, 7.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = true;
controls.enableZoom = true;
controls.minDistance = 3.2;
controls.maxDistance = 11;
controls.target.set(0, -0.25, 0.1);

scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e1e8, 2.1));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(2.8, 4.4, 4.2);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.85);
fillLight.position.set(-3.4, 1.5, -2.5);
scene.add(fillLight);

const builder = new LoomisHeadBuilder();
let head = builder.build();
scene.add(head);

const toggles = document.querySelector("#toggles");
const sliders = document.querySelector("#sliders");
const presetJson = document.querySelector("#presetJson");
const exportButton = document.querySelector("#exportJson");
const importButton = document.querySelector("#importJson");

function rebuild() {
  scene.remove(head);
  disposeObject(head);
  head = builder.build();
  scene.add(head);
  syncJson();
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
  });
}

function syncJson() {
  presetJson.value = JSON.stringify(builder.toJSON(), null, 2);
}

function buildControls() {
  toggleMap.forEach(([key, label]) => {
    const wrapper = document.createElement("label");
    wrapper.className = "toggle";
    wrapper.innerHTML = `<input type="checkbox" data-param="${key}"> <span>${label}</span>`;
    const input = wrapper.querySelector("input");
    input.checked = builder.params[key];
    input.addEventListener("change", () => {
      builder.setParams({ [key]: input.checked });
      rebuild();
    });
    toggles.append(wrapper);
  });

  sliderConfig.forEach(([key, label, min, max, step]) => {
    const row = document.createElement("label");
    row.className = "slider-row";
    row.innerHTML = `
      <span>${label}</span>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${builder.params[key]}" data-param="${key}">
      <output>${Number(builder.params[key]).toFixed(2)}</output>
    `;
    const input = row.querySelector("input");
    const output = row.querySelector("output");
    input.addEventListener("input", () => {
      const value = Number(input.value);
      builder.setParams({ [key]: value });
      if (key === "chinY") builder.setParams({ chinLineY: value });
      output.value = value.toFixed(2);
      output.textContent = value.toFixed(2);
      rebuild();
    });
    sliders.append(row);
  });
}

function syncControlsFromParams() {
  document.querySelectorAll("[data-param]").forEach((input) => {
    const key = input.dataset.param;
    if (input.type === "checkbox") {
      input.checked = builder.params[key];
    } else {
      input.value = builder.params[key];
      const output = input.parentElement.querySelector("output");
      if (output) output.textContent = Number(builder.params[key]).toFixed(2);
    }
  });
}

function setView(view) {
  const radius = 7.2;
  const positions = {
    front: [0, 0.05, radius],
    left: [-radius, 0.05, 0],
    right: [radius, 0.05, 0],
    threeQuarterLeft: [-5.1, 0.45, 5.1],
    threeQuarterRight: [5.1, 0.45, 5.1],
    top: [0, radius, 0.02],
    bottom: [0, -radius, 0.02],
    reset: [0, 0.25, radius],
  };
  camera.position.set(...positions[view]);
  controls.target.set(0, -0.25, 0.1);
  controls.update();
  document.querySelectorAll("#viewButtons button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
}

document.querySelector("#viewButtons").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]");
  if (!button) return;
  setView(button.dataset.view);
});

exportButton.addEventListener("click", syncJson);

importButton.addEventListener("click", () => {
  try {
    const preset = JSON.parse(presetJson.value);
    if (preset.type !== "loomis-head") {
      throw new Error("Preset type must be loomis-head.");
    }
    builder.fromJSON(preset);
    syncControlsFromParams();
    rebuild();
  } catch (error) {
    presetJson.value = `${presetJson.value}\n\nImport error: ${error.message}`;
  }
});

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

buildControls();
syncJson();
setView("threeQuarterRight");
resize();
window.addEventListener("resize", resize);
animate();

window.LoomisHeadBuilder = LoomisHeadBuilder;
