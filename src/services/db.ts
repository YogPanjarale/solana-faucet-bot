import { createClient } from "redis";

// 60 minutes

const timeout = parseInt(process.env.COMMAND_TIMEOUT || "60");
console.log(`Command timeout: ${timeout} minutes`);
const url = process.env.REDIS_URL;

export const redis = createClient(url ? { url } : undefined);

redis.on("error", (err) => console.log("Redis Client Error", err));
redis.on("connect", () => console.log("Redis Client Connected"));
await redis.connect();

export const makeKey = (userId: string, network: string) =>
	`${userId}:${network}`;
export const checkCanUseCommand = async (userId: string, network: string) => {
	const lastUsed = (await getLastUsed(userId, network)).lastUsed;
	const now = new Date().getTime();
	const diff = now - lastUsed;
    const canUseAfter  = (timeout * 60000 )- diff;
	return { can: diff > (timeout * 60 * 1000), after:  canUseAfter,timeout};
};

export const getLastUsed = async (userId: string, network: string) => {
	const lastUsed = await redis.get(`${userId}:${network}`);
	if (!lastUsed) {
		return {
			lastUsed: 0,
		};
	}
	return {
		lastUsed: parseInt(lastUsed),
	};
};
export const updateUser = async (userId: string, network: string) => {
	await redis.set(makeKey(userId, network), Date.now());
	console.log(`Updated user ${userId} on network ${network} to ${Date.now()}`);
	
};
