import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";

const primaryColor = 'black';
const fontFamily = 'proxima-nova';
const segColors = ['#ffffff', '#c800a5', '#ffffff', '#0486d2', '#ffffff', '#c800a5', '#ffffff', '#0486d2', '#ffffff', '#c800a5', '#ffffff', '#0486d2'];
const numSegments = 12;

export interface SegmentObject {
    text: string;
    status: number;
}

export interface WheelComponentProps {
    segments: SegmentObject[];
    onFinished?: (segment: string) => void;
}

const WheelComponent = forwardRef(({segments, onFinished} : WheelComponentProps, ref) => {
    const [canvasSize, setCanvasSize] = useState(0);
    const [angleCurrent, setAngleCurrent] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [timerHandle, setTimerHandle] = useState<number | null>(null);

    let duration = 5000; // total spin duration
    let accelerationDuration = 5000; // acceleration phase duration
    let start: number | null = null;
    let frames: number = 0;
    let winningSegment: number = 0; // Set the winning segment index here

    WheelComponent.displayName = 'Wheel';

    useEffect(() => {
        const handleResize = () => {
            const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
            setCanvasSize(size);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if(!isSpinning && angleCurrent !== 0) setAngleCurrent(0);
    }, [segments])

    const easeInCubic = (t: number): number => {
        return t * t * t;
    };

    const easeOutCubic = (t: number): number => {
        return 1 - Math.pow(1 - t, 3);
    };

    const spin = (winner: string): void => {
        winningSegment = segments.findIndex(s => s.text === winner);
        setIsSpinning(true);
        if (!timerHandle) {
            start = null;
            frames = 0;
            const handle = window.requestAnimationFrame(onTimerTick);
            setTimerHandle(handle);
        }
    };

    useImperativeHandle(ref, () => ({
        spin,
    }));

    const onTimerTick = (timestamp: number): void => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const totalDuration = duration + accelerationDuration;
        const progress = Math.min(elapsed / totalDuration, 1);
        let easedProgress;

        if (elapsed < accelerationDuration) {
            // Acceleration phase
            easedProgress = easeInCubic(elapsed / accelerationDuration);
        } else {
            // Deceleration phase
            easedProgress = easeOutCubic((elapsed - accelerationDuration) / duration);
        }

        const anglePerSegment = (2 * Math.PI) / numSegments;
        const targetAngle = (3 * Math.PI / 2) - (winningSegment * anglePerSegment + anglePerSegment / 2);
        const totalRotations = 5; // Total rotations before stopping
        const finalAngle = targetAngle + totalRotations * (2 * Math.PI);

        setAngleCurrent(finalAngle * easedProgress);

        if (progress < 1) {
            const handle = window.requestAnimationFrame(onTimerTick);
            setTimerHandle(handle);
        } else {
            if(onFinished){
                onFinished(segments[winningSegment].text);            
            }
            
            setIsSpinning(false);
            setTimerHandle(null);
        }
    };

    const renderSegments = () => {
        const radius = canvasSize / 2 * 0.95;
        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const anglePerSegment = (2 * Math.PI) / numSegments;

        return segments.map((segment, index) => {
            const startAngle = anglePerSegment * index + angleCurrent;
            const endAngle = startAngle + anglePerSegment;
            const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            const textAngle = startAngle + anglePerSegment / 2;
            const textX = centerX + (radius / 1.5) * Math.cos(textAngle);
            const textY = centerY + (radius / 1.5) * Math.sin(textAngle);
            const needleSize = canvasSize / 10;

            return (
                <g key={index}>
                    <path
                        d={`M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag},1 ${x2},${y2} Z`}
                        fill={segColors[index]}
                    />
                    <path d={`M${centerX - 15},${0} L${centerX},${needleSize} L${centerX + 15},${0} Z`} stroke={'black'}/>
                    <text
                        x={textX}
                        y={textY}
                        fill="black"
                        fontFamily={fontFamily}
                        fontSize="18"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        transform={`rotate(${(textAngle * 180) / Math.PI},${textX},${textY})`}
                    >
                        {segment.text.substr(0, 5)} {segment.text !== '' ? segment.status : ''}
                    </text>
                </g>
            );
        });
    };

    return (
        <div id="wheel" style={{marginTop: '3Vh',  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>            
            <svg
                id="svg"
                width={canvasSize}
                height={canvasSize}
                viewBox={`0 0 ${canvasSize+10} ${canvasSize+10}`}
            >
                <circle
                    cx={canvasSize / 2}
                    cy={canvasSize / 2}
                    r={canvasSize / 2 * 0.99}
                    fill="#f797ee"
                    stroke="#f797ee"
                    strokeWidth="2"
                />                
                <path d={`M${canvasSize/2},0 L`}/>
                {renderSegments()}
                <circle
                    cx={canvasSize / 2}
                    cy={canvasSize / 2}
                    r={canvasSize * 0.04}
                    fill="#f797ee"
                    stroke="white"
                    strokeWidth="5"
                />
            </svg>
        </div>
    );
});

export default WheelComponent;