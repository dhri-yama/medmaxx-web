"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Object3D,
  Quaternion,
  ShaderMaterial,
  SkinnedMesh,
  Vector3,
  type Bone,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const FOV = 30;

// Many small dots read as a solid form; phones get fewer so they stay smooth.
const dotsForScreen = () => (typeof window !== "undefined" && window.innerWidth < 860 ? 26000 : 52000);

/* ---------- dot material: round, lit, dimmer on the far side so the form reads ---------- */

const vertexShader = /* glsl */ `
  attribute float aPhase;
  uniform float uSize;
  uniform float uPx;
  uniform float uTime;
  uniform float uShimmer;
  varying float vLight;
  varying float vBack;
  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec3 lightDir = normalize(vec3(0.5, 0.8, 0.7));
    float diffuse = max(dot(n, lightDir), 0.0);
    float rim = pow(1.0 - max(n.z, 0.0), 2.0);
    vLight = 0.3 + 0.7 * diffuse + 0.35 * rim;
    vBack = step(n.z, 0.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float pulse = 1.0 + uShimmer * 0.25 * sin(uTime * 1.6 + aPhase * 6.2831);
    gl_PointSize = max(uSize * pulse * uPx / -mv.z, 1.2);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vLight;
  varying float vBack;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float edge = smoothstep(0.5, 0.32, r);
    float alpha = edge * mix(1.0, 0.22, vBack);
    gl_FragColor = vec4(uColor * vLight, alpha);
  }
`;

function makeDotMaterial(color: string) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new Color(color) },
      uSize: { value: 0.016 },
      uPx: { value: 800 },
      uTime: { value: 0 },
      uShimmer: { value: 1 },
    },
  });
}

type Materials = { bone: ShaderMaterial; steel: ShaderMaterial };
const MaterialsContext = createContext<Materials | null>(null);
function useMaterials() {
  const m = useContext(MaterialsContext);
  if (!m) throw new Error("MaterialsContext missing");
  return m;
}

/* ---------- the real hand model, drawn as dots and animated through its skeleton ---------- */

type Rig = {
  geometry: BufferGeometry;
  step: (t: number, motion: boolean) => void;
};

