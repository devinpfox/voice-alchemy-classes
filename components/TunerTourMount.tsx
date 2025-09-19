'use client';

import { useEffect, useRef, useState } from 'react';
import GuidedTour, { TourStep } from '@/components/GuidedTour';

const steps: TourStep[] = [
  {
    sel: '#tuner-frame',
    pos: 'bottom',
    title: 'Welcome',
    text: 'Welcome to your vocal tuner! This tool helps you train your voice by matching your pitch to reference notes. Let’s walk through how it works.',
  },
  {
    sel: '#micSensitivity',
    pos: 'top',
    title: 'Mic Sensitivity',
    text: 'This is your mic sensitivity. It controls how easily your microphone picks up sound. If it’s not detecting your voice, increase it. If it’s reacting to background noise, lower it.',
    offsetY: -2,
  },
  {
    sel: '.numbersKeys li.octave-number',
    pos: 'top',
    title: 'Octave Selector',
    text: 'These buttons let you choose an octave — the pitch range you want to practice in. Click a number to switch octaves. Lower numbers = deeper notes. Higher = brighter notes.',
  },
  {
    sel: '.keys',
    pos: 'top',
    title: 'Reference Notes',
    text: 'These are the notes you’ll try to match. Click any one to hear it played in the selected octave. Use it as your vocal target.',
  },
  {
    sel: '#center',
    pos: 'left',
    title: 'Play / Pause',
    text: 'This button plays or pauses the most recently selected note. Use it to hear the pitch repeatedly while you sing along.',
  },
  {
    sel: '.notes',
    pos: 'bottom',
    title: 'Pitch Detection',
    text: 'As you sing, the bars show your current pitch. Try to line it up with the reference note. When it turns green, you’ve matched the pitch!',
  },
  // {
  //   sel: '.nowplaying',
  //   pos: 'right',
  //   title: 'Now Playing',
  //   text: 'This shows the note that’s currently being played, so you always know what you’re trying to match.',
  // },
];




export default function TunerTourMount() {
  const startRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [frameDoc, setFrameDoc] = useState<Document | null>(null);

  useEffect(() => {
    const frame = document.getElementById('tuner-frame') as HTMLIFrameElement | null;
    if (!frame) return;

    const onLoad = () => {
      try {
        const doc = frame.contentDocument || frame.contentWindow?.document || null;
        setFrameDoc(doc);
      } catch {
        setFrameDoc(null);
      }
    };

    if (frame.contentDocument?.readyState === 'complete') onLoad();
    frame.addEventListener('load', onLoad);
    return () => frame.removeEventListener('load', onLoad);
  }, []);

  const handleClick = () => {
    const started = !!(startRef.current?.() ?? (window as any).startTour?.());
    if (!started) console.warn('[Tour] start() not wired yet (waiting for iframe or GuidedTour).');
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 10000,
          borderRadius: 999, padding: '10px 12px', background: '#111',
          color: '#fff', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 8, background: ready ? '#27ae60' : '#f39c12' }} />
        {ready ? 'How To' : 'How To (loading…)'}
      </button>

      {frameDoc && (
        <GuidedTour
          steps={steps}
          storageKey="student-video-pitch-tour"
          autoStart={false}
          onlyOnce={true}
          highlight={true}
          getRoot={() => frameDoc}
          exposeStart={(start) => { startRef.current = start; setReady(true); }}
        />
      )}
    </>
  );
}
