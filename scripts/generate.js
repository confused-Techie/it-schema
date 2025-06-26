/**
 * Generate new data from the original `./data/schema.ttl` file.
 * Creating the following items:
 *  - JSON-LD data
*/

const fs = require("fs");
const ttl2jsonld = require("@frogcat/ttl2jsonld");

const file_path = "./data/schema.ttl";

const ttl = fs.readFileSync(file_path, { encoding: "utf8" });

const jsonld = ttl2jsonld.parse(ttl);

fs.writeFileSync("./generated/schema.jsonld", JSON.stringify(jsonld, null, 2), { encoding: "utf8" });
