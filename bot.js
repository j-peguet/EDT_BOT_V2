require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })
const fs = require('fs');
const moment = require('moment');

const botSettings = require('./params.json');
const roleSettings = require('./role-config.json')

/**
 * utils
 */
const checkDay = require('./utils/checkDay.js');

/**
 * commands
 */
const edt = require("./commands/edt.js");
const role = require("./commands/edt.js");

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
  
client.on('message', async msg => {

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
            let who = '';
            let date = moment();
            let researchDate = '';
            let errorMsg = '';
            let error = false;

            // Check sur le premier param est bien prenom.nom
            if(messageContent[0] == undefined || !messageContent[0].includes(".")) {
                errorMsg = 'Merci de renseigner une identitée, sous la forme prenom.nom';
                error = true;
            } else {
                who = messageContent[0]
            }
            
            // Si aucune date n'est founis, la date du jour est choisie
            if(messageContent[1] == undefined) {
                researchDate = date
            } else {
                // Sinon une vérification du format en fait
                let testDate = moment(messageContent[1], 'DD/MM/YYYY')
                if (!testDate.isValid()){
                    errorMsg = 'Format de la date incorrect, doit être DD ou DD/MM ou DD/MM/YYYY';
                  error = true;
                } else {
                    researchDate = testDate;
                }
            }

            // Si aucune erreurs dans les arguments, ont lance la requête
            if(!error){
                loadingMessage = new Discord.MessageEmbed();
                loadingMessage.description = 'Emploi du temps en cours de chargement...';

                // Si la commande est faite un weekend, ont recherche le lundi suivant
                if(checkDay.isWeekend(researchDate)){
                    researchDate = checkDay.nextMonday(researchDate);
                    loadingMessage.description = 'Le jour demandé est un weekend, recherche du lundi suivant. \n\n Emploi du temps en cours de chargement...';
                }
                loadingMessage.title = `Emploi du temps ${researchDate.format('DD/MM/YYYY').toString()}`;
                loadingMessage.color =  0xcb2a17;

                // Envoi du message de chargement
                edtDescription = await msg.channel.send(loadingMessage);
    
                returnMessage = await edt.getEDT(who, researchDate);
                
                // Envoi du message final
                returnMessage.title = `Emploi du temps ${researchDate.format('DD/MM/YYYY').toString()}`;
                returnMessage.color = 0xcb2a17;
                edtDescription.edit(returnMessage);
            } else {
                // Lors d'une erreur, le message est renvoyé
                errorMessage = new Discord.MessageEmbed();
                errorMessage.title = 'Emploi du temps';
                errorMessage.color =  0xcb2a17;
                errorMessage.description = errorMsg;
                await msg.channel.send(errorMessage);
            }

            
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