function buildRig(root: Object3D, count: number): Rig | null {
  let skinned: SkinnedMesh | null = null;
  root.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh) skinned = o as SkinnedMesh;
  });
  const mesh = skinned as SkinnedMesh | null;
  if (!mesh) return null;

  root.updateMatrixWorld(true);
  mesh.skeleton.update();

  const bones: Record<string, Bone> = {};
  mesh.skeleton.bones.forEach((b) => (bones[b.name] = b));

  // Orient the hand so the fingers point along +x with the wrist at the origin, and size it.
  const wrist = new Vector3();
  const tip = new Vector3();
  (bones["wristB_C2_0_skin"] ?? bones["arm_C0_0_skin"]).getWorldPosition(wrist);
  (bones["finger_L1_2_skin"] ?? bones["finger_L1_1_skin"]).getWorldPosition(tip);
  const along = tip.clone().sub(wrist);
  const reach = along.length();
  const orient = new Quaternion().setFromUnitVectors(along.normalize(), new Vector3(1, 0, 0));
  const scale = 1.9 / reach;

  // Choose which mesh vertices become dots.
  const geo = mesh.geometry;
  const total = geo.attributes.position.count;
  const picks = new Uint32Array(count);
  for (let i = 0; i < count; i++) picks[i] = Math.floor(Math.random() * total);

  const normal = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const n = new Vector3();
  const restNormals = geo.attributes.normal;
  for (let i = 0; i < count; i++) {
    n.set(restNormals.getX(picks[i]), restNormals.getY(picks[i]), restNormals.getZ(picks[i]));
    n.transformDirection(mesh.matrixWorld).applyQuaternion(orient);
    normal.set([n.x, n.y, n.z], i * 3);
    phase[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  const positionAttr = new Float32BufferAttribute(new Float32Array(count * 3), 3);
  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("normal", new Float32BufferAttribute(normal, 3));
  geometry.setAttribute("aPhase", new Float32BufferAttribute(phase, 1));

  // Bones that curl: four fingers and the thumb, three joints each.
  const curlers: { bone: Bone; rest: Quaternion; base: number; amp: number; phase: number }[] = [];
  for (let f = 0; f < 4; f++) {
    for (let j = 0; j < 3; j++) {
      const bone = bones[`finger_L${f}_${j}_skin`];
      if (bone) {
        curlers.push({
          bone,
          rest: bone.quaternion.clone(),
          base: 0.1 + j * 0.12,
          amp: 0.1 + j * 0.08,
          phase: f * 0.7,
        });
      }
    }
  }
  for (let j = 0; j < 3; j++) {
    const bone = bones[`thumb_L0_${j}_skin`];
    if (bone) {
      curlers.push({ bone, rest: bone.quaternion.clone(), base: 0.05 + j * 0.08, amp: 0.08, phase: 2.8 });
    }
  }

  const tmp = new Quaternion();
  const axis = new Vector3(0, 0, 1);
  const p = new Vector3();

  const step = (t: number, motion: boolean) => {
    for (const c of curlers) {
      const wave = motion ? Math.sin(t * 0.9 + c.phase) : 0;
      tmp.setFromAxisAngle(axis, c.base + c.amp * wave);
      c.bone.quaternion.copy(c.rest).multiply(tmp);
    }
    root.updateMatrixWorld(true);
    mesh.skeleton.update();
    // The attribute owns its own array, so write into that one.
    const out = positionAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      mesh.getVertexPosition(picks[i], p);
      p.applyMatrix4(mesh.matrixWorld).sub(wrist).applyQuaternion(orient).multiplyScalar(scale);
      out[i * 3] = p.x;
      out[i * 3 + 1] = p.y;
      out[i * 3 + 2] = p.z;
    }
    positionAttr.needsUpdate = true;
  };

  step(0, false);
  return { geometry, step };
}

function useHandRig() {
  const { gl } = useThree();
  const [rig, setRig] = useState<Rig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ktx2 = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl);
    const loader = new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      "/models/hand.glb",
      (gltf) => {
        if (!cancelled) setRig(buildRig(gltf.scene, dotsForScreen()));
        ktx2.dispose();
      },
      undefined,
      (err) => console.warn("Hand model failed to load", err),
    );
    return () => {
      cancelled = true;
    };
  }, [gl]);

  return rig;
}

function Hand({ rig }: { rig: Rig | null }) {
  const materials = useMaterials();
  if (!rig) return null;
  return <points geometry={rig.geometry} material={materials.bone} frustumCulled={false} />;
}

/* ---------- ambient drifting dust ---------- */

