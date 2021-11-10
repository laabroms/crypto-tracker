const express = require("express");
const nodemailer = require('nodemailer');
const PORT = 4000;
const app = express();


app.use(express.json());



let transport = nodemailer.createTransport({
   host: "smtp.gmail.com",
   port: 465,
   secure: true,
   auth: {
     user: process.env.EMAIL_USERNAME,
     pass: process.env.EMAIL_PASSWORD
   }
});


app.get("/", (req, res) => {
  res.send({ message: "Hello WWW!" });
});


app.post("/mail", (req, res) => {
    console.log(req.body)
    let data = req.body.toNotify;
    // console.log(Object.values(data[0]));
    console.log(Object.values(data[0])[0][0])
    console.log(
      new Date(Object.values(data[0])[0][0].timeChange * 1000)
        .toISOString()
        .substr(11, 8)
    );

    res.sendStatus(200);
//   console.log(data, ' here is the data');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
