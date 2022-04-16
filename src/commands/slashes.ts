import { RateLimit, TIME_UNIT } from "@discordx/utilities";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { airdrop } from "../services/faucet.js";
import {
	BalanceResponse,
	TheBlockChainApi,
} from "../services/theblockchainapi.js";

// rich balance in lamport
const RICHBAL = 1e9;
// no funds image
const noFunds = new MessageEmbed({
	title: "No funds available on Mainnet",
	image: {
		url: "https://cdn.discordapp.com/attachments/958293505065758760/964885492803965018/bernie-sanders-asking-for-financial-support-memes.jpg",
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
	@Slash("balance")
	async balance(
		@SlashOption("address") address: string,
		interaction: CommandInteraction
	): Promise<void> {
		await interaction.deferReply();
		const balance = await BApi.getBalance(address);
		const error = balance as any;
		if (error.errors) {
			showError(error.errors[0].msg, interaction);
		} else {
			const bal = balance as BalanceResponse;
		}
	}
	@Slash("faucet")
	async faucet(
		@SlashOption("address") address: string,
		@SlashOption("network", { required: false })
		@SlashChoice("devnet", "testnet", "mainnet-beta")
		network: "devnet" | "testnet" | "mainnet-beta",
		interaction: CommandInteraction
	): Promise<void> {
		await interaction.deferReply();
		// if network is mainnet then send mainnet no fund image
		if (network === "mainnet-beta") {
			await interaction.editReply({ embeds: [noFunds] });
			return;
		}

		// get balance
		const balance = await BApi.getBalance(address, network);
		// check error
		const error = balance as any;
		if (error.errors) {
			showError(error.errors[0].msg, interaction);
			return 
		}
		const bal = balance as BalanceResponse;
		// check balance is greater than rich balance
		if (toSol(bal.balance) > RICHBAL) {
			const richEmbed = RichEmbed(bal);
			await interaction.editReply({ embeds: [richEmbed] });
			return;
		}
		// send airdrop
		try {
			const airdropResponse =  airdrop(address, network);
			for (const i of [0,1]) {
				const val = (await airdropResponse.next()).value;
				if (val.state=="processing"){
					const embed = new MessageEmbed({
						title: "Airdrop",
						description: `Airdrop is processing. Please wait.`,
						color: "#DE1738",
					});
					await interaction.editReply({ embeds: [embed] });
				}
				if (val.state=="success"){
					const dis = `Airdropped ${val.amount} lamport to ${formatAddress(
						address
					)}`
					const embed = new MessageEmbed({
						title: "Airdrop",
						color: "#DE1738",
					});
					embed.addField("Airdrop was successful.",dis)
					embed.addField("View on Sol Explorer",val.message)
					await interaction.editReply({ embeds: [embed] });
				}
			}
			return;
		} catch (e :any) {

			await interaction.editReply({ embeds: [ErrorEmbed(e.message)] });
			return 
		} 
		
		const embed = new MessageEmbed({
			title: "Balance for " + formatAddress(address),
			color: "#DE1738",
		});
		embed.addField("Lamports", `${bal.balance}`);
		embed.addField("Sol", `${toSol(bal.balance)}`);
		interaction.editReply({ embeds: [embed] });
	}
}
function RichEmbed(bal: BalanceResponse) {
	return new MessageEmbed({
		title: "You have enough funds",
		description: `You have ${toSol(bal.balance)} lamport`,
		color: "#DE1738",
	});
}

