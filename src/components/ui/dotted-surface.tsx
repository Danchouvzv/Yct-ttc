import { useEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type DottedSurfaceProps = Omit<ComponentProps<"div">, "ref"> & {
  color?: "light" | "dark";
};

export function DottedSurface({ className, color = "light", ...props }: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;
    let disposed = false;

    void (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const separation = 120;
      const amountX = 52;
      const amountY = 44;
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xffffff, 1800, 9800);

      const camera = new THREE.PerspectiveCamera(58, 1, 1, 10000);
      camera.position.set(0, 420, 1180);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(scene.fog.color, 0);
      container.appendChild(renderer.domElement);

      const geometry = new THREE.BufferGeometry();
      const positions: number[] = [];
      const colors: number[] = [];
      const pointColor = color === "dark" ? 0 : 1;

      for (let ix = 0; ix < amountX; ix++) {
        for (let iy = 0; iy < amountY; iy++) {
          positions.push(
            ix * separation - (amountX * separation) / 2,
            0,
            iy * separation - (amountY * separation) / 2,
          );
          colors.push(pointColor, pointColor, pointColor);
        }
      }

      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 7,
        vertexColors: true,
        transparent: true,
        opacity: color === "dark" ? 0.42 : 0.52,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      let count = 0;
      let animationId = 0;

      const handleResize = () => {
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const positionAttribute = geometry.attributes.position;
        const currentPositions = positionAttribute.array as Float32Array;
        let i = 0;

        for (let ix = 0; ix < amountX; ix++) {
          for (let iy = 0; iy < amountY; iy++) {
            const index = i * 3;
            currentPositions[index + 1] =
              Math.sin((ix + count) * 0.28) * 42 + Math.sin((iy + count) * 0.46) * 52;
            i++;
          }
        }

        positionAttribute.needsUpdate = true;
        renderer.render(scene, camera);
        count += 0.06;
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      animate();

      cleanup = () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationId);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [color]);

  return <div ref={containerRef} className={cn("pointer-events-none", className)} {...props} />;
}
