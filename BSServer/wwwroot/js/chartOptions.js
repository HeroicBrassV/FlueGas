var tempCommonArray = new Array();//配置使用的临时变量
$(function () {
    Highcharts.getOptions().colors = Highcharts.map(Highcharts.getOptions().colors, function (color) {
        return {
            radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
            stops: [
                [0, color],
                [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
            ]
        };
    });
    Highcharts.setOptions({
        lang: {
            printChart: "打印图表",
            downloadJPEG: "下载JPEG 图片",
            downloadPDF: "下载PDF文档",
            downloadPNG: "下载PNG 图片",
            downloadSVG: "下载SVG 矢量图",
            exportButtonTitle: "导出图片"
        }
    });
});
var chartOptions =
{
    defaultOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            xAxis: { categories: [] },
            series: [],
            credits: { enabled: false },
        };
    },

    nonTitleOption: function (container) {
        return {
            title: { text: "" },
            xAxis: { categories: [] },
            series: [],
            credits: { enabled: false },
        };
    },

    realtimeNetworkOption: function (container) {
        return {
            chart: { height: 300 },
            colors: ['#50B432', '#FF0000'],
            title: { text: "" },
            xAxis: { categories: [] },
            series: [],
            credits: { enabled: false },
            tooltip: {
                useHTML: true,
                headerFormat: '<table>',
                pointFormat: '<tr><td > <b>{point.name}:</b>' + '{point.percentage:.1f}%（{point.y:.0f}个）</td></tr>',
                footerFormat: '</table>',
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        color: '#000000',
                        connectorColor: '#000000',
                        formatter: function () {
                            if (this.percentage > 0)
                                return '<b>' + this.point.name + '</b>: ' + Highcharts.numberFormat(this.percentage, 1) + '% (' +
                                    Highcharts.numberFormat(this.y, 0, ',') + '个)';
                        }
                    },
                    showInLegend: true
                }
            },
        };
    },

    homeIndexDataRateOption: function (container) {
        return {
            chart: {
                height: 300,
                //width: 500
            },
            title: { text: "" },
            xAxis: { categories: [] },
            series: [],
            credits: { enabled: false },
            tooltip: {
                useHTML: true,
                headerFormat: '{point.key}:{point.y:.1f}%<table>',
                pointFormat: '<tr><td ></td></tr>',
                footerFormat: '</table>',
            },
            plotOptions: {
                column: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: false,
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    text: ''
                }
            },
            //lang: {
            //    noData: "无数据"
            //},
            //noData: {
            //    style: {
            //        fontWeight: 'bold',
            //        fontSize: '15px',
            //        color: '#303030'
            //    }
            //}
        };
    },

    homeindexAUDOption: function (container) {
        return {
            chart: {
                height: 320,
                //width: 500
            },
            colors: ['#3CA9C4', '#808080', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263', '#6AF9C4'],
            title: { text: "" },
            xAxis: { categories: [] },
            series: [],
            credits: { enabled: false },
            tooltip: {
                useHTML: true,
                headerFormat: '{series.name}:{point.y:.1f}%<table>',
                pointFormat: '<tr><td ></td></tr>',
                footerFormat: '</table>',
            },
            legend: {
                padding: -10
            },
            plotOptions: {
                column: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: true,
                    pointPadding: 0.2,
                    borderWidth: 0,
                    stacking: 'percent'
                }
            },
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    text: ''
                }
            }
        };
    },

    StationLiveDataChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            xAxis: { categories: [], tickInterval: 3 },
            yAxis: [
                {
                    // Primary yAxis
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#89A54E' }
                    },
                    title: {
                        text: '其他污染物单位:μg/m3',
                        style: { color: '#89A54E' }
                    }
                },
                {
                    // Secondary yAxis
                    //gridLineWidth: 0,
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#4572A7' }
                    },
                    title: {
                        text: 'CO单位:mg/m3',
                        style: { color: '#4572A7' }
                    },
                    opposite: true
                }
            ],
            series: [],
            credits: { enabled: false },
        };
    },

    insStatusChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            xAxis: { categories: [], tickInterval: 3 },
            series: [],
            credits: { enabled: false },
        };
    },

    //图形分析应用到的图表类型
    //树状图
    columnChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            colors: ["#F4B300", "#78BA00", "#2673EC", "#AE113D", "#691BB8", "#AA40FF", "#BB1B6C", "#00A4A4"],
            xAxis: { categories: [], tickInterval: 1 },
            yAxis: [
                {
                    // Primary yAxis
                    labels: {
                        formatter: function () { return this.value + "天"; },
                        style: { color: "#89A54E" }
                    },
                    title: {
                        text: "天",
                        style: { color: "#89A54E" }
                    },
                    //stackLabels: {
                    //    enabled: true,
                    //    style: {
                    //        fontWeight: 'bold',
                    //        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    //    }
                    //}
                },
            ],
            plotOptions: {
                column: {
                    stacking: 'normal',
                }
            },
            tooltip: {
                formatter: function () {
                    if (typeof (tempCommonArray) != "undefined" && tempCommonArray != null && tempCommonArray.length > 0) {

                        var curItem = this.x.match(/\d+/g);
                        var mouthString = curItem[1];
                        var firstString = mouthString.substring(0, 1);
                        var mouth;
                        if (firstString === "0") {
                            mouth = mouthString.substring(1);
                        } else {
                            mouth = mouthString;
                        }
                        var valueAqi = tempCommonArray[mouth - 1];
                        if (valueAqi !== "" && valueAqi != null)
                            return '<b>' + this.x + '</b><br/>' + this.series.name + ': ' + this.y + '天<br/>' + '有效天数: ' + valueAqi + '天';
                        return '<b>' + this.x + '</b><br/>' + this.series.name + ': ' + this.y + '天<br/>' + '有效天数: ' + this.point.stackTotal + '天';
                    } else {
                        return '<b>' + this.x + '</b><br/>' + this.series.name + ': ' + this.y + '天<br/>' + '有效天数: ' + this.point.stackTotal + '天';
                    }
                }
            },
            series: [],
            credits: { enabled: false },
            exporting: {
                //导出图片名
                filename: 'test'
            }
        };
    }, 
    //折线图
    lineChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            colors: ["#F4B300", "#78BA00", "#2673EC", "#AE113D", "#691BB8", "#AA40FF", "#BB1B6C", "#00A4A4"],
            xAxis: { categories: [], tickInterval: 3 },
            yAxis: [
                {
                    // Primary yAxis
                    min:0,
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#89A54E' }
                    },
                    title: {
                        text: '其他污染物单位:μg/m3',
                        style: { color: '#89A54E' }
                    }
                },
                {
                    // Secondary yAxis
                    //gridLineWidth: 0,
                    min: 0,
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#4572A7' }
                    },
                    title: {
                        text: 'CO单位:mg/m3',
                        style: { color: '#4572A7' }
                    },
                    opposite: true
                }
            ],
            series: [],
            credits: { enabled: false }
        };
    },
    //站点日均值折线图配置
    stationAvgDaylineChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            colors: ["#F4B300", "#78BA00", "#2673EC", "#AE113D", "#691BB8", "#AA40FF", "#BB1B6C", "#00A4A4"],
            xAxis: {
                categories: [], tickInterval: 3, labels: {
                    formatter: function () {
                        return this.value;
                    }
                }
            },
            yAxis: [
                {
                    min:0,
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#89A54E' }
                    },
                    title: {
                        text: '其他污染物单位:μg/m3',
                        style: { color: '#89A54E' }
                    }
                },
                {
                    // Secondary yAxis
                    //gridLineWidth: 0,
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#4572A7' }
                    },
                    title: {
                        text: 'CO单位:mg/m3',
                        style: { color: '#4572A7' }
                    },
                    opposite: true
                }
            ],
            plotOptions: {
                column: {
                    stacking: 'normal'
                }
            },
            tooltip: {
                formatter: function () {
                    var value = this.y;
                    if (tempCommonArray != null && tempCommonArray.length > 0) {
                        for (var i = 0; i < tempCommonArray.length; i++) {
                            var obj = tempCommonArray[i];
                            if (obj.TimePoint !== this.x) {
                                continue;
                            }
                            if (this.series.name === "NO2") {
                                value = obj.NO2; break;
                            }
                            else if (this.series.name === "CO") {
                                value = obj.CO; break;
                            }
                            else if (this.series.name === "SO2") {
                                value = obj.SO2; break;
                            }
                            else if (this.series.name === "O3_8h") {
                                value = obj.O3_8h; break;
                            }
                            else if (this.series.name === "PM2_5") {
                                value = obj.PM2_5; break;
                            }
                            else if (this.series.name === "PM10") {
                                value = obj.PM10; break;
                            }
                        }
                    }
                    return '<b>' + this.x + '</b><br/>' + this.series.name + ': ' + value;
                }
            },
            series: [],
            credits: { enabled: false }

        };
    },
    EquipmentlineChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            colors: ["#F4B300", "#78BA00", "#2673EC", "#AE113D", "#691BB8", "#AA40FF", "#BB1B6C", "#00A4A4"],
            xAxis: { categories: [], tickInterval: 3 },
            yAxis: [
                {
                    // Primary yAxis
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#89A54E' }
                    },
                    title: {
                        text: '状态值',
                        style: { color: '#89A54E' }
                    }
                }
            ],
            series: [],
            credits: { enabled: false },
        };
    },
    //对比折线图
    lineCompareChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            colors: ['#FF8000', '#616130', '#9AFF02', '#E1E100'],
            tooltip: {
                crosshairs: true,
                shared: true,
                useHTML: true,
            },
            plotOptions: {
                spline: {
                    lineWidth: 1,
                    states: {
                        hover: {
                            lineWidth: 2
                        }
                    },
                    marker: {
                        enabled: false
                    },
                }
            },
            legend: {},
            xAxis: { categories: [], tickInterval: 1 },
            yAxis: [
                {
                    // Primary yAxis
                    min:0,
                    labels: {
                        formatter: function () { return this.value; },
                        style: { color: '#89A54E' }
                    },
                    title: {
                        text: '单位:μg/m3',
                        style: { color: '#89A54E' }
                    }
                }
            ],
            series: [],
            credits: { enabled: false },
        };
    },
    //函数折线图
    linexyChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            colors: ['#FF8000', '#616130'],
            tooltip: {
                crosshairs: true,
                shared: true,
                useHTML: true,
                headerFormat: 'X：{point.x:.3f}<br/>Y：{point.y:.3f}<table>',
                pointFormat: '<tr><td ></td></tr>',
                footerFormat: '</table>',
            },
            plotOptions: {
                spline: {
                    lineWidth: 2,
                    states: {
                        hover: {
                            lineWidth: 3
                        }
                    },
                    marker: {
                        enabled: false
                    },
                }
            },
            xAxis: {
                title: {
                    text: 'SO2',
                    style: { color: '#000000' }
                },
                categories: [],
                //min: 0,
                //max: 0.1
            },
            yAxis: [{
                //min: 0,
                labels: {
                    formatter: function () { return this.value; },
                    style: { color: '#FF8000' }
                },
                title: {
                    text: 'PM2.5',
                    style: { color: '#FF8000' }
                }
            }
            ],
            series: [],
            credits: { enabled: false },
        };
    },
    //饼图
    pieChartOption: function (container) {
        return {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            colors: ['#00EE00', '#EEEE00', '#EEAD0E', '#EE3B3B', '#9A32CD', '#8B0000'],
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            xAxis: { categories: [] },
            series: [],
            credits: { enabled: false },
            tooltip: {
                useHTML: true,
                headerFormat: '<table>',
                pointFormat: '<tr><td > <b>{point.name}:</b>' + '{point.percentage:.1f}%（{point.y:.0f}天）</td></tr>',
                footerFormat: '</table>',
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        color: '#000000',
                        connectorColor: '#000000',
                        formatter: function () {
                            if (this.percentage > 0)//不显示0%的数据
                            return '<b>' + this.point.name + '</b>: ' + Highcharts.numberFormat(this.percentage, 1) + '% (' +
                                Highcharts.numberFormat(this.y, 0, ',') + '天)';
                        }
                    },
                    showInLegend: true
                }
            },
        };
    },

    //风玫瑰图
    windChartOption: function (container) {
        return {
            title: { text: container.attr("ChartTitle") },
            subtitle: { text: container.attr("SubTitle") },
            colors: ['#00E428', '#FFFF00', '#FF7E00', '#FF0000', '#99004C', '#7E0023'],
            chart: { polar: true, type: 'Column' },
            pane: { size: '85%' },
            xAxis:{
                categories: [], tickInterval: 1, tickmarkPlacement: 'on',
                labels: {
                    formatter: function () { return this.value;}
                }
                },
            yAxis: [
                {
                    gridLineInterpolation: 'polygon',
                    lineWidth: 2,
                    min: 0,
                    //max:60,
                    showLastLabel: true,
                    labels: {
                        formatter: function () { return this.value+ '%'; },//Highcharts.numberFormat(this.percentage,2) 
                        style: { color: '#00E428' },
                        x: -7,
                        align: 'right',
                    },
                    opposite: true,
                    reversedStacks: false
                },
                //{
                //    gridLineInterpolation: 'polygon',
                //    lineWidth: 2,
                //    min: 0,
                //    showLastLabel: true,
                //    labels: {
                //        formatter: function () { return this.value + '%'; },
                //        style: { color: '#FFFF00' },
                //        x:7,
                //        align: 'left',
                //    },
                //    opposite: true,
                //    reversedStacks: false
                //},
                //  {
                //      gridLineInterpolation: 'polygon',
                //      lineWidth: 2,
                //      min: 0,
                //      showLastLabel: true,
                //      labels: {
                //          formatter: function () { return this.value + '%'; },
                //          style: { color: '#FF7E00' },
                //          x: -7,
                //          align: 'right',
                //      },
                //      opposite: true,
                //      reversedStacks: false
                //  },
                //{
                //    gridLineInterpolation: 'polygon',
                //    lineWidth: 2,
                //   min: 0,
                //    showLastLabel: true,
                //    labels: {
                //        formatter: function () { return this.value + '%'; },
                //        style: { color: '#FF0000' },
                //        x: 7,
                //        align: 'left',
                //    },
                //    opposite: true,
                //    reversedStacks: false
                //},
                //{
                //    gridLineInterpolation: 'polygon',
                //    lineWidth: 2,
                //   min: 0,
                //    showLastLabel: true,
                //    labels: {
                //       formatter: function () { return this.value + '%'; },
                //        style: { color: '#99004C' },
                //        x: -7,
                //        align: 'right',
                //    },
                //    opposite: true,
                //    reversedStacks: false
                //},
                //{
                //    gridLineInterpolation: 'polygon',
                //    lineWidth: 2,
                //    min: 0,
                //    showLastLabel: true,
                //    labels: {
                //        formatter: function () { return this.value + '%'; },
                //        style: { color: '#7E0023' },
                //        x: 7,
                //        align: 'left',
                //    },
                //    opposite: true,
                //    reversedStacks: false
                //},
            ],
            tooltip: {
                shared: false
            },
            plotOptions: {
                series: {
                    stacking: 'normal',
                    shadow: false,
                    groupPadding: 0,
                    pointPlacement: 'on'
                }
            },
            series: [],
            credits: { enabled: false },
        };
    },

};