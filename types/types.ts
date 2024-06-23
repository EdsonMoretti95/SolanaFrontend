import { Transaction } from "@solana/web3.js"

export type UserList = {
    id: string,
    status: number
}

export type payTransaction = {
    id: string,    
    transaction: Buffer,
}