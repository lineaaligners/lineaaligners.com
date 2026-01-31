import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Center } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// Fix: Define capitalized aliases for Three.js intrinsic elements to resolve JSX type errors in environments where they aren't globally registered
const Mesh = 'mesh' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const Primitive = 'primitive' as any;
const Color = 'color' as any;

interface ModelProps {
  url: string;
  extension: string;
}

const Model: React.FC<ModelProps> = ({ url, extension }) => {
  const isSTL = extension.toLowerCase().includes('stl');
  const loader = isSTL ? STLLoader : OBJLoader;
  const result = useLoader(loader, url);

  if (isSTL) {
    return (
      /* Fix: Using capitalized Mesh alias */
      <Mesh geometry={result as THREE.BufferGeometry}>
        <MeshStandardMaterial 
          color="#a78bfa" 
          roughness={0.2} 
          metalness={0.7} 
          side={THREE.DoubleSide} 
        />
      </Mesh>
    );
  }

  // OBJLoader returns a Group/Object3D
  /* Fix: Using capitalized Primitive alias */
  return <Primitive object={result} />;
};

export const ModelViewer: React.FC<ModelProps> = ({ url, extension }) => {
  return (
    <div className="w-full h-full min-h-[350px] bg-slate-900 rounded-3xl overflow-hidden relative group border border-purple-500/30">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        {/* Fix: Using capitalized Color alias for scene background */}
        <Color attach="background" args={['#0f172a']} />
        <Suspense fallback={null}>
          <Stage 
            environment="city" 
            intensity={0.6} 
            adjustCamera={1.2}
            contactShadow={{ opacity: 0.5, blur: 3 }}
          >
            <Center>
              <Model url={url} extension={extension} />
            </Center>
          </Stage>
        </Suspense>
        <OrbitControls 
          makeDefault 
          autoRotate={false}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
      
      <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-white/70 text-[10px] uppercase tracking-widest font-bold pointer-events-none">
        3D Preview Mode
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Drag to Rotate • Scroll to Zoom
      </div>
    </div>
  );
};