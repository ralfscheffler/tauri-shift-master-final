/* Copyright 2005 - 2023 Annpoint, s.r.o.
   Use of this software is subject to license terms.
   https://www.daypilot.org/
*/

if (typeof DayPilot === 'undefined') {
    var DayPilot = {};
}

if (typeof DayPilot.Global === 'undefined') {
    DayPilot.Global = {};
}

(function(DayPilot) {
    

    if (typeof DayPilot.Bubble !== 'undefined' && DayPilot.Bubble.def) {
        return;
    }

    var DayPilotBubble = {};

    DayPilotBubble.mouseMove = function(ev) {
        if (typeof(DayPilotBubble) === 'undefined') {
            return;
        }
        DayPilotBubble.mouse = DayPilotBubble.mousePosition(ev);

        var b = DayPilotBubble.active;
        if (b && b._state.showPosition) {
            var pos1 = b._state.showPosition;
            var pos2 = DayPilotBubble.mouse;
            if (pos1.clientX !== pos2.clientX || pos1.clientY !== pos2.clientY) {
                // b.delayedHide();
            }
        }
    };

    DayPilotBubble.touchPosition = function(ev) {
        if (!ev || !ev.touches) {
            return null;
        }
        var touch = ev.touches[0];
        var mouse = {};
        mouse.x = touch.pageX;
        mouse.y = touch.pageY;
        mouse.clientX = touch.clientX;
        mouse.clientY = touch.clientY;
        return mouse;

    };

    DayPilotBubble.mousePosition = function(e) {
        // var result = DayPilot.mo3(document.body, e);
        var result = DayPilot.mo3(null, e);
        if (e) {
            result.clientY = e.clientY;
            result.clientX = e.clientX;
        }
        return result;
    };

    DayPilot.Bubble = function(options) {
        this.v = '2023.2.5592';

        var bubble = this;
        var elements = {};

        // default property values
        this.hideAfter = 500;
        this.loadingText = "Loading...";
        this.animated = true;
        this.animation = "fast";
        this.position = "Above";
        this.hideOnClick = true;
        this.hideOnHover = false;
        this.showAfter = 500;
        this.showLoadingLabel = true;
        this.showArrow = true;
        this.zIndex = 10;
        this.theme = "bubble_default";

        this.onLoad = null;
        this.onBeforeDomAdd = null;
        this.onBeforeDomRemove = null;

        // hiding for angular
        this._state = function() {};

        this._arrowTopIndent = 10;
        this._arrowLeftIndent = 10;

        this.callBack = function(args) {
            if (this.aspnet()) {
                WebForm_DoCallback(this.uniqueID, JSON.stringify(args), this.updateView, this, this.callbackError, true);
            }
            else {
                if (args.calendar.internal.bubbleCallBack) {
                    args.calendar.internal.bubbleCallBack(args, this);
                }
                else {
                    args.calendar.bubbleCallBack(args, this);
                }
            }
        };

        this.callbackError = function (result, context) {
            alert(result);
        };

        this.updateView = function(result, context) {

            // context should equal to bubble
            if (bubble !== context) {
                throw "Callback object mismatch (internal error)";
            }
            if (!result) {
                bubble._removeDiv();
                // bubble.removeShadow();
                return;
            }

            var domArgs = null;
            var html = null;
            var element = null;
            if (typeof result === "string") {
                html = result;
            }
            else if (typeof result === "object") {
                domArgs = result;
                html = result.html;
                element = result.element;
            }

            DayPilotBubble.active = bubble;
            if (bubble) {
                var doUpdate = false;
                var delayedReact = false;
                if (elements.div) {
                    if (element) {
                        elements._inner.innerHTML = '';

                        var isReactComponent = DayPilot.Util.isReactComponent(element);
                        if (isReactComponent) {
                            var reactDom = bubble._ref.calendar && bubble._ref.calendar.internal.reactRefs().reactDOM;
                            if (!reactDom) {
                                throw new DayPilot.Exception("Can't reach ReactDOM");
                            }
                            bubble._react._render(element, elements._inner);
                            delayedReact = bubble._react._react18();
                        }
                        else {
                            elements._inner.appendChild(element);
                        }
                        doUpdate = true;
                    }
                    else if (html) {
                        elements._inner.innerHTML = html;
                        doUpdate = true;
                    }
                    elements.div.domArgs = domArgs;
                }
                if (doUpdate) {
                    if (delayedReact) {
                        setTimeout(function() {
                           bubble._adjustPosition();
                        });
                    }
                    else {
                        bubble._adjustPosition();
                    }
                }
            }
        };

        this.init = function() {
            // moved to global init code
            //DayPilot.re(document.body, 'mousemove', DayPilotBubble.mouseMove);
        };

        this.aspnet = function() {
            return (typeof WebForm_DoCallback !== 'undefined');
        };

        this.showEvent = function(e, now) {
            var a = new DayPilotBubble.CallBackArgs(e.calendar || e.root, 'Event', e, e.bubbleHtml ? e.bubbleHtml() : null);
            if (now) {
                this.show(a);
            }
            else {
                this.showOnMouseOver(a);
            }
        };

        this.showGroup = function(group) {
            this.showOnMouseOver(group);
        };

        this.showCell = function(cell, div) {
            DayPilotBubble.cancelShowing();
            var a = new DayPilotBubble.CallBackArgs(cell.calendar || cell.root, 'Cell', cell, cell.staticBubbleHTML ? cell.staticBubbleHTML() : null);
            a.div = div;
            this.showOnMouseOver(a);
        };

        this.showLink = function(link) {
            DayPilotBubble.cancelShowing();
            var a = new DayPilotBubble.CallBackArgs(link.calendar || link.root, 'Cell', link, link.data && link.data.bubbleHtml);
            this.showOnMouseOver(a);
        };

        this.showTime = function(time) {
            var a = new DayPilotBubble.CallBackArgs(time.calendar || time.root, 'Time', time, time.staticBubbleHTML ? time.staticBubbleHTML() : null);
            this.showOnMouseOver(a);
        };

        this.showResource = function(row, now) {
           /* var isRow = DayPilot.Row && row instanceof DayPilot.Row;
            var isColumn = DayPilot.Column && row instanceof DayPilot.Column;
            var rowOrCol = isRow || isColumn;

            if (!rowOrCol) {
                throw new DayPilot.Exception("DayPilot.Row or DayPilot.Column object expected");
            }*/

            var res = {};
            res.calendar = row.calendar;
            res.id = row.id;
            res.name = row.name;
            res.start = row.start;
            if (row.bubbleHtml) {
                res.bubbleHtml = function() {
                    return row.bubbleHtml;
                };
            }
            else if (row.data && row.data.bubbleHtml) {
                res.bubbleHtml = function() {
                    return row.data.bubbleHtml;
                };
            }
            res.toJSON = function() {
                var json = {};
                json.id = this.id;
                return json;
            };

            var a = new DayPilotBubble.CallBackArgs(res.calendar || res.root, 'Resource', res, res.bubbleHtml ? res.bubbleHtml() : null);
            a.div = row.div;

            if (now) {
                this.show(a);
            }
            else {
                this.showOnMouseOver(a);
            }
        };

        this.showHtml = function(html, div) {
            var a = new DayPilotBubble.CallBackArgs(null, 'Html', null, html);
            a.div = div;
            this.show(a);
        };

        this.hide = function() {
            if (DayPilotBubble.active === this) {
                DayPilot.Bubble.hide();
            }
        };

        // angular change detection
        this.toJSON = function() {
            return null;
        };

        this.show = function(callbackArgument) {

            if (!bubble._anythingToDisplay(callbackArgument)) {
                return;
            }

            var pop = this.animated;

            this._state.showPosition = DayPilotBubble.mouse;

            DayPilotBubble.showing = null;

            if (!DayPilotBubble.mouse) {
                // wait a bit
                setTimeout(function() {
                    bubble.show(callbackArgument);
                }, 100);
                return;
            }

            var mouse = DayPilotBubble.mouse;
            mouse.h = 0;
            mouse.w = 0;
            var ref = this.getDiv(callbackArgument);
            var pos = bubble._resolvedPosition();
            var posAbove = pos === "Above";
            var posRight = pos === "Right";
            var posRef = posAbove || posRight;
            if (posRef && ref) {
                var margin = 2;
                var abs = DayPilot.abs(ref, true);
                if (!abs) {
                    return;
                }

                mouse.x = abs.x;
                mouse.y = abs.y;
                mouse.h = abs.h + margin;
                mouse.w = abs.w;
            }

            this._state.mouse = mouse;

            var id;
            try {
                id = JSON.stringify(callbackArgument.object);
            }
            catch (e) {
                return; // unable to serialize, it's an invalid event (might have been cleared already)
            }

            if (DayPilotBubble.active === this && this._state.sourceId === id) { // don't show, it's already visible
                return;
            }
            if (typeof DayPilot.Menu !== 'undefined' && DayPilot.Menu.active) { // don't show the bubble if a menu is active
                return;
            }

            // hide whatever might be visible (we are going to show another one)
            DayPilotBubble.hideActive();

            DayPilotBubble.active = this;
            this._state.sourceId = id;

            var div = document.createElement("div");
            div.setAttribute("unselectable", "on");
            div.style.position = 'absolute';

            //if (!this.showLoadingLabel && !pop) {
            if (!this.showLoadingLabel) {
                div.style.display = 'none';
            }

            div.className = this._prefixCssClass("_main");

            div.style.top = '-3000px';
            div.style.left = '-3000px';
            div.style.zIndex = this.zIndex + 1;

            if (pop) {
                div.style.visibility = 'hidden';
            }

            if (this.hideOnClick) {
                div.onclick = function() {
                    DayPilotBubble.hideActive();
                };
            }

            div.onmousemove = function(e) {
                if (bubble.hideOnHover) {
                    DayPilotBubble.hideActive();
                }

                // prevent other bubbles from becoming active (may cause just hiding the current one if no html is specified)
                DayPilotBubble.cancelShowing();

                DayPilotBubble.cancelHiding();
                var e = e || window.event;
                e.cancelBubble = true;
            };
            div.oncontextmenu = function() { return false; };
            div.onmouseleave = function() { bubble.delayedHide(); };

            var arrowLeftIndent = this._arrowLeftIndent;
            var arrowTopIndent = this._arrowTopIndent;

            var ns = "http://www.w3.org/2000/svg";
            var arrowTop = document.createElementNS(ns,"svg");
            arrowTop.setAttribute("viewBox", "0 0 12 10");
            arrowTop.setAttribute("class", this._prefixCssClass("_arrow_top"));
            arrowTop.style.width = "12px";
            arrowTop.style.height = "10px";
            arrowTop.style.position = "absolute";
            arrowTop.style.top = "0px";
            arrowTop.style.left = arrowLeftIndent + "px";
            arrowTop.style.display = "none";
            arrowTop.innerHTML = '<polyline points="0 10 6 0 12 10"></polyline>';

            var arrowBottom = document.createElementNS(ns,"svg");
            arrowBottom.setAttribute("viewBox", "0 0 12 10");
            arrowBottom.setAttribute("class", this._prefixCssClass("_arrow_bottom"));
            arrowBottom.style.width = "12px";
            arrowBottom.style.height = "10px";
            arrowBottom.style.position = "absolute";
            arrowBottom.style.bottom = "0px";
            arrowBottom.style.left = arrowLeftIndent + "px";
            arrowBottom.style.display = "none";
            arrowBottom.innerHTML = '<polyline points="0 0 6 10 12 0"></polyline>';

            var arrowLeft = document.createElementNS(ns,"svg");
            arrowLeft.setAttribute("viewBox", "0 0 10 12");
            arrowLeft.setAttribute("class", this._prefixCssClass("_arrow_left"));
            arrowLeft.style.width = "10px";
            arrowLeft.style.height = "12px";
            arrowLeft.style.position = "absolute";
            arrowLeft.style.top = arrowTopIndent + "px";
            arrowLeft.style.left =  "0px";
            arrowLeft.style.display = "none";
            arrowLeft.innerHTML = '<polyline points="10 0 0 6 10 12"></polyline>';

            var arrowRight = document.createElementNS(ns,"svg");
            arrowRight.setAttribute("viewBox", "0 0 10 12");
            arrowRight.setAttribute("class", this._prefixCssClass("_arrow_right"));
            arrowRight.style.width = "10px";
            arrowRight.style.height = "12px";
            arrowRight.style.position = "absolute";
            arrowRight.style.top = arrowTopIndent + "px";
            arrowRight.style.right = "0px";
            arrowRight.style.display = "none";
            arrowRight.innerHTML = '<polyline points="0 0 10 6 0 12"></polyline>';

            var inner = document.createElement("div");
            div.appendChild(inner);
            div.appendChild(arrowTop);
            div.appendChild(arrowBottom);
            div.appendChild(arrowLeft);
            div.appendChild(arrowRight);

            inner.className = this._prefixCssClass("_main_inner");
            inner.innerHTML = this.loadingText;

            document.body.appendChild(div);

            elements.div = div;
            elements._inner = inner;
            elements._arrowTop = arrowTop;
            elements._arrowBottom = arrowBottom;
            elements._arrowLeft = arrowLeft;
            elements._arrowRight = arrowRight;

            // bubble._calendar = callbackArgument.calendar;

            bubble._ref = function() {};
            bubble._ref.calendar = callbackArgument.calendar;

            var args = {};
            args.source = callbackArgument.object;
            args.async = false;
            args.html = callbackArgument.staticHTML;
            args.loaded = function() {
                // make sure it's marked as async
                if (this.async) {
                    // bubble.updateView(args.html, bubble);
                    bubble._domAdd(args);
                }
            };

            if (this.showLoadingLabel && !pop) {
                this._adjustPosition();
                // this.addShadow();
            }

            if (callbackArgument.staticHTML  && typeof this.onLoad !== 'function') {
                // this.updateView(callbackArgument.staticHTML, this);
                bubble._domAdd(args);
            }
            else if (typeof this.onLoad === 'function') {
                this.onLoad(args);

                // not async, show now
                if (!args.async) {
                    // bubble.updateView(args.html, bubble);
                    bubble._domAdd(args);
                }
            }
            else if (typeof bubble.onDomAdd === "function" || typeof bubble.onBeforeDomAdd === "function") {
                bubble._domAdd(args);
            }
            else if (this._serverBased(callbackArgument)) {
                this.callBack(callbackArgument);
            }
        };

        this._anythingToDisplay = function(callbackArgument) {
            if (callbackArgument.staticHTML) {
                return true;
            }
            if (typeof this.onLoad === 'function') {
                return true;
            }
            if (typeof bubble.onDomAdd === "function" || typeof bubble.onBeforeDomAdd === "function") {
                return true;
            }
            if (this._serverBased(callbackArgument)) {
                return true;
            }
            return false;
        };

        this._domAdd = function(loadArgs) {
            var args = {};
            args.source = loadArgs.source;
            args.html = loadArgs.html;
            args.element = null;

            // legacy, to be removed
            if (typeof bubble.onDomAdd === "function") {
                bubble.onDomAdd(args);
            }

            if (typeof bubble.onBeforeDomAdd === "function") {
                bubble.onBeforeDomAdd(args);
            }

            bubble.updateView(args, bubble);

        };

        this.getDiv = function(callbackArgument) {
            if (callbackArgument.div) {
                return callbackArgument.div;
            }
            if (callbackArgument.type === 'Event' && callbackArgument.calendar && callbackArgument.calendar.internal.findEventDiv) {
                return callbackArgument.calendar.internal.findEventDiv(callbackArgument.object);
            }

        };

        this._prefixCssClass = function(part) {
            var prefix = this.theme || this.cssClassPrefix;
            if (prefix) {
                return prefix + part;
            }
            else {
                return "";
            }
        };


        this._resolvedPosition = function() {
            var pos = bubble.position;
            if (!pos) {
                return "Above";
            }
            if (pos.toLowerCase() === "eventtop") {
                return "Above";
            }
            if (pos.toLowerCase() === "above") {
                return "Above";
            }
            if (pos.toLowerCase() === "mouse") {
                return "Mouse";
            }
            if (pos.toLowerCase() === "right") {
                return "Right";
            }
            throw new DayPilot.Exception("Unrecognized DayPilot.Bubble.position value: " + pos);
        };

        this._adjustPosition = function() {

            var pop = this.animated;
            var mouse = this._state.mouse;

            var position = bubble._resolvedPosition();

            var windowPadding = 10; // used for both horizontal and vertical padding if the bubble
            var yArrowOffset = 0;

            if (!elements.div) {
                return;
            }

            if (!mouse) {  // don't adjust the position
                return;
            }

            // invalid coordinates
            if (!mouse.x || !mouse.y) {
                DayPilotBubble.hideActive();
                return;
            }

            var div = elements.div;
            var inner = elements._inner;

            div.style.display = '';

            var height = div.offsetHeight;
            if (this.showArrow) {
                height += 9;
            }
            var width = div.offsetWidth;
            if (this.showArrow) {
                width += 9;
            }

            div.style.display = 'none';

            var wd = DayPilot.wd();

            var windowWidth = wd.width;
            var windowHeight = wd.height;

            var verticalref = "bottom";
            var horizontalref = "left";

            if (position === 'Mouse') {
                var pixelsBelowCursor = 22;
                var pixelsAboveCursor = 10;

                var top = 0;
                if (mouse.clientY > windowHeight - height + windowPadding) {
                    var offsetY = mouse.clientY - (windowHeight - height) + windowPadding;
                    top = (mouse.y - height - pixelsAboveCursor);
                }
                else {
                    top = mouse.y + pixelsBelowCursor;
                }

                if (typeof top === 'number') {
                    div.style.top = Math.max(top, 0) + "px";
                }

                if (mouse.clientX > windowWidth - width + windowPadding) {
                    var offsetX = mouse.clientX - (windowWidth - width) + windowPadding;
                    div.style.left = (mouse.x - offsetX) + 'px';
                }
                else {
                    div.style.left = mouse.x + 'px';
                }
            }
            else if (position === 'Above') {
                var space = 2;

                // 1 try to show it above the event
                var top = mouse.y - height - space;
                var scrollTop = wd.scrollTop;

                // 2 doesn't fit there, try to show it below the event
                if (top < scrollTop) {
                    top = mouse.y + mouse.h;
                    verticalref = "top";
                }

                if (typeof top === 'number') {
                    div.style.top = Math.max(top, 0) + 'px';
                }

                var left = mouse.x;

                // does it have any effect here? gets updated later
                if (mouse.x + width + windowPadding > windowWidth) {
                    //var offsetX = this.mouse.x - (windowWidth - width) + windowPadding;
                    //left = this.mouse.x - offsetX;
                    left = windowWidth - width - windowPadding;
                    horizontalref = "right";
                }

                div.style.left = left + 'px';
            }
            else if (position === "Right") {

                // console.log("position = right");
                verticalref = "top";

                var top = mouse.y;
                var left = mouse.x + mouse.w;

                if (left + width + windowPadding > windowWidth) {
                    if (width < mouse.x) {
                        left = left - width - mouse.w;
                        horizontalref = "right";
                    }
                }

                var yOverflow = top + height + windowPadding - windowHeight;
                if (yOverflow > 0) {
                    top -= yOverflow;
                    yArrowOffset = yOverflow;
                    if (top < 0) {
                        yArrowOffset += top;
                        top = 0;
                    }
                }

                div.style.top = top + "px";
                div.style.left = left + "px";
            }

            div.style.display = '';

            if (this.showArrow) {
                if (position === "Above" || position === "Mouse") {
                    if (verticalref === "bottom") {
                        elements._arrowTop.style.display = "none";
                        elements._arrowBottom.style.display = "";
                        inner.style.marginTop = "0px";
                        inner.style.marginBottom = "9px";
                    }
                    else {
                        elements._arrowTop.style.display = "";
                        elements._arrowBottom.style.display = "none";
                        inner.style.marginTop = "9px";
                        inner.style.marginBottom = "0px";
                    }
                }
                else {
                    if (horizontalref === "left") {
                        elements._arrowRight.style.display = "none";
                        elements._arrowLeft.style.display = "";
                        elements._arrowLeft.style.top = (this._arrowTopIndent + yArrowOffset) + "px";
                        inner.style.marginRight = "0px";
                        inner.style.marginLeft = "9px";
                    }
                    else {
                        elements._arrowRight.style.display = "";
                        elements._arrowLeft.style.display = "none";
                        elements._arrowRight.style.top = (this._arrowTopIndent + yArrowOffset) + "px";
                        inner.style.marginRight = "9px";
                        inner.style.marginLeft = "0px";
                    }
                }
            }

            // debugger;

            if (pop) {
                div.style.display = '';

                var original = {};
                original.color = inner.style.color;
                original.overflow = div.style.overflow;

                inner.style.color = "transparent";
                div.style.overflow = 'hidden';

                // this.removeShadow();

                DayPilot.pop(div, {
                    "finished": function() {
                        inner.style.color = original.color;
                        div.style.overflow = original.overflow;
                        // bubble.addShadow();
                    },
                    // "vertical": "bottom",
                    "vertical": verticalref,
                    // "horizontal": "left",
                    "horizontal": horizontalref,
                    "animation" : bubble.animation
                });
            }

        };

        this.delayedHide = function() {
            // turned off, might not be desired
            // DayPilotBubble.cancelHiding();

            if (DayPilotBubble.showing === this) {
                DayPilotBubble.cancelShowing();
                // this.delayedHide();
                // return;
            }

            var active = DayPilotBubble.active;
            if (active === this) {
                DayPilotBubble.cancelHiding();
                if (active.hideAfter > 0) {
                    var hideAfter = active.hideAfter;
                    DayPilotBubble.timeoutHide = window.setTimeout(DayPilotBubble.hideActive, hideAfter);
                }
            }
        };

        this.showOnMouseOver = function (callbackArgument) {
            // DayPilotBubble.cancelTimeout();

            if (DayPilotBubble.active === this) {
                DayPilotBubble.cancelHiding();
            }

            var delayedShow = function(arg) {
                return function() {
                    bubble.show(arg);
                };
            };

            clearTimeout(DayPilotBubble.timeoutShow);
            DayPilotBubble.timeoutShow = window.setTimeout(delayedShow(callbackArgument), this.showAfter);

            DayPilotBubble.showing = this;
            //DayPilotBubble.timeout = window.setTimeout(this.clientObjectName + ".show('" + callbackArgument + "')", this.showAfter);
        };

        this.hideOnMouseOut = function() {
            this.delayedHide();
        };

        this._serverBased = function(args) {
            if (args.calendar.backendUrl) {  // ASP.NET MVC, Java
                return true;
            }
            if (typeof WebForm_DoCallback === 'function' && this.uniqueID) {  // ASP.NET WebForms
                return true;
            }
            return false;
        };

        this._removeDiv = function() {
            if (!elements.div) {
                return;
            }

            var domArgs = elements.div.domArgs;
            elements.div.domArgs = null;

            if (domArgs) {
                if (typeof bubble.onDomRemove === "function") {
                    bubble.onDomRemove(domArgs);
                }
                if (typeof bubble.onBeforeDomRemove === "function") {
                    bubble.onBeforeDomRemove(domArgs);
                }

                if (typeof bubble.onDomAdd === "function" || typeof bubble.onBeforeDomAdd === "function") {
                    var target = elements._inner;
                    if (target) {
                        var isReact = DayPilot.Util.isReactComponent(domArgs.element);
                        if (isReact) {
                            var reactDom = bubble._ref.calendar && bubble._ref.calendar.internal.reactRefs().reactDOM;
                            if (!reactDom) {
                                throw new DayPilot.Exception("Can't reach ReactDOM");
                            }
                            bubble._react._unmount(target);
                        }
                    }
                }
            }

            document.body.removeChild(elements.div);
            elements.div = null;
        };

        this._react = {};
        this._react._render = function(component, target) {
            var rd = bubble._ref.calendar && bubble._ref.calendar.internal.reactRefs().reactDOM;
            if (typeof rd.createRoot === "function") {  // React 18
                var root = target._root;
                if (!root) {
                    root = rd.createRoot(target);
                    target._root = root;
                }
                root.render(component);
            }
            else {
                rd.render(component, target);
            }

        };
        this._react._react18 = function() {
            var rd = bubble._ref.calendar && bubble._ref.calendar.internal.reactRefs().reactDOM;
            return rd && typeof rd.createRoot === "function";
        };
        this._react._unmount = function(target) {
            var rd = bubble._ref.calendar && bubble._ref.calendar.internal.reactRefs().reactDOM;
            if (typeof rd.createRoot === "function") {  // React 18
                var root = target._root;
                setTimeout(function() {
                    root.unmount();
                }, 0);
            }
            else {
                rd.unmountComponentAtNode(target);
            }
        };

        if (options) {
            for (var name in options) {
                this[name] = options[name];
            }
        }

        this.init();

    };

    DayPilot.Bubble.touchPosition = function(ev) {
        if (ev.touches) {
            DayPilotBubble.mouse = DayPilotBubble.touchPosition(ev);
        }
    };

    DayPilotBubble.cancelShowing = function() {
        DayPilotBubble.showing = null;
        if (DayPilotBubble.timeoutShow) {
            window.clearTimeout(DayPilotBubble.timeoutShow);
            DayPilotBubble.timeoutShow = null;

        }
    };

    DayPilotBubble.cancelHiding = function() {
        if (DayPilotBubble.timeoutHide) {
            window.clearTimeout(DayPilotBubble.timeoutHide);
        }
    };

    DayPilotBubble.hideActive = function() {
        DayPilotBubble.cancelHiding();

        // don't cancel showing here (it prevents showing bubble of another type right away)
        // DayPilotBubble.cancelShowing();
        var bubble = DayPilotBubble.active;
        if (bubble) {
            bubble._removeDiv();
            // bubble.removeShadow();
        }
        DayPilotBubble.active = null;
    };

    DayPilotBubble.CallBackArgs = function(calendar, type, object, staticHTML) {
        this.calendar = calendar;
        this.type = type;
        this.object = object;
        this.staticHTML = staticHTML;

        this.toJSON = function() {
            var json = {};
            json.uid = this.calendar.uniqueID;
            //json.v = this.calendar.v;
            json.type = this.type;
            json.object = object;
            //json.staticHTML = staticHTML;
            return json;
        };
    };

    // register global events
    DayPilot.re(document, 'mousemove', DayPilotBubble.mouseMove);

    // publish the API

    // (backwards compatibility)
    /*
    DayPilot.BubbleVisible.Bubble = DayPilotBubble.Bubble;
    DayPilot.BubbleVisible.hideActive = DayPilotBubble.hideActive;
    DayPilot.BubbleVisible.cancelTimeout = DayPilotBubble.cancelTimeout;
    */

    // current
    DayPilot.Bubble.hideActive = DayPilotBubble.hideActive;
    DayPilot.Bubble.cancelShowing = DayPilotBubble.cancelShowing;
    DayPilot.Bubble.hide = function(options) {
        options = options || {};

        // hide bubble only for the specified calendar source
        if (options.calendar) {
            var active = DayPilotBubble.active;
            if (active && active._ref.calendar === options.calendar) {
                DayPilot.Bubble.hide();
            }
        }
        else {
            DayPilotBubble.hideActive();
        }
    };
    DayPilot.Bubble.getActive = function() {
        return DayPilotBubble.active;
    };

    DayPilot.Bubble.def = {};

    if (typeof Sys !== 'undefined' && Sys.Application && Sys.Application.notifyScriptLoaded){
       Sys.Application.notifyScriptLoaded();
    }

})(DayPilot);
