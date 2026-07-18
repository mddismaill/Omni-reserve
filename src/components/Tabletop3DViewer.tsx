import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Table, TableType } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { 
  Sun, 
  Moon, 
  Zap, 
  Layers, 
  Rotate3d, 
  Sparkles, 
  Clock, 
  Shield, 
  DollarSign, 
  Flame,
  Info,
  Eye,
  EyeOff
} from "lucide-react";

interface Tabletop3DViewerProps {
  tables: Table[];
  selectedRoom: "main" | "vip" | "terrace";
  selectedTable: Table | null;
  selectedTables?: Table[];
  onSelectTable: (table: Table) => void;
  bookedTableIds: string[]; // List of tables already booked for the selected slot
  partySizeFilter: number;
  tableTypeFilter: string;
  tableSearchQuery?: string;
}

type TimeOfDay = "day" | "sunset" | "neon_night";

const roomCameraPresets = {
  main: {
    pos: new THREE.Vector3(0, 20, 24),
    target: new THREE.Vector3(0, -1, 0)
  },
  vip: {
    pos: new THREE.Vector3(-14, 16, 20),
    target: new THREE.Vector3(2, -1, -2)
  },
  terrace: {
    pos: new THREE.Vector3(14, 15, 22),
    target: new THREE.Vector3(-3, -1, 1)
  }
};

const getTableLocationDescription = (table: Table, language: string) => {
  const isRu = language === "ru";
  const isAr = language === "ar";
  const isHy = language === "hy";

  if (table.room === "vip") {
    if (isRu) return "💎 VIP-зона: Приватная лаунж-кабина с роскошным интерьером и мягким светом";
    if (isAr) return "💎 منطقة الـ VIP: كابينة لاونج خاصة بتصميم فاخر وإضاءة ناعمة";
    if (isHy) return "💎 VIP գոտի. Առանձնացված լաունջ-խցիկ շքեղ ինտերիերով և մեղմ լուսավորությամբ";
    return "💎 VIP Lounge: Private premium cabin with luxurious interior and ambient lighting";
  }
  if (table.room === "terrace") {
    if (isRu) return "🍃 Летняя терраса: Открытая площадка на свещем воздухе среди живых растений";
    if (isAr) return "🍃 الشرفة الصيفية: مساحة مفتوحة في الهواء الطلق محاطة بالنباتات الطبيعية";
    if (isHy) return "🍃 Ամառային պատշգամբ. Բացօթյա տարածք մաքուր օդին՝ կենդանի բույսերի շրջապատում";
    return "🍃 Summer Terrace: Refreshing open-air seating surrounded by lush live plants";
  }
  if (table.type === "window") {
    if (isRu) return "🌅 Панорамная зона: Комфортный столик прямо у панорамного окна с видом на сад";
    if (isAr) return "🌅 منطقة بانورامية: طاولة مريحة بجوار النافذة البانورامية المطلة على الحديقة";
    if (isHy) return "🌅 Պանորամային գոտի. Հարմարավետ սեղան հենց պատուհանի մոտ՝ դեպի այգի տեսարանով";
    return "🌅 Panoramic Zone: Scenic window-side seating with premium garden views";
  }
  
  // Standard main hall tables
  if (table.number === 1 || table.number === 31 || table.number === 61) {
    if (isRu) return "🛋️ Главный зал: Уютный круглый столик в центре возле камина";
    if (isAr) return "🛋️ القاعة الرئيسية: طاولة مستديرة مريحة في الوسط بالقرب من المدفأة";
    if (isHy) return "🛋️ Գլխավոր դահլիճ. Հարմարավետ կլոր սեղան կենտրոնում՝ բուխարու մոտ";
    return "🛋️ Main Hall: Cozy circular table in the center close to the fireplace";
  }
  if (table.number === 2 || table.number === 32 || table.number === 62) {
    if (isRu) return "🛋️ Главный зал: Вместительный семейный диванный стол у живой зеленой стены";
    if (isAr) return "🛋️ القاعة الرئيسية: طاولة عائلية فسيحة مع أريكة بجوار الجدار الأخضر الطبيعي";
    if (isHy) return "🛋️ Գլխավոր դահլիճ. Ընդարձակ ընտանեկան սեղան բազմոցով՝ կենดանի կանաչ պատի մոտ";
    return "🛋️ Main Hall: Spacious family sofa booth next to our signature living green wall";
  }
  if (table.number === 5 || table.number === 35 || table.number === 65) {
    if (isRu) return "🛋️ Главный зал: Небольшой уединенный столик для двоих в тихом уголке";
    if (isAr) return "🛋️ القاعة الرئيسية: طاولة صغيرة ومنعزلة لشخصين في زاوية هادئة";
    if (isHy) return "🛋️ Գլխավոր դահլիճ. Փոքրիկ առանձնացված սեղան երկու հոգու համար հանգիստ անկյունում";
    return "🛋️ Main Hall: Intimate, quiet corner table for two in a peaceful enclave";
  }
  
  // Default fallback for other main hall tables
  if (isRu) return "🛋️ Главный зал: Комфортное посадочное место с мягкими креслами";
  if (isAr) return "🛋️ القاعة الرئيسية: منطقة جلوس مريحة مع كراسي ناعمة";
  if (isHy) return "🛋️ Գլխավոր դահլիճ. Հարմարավետ նստատեղ փափուկ աթոռներով";
  return "🛋️ Main Hall: Comfortable, premium seating area with soft upholstered chairs";
};

