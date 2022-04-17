import { RateLimit, TIME_UNIT } from "@discordx/utilities";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { LOWBAL, memeImages, RICHBAL } from "../constants.js";
import { airdrop, getBalance, PAYER } from "../services/faucet.js";
import {
	BalanceResponse,
	TheBlockChainApi,
} from "../services/theblockchainapi.js";


// no funds image
const noFunds = new MessageEmbed({
	title: "Low on funds :(",
	image: {
		url: memeImages[Math.floor(Math.random() * memeImages.length)],
	},
});
const formatAddress = (address: string) => {
	if (address.length >= 10) {
		return (
			address.substring(0, 4) +
			"..." +
			address.substring(address.length - 4, address.length)
		);
	}
};
const toSol = (amount: number) => amount * 1e-9;
const checkValidAddress = (address: string) => {
	// check length is 44
	const length44 = address.length === 44;
	// check if base58
	const base58 = /^[A-Za-z0-9]+$/;
	const isBase58 = base58.test(address);
	return length44 && isBase58;
};
const BApi = new TheBlockChainApi(
	process.env.API_KEY_ID || "",
	process.env.API_KEY_SECRET || ""
);
const ErrorEmbed = (err: string) =>
	new MessageEmbed({ title: "Error", description: err, color: "#DE1738" });

const showError = async (error: string, interaction: CommandInteraction) => {
	const errorEmbed = ErrorEmbed(error);
	if (interaction.replied || interaction.deferred) {
		await interaction.editReply({
			embeds: [errorEmbed],
		});
		return;
	} else {
		await interaction.reply({ embeds: [errorEmbed] });
	}
};

@Discord()
export abstract class SlashExample {
	@Guard(RateLimit(TIME_UNIT.seconds, 10))
	@Slash("ping")
	async ping(interaction: CommandInteraction): Promise<void> {
		interaction.reply("pong!");
	}
	@Slash("mainnet")
	async mainnet(interaction: CommandInteraction): Promise<void> {
		// reply with noFunds embed
		await interaction.deferReply();
		const embed = new MessageEmbed({
			title:"Low on funds :(",
			image: {
				url: memeImages[Math.floor(Math.random() * memeImages.length)],
			},
		});
		await interaction.editReply({ embeds: [embed] });
	}
	@Slash("balance")
	async balance(
		@SlashOption("address",{required:false}) address: string,
		
		interaction: CommandInteraction
	): Promise<void> {
		if (!address) {
			address = PAYER;
		}
		await interaction.deferReply();
		if (!checkValidAddress(address)) {
			await showError("Invalid address", interaction);
			return;
		}

		const balances:Record<string,number> = {
			"devnet": 0,
			"testnet": 0,
			"mainnet-beta": 0,
		}
		// loop over balances
		for (const network in balances) {
			try {
				const balance = await getBalance(address, network);
				balances[network] = balance.balance;
			} catch (e) {
				console.log(e);
			}
		}
		const embed = new MessageEmbed({
			title: "Balance",
			description: `${formatAddress(address)}`,
		});
		for (const network in balances) {
			embed.addField(
				`● ${network}`,
				`${balances[network]} SOL`,
			);
		}
		await interaction.editReply({ embeds: [embed] });
		
	}
	@Slash("faucet")
	async faucet(
		@SlashOption("address") address: string,
		@SlashOption("network", { required: false })
		@SlashChoice("devnet", "testnet", "mainnet-beta")
		network: "devnet" | "testnet" | "mainnet-beta",
		interaction: CommandInteraction
	): Promise<void> {
		if (!checkValidAddress(address)) {
			await showError("Invalid address", interaction);
			return;
		}
		if (!network) network = "devnet"
		await interaction.deferReply();
		// if network is mainnet then send mainnet no fund image
		if (network === "mainnet-beta") {
			await interaction.editReply({ embeds: [noFunds] });
			return;
		}
		try {
			// get balance
			const balance = await getBalance(address, network);
			console.log("balance",balance);
			const bal = balance as BalanceResponse;
			// check balance is greater than rich balance
			if (bal.balance > RICHBAL) {
				const richEmbed = new MessageEmbed({
					title: "You have more than enough funds, better consider donating some here",
					url:`https://solscan.io/address/${PAYER}`,
					thumbnail:{
						url:"https://cdn.discordapp.com/emojis/865518028979437599.webp?size=128&quality=lossless"
					}
				});

				await interaction.editReply({ embeds: [richEmbed] });
				return;
			}
		} catch (error:any) {
			await showError(error.message, interaction);
			return;
		}
		// check payer balance
		try {
			const payerBal = await getBalance(PAYER, network);
			if (payerBal.balance < LOWBAL[network]) {
				await interaction.editReply({ embeds: [noFunds] });
				return;
			}
		} catch (error:any) {
			await showError(error.message, interaction);
			return;
		}
		// send airdrop
		try {
			const airdropResponse =  airdrop(address, network);
			for (const i of [0,1]) {
				const val = (await airdropResponse.next()).value;
				if (val.state=="processing"){
					const embed = new MessageEmbed({
						title: "Airdrop is processing. Please wait.",
						color: "#DE1738",
						thumbnail:{
							url: "https://c.tenor.com/hRBZHp-kE0MAAAAC/loading-circle-loading.gif",
						}
					});
					await interaction.editReply({ embeds: [embed] });
				}
				if (val.state=="done"){
					const dis = `Airdropped ${val.amount} SOL to ${formatAddress(
						address
					)}`
					const embed = new MessageEmbed({
						title: "Airdrop was successful",
						description: dis,
						color: "#DE1738",
					});
					const linkButton = new MessageButton();
					linkButton.setLabel("View on solscan").setStyle("LINK").setURL(val.message)
					const actionrow = new MessageActionRow();
					actionrow.addComponents(linkButton);
					await interaction.editReply({ embeds: [embed] ,components: [actionrow] });
				}
			}
			return;
		} catch (e :any) {

			await interaction.editReply({ embeds: [ErrorEmbed(e.message)] });
			return 
		} 
	}
}

