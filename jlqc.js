/*
cron "0 9 * * *" jlqc.js, tag:吉利汽车签到
 */

//详细说明参考 https://github.com/ccwav/QLScript2.

const axios = require('axios')
const moment = require('moment')
const $ = new Env('吉利汽车签到')

const Notify = 1; //0为关闭通知，1为打开通知,默认为1
const debug = 0; //0为关闭调试，1为打开调试,默认为0

let envName = 'jlqcCookies'
let _cookies = ($.isNode() ? process.env[envName] : $.getdata(`${envName}`)) || ''
let _cookiesArr = []
let cid = 'BLqo2nmmoPgGuJtFDWlUjRI2b1b'
!(async () => {

    if (!(await Envs())) return  //多账号分割 判断变量是否为空  初步处理多账号
    else {
        console.log(`\n\n=========================================    脚本执行 - 北京时间(UTC+8)：${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()} =========================================\n`)
        $.log(`=================== 共找到 ${_cookiesArr.length} 个账号 ===================`)
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
                'token': `${ck}`,
                'user-agent': 'ji li qi che/3.5.0 (iPhone; iOS 16.5; Scale/3.00)',
                'platform': 'iOS',
                'devicesn': '4A742BA3-4467-4111-A094-B931F87A474E',
                'authority': 'app.geely.com',
                'origin': 'https://app.geely.com',
                'referer': 'https://app.geely.com/app-h5/sign-in/?showTitleBar=0&needLogin=1',
                'cookie': `RANGERS_WEB_ID=user; HWWAFSESID=5ddd47cab52958fcf1; HWWAFSESTIME=${moment().unix()}`
            }

            if (debug) {
                $.log(` 【debug】 这是你第 ${num} 账号信息:\n ck:${ck}`);
            }
            axios.defaults.headers = headers;
            // 签到任务
            let login = await getLogin();
            if (login) {
                await nengliang()
                await show_msg()
                await SendMsg($.logs)
            } else {
                $.log(`账号${index}已失效`)

            }
        }
    }

})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done())


async function getToken(iamId,mobile) {
    let res = await request('post', `https://evun.geely.com/mp/silentLogin?iamId=${getSing2(iamId)}&mobile=${getSing2(mobile)}`)
    console.log(res)
    return res.data.token
}

async function getLogin() {
    try {
        let res = await request('get', 'https://app.geely.com/api/v1/user/isLogin');
        return res.code === 'success'
    } catch (error) {
        console.error(error)
    }
    return false
}

async function show_msg() {
    $.log("【当前账户信息】")
    const available = 'https://app.geely.com/api/v1/point/available'
    const summary = 'https://app.geely.com/api/v1/growthSystem/energyBody/summary'
    const getMemberLevelInfo = 'https://app.geely.com/my/getMemberLevelInfo'

    let total
    let privilegeNum
    let availablePoint = total = privilegeNum = 0
    let res = '';
    res = await request('post', 'https://app.geely.com/api/v1/userSign/getSignMsg', {
        data: {
            'year': new Date().getUTCFullYear(),
            'month': new Date().getUTCMonth() + 1
        }
    })

    if (res.code == 'success') {
        let log = `${new Date().getMonth() + 1}月 已签到${res.data.signUserSign.length} 天 `
        $.log(log)
    }
    await request('get', available, {})
        .then(json => {
            if (json.code === 'success') {
                availablePoint = json.data.availablePoint
            }
            return json.code === 'success'
        })
        .catch(e => {
        })

    await request('get', summary, {})
        .then(json => {
            if (json.code === 'success') {
                total = json.data.total
            }
            return json.code === 'success'
        })
        .catch(e => {
        })

    await request('get', getMemberLevelInfo, {})
        .then(json => {
            if (json.code === 'success') {
                privilegeNum = json.data.privilegeNum
            }
            return json.code === 'success'
        })
        .catch(e => {
        })
    $.log(`吉分：${availablePoint} 能量体 ${total} 当前等级${privilegeNum}`)
}

