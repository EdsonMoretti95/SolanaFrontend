import React, { useEffect, useState, useRef } from 'react';
import socket from '../socket';
import { WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync, createTransferInstruction, } from "@solana/spl-token";
import {  PublicKey, ParsedAccountData, LAMPORTS_PER_SOL, Transaction, } from "@solana/web3.js";
import { GameState, UserList, payTransaction } from '@/types/types';
import { toast } from 'react-toastify';
import { WalletSignTransactionError } from '@solana/wallet-adapter-base';
import WheelComponent, { SegmentObject } from './WheelComponent2';
import dynamic from 'next/dynamic';
import Popup from './Popup';

const gameInstructions = `Welcome to the $Horny game! \n\t

To play the game you need to connect a wallet that has your $Horny tokens and some SOL for gas.
Connecting your wallet won't give the app full control, it will only be able to see your public key and ask you to sign transactions. 
If you have safety concerns please create a temporary wallet, transfer $Horny tokens and cents in SOL for gas.
After connecting you can click join, the game will ask you to sign a transaction for X amount of Horny tokens. 
Once you sign the transaction you will be added to the wheel.
You should see the first 5 digits of your public address followed by a number 0 which is the status of the transaction, it will change to 1 once your transaction gets confirmed.
If the transaction is not confirmed within 2 minutes you will be automatically removed from the wheel.
If you status already changed to 1 (confirmed), you just need to wait until all the players join. 
We are currently testing with 4 players so we need 4 for a game to start.
The wheel should start to spin automatically if you are connected at the time of the winner selection.
If you are not connected you will miss the animation but you will be considered for the game anyway and if you win you will get the prize.
The winner gets the horny tokens from all the players that joined, you can check the transactions from the game wallet on solscan.
When the game ends, all the players will be removed from the wheel and you will be able to re-join.
Game Wallet: 5tky6gYsmZonaWbkregUFxt39AZzqrE9WLCdgEd5vdLn
If you have any questions, ask on telegram chat. Have fun!`;

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const emptySegments = [{text: '', status: 1 }, {text: '', status: 1 }, {text: '', status: 1 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }];

export default function PlayerList() {
    const wheelRef = useRef<any>(null);
    const [users, setUsers] = useState<UserList[]>([]);    
    const [segments, setSegments] = useState<SegmentObject[]>(emptySegments)
    const [gameStatus, setGameStatus] = useState<number>(-1); 
    const [transferAmount, settransferAmount] = useState<number>(50);    
    const { publicKey, signTransaction, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const [isPopupVisible, setPopupVisible] = useState(false);

    const showPopup = () => setPopupVisible(true);
    const closePopup = () => setPopupVisible(false);

    const DESTINATION_WALLET = '5tky6gYsmZonaWbkregUFxt39AZzqrE9WLCdgEd5vdLn'; 
    const MINT_ADDRESS = '2hnFpwft7BRhh7fcbkqaLzXubn76jNJNSyTZwdtDpump'; 

    useEffect(() => {
        socket.on('updateUsers', (gameState: GameState) => {            
            settransferAmount(gameState.entryValue);
            setGameStatus(gameState.status);
            setUsers(gameState.users);
            setSegments( segments.map((s, index) => users[index] ? {text: users[index].id, status: users[index].status } : emptySegments[index]) );
            console.log('update users');
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
        if(users.some(u => u.id === publicKey?.toString())){
          toast('You are already in the game');
          return;
        }
      
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
            transferAmount * Math.pow(10, numberofDecimals)
          ));
      
          const { blockhash } = await connection.getLatestBlockhash("confirmed");
          tx.recentBlockhash = blockhash;
          tx.feePayer = new PublicKey(publicKey!.toString());      
      
          if(signTransaction){
            signTransaction(tx).then(async (result) => {
                await new Promise(r => setTimeout(r, 2000));
                sendTransactionId({ id: publicKey ? publicKey?.toString() : '', transaction: result.serialize() });
                toast("Transaction Sent!");
            }).catch(() => {
              socket.emit('remove', publicKey!.toString());
            });                
          }    
        }catch (error) {
            console.log(error);
        }
      }

      const onFinished = (winner: string) => {
        toast('The winner is: ' + winner);
      }
    
    return(        
        <div style={{"height" : "100%", "width" : "100%"}}>
            <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start'}}>
                <WalletMultiButtonDynamic />
                <button className='button' onClick={showPopup}>Instructions</button>                
                <button onClick={joinGame} disabled={publicKey != null && gameStatus !== 0 ? false : true} className='button'>Join Game</button>
                {isPopupVisible && (<Popup message={gameInstructions} onClose={closePopup} />)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <label hidden={gameStatus === -1}>{gameStatus === 0 ? 'no game open' : `game open for ${transferAmount} $Horny`}</label>
            </div>            
            <div id="wheelComponent" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '93vh', width: '100vw' }}>
                <WheelComponent ref={wheelRef} segments={segments} onFinished={onFinished}/>
            </div>        
        </div>
        
    );
}