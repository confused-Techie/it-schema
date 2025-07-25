/**
 * --ONLY RUN AFTER generate.js--
 * This file uses all data made from `generate.js` as well as just about
 * everything else in this repository to create the final website.
 */

const fs = require("fs");
const path = require("path");
const yamlFront = require("yaml-front-matter");
const MarkdownIt = require("markdown-it");
const ejs = require("ejs");

const md = MarkdownIt({
  html: true
});

class BuildFile {
  constructor(file, ext) {
    this.file = file; // The raw file input
    this.ext = ext; // The file extension of the original file
    this.layoutDir = "./site/_layouts";
    // Page Data
    this.content; // The first pass processing of the file content, prior to being templated
    this.layout; // The layout that should be used for templating, if one is defined
    this.data; // Any data picked up from the page metadata
    this.output; // The final file output
  }

  initialize() {
    if (this.ext === ".md") {
      this.data = yamlFront.loadFront(this.file);
      this.content = md.render(this.data.__content);

      if (this.data.layout) {
        this.layout = this.data.layout;
      }
    } else if (this.ext === ".js" || this.ext === ".jsonld") {
      this.content = JSON.parse(this.file);
    } else {
      // If we don't recognize the extension, assign the file as content, hope
      // it's already been parsed
      this.content = this.file;
    }
  }

  build() {
    // After application specific parsing happens, we can utilize templates to
    // structure the content
    if (this.layout) {
      // We will only template the content if we have a layout defined
      const templatePath = path.join(this.layoutDir, this.layout);
      const template = fs.readFileSync(templatePath, { encoding: "utf-8" });
      this.output = ejs.render(template, this, {
        views: [path.resolve(this.layoutDir)]
      }); // TODO support more than EJS maybe
    } else {
      // We will just return the raw page content as the final output
      this.output = this.content;
    }
  }
}

class BuildSite {
  /**
   * Named ModDir after the Apache config option of the same name that enables
   * 'Provides for "traling slash" redirects and serving directory index files'
   * Basically, allowing an 'index.html' file to be served automatically when
   * a user redirects to it's directory. This method will take the given file
   * and create it's top level directory and then write it's contents to an index
   * file.
   */
  static WriteApacheModDir(outTarget, content) {
    const outTargetSansExt = outTarget.replace(path.extname(outTarget), "");
    // TODO check for this folder existing first, but pretty sure the function
    // will fail by default if that's the case
    fs.mkdirSync(outTargetSansExt);
    fs.writeFileSync(
      path.join(outTargetSansExt, `index.html`),
      content,
      { encoding: "utf-8" }
    );
  }

  constructor(dir) {
    this.input = dir;
    this.output = path.resolve("./_dist");

    // Defines handling of different extensions
    // The input to each func called is the contents of the file
    this.exts = {
      ".md": {
        out_ext: ".html",
        func: (input) => {
          const file = new BuildFile(input, ".md");
          file.initialize();
          file.build();
          return file.output;
        }
      }
    };
  }

  build() {
    // Clean output
    if (fs.existsSync(this.output)) {
      fs.rmSync(path.join(this.output, path.sep), { recursive: true });
    }

    // Initialize output dir
    if (!fs.existsSync(this.output)) {
      fs.mkdirSync(this.output);
    }

    this.enumerateFiles(this.input, []);
  }

  enumerateFiles(dir, pathArray) {
    // dir: The starting directory
    // pathArray: The array of path entries

    // Ignores directories begining with `_` during enumeration

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const target = path.join(dir, file);
      const outDir = path.join(this.output, path.join(...pathArray));
      const outTarget = path.join(this.output, path.join(...pathArray), file);

      if (fs.lstatSync(target).isDirectory()) {
        if (file.startsWith("_")) {
          continue;
        }

        fs.mkdirSync(path.join(outDir, file));

        return this.enumerateFiles(target, [ ...pathArray, file]);

      } else {
        const ext = path.extname(target);

        if (this.exts[ext]) {
          const input = fs.readFileSync(target, { encoding: "utf-8" });

          const output = this.exts[ext].func(input);

          const outTargetSansExt = outTarget.replace(path.extname(outTarget), "");
          // ^^ Remove the extension of the out target so we can treat it like a dir

          // If this file is one just named index, then we can write it directly
          // to the file system within whatever folder it is already in.
          // Although if it is a named file, we will create a directory of that
          // file name, and place the output of the file inside that folder instead
          // as it's index file
          if (path.parse(target).name === "index") {
            // Place simple into it's folder as the index file, which it already is
            fs.writeFileSync(`${outTargetSansExt}${this.exts[ext].out_ext}`, output, { encoding: "utf-8" });
          } else {
            // Place output in it's own folder as the index file
            this.WriteApacheModDir(outTarget, output);
          }
        } else {
          console.error(`Unable to find handler for file: "${target}" copying in full.`);
          fs.copyFileSync(target, outTarget);
        }
      }
    }
  }
}

