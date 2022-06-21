const months = {
    0: 'January',
    1: 'February',
    2: 'March',
    3: 'April',
    4: 'May',
    5: 'June',
    6: 'July',
    7: 'August',
    8: 'September',
    9: 'October',
    10: 'November',
    11: 'December'
}
const days = {0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat'}        

var clocktext = document.getElementById("clocktext");
var datetext = document.getElementById("datetext");
var targetWidth = 0.9;
var curFontSize = 20;

function updateClock() {
    var d = new Date();
    const monthIndex = d.getMonth();
    const monthName = months[monthIndex];
    const dayIndex = d.getDay();
    const dayName = days[dayIndex];
    let date = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
    datetext.textContent = dayName + ", " + monthName + " " + date + ", " + d.getFullYear();
    var s = "";
    var colon = d.getSeconds()%2 == 0 ? '<span style="color:#AAAAAA;">:</span>' : ':';
    s += (10 > d.getHours() ? "0" : "") + d.getHours() + colon;
    s += (10 > d.getMinutes() ? "0" : "") + d.getMinutes();
    clocktext.innerHTML = s;
}

function updateTextSize() {
    for (var i = 0; 3 > i; i++) {
        curFontSize *= targetWidth / (clocktext.offsetWidth / clocktext.parentNode.offsetWidth);
        clocktext.style.fontSize = curFontSize + "pt";
        datetext.style.fontSize = (curFontSize/5) + "pt";
    }
}

updateClock();
function setDatetime() {
    var d = new Date();
    const monthIndex = d.getMonth();
    const monthName = months[monthIndex];
    const dayIndex = d.getDay();
    const dayName = days[dayIndex];

    let date = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
    let hour = d.getUTCHours() < 10 ? "0" + d.getUTCHours() : d.getUTCHours();
    let minute = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
    //document.getElementById("yymmdd").innerHTML = "<h3>" + dayName + ", " + monthName + " " + date + ", " + d.getFullYear() + "</h3>";
    document.getElementById("time").innerHTML = "<h1>" + hour + ":" + minute + "</h1>";
}
setInterval(updateClock, 1000);