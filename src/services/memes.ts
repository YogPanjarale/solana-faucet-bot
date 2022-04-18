export  class Memes {
    richGuyMemes = [
        "https://cdn.discordapp.com/attachments/954398254236315691/965276709647691846/IMG_20220417_211148.jpg",
        "https://cdn.discordapp.com/attachments/954398254236315691/965276709870010418/images_69.jpeg",
        "https://cdn.discordapp.com/attachments/954398254236315691/965276710117449798/logo200.png"
    ]
    richGuyDefault = "https://cdn.discordapp.com/attachments/958293505065758760/965576203664777286/unknown.png";
    lowBalanceMemes = [
        "https://cdn.discordapp.com/attachments/954398254236315691/965277220031574106/ZomboMeme_16042022204050.jpg",
        "https://media.discordapp.net/attachments/954398254236315691/965277220279042088/This_Is_The_Worst_Day_Of_My_Life_16042022200140.jpg",
        "https://cdn.discordapp.com/attachments/954398254236315691/965277220564258816/Kanye_West_Holding_Notepad_16042022195337.jpg"
    ]
    lowBalanceDefault = "https://cdn.discordapp.com/attachments/958293505065758760/965580817009115146/unknown.png";
    mainNetMemes = [
        "https://cdn.discordapp.com/attachments/954398254236315691/965278129079857192/Two_Guys_On_A_Bus_16042022201611.jpg",
        "https://cdn.discordapp.com/attachments/954398254236315691/965278129327333396/bhnzit1p1i881.jpg"
    ]
    mainNetDefault = "https://cdn.discordapp.com/attachments/958293505065758760/965581194362228766/unknown.png"
    memes = process.env.SHOW_MEMES || true;
    constructor() {
        
    }
    getRichGuyMeme() {
        return this.memes ? this.richGuyMemes[Math.floor(Math.random() * this.richGuyMemes.length)]:this.richGuyDefault;
    }
    getLowBalanceMeme() {
        return this.memes ? this.lowBalanceMemes[Math.floor(Math.random() * this.lowBalanceMemes.length)]:this.lowBalanceDefault;
    }
    getMainNetMeme() {
        return this.memes?this.mainNetMemes[Math.floor(Math.random() * this.mainNetMemes.length)] : this.mainNetDefault;
    }
}