export default function Tabletop3DViewer({
  tables,
  selectedRoom,
  selectedTable,
  selectedTables = [],
  onSelectTable,
  bookedTableIds,
  partySizeFilter,
  tableTypeFilter,
  tableSearchQuery = ""
}: Tabletop3DViewerProps) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Controls states
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("sunset");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [hoveredTable, setHoveredTable] = useState<Table | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [showHelper, setShowHelper] = useState(true);
  const [activeTransition, setActiveTransition] = useState(false);

  useEffect(() => {
    setActiveTransition(true);
    const timer = setTimeout(() => {
      setActiveTransition(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedRoom]);

  // Filter tables in active room
  const activeRoomTables = useMemo(() => {
    return tables.filter(t => t.room === selectedRoom);
  }, [tables, selectedRoom]);

  // Keep latest props in refs for Three.js render loop to avoid complete teardown/rebuild of canvas
  const propsRef = useRef({
    tables: activeRoomTables,
    selectedTableId: selectedTable?.id || null,
    selectedTableIds: selectedTables.map(t => t.id) as string[],
    bookedTableIds,
    onSelectTable,
    partySizeFilter,
    tableTypeFilter,
    timeOfDay
  });

  useEffect(() => {
    propsRef.current = {
      tables: activeRoomTables,
      selectedTableId: selectedTable?.id || null,
      selectedTableIds: selectedTables.map(t => t.id),
      bookedTableIds,
      onSelectTable,
      partySizeFilter,
      tableTypeFilter,
      timeOfDay
    };
  }, [activeRoomTables, selectedTable, selectedTables, bookedTableIds, onSelectTable, partySizeFilter, tableTypeFilter, timeOfDay]);

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const tableMeshesGroupRef = useRef<THREE.Group | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const roomModelGroupRef = useRef<THREE.Group | null>(null);

  // Transition & Interaction refs
  const roomTransitionProgressRef = useRef(0);
  const hoveredTableIdRef = useRef<string | null>(null);

  const cameraTransitionRef = useRef({
    startPos: new THREE.Vector3(0, 20, 24),
    targetPos: new THREE.Vector3(0, 20, 24),
    startLookAt: new THREE.Vector3(0, -1, 0),
    targetLookAt: new THREE.Vector3(0, -1, 0),
    animating: false,
    alpha: 0
  });

  // Handle selected room transition triggers
  useEffect(() => {
    roomTransitionProgressRef.current = 0; // Trigger table and floor spawn animation

    if (cameraRef.current && controlsRef.current) {
      const preset = roomCameraPresets[selectedRoom] || roomCameraPresets.main;
      
      // Copy current camera position and controls target as start
      cameraTransitionRef.current.startPos.copy(cameraRef.current.position);
      cameraTransitionRef.current.startLookAt.copy(controlsRef.current.target);
      
      // Copy preset targets
      cameraTransitionRef.current.targetPos.copy(preset.pos);
      cameraTransitionRef.current.targetLookAt.copy(preset.target);
      
      cameraTransitionRef.current.animating = true;
      cameraTransitionRef.current.alpha = 0;
    }
  }, [selectedRoom]);

  // Cancel camera transition on manual user interaction
  useEffect(() => {
    if (isOrbiting) {
      cameraTransitionRef.current.animating = false;
    }
  }, [isOrbiting]);

  // Time of day light settings
  const lightPresets = {
    day: {
      ambient: 0x90b0d0,
      ambientIntensity: 0.8,
      directional: 0xffffff,
      dirIntensity: 1.2,
      dirPos: [15, 20, 10] as [number, number, number],
      bg: 0x090a0d,
      floorColor: { main: 0x22252a, vip: 0x111625, terrace: 0x482d1f }
    },
    sunset: {
      ambient: 0x3d2040,
      ambientIntensity: 0.6,
      directional: 0xf97316,
      dirIntensity: 1.5,
      dirPos: [20, 10, -5] as [number, number, number],
      bg: 0x07080b,
      floorColor: { main: 0x181a1f, vip: 0x0c0f1a, terrace: 0x362015 }
    },
    neon_night: {
      ambient: 0x150828,
      ambientIntensity: 0.5,
      directional: 0x14f195,
      dirIntensity: 0.8,
      dirPos: [-10, 15, -10] as [number, number, number],
      bg: 0x040507,
      floorColor: { main: 0x0a0c10, vip: 0x05070e, terrace: 0x1c100a }
    }
  };

  // 1. Initialize Canvas & Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = Math.max(containerRef.current.clientHeight || 450, 450);

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(lightPresets[timeOfDay].bg);
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 20, 24);
    cameraRef.current = camera;

    // Create WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Don't go below floor
    controls.minDistance = 8;
    controls.maxDistance = 45;
    controls.target.set(0, -1, 0);
    
    // Add event listeners to monitor when orbit is active
    controls.addEventListener("start", () => setIsOrbiting(true));
    controls.addEventListener("end", () => setIsOrbiting(false));
    
    controlsRef.current = controls;

    // Add Ambient Light
    const ambientLight = new THREE.AmbientLight(
      lightPresets[timeOfDay].ambient,
      lightPresets[timeOfDay].ambientIntensity
    );
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Add Directional Light
    const dirLight = new THREE.DirectionalLight(
      lightPresets[timeOfDay].directional,
      lightPresets[timeOfDay].dirIntensity
    );
    const pos = lightPresets[timeOfDay].dirPos;
    dirLight.position.set(pos[0], pos[1], pos[2]);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Create Groups
    const roomModelGroup = new THREE.Group();
    scene.add(roomModelGroup);
    roomModelGroupRef.current = roomModelGroup;

    const tableMeshesGroup = new THREE.Group();
    scene.add(tableMeshesGroup);
    tableMeshesGroupRef.current = tableMeshesGroup;

    // Raycasting & Mouse Tracking setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getMouseCoords = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      return { x, y };
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!cameraRef.current || !tableMeshesGroupRef.current) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      // Set absolute tooltip coordinates
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

      const coords = getMouseCoords(e);
      mouse.x = coords.x;
      mouse.y = coords.y;

      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // We intersect with all child nodes of table groups
      const intersects = raycaster.intersectObjects(tableMeshesGroupRef.current.children, true);

      if (intersects.length > 0) {
        // Find the top-level table group containing table metadata
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.parent && obj.parent !== tableMeshesGroupRef.current) {
          obj = obj.parent;
        }

        if (obj && obj.userData && obj.userData.table) {
          const table = obj.userData.table as Table;
          const isBooked = propsRef.current.bookedTableIds.includes(table.id);
          
          if (!isBooked) {
            document.body.style.cursor = "pointer";
          } else {
            document.body.style.cursor = "not-allowed";
          }
          setHoveredTable(table);
          hoveredTableIdRef.current = table.id;
          return;
        }
      }

      // No intersection
      document.body.style.cursor = "default";
      setHoveredTable(null);
      hoveredTableIdRef.current = null;
    };

    const onPointerDown = (e: MouseEvent) => {
      if (!cameraRef.current || !tableMeshesGroupRef.current) return;

      const coords = getMouseCoords(e);
      mouse.x = coords.x;
      mouse.y = coords.y;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(tableMeshesGroupRef.current.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.parent && obj.parent !== tableMeshesGroupRef.current) {
          obj = obj.parent;
        }

        if (obj && obj.userData && obj.userData.table) {
          const table = obj.userData.table as Table;
          const isBooked = propsRef.current.bookedTableIds.includes(table.id);
          if (!isBooked) {
            propsRef.current.onSelectTable(table);
          }
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", onPointerMove);
    renderer.domElement.addEventListener("click", onPointerDown);

    // Animation / Render loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smoothly update room transition progress
      if (roomTransitionProgressRef.current < 1) {
        roomTransitionProgressRef.current += 0.025; // elegant transition speed
        if (roomTransitionProgressRef.current > 1) {
          roomTransitionProgressRef.current = 1;
        }
      }

      // Camera Fly-to Transition
      if (cameraTransitionRef.current.animating && cameraRef.current && controlsRef.current) {
        cameraTransitionRef.current.alpha += 0.02; // smooth camera fly rate
        if (cameraTransitionRef.current.alpha >= 1) {
          cameraTransitionRef.current.alpha = 1;
          cameraTransitionRef.current.animating = false;
        }
        
        const alpha = cameraTransitionRef.current.alpha;
        // Cubic ease-in-out for super elegant camera panning
        const easedAlpha = alpha < 0.5 ? 4 * alpha * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 3) / 2;

        // Lerp camera position
        cameraRef.current.position.lerpVectors(
          cameraTransitionRef.current.startPos,
          cameraTransitionRef.current.targetPos,
          easedAlpha
        );

        // Lerp controls target (lookAt point)
        controlsRef.current.target.lerpVectors(
          cameraTransitionRef.current.startLookAt,
          cameraTransitionRef.current.targetLookAt,
          easedAlpha
        );
      }

      // Update orbital controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Stagger and spin the selected table's halo / indicators
      if (tableMeshesGroupRef.current) {
        const progress = roomTransitionProgressRef.current;
        const totalTables = tableMeshesGroupRef.current.children.length;

        tableMeshesGroupRef.current.children.forEach((tableGroup, index) => {
          // Stagger spawn effect
          const staggerDelay = (index / Math.max(1, totalTables)) * 0.4;
          const tableProgress = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay || 1)));
          // Cubic ease-out
          const easedTableProgress = 1 - Math.pow(1 - tableProgress, 3);

          // Animate position rising and scaling up
          const spawnYOffset = -4 * (1 - easedTableProgress);
          const isHovered = tableGroup.userData.table?.id === hoveredTableIdRef.current;
          const hoverYOffset = isHovered ? 0.25 : 0;
          
          tableGroup.position.y = spawnYOffset + hoverYOffset;
          tableGroup.scale.setScalar(easedTableProgress);

          const isSelected = propsRef.current.selectedTableIds?.includes(tableGroup.userData.table?.id) || tableGroup.userData.table?.id === propsRef.current.selectedTableId;
          const selectionRing = tableGroup.getObjectByName("selectionRing");
          
          if (selectionRing) {
            if (isSelected) {
              selectionRing.visible = true;
              selectionRing.rotation.z = elapsed * 1.5;
              selectionRing.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.05);
            } else {
              selectionRing.visible = false;
            }
          }

          // Slow rotation/bounce for status lights
          const statusLight = tableGroup.getObjectByName("statusLight");
          if (statusLight) {
            statusLight.position.y = 2.0 + Math.sin(elapsed * 3 + tableGroup.position.x) * 0.1;
          }
        });
      }

      // Animate Room shell model
      if (roomModelGroupRef.current) {
        const progress = roomTransitionProgressRef.current;
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        // Elevate slightly from below
        roomModelGroupRef.current.position.y = -1 * (1 - easedProgress);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Resize observer for responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = Math.max(entry.contentRect.height, 450);
        if (rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup on destroy
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement) {
        renderer.domElement.removeEventListener("mousemove", onPointerMove);
        renderer.domElement.removeEventListener("click", onPointerDown);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Build Room Shell and Decor when Room or TimeOfDay changes
  useEffect(() => {
    const scene = sceneRef.current;
    const roomGroup = roomModelGroupRef.current;
    if (!scene || !roomGroup) return;

    // Set background color
    scene.background = new THREE.Color(lightPresets[timeOfDay].bg);

    // Update lights to fit time of day
    if (ambientLightRef.current) {
      ambientLightRef.current.color.setHex(lightPresets[timeOfDay].ambient);
      ambientLightRef.current.intensity = lightPresets[timeOfDay].ambientIntensity;
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.setHex(lightPresets[timeOfDay].directional);
      dirLightRef.current.intensity = lightPresets[timeOfDay].dirIntensity;
      const pos = lightPresets[timeOfDay].dirPos;
      dirLightRef.current.position.set(pos[0], pos[1], pos[2]);
    }

    // Clear previous room models
    while (roomGroup.children.length > 0) {
      const child = roomGroup.children[0];
      roomGroup.remove(child);
    }

    // A. Room floor (Grid and Base Material)
    const floorSize = 40;
    const floorGeo = new THREE.BoxGeometry(floorSize, 0.4, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: lightPresets[timeOfDay].floorColor[selectedRoom],
      roughness: 0.5,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Subtle decorative grid
    const gridHelper = new THREE.GridHelper(floorSize, 20, 0x14f195, 0xffffff);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).opacity = 0.04;
    (gridHelper.material as THREE.Material).transparent = true;
    roomGroup.add(gridHelper);

    // B. Walls (Back wall and Left wall for visual boundary)
    const wallHeight = 7;
    const wallThickness = 0.5;

    // Back wall
    const backWallGeo = new THREE.BoxGeometry(floorSize, wallHeight, wallThickness);
    const backWallMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.9 });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, wallHeight / 2, -floorSize / 2 - wallThickness / 2);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Left wall
    const leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, floorSize);
    const leftWall = new THREE.Mesh(leftWallGeo, backWallMat);
    leftWall.position.set(-floorSize / 2 - wallThickness / 2, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // C. Architectural elements based on Room Types
    if (selectedRoom === "vip") {
      // Add luxury pillars in VIP room
      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, wallHeight, 12);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.7, roughness: 0.2 });
      
      const p1 = new THREE.Mesh(pillarGeo, pillarMat);
      p1.position.set(-18, wallHeight / 2, -18);
      p1.castShadow = true; p1.receiveShadow = true;
      roomGroup.add(p1);

      const p2 = p1.clone();
      p2.position.set(18, wallHeight / 2, -18);
      roomGroup.add(p2);

      // Glow neon strip in VIP
      const neonGeo = new THREE.BoxGeometry(floorSize, 0.1, 0.1);
      const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
      const neonStrip = new THREE.Mesh(neonGeo, neonMat);
      neonStrip.position.set(0, wallHeight - 1, -floorSize / 2 + 0.3);
      roomGroup.add(neonStrip);
    } else if (selectedRoom === "terrace") {
      // Add a modern wooden fence/railing for terrace
      const postGeo = new THREE.BoxGeometry(0.3, 2.5, 0.3);
      const railGeo = new THREE.BoxGeometry(floorSize, 0.2, 0.3);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x482d1f, roughness: 0.8 });

      // Back railing
      const backRail = new THREE.Mesh(railGeo, woodMat);
      backRail.position.set(0, 2.2, -floorSize / 2 + 0.3);
      roomGroup.add(backRail);

      for (let i = -10; i <= 10; i++) {
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(i * (floorSize / 20), 1.25, -floorSize / 2 + 0.3);
        post.castShadow = true;
        roomGroup.add(post);
      }

      // Add hanging string lights
      const stringGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
      for (let x = -15; x <= 15; x += 3) {
        const bulb = new THREE.Mesh(stringGeo, bulbMat);
        bulb.position.set(x, 6, -10 + Math.sin(x) * 0.5);
        roomGroup.add(bulb);
      }
    } else {
      // Main room: modern large panoramic glowing windows
      const windowFrameGeo = new THREE.BoxGeometry(8, 4, 0.2);
      const windowGlassGeo = new THREE.BoxGeometry(7.8, 3.8, 0.1);
      
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x111317, metalness: 0.5 });
      const glassMat = new THREE.MeshBasicMaterial({ 
        color: timeOfDay === "day" ? 0x90caf9 : timeOfDay === "sunset" ? 0xffb74d : 0xab47bc 
      });

      const winGroup = new THREE.Group();
      const frame = new THREE.Mesh(windowFrameGeo, frameMat);
      const glass = new THREE.Mesh(windowGlassGeo, glassMat);
      glass.position.z = 0.05;
      winGroup.add(frame, glass);

      winGroup.position.set(-10, 3.5, -floorSize / 2 + 0.3);
      roomGroup.add(winGroup);

      const win2 = winGroup.clone();
      win2.position.set(10, 3.5, -floorSize / 2 + 0.3);
      roomGroup.add(win2);
    }
  }, [selectedRoom, timeOfDay]);

  // 3. Build Tables & Chairs when props change
  useEffect(() => {
    const tableGroup = tableMeshesGroupRef.current;
    if (!tableGroup) return;

    // Clear previous tables
    while (tableGroup.children.length > 0) {
      const child = tableGroup.children[0];
      tableGroup.remove(child);
    }

    // Material library
    const woodTabletopMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.4 });
    const glassTabletopMat = new THREE.MeshStandardMaterial({ color: 0x11151a, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
    const vipGoldTabletopMat = new THREE.MeshStandardMaterial({ color: 0x1e212b, metalness: 0.8, roughness: 0.15 });
    const leatherChairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
    const vipRedChairMat = new THREE.MeshStandardMaterial({ color: 0x500d11, roughness: 0.4 });
    const metalLegMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.9, roughness: 0.1 });
    const selectedOutlineMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true });

    // Status beacon light materials
    const beaconGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const beaconPostGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
    
    const availableBeaconMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const bookedBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const selectedBeaconMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const matchBeaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    activeRoomTables.forEach((table) => {
      const isBooked = bookedTableIds.includes(table.id);
      const isSelected = selectedTables?.some(st => st.id === table.id) || selectedTable?.id === table.id;
      
      const cleanQuery = tableSearchQuery.trim().toLowerCase().replace(/(столик|стол|table|طاولة|طاوله|սեղան|№|#)/g, "").trim();
      const isMatch = cleanQuery !== "" && table.number.toString().includes(cleanQuery);
      const matchesActiveFilters = 
        (partySizeFilter === 0 || table.capacity >= partySizeFilter) &&
        (tableTypeFilter === "all" || table.type === tableTypeFilter);

      // Convert SVG relative coords (800x400) to 3D coords centered around origin
      // Center of room is at x=0, z=0
      const x3D = (table.x + table.width / 2 - 350) * 0.055;
      const z3D = (table.y + table.height / 2 - 200) * 0.055;
      
      const singleTableGroup = new THREE.Group();
      singleTableGroup.position.set(x3D, 0, z3D);
      singleTableGroup.userData = { table };

      // Apply filter matching opacity
      if (!matchesActiveFilters) {
        singleTableGroup.visible = false;
      }

      if (showAvailableOnly && isBooked) {
        singleTableGroup.visible = false;
      }

      // Dim non-searched tables if a query is entered
      let groupOpacity = 1;
      if (cleanQuery !== "" && !isMatch) {
        groupOpacity = 0.18;
      }

      // Add a spinning ring around selected table
      const ringGeo = new THREE.TorusGeometry(1.6, 0.08, 6, 24);
      const selectionRing = new THREE.Mesh(ringGeo, selectedOutlineMat);
      selectionRing.name = "selectionRing";
      selectionRing.rotation.x = Math.PI / 2;
      selectionRing.position.y = 0.05;
      selectionRing.visible = isSelected;
      singleTableGroup.add(selectionRing);

      // A. Table top geometries
      let tabletopGeo: THREE.BufferGeometry;
      let tabletopMat: THREE.Material;
      const h3D = 1.0; // Height of table top in 3D

      const r3D = (table.width / 2) * 0.05; // radius
      const w3D = table.width * 0.055;
      const d3D = table.height * 0.055;

      if (table.shape === "circle") {
        tabletopGeo = new THREE.CylinderGeometry(r3D, r3D, 0.15, 24);
      } else {
        tabletopGeo = new THREE.BoxGeometry(w3D, 0.15, d3D);
      }

      // Assign tabletop material
      if (table.room === "vip") {
        tabletopMat = vipGoldTabletopMat;
      } else if (table.type === "window") {
        tabletopMat = glassTabletopMat;
      } else {
        tabletopMat = woodTabletopMat;
      }

      const tabletopMesh = new THREE.Mesh(tabletopGeo, tabletopMat);
      tabletopMesh.position.y = h3D;
      tabletopMesh.castShadow = true;
      tabletopMesh.receiveShadow = true;
      singleTableGroup.add(tabletopMesh);

      // B. Table Leg / Pedestal
      const legGeo = new THREE.CylinderGeometry(0.12, 0.18, h3D, 12);
      const legMesh = new THREE.Mesh(legGeo, metalLegMat);
      legMesh.position.y = h3D / 2;
      legMesh.castShadow = true;
      singleTableGroup.add(legMesh);

      // C. Base support plate
      const supportGeo = new THREE.CylinderGeometry(r3D * 0.6, r3D * 0.7, 0.05, 12);
      const supportMesh = new THREE.Mesh(supportGeo, metalLegMat);
      supportMesh.position.y = 0.025;
      singleTableGroup.add(supportMesh);

      // D. Chairs around table based on capacity
      const chairRadius = r3D + 0.35;
      const chairCount = table.capacity;
      const chairWidth = 0.4;
      const chairHeight = 0.6;

      for (let i = 0; i < chairCount; i++) {
        const angle = (i / chairCount) * Math.PI * 2;
        const cx = Math.cos(angle) * chairRadius;
        const cz = Math.sin(angle) * chairRadius;

        const chairGroup = new THREE.Group();
        chairGroup.position.set(cx, 0, cz);
        chairGroup.rotation.y = -angle + Math.PI / 2; // Face toward table center

        // Seat
        const seatGeo = new THREE.BoxGeometry(chairWidth, 0.1, chairWidth);
        const seatMat = table.room === "vip" ? vipRedChairMat : leatherChairMat;
        const seatMesh = new THREE.Mesh(seatGeo, seatMat);
        seatMesh.position.y = 0.5; // Seat height
        seatMesh.castShadow = true;
        chairGroup.add(seatMesh);

        // Backrest
        const backGeo = new THREE.BoxGeometry(chairWidth, chairHeight, 0.08);
        const backMesh = new THREE.Mesh(backGeo, seatMat);
        backMesh.position.set(0, 0.5 + chairHeight / 2, -chairWidth / 2 + 0.04);
        backMesh.castShadow = true;
        chairGroup.add(backMesh);

        // Legs
        const chairLegGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6);
        for (let xOffset of [-1, 1]) {
          for (let zOffset of [-1, 1]) {
            const leg = new THREE.Mesh(chairLegGeo, metalLegMat);
            leg.position.set(xOffset * (chairWidth / 2.3), 0.25, zOffset * (chairWidth / 2.3));
            leg.castShadow = true;
            chairGroup.add(leg);
          }
        }

        singleTableGroup.add(chairGroup);
      }

      // E. Add Status Indicator Light post (Neon glowing beacon above table)
      const beaconPost = new THREE.Mesh(beaconPostGeo, metalLegMat);
      beaconPost.position.set(0, 0.9, 0);
      beaconPost.castShadow = true;
      singleTableGroup.add(beaconPost);

      let beaconMat = isBooked ? bookedBeaconMat : isSelected ? selectedBeaconMat : isMatch ? matchBeaconMat : availableBeaconMat;
      const beaconLightMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconLightMesh.name = "statusLight";
      beaconLightMesh.position.set(0, 1.8, 0);
      singleTableGroup.add(beaconLightMesh);

      // Add a tiny glowing point light inside available / selected table beacons for atmosphere
      if (!isBooked && (isSelected || isMatch)) {
        const glowColor = isSelected ? 0x3b82f6 : isMatch ? 0xf59e0b : 0x10b981;
        const pointLight = new THREE.PointLight(glowColor, 0.5, 3);
        pointLight.position.set(0, 1.8, 0);
        singleTableGroup.add(pointLight);
      }

      // Apply opacity to the entire group
      singleTableGroup.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.material = node.material.clone();
          node.material.transparent = true;
          node.material.opacity = (node.material.opacity || 1) * groupOpacity;
        }
      });

      tableGroup.add(singleTableGroup);
    });
  }, [activeRoomTables, bookedTableIds, selectedTable, selectedTables, tableSearchQuery, partySizeFilter, tableTypeFilter, showAvailableOnly]);

  return (
    <div className="relative w-full h-full flex flex-col select-none" ref={containerRef}>
      {/* 3D Action Floating Panel */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
        <div className="flex bg-[#0F1115]/95 backdrop-blur-md border border-white/10 rounded-2xl p-1 gap-1 shadow-lg">
          <button
            type="button"
            onClick={() => setTimeOfDay("day")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              timeOfDay === "day"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/10"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            {t("tabletop.day")}
          </button>
          <button
            type="button"
            onClick={() => setTimeOfDay("sunset")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              timeOfDay === "sunset"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t("tabletop.sunset")}
          </button>
          <button
            type="button"
            onClick={() => setTimeOfDay("neon_night")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              timeOfDay === "neon_night"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            {t("tabletop.neon")}
          </button>
        </div>

        <div className="flex bg-[#0F1115]/95 backdrop-blur-md border border-white/10 rounded-2xl p-1 shadow-lg">
          <button
            type="button"
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              showAvailableOnly
                ? "bg-teal-500 text-black shadow-md shadow-teal-500/10 font-bold"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {showAvailableOnly ? <EyeOff className="w-3.5 h-3.5 text-teal-400" /> : <Eye className="w-3.5 h-3.5" />}
            {i18n.language === "ru" 
              ? "Только свободные" 
              : i18n.language === "ar" 
                ? "المتاحة فقط" 
                : i18n.language === "hy"
                  ? "Միայն ազատները"
                  : "Show available only"}
          </button>
        </div>
      </div>

      {/* Interactive Helper Hint */}
      {showHelper && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#0F1115]/95 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl max-w-xs transition-opacity duration-500 flex gap-2.5 items-start">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl">
            <Rotate3d className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="flex-1">
            <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">{t("tabletop.nav3d")}</h5>
            <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">
              {t("tabletop.navHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHelper(false)}
            className="text-white/30 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating 3D Details Overlay / Legend */}
      <div className="absolute top-4 right-4 z-10 bg-[#0F1115]/95 backdrop-blur-md border border-white/10 px-3.5 py-3 rounded-2xl shadow-xl flex flex-col gap-2.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-white/40 uppercase tracking-widest font-mono text-[9px]">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          {t("tabletop.statusLegend")}
        </div>
        <div className="space-y-1.5 font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400 shadow-md shadow-emerald-500/20" />
            <span className="text-white/80">{t("tabletop.available")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-400 shadow-md shadow-rose-500/20 animate-pulse" />
            <span className="text-white/80">{t("tabletop.booked")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400 shadow-md shadow-amber-500/20 animate-bounce" />
            <span className="text-white/80">{t("tabletop.foundInSearch")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f3ff] border border-[#00f3ff] shadow-md shadow-cyan-500/20 animate-pulse" />
            <span className="text-teal-400">{t("tabletop.yourChoice")}</span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas element */}
      <div className="w-full flex-1 min-h-[450px] relative overflow-hidden bg-black/95">
        <canvas ref={canvasRef} className="w-full h-full block touch-none" />

        {/* Cinematic Room Transition Overlay */}
        <AnimatePresence>
          {activeTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 z-30 bg-black/60 pointer-events-none flex items-center justify-center backdrop-blur-[4px]"
            >
              <div className="relative w-full h-full">
                {/* Horizontal high-tech glowing sweep bar */}
                <motion.div
                  initial={{ top: "-10%" }}
                  animate={{ top: "110%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute left-0 w-full h-16 bg-gradient-to-b from-transparent via-teal-400/50 to-transparent blur-md border-y border-teal-400/30"
                />
                
                {/* Micro tech typography indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: [0.92, 1.05, 1], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.6 }}
                    className="px-5 py-2.5 bg-[#0F1115]/95 border border-teal-500/20 rounded-2xl flex items-center gap-2.5 shadow-2xl"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-400 uppercase tracking-widest font-black">
                      {t("tabletop.loadingSpace")}
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time HTML Tooltip positioned above hover target */}
        {hoveredTable && !isOrbiting && (
          <div
            style={{
              position: "absolute",
              left: tooltipPos.x + 15,
              top: tooltipPos.y + 15,
              pointerEvents: "none"
            }}
            className="z-20 bg-[#0F1115]/95 border border-white/15 px-3.5 py-3 rounded-2xl shadow-2xl max-w-xs space-y-2 text-left animate-fade-in text-xs backdrop-blur-md"
          >
            <div className="flex justify-between items-center gap-4">
              <span className="font-display font-black text-white text-sm">{t("tabletop.tableNumber", { n: hoveredTable.number })}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-[9px] uppercase font-bold text-white/50">
                {t(`tabletop.type.${hoveredTable.type === "vip" || hoveredTable.type === "window" || hoveredTable.type === "terrace" ? hoveredTable.type : "standard"}`)}
              </span>
            </div>

            <div className="text-[10px] text-white/50 bg-white/[0.02] border border-white/5 rounded-xl p-2 leading-relaxed">
              {getTableLocationDescription(hoveredTable, i18n.language)}
            </div>
            
            <div className="space-y-1 text-white/60 text-[11px]">
              <div className="flex justify-between">
                <span>{t("tabletop.capacity")}</span>
                <span className="text-white font-bold">{t("tabletop.capacityValue", { count: hoveredTable.capacity })}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("tabletop.deposit")}</span>
                <span className="text-teal-400 font-bold">{hoveredTable.price} ₽</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <span>{t("tabletop.statusLabel")}</span>
                {bookedTableIds.includes(hoveredTable.id) ? (
                  <span className="text-rose-400 font-bold uppercase text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{t("tabletop.occupied")}</span>
                ) : (
                  <span className="text-emerald-400 font-bold uppercase text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">{t("tabletop.free")} <Sparkles className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /></span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
