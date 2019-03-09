let express = require("express");
let bodyParser = require("body-parser");
let Mustache = require("mustache");
let pdf = require("html-pdf");
let printer = require("printer-lp");
let fs = require("fs");
let app = express();

let port = process.env.PORT || 80;
let jobNumber = 0;

let template = fs.readFileSync("template.html", "utf8");
Mustache.parse(template);

const htmlOptions = {
  height: "2.3125in",
  width: "4in",
  border: "0",

  base: "file:///Users/uahav/Developer/cwn-name-tags/"
};

function convertToHTML(person) {
  let nameSegments = person.name.split(" ");
  let json = {
    firstName: nameSegments[0],
    lastName: nameSegments[nameSegments.length - 1],
    jobTitle: person.jobTitle,
    visitCount: person.visitCount,
    memberStatus: person.visitCount > 0 ? "veteran" : "first-timer"
  };
  return Mustache.render(template, json);
}

// support for JSON-encoded bodies
app.use(bodyParser.json());

// support for url encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// POST: /print
app.post("/print", (req, res) => {
  let person = req.body;
  let html = convertToHTML(person);
  console.log(`Received data for ${person.name}. Generating name tag.`);
  filename = `./generatedNameTag${jobNumber}.pdf`;
  pdf.create(html, htmlOptions).toFile(filename, (err, res) => {
    if (err) {
      console.log(err);
      return;
    }
    printer.printFile(filename, {destination: "DYMO"}, jobNumber).on("end", () => {
      console.log(`Job ${jobNumber} queued for printing.`);
      fs.unlink(filename, err => {
        if (err) console.log(err);
      });
      jobNumber++;
    }).on("error", err => {
      console.log(`ERROR queueing job ${jobNumber} for printing.`);
    });
  });

  res.sendStatus(200);
});

app.listen(port);
console.log("Listening on port 80...");
