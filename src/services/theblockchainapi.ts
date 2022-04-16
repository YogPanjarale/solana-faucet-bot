import fetch from "node-fetch";
import { Error } from "../types";

export interface BalanceResponse {
    balance: number
    unit: string
    network: string
  }
  

export class TheBlockChainApi {
	keyid: string;
	keysecret: string;

	constructor(keyid: string, keysecret: string) {
		this.keyid = keyid;
		this.keysecret = keysecret;
	}
	async getBalance(wallet: string,network="mainnet-beta"): Promise<BalanceResponse |Error> {
		const url = `https://api.blockchainapi.com/v1/solana/wallet/balance`;
		// console.log(this);
        const body ={
            "public_key": wallet,
            "network": network,
          }
		const response = await fetch(url, {
			method: "POST",
			headers: { APIKeyID: this.keyid, APISecretKey: this.keysecret },
            body: JSON.stringify(body),
		});
		const json = (await response.json()) as any;
		console.log(json);
		if (json.error_message) {
			return {
				errors: [
					{
						msg: json.error_message,
					},
				],
			};
		}
		console.log(json);
        return json;
	}

    
}
