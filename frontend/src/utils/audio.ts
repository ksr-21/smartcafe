export const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone (pleasant soft chime starting at F#5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(739.99, ctx.currentTime); // F#5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Second tone (higher harmony A5 sounding slightly offset)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.6);
    
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.error('Audio API synthesis failed:', err);
  }
};
