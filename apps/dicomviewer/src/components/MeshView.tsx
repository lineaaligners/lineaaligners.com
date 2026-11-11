import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { colorOf, meshUrl, type AiResult } from '../lib/ai';

/** Surface models of the segmented structures. `version` changes when the labels were edited and saved. */
export default function MeshView({ result, visible, opacity, version }: { result: AiResult; visible: number[]; opacity: number; version: number }) {
  const host = useRef<HTMLDivElement>(null);
  const three = useRef<{ scene: THREE.Scene; render: () => void; meshes: Map<number, THREE.Object3D>; frame: () => void; framed: boolean } | null>(null);

  useEffect(() => {
    const el = host.current!, scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio); renderer.setClearColor(0x05080a); el.appendChild(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000); camera.up.set(0, 0, 1); // patient axes: +z is up
    const controls = new OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4); scene.add(key);
    const render = () => { key.position.copy(camera.position); renderer.render(scene, camera); };
    controls.addEventListener('change', render);
    const size = () => { const r = el.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'; camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); render(); };
    const ro = new ResizeObserver(size); ro.observe(el);
    const state = { scene, render, meshes: new Map<number, THREE.Object3D>(), framed: false, frame: () => {
      const box = new THREE.Box3(); for (const m of state.meshes.values()) box.expandByObject(m);
      if (box.isEmpty()) return;
      const c = box.getCenter(new THREE.Vector3()), d = box.getSize(new THREE.Vector3()).length();
      controls.target.copy(c); camera.position.set(c.x, c.y - d * 1.7, c.z + d * 0.25); // from the front: anterior is -y
      camera.near = d / 100; camera.far = d * 10; camera.updateProjectionMatrix(); controls.update(); render();
    } };
    three.current = state; size();
    return () => { ro.disconnect(); controls.dispose(); renderer.dispose(); el.removeChild(renderer.domElement); three.current = null; };
  }, []);

  // meshes are rebuilt by the backend after an edit, so drop the old ones
  useEffect(() => { const t = three.current; if (!t) return; for (const m of t.meshes.values()) t.scene.remove(m); t.meshes.clear(); t.framed = false; }, [result.jobId, version]);

  useEffect(() => {
    const t = three.current; if (!t) return;
    let dead = false;
    for (const [label, m] of t.meshes) m.visible = visible.includes(label);
    const loader = new GLTFLoader();
    (async () => {
      for (const label of visible) {
        if (t.meshes.has(label) || dead) continue;
        try {
          const gltf = await loader.loadAsync(meshUrl(result, label) + `?v=${version}`);
          if (dead) return;
          const [r, g, b] = colorOf(label);
          gltf.scene.traverse(o => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.geometry.computeVertexNormals(); mesh.material = new THREE.MeshStandardMaterial({ color: new THREE.Color(r / 255, g / 255, b / 255), roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }); } });
          t.meshes.set(label, gltf.scene); t.scene.add(gltf.scene);
          if (!t.framed) { t.frame(); } else t.render();
        } catch { /* empty structure: nothing to show */ }
      }
      if (!dead && t.meshes.size) { t.framed = true; t.frame(); }
    })();
    t.render();
    return () => { dead = true; };
  }, [result, visible, version]);

  useEffect(() => {
    const t = three.current; if (!t) return;
    for (const [label, m] of t.meshes) m.traverse(o => { const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (mat) { const a = label <= 2 ? opacity : 1; mat.transparent = a < 1; mat.opacity = a; mat.depthWrite = a >= 1; } });
    t.render();
  }, [opacity, visible, version]);

  return <div ref={host} data-mesh className="absolute inset-0 z-[3]" />;
}
