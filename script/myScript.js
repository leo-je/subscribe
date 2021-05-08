function applicationContext() {
    const start = Date.now()
    const isRequest = typeof $request != "undefined"
    const isSurge = typeof $httpClient != "undefined"
    const notify = (title, subtitle, message, rawopts) => {
        const Opts = (rawopts) => { //Modified from https://github.com/chavyleung/scripts/blob/master/Env.js
            if (!rawopts) return rawopts
            if (typeof rawopts === 'string') {
                if (isSurge) {
                    return {
                        url: rawopts
                    }
                } else {
                    return undefined
                }
            } else if (typeof rawopts === 'object') {
                if (isSurge) {
                    let openUrl = rawopts.url || rawopts.openUrl || rawopts['open-url']
                    return {
                        url: openUrl
                    }
                }
            } else {
                return undefined
            }
        }
        console.log(`${title}\n${subtitle}\n${message}`)
        if (isSurge) $notification.post(title, subtitle, message, Opts(rawopts))
    }
    const write = (value, key) => {
        if (isSurge) return $persistentStore.write(value, key)
    }
    const read = (key) => {
        if (isSurge) return $persistentStore.read(key)
    }
    const adapterStatus = (response) => {
        if (response) {
            if (response.status) {
                response["statusCode"] = response.status
            } else if (response.statusCode) {
                response["status"] = response.statusCode
            }
        }
        return response
    }
    const get = (options, callback) => {
        options.headers['User-Agent'] = 'JD4iPhone/167169 (iPhone; iOS 13.4.1; Scale/3.00)'
        if (isSurge) {
            options.headers['X-Surge-Skip-Scripting'] = false
            $httpClient.get(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }

    }
    const post = (options, callback) => {
        options.headers['User-Agent'] = 'JD4iPhone/167169 (iPhone; iOS 13.4.1; Scale/3.00)'
        if (options.body) options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
        if (isSurge) {
            options.headers['X-Surge-Skip-Scripting'] = false
            $httpClient.post(options, (error, response, body) => {
                callback(error, adapterStatus(response), body)
            })
        }
    }
    const AnError = (name, keyname, er, resp, body) => {
        if (typeof (merge) != "undefined" && keyname) {
            if (!merge[keyname].notify) {
                merge[keyname].notify = `${name}: 异常, 已输出日志 ‼️`
            } else {
                merge[keyname].notify += `\n${name}: 异常, 已输出日志 ‼️ (2)`
            }
            merge[keyname].error = 1
        }
        return console.log(`\n‼️${name}发生错误\n‼️名称: ${er.name}\n‼️描述: ${er.message}${JSON.stringify(er).match(/\"line\"/) ? `\n‼️行列: ${JSON.stringify(er)}` : ``}${resp && resp.status ? `\n‼️状态: ${resp.status}` : ``}${body ? `\n‼️响应: ${resp && resp.status != 503 ? body : `Omit.`}` : ``}`)
    }
    const time = () => {
        const end = ((Date.now() - start) / 1000).toFixed(2)
        return console.log('\n签到用时: ' + end + ' 秒')
    }
    const done = (value = {}) => {
        if (isSurge) isRequest ? $done(value) : $done()
    }
    return {
        AnError,
        isRequest,
        isSurge,
        notify,
        write,
        read,
        get,
        post,
        time,
        done
    }
};

function GetCookie() {
    try {
        if ($request.method != 'OPTIONS' && $request.headers && $request.url !== 'http://www.apple.com/') {
            let acObj = {};
            // 提取ck数据
            let CV = ($request.headers['Cookie'] || $request.headers['cookie'] || '').replace(/ /g, '');
            let ckItems = CV.split(';').filter(s => /^(pt_key|pt_pin)=.+/.test(s)).sort();
            if (ckItems.length == 2) {
                acObj.cookie = ckItems.join(';') + ';';
                acObj.userName = decodeURIComponent(acObj.cookie.match(/pt_pin=(.+?);/)[1]);
            }
            // 无cookie数据进行提示，有ck数据，找到账号位进行存储
            if (!acObj.cookie) {
                $nobyda.notify("写入京东Cookie失败", "", "请查看脚本内说明, 登录网页获取 ‼️")
                return
            } else {
                const allCk = [$nobyda.read('CookieJD'), $nobyda.read('CookieJD2')];
                const ocks = $nobyda.read('CookiesJD');
                let oldCks = [];
                try {
                    oldCks = (ocks && JSON.parse(ocks)) || [];
                } catch (e) {
                    console.log(`写入京东Cookie时转换京东扩展账号数据CookiesJD异常，扩展账号信息：\n${ocks}`)
                    oldCks = [];
                }
                oldCks.forEach(item => allCk.push(item.cookie));
                let [status, seatNo] = chooseSeatNo(acObj.cookie, allCk, /pt_pin=(.+?);/);
                if (status) {
                    if (status > 0) {
                        let WT = '';
                        if (seatNo < 2) {
                            WT = $nobyda.write(acObj.cookie, `CookieJD${seatNo ? seatNo + 1 : ''}`);
                        } else {
                            if (oldCks.length <= seatNo - 2) {
                                oldCks.push(acObj);
                            } else {
                                oldCks[seatNo - 2] = acObj;
                            }
                            WT = $nobyda.write(JSON.stringify(oldCks, null, 2), 'CookiesJD');
                        }
                        $nobyda.notify(`用户名: ${acObj.userName}`, ``, `${status == 2 ? `更新` : `写入`}京东 [账号${seatNo + 1}] Cookie${WT ? `成功 🎉` : `失败 ‼️`}`)
                    } else {
                        console.log(`\n用户名: ${acObj.userName}\n与历史京东 [账号${seatNo + 1}] Cookie相同, 跳过写入 ⚠️`)
                    }
                }
            }
        } else if ($request.url === 'http://www.apple.com/') {
            $nobyda.notify("京东签到", "", "类型错误, 手动运行请选择上下文环境为Cron ⚠️");
        } else {
            $nobyda.notify("京东签到", "写入Cookie失败", "请检查匹配URL或配置内脚本类型 ⚠️");
        }
    } catch (eor) {
        $nobyda.write("", "CookieJD")
        $nobyda.write("", "CookieJD2")
        $nobyda.write("", "CookiesJD")
        $nobyda.notify("写入京东Cookie失败", "", '已尝试清空历史Cookie, 请重试 ⚠️')
        console.log(`\n写入京东Cookie出现错误 ‼️\n${JSON.stringify(eor)}\n\n${eor}\n\n${JSON.stringify($request.headers)}\n`)
    } finally {
        $nobyda.done()
    }
}

console.log("myScript:==================== version 3.1 ==================");
var app = applicationContext()
console.log("isSurge:" + app.isSurge);
console.log("isRequest:" + app.isRequest);
//$nobyda.notify("小火箭","myScript","测试")
