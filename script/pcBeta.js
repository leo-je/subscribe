const app = applicationContext();
!(async () => {
    await start(app)
})().catch(e => {
    app.AnError("pcDBeta", e)
}).finally(() => {
    app.done()
})

async function start(app) {
    console.log("myScript:==================== version 4.4.18 ==================");
    console.log("isSurge:" + app.isSurge);
    console.log("isRequest:" + app.isRequest);
    await GetCookie(app);
    await clockinPcBeta(app);
    console.log("app end")
}

function GetCookie(app) {
    console.log("pcBeta cookie")
    return new Promise(resolve => {
        try {
            if (typeof $request === 'undefined' || $request.url === "http://www.example.com/") {
                return;
            }
            console.log("myScript:" + $request.url)
            if ($request.method != 'OPTIONS' && $request.headers && $request.url !== 'http://www.apple.com/' && $request.url !== "http://www.example.com/") {
                console.log($request.url)
                // 提取ck数据
                let CV = ($request.headers['Cookie'] || $request.headers['cookie'] || '').replace(/ /g, '');
                let ckItems = CV.split(';');
                if (ckItems.length <= 0) {
                    app.notify("pcBeta", "", "读取Cookie失败️")
                    return
                } else {
                    //const cookiepcBeta = $nobyda.read('CookiepcBeta');
                    let WT = '';
                    WT = app.write(CV, `CookiepcBeta`);
                    app.notify(`pcBeta`, ``, `保存cookie成功`)
                }
            } else if ($request.url === 'http://www.apple.com/') {
                app.notify("pcBeta", "", "类型错误, 手动运行请选择上下文环境为Cron ⚠️");
            } else {
                app.notify("pcBeta", "写入Cookie失败", "请检查匹配URL或配置内脚本类型 ⚠️");
            }
        } catch (eor) {
            console.log(eor)
            app.notify("pcBeta", "", '写入Cookie失败, 请重试 ⚠️', eor)
            console.log(`\n写入Cookie出现错误 ‼️\n${JSON.stringify(eor)}\n\n${eor}\n\n${JSON.stringify($request.headers)}\n`)
        } finally {
            resolve();
        }
    });
}

function clockinPcBeta(app) {
    console.log("执行签到")
    return new Promise(resolve => {
        const cv = app.read("CookiepcBeta");
        // console.log("cookie:" + cv)
        const options = {
            url: "http://bbs.pcbeta.com/home.php?mod=task&do=apply&id=149",
            headers: {
                Host: "bbs.pcbeta.com",
                Accept: "*/*",
                Connection: "keep-alive",
                Cookie: cv,
                "User-Agent": "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
                "Accept-Language": "zh-cn",
                "Referer": "http://bbs.pcbeta.com",
                "Accept-Encoding": "gzip, deflate, br"
            }
        }
        console.log(options)
        $httpClient.get(options, (err, resp, data) => {
            try {
                if (err) {
                    app.AnError(err)
                } else {
                    if (data && data.indexOf("恭喜您") != -1) {
                        console.log(data)
                        app.notify("pcBeta", "", "签到成功")
                    } else if (data && data.indexOf("请下期再来") != -1) {
                        app.notify("pcBeta", "签到失败", "重复签到")
                    } else {
                        app.notify("pcBeta", "签到失败", "签到失败")
                    }
                }
            } catch (e) {
                app.AnError("pcBeta:签到", e)
            } finally {
                resolve();
            }
        })
    });
}


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
            console.log("app get start get")
            console.log(JSON.stringify(options))
            console.log(JSON.stringify($httpClient))
            options.headers['X-Surge-Skip-Scripting'] = false
            $httpClient.get(options, (error, response, body) => {
                console.log(error)
                console.log(body)
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
    const AnError = (name, er, resp, body) => {
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


