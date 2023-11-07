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

const axios = require('axios')
const $ = new Env('北京交警进京证六环外续')

const Notify = 1 //0为关闭通知，1为打开通知,默认为1
const debug = 0 //0为关闭调试，1为打开调试,默认为0

let envName = 'bjjjCookies'
let _cookies = ($.isNode() ? process.env[envName] : $.getdata(`${envName}`)) || ''
let jjzzl = ($.isNode() ? process.env['bjjjjjzzl'] : $.getdata('bjjjjjzzl')) || '02'
let _cookiesArr = ['']
!(async () => {

  if (!(await Envs())) return  //多账号分割 判断变量是否为空  初步处理多账号
  else {
    console.log(`\n\n========= 脚本执行 - 北京时间(UTC+8)：${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()} =========\n`)
    $.log(`======== 共找到 ${_cookiesArr.length} 个账号 ========`)
    for (let index = 0; index < _cookiesArr.length; index++) {
      let num = index + 1
      $.log(`========= 开始【第 ${num} 个账号】=========`)
      // msg += ` 【第 ${num} 个账号】`
      let ck = _cookiesArr[index]
      let headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'User-Agent': 'BeiJingJiaoJing/2.9.1 (iPhone; iOS 17.1; Scale/3.00)',
        'Host': 'jjz.jtgl.beijing.gov.cn',
        'Authorization': `${ck}`,
      }

      if (debug) {
        $.log(` 【debug】 这是你第 ${num} 账号信息:\n ck:${ck}`)
      }
      axios.defaults.headers = headers
      // 获取
      await getState()
    }
  }

})().catch((e) => $.logErr(e)).finally(() => $.done())

async function getState () {
  try {
    // 01 六环内 02 六环外
    let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/stateList', {})
    for (let bzclxxItem of res.data.bzclxx) {
      $.log(`车辆【${bzclxxItem.hphm}】 六环外${bzclxxItem.ecbzxx.length} 六环内${bzclxxItem.bzxx.length}`)
      let sxsyts = ''
      for (let item of bzclxxItem.bzxx) {
        $.log(`车辆【${bzclxxItem.hphm}】 六环内 ${bzclxxItem.ybcs} / ${bzclxxItem.sycs} 当前周期 ${item.yxqs} ${item.yxqz}`)
        sxsyts = item.sxsyts
      }
      for (let item of bzclxxItem.ecbzxx) {
        $.log(`车辆【${bzclxxItem.hphm}】 六环外 ${bzclxxItem.ybcs} / ${bzclxxItem.sycs} 当前周期 ${item.yxqs} ${item.yxqz}`)
        sxsyts = item.sxsyts
      }
      if (sxsyts >1){
        $.log(`车辆【${bzclxxItem.hphm}】 六环外还可行驶 ${sxsyts} 天 `)
        return
      }
      $.log(`车辆【${bzclxxItem.hphm}】 准备申请六环${jjzzl == "01"?'内':'外'}`)
      let vId = bzclxxItem.vId;
      let hpzl = bzclxxItem.hpzl;
      let hphm = bzclxxItem.hphm;
      await sleep(1)
      let res = await applyVehicleCheck({
        'hpzl': hpzl,
        'hphm': hphm,
      })
      $.log(`车辆【${bzclxxItem.hphm}】 校验状态${res}`)
      if (res){
        // 获取申请人信息
        await sleep(1)
        let a = await getJsrxx()
        let jszh = a.jszh
        let jsrxm = a.jsrxm
        $.log(`车辆【${bzclxxItem.hphm}】 获取申请人信息成功`)
        // 检查状态
        await sleep(1)
        res = await applyCheckNum({
          'txrxx': [],
          'jsrxm': jsrxm,
          'jszh': jszh,
        })
        $.log(`车辆【${bzclxxItem.hphm}】 检查状态${res}`)
        // 获取办理日期
        await sleep(1)
        let dataList = await checkHandle({
          'vId': vId,
          'jjzzl': jjzzl,
          'hphm': hphm,
        })
        let date = dataList.data.jjrqs[0]
        // 申请办证
        await sleep(1)
        await insertApplyRecord({
          'jjzzl': jjzzl,
          'vId': vId,
          'jsrxm': jsrxm,
          'hpzl': hpzl,
          'hphm': hphm,
          'jjrq': date,
          'jszh': jszh,
        })
        $.log(`车辆【${bzclxxItem.hphm}】 申请成功`)
      }
    }

  } catch (error) {
    console.error(error)
  }
}

