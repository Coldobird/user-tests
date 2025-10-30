import { useEffect, useRef, useState } from 'react';
import './App.css';
import './where-is.css';

/**
 * Heatmap canvas: draws soft blobs for each point.
 * Points are normalized: [{ x: 0..1, y: 0..1 }]
 */
function HeatmapCanvas({ points, width, height, radius = 60 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw soft circles
    points.forEach((p) => {
      const x = p.x * width;
      const y = p.y * height;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, 'rgba(255,0,0,0.35)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, width, height, radius]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // heatmap should not block clicks
      }}
    />
  );
}

/**
 * The main annotator
 */
function ImageAnnotator({
  src,
  circleRadiusPx = 10,
  showHeatmap = true,
  fiveSecondLimit = false, // set true if you want the image for 5s only
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const [points, setPoints] = useState([]); // [{x: 0..1, y: 0..1, t: Date.now()}]
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState('anotate');
  const [visible, setVisible] = useState(true); // for the optional 5s timer

  // Resize observer so overlay always matches the image box
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const el = imgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    });
    if (imgRef.current) ro.observe(imgRef.current);
    return () => ro.disconnect();
  }, []);

  // Optional: hide after 5 seconds
  useEffect(() => {
    if (!fiveSecondLimit) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(t);
  }, [fiveSecondLimit, src]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClick = (ev) => {
    if (mode !== 'anotate') return;
    console.log(ev.target);
    
    if (ev.target.closest('actions-menu')) return; // click was on a button/menu
    const rect = imgRef.current.getBoundingClientRect();

    // Click relative to container
    const xPx = ev.clientX - rect.left;
    const yPx = ev.clientY - rect.top;

    // Normalize to [0..1] and clamp
    const x = Math.max(0, Math.min(1, xPx / rect.width));
    const y = Math.max(0, Math.min(1, yPx / rect.height));

    setPoints((prev) => [...prev, { x, y, t: Date.now() }]);
  };

  const clearPoints = () => setPoints([]);
  const undo = () => setPoints((prev) => prev.slice(0, -1));
  const showResult = () => {
    setMode('done');
    setVisible(true);
  };

  return (
    <img-container ref={containerRef} onClick={handleClick} style={{ cursor: mode === 'anotate' ? 'crosshair' : 'default' }}>
      <actions-menu>
        <button onClick={undo} disabled={points.length === 0}>
          Undo
        </button>
        <button onClick={clearPoints} disabled={points.length === 0}>
          Clear
        </button>
        <button onClick={showResult} disabled={points.length === 0}>
          Done
        </button>
      </actions-menu>

      {visible ? (
        <img ref={imgRef} src={src} style={{}} draggable={false} />
      ) : (
        <img ref={imgRef} src={src} style={{ opacity: '0' }} draggable={false} />
      )}

      {/* SVG overlay for crisp circles */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${containerSize.w || 1} ${containerSize.h || 1}`}
        preserveAspectRatio="none"
      >
        {points.map((p, i) => {
          const x = p.x * (containerSize.w || 1);
          const y = p.y * (containerSize.h || 1);
          return <circle key={i} cx={x} cy={y} r={circleRadiusPx} fill="none" stroke="red" strokeWidth="2" />;
        })}
      </svg>

      {showHeatmap && (
        <HeatmapCanvas
          points={points}
          width={containerSize.w}
          height={containerSize.h}
          radius={Math.max(40, Math.floor((containerSize.w + containerSize.h) / 50))}
        />
      )}
    </img-container>
  );
}

function Img1() {
  return (
    <>
      <h1>Find the button</h1>
      <ImageAnnotator
        src="/image.png"
        showHeatmap={true}
        fiveSecondLimit={true} // or true if needed
      />
    </>
  );
}

export default function TestWhereButton() {
  const [view, setView] = useState('home');

  if (view === 'img1') return <Img1 />;

  return (
    <div>
      <h1>Where is the button?</h1>
      <p>circle the button on the image</p>
      <p>i'll only show the image for 5 seconds</p>
      <div className="card">
        <button onClick={() => setView('img1')}>Test Me!</button>
      </div>
    </div>
  );
}
