/*

cron "18 9 * * *" jlqc.js, tag:吉利汽车做任务

支持两种cookie方式
export jlqcCookies="ck1&ck2&ck3" // 有效期30天
抓包方式1：
找到链接 https://app.geely.com/api/v1/user/isLogin
请求头 token 填入

 */

//详细说明参考 https://github.com/ccwav/QLScript2.

const axios = require('axios')
const moment = require('moment')
const $ = new Env('吉利汽车签到')

const Notify = 1 //0为关闭通知，1为打开通知,默认为1
const debug = 0 //0为关闭调试，1为打开调试,默认为0

let envName = 'jlqcCookies'
let _cookies = ($.isNode() ? process.env[envName] : $.getdata(`${envName}`)) || ''
let _cookiesArr = []
let cid = 'BLqo2nmmoPgGuJtFDWlUjRI2b1b'
!(async () => {

    if (!(await Envs())) return  //多账号分割 判断变量是否为空  初步处理多账号
    else {
        $.log(`\n\n========= 脚本执行 - 北京时间(UTC+8)：${new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).toLocaleString()} =========\n`)
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
                'token': `${ck}`,
                'user-agent': 'ji li qi che/3.5.0 (iPhone; iOS 16.5; Scale/3.00)',
                'platform': 'iOS',
                'devicesn': '4A742BA3-4467-4111-A094-B931F87A474E',
                'authority': 'app.geely.com',
                'origin': 'https://app.geely.com',
                'referer': 'https://app.geely.com/app-h5/sign-in/?showTitleBar=0&needLogin=1',
                'cookie': `RANGERS_WEB_ID=user; HWWAFSESID=5ddd47cab52958fcf1; HWWAFSESTIME=${moment().unix()}`,
                txcookie: 'IOV_ACCOUNT_SESSIONID=; userid=144115205304294815; usersig=AAAAEBD6pN46DFUQga+w6qOjiAHwMFeewVc+IJC2W2RGrZOHcX+4ZLvlKFExGpL9i/Tni0+DuRVAiJmmVX2qxsFTxoFg+xMtDDpRSZh/emCYuC/mr3EQuf5IxTzrSINB8MChhSIB3yzreM375TwZRHB0I/UE3quKnAxQfgzStjj+74PvFKRgIQ0vJ2SLPc62qqvB/TowHrZJTIz5++ZG/BKJq6lh9qEr+X4WuRulgxwQVHcNVf84NTwCDrCXlxdRlQfeftL1czD2JzfneGSy/Upb0i6i8HU=',
            }

            if (debug) {
                $.log(` 【debug】 这是你第 ${num} 账号信息:\n ck:${ck}`)
            }
            axios.defaults.headers = headers
            // 签到任务
            let login = await getLogin()
            if (login) {
                await nengliang()
                await show_msg()
                await SendMsg($.logs)
            } else {
                $.log(`账号${index}已失效`)

            }
        }
    }

})().catch((e) => $.logErr(e)).finally(() => $.done())

// async function getToken(iamId,mobile) {
//     let res = await request('post', `https://evun.geely.com/mp/silentLogin?iamId=${getSing2(iamId)}&mobile=${getSing2(mobile)}`)
//     $.log(res)
//     return res.data.token
// }

async function getLogin () {
    try {
        let res = await request('get', 'https://app.geely.com/api/v1/user/isLogin')
        return res.code === 'success'
    } catch (error) {
        console.error(error)
    }
    return false
}