async function applyVehicleCheck (params) {
  let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/applyVehicleCheck', params)
  return res.data === '200'
}

async function getJsrxx () {
  let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/getJsrxx', {})
  return res.data
}

async function applyCheckNum (params) {
  let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/applyCheckNum', params)
  return res.code === 200
}

async function checkHandle (params) {
  return await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/checkHandle', params)
}

async function insertApplyRecord (data) {
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
    }
    let _params = Object.assign({}, data, params)
    let res = await request('post', 'https://jjz.jtgl.beijing.gov.cn/pro/applyRecordController/insertApplyRecord', _params)
    return res.data
  } catch (error) {
    console.error(error)
  }
  return false
}

async function request (method, url, data) {
  return new Promise(async (resolve) => {
    try {
      let response = {}
      if (method === 'get') {
        response = await axios.get(url, { params: data })
      }
      if (method === 'post') {
        response = await axios.post(url, data)
      }
      // console.log(JSON.stringify(response.data))
      resolve(response.data)
    } catch (error) {
      console.error(error)
    } finally {
    }
  })
}

function randomInt (min = 1000, max = 5000) {
  return Math.round(Math.random() * (max - min) + min)
}

async function sleep (max) {
  let random = randomInt(1000, max * 1000)
  // console.log(`随机延迟${random}ms`)
  await $.wait(random)
}

Date.prototype.Format = function (fmt) {
  var e,
    n = this,
    d = fmt,
    l = {
      'M+': n.getMonth() + 1,
      'd+': n.getDate(),
      'D+': n.getDate(),
      'h+': n.getHours(),
      'H+': n.getHours(),
      'm+': n.getMinutes(),
      's+': n.getSeconds(),
      'w+': n.getDay(),
      'q+': Math.floor((n.getMonth() + 3) / 3),
      'S+': n.getMilliseconds(),
    };
  /(y+)/i.test(d) && (d = d.replace(RegExp.$1, ''.concat(n.getFullYear()).substr(4 - RegExp.$1.length)))
  for (var k in l) {
    if (new RegExp('('.concat(k, ')')).test(d)) {
      var t,
        a = 'S+' === k ? '000' : '00'
      d = d.replace(RegExp.$1, 1 == RegExp.$1.length ? l[k] : (''.concat(a) + l[k]).substr(''.concat(l[k]).length))
    }
  }
  return d
}

//#region 固定代码
// ============================================变量检查============================================ \\
async function Envs () {
  if (_cookies) {
    if (Array.isArray(_cookies)) _cookiesArr = _cookies
    else if (_cookies.indexOf('&') > -1)
      _cookiesArr = _cookies.split('&')
    else if (_cookies.indexOf('\n') > -1)
      _cookiesArr = _cookies.split('\n')
    else if (_cookies.indexOf('@') > -1)
      _cookiesArr = _cookies.split('@')
    else _cookiesArr = [_cookies]
  } else {
    $.log(`【${$.name}】：未填写变量 ${envName}`)
    return
  }

  return true
}

// ============================================发送消息============================================ \\
async function SendMsg (message) {
  if (!message)
    return
  message = message.join('\n')
  if (Notify > 0) {
    if ($.isNode()) {
      var notify = require('./sendNotify')
      await notify.sendNotify($.name, message)
    } else {
      $.msg(message)
      console.log(message)
    }
  } else {
    console.log(message)
  }
}

