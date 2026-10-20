import { useEffect, useRef } from 'react';
import './CursorEffects.css';

const TRAIL_LENGTH = 1;

function CursorEffects() {
  const ringRef = useRef(null);
  const trailRefs = useRef([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const target = { x: -100, y: -100 };
    const points = Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }));
    let frameId;

    const move = event => {
      target.x = event.clientX;
      target.y = event.clientY;
      document.documentElement.classList.add('cursor-active');
    };

    const click = () => {
      document.documentElement.classList.remove('cursor-click');
      requestAnimationFrame(() => document.documentElement.classList.add('cursor-click'));
    };

    const animate = () => {
      points.forEach((point, index) => {
        const previous = index === 0 ? target : points[index - 1];
        point.x += (previous.x - point.x) * (index === 0 ? 0.3 : 0.2);
        point.y += (previous.y - point.y) * (index === 0 ? 0.3 : 0.2);
        const element = trailRefs.current[index];
        if (element) {
          element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
        }
      });

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${points[0].x}px, ${points[0].y}px, 0)`;
      }

      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', click, { passive: true });
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', click);
      cancelAnimationFrame(frameId);
      document.documentElement.classList.remove('cursor-active', 'cursor-click');
    };
  }, []);

  return (
    <div className="cursor-effects" aria-hidden="true">
      {Array.from({ length: TRAIL_LENGTH }, (_, index) => (
        <span
          className="cursor-trail-dot"
          key={index}
          ref={element => { trailRefs.current[index] = element; }}
        />
      ))}
      <span className="cursor-ring" ref={ringRef} />
    </div>
  );
}

export default CursorEffects;