function Dust({ motion }: { motion: boolean }) {
  const materials = useMaterials();
  const { viewport } = useThree();
  const ref = useRef<Group>(null);
  const geometry = useMemo(() => {
    const count = 450;
    const position = new Float32Array(count * 3);
    const normal = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      position.set([(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 11, -3 - Math.random() * 4], i * 3);
      normal.set([0, 0, 1], i * 3);
      phase[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(position, 3));
    g.setAttribute("normal", new Float32BufferAttribute(normal, 3));
    g.setAttribute("aPhase", new Float32BufferAttribute(phase, 1));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current && motion) {
      ref.current.rotation.z = clock.elapsedTime * 0.01;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <group ref={ref} scale={Math.max(1, viewport.width / 10)}>
      <points geometry={geometry} material={materials.steel} />
    </group>
  );
}

/* ---------- placing the two hands, each aimed at the form ---------- */

// Bigger hands on wide screens, still sensible on phones.
const handScale = (viewportWidth: number) => Math.min(Math.max(viewportWidth * 0.112, 0.45), 1.3);

function Sculptures({ motion }: { motion: boolean }) {
  const { viewport, gl } = useThree();
  const rig = useHandRig();
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: -0.08 * viewport.height });
  const frame = useRef(0);
  const scale = handScale(viewport.width);

  // Aim at the centre of the form card, wherever the layout puts it.
  useEffect(() => {
    const aim = () => {
      const card = document.querySelector(".card")?.getBoundingClientRect();
      const canvas = gl.domElement.getBoundingClientRect();
      if (!card || !canvas.width || !canvas.height) return;
      const fx = (card.left + card.width / 2 - canvas.left) / canvas.width;
      const fy = (card.top + card.height / 2 - canvas.top) / canvas.height;
      target.current.x = (fx - 0.5) * viewport.width;
      target.current.y = (0.5 - fy) * viewport.height;
    };
    aim();
    const later = window.setTimeout(aim, 1600); // after the card has finished animating in
    window.addEventListener("resize", aim);
    return () => {
      window.clearTimeout(later);
      window.removeEventListener("resize", aim);
    };
  }, [gl, viewport.width, viewport.height]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const amount = motion ? 1 : 0;
    const { x, y } = pointer.current;
    const W = viewport.width;
    const H = viewport.height;

    // Re-pose the skeleton every third frame; the dots follow the bones.
    if (rig && motion && frame.current++ % 3 === 0) rig.step(t, motion);

    // Each forearm is anchored so its cut end sits past the screen corner and never shows.
    // The wrist is then placed along the line from that hidden end toward the form.
    const ARM = 1.85 * scale; // wrist to the end of the forearm, with a little extra
    const hide = 0.8 * scale; // how far past the edge the cut end sits
    const place = (group: Group | null, sx: number, sy: number, tilt: number, bobPhase: number) => {
      if (!group) return;
      const ex = sx * (W / 2 + hide);
      const ey = sy * (H / 2 + hide);
      const a = Math.atan2(target.current.y - ey, target.current.x - ex);
      group.position.set(
        ex + Math.cos(a) * ARM,
        ey + Math.sin(a) * ARM + Math.sin(t * 0.6 + bobPhase) * 0.06 * amount,
        0,
      );
      group.rotation.set(tilt * y * 0.05 * amount, x * 0.1 * amount, a);
    };
    place(left.current, -1, -1, 1, 0);
    place(right.current, 1, 1, -1, 2);
  });

  return (
    <>
      <group ref={left} scale={scale}>
        <Hand rig={rig} />
      </group>
      <group ref={right} scale={scale}>
        <Hand rig={rig} />
      </group>
    </>
  );
}

/* ---------- keeps the shared dot materials in step with time and canvas size ---------- */

function Driver({ materials, motion }: { materials: Materials; motion: boolean }) {
  const { size, gl } = useThree();

  useFrame(({ clock }) => {
    const px = (size.height * gl.getPixelRatio()) / (2 * Math.tan((FOV * Math.PI) / 360));
    for (const m of Object.values(materials)) {
      m.uniforms.uPx.value = px;
      m.uniforms.uTime.value = clock.elapsedTime;
      m.uniforms.uShimmer.value = motion ? 1 : 0;
    }
    materials.bone.uniforms.uSize.value = 0.014; // smaller dots, packed more densely
    materials.steel.uniforms.uSize.value = 0.028;
  });
  return null;
}

export default function HandsScene() {
  const materials = useMemo<Materials>(
    () => ({
      bone: makeDotMaterial("#f2efe9"),
      steel: makeDotMaterial("#8da1b2"),
    }),
    [],
  );
  const motion = useMemo(
    () => typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 12], fov: FOV }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <MaterialsContext.Provider value={materials}>
        <Driver materials={materials} motion={motion} />
        <Dust motion={motion} />
        <Sculptures motion={motion} />
      </MaterialsContext.Provider>
    </Canvas>
  );
}
