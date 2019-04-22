const jsonfile = require("jsonfile");
const cmd = require('node-cmd');
const puppeteer = require('puppeteer');
const Table = require('cli-table2');
const table = new Table({
  head: ['Server', 'Google', 'Youtube', 'Average', 'Total']
});

const configData = jsonfile.readFileSync('./gui-config.json');

const configs = configData.configs;

function openSS (ssConfig, prot) {
  console.log(`test ${ssConfig.server}`);
  return cmd.get(`sslocal -l ${prot} -b 127.0.0.1 -s ${ssConfig.server} -p ${ssConfig.server_port} -k ${ssConfig.password} -m ${ssConfig.method}`);
}

(async() => {

  const speedData = [];

  const prot = 1088;
  const browser = await puppeteer.launch({
    args: [ '--proxy-server=socks5://localhost:' + prot ]
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    
    const cmdProcess = openSS(config, prot);
    
    try {
      let time = new Date().getTime();
      await page.goto('https://google.com');
      const googleCost = new Date().getTime() - time;

      time = new Date().getTime();
      await page.goto('https://www.youtube.com/');
      const youtubeCost = new Date().getTime() - time;
      console.log(`${config.server}, google: ${googleCost}, youtube: ${youtubeCost}`);

      speedData.push({
        name: config.server,
        google: googleCost,
        youtube: youtubeCost,
        total: googleCost + youtubeCost,
        average: (googleCost + youtubeCost) / 2,
        sort: googleCost + youtubeCost,
      })

    } catch (error) {
      console.log(`open error: ${config.server}`);
      console.log(`error: ${error}`);
      speedData.push({
        name: config.server,
        google: -1,
        youtube: -1,
        total: -1,
        average: -1,
        sort: 9999999,
      })
    } finally {
      require('child_process').spawn("taskkill", ["/pid", cmdProcess.pid, '/f', '/t']);
    }
  }

  await page.close()
  await browser.close();

  speedData.sort((a, b) => a.sort - b.sort).forEach(item => {
    table.push(
      [item.name, item.google, item.youtube, item.average, item.total]
    );
  })

  console.log('test finish!')
  console.log(table.toString());

})();