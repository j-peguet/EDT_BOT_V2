const http = require("http");
const axios = require('axios');
const jsdom = require("jsdom");
const Discord = require('discord.js');

module.exports = function(params) {

    var who = (params[0].includes(".") ? params[0] : params[1]);
    var sDate = (!params[0].includes(".") ? params[0] : params[1]);

    let embededMsg = new Discord.MessageEmbed();

    // Tableau prenant la position des cases (propriété CSS left), pour définir les jours de la semaine
    let sizeForDay = ['0' ,'103.1200%', '122.5200%', '141.9200%', '161.3200%', '180.7200%'];

    axios.get(`https://edtmobiliteng.wigorservices.net/WebPsDyn.aspx?action=posEDTBEECOME&serverid=Camp&Tel=${who}&date=${sDate}`, {headers: {'Content-Type': 'text/html'}})
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

            date = new Date;
            dayOfWeek = date.getDay();

            // Pour chaque cour du jour de la semaine actuel, affichage des cours
            week[dayOfWeek].forEach(elem => {
                let mat = {
                    cours: elem.querySelector('.TCase .TCase').textContent,
                    heure: elem.querySelector('.TChdeb').innerHTML,
                    salle: elem.querySelector('.TCSalle').innerHTML,
                    prof: elem.querySelector('.TCProf').innerHTML
                }
                

                result.push(mat);
            })

            console.log(result);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
    
    return embededMsg;

}