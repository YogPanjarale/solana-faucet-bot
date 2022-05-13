# Solana faucet Discord bot

Discord bot on Solana Blockchain as faucet.
Easily fund your SOL account on devnet/testnet.

## Instruction on how to host on AWS EC2 or any other virtual machine

1. clone the repo

    ```sh
    git clone https://github.com/YogPanjarale/solana-faucet-bot.git
    ```

2. install dependencies

    ```sh
    cd solana-faucet-bot
    npm install
    ```

3. copy env.example to .env / or you can set system environment variables
    ![image](https://cdn.discordapp.com/attachments/958293505065758760/965650758089474098/unknown.png)

    ```sh
    cp .env.example .env
    ```

4. run the bot

    ```sh
    cd solana-faucet-bot // optional 
    npm run dev
    ```

-- Note
make sure to check this intents for the bot
![image](https://user-images.githubusercontent.com/64301340/168212970-b929266b-e922-44a8-a643-3566d935feed.png)
