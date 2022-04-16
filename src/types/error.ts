export type ErrorObj = {
	value?: string;
	msg: string;
	param?: string;
	location?: string;
};
export type Error = {
	errors?: ErrorObj[];
	status?: number;
	message?: string;
};