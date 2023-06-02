/*
cron "0 9 * * *" jlqc.js, tag:吉利汽车签到
 */

//详细说明参考 https://github.com/ccwav/QLScript2.

const axios = require('axios')
const {sendNotify} = require("./sendNotify");
const $ = new Env('吉利汽车签到')
const notify = $.isNode() ? require('./sendNotify') : ''

const Notify = 1; //0为关闭通知，1为打开通知,默认为1
const debug = 0; //0为关闭调试，1为打开调试,默认为0

let envName = 'jlqcCookies'
let _cookies = ($.isNode() ? process.env[envName] : $.getdata(`${envName}`)) || ''
let _cookiesArr = []
let message = []
!(async () => {

    if (!(await Envs())) return  //多账号分割 判断变量是否为空  初步处理多账号
    else {
        console.log(`\n\n=========================================    脚本执行 - 北京时间(UTC+8)：${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()} =========================================\n`)
        console.log(`\n=================== 共找到 ${_cookiesArr.length} 个账号 ===================`)
        for (let index = 0; index < _cookiesArr.length; index++) {
            let num = index + 1
            console.log(`\n========= 开始【第 ${num} 个账号】=========\n`)
            // msg += `\n 【第 ${num} 个账号】`
            let ck = _cookiesArr[index]
            let headers = {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json',
                'token': `${ck}`,
                'user-agent': 'ji li qi che/3.5.0 (iPhone; iOS 16.5; Scale/3.00)',
                'platform': 'iOS'
            }

            if (debug) {
                console.log(`\n 【debug】 这是你第 ${num} 账号信息:\n ck:${ck}\n`);
            }
            axios.defaults.headers = headers;
            // 签到任务
            message.push(`【账号${index}】`)
            let login = await getLogin();
            if (login){
                await get_sign()
                // await re_sign()
                await create_topic()
                await show_msg()
            }else{
                message.push(`账号${index}已失效`)
            }
            await SendMsg(message)

        }
    }

})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())


async function getLogin() {
    try {
        request('get', 'https://app.geely.com/api/v1/user/isLogin').then(res => {
            return res.code = 'success'
        })
    } catch (error) {
        console.error(error)
    }
    return false
}


async function get_sign() {
    try {
        request('get', 'https://app.geely.com/my/getMyCenterCounts').then(res => {
            if (res.data.isSign) {
                console.log(`今日已签到 跳过 签到时间 ${res.data.signTime}`)
            } else {
                console.log('开始签到')
                sign_in()
            }
            sing_msg()
        })
    } catch (error) {
        console.error(error)
    }
}

async function re_sign() {
    request('post', 'https://app.geely.com/api/v1/userSign/reSign', {
        data: {
            'signTime': new Date().toLocaleDateString(),
            'ts': (new Date().getTime() / 1000).toFixed(0),
            'cId': 'BLqo2nmmoPgGuJtFDWlUjRI2b1b',
            'resignCardId': 24448
        }
    })
        .then(json => {
            console.log(`签到 ${json.message}`)
            return json.code = 'success'
        })
        .catch(e => {
        })
}

async function sign_in() {
    request('post', 'https://app.geely.com/api/v1/userSign/sign', {
        data: {
            'signDate': new Date().toLocaleString(),
            'ts': (new Date().getTime() / 1000).toFixed(0),
            'cId': 'BLqo2nmmoPgGuJtFDWlUjRI2b1b'
        }
    })
        .then(json => {
            console.log(`签到 ${json.message}`)
            return json.code = 'success'
        })
        .catch(e => {
            console.log(`签到失败`)
        })
}

async function sing_msg() {
    request('post', 'https://app.geely.com/api/v1/userSign/getSignMsg', {
        data: {
            'year': new Date().getUTCFullYear(),
            'month': new Date().getUTCMonth() + 1
        }
    })
        .then(json => {
            if (json.code == 'success') {
                console.log(`${new Date().getMonth() + 1}月 已签到${json.data.signUserSign.length} 天， 连续签到 ${json.data.continuousSignDay} 天`)
            }
            return json.code = 'success'
        })
        .catch(e => {
        })
}

async function show_msg() {
    const available = 'https://app.geely.com/api/v1/point/available'
    const summary = 'https://app.geely.com/api/v1/growthSystem/energyBody/summary'
    const getMemberLevelInfo = 'https://app.geely.com/my/getMemberLevelInfo'

    let total
    let privilegeNum
    let availablePoint = total = privilegeNum = 0
    await request('get', available, {})
        .then(json => {
            if (json.code == 'success') {
                availablePoint = json.data.availablePoint
            }
            return json.code = 'success'
        })
        .catch(e => {
        })

    await request('get', summary, {})
        .then(json => {
            if (json.code == 'success') {
                total = json.data.total
            }
            return json.code = 'success'
        })
        .catch(e => {
        })

    await request('get', getMemberLevelInfo, {})
        .then(json => {
            if (json.code == 'success') {
                privilegeNum = json.data.privilegeNum
            }
            return json.code = 'success'
        })
        .catch(e => {
        })

    console.log(`账户统计 吉分：${availablePoint}  能量体 ${total}  当前等级${privilegeNum}`)
}

