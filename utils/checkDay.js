function isWeekend(date) {
    let dayOfWeek = date.day();
    if (dayOfWeek == 0 || dayOfWeek == 6) {
        return true;
    }
    return false;
}

function nextMonday(date) {
    let dayOfWeek = date.day();
    if (dayOfWeek == 0) {
        return date.add(1, 'days')
    }
    if (dayOfWeek == 6) {
        return date.add(2, 'days')
    }
}

module.exports = { isWeekend, nextMonday };