async function yiyan() {
    let _message = '每日一句话'
    const res = await axios.get('https://api.likepoems.com/ana/yiyan/')
    _message = res.data
    return _message
}

async function getUser() {
    let begin = BigInt(144115205304000001)
    for (let i = 0; i < 100; i++) {
        begin++
        try {
            let res = await request('post', `https://matrix.geely.com/geely-applet/applet/iam/userInfo`, {
                "userId": `${begin}`,
                "token": "eyJraWQiOjEsInR5cCI6IlJTQSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxMDAxMzIiLCJzY29wZSI6IjEwMDEwfDEwMDAxIiwiaXNzIjoiY29tLnRlbmNlbnQudHJhdmVsLmlvdiIsImV4cCI6MTY4NTc3OTUyMSwianRpIjoiNzJhOTg2NWRkNjAwNGFkNTg2NzYwMDEwOTNkZTc0YmEifQ.a9iqyAnfc2UEOtVudGosWIvDyA8aVE3CQJwIcsVdlkHHS5nDd-OcyZl-4qjVOdt0psIu6HW4K23X4AKsuI69_gZ_IXyJuYZq6kpVUIuKAjOjSut4lKPS1ylYIKUYUBJQyEeFR9rmaPgKtnxWDBNdMpkhLRJmo-Wmb4s7pueoEYbQOweAuiT-gTYnXzu0hs1HrLehCZYuTRaf1WCphyM2r7bmdgIPJnqkNs70kJC2xni7hOYBqy1DxMUPvgE4BEjCYdBf5D4b0lngYuOPcRWU_Zz2dvQC3d4mVPBlXD7j_b4Aq7goeyGWYkjsTq7nLD5ZyCx8oHcurHHmlZfEG0JVvA"
            })
            console.log(`${res.data.userId}   ${res.data.mobile}   ${moment.unix(res.data.createTime / 1000).format("YYYY年MM月DD日 HH:mm:ss")} ${res.data.nickName} `)
        } catch (e) {
            continue
        }
    }
}

