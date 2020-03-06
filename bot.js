// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');
const { CosmosDbPartitionedStorage } = require("botbuilder-azure");
const restify = require('restify');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Create access to CosmosDb Storage - this replaces local Memory Storage.
var storage = new CosmosDbPartitionedStorage({
    cosmosDbEndpoint: process.env.DB_SERVICE_ENDPOINT, 
    authKey: process.env.AUTH_KEY, 
    databaseId: process.env.DATABASE_ID,
    containerId: process.env.CONTAINER
})

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        this.onMessage(async (turnContext, next) => {
            console.log('this gets called (message)');
            
            // Save updated utterance inputs.
            await logMessageText(storage, turnContext);
        });

        this.onConversationUpdate(async turnContext => { console.log('this gets called (conversation update)'); 
            await turnContext.sendActivity('[conversationUpdate event detected]'); 
        });

    }
}

// This function stores new user messages. Creates new utterance log if none exists.
async function logMessageText(storage, turnContext) {
    let utterance = turnContext.activity.text;
    let chatData = {
        user : [],
        bot : []
    }
    // debugger;
    try {
        var conversationId= "AwpC3WwRnPE6KGEDgj78bM-c"
        // Read from the storage.
        let storeItems = await storage.read([conversationId])
        // Check the result.
        var conversationLog = storeItems[conversationId];
        if (typeof (conversationLog) != 'undefined') {
            if(utterance == 'name'){
                chatData.user.push(utterance)
                await turnContext.sendActivity(`It’s nice to meet you user name! If I wasn’t a robot and could have kids I’d name them user name! The years between birth and starting school are a time of amazing growth and development. As your robo-support, I will guide you towards information and advice that is evidence based to help give your child the best possible start to life! How does that sound?`);
                chatData.bot.push('It’s nice to meet you user name! If I wasn’t a robot and could have kids I’d name them user name! The years between birth and starting school are a time of amazing growth and development. As your robo-support, I will guide you towards information and advice that is evidence based to help give your child the best possible start to life! How does that sound?')
                var reply = MessageFactory.suggestedActions(['Good', 'Bad', 'Normal']);
                await turnContext.sendActivity(reply);
            }else{
                chatData.user.push(utterance)
                await turnContext.sendActivity(`Raising a child can be really tough and the early years between 0-5 are formative. I have packaged decades worth of research and evidence into 12 chapters that you can access at any time. You can speak to me by pressing and holding the microphone button below and hear me read a message by pressing and holding a message. Press the button below to get started. `);
                chatData.bot.push('Raising a child can be really tough and the early years between 0-5 are formative. I have packaged decades worth of research and evidence into 12 chapters that you can access at any time. You can speak to me by pressing and holding the microphone button below and hear me read a message by pressing and holding a message. Press the button below to get started. ')
            }
            
            
            // The log exists so we can write to it.
            storeItems[conversationId].turnNumber++;
            storeItems[conversationId].UtteranceList.introduction.push(chatData);
            
            try {
                await storage.write(storeItems)
                
            } catch (err) {
                await turnContext.sendActivity(`Write failed of UtteranceLogJS: ${err}`);
            }
        }
        else{   
            console.log(`Creating and saving new utterance log`);
            chatData.user.push(utterance)
            await turnContext.sendActivity(`Hello, I’m Teddi! I am your early years 0-5 robo-support. What is your name?`);
            chatData.bot.push('Hello, I’m Teddi! I am your early years 0-5 robo-support. What is your name?')
            
            var turnNumber = 1;
            
            storeItems[conversationId] = { UtteranceList: { introduction: [chatData]}, "eTag": "*", turnNumber }

            try {
                await storage.write(storeItems)
                // await turnContext.sendActivity(`The list is now: ${storedString}`);
                
            } catch (err) {
                await turnContext.sendActivity(`Write failed: ${err}`);
            }
        }
    }
    catch (err){
        await turnContext.sendActivity(`Read rejected. ${err}`);
    }
}

module.exports.EchoBot = EchoBot;
