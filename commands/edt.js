const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const axios = require('axios');
const jsdom = require("jsdom");

/**
 * utils
 */
const checkDay = require('../utils/checkDay.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edt')
		.setDescription('Obtenez votre emploi du temps')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Sous la forme prenom.nom')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date')
                .setDescription('Date voulant être choisies, au format DD/MM/YYYY')),
	async execute(interaction) {
        let name = interaction.options.getString('nom');
        let date = interaction.options.getString('date');

        let error = false;
        let errorMessage = '';

        // Check si le nom est correct
        if(/^([a-zA-Z]+)[.]([a-zA-Z]+)$/g.test(name)){
            // Si aucune date n'est founis, la date du jour est choisie
            if(date == null) {
                date = moment();
            } else {
                // Sinon une vérification du format en fait
                let testDate = moment(date, 'DD/MM/YYYY');
                if (testDate.isValid()){
                    date = testDate;
                } else {
                    error = true;
                    errorMessage = `Erreur, le format de la date doit être DD ou DD/MM ou DD/MM/YYYY`;
                }
            }

        } else {
            error = true;
            errorMessage = `Erreur, le nom doit être de la forme prenom.nom`;
        }

        // Check si des erreurs de paramètres sont survenus
        if(error){
            await interaction.reply(`${errorMessage}`);
        } else {
            let message = new MessageEmbed()
                .setDescription('Emploi du temps en cours de chargement...')
                .setColor(0xcb2a17);
            
            // Si la commande est faite un weekend, ont recherche le lundi suivant
            if(checkDay.isWeekend(date)){
                date = checkDay.nextMonday(date);
                message.setDescription('Le jour demandé est un weekend, recherche du lundi suivant. \n\n Emploi du temps en cours de chargement...');
            }
            message.setTitle(`Emploi du temps ${date.format('DD/MM/YYYY').toString()}`);

            await interaction.reply({ embeds: [message] });

            let dayOfWeek = date.day();

            // Tableau prenant la position des cases (propriété CSS left), pour définir les jours de la semaine
            let sizeForDay = ['0' ,'103.1200%', '122.5200%', '141.9200%', '161.3200%', '180.7200%'];

            message.setDescription(' ');

            await axios.get(`https://edtmobiliteng.wigorservices.net/WebPsDyn.aspx?action=posEDTBEECOME&serverid=Camp&Tel=${name}&date=${date.format('MM/DD/YYYY').toString()}`, {headers: {'Content-Type': 'text/html'}})
                .then(function (response) {

                    let dom = new jsdom.JSDOM(response.data);
                    let document = dom.window.document;

                    let result = [];

                    // Remplissage des tableaux
                    let week = new Array();
                    week[0] = new Array();
                    week[1] = new Array();
                    week[2] = new Array();
                    week[3] = new Array();
                    week[4] = new Array();
                    week[5] = new Array();

                    // Pour chaque case de cours, ont l'ajoute dans l'index correspondant au jour de la semaine
                    document.querySelectorAll('.Case').forEach(cour => {
                        if(sizeForDay.indexOf(cour.style.left) !== -1){
                            week[sizeForDay.indexOf(cour.style.left)].push(cour);
                        }                          
                    })

                    // Pour chaque cour du jour de la semaine actuel, affichage des cours
                    week[dayOfWeek].forEach(elem => {
                        let mat = {
                            cours: elem.querySelector('.TCase .TCase').textContent,
                            heure: elem.querySelector('.TChdeb').innerHTML,
                            salle: elem.querySelector('.TCSalle').innerHTML,
                            prof: elem.querySelector('.TCProf').innerHTML
                        }

                        // Pour le prof, ont récupère uniquement son nom et prénom (séparé par un <br)
                        // Puis ont met la première lettre en majuscule de chaque prénom/nom
                        mat.prof = mat.prof.split('<br>')[0].replace(/(^\w|\s\w)/g, m => m.toUpperCase());

                        result.push(mat);
                    })

                    // Check si des cours ont été récupérer
                    if(result.length != 0){
                        result.forEach(elem => {
                            message.addField(`${elem.heure}`, `${elem.cours} \n ${elem.salle} \n ${elem.prof}`, false);
                        })
                    } else {
                        // Sinon affichage d'une message spécifique
                        message.addField('Pas de cours prévus ce jour.');
                    }
                })
                .catch(function (error) {
                    // handle error
                    console.log(error);
                });

            await interaction.editReply({ embeds: [message] });
        }
	},
};