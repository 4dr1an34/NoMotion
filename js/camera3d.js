/* ==========================================================================
   NOMOTION MODEL 100 — ULTRA-PRECISION 3D STUDIO VIEWER
   Fotorealistisches prozedurales Three.js 3D-Kameramodell mit PBR-Materialien,
   Studio-Softbox-Reflexionen, stufenloser 360°-Orbit-Physik & Fallback-Engine.
   ========================================================================== */

(function () {
    'use strict';

    /* --------------------------------------------------------------------------
       Exakte Dimensionen & Presets (Einheiten: mm, Korpus 62 × 124 × 21)
       -------------------------------------------------------------------------- */
    const BODY = { W: 62, H: 124, D: 21, R: 14, Fillet: 2.2 };
    const FRONT_Z = BODY.D / 2;
    const REAR_Z = -BODY.D / 2;

    const PRESETS = [
        { label: 'FRONT', az: 0, pol: 90, dist: 310 },
        { label: 'ISOMETRIC 45°', az: 38, pol: 62, dist: 330 },
        { label: 'PROFILE 90°', az: 90, pol: 90, dist: 300 },
        { label: 'REAR 180°', az: 180, pol: 90, dist: 310 },
        { label: 'LOW HERO 225°', az: -138, pol: 106, dist: 300 },
        { label: 'TOP // DIAL', az: 20, pol: 16, dist: 320 },
        { label: 'BTM // MOUNT', az: -20, pol: 164, dist: 320 }
    ];

    const cameraAngleImages = [
        { img: 'assets/images/camera_01_front_transparent.png', deg: '000° // FRONT' },
        { img: 'assets/images/camera_05_isometric_transparent.png', deg: '045° // ISOMETRIC' },
        { img: 'assets/images/camera_04_side_transparent.png', deg: '090° // PROFILE' },
        { img: 'assets/images/camera_02_rear_transparent.png', deg: '180° // REAR' },
        { img: 'assets/images/camera_06_low_hero_transparent.png', deg: '225° // LOW HERO' },
        { img: 'assets/images/camera_03_top_transparent.png', deg: '030° // TOP // DIAL' },
        { img: 'assets/images/camera_10_bottom_transparent.png', deg: '330° // BTM // MOUNT' }
    ];

    /* --------------------------------------------------------------------------
       Canvas Texture Generatoren (Präzise Vektor-Gravuren & Monitor-HUD)
       -------------------------------------------------------------------------- */
    function makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    function canvasTexture(canvas) {
        if (typeof THREE === 'undefined') return null;
        const tex = new THREE.CanvasTexture(canvas);
        if (THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
        }
        tex.anisotropy = 8;
        return tex;
    }

    function drawTrackedText(ctx, text, cx, cy, letterSpacing) {
        const chars = [...text];
        const widths = chars.map(ch => ctx.measureText(ch).width);
        const total = widths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(chars.length - 1, 0);
        let x = cx - total / 2;
        ctx.textAlign = 'left';
        chars.forEach((ch, i) => {
            ctx.fillText(ch, x, cy);
            x += widths[i] + letterSpacing;
        });
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    /* Front-Beschriftung ("MINIMALIST / SERIES 1 / 18mm f/2.0") */
    function makeBrandTexture() {
        const c = makeCanvas(1024, 512);
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 1024, 512);
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(100, 92, 78, 0.88)';
        ctx.font = '500 86px "Helvetica Neue", Arial, sans-serif';
        drawTrackedText(ctx, 'MINIMALIST', 512, 195, 28);

        ctx.fillStyle = 'rgba(120, 112, 98, 0.78)';
        ctx.font = '400 42px "Helvetica Neue", Arial, sans-serif';
        drawTrackedText(ctx, 'SERIES 1 / 18mm f/2.0', 512, 335, 10);
        return canvasTexture(c);
    }

    /* Rändelrad: Konzentrische CNC-Drehstruktur & Mittenmulde */
    function makeDialFaceTexture() {
        const s = 512;
        const c = makeCanvas(s, s);
        const ctx = c.getContext('2d');
        const cx = s / 2;

        ctx.fillStyle = '#d6cbba';
        ctx.fillRect(0, 0, s, s);

        // Feine radiale Drehriefen
        for (let i = 0; i < 900; i++) {
            const a = (i / 900) * Math.PI * 2;
            ctx.strokeStyle = `rgba(${110 + Math.random() * 40 | 0}, ${100 + Math.random() * 35 | 0}, ${80 + Math.random() * 30 | 0}, 0.14)`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * 36, cx + Math.sin(a) * 36);
            ctx.lineTo(cx + Math.cos(a) * s / 2, cx + Math.sin(a) * s / 2);
            ctx.stroke();
        }

        // Konzentrische Drehringe
        for (let r = 40; r < s / 2; r += 5) {
            ctx.strokeStyle = r % 10 === 0 ? 'rgba(90,82,65,0.28)' : 'rgba(255,252,245,0.35)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(cx, cx, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Vertiefte Mittenmulde (Concave Center Dish)
        const g = ctx.createRadialGradient(cx, cx, 4, cx, cx, 68);
        g.addColorStop(0, '#9e9177');
        g.addColorStop(0.5, '#b9ad94');
        g.addColorStop(0.9, '#d6cbba');
        g.addColorStop(1, '#ebe2d2');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cx, 68, 0, Math.PI * 2);
        ctx.fill();

        return canvasTexture(c);
    }

    /* Rückseite: Monitor OLED Glass & Live-Kamera-Telemetry */
    function makeScreenTexture() {
        const w = 640, h = 900;
        const c = makeCanvas(w, h);
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#0a0a0c';
        roundRect(ctx, 0, 0, w, h, 36);
        ctx.fill();

        const sx = 20, sy = 20, sw = w - 40, sh = h - 40;
        const g = ctx.createLinearGradient(0, sy, 0, sy + sh);
        g.addColorStop(0, '#060608');
        g.addColorStop(0.5, '#0d0d12');
        g.addColorStop(1, '#050507');
        ctx.fillStyle = g;
        roundRect(ctx, sx, sy, sw, sh, 22);
        ctx.fill();

        ctx.save();
        roundRect(ctx, sx, sy, sw, sh, 22);
        ctx.clip();

        // Subtiler Glas-Glanz
        const sheen = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
        sheen.addColorStop(0, 'rgba(160,170,210,0.09)');
        sheen.addColorStop(0.4, 'rgba(0,0,0,0)');
        sheen.addColorStop(1, 'rgba(110,105,130,0.06)');
        ctx.fillStyle = sheen;
        ctx.fillRect(sx, sy, sw, sh);

        // Header: REC-Punkt & 4K RAW
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e8453c';
        ctx.beginPath();
        ctx.arc(sx + 40, sy + 48, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(245,245,250,0.88)';
        ctx.font = '600 26px "Helvetica Neue", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('REC 00:04:17', sx + 62, sy + 49);
        ctx.textAlign = 'right';
        ctx.fillText('RAW  4K•60p', sx + sw - 32, sy + 49);

        // 3x3 Cinema-Gitter
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1.5;
        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(sx + (sw / 3) * i, sy + 95);
            ctx.lineTo(sx + (sw / 3) * i, sy + sh - 110);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx + 25, sy + 95 + ((sh - 205) / 3) * i);
            ctx.lineTo(sx + sw - 25, sy + 95 + ((sh - 205) / 3) * i);
            ctx.stroke();
        }

        // Amber Fokus-Fadenkreuz
        ctx.strokeStyle = 'rgba(229,169,60,0.85)';
        ctx.lineWidth = 3;
        const fx = w / 2, fy = h / 2 - 15, fs = 60;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(fx + dx * fs, fy + dy * fs - dy * 20);
            ctx.lineTo(fx + dx * fs, fy + dy * fs);
            ctx.lineTo(fx + dx * fs - dx * 20, fy + dy * fs);
            ctx.stroke();
        });
        ctx.fillStyle = 'rgba(229,169,60,0.95)';
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 14-Balken-Histogramm
        ctx.fillStyle = 'rgba(235,235,245,0.2)';
        const bars = [16, 32, 54, 82, 62, 44, 58, 86, 68, 48, 36, 26, 18, 14];
        bars.forEach((bh, i) => {
            ctx.fillRect(sx + 32 + i * 16, sy + sh - 150 - bh, 10, bh);
        });

        // Footer-Belichtungs-Werte
        ctx.fillStyle = 'rgba(240,240,245,0.82)';
        ctx.font = '500 28px "Helvetica Neue", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('f/2.0  1/48', sx + 32, sy + sh - 58);
        ctx.textAlign = 'right';
        ctx.fillText('ISO 800  5600K', sx + sw - 32, sy + sh - 58);

        // "designed by noMotion"
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '400 22px "Helvetica Neue", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('designed by noMotion', w / 2, h - 14);

        ctx.restore();
        return canvasTexture(c);
    }

    /* Rückseite: D-Pad Vektor-Pfeile & Beschriftung */
    function makeDPadTexture() {
        const s = 512;
        const c = makeCanvas(s, s);
        const ctx = c.getContext('2d');
        const cx = s / 2;

        ctx.fillStyle = '#d6cbba';
        ctx.fillRect(0, 0, s, s);

        ctx.fillStyle = 'rgba(100, 92, 78, 0.9)';
        const r = 160;

        // Pfeil Oben ▲
        ctx.beginPath();
        ctx.moveTo(cx, cx - r);
        ctx.lineTo(cx - 24, cx - r + 38);
        ctx.lineTo(cx + 24, cx - r + 38);
        ctx.fill();

        // Pfeil Unten ▼
        ctx.beginPath();
        ctx.moveTo(cx, cx + r);
        ctx.lineTo(cx - 24, cx + r - 38);
        ctx.lineTo(cx + 24, cx + r - 38);
        ctx.fill();

        // Pfeil Links ◄
        ctx.beginPath();
        ctx.moveTo(cx - r, cx);
        ctx.lineTo(cx - r + 38, cx - 24);
        ctx.lineTo(cx - r + 38, cx + 24);
        ctx.fill();

        // Pfeil Rechts ►
        ctx.beginPath();
        ctx.moveTo(cx + r, cx);
        ctx.lineTo(cx + r - 38, cx - 24);
        ctx.lineTo(cx + r - 38, cx + 24);
        ctx.fill();

        // Konzentrische Eloxal-Textur
        for (let rad = 30; rad < s / 2; rad += 6) {
            ctx.strokeStyle = rad % 12 === 0 ? 'rgba(90,82,65,0.22)' : 'rgba(255,252,245,0.28)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cx, rad, 0, Math.PI * 2);
            ctx.stroke();
        }

        return canvasTexture(c);
    }

    function makeLabelTexture(text, px, color, spacing) {
        const pad = 30;
        const probe = makeCanvas(10, 10).getContext('2d');
        probe.font = `600 ${px}px "Helvetica Neue", Arial, sans-serif`;
        let width = 0;
        for (const ch of text) width += probe.measureText(ch).width + spacing;
        const c = makeCanvas(Math.ceil(width + pad * 2), px * 2 + pad);
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.font = `600 ${px}px "Helvetica Neue", Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        drawTrackedText(ctx, text, c.width / 2, c.height / 2, spacing);
        return { texture: canvasTexture(c), aspect: c.width / c.height };
    }

    /* Unterseite: Lasergravuren & Akkufach */
    function makeBottomTexture() {
        const s = 1024;
        const c = makeCanvas(s, s);
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, s, s);
        ctx.textBaseline = 'middle';

        const lines = [
            ['MODEL: MNMT-C1', 280, '500 42px'],
            ['SERIAL NO: 2311A00456', 352, '500 42px'],
            ['FCC  CE  ⏚', 430, '700 48px'],
            ['MADE IN JAPAN', 506, '500 42px'],
            ['5V/1A USB-C POWER', 578, '500 42px'],
            ['1/4" TRIPOD MOUNT', 650, '500 42px']
        ];
        lines.forEach(([txt, y, font]) => {
            ctx.font = `${font} "Helvetica Neue", Arial, sans-serif`;
            ctx.fillStyle = 'rgba(100, 92, 78, 0.95)';
            drawTrackedText(ctx, txt, s / 2, y, 4);
        });

        // Akkufach
        ctx.strokeStyle = 'rgba(100, 92, 78, 0.85)';
        ctx.lineWidth = 5;
        roundRect(ctx, s / 2 - 200, 720, 400, 220, 36);
        ctx.stroke();

        ctx.font = '600 36px "Helvetica Neue", Arial, sans-serif';
        ctx.fillStyle = 'rgba(100, 92, 78, 0.9)';
        drawTrackedText(ctx, 'OPEN', s / 2 - 110, 830, 3);
        drawTrackedText(ctx, 'LOCK ▶', s / 2 + 110, 830, 3);

        return canvasTexture(c);
    }

    /* Prozedurale Studio-Softbox-Umgebungstextur */
    function makeStudioEnvironmentTexture() {
        const w = 1024, h = 512;
        const c = makeCanvas(w, h);
        const ctx = c.getContext('2d');

        // Sanfter Studio-Hintergrundverlauf
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#f2efe9');
        bg.addColorStop(0.5, '#e4ded4');
        bg.addColorStop(1, '#c8c0b2');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Overhead Softbox
        const softboxTop = ctx.createRadialGradient(w * 0.5, 80, 10, w * 0.5, 80, 200);
        softboxTop.addColorStop(0, 'rgba(255, 255, 255, 1)');
        softboxTop.addColorStop(0.4, 'rgba(255, 250, 240, 0.7)');
        softboxTop.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = softboxTop;
        ctx.fillRect(0, 0, w, 240);

        // Linke Vertikal-Softbox (Highlight Streifen)
        const leftBank = ctx.createLinearGradient(w * 0.15, 0, w * 0.28, 0);
        leftBank.addColorStop(0, 'rgba(255, 255, 255, 0)');
        leftBank.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
        leftBank.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = leftBank;
        ctx.fillRect(w * 0.1, 80, w * 0.25, 360);

        // Rechte Vertikal-Softbox (Highlight Streifen)
        const rightBank = ctx.createLinearGradient(w * 0.72, 0, w * 0.85, 0);
        rightBank.addColorStop(0, 'rgba(255, 255, 255, 0)');
        rightBank.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
        rightBank.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = rightBank;
        ctx.fillRect(w * 0.65, 80, w * 0.25, 360);

        const tex = new THREE.CanvasTexture(c);
        tex.mapping = THREE.EquirectangularReflectionMapping;
        return tex;
    }

    /* --------------------------------------------------------------------------
       Geometrie & PBR-Materialien Helfer
       -------------------------------------------------------------------------- */
    function createRoundedBoxGeometry(w, h, d, r, segments) {
        r = Math.min(r, w * 0.46, h * 0.46, d * 0.46);
        const shape = new THREE.Shape();
        const x = -w / 2, y = -h / 2;
        shape.moveTo(x + r, y);
        shape.lineTo(x + w - r, y);
        shape.quadraticCurveTo(x + w, y, x + w, y + r);
        shape.lineTo(x + w, y + h - r);
        shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        shape.lineTo(x + r, y + h);
        shape.quadraticCurveTo(x, y + h, x, y + h - r);
        shape.lineTo(x, y + r);
        shape.quadraticCurveTo(x, y, x + r, y);

        const extrudeSettings = {
            depth: Math.max(0.01, d - r * 2),
            bevelEnabled: true,
            bevelSegments: segments || 4,
            steps: 1,
            bevelSize: r,
            bevelThickness: r
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        return geom;
    }

    function createMaterials() {
        // Authentisches eloxiertes Champagner-Aluminium (Warm Titanium Sand)
        const champagne = new THREE.MeshStandardMaterial({
            color: 0xd6cbb4,
            metalness: 0.70,
            roughness: 0.36
        });

        // Helleres gedrehtes Aluminium für Rändelrad & Auslöser
        const champagneBright = new THREE.MeshStandardMaterial({
            color: 0xe6dcc8,
            metalness: 0.88,
            roughness: 0.20
        });

        // Dunkleres Finish für Kanten & Vertiefungen
        const champagneDark = new THREE.MeshStandardMaterial({
            color: 0xbfb296,
            metalness: 0.76,
            roughness: 0.44
        });

        // Mattes Eloxal-Schwarz für Objektiv-Innentubus & Anschlüsse
        const blackMatte = new THREE.MeshStandardMaterial({
            color: 0x121214,
            metalness: 0.4,
            roughness: 0.6,
            side: THREE.DoubleSide
        });

        // Hochglänzendes Schwarz für Display-Bezel & Filterringe
        const blackGlossy = new THREE.MeshStandardMaterial({
            color: 0x08080a,
            metalness: 0.6,
            roughness: 0.08
        });

        // Hochpräzises Optikglas mit Antireflex-Vergütung (Magenta/Violett/Cyan)
        const opticalGlass = new THREE.MeshPhysicalMaterial ? new THREE.MeshPhysicalMaterial({
            color: 0x180c22,
            metalness: 0.15,
            roughness: 0.04,
            transmission: 0.85,
            transparent: true,
            opacity: 0.88,
            ior: 1.62,
            reflectivity: 0.95,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02
        }) : new THREE.MeshStandardMaterial({
            color: 0x180c22,
            roughness: 0.06,
            metalness: 0.35,
            transparent: true,
            opacity: 0.85
        });

        // Optisches Innen-Element (Tiefes Sensor-Schwarz)
        const opticalInner = new THREE.MeshStandardMaterial({
            color: 0x060608,
            metalness: 0.9,
            roughness: 0.15
        });

        // Rostfreier Edelstahl für Stativgewinde
        const stainlessSteel = new THREE.MeshStandardMaterial({
            color: 0xd0d3d8,
            metalness: 0.95,
            roughness: 0.22
        });

        // Dunkle Anschlüsse (USB-C, SD-Slot)
        const darkPort = new THREE.MeshStandardMaterial({
            color: 0x18181a,
            metalness: 0.6,
            roughness: 0.4
        });

        // Status-LED (Smaragdgrün emissiv)
        const ledGreen = new THREE.MeshStandardMaterial({
            color: 0x0a2614,
            emissive: 0x22ee66,
            emissiveIntensity: 2.2
        });

        return {
            champagne,
            champagneBright,
            champagneDark,
            blackMatte,
            blackGlossy,
            opticalGlass,
            opticalInner,
            stainlessSteel,
            darkPort,
            ledGreen
        };
    }

    function cylZ(r, h, open) {
        const g = new THREE.CylinderGeometry(r, r, h, 56, 1, !!open);
        g.rotateX(Math.PI / 2);
        return g;
    }
    function cylY(r, h) {
        return new THREE.CylinderGeometry(r, r, h, 40);
    }
    function cylX(r, h) {
        const g = new THREE.CylinderGeometry(r, r, h, 36);
        g.rotateZ(Math.PI / 2);
        return g;
    }

    function addLabel(parent, text, color, mmHeight, x, y, z) {
        const { texture, aspect } = makeLabelTexture(text, 54, color, 3);
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(mmHeight * aspect, mmHeight),
            new THREE.MeshBasicMaterial({ map: texture, transparent: true })
        );
        mesh.rotation.y = Math.PI;
        mesh.position.set(x, y, z);
        parent.add(mesh);
    }

    /* --------------------------------------------------------------------------
       Detaillierter 3D-Kameramodellbau (NoMotion Model 100)
       -------------------------------------------------------------------------- */
    function buildModel(M) {
        const model = new THREE.Group();

        /* ---- 1. KORPUS (Chassis mit CNC-gefrästen Radien) ---- */
        const bodyGeom = createRoundedBoxGeometry(BODY.W, BODY.H, BODY.D, 5.2, 5);
        const body = new THREE.Mesh(bodyGeom, M.champagne);
        body.castShadow = true;
        body.receiveShadow = true;
        model.add(body);

        /* ---- 2. OBJEKTIV-SYSTEM (Frontmitte) ---- */
        const lensGroup = new THREE.Group();
        lensGroup.position.set(0, 8, 0);

        // Dunkle Basis-Abschirmung hinter dem Tubus
        const baseBacking = new THREE.Mesh(new THREE.CircleGeometry(15.2, 48), M.blackGlossy);
        baseBacking.position.z = FRONT_Z + 0.1;

        // Äußerer Champagner-Konus (Tapered Bezel)
        const outerConeGeom = new THREE.CylinderGeometry(18.8, 19.8, 6.5, 64);
        outerConeGeom.rotateX(Math.PI / 2);
        const outerCone = new THREE.Mesh(outerConeGeom, M.champagne);
        outerCone.position.z = FRONT_Z + 3.25;
        outerCone.castShadow = true;

        // Frontaler Fase-Ring
        const frontRing = new THREE.Mesh(new THREE.RingGeometry(15.2, 18.8, 64), M.champagne);
        frontRing.position.z = FRONT_Z + 6.52;

        // Schwarzer matter Innentubus mit Stufen
        const innerSleeve = new THREE.Mesh(cylZ(15.2, 5.8, true), M.blackMatte);
        innerSleeve.position.z = FRONT_Z + 3.5;

        const stepTorus1 = new THREE.Mesh(new THREE.TorusGeometry(12.8, 0.85, 16, 64), M.blackGlossy);
        stepTorus1.position.z = FRONT_Z + 5.6;
        const stepTorus2 = new THREE.Mesh(new THREE.TorusGeometry(9.4, 0.85, 16, 64), M.blackGlossy);
        stepTorus2.position.z = FRONT_Z + 4.0;

        // Konvexe optische Frontlinse mit Antireflex-Glas
        const glassDome = new THREE.Mesh(new THREE.SphereGeometry(12.5, 48, 24), M.opticalGlass);
        glassDome.scale.set(1, 1, 0.44);
        glassDome.position.z = FRONT_Z + 2.8;

        // Blenden-Lamellen Ring & Sensor-Iris
        const irisAperture = new THREE.Mesh(new THREE.RingGeometry(3.5, 9.2, 32), new THREE.MeshStandardMaterial({
            color: 0x181220,
            metalness: 0.85,
            roughness: 0.2
        }));
        irisAperture.position.z = FRONT_Z + 1.6;

        // Inneres Linsenelement / Sensor-Iris
        const innerElement = new THREE.Mesh(new THREE.CircleGeometry(6.0, 48), M.opticalInner);
        innerElement.position.z = FRONT_Z + 1.2;

        // Optischer Glanzpunkt (Multicoating Glint)
        const opticGlint = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 12),
            new THREE.MeshStandardMaterial({
                color: 0x76dcd0,
                emissive: 0x1a665a,
                emissiveIntensity: 0.9,
                roughness: 0.1
            })
        );
        opticGlint.position.set(-2.5, 2.2, FRONT_Z + 2.4);

        lensGroup.add(baseBacking, outerCone, frontRing, innerSleeve, stepTorus1, stepTorus2, glassDome, irisAperture, innerElement, opticGlint);
        model.add(lensGroup);

        /* ---- 3. PRÄZISIONS-RÄNDELRAD (Oben rechts mit Seitenüberstand) ---- */
        const dialGroup = new THREE.Group();
        // Das Rad sitzt oben rechts und ragt leicht über den rechten Rand hinaus
        dialGroup.position.set(18.5, 43, FRONT_Z + 1.8);

        const dialRadius = 15.6;
        const dialThickness = 7.5;

        // Radkern
        const dialCore = new THREE.Mesh(cylZ(dialRadius, dialThickness, false), M.champagne);
        dialCore.castShadow = true;

        // 80 Rändelzähne (Diamond-Style Knurling)
        const knurlCount = 80;
        const knurlGeom = new THREE.BoxGeometry(1.25, 1.2, dialThickness - 0.2);
        const knurlMesh = new THREE.InstancedMesh(knurlGeom, M.champagneDark, knurlCount);
        const dummy = new THREE.Object3D();
        for (let i = 0; i < knurlCount; i++) {
            const a = (i / knurlCount) * Math.PI * 2;
            dummy.position.set(Math.cos(a) * (dialRadius + 0.2), Math.sin(a) * (dialRadius + 0.2), 0);
            dummy.rotation.set(0, 0, a);
            dummy.updateMatrix();
            knurlMesh.setMatrixAt(i, dummy.matrix);
        }

        // Vordere Stirnfläche mit konzentrischer Drehriefen-Textur
        const dialFaceMat = new THREE.MeshStandardMaterial({
            map: makeDialFaceTexture(),
            roughness: 0.3,
            metalness: 0.85
        });
        const dialFace = new THREE.Mesh(new THREE.CircleGeometry(dialRadius + 0.1, 64), dialFaceMat);
        dialFace.position.z = dialThickness / 2 + 0.05;

        // Polierter Außenring
        const dialRim = new THREE.Mesh(new THREE.TorusGeometry(dialRadius + 0.1, 0.45, 12, 64), M.champagneBright);
        dialRim.position.z = dialThickness / 2;

        dialGroup.add(dialCore, knurlMesh, dialFace, dialRim);
        model.add(dialGroup);

        /* ---- 4. FRONT-DETAILS (Gravur, USB-C, Mikrofon) ---- */
        // Front Mikrofon-Öffnung
        const frontMic = new THREE.Mesh(cylZ(0.9, 0.8, false), M.darkPort);
        frontMic.position.set(22.5, -39.5, FRONT_Z + 0.1);

        // Front USB-C Port
        const frontUsbcGeom = new THREE.CylinderGeometry(1.35, 1.35, 4.4, 16);
        frontUsbcGeom.rotateZ(Math.PI / 2);
        const frontUsbc = new THREE.Mesh(frontUsbcGeom, M.darkPort);
        frontUsbc.position.set(22.5, -46.5, FRONT_Z + 0.1);

        // Front Lasergravur "MINIMALIST / SERIES 1 / 18mm f/2.0"
        const brandPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(42, 21),
            new THREE.MeshBasicMaterial({ map: makeBrandTexture(), transparent: true, opacity: 0.95 })
        );
        brandPlane.position.set(0, -43, FRONT_Z + 0.12);

        model.add(frontMic, frontUsbc, brandPlane);

        /* ---- 5. SEITLICHE ELEMENTE (USB-C, Tally-LED, SD-Slot) ---- */
        // Linke Seite: SD-Kartenschlitz
        const sdSlot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.3, 9.5), M.darkPort);
        sdSlot.position.set(-BODY.W / 2 - 0.1, -12, 0);

        // Linke Seite: Stereo-Mikrofon-Punkte
        const sideMic1 = new THREE.Mesh(cylX(0.7, 0.8), M.darkPort);
        sideMic1.position.set(-BODY.W / 2 - 0.1, 36, 3);
        const sideMic2 = new THREE.Mesh(cylX(0.7, 0.8), M.darkPort);
        sideMic2.position.set(-BODY.W / 2 - 0.1, 34, -3);

        // Rechte Seite: USB-C 3.2 Port
        const sideUsbcGeom = new THREE.CylinderGeometry(1.4, 1.4, 4.8, 16);
        sideUsbcGeom.rotateX(Math.PI / 2);
        const sideUsbc = new THREE.Mesh(sideUsbcGeom, M.darkPort);
        sideUsbc.position.set(BODY.W / 2 + 0.1, -38, 0);

        // Rechte Seite: Status / Tally-LED (Grün leuchtend)
        const tallyLed = new THREE.Mesh(cylX(0.85, 0.9), M.ledGreen);
        tallyLed.position.set(BODY.W / 2 + 0.2, -26, 0);

        model.add(sdSlot, sideMic1, sideMic2, sideUsbc, tallyLed);

        /* ---- 6. RÜCKSEITE (Display-Panel, D-Pad, Tasten & Gravuren) ---- */
        // Tiefschwarzer Display-Bezel
        const screenBezel = new THREE.Mesh(
            createRoundedBoxGeometry(55, 82, 0.8, 3, 2),
            M.blackGlossy
        );
        screenBezel.position.set(0, -17.5, REAR_Z - 0.25);

        // OLED Display Glass mit Live Telemetry UI
        const screenMat = new THREE.MeshBasicMaterial({
            map: makeScreenTexture()
        });
        const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(51, 78), screenMat);
        screenMesh.rotation.y = Math.PI;
        screenMesh.position.set(0, -17.5, REAR_Z - 0.7);

        model.add(screenBezel, screenMesh);

        // D-Pad Steuerkreuz oben rechts
        const dpadGroup = new THREE.Group();
        dpadGroup.position.set(16.5, 43, REAR_Z - 0.2);

        const dpadBase = new THREE.Mesh(cylZ(12.5, 1.2), M.champagne);
        const dpadFace = new THREE.Mesh(
            new THREE.CircleGeometry(12.4, 48),
            new THREE.MeshStandardMaterial({ map: makeDPadTexture(), roughness: 0.35, metalness: 0.8 })
        );
        dpadFace.rotation.y = Math.PI;
        dpadFace.position.z = -0.65;

        // Zentraler vertiefter "OK" Knopf
        const okBtn = new THREE.Mesh(cylZ(4.5, 1.5), M.champagneBright);
        okBtn.position.z = -0.95;

        dpadGroup.add(dpadBase, dpadFace, okBtn);
        model.add(dpadGroup);

        // Rückseiten-Gravuren
        addLabel(model, 'MENU', 'rgba(100,92,78,0.9)', 5, -8, 48, REAR_Z - 0.2);
        addLabel(model, 'MODEL 100', 'rgba(100,92,78,0.9)', 4.8, -14, 34, REAR_Z - 0.2);
        addLabel(model, 'OK', 'rgba(100,92,78,0.9)', 4.2, 16.5, 32, REAR_Z - 0.2);

        /* ---- 7. OBERSEITE (Auslöser & Top-Mikrofone) ---- */
        // Auslöser: Abgerundetes Quadrat mit Fase
        const shutterGeom = createRoundedBoxGeometry(10, 2.4, 10, 2, 2);
        const shutterBtn = new THREE.Mesh(shutterGeom, M.champagneBright);
        shutterBtn.position.set(-8, BODY.H / 2 + 1.0, 0);
        shutterBtn.castShadow = true;

        // Top Stereo-Mikrofone
        const topMic1 = new THREE.Mesh(cylY(0.85, 0.8), M.darkPort);
        topMic1.position.set(8, BODY.H / 2 + 0.2, 2.5);
        const topMic2 = new THREE.Mesh(cylY(0.85, 0.8), M.darkPort);
        topMic2.position.set(15, BODY.H / 2 + 0.2, -2.5);

        model.add(shutterBtn, topMic1, topMic2);

        /* ---- 8. UNTERSEITE (Edelstahl-Stativgewinde & Akkufach) ---- */
        // 1/4" Edelstahl Stativgewinde-Ring
        const tripodRing = new THREE.Mesh(new THREE.TorusGeometry(6.5, 1.0, 16, 40), M.stainlessSteel);
        tripodRing.rotation.x = Math.PI / 2;
        tripodRing.position.set(0, -BODY.H / 2 - 0.15, 0);

        const tripodDisc = new THREE.Mesh(cylY(5.5, 0.9), M.stainlessSteel);
        tripodDisc.position.set(0, -BODY.H / 2 - 0.25, 0);

        const tripodHole = new THREE.Mesh(
            cylY(2.2, 1.1),
            new THREE.MeshStandardMaterial({ color: 0x383b40, metalness: 0.95, roughness: 0.4 })
        );
        tripodHole.position.set(0, -BODY.H / 2 - 0.35, 0);

        // Unterseiten-Lasergravuren & Akkufach-Outline
        const bottomEngrave = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshBasicMaterial({ map: makeBottomTexture(), transparent: true, opacity: 0.95 })
        );
        bottomEngrave.rotation.x = Math.PI / 2;
        bottomEngrave.rotation.z = Math.PI;
        bottomEngrave.position.set(0, -BODY.H / 2 - 0.08, 0);

        // Akkufach-Schieberiegel
        const sliderLatch = new THREE.Mesh(
            createRoundedBoxGeometry(9, 1.4, 2.8, 0.7, 2),
            M.champagneDark
        );
        sliderLatch.position.set(0, -BODY.H / 2 - 0.55, 7);

        model.add(tripodRing, tripodDisc, tripodHole, bottomEngrave, sliderLatch);

        return model;
    }

    /* --------------------------------------------------------------------------
       3D WebGL Studio Viewer Engine
       -------------------------------------------------------------------------- */
    function initWebGLViewer() {
        if (typeof THREE === 'undefined') return false;

        const wrap = document.getElementById('turntableCanvasWrap');
        if (!wrap) return false;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
        } catch (e) {
            return false;
        }

        if (THREE.SRGBColorSpace) {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap || THREE.PCFShadowMap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);

        const canvas = renderer.domElement;
        wrap.innerHTML = '';
        wrap.appendChild(canvas);

        const scene = new THREE.Scene();

        // Studio Environment Reflection Map
        const envTexture = makeStudioEnvironmentTexture();
        scene.environment = envTexture;

        const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000);
        const target = new THREE.Vector3(0, 0, 0);

        /* Professionelle 4-Punkt Studiobeleuchtung */
        const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
        keyLight.position.set(65, 125, 100);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.bias = -0.0004;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xe5effb, 0.75);
        fillLight.position.set(-85, 50, -60);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 1.35);
        rimLight.position.set(0, 95, -115);
        scene.add(rimLight);

        const topSoftbox = new THREE.DirectionalLight(0xfffaf0, 0.85);
        topSoftbox.position.set(0, 140, 30);
        scene.add(topSoftbox);

        const ambient = new THREE.AmbientLight(0xfdfbf6, 0.65);
        scene.add(ambient);

        /* Weicher Studio-Bodenschatten */
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500),
            new THREE.ShadowMaterial({ opacity: 0.13 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -76;
        ground.receiveShadow = true;
        scene.add(ground);

        /* 3D Kamera Modell */
        const materials = createMaterials();
        const model = buildModel(materials);
        scene.add(model);

        /* Sphärische Kamera-Koordinaten */
        const spherical = {
            theta: 0,
            phi: Math.PI / 2,
            radius: 310
        };
        const targetSpherical = { ...spherical };

        function updateCamera() {
            const sinPhi = Math.sin(spherical.phi);
            camera.position.set(
                target.x + spherical.radius * sinPhi * Math.sin(spherical.theta),
                target.y + spherical.radius * Math.cos(spherical.phi),
                target.z + spherical.radius * sinPhi * Math.cos(spherical.theta)
            );
            camera.lookAt(target);
        }
        updateCamera();

        /* Tweening System */
        let tween = null;
        function flyToPreset(preset, duration = 750) {
            let startTheta = targetSpherical.theta;
            let dTheta = (preset.az * Math.PI / 180) - startTheta;
            while (dTheta > Math.PI) dTheta -= Math.PI * 2;
            while (dTheta < -Math.PI) dTheta += Math.PI * 2;

            tween = {
                t0: performance.now(),
                duration,
                from: { ...spherical },
                to: {
                    theta: startTheta + dTheta,
                    phi: preset.pol * Math.PI / 180,
                    radius: preset.dist
                }
            };
        }

        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        /* Auto-Rotation */
        let autoRotate = true;
        const autoRotateSpeed = 0.007;

        /* UI Controls */
        const badge = document.getElementById('turntableDegBadge');
        const prompt = document.getElementById('dragPrompt');
        const thumbs = [...document.querySelectorAll('.angle-thumb-btn')];
        const prevBtn = document.getElementById('prevAngleBtn');
        const nextBtn = document.getElementById('nextAngleBtn');
        const wrapper = document.querySelector('.turntable-stage-wrapper');

        // Auto-Rotate & Fullscreen Buttons
        let autoBtn = null;
        let fsBtn = null;
        const leftGroup = prevBtn && prevBtn.parentElement;
        if (leftGroup && nextBtn) {
            autoBtn = document.createElement('button');
            autoBtn.className = 'turntable-nav-btn is-on';
            autoBtn.id = 'autoRotateBtn';
            autoBtn.title = 'Auto-Rotation umschalten';
            autoBtn.setAttribute('aria-label', 'Auto-Rotation umschalten');
            autoBtn.textContent = '⟳';

            fsBtn = document.createElement('button');
            fsBtn.className = 'turntable-nav-btn';
            fsBtn.id = 'fullscreenBtn';
            fsBtn.title = 'Vollbild-Modus';
            fsBtn.setAttribute('aria-label', 'Vollbild-Modus umschalten');
            fsBtn.textContent = '⛶';

            leftGroup.insertBefore(autoBtn, badge || nextBtn.nextSibling);
            if (badge) leftGroup.insertBefore(fsBtn, badge);
            else leftGroup.appendChild(fsBtn);
        }

        function syncAutoBtn() {
            if (autoBtn) autoBtn.classList.toggle('is-on', autoRotate);
        }

        if (autoBtn) {
            autoBtn.addEventListener('click', () => {
                autoRotate = !autoRotate;
                syncAutoBtn();
            });
        }

        if (fsBtn && wrapper) {
            fsBtn.addEventListener('click', () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else if (wrapper.requestFullscreen) {
                    wrapper.requestFullscreen().catch(() => {});
                }
            });
            document.addEventListener('fullscreenchange', () => {
                wrapper.classList.toggle('is-fullscreen', document.fullscreenElement === wrapper);
                resize();
            });
        }

        function setActiveThumb(i) {
            thumbs.forEach((btn, idx) => {
                const isActive = idx === i;
                btn.classList.toggle('is-active', isActive);
                if (isActive) {
                    try {
                        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    } catch (e) {}
                }
            });
        }

        let presetIndex = 0;
        thumbs.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                presetIndex = i;
                autoRotate = false;
                syncAutoBtn();
                flyToPreset(PRESETS[i]);
                setActiveThumb(i);
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                presetIndex = (presetIndex - 1 + PRESETS.length) % PRESETS.length;
                autoRotate = false;
                syncAutoBtn();
                flyToPreset(PRESETS[presetIndex]);
                setActiveThumb(presetIndex);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                presetIndex = (presetIndex + 1) % PRESETS.length;
                autoRotate = false;
                syncAutoBtn();
                flyToPreset(PRESETS[presetIndex]);
                setActiveThumb(presetIndex);
            });
        }

        /* Pointer & Touch Interaktion */
        let isPointerDown = false;
        let lastPointerX = 0;
        let lastPointerY = 0;
        let pinchDist = 0;

        canvas.addEventListener('pointerdown', (e) => {
            isPointerDown = true;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            canvas.setPointerCapture(e.pointerId);
            wrap.classList.add('is-grabbing');
            if (prompt) prompt.style.opacity = '0';
            if (autoRotate) {
                autoRotate = false;
                syncAutoBtn();
            }
            tween = null;
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!isPointerDown) return;
            const dx = e.clientX - lastPointerX;
            const dy = e.clientY - lastPointerY;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;

            targetSpherical.theta -= dx * 0.008;
            targetSpherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, targetSpherical.phi - dy * 0.008));
        });

        const stopPointer = (e) => {
            isPointerDown = false;
            wrap.classList.remove('is-grabbing');
            try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
        };
        canvas.addEventListener('pointerup', stopPointer);
        canvas.addEventListener('pointercancel', stopPointer);

        /* Zoom per Scrollrad */
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            targetSpherical.radius = Math.max(150, Math.min(410, targetSpherical.radius + e.deltaY * 0.2));
            if (autoRotate) {
                autoRotate = false;
                syncAutoBtn();
            }
        }, { passive: false });

        /* Touch Pinch Zoom */
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                pinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (pinchDist > 0) {
                    const diff = pinchDist - dist;
                    targetSpherical.radius = Math.max(150, Math.min(410, targetSpherical.radius + diff * 0.5));
                }
                pinchDist = dist;
            }
        }, { passive: true });

        canvas.addEventListener('touchend', () => { pinchDist = 0; }, { passive: true });

        /* Double Click -> Reset to Front */
        canvas.addEventListener('dblclick', () => {
            presetIndex = 0;
            autoRotate = false;
            syncAutoBtn();
            flyToPreset(PRESETS[0]);
            setActiveThumb(0);
        });

        /* Live Degree HUD Badge */
        let lastBadge = '';
        function updateBadge() {
            if (!badge) return;
            const deg = ((Math.round(spherical.theta * 180 / Math.PI) % 360) + 360) % 360;
            const pol = spherical.phi * 180 / Math.PI;

            let label = 'FREE FLIGHT';
            for (let i = 0; i < PRESETS.length; i++) {
                const p = PRESETS[i];
                let dAz = Math.abs(deg - ((p.az % 360 + 360) % 360));
                if (dAz > 180) dAz = 360 - dAz;
                if (dAz < 10 && Math.abs(pol - p.pol) < 14) {
                    label = p.label;
                    setActiveThumb(i);
                    break;
                }
            }

            const txt = `${String(deg).padStart(3, '0')}° // ${label}`;
            if (txt !== lastBadge) {
                badge.textContent = txt;
                lastBadge = txt;
            }
        }

        /* Resize */
        function resize() {
            const w = wrap.clientWidth || 640;
            const h = wrap.clientHeight || 440;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener('resize', resize);
        if (window.ResizeObserver) {
            new ResizeObserver(resize).observe(wrap);
        }

        /* Render Loop */
        let isReady = false;
        function animate(now) {
            requestAnimationFrame(animate);

            if (tween) {
                const k = Math.min((now - tween.t0) / tween.duration, 1);
                const e = easeInOutCubic(k);
                spherical.theta = tween.from.theta + (tween.to.theta - tween.from.theta) * e;
                spherical.phi = tween.from.phi + (tween.to.phi - tween.from.phi) * e;
                spherical.radius = tween.from.radius + (tween.to.radius - tween.from.radius) * e;
                targetSpherical.theta = spherical.theta;
                targetSpherical.phi = spherical.phi;
                targetSpherical.radius = spherical.radius;
                if (k >= 1) tween = null;
            } else {
                if (autoRotate && !isPointerDown) {
                    targetSpherical.theta += autoRotateSpeed;
                }
                spherical.theta += (targetSpherical.theta - spherical.theta) * 0.12;
                spherical.phi += (targetSpherical.phi - spherical.phi) * 0.12;
                spherical.radius += (targetSpherical.radius - spherical.radius) * 0.12;
            }

            updateCamera();
            updateBadge();
            renderer.render(scene, camera);

            if (!isReady) {
                isReady = true;
                wrap.classList.add('is-ready');
                const loader = document.getElementById('ttLoading');
                if (loader) loader.classList.add('is-hidden');
                window.__tt3dReady = true;
            }
        }
        requestAnimationFrame(animate);

        return true;
    }

    /* --------------------------------------------------------------------------
       Fallback: 7-Winkel Foto-Turntable mit Drag & Thumbnails
       -------------------------------------------------------------------------- */
    function initPhotoFallback() {
        const surface = document.getElementById('turntableSurface');
        const wrap = document.getElementById('turntableCanvasWrap');
        const loader = document.getElementById('ttLoading');
        if (!surface) return;

        if (loader) loader.classList.add('is-hidden');

        let currentIndex = 0;
        let imgEl = surface.querySelector('img.turntable-main-img');
        if (!imgEl) {
            if (wrap) wrap.style.display = 'none';
            imgEl = document.createElement('img');
            imgEl.className = 'turntable-main-img image-blend-soft';
            imgEl.src = cameraAngleImages[0].img;
            imgEl.alt = 'NoMotion Model 100 Turntable';
            surface.appendChild(imgEl);
        }

        const degBadge = document.getElementById('turntableDegBadge');
        const thumbButtons = document.querySelectorAll('.angle-thumb-btn');
        const dragPrompt = document.getElementById('dragPrompt');
        const prevBtn = document.getElementById('prevAngleBtn');
        const nextBtn = document.getElementById('nextAngleBtn');

        function setAngle(idx) {
            currentIndex = (idx + cameraAngleImages.length) % cameraAngleImages.length;
            const data = cameraAngleImages[currentIndex];

            if (typeof gsap !== 'undefined') {
                gsap.to(imgEl, {
                    opacity: 0.35,
                    scale: 0.97,
                    duration: 0.1,
                    ease: 'power1.in',
                    onComplete: () => {
                        imgEl.src = data.img;
                        gsap.to(imgEl, { opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' });
                    }
                });
            } else {
                imgEl.src = data.img;
            }

            if (degBadge) {
                degBadge.textContent = data.deg;
                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(degBadge, { scale: 0.92, color: '#e5a93c' }, { scale: 1, color: '#ffffff', duration: 0.3, ease: 'back.out(1.5)' });
                }
            }

            thumbButtons.forEach((btn, i) => {
                btn.classList.toggle('is-active', i === currentIndex);
            });
        }

        thumbButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                setAngle(idx);
            });
        });

        if (prevBtn) prevBtn.addEventListener('click', () => setAngle(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => setAngle(currentIndex + 1));

        let isDragging = false;
        let startX = 0;
        const threshold = 35;

        surface.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            surface.setPointerCapture(e.pointerId);
            if (dragPrompt) dragPrompt.style.opacity = '0';
        });

        surface.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const diffX = e.clientX - startX;
            if (Math.abs(diffX) >= threshold) {
                if (diffX > 0) {
                    setAngle(currentIndex + 1);
                } else {
                    setAngle(currentIndex - 1);
                }
                startX = e.clientX;
            }
        });

        const stopDrag = () => { isDragging = false; };
        surface.addEventListener('pointerup', stopDrag);
        surface.addEventListener('pointercancel', stopDrag);

        window.__tt3dReady = true;
    }

    /* --------------------------------------------------------------------------
       Initialisierungs-Bootloader
       -------------------------------------------------------------------------- */
    function boot() {
        try {
            if (!initWebGLViewer()) {
                initPhotoFallback();
            }
        } catch (err) {
            console.warn('WebGL Viewer Initialisierung fehlgeschlagen, starte Fallback:', err);
            initPhotoFallback();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
