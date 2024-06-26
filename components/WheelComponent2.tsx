import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export interface segmentObject{
    text: string;
    status: number;
}

export interface WheelComponentProps {
  segments: segmentObject[];
  segColors: string[];
  winningSegment: string;
  onFinished: (segment: string) => void;
  primaryColor?: string;
  primaryColoraround?: string;
  contrastColor?: string;
  size?: number;
  upDuration?: number;
  downDuration?: number;
  fontFamily?: string;
  width?: number;
  height?: number;
}

const WheelComponent = forwardRef<unknown, WheelComponentProps>(({
  segments,
  segColors,
  winningSegment,
  onFinished,
  primaryColor,
  primaryColoraround,
  contrastColor,
  size = 290,
  upDuration = 1000,
  downDuration = 100,
  fontFamily = "proxima-nova",
  width = 100,
  height = 100
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let currentSegment: string = "";
  let isStarted: boolean = false;
  let timerHandle: number | NodeJS.Timeout = 0;
  const timerDelay: number = segments.length;
  let angleCurrent: number = 0;
  let angleDelta: number = 0;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let maxSpeed: number = Math.PI / segments.length;
  const upTime: number = segments.length * upDuration;
  const downTime: number = segments.length * downDuration;
  let spinStart: number = 0;
  let frames: number = 0;
  const centerX: number = 300;
  const centerY: number = 300;

  useEffect(() => {
    canvasContext = canvasRef.current?.getContext("2d") || null;
    initCanvas();
    wheelDraw();
  }, [segments]);

  useImperativeHandle(ref, () => ({
    spin
  }));

  const initCanvas = (): void => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.backgroundImage = './public/topbg.png';
      canvasContext = canvas.getContext("2d");
    }
  };

  const spin = (): void => {
    isStarted = true;
    if (timerHandle === 0) {
      spinStart = new Date().getTime();
      maxSpeed = Math.PI / segments.length;
      frames = 0;
      timerHandle = setInterval(onTimerTick, timerDelay);
    }
  };

  const onTimerTick = (): void => {
    frames++;
    wheelDraw();
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
          angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
          progress = 1;
        } else {
          progress = duration / downTime;
          angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        }
      } else {
        progress = duration / downTime;
        if (progress >= 0.8) {
          angleDelta = (maxSpeed / 1.2) * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        } else if (progress >= 0.98) {
          angleDelta = (maxSpeed / 2) * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        } else {
          angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        }
      }
      if (progress >= 1) finished = true;
    }

    angleCurrent += angleDelta;
    while (angleCurrent >= Math.PI * 2) angleCurrent -= Math.PI * 2;
    if (finished) {
      onFinished(currentSegment);
      clearInterval(timerHandle as number);
      timerHandle = 0;
      angleDelta = 0;
    }
  };

  const wheelDraw = (): void => {
    clear();
    drawWheel();
    drawNeedle();
  };

  const drawSegment = (key: number, lastAngle: number, angle: number): void => {
    if (!canvasContext) return;
    const ctx = canvasContext;
    const value = segments[key];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, size, lastAngle, angle, false);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = segColors[key];
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((lastAngle + angle) / 2);
    ctx.fillStyle = value.status == 0 ? 'black' : 'black'; // contrastColor || "white";
    ctx.font = "bold 1em " + fontFamily;
    ctx.fillText(`${value.text.substr(0, 5)} ${value.text != '' ? value.status.toString() : ''}`, size / 2 + 20, 0);
    ctx.restore();
  };

  const drawWheel = (): void => {
    if (!canvasContext) return;
    const ctx = canvasContext;
    let lastAngle = angleCurrent;
    const len = segments.length;
    const PI2 = Math.PI * 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = primaryColor || "black";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "1em " + fontFamily;
    for (let i = 1; i <= len; i++) {
      const angle = PI2 * (i / len) + angleCurrent;
      drawSegment(i - 1, lastAngle, angle);
      lastAngle = angle;
    }

    // Draw a center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, PI2, false);
    ctx.closePath();
    ctx.fillStyle = primaryColoraround || 'white';
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";
    ctx.fill();
    ctx.font = "bold 2em " + fontFamily;
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.stroke();

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, PI2, false);
    ctx.closePath();
    ctx.lineWidth = 25;
    ctx.strokeStyle = primaryColoraround || 'white';
    ctx.stroke();
  };

  const drawNeedle = (): void => {
    if (!canvasContext) return;
    const ctx = canvasContext;
    ctx.lineWidth = 1;
    ctx.strokeStyle = contrastColor || "white";
    ctx.fillStyle = contrastColor || "white";
    ctx.beginPath();
    ctx.beginPath();
    ctx.moveTo(centerX - (size / 100 * 5), centerY - size - 15);
    ctx.lineTo(centerX + (size / 100 * 5), centerY - size - 15);
    ctx.lineTo(centerX, centerY - size + (size / 100 * 20));
    ctx.closePath();
    ctx.fill();
    const change = angleCurrent + Math.PI / 2;
    let i = segments.length - Math.floor((change / (Math.PI * 2)) * segments.length) - 1;
    if (i < 0) i = i + segments.length;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "transparent";
    ctx.font = "bold 1.5em " + fontFamily;
    currentSegment = segments[i].text;
    if (isStarted) {
      ctx.fillText(currentSegment, centerX + 10, centerY + size + 50);
    }
  };

  const clear = (): void => {
    if (!canvasContext) return;
    const ctx = canvasContext;
    ctx.clearRect(0, 0, 600, 600);
  };

  const closeModal = () => {

  }

  return (
    <div id="wheel">
        <canvas
            id="canvas"
            width="600"
            height="600"
            ref={canvasRef}
        />

        <div id="winnerModal" className="modal" style={{'display': 'none'}}>
            <div className="modal-content">
                <h1 id="winnerMessage">YOU ARE A WINNER!</h1>
                <div id="confetti"></div>
                <button id="closeModalButton" onClick={closeModal}>Close</button>
            </div>
        </div>      
    </div>
  );
});

export default WheelComponent;
