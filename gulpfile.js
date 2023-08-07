let project_folder = "dist";
let source_folder = "src";
let path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
  },
  src: {
    html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
    css: source_folder + "/scss/index.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/scss/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
  },
  clean: "./" + project_folder + "/",
};

const { src, dest, series, parallel, watch } = require("gulp");
const browsersync = require("browser-sync").create();
const fileinclude = require("gulp-file-include");
const del = require("del");
const autoprefixer = require("gulp-autoprefixer");
const sass = require("gulp-sass")(require("sass"));
const group = require("gulp-group-css-media-queries");
const clean_css = require("gulp-clean-css");
const uglify = require("gulp-uglify-es").default;
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const webphtml = require("gulp-webp-html");
const rename = require("gulp-rename");

function browserSync() {
  browsersync.init({
    server: {
      baseDir: "./" + project_folder + "/",
    },
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(webp({ quality: 70 }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(
      sass({
        outputStyle: "expanded",
      }).on("error", sass.logError)
    )
    .pipe(group())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true,
      })
    )
    .pipe(clean_css())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function watchFiles() {
  watch([path.watch.html], html);
  watch([path.watch.css], css);
  watch([path.watch.js], js);
  watch([path.watch.img], images);
}

function cleanTask() {
  return del(path.clean);
}

const build = series(cleanTask, parallel(js, css, html, images));
const dev = parallel(build, browserSync, watchFiles);

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.build = build;
exports.dev = dev;
exports.default = dev;
