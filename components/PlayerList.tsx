import React, { useEffect, useState } from 'react';
import socket from '../socket';
import { WalletProvider, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getOrCreateAssociatedTokenAccount, getAssociatedTokenAddressSync, createTransferInstruction, } from "@solana/spl-token";
import {  PublicKey, ParsedAccountData, LAMPORTS_PER_SOL, Transaction, } from "@solana/web3.js";
import { UserList, payTransaction } from '@/types/types';
import { toast } from 'react-toastify';
import { WalletSignTransactionError } from '@solana/wallet-adapter-base';

export default function PlayerList() {
    const [users, setUsers] = useState<UserList[]>([]);
    const { publicKey, signTransaction, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const DESTINATION_WALLET = '5tky6gYsmZonaWbkregUFxt39AZzqrE9WLCdgEd5vdLn'; 
    const MINT_ADDRESS = '2hnFpwft7BRhh7fcbkqaLzXubn76jNJNSyTZwdtDpump'; 
    const TRANSFER_AMOUNT = 50;    

    useEffect(() => {
        socket.on('updateUsers', (users: UserList[]) => {
            setUsers(users);                    
        });
    
        return () => {
            socket.off('updateUsers');
        };
    }, []);    

    useEffect(() => {
        socket.on('paymentReceived', (users) => {
            toast('Transaction Confirmed!');
        });
    
        return () => {
            socket.off('paymentReceived');
        };
    }, []);  

    useEffect(() => {
        socket.on('toast', (winner) => {
            toast(`${winner}`);
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
          // send this to backend and execute it there

          //const signature = await connection.sendRawTransaction(signedTransaction.serialize()); // Send the signed transaction
          //connection.confirmTransaction(signature, 'confirmed');          
        }catch (error) {
            console.log(error);
        }
      }    

    return(        
        <div>
            {(publicKey ? (
                <div>
                    <div>
                        {"Your Wallet Address = " + publicKey.toString()}
                    </div>                    
                    <button onClick={joinGame} className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full`}>Join</button>                    
                    <ul>
                        {
                            users ? 
                            users.map((item, index) => (
                                <li key={index}>{`Player ${index} - ${item.id} - ${item.status}`}</li>
                            ))
                            :
                            ''
                        }
                    </ul>                    
                </div>
            ) : 'Not Connected')}
        </div>
    );
}