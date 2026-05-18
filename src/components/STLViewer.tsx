import * as THREE from 'three';
import React, { Suspense, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { STLLoader } from 'three-stdlib';
import { OrbitControls, Center, Stage, Float } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

interface STLModelProps {
  url: string;
}

const Primitive = 'primitive' as any;

const STLModel: React.FC<STLModelProps> = ({ url }) => {
  const geometry = useLoader(STLLoader, url);
  
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#4169E1",
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 1,
    reflectivity: 1,
  }), []);

  return <Primitive object={new THREE.Mesh(geometry, material)} />;
};

interface STLViewerProps {
  url: string;
}

export const STLViewer: React.FC<STLViewerProps> = ({ url }) => {
  return (
    <div className="w-full h-full relative bg-navy/40 rounded-[32px] overflow-hidden">
      <Suspense fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Rendering 3D Model...</p>
        </div>
      }>
        <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
          <Stage environment="city" intensity={0.5}>
            <Center>
              <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <STLModel url={url} />
              </Float>
            </Center>
          </Stage>
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={5} 
            maxDistance={20} 
            autoRotate 
            autoRotateSpeed={1} 
          />
        </Canvas>
      </Suspense>
      
      <div className="absolute bottom-6 right-6 px-4 py-2 bg-navy/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-royal animate-pulse shadow-[0_0_10px_rgba(65,105,225,0.8)]" />
        <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">Interactive 3D Viewer</span>
      </div>
    </div>
  );
};
