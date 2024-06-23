import { io } from 'socket.io-client';

const socket = io('https://solanabackend.onrender.com', {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
});

export default socket;