import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Photorealistic WebGL 3D Motor View for TwinLab X
 * Uses Three.js for physically-based lighting, reflections, authentic dimensions,
 * and high-speed dynamic shaft rotation.
 */
export default function ThreeMotorView({
    type = "motor-dc",
    rot3D = 35,
    pitch3D = 20,
    isSpinning = false,
    rpm = 0,
    accessory = "propeller",
    direction = "cw",
    gearRatio = "1:48"
}) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const shaftGroupRef = useRef(null);
    const modelGroupRef = useRef(null);
    const animFrameRef = useRef(null);

    // Live animation state & dynamic 360° gimbal orientation refs
    const isSpinningRef = useRef(isSpinning);
    const rpmRef = useRef(rpm);
    const dirRef = useRef(direction);
    const rotRef = useRef(rot3D);
    const pitchRef = useRef(pitch3D);

    useEffect(() => {
        isSpinningRef.current = isSpinning;
        rpmRef.current = rpm;
        dirRef.current = direction;
        rotRef.current = rot3D;
        pitchRef.current = pitch3D;
    }, [isSpinning, rpm, direction, rot3D, pitch3D]);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const width = 160;
        const height = 160;

        // 1. Scene & Camera Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 0, 7.8);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        // 2. Realistic Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        // Key light (warm metallic specular)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
        keyLight.position.set(4, 6, 6);
        scene.add(keyLight);

        // Fill light (cool fill for depth)
        const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
        fillLight.position.set(-5, 2, 4);
        scene.add(fillLight);

        // Rim light (highlighting edges)
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
        rimLight.position.set(0, -5, -4);
        scene.add(rimLight);

        // 3. Root Model Group
        const modelGroup = new THREE.Group();
        scene.add(modelGroup);
        modelGroupRef.current = modelGroup;

        // Shaft / Rotor Group (Spins dynamically)
        const shaftGroup = new THREE.Group();
        shaftGroupRef.current = shaftGroup;

        // ============================================================
        // BUILD HARDWARE MODELS ACCORDING TO TYPE
        // ============================================================
        if (type === "motor-dc") {
            // --------------------------------------------------------
            // MABUCHI 130 DC MOTOR (Authentic Brushed Steel Canister)
            // --------------------------------------------------------
            const steelMaterial = new THREE.MeshStandardMaterial({
                color: 0xd4d4d8,
                metalness: 0.88,
                roughness: 0.22
            });

            const zincCollarMaterial = new THREE.MeshStandardMaterial({
                color: 0xe4e4e7,
                metalness: 0.75,
                roughness: 0.3
            });

            const bronzeBushingMaterial = new THREE.MeshStandardMaterial({
                color: 0xd97706,
                metalness: 0.85,
                roughness: 0.35
            });

            const chromeAxleMaterial = new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                metalness: 0.95,
                roughness: 0.1
            });

            const rearNylonMaterial = new THREE.MeshStandardMaterial({
                color: 0x18181b,
                roughness: 0.85,
                metalness: 0.1
            });

            const brassTabMaterial = new THREE.MeshStandardMaterial({
                color: 0xf59e0b,
                metalness: 0.9,
                roughness: 0.25
            });

            // Cylindrical Steel Canister
            const canGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.6, 32);
            const canMesh = new THREE.Mesh(canGeo, steelMaterial);
            canMesh.rotation.x = Math.PI / 2;
            modelGroup.add(canMesh);

            // Stamped Curved Side Louvers (Recessed dark slots)
            const louverGeo = new THREE.BoxGeometry(0.12, 0.8, 0.45);
            const louverMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
            const louverLeft = new THREE.Mesh(louverGeo, louverMat);
            louverLeft.position.set(-1.36, 0, 0);
            modelGroup.add(louverLeft);

            const louverRight = new THREE.Mesh(louverGeo, louverMat);
            louverRight.position.set(1.36, 0, 0);
            modelGroup.add(louverRight);

            // Front Zinc Collar (Bearing Boss)
            const collarGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.25, 32);
            const collarMesh = new THREE.Mesh(collarGeo, zincCollarMaterial);
            collarMesh.rotation.x = Math.PI / 2;
            collarMesh.position.set(0, 0, 1.42);
            modelGroup.add(collarMesh);

            // Sintered Bronze Bushing Ring
            const bushingGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.28, 24);
            const bushingMesh = new THREE.Mesh(bushingGeo, bronzeBushingMaterial);
            bushingMesh.rotation.x = Math.PI / 2;
            bushingMesh.position.set(0, 0, 1.43);
            modelGroup.add(bushingMesh);

            // Two Threaded M2 Screw Holes on front face
            const screwHoleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12);
            const screwHoleMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
            const holeL = new THREE.Mesh(screwHoleGeo, screwHoleMat);
            holeL.rotation.x = Math.PI / 2;
            holeL.position.set(-0.85, 0, 1.32);
            modelGroup.add(holeL);

            const holeR = new THREE.Mesh(screwHoleGeo, screwHoleMat);
            holeR.rotation.x = Math.PI / 2;
            holeR.position.set(0.85, 0, 1.32);
            modelGroup.add(holeR);

            // Rear Nylon Molded Endbell
            const endbellGeo = new THREE.CylinderGeometry(1.32, 1.32, 0.35, 32);
            const endbellMesh = new THREE.Mesh(endbellGeo, rearNylonMaterial);
            endbellMesh.rotation.x = Math.PI / 2;
            endbellMesh.position.set(0, 0, -1.45);
            modelGroup.add(endbellMesh);

            // Brass Solder Terminals on Endbell
            const tabGeo = new THREE.BoxGeometry(0.25, 0.45, 0.06);
            const tabPos = new THREE.Mesh(tabGeo, brassTabMaterial);
            tabPos.position.set(-0.65, 0, -1.65);
            modelGroup.add(tabPos);

            const tabNeg = new THREE.BoxGeometry(0.25, 0.45, 0.06);
            const tabNegMesh = new THREE.Mesh(tabNeg, brassTabMaterial);
            tabNegMesh.position.set(0.65, 0, -1.65);
            modelGroup.add(tabNegMesh);

            // Shaft Assembly (Axle + Propeller)
            shaftGroup.position.set(0, 0, 1.3);

            // Hardened Steel Axle Rod
            const axleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 16);
            const axleMesh = new THREE.Mesh(axleGeo, chromeAxleMaterial);
            axleMesh.rotation.x = Math.PI / 2;
            axleMesh.position.set(0, 0, 0.75);
            shaftGroup.add(axleMesh);

            // 3-Blade Aerofoil Aviation Propeller
            if (accessory === "propeller") {
                const propMaterial = new THREE.MeshStandardMaterial({
                    color: 0x0284c7,
                    roughness: 0.25,
                    metalness: 0.15
                });

                const propGroup = new THREE.Group();
                propGroup.position.set(0, 0, 1.3);

                // Spinner Nose Cone
                const coneGeo = new THREE.ConeGeometry(0.35, 0.6, 24);
                const coneMesh = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.2 }));
                coneMesh.rotation.x = Math.PI / 2;
                coneMesh.position.set(0, 0, 0.2);
                propGroup.add(coneMesh);

                // 3 Curved Blades
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2) / 3;
                    const bladeGeo = new THREE.BoxGeometry(0.28, 1.45, 0.06);
                    const bladeMesh = new THREE.Mesh(bladeGeo, propMaterial);
                    bladeMesh.position.set(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, 0);
                    bladeMesh.rotation.z = angle + 0.25;
                    bladeMesh.rotation.y = 0.3; // pitch angle
                    propGroup.add(bladeMesh);
                }

                shaftGroup.add(propGroup);
            }

            modelGroup.add(shaftGroup);

        } else {
            // --------------------------------------------------------
            // TT BO GEARED DC MOTOR (Yellow ABS Gearbox + D-Shaft)
            // --------------------------------------------------------
            const yellowAbsMaterial = new THREE.MeshStandardMaterial({
                color: 0xfacc15,
                roughness: 0.38,
                metalness: 0.04
            });

            const nylonShaftMaterial = new THREE.MeshStandardMaterial({
                color: 0xf8fafc,
                roughness: 0.45,
                metalness: 0.05
            });

            const clearStrapMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transmission: 0.65,
                opacity: 0.75,
                transparent: true,
                roughness: 0.15,
                ior: 1.45
            });

            const silverCanMaterial = new THREE.MeshStandardMaterial({
                color: 0xcfd8dc,
                metalness: 0.85,
                roughness: 0.25
            });

            // Yellow ABS Gearbox Enclosure (Proportioned according to real TT Motor)
            const gbGeo = new THREE.BoxGeometry(1.6, 2.5, 1.2);
            const gbMesh = new THREE.Mesh(gbGeo, yellowAbsMaterial);
            gbMesh.position.set(0, 0.45, 0);
            modelGroup.add(gbMesh);

            // Output Shaft Boss Collar
            const bossGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 24);
            const bossMesh = new THREE.Mesh(bossGeo, yellowAbsMaterial);
            bossMesh.rotation.x = Math.PI / 2;
            bossMesh.position.set(0, 0.75, 0.65);
            modelGroup.add(bossMesh);

            // Assembly Screws on Gearbox
            const screwMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
            const sGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 12);

            [
                [-0.65, 1.5, 0.6],
                [0.65, 1.5, 0.6],
                [0.65, -0.6, 0.6]
            ].forEach(([sx, sy, sz]) => {
                const sm = new THREE.Mesh(sGeo, screwMat);
                sm.rotation.x = Math.PI / 2;
                sm.position.set(sx, sy, sz);
                modelGroup.add(sm);
            });

            // Rear 130 DC Motor Casing
            const rearCanGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 24);
            const rearCanMesh = new THREE.Mesh(rearCanGeo, silverCanMaterial);
            rearCanMesh.position.set(0, -1.2, 0);
            modelGroup.add(rearCanMesh);

            // Clear Plastic Retention Strap holding rear motor
            const strapGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.55, 24);
            const strapMesh = new THREE.Mesh(strapGeo, clearStrapMaterial);
            strapMesh.position.set(0, -0.95, 0);
            modelGroup.add(strapMesh);

            // Rear White Nylon Endbell with Solder Tabs
            const endGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.25, 24);
            const endMesh = new THREE.Mesh(endGeo, new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 }));
            endMesh.position.set(0, -2.1, 0);
            modelGroup.add(endMesh);

            const tabMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
            const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.05), tabMat);
            t1.position.set(-0.35, -2.25, 0);
            modelGroup.add(t1);

            const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.05), tabMat);
            t2.position.set(0.35, -2.25, 0);
            modelGroup.add(t2);

            // White Nylon D-Shaft Assembly
            shaftGroup.position.set(0, 0.75, 0.75);

            // D-Shaft Cylinder with Flat Keyways
            const dShaftGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.95, 16);
            const dShaftMesh = new THREE.Mesh(dShaftGeo, nylonShaftMaterial);
            dShaftMesh.rotation.x = Math.PI / 2;
            dShaftMesh.position.set(0, 0, 0.45);
            shaftGroup.add(dShaftMesh);

            // High-Contrast Slotted Optical Encoder Speed Disc & Indicator Arms
            // Makes TT motor rotation instantly obvious from any viewing angle
            const discMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
            const discGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.08, 24);
            const discMesh = new THREE.Mesh(discGeo, discMat);
            discMesh.rotation.x = Math.PI / 2;
            discMesh.position.set(0, 0, 0.65);
            shaftGroup.add(discMesh);

            // High-visibility neon orange cross indicator arms
            const armMat = new THREE.MeshStandardMaterial({ 
                color: 0xf97316, 
                roughness: 0.3,
                emissive: 0xea580c,
                emissiveIntensity: 0.25
            });
            const arm1 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 0.1), armMat);
            arm1.position.set(0, 0, 0.7);
            shaftGroup.add(arm1);

            const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.35, 0.1), armMat);
            arm2.position.set(0, 0, 0.7);
            shaftGroup.add(arm2);

            // Tip indicator marker dot (neon yellow)
            const tipMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.6 });
            const tipDot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 12), tipMat);
            tipDot.rotation.x = Math.PI / 2;
            tipDot.position.set(0.58, 0, 0.72);
            shaftGroup.add(tipDot);

            // Central mounting hub screw
            const hubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12);
            const hubMesh = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 }));
            hubMesh.rotation.x = Math.PI / 2;
            hubMesh.position.set(0, 0, 0.75);
            shaftGroup.add(hubMesh);

            modelGroup.add(shaftGroup);
        }

        // 4. Render & Dynamic Animation Loop
        let lastTime = performance.now();
        let liveSpeedRpm = 0;

        const renderLoop = (time) => {
            animFrameRef.current = requestAnimationFrame(renderLoop);
            const delta = (time - lastTime) / 1000;
            lastTime = time;

            // Apply live gimbal yaw & pitch from refs
            const curRot = (rotRef.current != null ? rotRef.current : 35) * (Math.PI / 180);
            const curPitch = (pitchRef.current != null ? pitchRef.current : 20) * (Math.PI / 180);

            modelGroup.rotation.y = curRot;
            modelGroup.rotation.x = curPitch;

            // Physical rotor inertia spin-up: starts slow, accelerates smoothly, coasts down on stop!
            const targetRpm = isSpinningRef.current 
                ? (rpmRef.current > 0 ? rpmRef.current : (type === "motor-geared" ? 220 : 12500)) 
                : 0;

            const accelRate = liveSpeedRpm < targetRpm ? 2.5 : 2.0;
            liveSpeedRpm += (targetRpm - liveSpeedRpm) * Math.min(1, delta * accelRate);

            if (shaftGroupRef.current && liveSpeedRpm > 0.5) {
                const rps = liveSpeedRpm / 60;
                const sign = dirRef.current === "ccw" ? -1 : 1;
                // Rotation along Z axis (shaft direction)
                shaftGroupRef.current.rotation.z += sign * rps * Math.PI * 2 * delta;
            }

            renderer.render(scene, camera);
        };

        animFrameRef.current = requestAnimationFrame(renderLoop);

        // Cleanup
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (rendererRef.current) {
                rendererRef.current.dispose();
                if (container && rendererRef.current.domElement && container.contains(rendererRef.current.domElement)) {
                    container.removeChild(rendererRef.current.domElement);
                }
            }
        };
    }, [type, accessory]);

    return (
        <div 
            ref={mountRef} 
            className="three-motor-mount" 
            style={{ 
                width: 160, 
                height: 160, 
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }} 
        />
    );
}
