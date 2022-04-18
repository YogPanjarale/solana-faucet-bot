import { RateLimit, TIME_UNIT } from "@discordx/utilities";
import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { LOWBAL, memeImages, RICHBAL } from "../constants.js";
import { checkCanUseCommand, updateUser } from "../services/db.js";
import { airdrop, getBalance, PAYER } from "../services/faucet.js";
import { Memes } from "../services/memes.js";

const memes = new Memes()

// no funds image
const noFunds = new MessageEmbed({
	title: "Low on funds :(",
	image: {
		url: memes.getLowBalanceMeme(),
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
	@Slash("ping")
	async ping(interaction: CommandInteraction): Promise<void> {
		const {can,timeout, after} = await checkCanUseCommand(interaction.member?.user.id||"no","no");
		if (!can) {
			await ShowCoolDown(after, timeout, interaction);
			return;
		}
		await updateUser(interaction.member?.user.id||"no","no");
		interaction.reply("pong!");
	}
	
	@Slash("balance")
	async balance(
		// @SlashOption("address",{required:false}) address: string,
		
		interaction: CommandInteraction
	): Promise<void> {
		let address
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
			// description: `${formatAddress(address)}`,
		});
		for (const network in balances) {
			embed.addField(
				`● ${network}`,
				`${balances[network]} SOL`,
			);
		}
		embed.addField(
			"Donate",
			PAYER
		)
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
		
		// check cooldown
		const { can, timeout, after } = await checkCanUseCommand(interaction.member?.user.id||"no",network);
		if (!can) {
			await ShowCoolDown(after, timeout, interaction);
			return;
		}

		if (!network) network = "devnet"
		await interaction.deferReply();
		// if network is mainnet then send mainnet no fund image
		if (network === "mainnet-beta") {
			const embed = new MessageEmbed({
				title:":eyes:",
				image: {
					url: memes.getMainNetMeme(),
				},
			});
			await interaction.editReply({ embeds: [embed] });
			return;
		}
		try {
			// get balance
			const balance = await getBalance(address, network);
			console.log("balance",balance);
			const bal = balance as any;
			// check balance is greater than rich balance
			if (bal.balance > RICHBAL) {
				const richEmbed = new MessageEmbed({
					title: "You have more than enough funds, better consider donating some here",
					url:`https://solscan.io/address/${PAYER}`,
					image:{url:memes.getRichGuyMeme()},
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
						title: "Airdrop is processing. Please wait. <:loading:965627633192812544>",
						color: "#DE1738",
						// thumbnail:{
						// 	url: "https://cdn.discordapp.com/attachments/958293505065758760/965211329948438548/9c065ee7-89c1-4ba7-a238-7b466b85b4a9.gif",
						// }
					});
					await interaction.editReply({ embeds: [embed] });
				}
				if (val.state=="done"){
					const dis = `Airdropped ${val.amount} SOL to ${formatAddress(
						address
					)}`
					const embed = new MessageEmbed({
						title: "Airdrop was successful <:tick:965171012641624065>",
						description: dis,
						color: "#DE1738",
						// thumbnail:{
						// 	url: "https://cdn.discordapp.com/attachments/958293505065758760/965211430037106688/120f96fa-8ea7-4b7b-9445-3b3911cfaff4.gif",
						// }
					});
					const linkButton = new MessageButton();
					linkButton.setLabel("View on solscan").setStyle("LINK").setURL(val.message)
					const actionrow = new MessageActionRow();
					actionrow.addComponents(linkButton);
					await interaction.editReply({ embeds: [embed] ,components: [actionrow] });
					// update user
					await updateUser(interaction.member?.user.id||"no",network);
				}
			}
			return;
		} catch (e :any) {

			await interaction.editReply({ embeds: [ErrorEmbed(e.message)] });
			return 
		} 
	}
}

async function ShowCoolDown(after: number, timeout: number, interaction:CommandInteraction) {
	const time = after > 60000 ? `${Math.floor(after / 60000)} minutes` : `${Math.floor(after / 1000)} seconds`;
	const embed = new MessageEmbed({
		title: "Command Cooldown",
		description: `You can only request funds once every ${timeout} minutes. Try again in ${time}`,
		color: "#DE1738",
	});
	if (interaction.replied){
		await interaction.editReply({ embeds: [embed] });
	}else{
		await interaction.reply({ embeds: [embed] });
	}
}