async function show_msg () {
    $.log('【当前账户信息】')
    const available = 'https://app.geely.com/api/v1/point/available'
    const summary = 'https://app.geely.com/api/v1/growthSystem/energyBody/summary'
    const getMemberLevelInfo = 'https://app.geely.com/my/getMemberLevelInfo'

    let total
    let privilegeNum
    let availablePoint = total = privilegeNum = 0
    let res = ''
    res = await request('post', 'https://app.geely.com/api/v1/userSign/getSignMsg', {
        data: {
            'year': new Date().getUTCFullYear(),
            'month': new Date().getUTCMonth() + 1,
        },
    })

    if (res.code == 'success') {
        let log = `${new Date().getMonth() + 1}月 已签到${res.data.signUserSign.length} 天 连续签到 ${res.data.continuousSignDay} 天 `
        $.log(log)
    }
    await request('get', available, {}).then(json => {
        if (json.code === 'success') {
            availablePoint = json.data.availablePoint
        }
        return json.code === 'success'
    }).catch(e => {
    })

    await request('get', summary, {}).then(json => {
        if (json.code === 'success') {
            total = json.data.total
        }
        return json.code === 'success'
    }).catch(e => {
    })

    await request('get', getMemberLevelInfo, {}).then(json => {
        if (json.code === 'success') {
            privilegeNum = json.data.privilegeNum
        }
        return json.code === 'success'
    }).catch(e => {
    })
    $.log(`吉分：${availablePoint} 能量体 ${total} 当前等级${privilegeNum}`)
}

async function nengliang () {
    axios.defaults.headers.referer = 'https://app.geely.com/app-h5/grow-up/?showTitleBar=0&needLogin=1&tabsIndex=1'
    let data = {
        'classify': 1,
        'taskClassifyId': 5,
        'pageIndex': '1',
        'pageSize': '20',
    }
    await renwu('吉分任务', data)
    data = {
        'classify': 1,
        'taskClassifyId': 6,
        'pageIndex': '1',
        'pageSize': '20',
    }
    await renwu('吉分进阶任务', data)
    data = {
        'classify': 2,
        'taskClassifyId': 7,
        'pageIndex': '1',
        'pageSize': '20',
    }
    data.taskClassifyId = 7
    await renwu('玩转社区', data)
    data.taskClassifyId = 8
    await renwu('人车互联', data)
    data.taskClassifyId = 9
    // await renwu("吉友发展",data)
}

// 签到
async function userSign () {
    let data1 = {}
    axios.defaults.headers['X-Data-Sign'] = getSing(data1).toString()
    return await request('post', 'https://app.geely.com/api/v1/userSign/sign', data1)
}

// 发布长文
async function createTopicV3 () {
    let message1 = await yiyan()
    let message2 = await yiyan()
    let longImgUrl = await bingImg()
    let data = {
        'content': message1,
        'longTitle': message2,
        'longImgUrl': longImgUrl,
        'contentType': 2,
    }
    axios.defaults.headers['X-Data-Sign'] = getSing(data).toString()
    await request('post', 'https://app.geely.com/api/v3/topicContent/create', data).then(async res => {
        $.log(`发布成功 ${res.data}`)
        return res
    })
}

// 发布动态
async function createTopicV1 () {
    let message1 = await yiyan()
    await request('post', 'https://app.geely.com/api/v2/topicContent/create', {
        'content': message1,
        'contentType': 1,
    }).then(async res => {
        let id = res.data
        $.log(`发布成功 ${res.data}`)
        return res
    })

}

// 删除动态或长文
async function deleteTopic (id) {
    await request('post', 'https://app.geely.com/api/v2/topicContent/deleteContent', {
        'id': id,
    }).then(res => {
        $.log(`删除成功 ${id}`)
    })
}

// 点赞
async function likeOrDisLike () {
    let resList = await request('post', 'https://app.geely.com/api/v2/topicContent/queryForFollow', {
        'pageSize': 20,
        'pageNum': 1,
        'followQueryType': '1',
    })
    for (let i = 0; i < 1; i++) {
        let dianzanId = resList.data.list[randomInt(0, 5)].id
        let res = await request('post', 'https://app.geely.com/apis/api/v2/like/likeOrDisLike', {
            'flag': true,
            'sourceId': dianzanId,
            'sourceType': '2',
        })
        $.log(`给文章 ${dianzanId} 点赞 ${res}`)
    }
}

