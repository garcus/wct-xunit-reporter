var fs = require('fs');
var xmlbuilder = require('xmlbuilder');
var startTime = new Date();
var totalDuration = 0.0;
var testindex = 1;

function getTestMeta(browser, test) {
  var meta = {
    'name': test.test[test.test.length -1],
    'method': '',
    'type': test.test[0]
  };
  var path = [];
  for (i = 1; i < test.test.length; i++) {
    path.push(test.test[i]);
  }
  meta.method = path.join('.');
  return meta;
}

function getDate() {
  now = new Date();
  var year = "" + now.getFullYear();
  var month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
  var day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
  return year + "-" + month + "-" + day;
}

function getTime() {
  now = new Date();
  var hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
  var minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
  var second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
  return hour + ":" + minute + ":" + second;
}

module.exports = function (wct, pluginOptions) {
  var xml = xmlbuilder.create('assemblies', {version: '1.0', encoding: 'UTF-8'});
  var assembly;
  var collection;

  wct.on('browser-start', function(browser, data, stats) {
    assembly = xml.ele('assembly', {
      'name': 'WCT Unit tests [' + browser.browserName + '.' + browser.version + ']',
      'environment': browser.browserName + '.' + browser.version,
      'test-framework': 'web-component-tester',
      'run-date': getDate(),
      'run-time': getTime()
    });
  }.bind(this));

  wct.on('sub-suite-start', function(browser, sharedState, stats) {
    collection = assembly.ele('collection');
  }.bind(this));

  wct.on('sub-suite-end', function(browser, sharedState, stats) {
    collection.att('passed', stats.passing);
    collection.att('failed', stats.failing);
    collection.att('skipped', stats.pending);
    collection.att('total', stats.passing + stats.failing + stats.pending);
    collection.att('time', totalDuration);
  }.bind(this));

  wct.on('test-start', function (browser, test, stats) {
    startTime = new Date();
  }.bind(this));

  wct.on('test-end', function (browser, test) {
    var meta = getTestMeta(browser, test);
    var currentTest = collection.ele('test');
    var endTime = new Date();
    var duration = (endTime - startTime) / 1000;
    currentTest.att('name', testindex.to() + ' ' + meta.name);
    currentTest.att('method', meta.method);
    currentTest.att('type', meta.type);

    if (test.state === 'pending') {
      currentTest.att('result', 'Skip');
      return;
    } else if(test.state === 'failing') {
      currentTest.att('result', 'Fail');
      var fail = currentTest.ele('failure');
      var msg = fail.ele('message');
      msg.dat(test.error.message);
      var trace = fail.ele('stack-trace');
      trace.dat(test.error.stack);
    } else if(test.state === 'passing'){
      currentTest.att('result', 'Pass');
    }
    currentTest.att('time', duration);
    totalDuration += duration;
    testindex += 1;
  }.bind(this));

  wct.on('browser-end', function(browser, error, stats) {
    assembly.att('total', (stats.passing + stats.failing + stats.pending));
    assembly.att('passed', stats.passing);
    assembly.att('failed', stats.failing);
    assembly.att('skipped', stats.pending);
    if (error) {
      var errors = assembly.ele('errors');
      var err = errors.ele('error');
      err.dat(error);
    }
  }.bind(this));

  wct.on('run-end', function(error) {
    pluginOptions.output = pluginOptions.output || 'TEST-wct.xml';
    var out = xml.end({ pretty: true, indent: '  ', newline: '\n' });
    fs.writeFileSync(pluginOptions.output, out);
  }.bind(this));
};
