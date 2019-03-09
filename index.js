let express = require("express");
let bodyParser = require("body-parser");
let Mustache = require("mustache");
let pdf = require("html-pdf");
let fs = require("fs");
let app = express();
let port = process.env.PORT || 80;

let template = fs.readFileSync("template.html", "utf8");
Mustache.parse(template);

const htmlOptions = {
  height: "2.3125in",
  width: "3.8in",
  border: "0",

  base: "file:///Users/willfreeman/Developer/nametag/"
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
  fs.writeFileSync("./generatedNameTag.html", html);
  console.log(`creating PDF for member ${person.name}...`);
  pdf.create(html, htmlOptions).toFile("./generatedNameTag.pdf", (err, res) => {
    if (err) console.log(err);
    else console.log(`SUCCESS. You may open it now.`);
  });

  res.sendStatus(200);
});

app.listen(port);
console.log("Listening on port 80...");
