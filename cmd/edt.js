const axios = require('axios');
const Discord = require('discord.js');
const jsdom = require("jsdom");

async function getEDT(who, researchDate) {

    let embededMsg = new Discord.MessageEmbed();
    let dayOfWeek = researchDate.day();

    // Tableau prenant la position des cases (propriété CSS left), pour définir les jours de la semaine
    let sizeForDay = ['0' ,'103.1200%', '122.5200%', '141.9200%', '161.3200%', '180.7200%'];

    await axios.get(`https://edtmobiliteng.wigorservices.net/WebPsDyn.aspx?action=posEDTBEECOME&serverid=Camp&Tel=${who}&date=${researchDate.format('MM/DD/YYYY').toString()}`, {headers: {'Content-Type': 'text/html'}})
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
                    week[sizeForDay.indexOf(cour.style.left)].push(cour)
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

            // Check si des cours ont été récupé
            if(result.length != 0){
                result.forEach(elem => {
                    embededMsg.addField(`${elem.heure}`, `${elem.cours} \n ${elem.salle} \n ${elem.prof}`, false);
                })
            } else {
                // Sinon affichage d'une message spécifique
                embededMsg.addField('Pas de cours prévus ce jour.');
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
    
    return embededMsg;

}

module.exports = { getEDT };