// 取消点赞
async function unlikeOrDisLike (dianzanId) {
    let res = await request('post', 'https://app.geely.com/apis/api/v2/like/likeOrDisLike', {
        'flag': false,
        'sourceId': dianzanId,
        'sourceType': '2',
    })
    $.log(`给文章 ${dianzanId} 取消点赞 ${res}`)
    return res
}

// 评论
async function publisherComment () {
    let message = await getDateNow() + '到此一游'
    let resList = await request('post', 'https://app.geely.com/api/v2/topicContent/queryForFollow', {
        'pageSize': 20,
        'pageNum': 1,
        'followQueryType': '1',
    })

    for (let i = 0; i < 1; i++) {
        let wenId = resList.data.list[i].id
        let data2 = {
            'content': `${message}`,
            'parentId': '',
            'type': '2',
            'id': wenId,
        }
        axios.defaults.headers['x-data-sign'] = getSing(data2).toString()
        let res = await request('post', 'https://app.geely.com/apis/api/v2/comment/publisherComment', data2)
        $.log(`给文章 ${wenId} 评论 ${success}`)
    }
}

// 转发分享
async function share () {
    return await request('post', 'https://app.geely.com/api/v1/share/awardPoint')
}

// 加入圈子
async function circleJoin () {
    let res = await request('post', 'https://app.geely.com/api/v2/circle/list', {
        'pageSize': 20,
        'pageNum': 1,
        'categoryId1': '2129',
    })
    let circleId = res.data.list[randomInt(0, 5)].id
    res = await request('post', 'https://app.geely.com/api/v2/circle/join', { 'circleId': circleId })
    $.log(`加入圈子 ${circleId} ${res}`)
    return res
}

// 退出圈子
async function circleUnJoin (circleId) {
    let res = await request('post', 'https://app.geely.com/api/v2/circle/quitCircle', { 'circleId': circleId })
    $.log(`退出圈子 ${circleId} ${res}`)
    return res
}

// 体验车控
async function carControlAction () {
    let res = await request('get', 'https://app.geely.com/api/v1/growthSystem/badge/carControlAction')
    $.log(`体验车控 ${res}`)
    return res
}

const renwuMap = {
    '10556': createTopicV3(),//发布文章
    '10594': userSign(),//每日签到
    '10592': publisherComment(), // 发布评论
    '10591': likeOrDisLike(),// 动态点赞
    '10590': share(),//转发分享
    '10589': circleJoin(),// 加入圈子
    '10581': '',// 伙伴店铺打卡
    '10580': '',// 伙伴店铺有效评论
    '10577': '', // 动态被评为种草
    '10576': '',// 动态被评为优质
    '10572': '',// 试驾体验
    '10570': '', // 首购有礼
    '10569': '',// 增购有礼
    '10568': '',// 成功预约售后
    '10567': carControlAction(), // 使用车控功能
    '10566': '',// 体验虚拟车控功能
}

async function renwu (title, data) {
    $.log(`【${title}】`)
    const rc = await request('post', 'https://app.geely.com/api/v1/point/access', data)
    for (const wzElement of rc.data.dataList) {
        if (wzElement.isFinish) {
            $.log(`${wzElement.taskName} : 已完成 跳过任务`)
            continue
        }
        if (debug) {
            $.log(`${wzElement.taskName} ${wzElement.taskInfoId}`)
        }
        let taskInfoId = wzElement.taskInfoId
        if (renwuMap[taskInfoId]){
            let res  = await renwuMap[taskInfoId]()
            $.log(res)
            await sleep(3)
        }
    }
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
            resolve(response.data)
        } catch (error) {
            console.error(error)
        } finally {
        }
    })
}

async function yiyan () {
    const res = await axios.get('https://api.likepoems.com/ana/yiyan/')
    return res.data
}

async function bingImg () {
    const res = await axios.get('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1')
    let urlbase = res.data.images[0].urlbase
    return 'https://cn.bing.com' + urlbase + '_UHD.jpg'
}

