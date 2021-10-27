// <reference path="jquery-1.4.1-vsdoc.js" />
var summerFresh = {
    contextPath: document.location.protocol + "//" + document.location.host,
    /*
    dataService三大功能：
    1.从服务端获取SQL语句执行结果 sqlid:xxxxxx
    2.执行SQL语句 exec:xxxxxx
    3.获取指定url返回的值 /{Controller}/{Action}
    url:/{Controller}/{Action} || sqlid:xxxxxx || exec:xxxxxx
    data:json格式的参数，例{id:'xxx',name:'aaa'}
    callback:回调函数，带一个参数，如果是执行sqlid:xxxxxx，则该参数是返回一个数组，每一个数组是SqlId返回的行;
                               如果是执行exec:xxxxxx，则该参数是返回执行SQL受影响的行数;
                               如果是执行/{Controller}/{Action}，则根据action返回值而定。
    async:true为异步,false为同步
    */
    dataService: function (url, data, callback, method, async) {
        if (async === undefined) {
            async = true;
        }
        if (method === undefined) {
            method = "post";
        }
        $.ajax({
            type: method,
            url: url,
            async: async,
            data: data,
            dataType: "json",
            success: function (response) {
                callback(response.Data);
                //if (response.Result) {
                //    if (response.NoAuthority) {
                //        summerFresh.showError(response.ErrorMessage);//这里可以弹出登录框，或弹回登录页面
                //    }
                //    else {
                //        if (response.LoginTimeOut) {
                //            window.top.location.href = summerFresh.contextPath + "/WindStation/LogOn";
                //        }
                //        else {
                //            callback(response.Data);
                //        }
                //    }
                //}
                //else {
                //    if (response.ErrorMessage == "站点未连接") {
                //        var info = '站点连接失败，请稍后重试……<p>可能原因如下：</p><p style="margin-left:100px;text-align:left">（1）站点离线</p><p style="margin-left:100px;text-align:left">（2）网络通讯不良</p>'
                //        summerFresh.showInfo(info, "info", "系统提示", 350, 250);
                //    }
                //    else {
                //        summerFresh.showError(response.ErrorMessage);
                //    }
                //}
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //alert("网络异常！请尝试刷新网页");
            }
        });
    },
    dataServiceSim: function (url, data, callback, method, async) {
        if (async === undefined) {
            async = true;
        }
        if (method === undefined) {
            method = "post";
        }
        $.ajax({
            type: method,
            url: url,
            async: async,
            data: data,
            dataType: "json",
            success: function (response) {
                callback(response);
            }
        });
    },
    /*
    stringFormat:类似于C#中的string.Format
    使用示例：summerFresh.stringFormat("my name is {0}","liuhaifeng") -- 输出:my name is liuhaifeng
    */
    stringFormat: function (string) {
        var args = arguments;
        var pattern = new RegExp("{([0-" + arguments.length + "])}", "g");
        return String(string).replace(pattern, function (match, index) {
            var currentIndex = parseInt(index);
            if (currentIndex + 1 > args.length || currentIndex < 0) {
                throw new Error("参数索引出错");
            }
            return args[currentIndex + 1];
        });
    },
    /*
    异步提交表单
    formId:表单Id
    onSuccess:提交成功回调
    */
    formAjaxSubmit: function (formId, onSuccess) {
        var form = $("#" + formId);
        var postData = form.serialize();
        summerFresh.dataService(form.attr("action"), postData, onSuccess);
    },
    /*
    modelViewBinder:模型视图绑定
    使用示例：
    var model={name:'liuhaifeng',age:30};
    var view="<div>{name}</div><p>{age}</p>";
    var s = summerFresh.modelViewBinder(model,view);
    执行完后，s="<div>liuhaifeng</div><p>30</p>"
    */
    modelViewBinder: function (model, view) {
        var pattern = new RegExp("{([^}]*)}", "g");
        return String(view).replace(pattern, function (match, index) {
            match = match.substring(1, match.length - 1);
            return summerFresh.getPropertyValue(model, match);
        });
    },
    /*
    modelListBinder:批量模型视图绑定
    使用示例：
    var modelList=[{name:'liuhaifeng',age:30},{name:'hello',age:31}];
    var view="<div>{name}</div><p>{age}</p>";
    var s = summerFresh.modelListBinder(modelList,view,function(m){m.name+='1';return m;});
    执行完后，s="<div>liuhaifeng1</div><p>30</p> <div>hello1</div><p>31</p>"
    */
    modelListBinder: function (modelList, view, onBind) {
        var rValue = "";
        $.each(modelList, function (i) {
            if (typeof (onBind) == "function") {
                onBind(modelList[i]);
            }
            rValue += summerFresh.modelViewBinder(modelList[i], view);
        });
        return rValue;
    },
    getPropertyValue: function (model, propertyString) {
        var i = propertyString.split(".");
        var result = model;
        for (var j = 0; j < i.length; j++) {
            result = result[i[j]];
        }
        return result;
    },
    dataBinding: function (container, data, template, bindingType) {
        bindingType = bindingType || "append";
        switch (bindingType) {
            case "prepend": container.prepend(summerFresh.modelListBinder(data, template)); break;
            case "replace": container.html(summerFresh.modelListBinder(data, template)); break;
            case "append": container.append(summerFresh.modelListBinder(data, template)); break;
        }
    },
    /*
    获取当前页面的URL参数，以JSON返回
    示例：当前页面URL为/home/index?id=3&name=hello;
         var s=summerFresh.getQueryString();
         执行完后s={id:3,name:'hello'}
    */
    getQueryString: function () {
        if (window.location.search == "") {
            return { "": "无URL参数" };
        }
        var q = window.location.search.substring(1).split("&");
        var returnValue = {};
        for (var i = 0; i < q.length; i++) {
            var temp = q[i].split("=");
            returnValue[temp[0]] = temp[1];
        }
        return returnValue;
    },

    changeDatePickerDate: function (datePickerId, days) {
        var dat = new Date().se
        var pk = $("#" + datePickerId);
        var newTimePoint = summerFresh.changeDate(pk.val(), days);
        pk.val(newTimePoint);
    },
    changeDate: function (date, days) {
        var date = date == "" ? new Date() : new Date(date);
        date.setDate(date.getDate() + days);
        var d = date.getDate();
        if (d < 10) {
            d = "0" + d;
        }
        var m = date.getMonth() + 1;
        if (m < 10) {
            m = "0" + m;
        }
        var newTimePoint = date.getFullYear() + "-" + m + "-" + d;//date.getDate();
        return newTimePoint;
    },
    showError: function (errorInfo, errorTitle) {
        errorTitle = errorTitle || "异常提示";
        summerFresh.showInfo(errorInfo, "close", "异常提示", 400, 200);
    },
    showSuccess: function (successInfo, successTitle) {
        successTitle = successTitle || "成功提示";
        summerFresh.showInfo(successInfo, "success", successTitle, 300, 200);
    },
    showConfirm: function (confirmTips, onOK, onCancel) {
        var randomId = new Date().valueOf();
        var okId = "ok" + randomId;
        var cancelId = "cancel" + randomId;
        var footerHtml = "<div class=\"alert-footer\"><input id=\"" + okId + "\" type=\"button\" value=\"确定\" class=\"btn btn-primary\"><input id=\"" + cancelId + "\" type=\"button\" value=\"取消\" class=\"btn\"></div>";
        summerFresh.showInfo(confirmTips, "help", "确认提示", 300, 200, footerHtml);

        if (onOK && typeof (onOK) == "function") {
            $(window.top.document).one("click", "#" + okId, function () {
                onOK();
                $.closeDialog();
            });
        }
        if (onCancel && typeof (onCancel) == "function") {
            $(window.top.document).one("click", "#" + cancelId, function () {
                onCancel();
                $.closeDialog();
            });
        }
    },
    showTips: function (tips, title, onClose) {
        title = title || "提示信息";
        summerFresh.showInfo(tips, "info", title, 300, 200);
    },
    showInfo: function (info, type, title, width, height, footerHtml) {
        width = width || 300;
        height = height || 200;
        footerHtml = footerHtml || "";
        var className = ""
        if (footerHtml == "") {
            className = "alert-dialog-nofooter";
        }
        var html = "<div class=\"alert-dialog  " + className + "\" style=\"width:" + width + "px; height:" + height + "px;\">";
        html += "<div class=\"alert-content\">";
        html += "  <div class=\"alert-header\">";
        html += "     <button type=\"button\" onclick=\" $.closeDialog();\" class=\"close\" title=\"关闭\"><span>×</span></button>";
        html += "     <h4 class=\"alert-title\">" + title + "</h4>";
        html += "  </div>";
        html += "  <div class=\"alert-body\">";
        html += "     <div class=\"alert-tips\">";
        html += "          <img src=\"/img/icon-" + type + ".png\" />";
        html += "          <span>" + info + "</span>";
        html += "     </div></div>" + footerHtml + "</div></div>";
        summerFresh.modal(html, width, height);
    },
    modal: function (html, width, height) {
        $.showModalDialogInner(html, true, function () { }, width, height);
    },
    showSelect: function (selectType, showType, targetValueId, targetTextId, isMultipleSelect, height, width) {
        var parameter = { id: targetValueId, text: targetTextId, multiple: isMultipleSelect };
        var selectUrl = "/Page/" + selectType;
        var e = $.Event('onBeforeSelect');
        var el = $("#" + targetValueId);
        el.trigger(e);
        if (e && e.Data) {
            parameter = $.extend(parameter, e.Data);
        }
        parameter.showType = showType;
        if (selectType.indexOf('DD') == 0) {
            selectUrl = "/Selector/DDSelector";
            parameter.DictionaryCode = selectType.substr(2);
        }
        selectUrl = summerFresh.buildUrl(selectUrl, parameter);
        if (showType.toLowerCase() == "modal") {
            $.showModalDialog({
                url: selectUrl, width: width, height: height, overlayClose: true, onClose: function (res) {
                    //summerFresh.setToElement(res, targetTextId, targetValueId);
                }
            });
        }
        else {
            //slideDown
            $div = $("#" + targetTextId + "-slide");
            $("div[id*='-slide']").hide();
            $targetTextControl = $("#" + targetTextId);
            if ($div.length > 0) {
                $div.remove();
            }
            $div = $("<div class='alert-box' id='" + targetTextId + "-slide' style='width:" + width + "px;height:" + height + "px;'><iframe width='100%' height='100%' src=''frameborder='0' scrolling='no' allowtransparency='true' ></div>");
            $div.find("iframe").attr("src", selectUrl);
            $("body").append($div[0]);
            $div.bind("click", function (e) {
                e.stopPropagation();
            });
            $("[TVBox]").bind("click", function (e) {
                e.stopPropagation();
            });
            $(document).bind("click", function (e) {
                if (e.target.id == targetTextId) return;
                $div.hide();
            });

            $div.attr("targetTextId", targetTextId);
            $div.attr("targetValueId", targetValueId);
            summerFresh.slideDown($targetTextControl, $div, 1);
        }
    },

    slideDown: function (source, target, offset) {
        offset = offset || 0;
        var sourcePosition = source.offset();
        var top = 0, left = 0;
        var top = sourcePosition.top + source.outerHeight() + offset;
        var left = sourcePosition.left;
        var isOverflow = (sourcePosition.left + target.outerWidth()) > $(window).width();
        while ((left + target.outerWidth()) > $(window).width() && left > 0) {
            left -= 50;
        }
        target.css({ 'position': 'absolute', 'left': left + 'px', 'top': top + 'px' }).show();
    },
    toolTip: function (source, target) { },
    /*
    buildUrl:根据url和传入的parameter，构建新的url
    url:url
    parameter:JSON参数
    addRandomCode:是否加随机数（防止JS请求过程中客户端缓存）
    示例：
    var url="/home/index";
    var parameter={id:3,name:'hello'};
    var s=summerFresh.buildUrl(url,parameter,true);
    执行后s="/home/index?id=3&name=hello&randomCode=198485938505";
    */
    buildUrl: function (url, parameter, addRandomCode) {
        addRandomCode = addRandomCode || false;
        if (parameter) {
            if (addRandomCode) {
                parameter.randomCode = new Date().valueOf();
            }
            var queryString = "";
            for (var attr in parameter) {
                if (attr == "") continue;
                var value = parameter[attr];
                if (queryString.length > 0) { queryString += "&"; }
                queryString += attr + "=" + encodeURI(value);
            }
            if (queryString.length > 0) {
                if (url.indexOf("?") >= 0) {
                    url = url + "&" + queryString;
                } else {
                    url = url + "?" + queryString;
                }
            }
        }
        if (url.indexOf('http://') < 0) {
            if (url.indexOf('/') != 0) {
                url = summerFresh.contextPath + "/" + url;
            }
            else {
                url = summerFresh.contextPath + url;
            }
        }
        return url;
    },
    widget: {
        initTree: function (cId, onFinish) {
            var setting = {
                view: {
                    showLine: true,
                    selectedMulti: false,
                    dblClickExpand: false
                },
                data: {
                    simpleData: {
                        enable: true
                    }
                },
                callback: {
                    onClick: function (e, treeId, node) {
                        try {
                            if (window.onTreeNodeClick) {
                                window.onTreeNodeClick(e, treeId, node);
                            }
                        } catch (ex) { }
                    },
                    onCheck: function (e, treeId, node) {
                        try {
                            if (window.onTreeNodeCheck) {
                                window.onTreeNodeCheck(e, treeId, node);
                            }
                        } catch (ex) { }
                    }
                }
            };
            $("div[widget='Tree']").each(function () {
                var treeId = $(this).attr("id");
                if (cId && typeof (cId) == "string") {
                    if (treeId != cId) return;
                }
                var showcheck = $(this).attr("showcheck");
                setting.check = { enable: showcheck == "true" };
                var async = {
                    enable: true,
                    url: "/Home/GetTreeNode",
                    autoParam: ["id=tree_node_id", "name=tree_node_name", "level=tree_node_level", "pId=tree_node_pId"],
                    otherParam: { "componentId": $(this).attr("componentId") },
                    dataFilter: function (treeId, parentNode, response) {
                        if (!response || !response.Data) return null;
                        if (response.Result) {
                            if (response.NoAuthority) {
                                alert(response.ErrorMessage);
                            }
                            else {
                                if (onFinish) {
                                    if (typeof (onFinish) == 'function') {
                                        onFinish(response.Data);
                                    }
                                    else {
                                        eval(onFinish);
                                    }
                                }
                                return response.Data;
                            }
                        }
                        else {
                            alert(response.ErrorMessage);
                        }
                    }
                };
                setting.async = async;

                var paraArr = [summerFresh.getQueryString(), summerFresh.widget.setting(treeId)];
                var ifExistInSetting = false;
                for (var arrI = 0; arrI < paraArr.length; arrI++) {
                    var urlParameter = paraArr[arrI];
                    for (var key in urlParameter) {
                        if (key == "") continue;
                        ifExistInSetting = false;
                        for (var sKey in setting.async.otherParam) {
                            if (sKey.toUpperCase() == key.toUpperCase()) {
                                ifExistInSetting = true;
                                break;
                            }
                        }
                        if (!ifExistInSetting) {
                            setting.async.otherParam[key] = urlParameter[key];
                        }
                    }
                }

                $.fn.zTree.init($("#" + treeId + "-ul"), setting);
            });
        },
        initPanel: function () {
            $("div[widget='Panel']").each(function (e) {
                var id = $(this).attr("id");
                $(this).find(".panels-body").outerHeight($(this).height() - $(this).find(".panels-heading").outerHeight() - $(this).find(".panels-footer").outerHeight());
            });
        },
        initChecklabel: function () {
            $("div[widget='checklabel'] .btn.btn-default").each(function (e) {
                $(this).click(function () {
                    var p = $(this).parent();
                    //p.find("a.active").removeClass("active");
                    p.find("a.btn-primary").removeClass("btn-primary");
                    $(this).addClass("btn-primary");
                    p.find("input[type='hidden']").val($(this).attr("value"));
                    if ($(this).closest("[widget]").attr("ChangeTiggerSearch") && $(this).closest("[widget]").attr("ChangeTiggerSearch").length > 0) {
                        $(this).closest("form").submit();
                    }
                    var onlabelClick = p.attr("onlabelclick");
                    if (onlabelClick && typeof (onlabelClick) == "string") {
                        eval("(" + onlabelClick + "(" + p.attr("id") + "," + p.find("a").index($(this)) + "))");
                    }
                });
            });
        },
        initEchart: function () {
            $("div[widget='Echarts']").each(function (e) {
                var container = $(this);

                var chartName = container.attr("ChartName");
                var chartType = container.attr("EChartType");
                var positionField = container.attr("PositionField");
                var seriesFieldNames = container.attr("SeriesFieldNames");
                //var color = container.attr("Color");
                var onClickListener = container.attr("onClickListener");
                var seriesType = container.attr("SeriesType");
                var chartInit = container.attr("ChartInit");
                var chartOptionFinishFunction = container.attr("ChartOptionFinishFunction");
                var chartConfig = {};
                var settting = summerFresh.widget.setting($(this).attr("id"));

                ///获取qu里面的参数
                var urlParameter = summerFresh.getQueryString();
                var ifExistInSetting = false;
                for (var key in urlParameter) {
                    if (key == "") continue;
                    ifExistInSetting = false;
                    for (var sKey in settting) {
                        if (sKey.toUpperCase() == key.toUpperCase()) {
                            ifExistInSetting = true;
                            break;
                        }
                    }
                    if (!ifExistInSetting) {
                        settting[key] = urlParameter[key];
                    }
                }

                settting.componentId = $(this).attr("componentId");
                if (chartInit) {
                    var initFun = eval("(" + chartInit + ")");
                    initFun(container[0], settting);
                    return;
                }
                summerFresh.dataService("/Home/GetChartData", settting, function (res) {

                    chartConfig = echartOptions[chartName + "Option"](container);
                    var seriesNameArr;

                    var concatArray = function (obj, value) {
                        if (chartType != "Map") {
                            var result = [];
                            for (var key in obj)
                                result.push(obj[key]);
                            result.push(value);
                            return result;
                        }
                        return value;
                    }

                    //生成Series名称，并从res按series提取数据
                    var seriesDataMapping;
                    if (seriesType == "ColumnNameAsSeries")//按列名分Series
                    {
                        seriesNameArr = seriesFieldNames.split(',');
                        seriesDataMapping = {};
                        for (var i = 0; i < res.length; i++) {
                            for (var keyIndex = 0; keyIndex < seriesNameArr.length; keyIndex++) {
                                if (!seriesDataMapping[seriesNameArr[keyIndex]])
                                    seriesDataMapping[seriesNameArr[keyIndex]] = [];
                                seriesDataMapping[seriesNameArr[keyIndex]].push({ name: res[i][positionField], value: concatArray(res[i], res[i][seriesNameArr[keyIndex]]) /*[res[i][seriesNameArr[keyIndex]]].concat(res[i])*/ });
                            }
                        }
                    }
                    else {
                        seriesDataMapping = {};
                        seriesNameArr = [];
                        seriesInfoArr = seriesFieldNames.split(',');
                        for (var i = 0; i < res.length; i++) {
                            if (seriesNameArr.indexOf(res[i][seriesInfoArr[0]]) == -1) {
                                seriesDataMapping[res[i][seriesInfoArr[0]]] = [];
                                seriesNameArr.push(res[i][seriesInfoArr[0]]);
                            }
                            seriesDataMapping[res[i][seriesInfoArr[0]]].push({ name: res[i][positionField], value: concatArray(res[i], res[i][seriesInfoArr[1]]) /*[res[i][seriesInfoArr[1]]].concat(res[i])*/ });
                        }
                    }

                    //按图表类型生成series并填入数据
                    chartConfig.legend.data = seriesNameArr;
                    seriesArry = [];
                    if (chartType == "Map") {


                        var seriesModel;
                        for (i = 0; i < chartConfig.series.length; i++) {
                            sm = chartConfig.series[i];
                            if (sm.type == "map") {
                                seriesModel = sm;
                                break;
                            }
                        }
                        for (ki = 0; ki < seriesNameArr.length; ki++) {
                            key = seriesNameArr[ki];
                            series = echartOptions.deepClone(seriesModel);
                            series.name = key;
                            series.data = seriesDataMapping[key];
                            seriesArry.push(series);
                        }
                        chartConfig.series = seriesArry;
                    }
                    else {
                        var seriesModel;
                        for (i = 0; i < chartConfig.series.length; i++) {
                            sm = chartConfig.series[i];
                            if (sm.type != "map") {
                                seriesModel = sm;
                                break;
                            }
                        }
                        for (ki = 0; ki < seriesNameArr.length; ki++) {
                            key = seriesNameArr[ki];
                            series = echartOptions.deepClone(seriesModel);
                            series.name = key;
                            series.type = chartType[0].toLowerCase() + chartType.substring(1);
                            if (seriesDataMapping[key]) {
                                for (i = 0; i < seriesDataMapping[key].length; i++) {
                                    dataItem = seriesDataMapping[key][i];
                                    dataItem.value = geoMapping[dataItem.name].concat(dataItem.value);
                                }
                                series.data = seriesDataMapping[key];
                                seriesArry.push(series);
                            }
                        }
                        chartConfig.series = seriesArry;
                    }

                    var myChart = echarts.init(container[0]);
                    if (onClickListener) {
                        myChart.on('mapselectchanged', eval("(" + onClickListener + ")"));
                    }
                    if (chartOptionFinishFunction) {
                        var func = eval("(" + chartOptionFinishFunction + ")");
                        func(chartConfig, res, container, myChart);
                    }
                    myChart.setOption(chartConfig);
                });
            });
        },
        initNewChart: function () {
            $("div[widget='NewChart']").each(function (e) {
                var getTickInterval = function (res, width) {
                    if (res.xAxis && res.xAxis.length > 0) {
                        if (res.Interval) {
                            res.xAxis[0].tickInterval = res.Interval;
                            return;
                        }
                        var axis = res.xAxis[0];
                        if (axis && axis.categories) {
                            var length = axis.categories.length;
                            var count = 10;
                            while (count * 120 > width) {
                                count = count / 2;
                            }
                            res.xAxis[0].tickInterval = Math.ceil(length / (count - 1));
                        }
                    }
                }
                var container = $(this);
                var chartInit = container.attr("ChartInit");
                var settting = summerFresh.widget.setting($(this).attr("id"));
                var height = container.attr("height");


                ///获取qu里面的参数
                var urlParameter = summerFresh.getQueryString();
                var ifExistInSetting = false;
                for (var key in urlParameter) {
                    if (key == "") continue;
                    ifExistInSetting = false;
                    for (var sKey in settting) {
                        if (sKey.toUpperCase() == key.toUpperCase()) {
                            ifExistInSetting = true;
                            break;
                        }
                    }
                    if (!ifExistInSetting) {
                        settting[key] = urlParameter[key];
                    }
                }
                settting.componentId = $(this).attr("componentId");
                if (chartInit) {
                    var initFun = eval("(" + chartInit + ")");
                    initFun(container[0], settting);
                    return;
                }
                summerFresh.dataService("/Home/GetChartOption", settting, function (chartOptions) {
                    var chartOptionArr = chartOptions;
                    var onDataItemBind = $(container).attr("OnDataItemBind");
                    var onSeriesFinish = $(container).attr("OnSeriesFinish");
                    var onChartOptionFinish = $(container).attr("OnChartOptionFinish");
                    var onLoad = $(container).attr("OnLoad");
                    $(container).children().remove();
                    var funResolver = function (obj) {
                        for (key in obj) {
                            if (!obj[key]) continue;
                            if ((typeof obj[key] == 'string') &&
                                obj[key].toString().indexOf("function:") > -1) {
                                obj[key] = eval(obj[key].toString().substr("function:".length));
                            }
                            if ((typeof obj[key] == 'object')) {
                                funResolver(obj[key]);
                            }
                        }
                    };
                    for (arrIndex = 0; arrIndex < chartOptionArr.length; arrIndex++) {
                        var res = chartOptionArr[arrIndex];
                        var datasourceDic = res.datasource;
                        funResolver(res);
                        res.datasource = undefined;
                        if (onDataItemBind && onDataItemBind.length > 0) {
                            var func = eval("(" + onDataItemBind + ")");
                            for (i = 0; i < res.series.length; i++) {
                                for (j = 0; j < res.series[i].data.length; j++) {
                                    func({
                                        seriesName: res.series[i].name,
                                        data: res.series[i].data,
                                        index: j,
                                        datasource: datasourceDic,
                                        group: res.groupby,
                                    });
                                }
                            }
                        }
                        if (onSeriesFinish && onSeriesFinish.length > 0) {
                            var func = eval("(" + onSeriesFinish + ")");
                            for (i = 0; i < res.series.length; i++) {
                                func({
                                    series: res.series[i],
                                    index: i,
                                    datasource: datasourceDic,
                                    group: res.groupby,
                                });
                            }
                        }
                        if (onChartOptionFinish && onChartOptionFinish.length > 0) {
                            var func = eval("(" + onChartOptionFinish + ")");
                            func({
                                chartOption: res,
                                datasource: datasourceDic,
                                group: res.groupby,
                            });
                        }
                        var loadEvent = undefined;
                        if (onLoad)
                            loadEvent = eval("(" + onLoad + ")");
                        getTickInterval(res, $(container).width());
                        $("<div id='" + res.chart.renderTo + "' style='width:98%;height:" + height + "px;'></div>").appendTo(container);
                        new Highcharts.Chart(res, loadEvent);
                    }
                });
            });
        },
        initChart: function (cId, onFinish) {
            $("div[widget='Chart']").each(function (e) {
                var container = $(this);
                if (cId && typeof (cId) == "string") {
                    if (container.attr("id") != cId) return;
                }
                var chartName = container.attr("ChartName");
                var height = container.attr("height");
                var title = container.attr("ChartTitle");
                var subTitle = container.attr("SubTitle");
                var chartFieldMappingType = container.attr("ChartFieldMappingType");
                var chartType = container.attr("ChartType");
                var xAxisName = container.attr("XAxisName");
                var groupBy = container.attr("groupBy");
                var colors = container.attr("Colors");
                var handleSeries = container.attr("SeriesNames");
                var yAxisIndexs = container.attr("YAxisIndexs");
                var dataItemBuildFunction = container.attr("DataItemBuildFunction");
                var chartOptionFinishFunction = container.attr("ChartOptionFinishFunction");
                var chartLoadFunction = container.attr("ChartLoadFunction");
                var chartInit = container.attr("ChartInit");
                var seriesHandleType = container.attr("SeriesHandleType");
                var chartConfig = {};
                var setting = summerFresh.widget.setting($(this).attr("id"));

                ///获取qu里面的参数
                var urlParameter = summerFresh.getQueryString();
                var ifExistInSetting = false;
                for (var key in urlParameter) {
                    if (key == "") continue;
                    ifExistInSetting = false;
                    for (var sKey in setting) {
                        if (sKey.toUpperCase() == key.toUpperCase()) {
                            ifExistInSetting = true;
                            break;
                        }
                    }
                    if (!ifExistInSetting) {
                        setting[key] = urlParameter[key];
                    }
                }

                setting.componentId = $(this).attr("componentId");
                if (chartInit) {
                    var initFun = eval("(" + chartInit + ")");
                    initFun(container[0], setting);
                    return;
                }
                summerFresh.dataService("/Home/GetChartData", setting, function (res) {
                    if (onFinish) {
                        if (typeof (onFinish) == 'function') {
                            onFinish(res);
                        }
                        else {
                            eval(onFinish);
                        }
                    }
                    $(container).children().remove();
                    if (res.length == 0) {
                        $("<div style='padding:20px 0px;color:red;text-align:center;'>暂无相关数据</div>").appendTo(container);
                        return;
                    }
                    var colorArr = colors ? colors.split(",") : [];
                    var yAxisIndexsArray = yAxisIndexs ? yAxisIndexs.split(",") : [];
                    var series1 = {};
                    var chartTypes = [];
                    if (chartType.indexOf(',') > 0) {
                        chartTypes = chartType.split(',');
                    }
                    var kk = 0;
                    if (chartType.indexOf("pie") > -1) {

                        var groupChartOption = {};
                        if (groupBy != '') {
                            container.html("");
                            var tempKey = "";
                            for (var l = 0; l < res.length; l++) {
                                tempKey = res[l][groupBy] + container.attr("id");
                                if (!groupChartOption[tempKey]) {
                                    groupChartOption[tempKey] = chartOptions[chartName + "Option"](container);
                                    groupChartOption[tempKey].series.push({ type: "pie", data: [] });

                                    if (title != '') {
                                        if (!groupChartOption[tempKey].title) {
                                            groupChartOption[tempKey].title = {};
                                        }
                                        groupChartOption[tempKey].title.text = summerFresh.modelViewBinder(res[l], title);
                                    }
                                    if (subTitle != '') {
                                        if (!groupChartOption[tempKey].subtitle) {
                                            groupChartOption[tempKey].subtitle = {};
                                        }
                                        groupChartOption[tempKey].subtitle.text = summerFresh.modelViewBinder(res[l], subTitle);
                                    }
                                }
                            }
                        }
                        else {
                            tempKey = "default" + container.attr("id");
                            groupChartOption[tempKey] = chartOptions[chartName + "Option"](container);
                            groupChartOption[tempKey].series.push({ type: "pie", data: [] });

                            if (title != '') {
                                if (!groupChartOption[tempKey].title) {
                                    groupChartOption[tempKey].title = {};
                                }
                                groupChartOption[tempKey].title.text = summerFresh.modelViewBinder(res[0], title);
                            }
                            if (subTitle != '') {
                                if (!groupChartOption[tempKey].subtitle) {
                                    groupChartOption[tempKey].subtitle = {};
                                }
                                groupChartOption[tempKey].subtitle.text = summerFresh.modelViewBinder(res[0], subTitle);
                            }
                        }

                        var chartConfig;
                        if (chartFieldMappingType == "RowAsX") {
                            for (var rowI = 0; rowI < res.length; rowI++) {

                                for (var series in res[rowI]) {
                                    if (series == groupBy) continue;
                                    var pieItem = { name: series, y: res[rowI][series] };
                                    chartConfig = groupBy && groupBy != '' ? groupChartOption[res[rowI][groupBy] + container.attr("id")] : groupChartOption["default" + container.attr("id")];
                                    if (colorArr[chartConfig.series[0].data.length])
                                        pieItem.color = colorArr[chartConfig.series[0].data.length];
                                    chartConfig.series[0].data.push(pieItem);
                                }
                            }
                        }

                        else if (chartFieldMappingType == "RowAsY") {

                            for (var i = 0; i < res.length; i++) {
                                var pieItem = { name: res[i]["Series"], y: res[i]["Value"] };
                                chartConfig = groupBy && groupBy != '' ? groupChartOption[res[i][group]] : groupChartOption["default" + container.attr("id")];
                                if (colorArr[chartConfig.series[0].data.length])
                                    pieItem.color = colorArr[chartConfig.series[0].data.length];
                                chartConfig.series[0].data.push(pieItem);
                                //kk++;
                            }
                        }
                        for (var key in groupChartOption) {
                            config = groupChartOption[key];
                            container.append("<div id='" + key + "' style='width:100%;height:" + height + "px;'></div>");
                            if (!config.chart)
                                config.chart = {};
                            config.chart.renderTo = key;
                            var loadEvent = undefined;
                            if (chartLoadFunction)
                                loadEvent = eval("(" + chartLoadFunction + ")");
                            if (chartOptionFinishFunction) {
                                var finishEvent = eval("(" + chartOptionFinishFunction + ")");
                                finishEvent(config, res, container);
                            }
                            new Highcharts.Chart(config, loadEvent);
                        }
                        //container.highcharts(chartConfig);
                    }
                    else {
                        //列名作为Series
                        if (chartFieldMappingType == "RowAsY") {
                            var group = {};
                            if (groupBy != '') {
                                container.html("");
                                var tempKey = "";
                                for (var l = 0; l < res.length; l++) {
                                    tempKey = res[l][groupBy] + container.attr("id");
                                    if (!group[tempKey]) {
                                        group[tempKey] = [];
                                    }
                                    group[tempKey].push(res[l]);
                                }
                            }
                            else {
                                group["default" + container.attr("id")] = res;
                            }
                            for (var key in group) {
                                res = group[key];
                                var config = chartOptions[chartName + "Option"](container);
                                if (title != '') {
                                    if (!config.title) {
                                        config.title = {};
                                    }
                                    config.title.text = summerFresh.modelViewBinder(res[0], title);
                                }
                                if (subTitle != '') {
                                    if (!config.subtitle) {
                                        config.subtitle = {};
                                    }
                                    config.subtitle.text = summerFresh.modelViewBinder(res[0], subTitle);
                                }
                                var gSeries = {};
                                kk = 0;
                                for (var i in res[0]) {
                                    if (seriesHandleType == "Contain") {
                                        if (handleSeries && handleSeries.length > 0 && handleSeries.indexOf("," + i + ",") == -1)
                                            continue;
                                    }
                                    else if (seriesHandleType == "Except") {
                                        if (handleSeries && handleSeries.indexOf("," + i + ",") != -1)
                                            continue;
                                    }
                                    if (i != xAxisName && i != groupBy) {
                                        gSeries[i] = { name: i, data: [] };
                                        if (colorArr[kk])
                                            gSeries[i].color = colorArr[kk];
                                        if (yAxisIndexsArray[kk] > 0)
                                            gSeries[i].yAxis = parseInt(yAxisIndexsArray[kk]);
                                        if (chartTypes.length > 0) {
                                            gSeries[i].type = chartTypes[kk];
                                        }
                                        else {
                                            gSeries[i].type = chartType;
                                        }
                                        kk++;
                                    }
                                }
                                for (var i = 0; i < res.length; i++) {
                                    config.xAxis.categories.push(res[i][xAxisName]);
                                    for (var j in res[i]) {

                                        if (seriesHandleType == "Contain") {
                                            if (handleSeries && handleSeries.length > 0 && handleSeries.indexOf("," + j + ",") == -1)
                                                continue;
                                        }
                                        else if (seriesHandleType == "Except") {
                                            if (handleSeries && handleSeries.indexOf("," + j + ",") != -1)
                                                continue;
                                        }
                                        if (j != xAxisName && j != groupBy) {
                                            if (dataItemBuildFunction) {
                                                var callbackFunc = eval("(" + dataItemBuildFunction + ")");
                                                gSeries[j].data.push(callbackFunc(j, res[i]));
                                            }
                                            else
                                                gSeries[j].data.push(res[i][j]);
                                        }
                                    }
                                }
                                for (var d in gSeries) {
                                    config.series.push(gSeries[d]);
                                }
                                container.append("<div id='" + key + "' style='width:100%;height:" + height + "px;'></div>");
                                if (!config.chart)
                                    config.chart = {};
                                config.chart.renderTo = key;
                                var loadEvent = undefined;
                                if (chartLoadFunction)
                                    loadEvent = eval("(" + chartLoadFunction + ")");
                                if (chartOptionFinishFunction) {
                                    var finishEvent = eval("(" + chartOptionFinishFunction + ")");
                                    finishEvent(config, res, container);
                                }
                                new Highcharts.Chart(config, loadEvent);
                            }
                        }
                        else if (chartFieldMappingType == "RowAsX") {
                            var j = 0;
                            chartConfig = chartOptions[chartName + "Option"](container);
                            for (var p in res[0]) {
                                if (j++ != xAxisName) continue;
                                for (var i = 0; i < res.length; i++) {
                                    series1[i] = { name: res[i][p], data: [] };
                                    if (chartTypes.length > 0) {
                                        series1[i].type = chartTypes[kk++];
                                    }
                                    else {
                                        series1[i].type = chartType;
                                    }
                                }
                                break;
                            }
                            j = 0;
                            for (var p in res[0]) {
                                if (j++ == xAxisName) continue;
                                chartConfig.xAxis.categories.push(p);
                                for (var i = 0; i < res.length; i++) {
                                    series1[i].data.push(res[i][p]);
                                }

                            }
                            for (var d in series1) {
                                chartConfig.series.push(series1[d]);
                            }
                            container.highcharts(chartConfig);
                        }
                    }
                }, "post", true);
            });
        },
        initPager: function () {
            $("body").on("click", "div[widget='Pager']", function (e) {
                var src = e.target;
                if (src.tagName.toLowerCase() != 'a') return;
                var a = $(src);
                var idArray = a.closest("[targetId]").attr("targetId").split(',');
                for (var i = 0; i < idArray.length; i++) {
                    var tableId = idArray[i];
                    var setting = summerFresh.widget.setting(tableId);
                    if (a.attr("pageIndex")) {
                        var pageCount = parseInt(a.closest("[pageCount]").attr("pageCount"));
                        var pageIndex = a.attr("pageIndex");
                        if (pageIndex == 'Pre') {
                            if (setting.pageIndex > 1) {
                                setting.pageIndex--;
                            }
                            else {
                                return false;
                            }
                        }
                        else if (pageIndex == 'Next') {
                            if (setting.pageIndex >= pageCount) {
                                return false;
                            }
                            else {
                                setting.pageIndex++;
                            }
                        }
                        else {
                            setting.pageIndex = pageIndex;
                        }
                        summerFresh.widget.refresh(tableId);

                    }
                    if (a.attr("pageSize")) {
                        setting.pageIndex = 1;
                        setting.pageSize = a.attr("pageSize");
                        summerFresh.widget.refresh(tableId);
                    }
                }
            });
        },
        initForm: function () {
            try {
                $("[defaultForm]").validation();
            } catch (e) { }
            $("body").on("submit", "[defaultForm]", function (e) {
                var _this = e.target;
                try {
                    if ($.validation) {
                        var validateInfo = $.validation.validate(_this);
                        if (validateInfo.isError) {
                            var ee = $.Event("form.validateError", validateInfo);
                            $(_this).trigger(ee);
                            return false;
                        }
                    }
                } catch (ex) {
                    console.log(ex);
                }
                var form = $(_this);
                form.find("[disabled]").removeAttr("disabled");
                var post = form.serialize() + "&componentId=" + form.closest("[widget]").attr("componentId");
                summerFresh.dataService(form.attr("action"), post, function (res) {
                    try {
                        if (window.onFormPostSuccess) {
                            window.onFormPostSuccess(form, res);
                        }
                        else {
                            if (window.top && window.top.onDialogClose && window.top.onDialogClose.length > 0) {
                                window.top.onDialogClose.pop()(res);
                            }
                        }
                    } catch (e) { }
                });
                return false;
            });
        },
        initSearch: function () {
            $("[searchForm]").on("click", "#btnExport", function (e) {
                var form = $(e.target).closest("form");
                var search = form.closest("div[Widget='Search']");
                var tableId = search.attr("targetId");
                var table = $("#" + tableId);
                if (table.children("th").length === 0)
                    return;
                var e = $.Event("beforeExport");
                table.trigger(e);
                var param = { id: table.attr("componentId") };
                param = $.extend({}, param, summerFresh.widget.setting(tableId));
                if (e && e.data) {
                    param = $.extend({}, param, e.data);
                }
                var url = summerFresh.buildUrl("/Entity/ExportToExcel", param);
                form.attr("action", url);
                form.attr("actionType", "Export");
                form.submit();
            });
            $("body").on("submit", "[searchForm]", function (e) {
                var f = $(e.target);
                if (f.attr("action") && f.attr("action").indexOf('/Entity/ExportToExcel') >= 0 && f.attr("actionType") == "Export") {
                    f.attr("actionType", "Search");
                    return true;
                }
                var idArray = $(e.target).parent().attr("targetId").split(',');
                for (var i = 0; i < idArray.length; i++) {
                    var tableId = idArray[i];
                    var tableContext = summerFresh.widget.setting(tableId);
                    tableContext.pageIndex = 1;
                    var form = $(e.target).serialize();
                    if (form != '') {
                        var formCollection = form.split('&');
                        if (formCollection.length > 0) {
                            var newPara = {};
                            for (var k = 0; k < formCollection.length; k++) {
                                if (formCollection[k] != '' && formCollection[k].indexOf('=') > 0) {
                                    var kv = formCollection[k].split('=');
                                    if (newPara[kv[0]]) {
                                        newPara[kv[0]] += "," + decodeURI(kv[1]);
                                    }
                                    else {
                                        newPara[kv[0]] = decodeURI(kv[1]);
                                    }
                                }
                            }
                            for (var key in newPara) {
                                tableContext[key] = newPara[key];
                            }
                        }
                    }
                    summerFresh.widget.refresh(tableId);
                }
                return false;
            });
        },
        initRelateControl: function () {
            $("body").on("change", "[ChildrenControls]", function (e) {
                var p = $(e.target);
                var targetIds = p.attr("ChildrenControls").split(',');
                for (var id in targetIds) {
                    if (targetIds[id] && targetIds[id].length > 0) {
                        var curTargetId = targetIds[id];
                        if ($("#" + curTargetId).is("input[type='hidden']")) {
                            //判定为点选框
                            var eventStr = $("#" + curTargetId + "_Text").attr("onclick");
                            var sI = eventStr.indexOf('\'');
                            var eI = eventStr.indexOf('\'', sI + 1);
                            var url = eventStr.substr(sI, eI - sI);
                            if (url.indexOf(p.attr("id")) != -1) {
                                var reg = new RegExp(p.attr("id") + "=.*?[& ]?$");
                                url = url.replace(reg, p.attr("id") + "=" + p.val());
                            }
                            else {
                                url = url + "?" + p.attr("id") + "=" + p.val();
                            }
                            eventStr = eventStr.substr(0, sI) + url + eventStr.substr(eI);
                            $("#" + curTargetId + "_Text").attr("onclick", eventStr);
                            $("#" + curTargetId + "_Text").val("");
                            $("#" + curTargetId).val("");
                        }
                        else {
                            var setting = summerFresh.widget.setting(curTargetId);
                            setting[p.attr("id")] = p.val();
                            $("#" + curTargetId).attr("relateRefresh", true);
                            summerFresh.widget.refresh(curTargetId);
                        }
                    }
                }
            });
        },
        initTabCondition: function () {
            $("body").on("click", "div[widget='TabCondition']", function (e) {
                var span = $(e.target);
                if (!span.is("span")) {
                    span = span.closest("span");
                    if (!span || !span.attr("key") || span.attr("key") == '') {
                        return;
                    }
                }
                var div = span.closest("div");
                var targetId = div.attr("targetId");
                var idArray = targetId.split(',');
                for (var i = 0; i < idArray.length; i++) {
                    var tableId = idArray[i];
                    var searchField = div.attr("SearchField");
                    var key = span.attr("key");
                    var currentSelected = div.children(".tab-item-selected");
                    if (currentSelected.length != 0) {
                        currentSelected.removeClass("tab-item-selected");
                    }
                    span.addClass("tab-item-selected");
                    var setting = summerFresh.widget.setting(tableId);
                    setting[searchField] = key;
                    summerFresh.widget.refresh(tableId);
                }
            });
        },
        initTab: function () {
            $("body").on("click", "div[widget='Tab']", function (e) {
                var span = $(e.target);
                if (!span.is("span")) {
                    span = span.closest("span");
                    if (!span || !span.attr("key") || span.attr("key") == '') {
                        return;
                    }
                }
                var div = $("div[tabItem='" + span.attr("key") + "']");
                if (div.attr("contentId") && !div.attr("loaded")) {
                    var contentIds = div.attr("contentId").split('|');
                    for (var k = 0; k < contentIds.length; k++) {
                        var contentId = contentIds[k];
                        summerFresh.dataService("/Page/Component/" + contentId, {}, function (res) {
                            div.append(res);
                            div.attr("loaded", "true");
                            if ($(res).attr("widget") == 'Chart') {
                                summerFresh.widget.initChart();
                            }
                            if ($(res).attr("widget") == 'Tree') {
                                summerFresh.widget.initTree();
                            }
                            if ($(res).attr("widget") == "NewChart") {
                                summerFresh.widget.initNewChart();
                            }
                            summerFresh.widget.autoHeight();
                        });
                    }
                }
                try {
                    if (window.onTabItemClick) {
                        var res = window.onTabItemClick(span, div);
                        if (res === false) {
                            return;
                        }
                    }
                } catch (e) { }
                var iframe = div.find("iframe");
                if (iframe.length > 0 && iframe.attr("src") == '') {
                    iframe.attr("src", div.attr("src1"));
                }
                span.closest("[widget]").find("[tabItem]").hide();
                var currentSelected = span.parent().children(".tab-item-selected");
                if (currentSelected.length != 0) {
                    currentSelected.removeClass("tab-item-selected");
                }
                div.show();
                span.addClass("tab-item-selected");
            });
            $("div[widget='Tab']").each(function () {
                var index = parseInt($(this).attr("initIndex")) || 0;
                $(this).find(".tab-item").eq(index).click();
            });
        },
        initToolbar: function () {
            $("body").on("click", "div[widget='Toolbar']", function (e) {
                var src = e.target;
                var _this = $(this);
                if (src.tagName.toLowerCase() != 'input') return;

                var input = $(src);
                if (input.attr("onclick")) return;
                var id = input.attr("id");
                var tableId = _this.attr("targetId");
                if (tableId && tableId != '') {
                    var table = $("#" + tableId);
                    var insertUrl = table.attr("InsertUrl");
                    var editUrl = table.attr("EditUrl");
                    var deleteUrl = table.attr("DeleteUrl");
                    var param = summerFresh.getQueryString();
                    param.FormViewMode = 'Insert';
                    insertUrl = summerFresh.buildUrl(insertUrl, param, true);
                    switch (id) {
                        case "btnInsert":
                            $.showModalDialog({
                                url: insertUrl,
                                onClose: function (res) {
                                    if (res != 'false') {
                                        summerFresh.widget.refresh(tableId);
                                        if (window.onChangedTableData) {
                                            window.onChangedTableData();
                                        }
                                    }
                                },
                                width: 900,
                                height: 500,
                                title: '新增',
                                overlayClose: true
                            });
                            break;
                        case "btnBatchDelete":
                            var ids = [];
                            var keyValue = {};
                            var key = "";
                            table.find(":checked").not("[checkAll]").each(function () {
                                var tr = $(this).closest("tr");
                                if (key == "") {
                                    keyValue.componentId = table.attr("componentId");
                                    key = tr.attr("data-key");
                                }
                                eval("var data = " + tr.attr("data"));
                                var id = data[key];
                                if (id && id != '') {
                                    ids.push(id);
                                }
                            });
                            if (ids.length == 0) {
                                summerFresh.showError('请选择要删除的记录！');
                                return;
                            }
                            else {
                                summerFresh.showConfirm("确认要删除选中的" + ids.length + "条记录吗？", function () {

                                    if (key.toLowerCase() == "componentid") {
                                        key = "id";
                                    }
                                    keyValue[key] = ids.join(',');
                                    if (!keyValue.hasOwnProperty("id")) {
                                        keyValue.id = keyValue[key];
                                    }
                                    summerFresh.dataService(deleteUrl, keyValue, function (res) {
                                        if (res) {
                                            if (ids.length == $("#" + tableId + " tbody tr").length) {
                                                var setting = summerFresh.widget.setting(tableId);
                                                if (setting.pageIndex > 0) {
                                                    setting.pageIndex--;
                                                }
                                            }
                                            summerFresh.widget.refresh(tableId);
                                        }
                                    });
                                }, function () {
                                    $.closeDialog();
                                });
                            }
                            break;
                        case "btnExportExcel":
                            window.open("/Entity/ExportToExcel?id=" + table.attr("componentId"));
                            break;
                        default:
                            try {
                                if (window.onToolbarClick) {
                                    window.onToolbarClick(_this, input);
                                }
                            } catch (e) { }
                            break;
                    }
                }
            });
        },
        initTable: function () {
            $("body").on("click", "[checkAll]", function () {
                var allCk = $(this).closest("table").find("input[type='checkbox']").not("[checkAll]");
                var checked = this.checked;
                allCk.each(function () {
                    this.checked = checked;
                });
            });
            $("body").on("click", "div[widget='Table']", function (e) {
                var src = e.target;
                var table = $(this);
                var tableId = table.attr("id");
                if (src.tagName.toLowerCase() != 'a') return;
                var a = $(src);
                if (a.attr("sortField")) {
                    field = a.attr("sortField");
                    var tableContext = summerFresh.widget.setting(tableId);
                    var exp = tableContext.sortExpression;
                    if (exp == "") {
                        exp = field + " asc";
                    }
                    else {
                        if (exp.indexOf(field) >= 0) {
                            if (exp.indexOf(field + " asc") >= 0) {
                                exp = field + " desc," + exp.replace(field + " asc", "");
                            }
                            else {
                                exp = field + " asc," + exp.replace(field + " desc", "");
                            }
                            exp = exp.replace(",,", ",").replace(/(^\,)|(\,$)/g, '');
                        }
                        else {
                            exp = field + " asc," + exp;
                        }
                    }
                    tableContext.sortExpression = exp;
                    tableContext.pageIndex = 1;
                    summerFresh.widget.refresh(tableId);
                }
                if (a.attr("trButton") && !a.attr("onclick")) {
                    var id = a.attr("trButton");
                    var editUrl = table.attr("EditUrl");
                    var deleteUrl = table.attr("DeleteUrl");
                    var tr = a.closest("tr");
                    var key = tr.attr("data-key");
                    var componentId = a.closest("[widget]").attr("componentId");
                    eval("var data = " + tr.attr("data"));
                    var keyValue = { id: data[key], componentId: componentId, FormViewMode: 'Edit' };
                    if (key.toLowerCase() != 'id') {
                        keyValue[key] = data[key];
                    }
                    switch (id) {
                        case "btnEdit":
                            $.showModalDialog({
                                url: summerFresh.buildUrl(editUrl, keyValue, true),
                                overlayClose: true,
                                onClose: function (res) {
                                    if (res != 'false') {
                                        summerFresh.widget.refresh(tableId);
                                        if (window.onChangedTableData) {
                                            window.onChangedTableData();
                                        }
                                    }
                                },
                                title: '编辑',
                                width: 800,
                                height: 500
                            });
                            break;
                        case "btnDelete":
                            summerFresh.showConfirm("确认要删除当前选中的记录吗？", function () {

                                summerFresh.dataService(deleteUrl, keyValue, function (res) {
                                    if (res) {
                                        if (1 == $("#" + tableId + " tbody tr").length) {
                                            var setting = summerFresh.widget.setting(tableId);
                                            if (setting.pageIndex > 0) {
                                                setting.pageIndex--;
                                            }
                                        }

                                        summerFresh.widget.refresh(tableId);
                                        if (window.onChangedTableData) {
                                            window.onChangedTableData();
                                        }
                                    }
                                });
                            }, function () {
                                $.closeDialog();
                            });
                            break;
                        default:
                            try {
                                if (window.onTableButtonClick) {
                                    window.onTableButtonClick(tableId, id);
                                }
                            } catch (e) { }
                            break;
                    }
                }

            });
        },
        initCalendar: function () {
            var container = $("div[widget='Calendar']");
            if (container.length > 0) {
                var leftContent = container.attr("left");
                var centerContent = container.attr("center");
                var rightContent = container.attr("right");

                ///获取qu里面的参数
                var setting = summerFresh.widget.setting(container.attr("id"));
                var urlParameter = summerFresh.getQueryString();
                var ifExistInSetting = false;
                for (var key in urlParameter) {
                    if (key == "") continue;
                    ifExistInSetting = false;
                    for (var sKey in setting) {
                        if (sKey.toUpperCase() == key.toUpperCase()) {
                            ifExistInSetting = true;
                            break;
                        }
                    }
                    if (!ifExistInSetting) {
                        setting[key] = urlParameter[key];
                    }
                }

                setting.componentId = container.attr("componentId");
                summerFresh.dataService("/Home/GetChartData", setting, function (res) {
                    var listHeight = $(window).height() - $("#ApprovalSummarySearch").height() - 50;
                    container.fullCalendar('destroy');
                    container.fullCalendar({
                        header: {
                            left: leftContent,
                            center: centerContent,
                            right: rightContent
                        },
                        contentHeight: listHeight,
                        lang: "zh-cn",
                        events: res,
                        defaultDate: res[0]['start'],
                    });
                });
            }
        },
        refresh: function (id, onFinish,onBefore) {
            var setting = summerFresh.widget.setting(id);
            var urlParameter = summerFresh.getQueryString();
            var ifExistInSetting = false;
            for (var key in urlParameter) {
                if (key == "") continue;
                ifExistInSetting = false;
                for (var sKey in setting) {
                    if (sKey.toUpperCase() == key.toUpperCase()) {
                        ifExistInSetting = true;
                        break;
                    }
                }
                if (!ifExistInSetting) {
                    setting[key] = urlParameter[key];
                }
            }
            var target = $("#" + id);
            if (target.is("select") || target.attr("relateRefresh")) {
                var componentId = target.closest("[widget]").attr("componentId") || target.closest("[widget]").attr("id");
                setting.childrenId = id;
                setting.componentId = componentId;
                summerFresh.dataService("/Page/Component/" + componentId, setting, function (res) {
                    target.before(res).remove();
                });
            }
            if (!target.attr("widget") || target.attr("widget") == '') return;
            if (!onFinish) {
                if (target.attr("onFinish") && target.attr("onFinish") != '') {
                    onFinish = target.attr("onFinish");
                }
            }
            if (target.attr("widget") == "Table" || target.attr("widget") == "Repeater") {
                if (target.hasClass("nosubmit")) return;
                var componentId = target.attr("componentId") || target.attr("id");
                var widget = target.attr("widget");
                setting.widget = widget;
                setting.componentId = componentId;
                summerFresh.dataService("/Page/Component/" + componentId, setting, function (res) {
                    target.before(res).remove();
                    summerFresh.widget.autoHeight();
                    if (onFinish) {
                        if (typeof (onFinish) == 'function') {
                            onFinish();
                        } else {
                            eval(onFinish);
                        }
                    }
                });
            }
            if (target.attr("widget") == "Chart") {
                summerFresh.widget.initChart(id, onFinish);
            }
            if (target.attr("widget") == "Tree") {
                summerFresh.widget.initTree(id, onFinish);
            }
            if (target.attr("widget") == "Echarts") {
                summerFresh.widget.initEchart();
            }
            if (target.attr("widget") == "NewChart") {
                summerFresh.widget.initNewChart();
            }
            if (target.attr("widget") == "Calendar") {
                summerFresh.widget.initCalendar();
            }
        },
        setting: function (id) {
            var prefix = "widget-setting-";
            if (!$("body").data(prefix + id)) {
                $("body").data(prefix + id, { pageIndex: 1, sortExpression: '' });
            }
            return $("body").data(prefix + id);
        },
        widgetInit: function () {
            return {
                pager: { init: summerFresh.widget.initPager, isInit: false },
                search: { init: summerFresh.widget.initSearch, isInit: false },
                toolbar: { init: summerFresh.widget.initToolbar, isInit: false },
                table: { init: summerFresh.widget.initTable, isInit: false },
                chart: { init: summerFresh.widget.initChart, isInit: false },
                tab: { init: summerFresh.widget.initTab, isInit: false },
                form: { init: summerFresh.widget.initForm, isInit: false },
                tree: { init: summerFresh.widget.initTree, isInit: false },
                panel: { init: summerFresh.widget.initPanel, isInit: false },
                checklabel: { init: summerFresh.widget.initChecklabel, isInit: false },
                tabCondition: { init: summerFresh.widget.initTabCondition, isInit: false },
                echart: { init: summerFresh.widget.initEchart, isInit: false },
                relateControl: { init: summerFresh.widget.initRelateControl, isInit: false },
                newChart: { init: summerFresh.widget.initNewChart, isInit: false },
                calendar: { init: summerFresh.widget.initCalendar, isInit: false }
            }
        },
        init: function () {
            if (!window.widgetArray) {
                window.widgetArray = summerFresh.widget.widgetInit();
            }
            for (var key in window.widgetArray) {
                var widget = window.widgetArray[key];
                if (widget && !widget.isInit) {
                    widget.init();
                    widget.isInit = true;
                }
            }
            summerFresh.widget.autoHeight();
            $(window).bind("resize", summerFresh.widget.autoHeight);
            $(document).ajaxStart($.blockUI).ajaxStop($.unblockUI);
        },
        autoHeight: function () {
            var listHeight = $(window).height();
            var offset = 20;
            if ($("[autoHeight]").length > 0) {
                if ($("[autoHeight]").attr("autoHeightOffset").length > 0) {
                    offset += parseInt($("[autoHeight]").attr("autoHeightOffset"));
                }
                $("[autoHeight]").siblings().each(function () {
                    listHeight -= ($(this).outerHeight());
                });
                listHeight -= offset;
                $("[autoHeight]").css("height", listHeight).css("overflow-y", "auto");
            }
        },
        design: function () {
            $("[layout]").each(function () {
                var urlParam = summerFresh.getQueryString();
                var pageId = urlParam.PageId;
                var parentName = urlParam.parentName;
                var layout = $(this);
                if (layout.find(".add-component").length == 0) {
                    $("<div class='add-component' style='margin:10px;padding:10px;cursor:pointer;background-color:#EEE;border:1px solid #CCC;font-size:14px;font-weight:bold;text-align:center;'>添加组件</div>").appendTo(layout).bind("click", function () {
                        $.showModalDialog({ title: '添加页面组件', url: '/PageDesigner/ComponentList?parentName=' + parentName + '&FormViewMode=Insert&ParentId=' + pageId + '&PageId=' + pageId + '&baseType=SummerFresh.Controls.PageControlBase&targetId=' + layout.attr("layout"), overlayClose: true, width: 1100, height: 650, onClose: function (res) { window.location.href = window.location.href; } });
                    });
                }
            });
            var initWidgetDesign = function (_this) {
                var widget = $(_this);
                var componentId = widget.attr("componentId");
                if (!componentId) return;
                widget.css("border", "1px dashed red");
                if (widget.children("[daction]").length == 0) {
                    $("<span daction='edit' style='margin:5px;padding:5px;cursor:pointer;background-color:#FFF;border:1px dashed red;font-size:14px;font-weight:bold;color:red;'>编辑</span>").appendTo(widget).bind("click", function () {
                        $.showModalDialog({ url: "/PageDesigner/ComponentEditor?componentId=" + componentId, width: 1100, height: 650, overlayClose: true, onClose: function (res) { window.location.href = window.location.href; } });
                    });
                    $("<span daction='delete' style='padding:5px;cursor:pointer;background-color:#FFF;border:1px dashed red;font-size:14px;font-weight:bold;color:red;'>删除</span>").appendTo(widget).bind("click", function () {
                        if (confirm("确定删除该组件?")) {
                            summerFresh.dataService("/PageDesigner/ComponentDelete/", { componentId: componentId }, function (res) {
                                if (res) {
                                    widget.remove();
                                }
                            }, "post", true);
                        }
                    });
                }
            }
            $("[widget]").each(function () {
                initWidgetDesign(this);
            });
            $(document).on("mouseover", "[widget]", function () {
                initWidgetDesign(this);
            });
        },     
    },
dateFormat: function (dt, format) {
        var newDt = new Date(dt.replace("-", "/"));
        var o = {
            "M+": newDt.getMonth() + 1, //month 
            "d+": newDt.getDate(), //day 
            "h+": newDt.getHours(), //hour 
            "m+": newDt.getMinutes(), //minute 
            "s+": newDt.getSeconds(), //second 
            "q+": Math.floor((newDt.getMonth() + 3) / 3), //quarter 
            "S": newDt.getMilliseconds() //millisecond 
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (newDt.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    }
}