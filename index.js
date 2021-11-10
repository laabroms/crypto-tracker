import fetch from "node-fetch";
const DATA_ENDPOINT = "https://api.binance.us/api/v3/ticker/price";
import fs from "fs";

const SECONDS_IN_DAY = 86400;

const SECONDS_IN_HOUR = 3600;

const SECONDS_IN_THREE_HOURS = 10800;

const cryptos = [
  "BTCUSD",
  "ETHUSD",
  "BCHUSD",
  "LTCUSD",
  "BNBUSD",
  "ADAUSD",
  "BATUSD",
  "ETCUSD",
  "XLMUSD",
  "ZRXUSD",
  "LINKUSD",
  "RVNUSD",
  "DASHUSD",
  "ZECUSD",
  "ALGOUSD",
  "IOTAUSD",
  "WAVESUSD",
  "ATOMUSD",
  "NEOUSD",
  "QTUMUSD",
  "NANOUSD",
  "ICXUSD",
  "ENJUSD",
  "ONTUSD",
  "ZILUSD",
  "VETUSD",
  "XTZUSD",
  "HBARUSD",
  "OMGUSD",
  "MATICUSD",
  "REPUSD",
  "EOSUSD",
  "DOGEUSD",
  "KNCUSD",
  "VTHOUSD",
  "COMPUSD",
  "MANAUSD",
  "HNTUSD",
  "MKRUSD",
  "DAIUSD",
  "ONEUSD",
  "BANDUSD",
  "STORJUSD",
  "UNIUSD",
  "SOLUSD",
  "EGLDUSD",
  "PAXGUSD",
  "OXTUSD",
  "ZENUSD",
  "ONEBUSD",
  "FILUSD",
  "AAVDUSD",
  "GRTUSD",
  "SUSHIUSD",
  "ANKRUSD",
  "AMPUSD",
  "SHIBBUSD",
  "CRVUSD",
];

var dataTable = {};

let count = 0;
const LIMIT = 10;

const toNotify = [];

fs.readFile("data.json", "utf8", function readFileCallback(err, data) {
  if (err) {
    console.log(err);
  } else {
    dataTable = JSON.parse(data);
  }
});

const getData = async () => {
  let response = await fetch(DATA_ENDPOINT);
  let data = await response.json();

  return data;
};

const run = async () => {
  let data = await getData();
  if (data) {
    data.map((item, index) => {
      if (!cryptos.includes(item.symbol)) return;
      if (Object.keys(dataTable).includes(item.symbol)) {
        let row = { price: item.price, time: Date.now() };
        dataTable[item.symbol].unshift(row);
      } else if (!Object.keys(dataTable).includes(item.symbol)) {
        dataTable[item.symbol] = [];
        let row = { price: item.price, time: Date.now() };
        dataTable[item.symbol].unshift(row);
      }
    });
  }
  checkData(dataTable);

  deleteOldData();

  if (count == 200) {
    clearInterval(interval);
    fs.writeFile("data.json", JSON.stringify(dataTable), function (err) {
      if (err) throw err;
      console.log("complete");
    });

    fs.writeFile("toNotify.json", JSON.stringify(toNotify), function (err) {
      if (err) throw err;
      console.log("saved notifications");
    });

    return;
  }
};

const checkData = (dataTable) => {
  Object.values(dataTable).forEach((data, index) => {
    let coin = Object.keys(dataTable)[index];
    if (!cryptos.includes(coin)) return;
    let currentPrice = data[0].price;
    let globalMax = 0;
    let maxData;
    let maxUnderHourData;
    let maxUnder3HourData;
    let coinData = {};
    for (let x = 0; x < data.length; x++) {
      if (!data[x]) continue;
      let time = getTimeOffset(data[x].time);
      let percent = percentChange(data[x].price, currentPrice);
      if (Math.abs(percent) > Math.abs(globalMax)) {
        maxData = {
          key: "MAX",
          timeChange: time,
          percent: percent,
          data: data[x],
          currentData: data[0],
        };
        globalMax = percent;
      }

      // over 5 percent in an hour
      if (Math.abs(percent) > LIMIT && time < SECONDS_IN_HOUR) {
        maxUnderHourData = {
          key: "HOUR",
          timeChange: time,
          percent: percent,
          data: data[x],
          currentData: data[0],
        };
        maxUnderHourData = data[x];
      } else if (
        Math.abs(percent) > LIMIT &&
        time > SECONDS_IN_HOUR &&
        time < SECONDS_IN_THREE_HOURS
      ) {
        maxUnder3HourData = {
          key: "3HOUR",
          timeChange: time,
          percent: percent,
          data: data[x],
          currentData: data[0],
        };
      }
    }
    coinData[coin] = [maxData];
    if (maxUnderHourData) {
      coinData[coin].push(maxUnderHourData);
    }
    if (maxUnder3HourData) {
      coinData[coin].push(maxUnder3HourData);
    }
    toNotify.push(coinData);
  });
  // sendToMail();
};

const deleteOldData = () => {
  let filtered = Object.values(dataTable).map((data, dataIndex) => {
    return data.filter((item, index) => {
      let time = getTimeOffset(item.time);
      if (time < SECONDS_IN_DAY) {
        return item;
      }
    });
  });
  let dataObj = {};
  Object.keys(dataTable).forEach((coin, index) => {
    let currentCoin = Object.keys(dataTable)[index];
    if (!cryptos.includes(currentCoin)) return;
    dataObj[coin] = filtered[index];
  });
  dataTable = dataObj;
  return;
};

const percentChange = (val1, val2) => {
  return ((val2 - val1) / val1) * 100;
};

const getTimeOffset = (time) => {
  return (Date.now() - time) / 1000;
};

const sendToMail = async () => {
  let data = { toNotify };
  console.log(data);
  const response = await fetch("http://localhost:4000/mail", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
  // const data = await response.json();
};



let interval = setInterval(() => {
  run();
  count++;
}, 120000);