async function nengliang() {
    axios.defaults.headers.referer = 'https://app.geely.com/app-h5/grow-up/?showTitleBar=0&needLogin=1&tabsIndex=1'
    let  data = {
        "classify": 1,
        "taskClassifyId": 5,
        "pageIndex": "1",
        "pageSize": "20"
    }
    await renwu("吉分任务", data)
    data = {
        "classify": 2,
        "taskClassifyId": 7,
        "pageIndex": "1",
        "pageSize": "20"
    }
    data.taskClassifyId = 7
    await renwu("玩转社区", data)
    data.taskClassifyId = 8
    await renwu("人车互联", data)
    data.taskClassifyId = 9
    // await renwu("吉友发展",data)
}

 var _0xodP='jsjiami.com.v6',_0xodP_=function(){return['_0xodP'],_0x37ed=[_0xodP,'\x63\x72\x79\x70\x74\x6f\x2d\x6a\x73','\x63\x49\x64','\x75\x61\x74','\x78\x70\x5a\x70\x36\x34\x53\x74\x38\x50\x4e\x37\x74\x50\x79\x36\x44\x4e\x53\x33\x50\x58\x30\x63\x49\x6a\x46','\x42\x4c\x71\x6f\x32\x6e\x6d\x6d\x6f\x50\x67\x47\x75\x4a\x74\x46\x44\x57\x6c\x55\x6a\x52\x49\x32\x62\x31\x62','\x6e\x6f\x77','\x6b\x65\x79\x73','\x73\x6f\x72\x74','\x66\x6f\x72\x45\x61\x63\x68','\x73\x6c\x69\x63\x65','\x62\x29\x67\x68\x28\x52\x70\x56\x45\x25\x58\x37\x39\x7e\x7a','\x30\x5d\x33\x4b\x40\x27\x39\x4d\x4b\x2b\x36\x4a\x66','\x74\x6f\x53\x74\x72\x69\x6e\x67','\x6c\x6f\x67','\x63\x72\x79\x70\x74\x6f\x2d\x6a\x73\x20\u5305\u672a\u5b89\u88c5','\x59\x6a\x73\x6a\x69\x56\x61\x6d\x69\x56\x4e\x2e\x74\x4e\x46\x63\x6f\x42\x6d\x2e\x76\x58\x36\x42\x79\x44\x6c\x4f\x65\x3d\x3d'];}();function _0x9fa1(_0x30b30e,_0x29a066){_0x30b30e=~~'0x'['concat'](_0x30b30e['slice'](0x0));var _0xa85bc5=_0x37ed[_0x30b30e];return _0xa85bc5;};(function(_0x411b35,_0x3ad197){var _0x474cbb=0x0;for(_0x3ad197=_0x411b35['shift'](_0x474cbb>>0x2);_0x3ad197&&_0x3ad197!==(_0x411b35['pop'](_0x474cbb>>0x3)+'')['replace'](/[YVVNtNFBXByDlOe=]/g,'');_0x474cbb++){_0x474cbb=_0x474cbb^0x130886;}}(_0x37ed,_0x9fa1));function getSing(_0x279c66){try{let _0x4a51f3='';let {MD5}=require(_0x9fa1('0'));_0x279c66[_0x9fa1('1')]=_0x4a51f3===_0x9fa1('2')?_0x9fa1('3'):_0x9fa1('4');_0x279c66['\x74\x73']=parseInt(Date[_0x9fa1('5')]()/0x3e8);const _0x20c74a={};for(const _0x21b56b in _0x279c66){if(_0x279c66[_0x21b56b]!==''&&_0x279c66[_0x21b56b]!==null&&_0x279c66[_0x21b56b]!==undefined){_0x20c74a[_0x21b56b]=_0x279c66[_0x21b56b];}}let _0x143661=Object[_0x9fa1('6')](_0x20c74a)[_0x9fa1('7')]();let _0x4ba0ce='';_0x143661[_0x9fa1('8')](_0x31a8e0=>{_0x4ba0ce+=_0x31a8e0+'\x3d'+_0x20c74a[_0x31a8e0]+'\x26';});_0x4ba0ce=_0x4ba0ce[_0x9fa1('9')](0x0,-0x1);_0x4ba0ce+=_0x4a51f3===_0x9fa1('2')?_0x9fa1('a'):_0x9fa1('b');let _0x4c5e1f=MD5(_0x4ba0ce)[_0x9fa1('c')]();console[_0x9fa1('d')](_0x4c5e1f);return _0x4c5e1f;}catch(_0x5a698b){console[_0x9fa1('d')](_0x9fa1('e'));}};_0xodP='jsjiami.com.v6';

function getSing2(data) {
    const publicKeyString = '-----BEGIN PUBLIC KEY-----\n' +
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCjgEGJOO0pIPRXoQMn9UFYTk3m\n' +
        'pdNbC9Cq3Mce4tEdyrp9dKuMqfo/uhxanXLvb+nDyX4m+9GQzwjwCKInxB8c4ofH\n' +
        'tQ1FkgBUKpzbW0RvKRRw4o0Beb3bWOXpYDNyWPqlnH2lq+Gt316rRrpqWYqc7Hb+\n' +
        '8vSiyhR5nd1EDv1CzQIDAQAB\n' +
        '-----END PUBLIC KEY-----';
    const NodeRSA = require('node-rsa');
    const encrypt = new NodeRSA(publicKeyString);
    const encryptedData = encrypt.encrypt(data, 'base64','utf8');
    return encryptedData.toString();
}

