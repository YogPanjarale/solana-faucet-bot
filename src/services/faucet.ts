import { Buffer } from "buffer";
import {Connection,Transaction,SystemProgram,PublicKey,Keypair,sendAndConfirmTransaction} from "@solana/web3.js";
import bs58 from "bs58";
const funds: Record<string, number> = {
	devnet: 0.1,
	testnet: 0.5,
};
export async function* airdrop(receiver: string, environment: string) {
	//mainnet-beta, testnet, devnet
	const network = `https://api.${environment}.solana.com`;
	// const network = `https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899`;
	console.log(`Connecting to ${network}`);
	const payer = "HaYr2syE3jfMC5EmetTHb8VfTwijenUcjv69zcTnWhNL"; // public key of payer address
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
	const pvkey: string =
		"3gGHosrFnjYNpaHPm4csdUt6D3utkqpgLVVdmQR8xExU1eM8o4tYtMQQJSBh1xGHxHwH9s3cmaDLXkWK89BdB5Zf"; //private key of payer address
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
			`https://solscan.io/tx/${confirmation}?cluster=${environment}`
		);
		return {
			state: "done",
			message: `https://solscan.io/tx/${confirmation}?cluster=${environment}`,
			amount: solTotal * 1e-9,
		};
	} catch (error: any) {
		console.log(error);
		throw new Error(error || "Error in transaction");
	}
}
