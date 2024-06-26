import React, { useEffect, useState, useRef } from 'react';

export interface WheelComponentProps {
  segments: string[];
  segColors: string[];
  winningSegment: string;
  onFinished: (segment: any) => void;
  primaryColor?: string;
  contrastColor?: string;
  upDuration?: number;
  downDuration?: number;
  fontFamily?: string;
  fontSize?: string;
  outlineWidth?: number;
}

const WheelComponent = ({
  segments,
  segColors,
  winningSegment,
  onFinished,
  primaryColor = 'black',
  contrastColor = 'black',
  upDuration = 100,
  downDuration = 1000,
  fontFamily = 'proxima-nova',
  fontSize = '4vw',
  outlineWidth = 10
}: WheelComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(0);
  let currentSegment = '';
  let isStarted = false;
  let timerHandle = 0;
  const timerDelay = segments.length;
  let angleCurrent = 0;
  let angleDelta = 0;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let maxSpeed = Math.PI / segments.length;
  const upTime = segments.length * upDuration;
  const downTime = segments.length * downDuration;
  let spinStart = 0;
  let frames = 0;

  useEffect(() => {
    const handleResize = () => {
      if (wheelRef.current) {
        const { offsetWidth } = wheelRef.current;
        setSize(offsetWidth / 2 - 20); // Adjust this value to suit your needs
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (size > 0) {
      wheelInit();
    }
  }, [size, segments]);

  const wheelInit = () => {
    initCanvas();
    wheelDraw();
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = size * 2 + 40;
    canvas.height = size * 2 + 40;

    canvas.addEventListener('click', spin, false);
    canvasContext = canvas.getContext('2d');
  };

  const spin = () => {
    console.log('angle current ' + angleCurrent);
    console.log('angle delta ' + angleDelta);
    console.log('timer handle ' + timerHandle);
    console.log('frames ' + frames);

    isStarted = true;
    if (timerHandle === 0) {
      spinStart = new Date().getTime();
      maxSpeed = Math.PI / segments.length;
      frames = 0;
      timerHandle = window.setInterval(onTimerTick, timerDelay);
    }
  };

  const onTimerTick = () => {
    frames++;
    draw();
    const duration = new Date().getTime() - spinStart;
    let progress = 0;
    let finished = false;
    if (duration < upTime) {
      progress = duration / upTime;
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2);
    } else {
      if (winningSegment) {
        if (currentSegment === winningSegment && frames > segments.length) {
          progress = duration / upTime;
          angleDelta =
            maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
          progress = 1;
        } else {
          progress = duration / downTime;
          angleDelta =
            maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        }
      } else {
        progress = duration / downTime;
        angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
      }
      if (progress >= 1) finished = true;
    }

    angleCurrent += angleDelta;
    while (angleCurrent >= Math.PI * 2) angleCurrent -= Math.PI * 2;
    if (finished) {
      onFinished(currentSegment);
      clearInterval(timerHandle);
      timerHandle = 0;
      angleDelta = 0;
    }
  };

  const wheelDraw = () => {
    clear();
    drawWheel();
    drawNeedle();
  };

  const draw = () => {
    clear();
    drawWheel();
    drawNeedle();
  };

  const drawSegment = (key: number, lastAngle: number, angle: number) => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    const value = segments[key];
    const centerX = size + 20;
    const centerY = size + 20;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, size, lastAngle, angle, false);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = segColors[key % segColors.length];
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((lastAngle + angle) / 2);
    ctx.fillStyle = contrastColor;
    ctx.font = `bold ${fontSize} ${fontFamily}`;
    ctx.fillText(value.substring(0, 6), size / 2 + 20, 0);
    ctx.restore();
  };

  const drawWheel = () => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    let lastAngle = angleCurrent;
    const len = segments.length;
    const PI2 = Math.PI * 2;
    const centerX = size + 20;
    const centerY = size + 20;

    ctx.lineWidth = 1;
    ctx.strokeStyle = primaryColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = '1em ' + fontFamily;
    for (let i = 1; i <= len; i++) {
      const angle = PI2 * (i / len) + angleCurrent;
      drawSegment(i - 1, lastAngle, angle);
      lastAngle = angle;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, PI2, false);
    ctx.closePath();

    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();
  };

  const drawNeedle = () => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    const centerX = size + 20;
    const centerY = size + 20;

    ctx.lineWidth = 1;
    ctx.strokeStyle = contrastColor;
    ctx.fillStyle = contrastColor;
    ctx.beginPath();
    ctx.moveTo(centerX - (size / 100 * 5), centerY - size - 15);
    ctx.lineTo(centerX + (size / 100 * 5), centerY - size - 15);
    ctx.lineTo(centerX, centerY - size + (size / 100 * 20));
    ctx.closePath();
    ctx.fill();
    const change = angleCurrent + Math.PI / 2;
    let i =
      segments.length -
      Math.floor((change / (Math.PI * 2)) * segments.length) -
      1;
    if (i < 0) i = i + segments.length;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 1.5em ' + fontFamily;
    currentSegment = segments[i];
    isStarted && ctx.fillText(currentSegment, centerX + 10, centerY + size + 50);
  };

  const clear = () => {
    if (!canvasContext) {
      return false;
    }
    const ctx = canvasContext;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  return (
    <div ref={wheelRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef}/>
    </div>
  );
};

export default WheelComponent;
