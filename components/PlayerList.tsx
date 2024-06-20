import React, { useEffect, useState } from 'react';
import socket from '../socket';
import { WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";

export default function PlayerList() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const { publicKey, signTransaction, sendTransaction } = useWallet();

    useEffect(() => {
        socket.on('message', (msg) => {
            console.log(msg);
        });
    
        return () => {
            socket.off('message');
        };
    }, []);   
    
    const sendMessage = (text: string) => {
        socket.emit('message', text);
        setMessage('');
    };    

    useEffect(() => {
        sendMessage(publicKey ? publicKey.toString() : 'empty');
        console.log('key changed');
      }, [publicKey]);

    return(        
        <div>
            <div>
                {(publicKey ? publicKey.toString() : '')}
            </div>
        </div>
    );
}