const build = new BuildSite("./site");

build.build();

// Now with all the normal content having been built, the JSON-LD data can be
// triggerred manually
const jsonLdDataRaw = fs.readFileSync("./generated/schema.jsonld", { encoding: "utf-8" });

// Starting with individual pages for each node of our JSON-LD graph

const jsonLdData = JSON.parse(jsonLdDataRaw);

for (const node of jsonLdData["@graph"]) {
  const nodeFile = new BuildFile(node, "");
  nodeFile.layout = "jsonld_node.ejs";
  nodeFile.initialize();

  // Then we will manually search the rest of the graph and add any properties
  // and enumerations of our current id so they can be displayed in the page
  nodeFile.content["@children"] = [];
  nodeFile.content["@enumerations"] = [];

  for (const innerNode of jsonLdData["@graph"]) {
    if (typeof innerNode["rdfs:domain"] == "object" && innerNode["rdfs:domain"]["@id"] == node["@id"]) {
      nodeFile.content["@children"].push(innerNode);
    }
    if (innerNode["@type"] === node["@id"]) {
      nodeFile.content["@enumerations"].push(innerNode);
    }
  }

  // Lastly before building we want to add the original JSON-LD data to the pages
  // meta data to ensure it can appear in the header of the page
  nodeFile.data = {};
  nodeFile.data.jsonld = JSON.parse(jsonLdDataRaw); // We parse the original data to ensure it's clean from modification
  nodeFile.build();

  const outNodeTargetSansExt = path.join(build.output, node["rdfs:label"]);
  BuildSite.WriteApacheModDir(outNodeTargetSansExt, nodeFile.output);
}

// Now to build the full hierarchy page containing the top level data for the schema
// But to do so, first we will create a custom object of the data as needed to
// avoid an overly complex EJS file.

const findDescendentClasses = (parent) => {
  let list = [];

  for (const node of jsonLdData["@graph"]) {
    if (node["@type"] === "rdfs:Class" && typeof node["rdfs:subClassOf"] === "object" && node["rdfs:subClassOf"]["@id"] === parent) {
      // Our current node is a class that is a subclass of the parent, lets see if
      // it itself has any descendents
      node["@children"] = findDescendentClasses(node["@id"]);
      list.push(node);
    }
  }

  return list;
};

const findBaseClasses = () => {
  const list = [];

  for (const node of jsonLdData["@graph"]) {
    if (node["@type"] === "rdfs:Class" && typeof node["rdfs:subClassOf"] === "object" && node["rdfs:subClassOf"]["@id"].startsWith("schema:")) {
      // Our current node is a class that descends from schema.org, so for our
      // purposes is a base class. Lets find it's descendents
      node["@children"] = findDescendentClasses(node["@id"]);
      list.push(node);
    }
  }

  return list;
};

const hierarchyData = findBaseClasses();

const jsonLdFile = new BuildFile(hierarchyData, "");
jsonLdFile.layout = "jsonld_tree.ejs";
jsonLdFile.data = {};
jsonLdFile.data.title = "Full schema hierarchy";
jsonLdFile.initialize();
jsonLdFile.build();

fs.writeFileSync(path.join(build.output, "schema.html"), jsonLdFile.output, { encoding: "utf-8" });

// Finally manually move over all data files
fs.copyFileSync("./generated/schema.jsonld", path.join(build.output, "schema.jsonld"));
fs.copyFileSync("./generated/schema.rdf", path.join(build.output, "schema.rdf"));
fs.copyFileSync("./data/schema.ttl", path.join(build.output, "schema.ttl"));
