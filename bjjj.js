/*

cron "30 6 * * *" bjjj.js, tag:北京交警进京证六环外续

支持两种cookie方式
export bjjjCookies="ck1" // 有效期30天
export bjjjjjzzl="02"
抓包方式1：
找到链接 https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/stateList
请求头 Authorization 填入

*/

//详细说明参考 https://github.com/ccwav/QLScript2.

const $ = new Env('北京交警进京证六环外续');

const Notify = 1; //0为关闭通知，1为打开通知,默认为1
const debug = 0; //0为关闭调试，1为打开调试,默认为0

let envName = 'bjjjCookies';
let cookie = '';
let _cookies = ($.isNode() ? process.env[envName] : $.getdata(`${envName}`)) || '';
let jjzzl = ($.isNode() ? process.env['bjjjjjzzl'] : $.getdata('bjjjjjzzl')) || '02';
let _cookiesArr = [''];
!(async () => {

  if (!(await Envs())) return;  //多账号分割 判断变量是否为空  初步处理多账号
  else {
    console.log(`\n\n========= 脚本执行 - 北京时间(UTC+8)：${new Date(
        new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 *
        60 * 60 * 1000).toLocaleString()} =========\n`);
    $.log(`======== 共找到 ${_cookiesArr.length} 个账号 ========`);
    for (let index = 0; index < _cookiesArr.length; index++) {
      let num = index + 1;
      $.log(`========= 开始【第 ${num} 个账号】=========`);
      cookie = _cookiesArr[index];

      if (debug) {
        $.log(` 【debug】 这是你第 ${num} 账号信息:\n ck:${cookie}`);
      }
      // 获取
      await getState();
      await SendMsg($.logs);
    }
  }

})().catch((e) => $.logErr(e)).finally(() => $.done());

function taskUrl(url = '', data = {}) {
  let options = {
    url: url,
    json: data,
    headers: {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'User-Agent': 'BeiJingJiaoJing/2.9.1 (iPhone; iOS 17.1; Scale/3.00)',
      'Host': 'jjz.jtgl.beijing.gov.cn',
      'Authorization': `${cookie}`,
    },
    timeout: 10000,
  };

  let HTTP_PROXY_HOST = '';
  let HTTP_PROXY_PORT = '';
  let HTTP_PROXY_AUTH = '';
  if ($.isNode() && process.env.HTTP_PROXY_HOST) HTTP_PROXY_HOST = process.env.HTTP_PROXY_HOST;
  if ($.isNode() && process.env.HTTP_PROXY_PORT) HTTP_PROXY_PORT = process.env.HTTP_PROXY_PORT;
  if ($.isNode() && process.env.HTTP_PROXY_AUTH) HTTP_PROXY_AUTH = process.env.HTTP_PROXY_AUTH;

  if (HTTP_PROXY_HOST && HTTP_PROXY_PORT) {
    const tunnel = require('tunnel');
    const agent = {
      https: tunnel.httpsOverHttp({
        proxy: {
          host: HTTP_PROXY_HOST,
          port: HTTP_PROXY_PORT * 1,
          proxyAuth: HTTP_PROXY_AUTH,
        },
      }),
    };
    Object.assign(options, {agent});
  }
  return options;
}

async function getState() {
  try {
    // 01 六环内 02 六环外
    let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/stateList', {});
    for (let bzclxxItem of res.data.bzclxx) {
      $.log(`车辆【${bzclxxItem.hphm}】 六环外${bzclxxItem.ecbzxx.length} 六环内${bzclxxItem.bzxx.length}`);
      let sxsyts = '';
      for (let item of bzclxxItem.bzxx) {
        $.log(`车辆【${bzclxxItem.hphm}】 六环内 ${bzclxxItem.ybcs} / ${bzclxxItem.sycs} 当前周期 ${item.yxqs} ${item.yxqz}`);
        sxsyts = item.sxsyts;
      }
      for (let item of bzclxxItem.ecbzxx) {
        $.log(`车辆【${bzclxxItem.hphm}】 六环外 ${bzclxxItem.ybcs} / ${bzclxxItem.sycs} 当前周期 ${item.yxqs} ${item.yxqz}`);
        sxsyts = item.sxsyts;
      }
      if (sxsyts > 1) {
        $.log(`车辆【${bzclxxItem.hphm}】 六环外还可行驶 ${sxsyts} 天 `);
        return false;
      }
      $.log(`车辆【${bzclxxItem.hphm}】 准备申请六环${jjzzl == '01' ? '内' : '外'}`);
      let vId = bzclxxItem.vId;
      let hpzl = bzclxxItem.hpzl;
      let hphm = bzclxxItem.hphm;
      await sleep(1);
      let res = await applyVehicleCheck({
        'hpzl': hpzl,
        'hphm': hphm,
      });
      $.log(`车辆【${bzclxxItem.hphm}】 校验状态${res}`);
      if (res) {
        // 获取申请人信息
        await sleep(1);
        let a = await getJsrxx();
        let jszh = a.jszh;
        let jsrxm = a.jsrxm;
        $.log(`车辆【${bzclxxItem.hphm}】 获取申请人信息成功`);
        // 检查状态
        await sleep(1);
        res = await applyCheckNum({
          'txrxx': [],
          'jsrxm': jsrxm,
          'jszh': jszh,
        });
        $.log(`车辆【${bzclxxItem.hphm}】 检查状态${res}`);
        // 获取办理日期
        await sleep(1);
        let dataList = await checkHandle({
          'vId': vId,
          'jjzzl': jjzzl,
          'hphm': hphm,
        });
        let date = dataList.data.jjrqs[0];
        // 申请办证
        await sleep(1);
        await insertApplyRecord({
          'jjzzl': jjzzl,
          'vId': vId,
          'jsrxm': jsrxm,
          'hpzl': hpzl,
          'hphm': hphm,
          'jjrq': date,
          'jszh': jszh,
        });
        $.log(`车辆【${bzclxxItem.hphm}】 申请成功`);
      }
    }

  } catch (error) {
    $.logErr(error)
    return false;
  }
  return true;
}

