#wct-xunit-reporter

##Installing

```npm install wct-xunit-reporter ```

After installation, run wct with the plugin enabled: ```wct --plugin xunit-reporter```

or you can also enable it in your ```wct.conf.js```

```
module.exports = {
  plugins: {
    local: {
      browsers: ['chrome']
    },
    sauce: false,
    'xunit-reporter': {
      'output': 'testfile.xml'
    }
  }
};
```
