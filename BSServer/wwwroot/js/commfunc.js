var convertDateFromString = function (dateString) {
    if (dateString) {
        var s = dateString.replace(/-/g, "/");
        var date = new Date(s);
        return date;
    }
};

var dateFormat = function (date, fmt) { //author: meizz   
    var o = {
        "M+": date.getMonth() + 1, //月份   
        "d+": date.getDate(), //日   
        "h+": date.getHours(), //小时   
        "m+": date.getMinutes(), //分   
        "s+": date.getSeconds(), //秒   
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度   
        "S": date.getMilliseconds() //毫秒   
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ?
            (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

function addDate(date, days) {
    var d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

function addMonth(date, months) {
    var d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
};

function addTime(date, hours) {
    var d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
};

function addMinute(date, minutes) {
    var d = new Date(date);
    d.setMinutes(d.getMinutes() + minutes, d.getSeconds(), 0);
    return d;
};

function addSecond(date, seconds) {
    var d = new Date(date);
    var s = d.getTime();
    d.setTime(s + seconds * 1000);
    return d;
}

function enDataB(str) {
    if (str != null) {
        var en = encodeURIComponent(str);
        return enData(en);
    }
    return '';
}

function enData(str) {
    var res = '';
    var num = 0;
    if (str != null) {
        for (var i = 0; i < str.length; i++) {
            num = str.charCodeAt(i) ^ 57;
            if (num >= 16) {
                res += num.toString(16);
            }
            else {
                res += '0' + num.toString(16);
            }
        }
    }
    return res;
}

function enLog(u, p) {
    var enU = enDataB(u);
    var enP = enData(p);
    var token = enU + '$' + new Date().getTime() + '$' + enP;
    return token;
}

//序列化表单
//incDisbled: 包括禁用项
//incNoCheck: 包括未勾选的CheckBox或Radio
$.fn.extend({
    summerfresh_serialize: function (incDisbled, incNoCheck) {
        var a = this.serializeArray(incDisbled);
        if (incNoCheck) {
            var $radio = $('input[type=radio],input[type=checkbox]', this);
            var temp = {};
            $.each($radio, function () {
                if (!temp.hasOwnProperty(this.name)) {
                    if ($("input[name='" + this.name + "']:checked").length == 0) {
                        temp[this.name] = "";
                        a.push({ name: this.name, value: "" });
                    }
                }
            });
        }
        return $.param(a);
    }
});

/*字典 Dictionary类*/
function Dictionary() {
    this.add = add;
    this.datastore = new Array();
    this.find = find;
    this.remove = remove;
    this.showAll = showAll;
    this.count = count;
    this.clear = clear;
}

function add(key, value) {
    this.datastore[key] = value;
}

function find(key) {
    return this.datastore[key];
}

function remove(key) {
    delete this.datastore[key];
}

function showAll() {
    var str = "";
    for (var key in this.datastore) {
        str += key + " -> " + this.datastore[key] + ";  "
    }
    console.log(str);
}

function count() {
    /*var ss = Object.keys(this.datastore).length;
    console.log("ssss   "+ss);
    return Object.keys(this.datastore).length;*/
    /**/
    var n = 0;
    for (var key in Object.keys(this.datastore)) {
        ++n;
    }
    console.log(n);
    return n;
}

function clear() {
    for (var key in this.datastore) {
        delete this.datastore[key];
    }
}

//check校验时间结束时间不能小时开始时间
var checkTime = function myfunction(startTime, endTime) {
    var start = new Date(startTime.replace("-", "/").replace("-", "/"));
    var end = new Date(endTime.replace("-", "/").replace("-", "/"));
    if (end < start) {
        return true;
    }
}

//隐藏或显示左边窗体
//function closeboxleft() {
//    $(".left-select-box").toggleClass("hide");
//    $(".form-stretch").toggleClass("form-stretch2");
//    $(".right-content-box").toggleClass("unfold");
//}

//隐藏或显示body里的左边条件窗体 1隐藏 2显示
function closeBodyboxLeft(v) {
    if (v == 1) {
        $(".left-select-box").addClass("hide");
        $(".form-stretch").addClass("form-stretch2");
        $(".right-content-box").addClass("unfold");

    } else if (v == 2) {
        $(".left-select-box").removeClass("hide");
        $(".form-stretch").removeClass("form-stretch2");
        $(".right-content-box").removeClass("unfold");
    } else {
        $(".left-select-box").toggleClass("hide");
        $(".form-stretch").toggleClass("form-stretch2");
        $(".right-content-box").toggleClass("unfold");
    }
}