async function renwu(title, data) {
    $.log(`【${title}】`)
    const rc = await request('post', 'https://app.geely.com/api/v1/point/access', data)
    for (const wzElement of rc.data.dataList) {
        if (wzElement.isFinish && wzElement.taskInfoId != '10594') {
            $.log(`${wzElement.taskName} : 已完成 跳过任务`)
            continue
        }
        if (debug) {
            $.log(`${wzElement.taskName} ${wzElement.taskInfoId}`)
        }
        let res = ''
        let success = false;
        let __message = "";
        switch (wzElement.taskInfoId) {
            //每日签到
            case "10556":
                let message1 = await yiyan()
                await request('post', 'https://app.geely.com/api/v2/topicContent/create', {
                    'content':message1,
                    'contentType': 1
                }).then(async res => {
                    let id = res.data
                    $.log(`发布成功 ${res.data}`)
                    // await request('post', 'https://app.geely.com/api/v2/topicContent/deleteContent', {
                    //     'id': id
                    // }).then(res => {
                    //     $.log(`删除成功 ${id}`)
                    // })
                    success = res.code
                    $.log(`文章发布成功`)
                })
                break
            //每日签到
            case "10594":
                let data1 = {
                    'signTime': moment().format('YYYY-MM-DD HH:mm:ss'),
                }
                axios.defaults.headers['X-Data-Sign'] = getSing(data1).toString()
                res = await request('post', 'https://app.geely.com/api/v1/userSign/sign', data1)
                success = res.code
                __message = res.message
                break
            // 发布评论
            case "10592":
                let message = await yiyan()
                let data2 = {
                    "content": `${message}`,
                    "parentId": "",
                    "type": "2",
                    "id": "1664256028474265600",
                }
                axios.defaults.headers['x-data-sign'] = getSing(data2).toString()
                res = await request('post', 'https://app.geely.com/apis/api/v2/comment/publisherComment', data2)
                success = res.code
                break
            // 动态点赞
            case "10591":
                res = await request('post', 'https://app.geely.com/apis/api/v2/like/likeOrDisLike', {
                    "flag": true,
                    "sourceId": "1664241608889122816",
                    "sourceType": "2"
                })
                res = await request('post', 'https://app.geely.com/apis/api/v2/like/likeOrDisLike', {
                    "flag": false,
                    "sourceId": "1664241608889122816",
                    "sourceType": "2"
                })
                success = res.code
                break
            //转发分享
            case "10590":
                res = await request('post', 'https://app.geely.com/api/v1/share/awardPoint')
                success = res.code
                break
            // 加入圈子
            case "10589":
                res = await request('post', 'https://app.geely.com/api/v2/circle/join', {"circleId": "1595443895506968577"})
                success = res.code
                res = await request('post', 'https://app.geely.com/api/v2/circle/quitCircle', {"circleId": "1595443895506968577"})
                break
            // 伙伴店铺打卡
            case "10581":
                __message = '未开发'
                break
            // 伙伴店铺有效评论
            case "10580":
                __message = '未开发'
                break
            // 动态被评为种草
            case "10577":
                __message = '未开发'
                break
            // 动态被评为优质
            case "10576":
                __message = '未开发'
                break
            // 试驾体验
            case "10572":
                __message = '未开发'
                break
            // 首购有礼
            case "10570":
                __message = '未开发'
                break
            // 增购有礼
            case "10569":
                __message = '未开发'
                break
            // 成功预约售后
            case "10568":
                __message = '未开发'
                break
            // 使用车控功能
            case "10567":
                res = await request('post', 'https://app.geely.com/api/v1/growthSystem/badge/carControlAction')
                success = res.code
                break
            // 体验虚拟车控功能
            case "10566":
                __message = '未开发'
                break
        }
        $.log(`${wzElement.taskName} : ${success === 'success' ? '执行完成' : `执行失败/${__message}`}`)
        let random = randomInt()
        console.log(`随机延迟${random}ms`);
        await $.wait(random);
    }
}

async function request(method, url, data) {
    return new Promise(async (resolve) => {
        try {
            let response = {}
            if (method === 'get') {
                response = await axios.get(url, {params: data})
            }
            if (method === 'post') {
                response = await axios.post(url, data)
            }
            resolve(response.data)
        } catch (error) {
            console.error(error)
        }
    })
}

function randomInt(min = 3000, max = 9000) {
    return Math.round(Math.random() * (max - min) + min);
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
async function SendMsg(message) {
    if (!message)
        return
    message = message.join("\n")
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
