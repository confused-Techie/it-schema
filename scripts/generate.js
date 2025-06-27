/**
 * Generate new data from the original `./data/schema.ttl` file.
 * Creating the following items:
 *  - JSON-LD data
*/

const fs = require("fs");
const ttl2jsonld = require("@frogcat/ttl2jsonld");
const XMLWriter = require("xml-writer");

const file_path = "./data/schema.ttl";

const ttl = fs.readFileSync(file_path, { encoding: "utf8" });

// Turtle => JSON-LD
const jsonld = ttl2jsonld.parse(ttl);

fs.writeFileSync("./generated/schema.jsonld", JSON.stringify(jsonld, null, 2), { encoding: "utf8" });


// JSON-LD => RDF+xml
const xw = new XMLWriter("\t");

xw.startDocument("1.0", "utf-8");
xw.startElement("rdf:RDF");

for (const prefix in jsonld["@context"]) {
  xw.writeAttribute(`xmlns:${prefix}`, jsonld["@context"][prefix]);
}

for (const item of jsonld["@graph"]) {
  xw.startElement(item["@type"]);
  // Take the `@id` and replace the context with the context's URL
  xw.writeAttribute("rdf:about", `${jsonld["@context"][item["@id"].split(":")[0]]}${item["@id"].split(":")[1]}`);
  for (const key in item) {
    switch(key) {
      case "@type":
      case "@id":
        continue;
      default:
        if (Object.hasOwn(item[key], "@id")) {
          // Seems based on schema.org's model, anything that has an inner id
          // should be it's own element with an `rdf:resource` attribute of the id
          xw.startElement(key);
          xw.writeAttribute("rdf:resource", item[key]["@id"]);
          xw.endElement(key);
        } else {
          xw.startElement(key);
          xw.text(item[key]);
          xw.endElement(key);
        }
    }
  }
  xw.endElement(item["@type"]);
}

xw.endElement("rdf:RDF");
xw.endDocument();

const rdf = xw.toString();

fs.writeFileSync("./generated/schema.rdf", rdf, { encoding: "utf8" });

// JSON-LD => HTML