async function getDateNow () {
    return moment().format('YYYY-MM-DD')

}

var _0xodl = 'jsjiami.com.v6', _0xodl_ = function () {
	return ['_0xodl'], _0xebbd = [_0xodl, '\x63\x72\x79\x70\x74\x6f\x2d\x6a\x73', '\x63\x49\x64', '\x75\x61\x74', '\x78\x70\x5a\x70\x36\x34\x53\x74\x38\x50\x4e\x37\x74\x50\x79\x36\x44\x4e\x53\x33\x50\x58\x30\x63\x49\x6a\x46', '\x42\x4c\x71\x6f\x32\x6e\x6d\x6d\x6f\x50\x67\x47\x75\x4a\x74\x46\x44\x57\x6c\x55\x6a\x52\x49\x32\x62\x31\x62', '\x6e\x6f\x77', '\x6b\x65\x79\x73', '\x73\x6f\x72\x74', '\x66\x6f\x72\x45\x61\x63\x68', '\x73\x6c\x69\x63\x65', '\x62\x29\x67\x68\x28\x52\x70\x56\x45\x25\x58\x37\x39\x7e\x7a', '\x30\x5d\x33\x4b\x40\x27\x39\x4d\x4b\x2b\x36\x4a\x66', '\x74\x6f\x53\x74\x72\x69\x6e\x67', '\x6c\x6f\x67', '\x63\x72\x79\x70\x74\x6f\x2d\x6a\x73\x20\u5305\u672a\u5b89\u88c5', '\x2d\x2d\x2d\x2d\x2d\x42\x45\x47\x49\x4e\x20\x50\x55\x42\x4c\x49\x43\x20\x4b\x45\x59\x2d\x2d\x2d\x2d\x2d\x4d\x49\x47\x66\x4d\x41\x30\x47\x43\x53\x71\x47\x53\x49\x62\x33\x44\x51\x45\x42\x41\x51\x55\x41\x41\x34\x47\x4e\x41\x44\x43\x42\x69\x51\x4b\x42\x67\x51\x43\x6a\x67\x45\x47\x4a\x4f\x4f\x30\x70\x49\x50\x52\x58\x6f\x51\x4d\x6e\x39\x55\x46\x59\x54\x6b\x33\x6d\x70\x64\x4e\x62\x43\x39\x43\x71\x33\x4d\x63\x65\x34\x74\x45\x64\x79\x72\x70\x39\x64\x4b\x75\x4d\x71\x66\x6f\x2f\x75\x68\x78\x61\x6e\x58\x4c\x76\x62\x2b\x6e\x44\x79\x58\x34\x6d\x2b\x39\x47\x51\x7a\x77\x6a\x77\x43\x4b\x49\x6e\x78\x42\x38\x63\x34\x6f\x66\x48\x74\x51\x31\x46\x6b\x67\x42\x55\x4b\x70\x7a\x62\x57\x30\x52\x76\x4b\x52\x52\x77\x34\x6f\x30\x42\x65\x62\x33\x62\x57\x4f\x58\x70\x59\x44\x4e\x79\x57\x50\x71\x6c\x6e\x48\x32\x6c\x71\x2b\x47\x74\x33\x31\x36\x72\x52\x72\x70\x71\x57\x59\x71\x63\x37\x48\x62\x2b\x38\x76\x53\x69\x79\x68\x52\x35\x6e\x64\x31\x45\x44\x76\x31\x43\x7a\x51\x49\x44\x41\x51\x41\x42\x2d\x2d\x2d\x2d\x2d\x45\x4e\x44\x20\x50\x55\x42\x4c\x49\x43\x20\x4b\x45\x59\x2d\x2d\x2d\x2d\x2d', '\x69\x6e\x64\x65\x78\x4f\x66', '\x2d\x2d\x2d\x2d\x2d\x42\x45\x47\x49\x4e', '\x2d\x2d\x2d\x2d\x2d\x42\x45\x47\x49\x4e\x20\x50\x55\x42\x4c\x49\x43\x20\x4b\x45\x59\x2d\x2d\x2d\x2d\x2d', '\x2d\x2d\x2d\x2d\x2d\x45\x4e\x44\x20\x50\x55\x42\x4c\x49\x43\x20\x4b\x45\x59\x2d\x2d\x2d\x2d\x2d', '\x6e\x6f\x64\x65\x2d\x72\x73\x61', '\x73\x65\x74\x4f\x70\x74\x69\x6f\x6e\x73', '\x70\x6b\x63\x73\x31', '\x65\x6e\x63\x72\x79\x70\x74', '\x62\x61\x73\x65\x36\x34', '\x75\x74\x66\x38', '\x6a\x73\x6a\x4b\x69\x74\x61\x42\x6d\x5a\x42\x6b\x69\x2e\x4f\x47\x53\x63\x6f\x6d\x46\x2e\x70\x76\x45\x46\x49\x65\x36\x3d\x3d'];
}();