async function create_topic() {
    let message = '每日一句话'
    const res = await axios.get('https://api.likepoems.com/ana/yiyan/')
    message = res.data

    await request('post', 'https://app.geely.com/api/v2/topicContent/create', {
        'content': message,
        'contentType': 1
    }).then(async res => {
        let id = res.data
        console.log(`发布成功 ${res.data}`)

        await request('post', 'https://app.geely.com/api/v2/topicContent/deleteContent', {
            'id': id
        }).then(res => {
            console.log(`删除成功 ${id}`)
        })
    })
}

async function request(method, url, data) {
    return new Promise(async (resolve, reject) => {
        try {
            let response = {}
            if (method === 'get') {
                response = await axios.get(url, {params: data})
            }
            if (method === 'post') {
                response = await axios.post(url, data)
            }
            if (response.data.code === 'success') {
                resolve(response.data)
            } else {
                resolve()
            }
        } catch (error) {
            console.error(error)
        }
    })
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
            'S+': n.getMilliseconds()
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
async function Envs() {
    if (_cookies) {
        if (Array.isArray(_cookies)) _cookiesArr = _cookies
        else if (_cookies.indexOf('&') > -1)
            _cookiesArr = _cookies.split('&')
        else if (_cookies.indexOf('\n') > -1)
            _cookiesArr = _cookies.split('\n')
        else _cookiesArr = [_cookies]
    } else {
        console.log(`\n 【${$.name}】：未填写变量 ${envName}`)
        return
    }

    return true
}

// ============================================发送消息============================================ \\
async function SendMsg(message) {
    if (!message)
        return

    if (Notify > 0) {
        if ($.isNode()) {
            var notify = require('./sendNotify')
            await notify.sendNotify($.name, message)
        } else {
            $.msg(message)
        }
    } else {
        console.log(message)
    }
}

function getRand(min, max) {
    return parseInt(Math.random() * (max - min)) + min
}

function uuid() {
    var s = []
    var hexDigits = '0123456789abcdef'
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
    }
    s[14] = '4'
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)
    s[8] = s[13] = s[18] = s[23] = '-'
    var uuid = s.join('')
    return uuid
}

function uuidRandom() {
    return Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10)
}

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randomNumber(len) {
    let chars = '0123456789'
    let maxPos = chars.length
    let str = ''
    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos))
    }
    return Date.now() + str
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
            this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`)
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

        isShadowrocket() {
            return "undefined" != typeof $rocket
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
                const [o, h] = i.split("@"), a = {
                    url: `http://${h}/v1/scripting/evaluate`,
                    body: {script_text: t, mock_type: "cron", timeout: r},
                    headers: {"X-Key": o, Accept: "*/*"}
                };
                this.post(a, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }

        loaddata() {
            if (!this.isNode()) return {};
            {
                this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e);
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
                const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data);
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
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i),
                    h = i ? "null" === o ? null : o || "{}" : "{}";
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
            const s = t.method ? t.method.toLocaleLowerCase() : "post";
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient[s](t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t)); else if (this.isNode()) {
                this.initGotEnv(t);
                const {url: i, ...r} = t;
                this.got[s](i, r).then(t => {
                    const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                    e(null, {status: s, statusCode: i, headers: r, body: o}, o)
                }, t => {
                    const {message: s, response: i} = t;
                    e(s, i, i && i.body)
                })
            }
        }

        put(t, e = (() => {
        })) {
            const s = t.method ? t.method.toLocaleLowerCase() : "put";
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {"X-Surge-Skip-Scripting": !1})), $httpClient[s](t, (t, s, i) => {
                !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
            }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {hints: !1})), $task.fetch(t).then(t => {
                const {statusCode: s, statusCode: i, headers: r, body: o} = t;
                e(null, {status: s, statusCode: i, headers: r, body: o}, o)
            }, t => e(t)); else if (this.isNode()) {
                this.initGotEnv(t);
                const {url: i, ...r} = t;
                this.got[s](i, r).then(t => {
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
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
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
                let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
                t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t)
            }
        }

        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
        }

        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t)
        }

        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }

        done(t = {}) {
            const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
            this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }(t, e)
}