async function applyVehicleCheck(params) {
  let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/applyVehicleCheck', params);
  return res.data === '200';
}

async function getJsrxx() {
  let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/getJsrxx', {});
  return res.data;
}

async function applyCheckNum(params) {
  let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/applyCheckNum', params);
  return res.code === 200;
}

async function checkHandle(params) {
  return await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/checkHandle', params);
}

async function insertApplyRecord(data) {
  try {
    let params = {
      'applyIdOld': '',
      'jjdq': '010',
      'jjlk': '00103',
      'sqdzbdwd': '40.038985',
      'jjmd': '06',
      'jjdzbdwd': '40.039888',
      'sqdzgdjd': '116.620617',
      'jjmdmc': '其它',
      'jjdzgdjd': '116.620617',
      'txrxx': [],
      'sqdzgdwd': '40.032806',
      'jjdzgdwd': '40.032806',
      'sqdzbdjd': '116.627042',
      'jjdzbdjd': '116.627445',
      'xxdz': '恒大',
      'jjlkmc': '其他道路',
    };
    let _params = Object.assign({}, data, params);
    let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/insertApplyRecord', _params);
    return res.data;
  } catch (error) {
    $.logErr(error);
  }
  return false;
}

async function request(method, url, data) {
  return new Promise((resolve, reject) => {
      if (method === 'get') {
        $.get(taskUrl(url, data), (err, resp, data) => {
          if (err) {
            console.log(err);
            resolve(err);
          } else {
            data = JSON.parse(data);
            resolve(data);
          }
        });
      }
      if (method === 'post') {
        $.post(taskUrl(url, data), (err, resp, data) => {
          if (err) {
            console.log(err);
            resolve(err);
          } else {
            data = JSON.parse(data);
            resolve(data);
          }
        });
      }
  });
}

//#region 固定代码
function randomInt(min = 1000, max = 5000) {
  return Math.round(Math.random() * (max - min) + min);
}
// prettier-ignore
async function sleep(a){let n=randomInt(200,1e3*a);await $.wait(n)}
// prettier-ignore
Date.prototype.Format=function(t){var e=this,g=t,n={"M+":e.getMonth()+1,"d+":e.getDate(),"D+":e.getDate(),"h+":e.getHours(),"H+":e.getHours(),"m+":e.getMinutes(),"s+":e.getSeconds(),"w+":e.getDay(),"q+":Math.floor((e.getMonth()+3)/3),"S+":e.getMilliseconds()};for(var o in/(y+)/i.test(g)&&(g=g.replace(RegExp.$1,"".concat(e.getFullYear()).substr(4-RegExp.$1.length))),n)if(new RegExp("(".concat(o,")")).test(g)){var a="S+"===o?"000":"00";g=g.replace(RegExp.$1,1==RegExp.$1.length?n[o]:("".concat(a)+n[o]).substr("".concat(n[o]).length))}return g};

// ============================================变量检查============================================ \\
// prettier-ignore
async function Envs(){if(_cookies)return Array.isArray(_cookies)?_cookiesArr=_cookies:_cookies.indexOf("&")>-1?_cookiesArr=_cookies.split("&"):_cookies.indexOf("\n")>-1?_cookiesArr=_cookies.split("\n"):_cookies.indexOf("@")>-1?_cookiesArr=_cookies.split("@"):_cookiesArr=[_cookies],!0;$.log(`【${$.name}】：未填写变量 ${envName}`)}
// ============================================发送消息============================================ \\
// prettier-ignore
async function SendMsg(e){if(e)if(e=e.join("\n"),Notify>0)if($.isNode()){var o=require("./sendNotify");await o.sendNotify($.name,e)}else $.msg(e),console.log(e);else console.log(e)}
// 完整 Env
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),a=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:a}=t,n=i.decode(a,this.encoding);e(null,{status:s,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.isSurge()||this.isQuanX()||this.isLoon()?$done(t):this.isNode()&&process.exit(1)}}(t,e)}