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
    const [winner, setWinner] = useState<UserList>()
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

        socket.on('winner', (winner) => {
            setWinner(winner);
            if (wheelRef.current) {            
                wheelRef.current.spin();
            }
        })
    
        return () => {
            socket.off('paymentReceived');
            socket.off('winner');
        };
    }, []);  

    useEffect(() => {
        socket.on('toast', (toast) => {
            toast(`${toast}`);
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

      const addPlayer = () => {
        var segs = segments.slice();
        for (let i = 0; i < segs.length; i++) {
            const element = segs[i];

            if(element.text == 'Empty'){
                segs[i].text = i.toString();
                setSegments(segs);
                console.log(segments);
                return;
            }            
        }
      }

      const handleSpinClick = () => {
        console.log('ref', wheelRef);        
        if (wheelRef.current) {            
            wheelRef.current.spin();
        }
      };   
      
      const handleFinished = (segment: string) => {
        console.log(`Finished! The winning segment is ${segment}`);
      };      

    return(        
        <div style={{"height" : "100%", "width" : "100%"}}>
            {(publicKey ? (
                <div>
                    <div>
                        {"Your Wallet Address = " + publicKey.toString()}
                    </div>                    
                    <button onClick={joinGame}>Join</button>                    
                </div>
            ) : 'Not Connected')}
    <div id="wheelCircle">
      <WheelComponent
        ref={wheelRef}
        segments={segments}
        segColors={segColors}
        winningSegment={segments[0].text}
        onFinished={(winner) => onFinished(winner)}
        primaryColor="black"
        primaryColoraround="#f797ee"
        contrastColor="black"
        size={250}
        upDuration={200}
        downDuration={5000}
      />
    </div>        
        </div>
        
    );
}