require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');

const botSettings = require('./params.json');
const roleSettings = require('./role-config.json')

/**
 * commands
 */
const edt = require("./cmd/edt.js");
const role = require("./cmd/edt.js");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
  
client.on('message', msg => {

    if (msg.content.startsWith(botSettings.prefix)) {
        // Tableau contenant la commande et les arguments
        let messageContent = msg.content.slice(1).trim().split(/ +/g);

        // Récupère la commande (le premier mot du tableau)
        let command = messageContent.shift().toLowerCase();

        const server = client.guilds.cache.get(roleSettings.id_server);
        let member = server.members.cache.get(msg.author.id);
        let memberRoles = member.roles.cache.map(role => role.id);

        console.log(messageContent)
        if(botSettings.edt.includes(command)){
            console.log('Start');
            returnMessage = edt(messageContent);
            console.log('End');
            returnMessage.title = "Emploi du temps";
            returnMessage.color =  0xcb2a17;
            msg.channel.send(returnMessage);
        }

        if(botSettings.role.includes(command) && memberRoles.includes(roleSettings.id_admin_role)){
            
            let newMessage = '🤖***ROLE 🤖\n\n ***';
            roleSettings.roles.forEach(role => {
                if(role?.id_emoji){
                    newMessage += `${role.name} : <:${role.emoji}:${role.id_emoji}>\n\n`
                } else {
                    newMessage += `${role.name} : ${role.emoji}\n\n`
                }
            })
            newMessage += `*** Merci d'indiquer votre classe/promo à l'aide des emojis, une fois un grade sélectionné, il ne vous sera pas possible de revenir en arrière ! ***`;
            
            client.channels.cache.get(roleSettings.id_chan_grade)
            .send(newMessage)
            .then(function (message) {

                fs.readFile('role-config.json', 'utf8', (err, jsonString) => {
                   if (err) {
                       console.log("File read failed:", err)
                       return
                   }
                  var config = JSON.parse(jsonString)
                  config.idmsg = message.id
                  try {
                   fs.writeFileSync('role-config.json',JSON.stringify(config));
                 } catch (err) {
                   console.error(err)
                 }
                })

                roleSettings.roles.forEach(role => {
                    if(role?.id_emoji){
                        message.react(`:${role.emoji}:${role.id_emoji}`)
                    } else {
                        message.react(`${role.emoji}`)
                    }
                })
               
            }).catch((error) => console.error(error));

        }
    }
    
});

// On recupère les events
client.on('raw', event => {
    // On récupère les evenements réactions
    if (event.t == "MESSAGE_REACTION_ADD") {

        // On lis le fichier config 
        fs.readFile('./role-config.json', 'utf8', (err, jsonString) => {

        // on push le json dans la variable config
          var config = JSON.parse(jsonString);

          // Si erreur de lecture on return une erreur
            if (err) {
                console.log("File read failed:", err)
                return
            }

            // On verifie que la réaction ne viens pas du bot lui meme lors de l'initialisation
            if (event.d.user_id !== config.botid) {

                // On check si le l'id du message réagi et celui présent dans config
                if (event.d.message_id === config.idmsg) {
                    // On verifie si l'emoji correspond bien à la liste d'emoji dédié à l'attribution des roles
                    var result = config.roles.some(element => element.emoji === event.d.emoji.name)

                    // Si l'emoji correspond à la liste alors on récupère l'user et l'emoji selectionné
                    if (result) {

                        const server = client.guilds.cache.get(config.id_server);
                        var member = server.members.cache.get(event.d.user_id)
                        
                        let memberRoles = member.roles.cache.map(role => role.id);
                        
                        let coursRoles = config.roles.map(role => role.id_role);
                        
                        if(!memberRoles.some(r => coursRoles.includes(r))){
                            let roleattr = config.roles.find(role => role.emoji === event.d.emoji.name);
                            member.roles.add(`${roleattr.id_role}`)
                            if (roleattr.group) {
                                member.roles.add(`${roleattr.group}`)
                            }
                            console.log('Ajout du role')
                        }
                    }
                }
            } 
        })
    }
});

client.login(process.env.TOKEN);