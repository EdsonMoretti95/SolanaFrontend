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

const gameInstructions = `<!DOCTYPE html>
<div>
  <p><strong>Starting a Game:</strong></p>
  <ul>
	<li>Only mods can start a game through the Horny Wheel bot on our main TG chat.</li>
	<li>The "Join Game" button is only available when a game is running.</li>	
    <li>If there's no game open, please ask for a game on the main chat, we are happy to start and join as well to show you how it works.</li>
    <li>When a mod starts a game, a time in minutes is given to the bot, the wheel will spin after the amount of minutes given.</li>
    <li>The mod can also set the amount of $Horny tokens to be gambled on that game, it will show the amount on the bot message and on top of the wheel.</li>	
  </ul>
  <p><strong>Connecting Your Wallet:</strong></p>
  <ul>
	<li>You need a Solana wallet, the ones we tested with so far are Phantom and Solflare.</li>
    <li>Ensure your wallet contains $Horny tokens and some SOL for gas.</li>    
  </ul>

  <p><strong>Safety Concerns:</strong></p>
  <ul>
	<li>Connecting your wallet will not give the app full control; it will only be able to see your public key and ask you to sign transactions.</li>  
    <li>If you are concerned, create a temporary wallet and transfer $Horny tokens along with a tiny amount of SOL for gas.</li>
  </ul>

  <p><strong>Joining the Game:</strong></p>
  <ul>
    <li>After connecting your wallet, click "Join Game".</li>
    <li>The game will ask you to sign a transaction for X $Horny tokens.</li>
  </ul>

  <p><strong>Transaction Confirmation:</strong></p>
  <ul>
    <li>Once you sign the transaction, you will be added to the wheel.</li>
    <li>You should see the first 5 digits of your public address followed by a number "0" indicating the transaction status.</li>
    <li>The status will change to "1" once your transaction gets confirmed by the blockchain.</li>
	<li>If the transaction simulation fails for some reason like not having gas or enough $Horny you will be removed immediately from the wheel.</li>
    <li>If the transaction is not confirmed within 2 minutes, you will be automatically removed from the wheel.</li>
  </ul>

  <p><strong>Game Start:</strong></p>
  <ul>
    <li>The wheel will spin automatically if you are connected to the game when the timer reaches 0.</li>
    <li>If you are not connected, you will miss the animation but still be considered for the game. If you win, you will get the prize.</li>
	<li>The winner selection is completely random, for those of you who know a bit of coding, it uses Math.Random to get an index on the list of players.</li>
  </ul>

  <p><strong>Winner Announcement:</strong></p>
  <ul>
	<li>The address of the winning wallet will be announced on our TG by the horny wheel bot.</li>
    <li>The winner gets the $Horny tokens from all the players that joined.</li>
    <li>You can check the transactions from the game wallet on Solscan to verify that the prize was sent.</li>
    <li>After the winner is announced the game will close and all players kicked out, the mods can then start a new game.</li>	
  </ul>

  <p><strong>Game Wallet:</strong><br>5tky6gYsmZonaWbkregUFxt39AZzqrE9WLCdgEd5vdLn</p>
</div>`;

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const emptySegments = [{text: '', status: 1 }, {text: '', status: 1 }, {text: '', status: 1 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }, {text: '', status: 0 }];

export default function PlayerList() {
    const wheelRef = useRef<any>(null);
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
            setSegments( segments.map((s, index) => gameState.users[index] ? {text: gameState.users[index].id, status: gameState.users[index].status } : emptySegments[index]) );
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
        joinTransfer().then( () => {
            socket.emit('join', publicKey);
        });
    }

    const sendTransactionId = (transaction: payTransaction) => {
        socket.emit('payTransaction', transaction);
    }

    const getTransferAmount = async () => {
      let response = await fetch('https://solanabackend.onrender.com/entryFee');
      let result = await response.json();       
      return result.entryFee;
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
          let entryFee = await getTransferAmount();
      
          const tx = new Transaction();
          tx.add(createTransferInstruction(
            sourceAccount,
            destinationAccount,
            new PublicKey(publicKey!.toString()),
            entryFee * Math.pow(10, numberofDecimals)
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
            socket.emit('remove', publicKey!.toString());
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