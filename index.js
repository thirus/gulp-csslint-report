"use strict";

var through = require('through2');
var path = require('path');
var fs = require('fs-extra');
var gutil = require('gulp-util');
var util = require('util');
var htmlencode = require('htmlencode');

module.exports = function (opt) {
    "use strict";
    opt = opt || {};
    var dir = opt.directory || './logs/';
    var filename = dir + (opt.filename || 'csslint-report.html');

    fs.ensureDirSync(dir);

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var d = new Date();
    var i = 0;
    var totalErrors = 0, totalFiles = 0, totalSuccess = 0;

    var stream = fs.createWriteStream(filename);

    stream.write("<!DOCTYPE html>");
    stream.write("<html>");
    stream.write("<head>");
    stream.write('<meta charset="utf-8"/>');
    stream.write("<title>Css Lint Report</title>");
    stream.write('<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css"/>');
    stream.write("<style>");
    stream.write('.stat {\
                    font-weight: 800;\
                    text-transform: uppercase;\
                    font-size: 0.85em;\
                    color: #6F6F6F;\
                }' +
        '.val {\
                    font-size: 38px;\
                    font-weight: bold;\
                    margin-top: -10px;\
                }');
    stream.write("</style>");
    stream.write("</head>");
    stream.write("<body>");
    stream.write('<div class="container">');
    stream.write("<h1>CssLint Reports</h1>");
    stream.write(util.format('<div class="panel panel-default"> \
  <div class="panel-heading">   \
    <h3 class="panel-title">Summary</h3>    \
  </div>    \
  <div class="panel-body">  \
    <div class="col-md-2 col-sm-4 col-xs-6 text-center">    \
       <div class="stat">\
	   Files\
       </div>\
       <div class="val ignore-val" id="totalFilesCount">1</div>\
     </div>\
     <div class="col-md-2 col-sm-4 col-xs-6 text-center text-success">\
       <div class="stat">\
	   Success\
       </div>\
       <div class="val ignore-val" id="successCount">1</div>\
     </div>\
     <div class="col-md-2 col-sm-4 col-xs-6 text-center text-danger">\
       <div class="stat">\
	   Errors\
       </div>\
       <div class="val ignore-val" id="errorCount">1</div>\
     </div>\
    <div class="col-md-3 col-sm-6 col-xs-8 text-center">\
       <div class="stat">\
	   Date\
       </div>\
       <div class="val ignore-val">%s</div>\
     </div>\
     <div class="col-md-2 col-sm-4 col-xs-6 text-center">\
       <div class="stat">\
	   Time\
       </div>\
       <div class="val ignore-val">%s</div>\
     </div>\
  </div>\
</div>', d.getDate() + " " + monthNames[d.getMonth()] + ", " + d.getFullYear(), d.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3")));
    stream.write('<div class="panel-group" id="accordion">');

    function end(cb) {
        stream.write("</div>");
        stream.write("</div>");
        stream.write('<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>');
        stream.write('<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>');
        stream.write("<script>");
        stream.write("$(function(){");
        stream.write(util.format('$("#totalFilesCount").text("%s");', totalFiles));
        stream.write(util.format('$("#successCount").text("%s");', totalSuccess));
        stream.write(util.format('$("#errorCount").text("%s");', totalErrors));
        stream.write("});");
        stream.write("</script>");
        stream.write(util.format('<input type="hidden" name="totalErrors" value="%s" />', totalErrors));
        stream.write("</body>");
        stream.write('</html>');
        stream.end(null, function () {
            cb();
        });
    }

    function startSection(st, filename, results) {
        //st.write(util.format('<section class="panel panel-%s">', results.length > 0 ? "danger" : "success"));
        st.write('<div class="panel panel-default">');
        st.write('<div class="panel-heading">');
        st.write(util.format('<h4 class="panel-title"><a href="#%s" data-toggle="collapse" data-parent="#accordion">%s ', i, filename));
        st.write('<div class="pull-right">');
        if (results.length == 0) st.write('<small class="text-success glyphicon glyphicon-ok-sign"></small>');
        if (results.length > 0) st.write(util.format('<small class="text-danger"><span class="label label-danger">%d</span> errors</small>', results.length));
        st.write('</div></a></h4>');
        st.write('</div>');
        st.write(util.format('<div id="%s" class="panel-collapse collapse %s">', i, i === 1 ? "in" : ""));
        st.write("<div class='panel-body'>");
        i++;
    }

    function endSection(st) {
        st.write('</div>');
        st.write('</div>');
        st.write('</div>');
    }

    function writeErrorMsg(st, err) {
        st.write('<tr>');
        st.write(util.format("<td>%s</td>", err.line));
        st.write(util.format("<td>%s</td>", err.col));
        st.write(util.format("<td>%s</td>", htmlencode.htmlEncode(err.message)));
        st.write("</tr>");
    };

    function startTable(st) {
        st.write('<table class="table table-condensed table-striped">');
        st.write('<thead>');
        st.write('<tr>');
        st.write('<td>Line</td>');
        st.write('<td>Column</td>');
        st.write('<td>Message</td>');
        st.write('</tr>');
        st.write('</thead>');
        st.write('<tbody>');
    }

    function endTable(st) {
        st.write("</tbody>");
        st.write("</table>");
    }

    function start(file, encoding, callback) {
        // only include files passed through gulp-csslint
        if (file.isNull() || !file.csslint) {
            return callback(null, file);
        }
        totalFiles++;
        var results = file.csslint.report.messages || [];

        var filename = dir + file.path.replace(/^.*[\\\/]/, '') + '.html';
        var fname = path.basename(file.path);

        var wrStream = fs.createWriteStream(filename);

        if (results.length > 0)
            gutil.log(gutil.colors.red(util.format("%s lint errors in %s", results.length, gutil.colors.magenta(fname))))
        else
            totalSuccess++;

        totalErrors += results.length;

        startSection(wrStream, fname, results);
        startSection(stream, fname, results);

        if (results.length == 0) {
            wrStream.write('<div class="alert alert-success">Cool!! No errors/warnings found!</div>');
            stream.write('<div class="alert alert-success">Cool!! No errors/warnings found!</div>');
        } else {
            startTable(stream);
            startTable(wrStream);
            results.forEach(function (err, i) {
                writeErrorMsg(wrStream, err);
                writeErrorMsg(stream, err);
            });
            endTable(wrStream);
            endTable(stream);
        }

        endSection(wrStream);
        endSection(stream);
        wrStream.end();
        callback(null, file);
    };

    return through.obj(start, end).resume();
};
