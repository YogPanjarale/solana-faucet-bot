import { Buffer } from "buffer";
import {Connection,Transaction,SystemProgram,PublicKey,Keypair,sendAndConfirmTransaction} from "@solana/web3.js";
import bs58 from "bs58";
const funds: Record<string, number> = {
	devnet: 0.1,
	testnet: 0.5,
};
export const PAYER = "4MywjWfWyqYs9bcABMkubeYz28XgR1eJ8589GtRTNDtZ";
const PVKEY = process.env.PAYER_PRIVATE_KEY!;
export async function* airdrop(receiver: string, environment: string) {
	//mainnet-beta, testnet, devnet
	const network = getNetwork(environment);

	console.log(`Connecting to ${network}`);
	const payer = PAYER; // public key of payer address
	const solTotal = funds[environment];
	const fromPubkey = new PublicKey(payer);
	const toPubkey = new PublicKey(receiver);

	const connection = new Connection(network);
	const transaction = new Transaction().add(
		SystemProgram.transfer({
			fromPubkey,
			toPubkey,
			lamports: solTotal * 1e9,
		})
	);
	const {
		 blockhash 
	} = await connection.getRecentBlockhash();
	transaction.recentBlockhash = blockhash;
	transaction.feePayer = new PublicKey(payer);
	const pvkey: string = PVKEY; //private key of payer address
	const buf = bs58.decode(pvkey);
	const secretKey: Uint8Array = buf;
	console.log(Keypair.generate().secretKey);
	const signers = [
		{
			publicKey: new PublicKey(payer),
			secretKey,
		},
	];
	if (!transaction) {
		throw new Error("Transaction is null" || "Transaction not found !");
	}
	try {
		console.log("Doing transaction");
		yield {
			state: "processing",
			message: "Doing transaction",
			amount: solTotal * 1e-9,
		};
		const confirmation = await sendAndConfirmTransaction(
			connection,
			transaction,
			signers
		);
		console.log(
			`https://explorer.solana.com/tx/${confirmation}?cluster=${environment}`
		);

		return {
			state: "done",
			message: `https://solscan.io/tx/${confirmation}?cluster=${environment}`,
			amount: solTotal,
		};
	} catch (error: any) {
		console.log(error);
		throw new Error(error || "Error in transaction");
	}
}

function getNetwork(environment: string) {
	return `https://api.${environment}.solana.com`;
}

export async function getBalance(address:string,network:string){
	// network url
	const url = getNetwork(network);
	// connection
	const connection = new Connection(url,"confirmed");
	
	const balance = await connection.getBalance(new PublicKey(address));
	return {
		balance: balance / 1e9,
	}
}