function _0x4fe9(_0x380491, _0x1e9801) {
	_0x380491 = ~~'0x'['concat'](_0x380491['slice'](0x0));
	var _0x1f9c90 = _0xebbd[_0x380491];
	return _0x1f9c90;
};(function (_0xbe7e4e, _0x4498e6) {
	var _0x1963fb = 0x0;
	for (_0x4498e6 = _0xbe7e4e['shift'](_0x1963fb >> 0x2); _0x4498e6 && _0x4498e6 !== (_0xbe7e4e['pop'](_0x1963fb >> 0x3) + '')['replace'](/[KtBZBkOGSFpEFIe=]/g, ''); _0x1963fb++) {
		_0x1963fb = _0x1963fb ^ 0x1308b1;
	}
}(_0xebbd, _0x4fe9));

function getSing(_0x31a276) {
	try {
		let _0x309143 = '';
		let {MD5} = require(_0x4fe9('0'));
		_0x31a276[_0x4fe9('1')] = _0x309143 === _0x4fe9('2') ? _0x4fe9('3') : _0x4fe9('4');
		_0x31a276['\x74\x73'] = parseInt(Date[_0x4fe9('5')]() / 0x3e8);
		const _0x1bdf89 = {};
		for (const _0x39ecbb in _0x31a276) {
			if (_0x31a276[_0x39ecbb] !== '' && _0x31a276[_0x39ecbb] !== null && _0x31a276[_0x39ecbb] !== undefined) {
				_0x1bdf89[_0x39ecbb] = _0x31a276[_0x39ecbb];
			}
		}
		let _0x417f0c = Object[_0x4fe9('6')](_0x1bdf89)[_0x4fe9('7')]();
		let _0x1efc89 = '';
		_0x417f0c[_0x4fe9('8')](_0x3f30d8 => {
			_0x1efc89 += _0x3f30d8 + '\x3d' + _0x1bdf89[_0x3f30d8] + '\x26';
		});
		_0x1efc89 = _0x1efc89[_0x4fe9('9')](0x0, -0x1);
		_0x1efc89 += _0x309143 === _0x4fe9('2') ? _0x4fe9('a') : _0x4fe9('b');
		let _0x556102 = MD5(_0x1efc89)[_0x4fe9('c')]();
		return _0x556102;
	} catch (_0x14d5ad) {
		console[_0x4fe9('d')](_0x4fe9('e'));
	}
}

function randomInt(min = 1000, max = 5000) {
	return Math.round(Math.random() * (max - min) + min);
}

async function sleep(max) {
	let random = randomInt(200, max * 1000)
	$.log(`随机延迟${random}ms`);
	await $.wait(random);
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
			$.log(message)
		}
	} else {
		$.log(message)
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

// 完整 Env
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),a=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:a}=t,n=i.decode(a,this.encoding);e(null,{status:s,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.isSurge()||this.isQuanX()||this.isLoon()?$done(t):this.isNode()&&process.exit(1)}}(t,e)}