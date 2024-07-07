import { Transaction } from "@solana/web3.js"

export type UserList = {
    id: string,
    status: number
}

export type payTransaction = {
    id: string,    
    transaction: Buffer,
}

export type GameState = {
    status: number;
    entryValue: number;
    users: UserList[]
}