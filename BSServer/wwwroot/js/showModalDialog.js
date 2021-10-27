(function ($) {
    var defaultOption = {
        url: "",
        width: 500,
        height: 400,
        title: "标题",
        onClose: function () { },
        overlayClose: false
    };
    $.fn.centerScreen = function (width, height) {
        var t = this;
        var marginLeft = -(width / 2);
        var marginTop = -(height / 2);
        var p = "fixed";
        if (!$.support.leadingWhitespace) {
            p = "absolute";
            marginTop += $(window.top).scrollTop();
        }
        t.css({ "position": p, "top": '50%', "left": '50%', 'margin-top': marginTop, 'margin-left': marginLeft });
        return this;
    };
    $.extend({
        showModalDialog: function (option) {
            option = $.extend({}, defaultOption, option);
            var newId = new Date().valueOf(),
                dialog = "<div class=\"modal-dialog\" style=\"width: " + option.width + "px; height: " + option.height + "px;\">",
                content = "<div class=\"modal-content\">",
                title = "<div class=\"modal-header\"><button title=\"关闭\" aria-label=\"Close\" data-dismiss=\"modal\" class=\"close btn-close\" type=\"button\"><span>×</span></button><h4 class=\"modal-title\">" + option.title + "</h4></div>",
                body = "<div class=\"modal-body\">",
                loading = "<div id='txtloading' class=\"loading\"></div>",
                iframe = "<iframe onload=\"$('#txtloading').remove();\" width=\"100%\" height=\"99%\" frameborder=\"0\" src=\"" + option.url + "\" scrolling=\"yes\"></iframe>";
            var html = [dialog, content, title, body, loading, iframe, "</div>", "</div>", "</div>"].join('');
            $.showModalDialogInner(html, option.overlayClose, option.onClose, option.width, option.height);
        },
        showModalDialogInner: function (html, overlayClose, onClose, width, height) {
            overlayClose = overlayClose || false;
            var targetBody = window.top.document.body;
            var overlayCount = $(targetBody).find(".overlay").length;
            var zIndex = (overlayCount * 2) + 10000;
            var overlayHeight = Math.max($(window.top).height(), $(window.top.document).height());
            overlay = $("<div class='overlay'></div>").css("min-height", overlayHeight).css("z-index", zIndex).appendTo(targetBody);
            var innerCloseDialog = function () {
                try {
                    if (window.top && window.top.onDialogClose && window.top.onDialogClose.length > 0) {
                        window.top.onDialogClose.pop()('false');
                    }
                } catch (e) { }
            };
            if (overlayClose) {
                overlay.bind("click", innerCloseDialog);
            }
            var target = $(html).appendTo(targetBody);
            target.css("z-index", zIndex + 1).centerScreen(width, height);
            target.show();
            $(targetBody).find(".btn-close").click(innerCloseDialog);
            if (!window.top.onDialogClose || window.top.onDialogClose.length == 0) {
                window.top.onDialogClose = [];
            }
            window.top.onDialogClose.push(function (res) {
                if (onClose && typeof (onClose) == 'function') {
                    onClose(res);
                    $.closeDialog();
                }
            });
            if (!window.top.dialogArray || window.top.dialogArray.length == 0) {
                window.top.dialogArray = [];
            }
            window.top.dialogArray.push(target);
        },
        closeDialog: function () {
            if (window.top && window.top.dialogArray) {
                if (window.top.dialogArray.length > 0) {
                    var target = window.top.dialogArray.pop();
                    target.prev(".overlay").remove();
                    target.remove();
                }
                if (window.top.dialogArray.length == 0) {
                    window.top.dialogArray = undefined;
                }
            }
        }
    });
})(jQuery);