// prettier-ignore
function Env(t, e) {
  "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);

  class s {
    constructor(t) {
      this.env = t
    }

    send(t, e = "GET") {
      t = "string" == typeof t ? {url: t} : t;
      let s = this.get;
      return "POST" === e && (s = this.post), new Promise((e, i) => {
        s.call(this, t, (t, s, r) => {
          t ? i(t) : e(s)
        })
      })
    }

    get(t) {
      return this.send.call(this.env, t)
    }

    post(t) {
      return this.send.call(this.env, t, "POST")
    }
  }

  return new class {
    constructor(t, e) {
      this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`)
    }

    isNode() {
      return "undefined" != typeof module && !!module.exports
    }

    isQuanX() {
      return "undefined" != typeof $task
    }

    isSurge() {
      return "undefined" != typeof $httpClient && "undefined" == typeof $loon
    }

    isLoon() {
      return "undefined" != typeof $loon
    }

    toObj(t, e = null) {
      try {
        return JSON.parse(t)
      } catch {
        return e
      }
    }

    toStr(t, e = null) {
      try {
        return JSON.stringify(t)
      } catch {
        return e
      }
    }

    getjson(t, e) {
      let s = e;
      const i = this.getdata(t);
      if (i) try {
        s = JSON.parse(this.getdata(t))
      } catch {
      }
      return s
    }

    setjson(t, e) {
      try {
        return this.setdata(JSON.stringify(t), e)
      } catch {
        return !1
      }
    }

    getScript(t) {
      return new Promise(e => {
        this.get({url: t}, (t, s, i) => e(i))
      })
    }

    runScript(t, e) {
      return new Promise(s => {
        let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        i = i ? i.replace(/\n/g, "").trim() : i;
        let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
        r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
        const [o, h] = i.split("@"), n = {url: `http://${h}/v1/scripting/evaluate`, body: {script_text: t, mock_type: "cron", timeout: r}, headers: {"X-Key": o, Accept: "*/*"}};
        this.post(n, (t, e, i) => s(i))
      }).catch(t => this.logErr(t))
    }

    loaddata() {
      if (!this.isNode()) return {};
      {
        this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e);
        if (!s && !i) return {};
        {
          const i = s ? t : e;
          try {
            return JSON.parse(this.fs.readFileSync(i))
          } catch (t) {
            return {}
          }
        }
      }
    }

    writedata() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data);
        s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
      }
    }

    lodash_get(t, e, s) {
      const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
      let r = t;
      for (const t of i) if (r = Object(r)[t], void 0 === r) return s;
      return r
    }

    lodash_set(t, e, s) {
      return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
    }

    getdata(t) {
      let e = this.getval(t);
      if (/^@/.test(t)) {
        const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
        if (r) try {
          const t = JSON.parse(r);
          e = t ? this.lodash_get(t, i, "") : e
        } catch (t) {
          e = ""
        }
      }
      return e
    }

    setdata(t, e) {
      let s = !1;
      if (/^@/.test(e)) {
        const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}";
        try {
          const e = JSON.parse(h);
          this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
        } catch (e) {
          const o = {};
          this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
        }
      } else s = this.setval(t, e);
      return s
    }

    getval(t) {
      return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
    }

    setval(t, e) {
      return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
    }

    initGotEnv(t) {
      this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
    }

    get(t, e = (() => {
    })) {
      t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.get(t, (t, s, i) => {
        !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
      })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
        const {statusCode: s, statusCode: i, headers: r, body: o} = t;
        e(null, {status: s, statusCode: i, headers: r, body: o}, o)
      }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
        try {
          if (t.headers["set-cookie"]) {
            const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
            s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
          }
        } catch (t) {
          this.logErr(t)
        }
      }).then(t => {
        const {statusCode: s, statusCode: i, headers: r, body: o} = t;
        e(null, {status: s, statusCode: i, headers: r, body: o}, o)
      }, t => {
        const {message: s, response: i} = t;
        e(s, i, i && i.body)
      }))
    }

    post(t, e = (() => {
    })) {
      if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient.post(t, (t, s, i) => {
        !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
      }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
        const {statusCode: s, statusCode: i, headers: r, body: o} = t;
        e(null, {status: s, statusCode: i, headers: r, body: o}, o)
      }, t => e(t)); else if (this.isNode()) {
        this.initGotEnv(t);
        const {url: s, ...i} = t;
        this.got.post(s, i).then(t => {
          const {statusCode: s, statusCode: i, headers: r, body: o} = t;
          e(null, {status: s, statusCode: i, headers: r, body: o}, o)
        }, t => {
          const {message: s, response: i} = t;
          e(s, i, i && i.body)
        })
      }
    }

    time(t, e = null) {
      const s = e ? new Date(e) : new Date;
      let i = {"M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds()};
      /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
      for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
      return t
    }

    msg(e = t, s = "", i = "", r) {
      const o = t => {
        if (!t) return t;
        if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {"open-url": t} : this.isSurge() ? {url: t} : void 0;
        if ("object" == typeof t) {
          if (this.isLoon()) {
            let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"];
            return {openUrl: e, mediaUrl: s}
          }
          if (this.isQuanX()) {
            let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl;
            return {"open-url": e, "media-url": s}
          }
          if (this.isSurge()) {
            let e = t.url || t.openUrl || t["open-url"];
            return {url: e}
          }
        }
      };
      if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
        let t = ["", "==============📣系统通知📣=============="];
        t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t)
      }
    }

    log(...t) {
      t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
    }

    logErr(t, e) {
      const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
      s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
    }

    wait(t) {
      return new Promise(e => setTimeout(e, t))
    }

    done(t = {}) {
      const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
      this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
    }
  }(t, e)
}
