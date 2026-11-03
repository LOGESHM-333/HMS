/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  AnatomicalSystem, 
  AnatomicalHotspot, 
  Patient, 
  ThemeMode 
} from '../../types';
import { sound } from '../../services/audioService';
import { 
  Heart, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Activity, 
  Eye, 
  Radio, 
  Info, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface AnatomyViewerProps {
  patient: Patient;
  theme: ThemeMode;
  initialSystem?: AnatomicalSystem;
  compact?: boolean;
}

const HOTSPOTS: Record<AnatomicalSystem, AnatomicalHotspot[]> = {
  thoracic: [
    {
      id: 'hs-cavitas',
      name: 'Cavitas Thoracis',
      latinName: 'Cavitas thoracis superior',
      system: 'thoracic',
      position: [0, 0.9, 0.4],
      description: 'Superior thoracic space housing bronchovascular pedicle and aortic arch.',
      clinicalSignificance: 'Normal mediastinal width; clear pleural recesses.',
      status: 'optimal'
    },
    {
      id: 'hs-pulmo-sin',
      name: 'Pulmo Sinister',
      latinName: 'Pulmo sinister (Lobus inferior)',
      system: 'thoracic',
      position: [0.7, 0.3, 0.3],
      description: 'Left lung lower lobe parenchyma showing mild interstitial markings.',
      clinicalSignificance: 'SpO2 99% maintained. Mild atelectasis during deep inspiration.',
      riskFactor: 'Mild airway reactivity',
      status: 'warning'
    },
    {
      id: 'hs-diaphragma',
      name: 'Diaphragma',
      latinName: 'Musculus diaphragma',
      system: 'thoracic',
      position: [0.9, -0.6, 0.2],
      description: 'Musculotendinous partition separating thoracic and abdominal cavities.',
      clinicalSignificance: 'Synchronous diaphragmatic excursion; costophrenic angles sharp.',
      status: 'optimal'
    },
    {
      id: 'hs-columna',
      name: 'Columna Vertebralis',
      latinName: 'Columna vertebralis thoracica (T1-T12)',
      system: 'thoracic',
      position: [-0.9, 0.1, -0.5],
      description: 'Mid-thoracic vertebral axis and costovertebral articulations.',
      clinicalSignificance: 'Physiological kyphosis intact. Intervertebral spaces well preserved.',
      status: 'optimal'
    }
  ],
  cardiovascular: [
    {
      id: 'hs-cor',
      name: 'Cor / Left Ventricle',
      latinName: 'Ventriculus sinister cordis',
      system: 'cardiovascular',
      position: [0.4, 0.1, 0.4],
      description: 'Primary muscular pump propelling oxygenated blood through systemic circulation.',
      clinicalSignificance: 'Ejection fraction ~62%; myocardial contractility preserved.',
      status: 'optimal'
    },
    {
      id: 'hs-aorta',
      name: 'Arcus Aortae',
      latinName: 'Arcus aortae & Aorta ascendens',
      system: 'cardiovascular',
      position: [-0.2, 0.8, 0.2],
      description: 'Great systemic arterial trunk giving rise to brachiocephalic branches.',
      clinicalSignificance: 'Aortic valve compliant without calcification.',
      status: 'optimal'
    },
    {
      id: 'hs-coronary',
      name: 'Arteria Coronaria',
      latinName: 'Ramus interventricularis anterior',
      system: 'cardiovascular',
      position: [0.3, -0.2, 0.5],
      description: 'Left anterior descending coronary arterial perfusion territory.',
      clinicalSignificance: 'Calcification score zero; excellent distal perfusion.',
      riskFactor: 'Total cholesterol 190 mg/dL',
      status: 'warning'
    }
  ],
  digestive: [
    {
      id: 'hs-gaster',
      name: 'Gaster / Stomach',
      latinName: 'Ventriculus / Gaster',
      system: 'digestive',
      position: [0.3, 0.2, 0.4],
      description: 'Hollow digestive organ mixing food with gastric acid and proteolytic enzymes.',
      clinicalSignificance: 'Active peristaltic contractions; mucosal lining intact.',
      riskFactor: 'Mild acid reflux reported',
      status: 'warning'
    },
    {
      id: 'hs-hepar',
      name: 'Hepar / Liver',
      latinName: 'Lobus dexter hepatis',
      system: 'digestive',
      position: [-0.6, 0.5, 0.3],
      description: 'Primary metabolic and detoxification organ synthesizing bile.',
      clinicalSignificance: 'Homogeneous parenchymal density; normal hepatic enzymes.',
      status: 'optimal'
    },
    {
      id: 'hs-intestinum',
      name: 'Intestinum Tenue',
      latinName: 'Jejunum & Ileum',
      system: 'digestive',
      position: [0, -0.5, 0.4],
      description: 'Extensive coiled mucosal surface absorbing macro & micronutrients.',
      clinicalSignificance: 'Normal bowel motility, no distension or obstruction.',
      status: 'optimal'
    }
  ],
  skeletal: [
    {
      id: 'hs-cranium',
      name: 'Cranium & Cervical Axis',
      latinName: 'Cranium & Vertebrae cervicales',
      system: 'skeletal',
      position: [0, 1.4, 0.1],
      description: 'Cranial vault and C1-C7 axial cervical framework.',
      clinicalSignificance: 'Intact cortical bone; neuroforaminal patency preserved.',
      status: 'optimal'
    },
    {
      id: 'hs-costae',
      name: 'Costae & Sternum',
      latinName: 'Costae verae & Sternum',
      system: 'skeletal',
      position: [0.6, 0.4, 0.4],
      description: 'Articulated rib cage shielding cardiac and pulmonary parenchyma.',
      clinicalSignificance: 'No acute fractures or radiolucent osteolytic lesions.',
      status: 'optimal'
    }
  ],
  nervous: [
    {
      id: 'hs-cerebrum',
      name: 'Cerebrum & Cortex',
      latinName: 'Cortex cerebri & Diencephalon',
      system: 'nervous',
      position: [0, 1.3, 0.2],
      description: 'Higher cognitive center integrating sensory inputs and motor commands.',
      clinicalSignificance: 'Normal EEG background alpha rhythm; cerebral perfusion symmetrical.',
      status: 'optimal'
    },
    {
      id: 'hs-medulla',
      name: 'Medulla Spinalis',
      latinName: 'Medulla spinalis & Radices nervorum',
      system: 'nervous',
      position: [0, 0.3, -0.4],
      description: 'Descending motor pathways and ascending sensory tract conduits.',
      clinicalSignificance: 'Signal transmission conduction velocity 58 m/s (normal).',
      status: 'optimal'
    }
  ],
  whole_body: [
    {
      id: 'hs-biometrics',
      name: 'Full Body Biometrics',
      latinName: 'Systema integrale',
      system: 'whole_body',
      position: [0, 0.5, 0.6],
      description: 'Multidimensional biometric integration: Cardiovascular, Pulmonary, GI.',
      clinicalSignificance: 'Overall systemic homeostasis score: 92% Care Efficiency.',
      status: 'optimal'
    }
  ]
};

export const AnatomyViewer: React.FC<AnatomyViewerProps> = ({
  patient,
  theme,
  initialSystem = 'thoracic',
  compact = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeSystem, setActiveSystem] = useState<AnatomicalSystem>(initialSystem);
  const [selectedHotspot, setSelectedHotspot] = useState<AnatomicalHotspot | null>(
    HOTSPOTS[initialSystem][0] || null
  );
  const [explodedView, setExplodedView] = useState<number>(0);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'xray' | 'pbr' | 'thermal'>('xray');

  // Animation & three refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const systemGroupsRef = useRef<Record<string, THREE.Group>>({});
  const scanPlaneRef = useRef<THREE.Mesh | null>(null);
  const heartbeatAnimRef = useRef<THREE.Group | null>(null);
  const lungsAnimRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Re-sync active hotspot on system change
  const currentHotspots = useMemo(() => {
    return HOTSPOTS[activeSystem] || [];
  }, [activeSystem]);

  useEffect(() => {
    setSelectedHotspot(currentHotspots[0] || null);
  }, [activeSystem, currentHotspots]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Background color based on theme
    const bgCol = theme === 'dark' ? 0x07111e : 0xf3faf8;
    scene.background = new THREE.Color(bgCol);
    scene.fog = new THREE.FogExp2(bgCol, 0.12);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.3, 3.8);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 6.5;
    controls.minDistance = 1.8;
    controls.target.set(0, 0.1, 0);
    controlsRef.current = controls;

    let isInteracting = false;
    controls.addEventListener('start', () => { isInteracting = true; });
    controls.addEventListener('end', () => { isInteracting = false; });

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x14b8a6, 1.4);
    fillLight.position.set(-3, -1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa7f3d0, 2.0, 10);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    // Contact Ground Shadow
    const groundGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const groundMat = new THREE.MeshBasicMaterial({
      color: theme === 'dark' ? 0x030712 : 0x0f766e,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.6;
    scene.add(ground);

    // -------------------------------------------------------------------------
    // BUILD HIGH-FIDELITY PROCEDURAL ANATOMICAL GEOMETRIES
    // -------------------------------------------------------------------------
    const systemGroups: Record<string, THREE.Group> = {
      thoracic: new THREE.Group(),
      cardiovascular: new THREE.Group(),
      digestive: new THREE.Group(),
      skeletal: new THREE.Group(),
      nervous: new THREE.Group(),
      whole_body: new THREE.Group()
    };
    systemGroupsRef.current = systemGroups;

    // Materials library
    const boneMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.25,
      transparent: true,
      opacity: 0.88,
      ior: 1.4,
    });

    const xrayRibMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    });

    const lungMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.4,
      transparent: true,
      opacity: 0.55,
      roughnessMap: null,
    });

    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.2,
      clearcoat: 0.8,
    });

    const vesselMatRed = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      metalness: 0.2,
    });

    const vesselMatBlue = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.2,
    });

    const stomachMat = new THREE.MeshPhysicalMaterial({
      color: 0xf97316,
      emissive: 0xc2410c,
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.1,
      transmission: 0.3,
      transparent: true,
      opacity: 0.85,
    });

    const intestineMat = new THREE.MeshPhysicalMaterial({
      color: 0xfb7185,
      emissive: 0xe11d48,
      emissiveIntensity: 0.2,
      roughness: 0.45,
      metalness: 0.05,
    });

    const liverMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
      metalness: 0.1,
    });

    const nerveMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      wireframe: true,
    });

    const silhouetteMat = new THREE.MeshPhysicalMaterial({
      color: 0xa7f3d0,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.15,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.3,
      ior: 1.3,
    });

    // 1. BUILD THORACIC SYSTEM (Ref 1 - Video 1 Rib Cage & Lungs)
    const thoracicGroup = systemGroups.thoracic;

    // Thoracic spine column (T1-T12)
    const spineGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const y = 0.8 - i * 0.12;
      const vertGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.07, 16);
      const vertMesh = new THREE.Mesh(vertGeo, boneMat);
      vertMesh.position.set(0, y, -0.22);
      vertMesh.rotation.x = 0.05;
      spineGroup.add(vertMesh);

      const discGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16);
      const discMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.set(0, y - 0.05, -0.22);
      spineGroup.add(disc);
    }
    thoracicGroup.add(spineGroup);

    // Sternum
    const sternumShape = new THREE.Shape();
    sternumShape.moveTo(-0.1, 0.8);
    sternumShape.lineTo(0.1, 0.8);
    sternumShape.lineTo(0.08, -0.2);
    sternumShape.lineTo(0, -0.35);
    sternumShape.lineTo(-0.08, -0.2);
    sternumShape.closePath();
    const sternumGeo = new THREE.ExtrudeGeometry(sternumShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02 });
    const sternum = new THREE.Mesh(sternumGeo, boneMat);
    sternum.position.set(0, 0, 0.42);
    thoracicGroup.add(sternum);

    // Rib cage curves (10 pairs)
    const ribGroup = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const ySpine = 0.7 - i * 0.11;
      const ySternum = 0.65 - i * 0.09;
      const widthRib = 0.55 + Math.sin((i / 10) * Math.PI) * 0.35;
      const depthRib = 0.35 + Math.sin((i / 10) * Math.PI) * 0.18;

      // Left rib curve
      const leftCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.08, ySpine, -0.2),
        new THREE.Vector3(widthRib * 0.6, ySpine - 0.03, -0.1),
        new THREE.Vector3(widthRib, ySpine - 0.08, depthRib * 0.5),
        new THREE.Vector3(widthRib * 0.5, ySternum - 0.05, depthRib + 0.15),
        new THREE.Vector3(0.06, ySternum, 0.42)
      ]);
      const leftGeo = new THREE.TubeGeometry(leftCurve, 24, 0.022, 8, false);
      const leftRib = new THREE.Mesh(leftGeo, xrayRibMat);
      ribGroup.add(leftRib);

      // Right rib curve
      const rightCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.08, ySpine, -0.2),
        new THREE.Vector3(-widthRib * 0.6, ySpine - 0.03, -0.1),
        new THREE.Vector3(-widthRib, ySpine - 0.08, depthRib * 0.5),
        new THREE.Vector3(-widthRib * 0.5, ySternum - 0.05, depthRib + 0.15),
        new THREE.Vector3(-0.06, ySternum, 0.42)
      ]);
      const rightGeo = new THREE.TubeGeometry(rightCurve, 24, 0.022, 8, false);
      const rightRib = new THREE.Mesh(rightGeo, xrayRibMat);
      ribGroup.add(rightRib);
    }
    thoracicGroup.add(ribGroup);

    // Lungs (Left & Right)
    const lungsGroup = new THREE.Group();
    const lungGeo = new THREE.CapsuleGeometry(0.32, 0.65, 16, 24);

    // Right lung (3 lobes)
    const rightLung = new THREE.Mesh(lungGeo, lungMat);
    rightLung.position.set(-0.45, 0.18, 0.1);
    rightLung.scale.set(1.0, 1.1, 0.85);
    lungsGroup.add(rightLung);

    // Left lung (cardiac notch)
    const leftLung = new THREE.Mesh(lungGeo, lungMat);
    leftLung.position.set(0.46, 0.18, 0.12);
    leftLung.scale.set(0.88, 1.05, 0.82);
    lungsGroup.add(leftLung);

    // Trachea & Bronchi
    const tracheaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.1, 0.05),
      new THREE.Vector3(0, 0.5, 0.02),
    ]);
    const trachea = new THREE.Mesh(new THREE.TubeGeometry(tracheaCurve, 16, 0.045, 12, false), boneMat);
    lungsGroup.add(trachea);

    // Bronchus left
    const bronchusLeft = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.5, 0.02),
      new THREE.Vector3(0.25, 0.35, 0.05),
    ]);
    lungsGroup.add(new THREE.Mesh(new THREE.TubeGeometry(bronchusLeft, 12, 0.03, 8, false), boneMat));

    // Bronchus right
    const bronchusRight = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.5, 0.02),
      new THREE.Vector3(-0.25, 0.35, 0.05),
    ]);
    lungsGroup.add(new THREE.Mesh(new THREE.TubeGeometry(bronchusRight, 12, 0.03, 8, false), boneMat));

    // Diaphragm dome
    const diaGeo = new THREE.SphereGeometry(0.8, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.32);
    const diaMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const diaphragm = new THREE.Mesh(diaGeo, diaMat);
    diaphragm.position.set(0, -0.4, 0.05);
    diaphragm.rotation.x = Math.PI;
    lungsGroup.add(diaphragm);

    thoracicGroup.add(lungsGroup);
    lungsAnimRef.current = lungsGroup;

    // 2. BUILD CARDIOVASCULAR SYSTEM
    const cardioGroup = systemGroups.cardiovascular;

    // Heart main body
    const heartGroup = new THREE.Group();
    const heartMainGeo = new THREE.SphereGeometry(0.34, 24, 24);
    heartMainGeo.scale(1.1, 1.3, 0.95);
    const heartMain = new THREE.Mesh(heartMainGeo, heartMat);
    heartMain.position.set(0.12, 0.08, 0.22);
    heartMain.rotation.z = -0.3;
    heartGroup.add(heartMain);

    // Aortic Arch
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, 0.25, 0.2),
      new THREE.Vector3(0.08, 0.65, 0.15),
      new THREE.Vector3(-0.15, 0.72, 0.05),
      new THREE.Vector3(-0.18, 0.3, -0.05),
      new THREE.Vector3(-0.16, -0.4, -0.15)
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 28, 0.055, 12, false);
    const aortaMesh = new THREE.Mesh(aortaGeo, vesselMatRed);
    heartGroup.add(aortaMesh);

    // Superior Vena Cava
    const venaCavaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.28, 0.65, 0.1),
      new THREE.Vector3(0.25, 0.2, 0.15)
    ]);
    const venaCavaGeo = new THREE.TubeGeometry(venaCavaCurve, 12, 0.045, 12, false);
    const venaCavaMesh = new THREE.Mesh(venaCavaGeo, vesselMatBlue);
    heartGroup.add(venaCavaMesh);

    // Pulmonary Artery
    const pulmoArtCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.22, 0.3),
      new THREE.Vector3(-0.05, 0.45, 0.22),
      new THREE.Vector3(-0.35, 0.42, 0.05)
    ]);
    const pulmoArt = new THREE.Mesh(new THREE.TubeGeometry(pulmoArtCurve, 16, 0.04, 10, false), vesselMatBlue);
    heartGroup.add(pulmoArt);

    // Coronary Arteries (vessels on heart surface)
    for (let c = 0; c < 4; c++) {
      const cCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.12, 0.3, 0.32),
        new THREE.Vector3(0.18 + c * 0.04, 0.1 - c * 0.06, 0.38 - c * 0.02),
        new THREE.Vector3(0.22 + c * 0.02, -0.15 - c * 0.05, 0.28)
      ]);
      heartGroup.add(new THREE.Mesh(new THREE.TubeGeometry(cCurve, 12, 0.012, 6, false), vesselMatRed));
    }

    cardioGroup.add(heartGroup);
    heartbeatAnimRef.current = heartGroup;

    // 3. BUILD DIGESTIVE SYSTEM (Ref 2 - "Stomach Function in Digestion")
    const digestiveGroup = systemGroups.digestive;

    // Stomach (Gaster)
    const stomachGroup = new THREE.Group();
    const stomachShapeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.48, 0.1), // Esophagus inlet
      new THREE.Vector3(0.22, 0.35, 0.28), // Fundus
      new THREE.Vector3(0.35, 0.1, 0.32), // Greater curvature
      new THREE.Vector3(0.15, -0.05, 0.3), // Body
      new THREE.Vector3(-0.08, -0.08, 0.25), // Pylorus
      new THREE.Vector3(-0.16, -0.15, 0.18) // Duodenum start
    ]);
    const stomachGeo = new THREE.TubeGeometry(stomachShapeCurve, 32, 0.14, 16, false);
    const stomachMesh = new THREE.Mesh(stomachGeo, stomachMat);
    stomachGroup.add(stomachMesh);

    // Liver (Hepar)
    const liverGeo = new THREE.SphereGeometry(0.38, 20, 20);
    liverGeo.scale(1.4, 0.7, 0.9);
    const liver = new THREE.Mesh(liverGeo, liverMat);
    liver.position.set(-0.35, 0.28, 0.22);
    liver.rotation.z = -0.2;
    stomachGroup.add(liver);

    // Gallbladder
    const gallGeo = new THREE.CapsuleGeometry(0.06, 0.14, 8, 8);
    const gallMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 });
    const gall = new THREE.Mesh(gallGeo, gallMat);
    gall.position.set(-0.25, 0.08, 0.36);
    stomachGroup.add(gall);

    // Small Intestine (Jejunum/Ileum loops)
    const loopCurves: THREE.Vector3[] = [];
    for (let t = 0; t <= 32; t++) {
      const angle = t * 0.9;
      const radius = 0.2 + Math.sin(t * 0.5) * 0.08;
      const y = -0.25 - (t / 32) * 0.45;
      const x = Math.cos(angle) * radius * 0.9;
      const z = 0.28 + Math.sin(angle) * 0.1;
      loopCurves.push(new THREE.Vector3(x, y, z));
    }
    const intestineCurve = new THREE.CatmullRomCurve3(loopCurves);
    const intestineGeo = new THREE.TubeGeometry(intestineCurve, 48, 0.045, 8, false);
    const smallIntestine = new THREE.Mesh(intestineGeo, intestineMat);
    stomachGroup.add(smallIntestine);

    // Large Intestine (Colon framework)
    const colonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, -0.68, 0.24), // Cecum
      new THREE.Vector3(0.42, -0.25, 0.22), // Ascending
      new THREE.Vector3(0.38, 0.02, 0.25),  // Hepatic flexure
      new THREE.Vector3(0, 0.05, 0.34),     // Transverse colon
      new THREE.Vector3(-0.38, 0.01, 0.25), // Splenic flexure
      new THREE.Vector3(-0.42, -0.3, 0.22), // Descending
      new THREE.Vector3(-0.25, -0.68, 0.25) // Sigmoid
    ]);
    const colonGeo = new THREE.TubeGeometry(colonCurve, 32, 0.075, 10, false);
    const colonMesh = new THREE.Mesh(colonGeo, new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      roughness: 0.4,
      metalness: 0.1,
    }));
    stomachGroup.add(colonMesh);

    digestiveGroup.add(stomachGroup);

    // 4. BUILD SKELETAL SYSTEM
    const skeletalGroup = systemGroups.skeletal;
    skeletalGroup.add(spineGroup.clone());
    skeletalGroup.add(ribGroup.clone());
    skeletalGroup.add(sternum.clone());

    // Cranium
    const skullGeo = new THREE.SphereGeometry(0.36, 24, 24);
    skullGeo.scale(0.85, 1.15, 1.0);
    const skull = new THREE.Mesh(skullGeo, boneMat);
    skull.position.set(0, 1.45, 0.08);
    skeletalGroup.add(skull);

    // Pelvis
    const pelvisGeo = new THREE.TorusGeometry(0.38, 0.09, 12, 24, Math.PI * 1.5);
    const pelvis = new THREE.Mesh(pelvisGeo, boneMat);
    pelvis.position.set(0, -0.85, 0.05);
    pelvis.rotation.x = Math.PI * 0.45;
    skeletalGroup.add(pelvis);

    // Femurs
    const femurLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.7, 12), boneMat);
    femurLeft.position.set(0.3, -1.25, 0.05);
    femurLeft.rotation.z = -0.08;
    skeletalGroup.add(femurLeft);

    const femurRight = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.7, 12), boneMat);
    femurRight.position.set(-0.3, -1.25, 0.05);
    femurRight.rotation.z = 0.08;
    skeletalGroup.add(femurRight);

    // Clavicles
    const clavicleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), boneMat);
    clavicleLeft.position.set(0.32, 0.88, 0.25);
    clavicleLeft.rotation.z = 1.35;
    clavicleLeft.rotation.y = 0.2;
    skeletalGroup.add(clavicleLeft);

    const clavicleRight = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), boneMat);
    clavicleRight.position.set(-0.32, 0.88, 0.25);
    clavicleRight.rotation.z = -1.35;
    clavicleRight.rotation.y = -0.2;
    skeletalGroup.add(clavicleRight);

    // 5. BUILD NERVOUS SYSTEM
    const nervousGroup = systemGroups.nervous;
    const brainGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const brain = new THREE.Mesh(brainGeo, nerveMat);
    brain.position.set(0, 1.45, 0.08);
    nervousGroup.add(brain);

    // Spinal Cord
    const cordGeo = new THREE.CylinderGeometry(0.03, 0.025, 1.8, 12);
    const cord = new THREE.Mesh(cordGeo, nerveMat);
    cord.position.set(0, 0.4, -0.2);
    nervousGroup.add(cord);

    // Intercostal Nerves branching
    for (let n = 0; n < 8; n++) {
      const ny = 0.8 - n * 0.15;
      const nerveBranchL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, ny, -0.2),
        new THREE.Vector3(0.35, ny - 0.05, 0.0),
        new THREE.Vector3(0.65, ny - 0.1, 0.2)
      ]);
      nervousGroup.add(new THREE.Mesh(new THREE.TubeGeometry(nerveBranchL, 10, 0.012, 6, false), nerveMat));

      const nerveBranchR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, ny, -0.2),
        new THREE.Vector3(-0.35, ny - 0.05, 0.0),
        new THREE.Vector3(-0.65, ny - 0.1, 0.2)
      ]);
      nervousGroup.add(new THREE.Mesh(new THREE.TubeGeometry(nerveBranchR, 10, 0.012, 6, false), nerveMat));
    }

    // 6. WHOLE BODY TRANSLUCENT SILHOUETTE (Medical scan envelope)
    const wholeBodyGroup = systemGroups.whole_body;
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.45, 1.8, 24, 8);
    const torso = new THREE.Mesh(torsoGeo, silhouetteMat);
    torso.position.set(0, 0, 0.08);
    wholeBodyGroup.add(torso);
    wholeBodyGroup.add(thoracicGroup.clone());
    wholeBodyGroup.add(heartGroup.clone());
    wholeBodyGroup.add(stomachGroup.clone());

    // Add all groups to scene
    Object.values(systemGroups).forEach(group => {
      scene.add(group);
      group.visible = false;
    });

    // Set initial system visible
    if (systemGroups[activeSystem]) {
      systemGroups[activeSystem].visible = true;
    }

    // Diagnostic Holographic Scan Plane
    const scanGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const scanPlane = new THREE.Mesh(scanGeo, scanMat);
    scanPlane.rotation.x = Math.PI / 2;
    scanPlane.position.y = 1.2;
    scanPlane.visible = false;
    scene.add(scanPlane);
    scanPlaneRef.current = scanPlane;

    // Circulation particles
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      particlePositions[p] = (Math.random() - 0.5) * 1.2;
      particlePositions[p + 1] = (Math.random() - 0.5) * 1.8;
      particlePositions[p + 2] = (Math.random() - 0.5) * 0.8;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.028,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();
    let scanDirection = -1;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Slow smooth rotation if enabled
      if (isRotating && !isInteracting) {
        Object.values(systemGroups).forEach(g => {
          if (g.visible) g.rotation.y += 0.005;
        });
      }

      // Cardiac pulsation linked to patient's heart rate
      if (heartbeatAnimRef.current) {
        const bpm = patient.vitals.pulseRate || 72;
        const bps = bpm / 60;
        const pulse = 1 + Math.pow(Math.sin(elapsed * Math.PI * 2 * bps), 8) * 0.12;
        heartbeatAnimRef.current.scale.set(pulse, pulse, pulse);
      }

      // Respiratory cycle linked to patient's respiratory rate
      if (lungsAnimRef.current) {
        const respRate = patient.vitals.respiratoryRate || 16;
        const respFreq = respRate / 60;
        const breath = 1 + Math.sin(elapsed * Math.PI * 2 * respFreq) * 0.045;
        lungsAnimRef.current.scale.set(breath, breath, breath);
      }

      // Scanner laser sweep
      if (scanPlaneRef.current && scanPlaneRef.current.visible) {
        scanPlaneRef.current.position.y += scanDirection * 0.02;
        if (scanPlaneRef.current.position.y < -1.4) scanDirection = 1;
        if (scanPlaneRef.current.position.y > 1.4) scanDirection = -1;
      }

      // Flowing particles
      if (particlesRef.current) {
        const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] -= 0.004;
          if (pos[i] < -1.2) pos[i] = 1.2;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      boneMat.dispose();
      xrayRibMat.dispose();
      lungMat.dispose();
      heartMat.dispose();
      stomachMat.dispose();
    };
  }, [theme, isRotating, patient.vitals.pulseRate, patient.vitals.respiratoryRate]);

  // Update active system visibility
  useEffect(() => {
    if (!systemGroupsRef.current) return;
    Object.entries(systemGroupsRef.current).forEach(([key, group]) => {
      group.visible = key === activeSystem;
    });
  }, [activeSystem]);

  // Handle Exploded View Slider
  useEffect(() => {
    const currentGroup = systemGroupsRef.current[activeSystem];
    if (!currentGroup) return;

    currentGroup.children.forEach((child, index) => {
      const factor = (index % 3) - 1;
      child.position.z = factor * (explodedView * 0.6);
      child.position.x = factor * (explodedView * 0.3);
    });
  }, [explodedView, activeSystem]);

  // Run Diagnostic Scan
  const triggerDiagnosticScan = () => {
    sound.playScanBeep();
    setIsScanning(true);
    if (scanPlaneRef.current) {
      scanPlaneRef.current.visible = true;
    }
    setTimeout(() => {
      setIsScanning(false);
      if (scanPlaneRef.current) {
        scanPlaneRef.current.visible = false;
      }
    }, 4500);
  };

  // Zoom helpers
  const handleZoom = (delta: number) => {
    sound.playClick();
    if (!cameraRef.current) return;
    cameraRef.current.position.z = THREE.MathUtils.clamp(
      cameraRef.current.position.z + delta,
      2.0,
      6.0
    );
  };

  const resetCamera = () => {
    sound.playClick();
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 0.3, 3.8);
    controlsRef.current.target.set(0, 0.1, 0);
    controlsRef.current.update();
  };

  const systemsList: { id: AnatomicalSystem; label: string; icon: string }[] = [
    { id: 'thoracic', label: 'Thoracic & Lungs', icon: '🫁' },
    { id: 'cardiovascular', label: 'Cardiovascular', icon: '❤️' },
    { id: 'digestive', label: 'Digestive', icon: '🧪' },
    { id: 'skeletal', label: 'Skeletal & Spine', icon: '🦴' },
    { id: 'nervous', label: 'Nervous System', icon: '⚡' },
    { id: 'whole_body', label: 'Full Anatomy', icon: '👤' },
  ];

  const isDark = theme === 'dark';

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-3xl overflow-hidden transition-all duration-500 select-none ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-[540px]'
      } ${
        isDark 
          ? 'bg-gradient-to-b from-[#0B1725] via-[#0E2035] to-[#07111E] text-white border border-blue-900/40 shadow-2xl' 
          : 'bg-gradient-to-b from-[#FFFFFF] via-[#F4FBF9] to-[#EAF5F2] text-[#142C43] border border-teal-100 shadow-xl'
      }`}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0" />

      {/* TOP HEADER OVERLAY: System Title & Mode Pill */}
      <div className="absolute top-5 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl backdrop-blur-md shadow-sm border ${
            isDark ? 'bg-blue-950/60 border-blue-500/30 text-teal-400' : 'bg-white/80 border-teal-100 text-teal-600'
          }`}>
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg tracking-tight">
                {activeSystem === 'thoracic' && 'Thoracic Cavity & Pulmonary Imaging'}
                {activeSystem === 'cardiovascular' && 'Cardiovascular Hemodynamics'}
                {activeSystem === 'digestive' && 'Stomach & Gastrointestinal Function'}
                {activeSystem === 'skeletal' && 'Articulated Skeletal Architecture'}
                {activeSystem === 'nervous' && 'Central & Peripheral Neural Axis'}
                {activeSystem === 'whole_body' && 'Multisystem Physiological Cross-Section'}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                isDark ? 'bg-blue-500/20 text-cyan-300 border border-blue-400/30' : 'bg-teal-500/10 text-teal-700 border border-teal-200'
              }`}>
                Live 3D Model
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Patient: <span className="font-medium">{patient.name}</span> ({patient.patientCode}) • Heart Rate: {patient.vitals.pulseRate} bpm
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={triggerDiagnosticScan}
            disabled={isScanning}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              isScanning
                ? 'bg-amber-500 text-white animate-pulse'
                : isDark
                ? 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white border border-teal-400/30'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isScanning ? 'Scanning Tissue...' : 'Run 3D Environment'}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-xl backdrop-blur-md transition-all active:scale-95 border ${
              isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-white/80 hover:bg-white border-slate-200 text-slate-600'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* FLOATING INTERACTIVE HOTSPOT PINS ON THE 3D MODEL */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {currentHotspots.map((hs, index) => {
          const isSelected = selectedHotspot?.id === hs.id;
          return (
            <div
              key={hs.id}
              style={{
                // Approximate mapping from 3D coordinates to responsive overlay zones
                left: `${50 + hs.position[0] * 32}%`,
                top: `${48 - hs.position[1] * 28}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform duration-300 hover:scale-110"
            >
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedHotspot(hs);
                }}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-full backdrop-blur-md shadow-lg transition-all border ${
                  isSelected
                    ? isDark 
                      ? 'bg-teal-500 text-slate-950 border-teal-300 ring-2 ring-teal-400/50' 
                      : 'bg-teal-600 text-white border-teal-500 ring-2 ring-teal-500/30'
                    : isDark
                    ? 'bg-slate-900/80 text-cyan-200 hover:bg-slate-800 border-cyan-500/30'
                    : 'bg-white/90 text-teal-800 hover:bg-white border-teal-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  hs.status === 'warning' ? 'bg-amber-400' : 'bg-teal-400'
                }`} />
                <span className="text-xs font-semibold whitespace-nowrap">{hs.name}</span>
                <span className="text-[10px] opacity-70 italic hidden sm:inline">({hs.latinName.split(' ')[0]})</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* SELECTED HOTSPOT CLINICAL DETAIL CARD (Bottom Left floating card) */}
      {selectedHotspot && (
        <div className={`absolute bottom-20 left-6 max-w-sm p-4 rounded-2xl backdrop-blur-xl border shadow-xl z-20 transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/90 border-slate-700/80 text-white'
            : 'bg-white/95 border-teal-100/80 text-[#142C43]'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-500">
                Anatomical Structure
              </span>
              <h4 className="font-bold text-sm">{selectedHotspot.name}</h4>
              <p className="text-xs italic text-slate-400">{selectedHotspot.latinName}</p>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
              selectedHotspot.status === 'warning'
                ? 'bg-amber-500/20 text-amber-500 border border-amber-400/30'
                : 'bg-emerald-500/20 text-emerald-500 border border-emerald-400/30'
            }`}>
              {selectedHotspot.status}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-300 mb-2 leading-relaxed">
            {selectedHotspot.description}
          </p>

          <div className={`p-2 rounded-xl text-xs flex items-start gap-2 ${
            isDark ? 'bg-slate-800/80 text-slate-200' : 'bg-teal-50/80 text-teal-900'
          }`}>
            <Info className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
            <span>{selectedHotspot.clinicalSignificance}</span>
          </div>

          {selectedHotspot.riskFactor && (
            <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Alert: {selectedHotspot.riskFactor}
            </div>
          )}
        </div>
      )}

      {/* RIGHT SIDE FLOATING CAMERA & CONTROLS TOOLBAR */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button
          onClick={() => handleZoom(-0.4)}
          className={`p-2.5 rounded-xl backdrop-blur-md shadow-md transition-all active:scale-95 border ${
            isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white/90 hover:bg-white border-slate-200 text-slate-700'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.4)}
          className={`p-2.5 rounded-xl backdrop-blur-md shadow-md transition-all active:scale-95 border ${
            isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white/90 hover:bg-white border-slate-200 text-slate-700'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetCamera}
          className={`p-2.5 rounded-xl backdrop-blur-md shadow-md transition-all active:scale-95 border ${
            isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-white/90 hover:bg-white border-slate-200 text-slate-700'
          }`}
          title="Reset Camera Orientation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setIsRotating(!isRotating);
          }}
          className={`p-2.5 rounded-xl backdrop-blur-md shadow-md transition-all active:scale-95 border ${
            isRotating
              ? 'bg-teal-500 text-white border-teal-400'
              : isDark
              ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
              : 'bg-white/90 hover:bg-white border-slate-200 text-slate-700'
          }`}
          title="Toggle Auto-Rotation"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* BOTTOM UNIFIED CONTROL DOCK: System Switcher & Exploded View Slider */}
      <div className="absolute bottom-4 left-6 right-6 flex flex-col md:flex-row items-center justify-between gap-3 z-10 pointer-events-none">
        {/* Anatomical Systems Navigation Pills */}
        <div className={`pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-xl border shadow-lg overflow-x-auto max-w-full ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-teal-100'
        }`}>
          {systemsList.map(sys => {
            const isActive = activeSystem === sys.id;
            return (
              <button
                key={sys.id}
                onClick={() => {
                  sound.playClick();
                  setActiveSystem(sys.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-teal-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50/60'
                }`}
              >
                <span>{sys.icon}</span>
                <span>{sys.label}</span>
              </button>
            );
          })}
        </div>

        {/* Exploded View Slider */}
        <div className={`pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-2xl backdrop-blur-xl border shadow-lg ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-teal-100 text-[#142C43]'
        }`}>
          <Layers className="w-4 h-4 text-teal-500" />
          <span className="text-xs font-semibold whitespace-nowrap">Explode Layers:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodedView}
            onChange={(e) => setExplodedView(parseFloat(e.target.value))}
            className="w-24 accent-teal-500 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold w-7 text-right">
            {Math.round(explodedView * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
