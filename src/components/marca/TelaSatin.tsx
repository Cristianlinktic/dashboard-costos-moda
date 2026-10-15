"use client";

import { useEffect, useRef } from "react";
import { escalas } from "@/design/tokens";
import { cx } from "../ui";

/**
 * Tela de satín en movimiento (Three.js + shader): pliegues lila que ondulan lentamente,
 * con brillo satinado y una leve deformación hacia el cursor. Evoca la tela de las prendas
 * (satín, powernet) en lugar de una red tecnológica.
 *
 * - Un solo plano a pantalla completa; el shader calcula la altura de la tela, su normal
 *   y la iluminación (difusa + especular + bandas de brillo anisotrópico).
 * - Se renderiza a resolución reducida (la tela es suave), se pausa fuera de pantalla y
 *   con la pestaña oculta; con «reducir movimiento» queda un solo cuadro estático.
 * - Cambia de paleta con el tema (data-tema). Sin WebGL, se ve el degradado CSS del banner.
 */

const PALETAS = {
  claro: { c0: escalas.ciruela[900], c1: escalas.lila[700], c2: escalas.lila[500], c3: escalas.malva[100], brillo: 0.9 },
  oscuro: { c0: escalas.ciruela[950], c1: escalas.ciruela[700], c2: escalas.lila[800], c3: escalas.lila[200], brillo: 0.55 },
};

const FRAGMENT = /* glsl */ `
  uniform float uT;
  uniform vec2 uRes;
  uniform vec2 uPuntero;
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform float uBrillo;
  varying vec2 vUv;

  // Altura de la tela: ondas superpuestas que se deforman entre sí (pliegues orgánicos).
  // Pliegues diagonales largos (como tela colgando) deformados por ondas lentas.
  float altura(vec2 p, float t) {
    vec2 q = vec2(p.x * 0.8 + p.y * 0.6, -p.x * 0.6 + p.y * 0.8);
    float v = 0.0;
    v += sin(q.x * 2.2 + sin(q.y * 1.1 + t * 0.30) * 1.8 + t * 0.20) * 0.50;
    v += sin(q.x * 4.3 + sin(q.y * 1.7 - t * 0.22) * 1.2 - t * 0.15) * 0.22;
    v += sin(q.y * 1.4 + t * 0.12) * 0.25;
    return v;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.6;
    vec2 d = p - uPuntero;
    p += d * 0.10 * exp(-dot(d, d) * 1.4);

    float e = 0.01;
    float c = altura(p, uT);
    float hx = (altura(p + vec2(e, 0.0), uT) - c) / e;
    float hy = (altura(p + vec2(0.0, e), uT) - c) / e;
    vec3 n = normalize(vec3(-hx * 0.55, -hy * 0.55, 1.0));

    vec3 luz = normalize(vec3(-0.45, 0.55, 0.75));
    float difusa = clamp(dot(n, luz), 0.0, 1.0);
    vec3 medio = normalize(luz + vec3(0.0, 0.0, 1.0));
    float especular = pow(clamp(dot(n, medio), 0.0, 1.0), 26.0) * uBrillo;
    float bandas = pow(abs(sin(c * 2.6 + 0.7)), 10.0) * 0.12 * uBrillo;

    float g = clamp(vUv.x * 0.62 + vUv.y * 0.38, 0.0, 1.0);
    vec3 base = mix(uC0, uC1, smoothstep(0.0, 0.55, g));
    base = mix(base, uC2, smoothstep(0.45, 1.0, g));

    // Sombra en los valles, luz satinada (malva clara) en las crestas.
    vec3 color = base * (0.45 + 0.75 * difusa) + uC3 * (especular * 0.75 + bandas);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export function TelaSatin({ className, velocidad = 1 }: { className?: string; velocidad?: number }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = contenedor.current;
    if (!host) return;
    let liberar: (() => void) | undefined;
    let cancelado = false;

    import("three").then((THREE) => {
      if (cancelado || !host) return;
      const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "low-power" });
      } catch {
        return;
      }
      // La tela es suave: basta con ~0,75× de resolución (mucho menos trabajo de GPU).
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5) * 0.75);
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
      host.appendChild(renderer.domElement);

      const escena = new THREE.Scene();
      const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const uniforms = {
        uT: { value: Math.random() * 100 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uPuntero: { value: new THREE.Vector2(9, 9) },
        uC0: { value: new THREE.Color() },
        uC1: { value: new THREE.Color() },
        uC2: { value: new THREE.Color() },
        uC3: { value: new THREE.Color() },
        uBrillo: { value: 0.5 },
      };
      const aplicarPaleta = () => {
        const p = document.documentElement.dataset.tema === "oscuro" ? PALETAS.oscuro : PALETAS.claro;
        uniforms.uC0.value.set(p.c0);
        uniforms.uC1.value.set(p.c1);
        uniforms.uC2.value.set(p.c2);
        uniforms.uC3.value.set(p.c3);
        uniforms.uBrillo.value = p.brillo;
      };
      aplicarPaleta();

      const geometria = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT });
      escena.add(new THREE.Mesh(geometria, material));

      const medir = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        uniforms.uRes.value.set(w, h);
      };
      medir();

      // El cursor «empuja» la tela con suavidad.
      const objetivo = new THREE.Vector2(9, 9);
      const alMover = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return objetivo.set(9, 9);
        const x = ((e.clientX - r.left) / r.width - 0.5) * (r.width / r.height) * 2.4;
        const y = -((e.clientY - r.top) / r.height - 0.5) * 2.4;
        objetivo.set(x, y);
      };
      window.addEventListener("pointermove", alMover, { passive: true });

      let raf = 0;
      let visible = true;
      let anterior = performance.now();
      const dibujar = () => renderer.render(escena, camara);
      const bucle = (ahora: number) => {
        raf = requestAnimationFrame(bucle);
        const dt = Math.min(0.05, (ahora - anterior) / 1000);
        anterior = ahora;
        if (!visible || document.hidden) return;
        uniforms.uT.value += dt * velocidad;
        uniforms.uPuntero.value.lerp(objetivo, 0.05);
        dibujar();
      };
      dibujar();
      if (!reducido) raf = requestAnimationFrame(bucle);

      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(host);
      const ro = new ResizeObserver(() => {
        medir();
        dibujar();
      });
      ro.observe(host);
      const mo = new MutationObserver(() => {
        aplicarPaleta();
        dibujar();
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

      liberar = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        mo.disconnect();
        window.removeEventListener("pointermove", alMover);
        geometria.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      cancelado = true;
      liberar?.();
    };
  }, [velocidad]);

  return <div ref={contenedor} className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden />;
}
