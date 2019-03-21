let express = require("express");
let bodyParser = require("body-parser");
let Mustache = require("mustache");
let pdf = require("html-pdf");
let printer = require("printer-lp");
let fs = require("fs");
let app = express();

let port = process.env.PORT || 3000;
let jobNumber = 0;

let template = fs.readFileSync("/home/pi/cwn-name-tags/template.html", "utf8");
Mustache.parse(template);

const htmlOptions = {
  height: "2.3125in",
  width: "3.99in",
  border: "0",

  base: "file:///home/pi/cwn-name-tags/"
};

function checkAuth(req, res, next) {
  if (
    !req.headers.authorization ||
    req.headers.authorization !== process.env.APIKEY
  ) {
    console.log("Forbidden Request");
    res.sendStatus(403);
  } else next();
}

// support for JSON-encoded bodies
app.use(bodyParser.json());

// support for url encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use(checkAuth);

app.get("/test", (req, res) => {
  res.send("it works");
});

// POST: /print
app.post("/print", (req, res) => {
  let person = req.body;
  console.log(person);
  let html = Mustache.render(template, person);
  console.log(
    `Received data for ${person.firstName} ${
      person.lastName
    }. Generating name tag.`
  );
  filename = `./generatedNameTag${jobNumber}.pdf`;
  pdf.create(html, htmlOptions).toFile(filename, (err, res) => {
    if (err) {
      console.log(err);
      return;
    }
    printer
      .printFile(
        filename,
        { fitplot: true, media: "om_w167h288_58.76x101.6mm" },
        jobNumber
      )
      .on("end", () => {
        console.log(`Job ${jobNumber} queued for printing.`);
        fs.unlink(filename, err => {
          if (err) console.log(err);
        });
        jobNumber++;
      })
      .on("error", mesg => {
        console.log(mesg);
        console.log(`ERROR queueing job ${jobNumber} for printing.`);
      });
  });

  res.sendStatus(200);
});

app.listen(port);
console.log(`Listening on port ${port}...`);
