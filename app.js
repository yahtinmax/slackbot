require('dotenv').config();

const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const schedule = require('node-schedule');
const helper = require('./helpers/helper');

const slackToken = process.env.SLACK_TOKEN;
const slackSigning = process.env.SLACK_SIGNING_SECRET;
const port = process.env.PORT;

const slackEvents = createEventAdapter(slackSigning);
const slackClient = new WebClient(slackToken);

let map = new Map();

slackEvents.on('message', async (event) => {
  try {
    let user = helper.checkTextMessage(event);
    if (user) {
      map.get(user.channel).forEach((val, index, arr) => {
        if (val == user.id) {
          arr.splice(index, 1);
        }
      });
    }
  } catch (err) {
    slackEvents.emit('error', err);
  }
});

slackEvents.on('error', console.error);

slackEvents.start(port).then(async () => {
  await genUserStr();
  console.log(`Server bot is running on port ${port}`);
});

//Работает каждый день с понедельника по пятницу в полночь
schedule.scheduleJob('0 0 0 * * 0-5', async () => {
  try {
    for (let channel of map.keys()) {
      await checkTopics(channel);
      map.get(channel).forEach(async (user, index, arr) => {
        if (user !== arr[0]) {
          await slackClient.chat.postMessage({
            channel: channel,
            text: `<@${user}>, пропустил отчет за день?`,
          });
        }
      });
    }
    await genUserStr();
  } catch (err) {
    slackEvents.emit('error');
  }
});

async function genUserStr() {
  try {
    let channels = helper.getArrIdChannels(
      await slackClient.conversations.list()
    );

    for (let channel of channels) {
      await slackClient.conversations
        .members({ channel: channel })
        .then((arr) => {
          map.set(channel, arr.members);
        });
    }
  } catch (err) {
    slackEvents.emit('error', err);
  }
}

async function checkTopics(channel) {
  try {
    let now = new Date();

    info = await slackClient.conversations.info({
      channel,
    });

    let topicDate = helper.checkDate(info.channel.topic.value, now);
    if (!topicDate) {
      await slackClient.chat.postMessage({
        channel,
        text: 'Внимание! Не указана дата дедлайна в топике',
      });
    } else {
      let diff = helper.dayDiffInDays(now, topicDate);
      if (diff >= 0 && diff <= 1) {
        await slackClient.chat.postMessage({
          channel: channel,
          text: 'Внимание, последний день до дедлайна',
        });
      } else if (diff < 0) {
        await slackClient.chat.postMessage({
          channel: channel,
          text: 'Дедлайн устарел, необходимо задать новый',
        });
      }
    }
  } catch (err) {
    slackEvents.emit('error', err);
  }
}
