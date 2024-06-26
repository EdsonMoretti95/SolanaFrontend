import React, { useEffect, useState, useRef } from 'react';
import socket from '../socket';
import { WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync, createTransferInstruction, } from "@solana/spl-token";
import {  PublicKey, ParsedAccountData, LAMPORTS_PER_SOL, Transaction, } from "@solana/web3.js";
import { UserList, payTransaction } from '@/types/types';
import { toast } from 'react-toastify';
import { WalletSignTransactionError } from '@solana/wallet-adapter-base';
import WheelComponent, { segmentObject } from './WheelComponent2';

const emptySegments = [{text: '', status: 1 }, {text: '', status: 1 }, {text: '', status: 1 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }];

export default function PlayerList() {
    const wheelRef = useRef<any>(null);
    const [users, setUsers] = useState<UserList[]>([]);
    const [segments, setSegments] = useState<segmentObject[]>(emptySegments)
    const { publicKey, signTransaction, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const DESTINATION_WALLET = '5tky6gYsmZonaWbkregUFxt39AZzqrE9WLCdgEd5vdLn'; 
    const MINT_ADDRESS = '2hnFpwft7BRhh7fcbkqaLzXubn76jNJNSyTZwdtDpump'; 
    const TRANSFER_AMOUNT = 50;  
    
      const segColors = [
        '#ffffff', 
        '#c800a5', 
        '#ffffff', 
        '#0486d2',
        '#ffffff', 
        '#c800a5', 
        '#ffffff', 
        '#0486d2', 
        '#ffffff',  
        '#c800a5',
        '#ffffff',
        '#0486d2',
      ]
      const onFinished = (winner: any) => {
        toast(`The winner is ${winner}`);
      }

    useEffect(() => {
        socket.on('updateUsers', (users: UserList[]) => {            
            setUsers(users);
            setSegments( segments.map((s, index) => users[index] ? {text: users[index].id, status: users[index].status } : emptySegments[index]) );
            console.log(segments);
        });
    
        return () => {
            socket.off('updateUsers');
        };
    }, []);    

    useEffect(() => {
        socket.on('paymentReceived', (users) => {
            toast('Transaction Confirmed!');
        });

        socket.on('winner', (win: string) => {
            if (wheelRef.current) {
                wheelRef.current.spin(win);
            }            
        })
    
        return () => {
            socket.off('paymentReceived');
            socket.off('winner');
        };
    }, []);  

    useEffect(() => {
        socket.on('toast', (msg) => {
            toast(msg);
        });
    
        return () => {
            socket.off('toast');
        };
    }, []);   
          
    const joinGame = () => {        
        console.log("click join");
        joinTransfer().then( () => {
            socket.emit('join', publicKey);
        });
    }

    const sendTransactionId = (transaction: payTransaction) => {
        socket.emit('payTransaction', transaction);
    }

    const joinTransfer =  async () => {      
        try
        {
          let sourceAccount = await getAssociatedTokenAddressSync(
            new PublicKey(MINT_ADDRESS), 
            new PublicKey(publicKey!.toString() ), 
            false);
      
          let destinationAccount = await getAssociatedTokenAddressSync(
            new PublicKey(MINT_ADDRESS), 
            new PublicKey(DESTINATION_WALLET), 
            false);
      
          let numberofDecimals = 6;//await getNumberDecimals(MINT_ADDRESS);
      
          const tx = new Transaction();
          tx.add(createTransferInstruction(
            sourceAccount,
            destinationAccount,
            new PublicKey(publicKey!.toString()),
            TRANSFER_AMOUNT * Math.pow(10, numberofDecimals)
          ));
      
          const { blockhash } = await connection.getLatestBlockhash("confirmed");
          tx.recentBlockhash = blockhash;
          tx.feePayer = new PublicKey(publicKey!.toString());      
      
          if(signTransaction){
            signTransaction(tx).then(async (result) => {
                console.log('went here');
                await new Promise(r => setTimeout(r, 2000));
                sendTransactionId({ id: publicKey ? publicKey?.toString() : '', transaction: result.serialize() });
                toast("Transaction Sent!");
            });                
          }    
        }catch (error) {
            console.log(error);
        }
      }    

    return(        
        <div style={{"height" : "100%", "width" : "100%"}}>
            {(publicKey ? (
                <div>
                    <button onClick={joinGame} className='join-game-button'>Join Game</button>
                </div>
            ) : 'Not Connected')}            
            <div id="wheelCircle">
            <WheelComponent
                ref={wheelRef}
                segments={segments}
                segColors={segColors}
                onFinished={(winner) => onFinished(winner)}
                primaryColor="black"
                primaryColoraround="#f797ee"
                contrastColor="black"
                upDuration={200}
                downDuration={2000}
            />
            </div>        
        </div>
        
    );
}