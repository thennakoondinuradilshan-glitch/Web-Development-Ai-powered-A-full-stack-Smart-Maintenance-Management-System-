const TIME_ZONE = 'Asia/Colombo';

function getDateParts(value = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(value));

  const get = type => parts.find(part => part.type === type)?.value;

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day'))
  };
}

function getOffsetMilliseconds(value, timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(value));

  const get = type => Number(parts.find(part => part.type === type)?.value || 0);

  return Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  ) - new Date(value).getTime();
}

function getDayBounds(value = new Date(), timeZone = TIME_ZONE) {
  const { year, month, day } = getDateParts(value, timeZone);
  const localMidnightGuess = Date.UTC(year, month - 1, day);
  const start = new Date(
    localMidnightGuess - getOffsetMilliseconds(localMidnightGuess, timeZone)
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

module.exports = {
  TIME_ZONE,
  getDayBounds
};
