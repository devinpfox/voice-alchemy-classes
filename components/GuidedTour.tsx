'use client';
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import 'styles/globals.css';

type Pos = 'top' | 'right' | 'bottom' | 'left';
export type TourStep = {
  sel: string | ((root: Document) => Element | null);
  title: string;
  text: string;
  pos?: Pos;
  offsetX?: number;
  offsetY?: number;
};

function useIsoLayoutEffect(fn: () => void | (() => void), deps: any[]) {
  // @ts-ignore
  return (typeof window !== 'undefined' ? useLayoutEffect : useEffect)(fn, deps);
}

export default function GuidedTour({
  steps,
  storageKey = 'tour_did_run',
  autoStart = false,
  onlyOnce = true,
  highlight = true,
  exposeStart,
  getRoot, // for iframe: () => iframe.contentDocument
}: {
  steps: TourStep[];
  storageKey?: string;
  autoStart?: boolean;
  onlyOnce?: boolean;
  highlight?: boolean;
  exposeStart?: (start: () => void) => void;
  getRoot?: () => Document;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<Pos>('bottom');
  const [style, setStyle] = useState<React.CSSProperties>({});

  // track every element we decorate so we can cleanly reset styles
  const outlined = useRef<HTMLElement[]>([]);

  const start = useCallback(() => setIndex(0), []);
  const end = useCallback(() => {
    setIndex(null);
    localStorage.setItem(storageKey, '1');
    // clear any rings/outlines
    outlined.current.forEach(el => {
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.borderRadius = '';
      el.style.boxShadow = '';
    });
    outlined.current = [];
  }, [storageKey]);

  const next = useCallback(() => {
    setIndex(i => {
      const n = (i ?? -1) + 1;
      return n < steps.length ? n : (end(), null as any);
    });
  }, [steps.length, end]);

  useEffect(() => {
    setMounted(true);
    (window as any).startTour = start;
    exposeStart?.(start);
    return () => { delete (window as any).startTour; };
  }, [start, exposeStart]);

  useEffect(() => {
    if (!mounted || !autoStart) return;
    if (onlyOnce && localStorage.getItem(storageKey)) return;
    start();
  }, [mounted, autoStart, onlyOnce, storageKey, start]);

  const resolveTarget = useCallback((step: TourStep, rootDoc: Document) => {
    return (typeof step.sel === 'function'
      ? step.sel(rootDoc)
      : rootDoc.querySelector(step.sel)) as HTMLElement | null;
  }, []);

  const place = useCallback(() => {
    if (index == null) return;

    const rootDoc = getRoot?.() ?? document;
    const step = steps[index];
    const tip = tipRef.current;
    const target = resolveTarget(step, rootDoc);
    if (!target || !tip) { next(); return; }

    // ---------- highlight (circles for notes & active octave; rectangles elsewhere) ----------
    if (highlight) {
      // clear previous
      outlined.current.forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.borderRadius = '';
        el.style.boxShadow = '';
      });
      outlined.current = [];
    
      const ring = (el: HTMLElement, shape: 'circle' | 'rect') => {
        el.style.outline = 'none';
        el.style.outlineOffset = '';
        el.style.boxShadow = '0 0 0 2px #4fb605';
        el.style.borderRadius = shape === 'circle' ? '9999px' : '8px';
        outlined.current.push(el);
      };
    
      if (target.classList.contains('keys')) {
        const keys = Array.from(target.querySelectorAll<HTMLElement>('.key'));
        keys.forEach(el => ring(el, 'circle'));
      } else if (
        target.classList.contains('numbersKeys') ||
        target.id === 'numbersKeys'
      ) {
        const pressed =
          target.querySelector<HTMLElement>('li.pressed') ||
          rootDoc.querySelector<HTMLElement>('.numbersKeys li.pressed');
        if (pressed) ring(pressed, 'circle');
        else ring(target, 'rect');
      } else if (target.id === 'center') {
        // ✅ circle for play/pause button
        ring(target, 'circle');
      } else {
        ring(target, 'rect');
      }
    }
    
    // ------------------------------------------------------------------------------------------

    try { target.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch {}

    const r = target.getBoundingClientRect();
    const p = step.pos ?? 'bottom';
    setPos(p);

    // iframe offset (if any)
    let frameOffsetX = 0, frameOffsetY = 0;
    const frameEl = target.ownerDocument?.defaultView?.frameElement as HTMLElement | null;
    if (frameEl) {
      const fr = frameEl.getBoundingClientRect();
      frameOffsetX = fr.left;
      frameOffsetY = fr.top;
    }

    const tipRect = tip.getBoundingClientRect();
    const gap = 14;
    const nudgeX = step.offsetX ?? 0;
    const nudgeY = step.offsetY ?? 0;

    let top = 0, left = 0;
    if (p === 'bottom') {
      top  = r.bottom + gap;
      left = r.left + (r.width - tipRect.width) / 2;
    } else if (p === 'top') {
      top  = r.top - tipRect.height - gap;
      left = r.left + (r.width - tipRect.width) / 2;
    } else if (p === 'right') {
      top  = r.top + (r.height - tipRect.height) / 2;
      left = r.right + gap;
    } else { // left
      top  = r.top + (r.height - tipRect.height) / 2;
      left = r.left - tipRect.width - gap;
    }

    let absTop  = top  + window.scrollY + frameOffsetY + nudgeY;
    let absLeft = left + window.scrollX + frameOffsetX + nudgeX;

    const margin = 8;
    absLeft = Math.max(margin, Math.min(absLeft, window.innerWidth  - tipRect.width  - margin));
    absTop  = Math.max(margin, Math.min(absTop,  window.innerHeight - tipRect.height - margin) + window.scrollY);

    setStyle({
      position: 'absolute',
      top: absTop,
      left: absLeft,
      zIndex: 9999,
      maxWidth: 320,
      background: '#111',
      color: '#fff',
      padding: '12px 14px',
      borderRadius: 10,
      boxShadow: '0 10px 30px rgba(0,0,0,.25)',
      font: '14px/1.4 system-ui',
    });
  }, [index, steps, next, highlight, getRoot, resolveTarget]);

  useIsoLayoutEffect(() => { place(); }, [place, index]);
  useEffect(() => {
    if (index == null) return;
    const onReflow = () => place();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [index, place]);

  if (!mounted || index == null) return null;
  const step = steps[index];

  const arrow = 10;
  const arrowStyle: React.CSSProperties =
    pos === 'bottom' ? { top: -arrow, left: '50%', transform: 'translateX(-50%)', border: `${arrow}px solid transparent`, borderBottomColor: '#111', borderTop: 0 } :
    pos === 'top'    ? { bottom: -arrow, left: '50%', transform: 'translateX(-50%)', border: `${arrow}px solid transparent`, borderTopColor: '#111',    borderBottom: 0 } :
    pos === 'right'  ? { left: -arrow, top: '50%',  transform: 'translateY(-50%)', border: `${arrow}px solid transparent`, borderRightColor: '#111',  borderLeft: 0 } :
                       { right: -arrow, top: '50%', transform: 'translateY(-50%)', border: `${arrow}px solid transparent`, borderLeftColor: '#111',   borderRight: 0 };

  return createPortal(
    <>
      <div onClick={() => next()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 9998 }} />
      <div ref={tipRef} data-pos={pos} style={style} className="tutorial-background">
        <div style={{ position: 'absolute', width: 0, height: 0, ...arrowStyle }} />
        <h4 style={{ margin: '0 0 6px 0', fontSize: 15 }}>{step.title}</h4>
        <div>{step.text}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={end} style={btn('outline')}>Skip</button>
          <button onClick={() => next()} style={btn()}>Next</button>
        </div>
      </div>
    </>,
    document.body
  );
}

function btn(variant?: 'outline'): React.CSSProperties {
  return variant === 'outline'
    ? {
        background: 'transparent',
        color: '#fff',
        border: '1px solid #fff',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
      }
    : {
        background: '#fff',
        color: '#111',
        border: 0,
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
      };
}
