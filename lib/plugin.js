var fs = require('fs');
var xmlbuilder = require('xmlbuilder');

function getTestMeta(browser, test) {
  return {
    'name': test.test.slice(2).join(' > '),
    'method': test.test.slice(1).join('.'),
    'type': test.test[0]
  };
}

function updateStats(element, test) {
  var item = element.item;
  var stats = element.stats;
  stats[test.state] = (stats[test.state] || 0) + 1;
  item.att('total', (stats.passing + stats.failing + stats.pending));
  item.att('passed', stats.passing);
  item.att('failed', stats.failing);
  item.att('skipped', stats.pending);
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

module.exports = function(wct, pluginOptions) {
  var xml = xmlbuilder.create('assemblies', {version: '1.0', encoding: 'UTF-8'});
  var assemblies = {};

  function getAssembly(test, browser) {
    var name = test.test[0];
    var assembly = assemblies[name];

    if(!assembly) {
      assembly = assemblies[name] = {
        collections: {},
        stats: {passing: 0, failing: 0, pending: 0},
        item: xml.ele('assembly', {
          name,
          'environment': browser.browserName + '.' + browser.version,
          'test-framework': 'web-component-tester',
          'run-date': getDate(),
          'run-time': getTime()
        })
      };
    }
    updateStats(assembly, test);
    return assembly;
  }

  function getCollection(test, browser) {
    var name = test.test[1];
    var assembly = getAssembly(test, browser);
    var collection = assembly.collections[name];
    if(!collection) {
      collection = assembly.collections[name] = {
        item: assembly.item.ele('collection', {name}),
        stats: {passing: 0, failing: 0, pending: 0},
      };
    }
    updateStats(collection, test);
    return collection;
  }

  wct.on('browser-start', function(browser, data, stats) {
    JSON.stringify(browser, data, stats);
  }.bind(this));

  wct.on('sub-suite-start', function(browser, sharedState, stats) {
    JSON.stringify(browser, sharedState, stats);
  }.bind(this));

  wct.on('test-end', function(browser, test) {
    var meta = getTestMeta(browser, test);
    var collection = getCollection(test, browser);
    var currentTest = collection.item.ele('test');
    currentTest.att('name', meta.name);
    currentTest.att('method', meta.method);
    currentTest.att('type', meta.type);

    if(test.state === 'pending') {
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
    currentTest.att('time', test.duration);
  }.bind(this));

  wct.on('run-end', function(error) {
    pluginOptions.output = pluginOptions.output || 'TEST-wct.xml';
    var out = xml.end({ pretty: true, indent: '  ', newline: '\n' });
    fs.writeFileSync(pluginOptions.output, out);
  }.bind(this));
};
