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

  build() {
    if (this.ext === ".md") {
      this.data = yamlFront.loadFront(this.file);
      this.content = md.render(this.data.__content);

      if (this.data.layout) {
        this.layout = this.data.layout;
      }
    }

    // After application specific parsing happens, we can utilize templates to
    // structure the content
    if (this.layout) {
      // We will only template the content if we have a layout defined
      const templatePath = path.join(this.layoutDir, this.layout);
      const template = fs.readFileSync(templatePath, { encoding: "utf-8" });
      this.output = ejs.render(template, this); // TODO support more than EJS maybe
    } else {
      // We will just return the raw page content as the final output
      this.output = this.content;
    }
  }
}

class BuildSite {
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
          file.build();
          console.log(file);
          return file.output;
        }
      },
      ".txt": {
        out_ext: ".html",
        func: (input) => {
          return input;
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

            fs.mkdirSync(outTargetSansExt);
            fs.writeFileSync(
              path.join(outTargetSansExt, `index${this.exts[ext].out_ext}`),
              output,
              { encoding: "utf-8" }
            );
          }
        } else {
          console.error(`Unable to find handler for file: ${target}`);
        }
      }
    }
  }
}

const build = new BuildSite("./site");

build.build();
