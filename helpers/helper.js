module.exports = {
  getArrIdChannels: (arr) => {
    const arrId = [];
    arr.channels.forEach((element) => arrId.push(element.id));
    return arrId;
  },
  dayDiffInDays: (d1, d2) => {
    let diff = (d2.getTime() - d1.getTime()) / (24 * 3600 * 1000);
    return diff;
  },
  checkTextMessage: (event) => {
    let text = event.text.toLowerCase().split(' ').join('');
    if (
      text == 'отчетзасегодня' ||
      text == 'сделанозасегодня' ||
      text == 'засегоднясделано'
    )
      return {
        channel: event.channel,
        id: event.user,
      };
    else return null;
  },
  checkDate: (str, now) => {
    let regExp = /(0?[1-9]|[12][0-9]|3[01])[- \/.](0?[1-9]|1[012])/;
    let date = '';

    str.split(' ').forEach((element) => {
      if (element.match(regExp)) {
        date = element;
      } else {
        return false;
      }
    });

    //Если в топике нет даты, отправляем сообщение
    if (!date) {
      return null;
    } else {
      let dateArr = date.split(/[.,\/ -]/);
      let topicDate = new Date(
        now.getFullYear(),
        +dateArr[1] - 1,
        +dateArr[0] + 1
      );
      return topicDate;
    }
  },
};
