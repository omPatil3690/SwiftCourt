import React from "react";

type BackgroundGlowProps = {
  children: React.ReactNode;
};

const BackgroundGlow: React.FC<BackgroundGlowProps> = ({ children }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', mx + '%');
      el.style.setProperty('--my', my + '%');
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="pointer-events-none absolute inset-0 ambient-spotlight" aria-hidden />
      {children}
    </div>
  );
};

export default BackgroundGlow;
