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

(function (DayPilot) {
    

    if (typeof DayPilot.Queue !== 'undefined' && DayPilot.Queue.def) {
        return;
    }

    DayPilot.Queue = function (id, options) {
        this.v = '2023.2.5592';

        var calendar = this;
        this.id = id; // referenced

        if (typeof DayPilot.Bubble === "function") {
            this.bubble = new DayPilot.Bubble();
        } else {
            this.bubble = null;
        }

        this.contextMenu = null;
        this.eventBarVisible = true;
        this.eventHeight = 35;
        this.eventTextWrappingEnabled = false;
        this.lineSpace = 5;
        this.theme = null;

        this.emptyText = "";
        this.emptyHtml = null;

        this.eventClickHandling = "Enabled";
        this.eventHoverHandling = "Bubble";
        this.eventRightClickHanding = "ContextMenu";
        this.eventSelectHandling = "Update";

        this.onBeforeEventRender = null;
        this.onEventClick = null;
        this.onEventClicked = null;
        this.onEventRightClick = null;
        this.onEventRightClicked = null;
        this.onEventMove = null;
        this.onEventMoving = null;
        this.onEventSelect = null;
        this.onEventSelected = null;

        this._initialized = false;
        this._cssClassPrefix = "queue_default";
        this._events = [];
        this._draggingFromQueue = false;
        this._draggingFromScheduler = false;

        this.nav = {};
        this.events = {};
        this.events.list = [];

        this.elements = {};
        this.elements.events = [];

        var createDiv = function () {
            return document.createElement("div");
        };

        this._loadTop = function () {
            if (this.id && this.id.tagName) {
                this.nav.top = this.id;
            } else if (typeof this.id === "string") {
                this.nav.top = document.getElementById(this.id);
                if (!this.nav.top) {
                    throw new DayPilot.Exception("DayPilot.Queue: The placeholder element not found: '" + id + "'.");
                }
            } else {
                throw new DayPilot.Exception("DayPilot.Queue() constructor requires the target element or its ID as a parameter");
            }
        };

        this._prefixCssClass = function (part) {
            var prefix = this.theme || this._cssClassPrefix;
            if (prefix) {
                return prefix + part;
            } else {
                return "";
            }
        };


        this._update = function () {
            var container = calendar.nav.container;
            container.innerHTML = "";
            calendar._indicator = null;
            calendar._updateCss();
            calendar._loadEvents();
            calendar._drawEvents();
            calendar._drawEmpty();
        };

        this._updateCss = function () {
            var top = calendar.nav.top;
            top.className = calendar._initialMainCss;
            DayPilot.Util.addClass(top, calendar._prefixCssClass("_main"));
        };


        this._loadEvents = function() {

            var ids = {};

            var src = calendar.events.list || [];
            calendar._events = [];

            for (var i = 0; i < src.length; i++) {
                var data = src[i];

                var validId = typeof data.id === "string" || typeof data.id === "number";
                if (!validId) {
                    throw new DayPilot.Exception("All events must have an id property (string or number)");
                }

                var key = typeof data.id + "_" + data.id;
                if (ids[key]) {
                    throw new DayPilot.Exception("Duplicate IDs not allowed.");
                }
                ids[key] = true;

                var cache = DayPilot.Util.copyProps(data);
                calendar._doBeforeEventRender(cache);
                var item = {};
                item.data = data;
                item.cache = cache;
                calendar._events.push(item);
            }

        };

        this._selection = {};
        this._selection._list = [];
        this._selection._events = [];

        var sel = calendar._selection;

        this._selection._select = function(div) {
            var e = div.event;
            sel._deselect();
            sel._highlight(div);
            sel._list[0] = e;
        };

        this._selection._highlight = function(div) {
            sel._events[0] = div;
            var css = calendar._prefixCssClass("_selected");
            DayPilot.Util.addClass(div, css);
        };

        this._selection._unhlighlight = function(div) {
            sel._events = [];
            var css = calendar._prefixCssClass("_selected");
            DayPilot.Util.removeClass(div, css);
        };

        this._selection._shouldBeSelected = function(id) {
            return calendar._selection._events.find(function(div) {
                return div.event.data.id === id;
            });
        };

        this._selection._deselect = function() {
            var current = sel._events[0];
            if (current) {
                sel._unhlighlight(current);
            }
            sel._list = [];
        };

        this._doBeforeEventRender = function(data) {
            var args = {};
            args.data = data;
            if (typeof calendar.onBeforeEventRender === "function") {
                calendar.onBeforeEventRender(args);
            }
        };


        this._drawEmpty = function() {
            if (calendar.events.list.length !== 0) {
                return;
            }

            var target = calendar.nav.container;

            var empty = createDiv();

            if (calendar.emptyHtml) {
                empty.innerHTML = calendar.emptyHtml;
            }
            else {
                empty.innerText = calendar.emptyText;
            }

            target.appendChild(empty);
        };

        this._drawEvents = function () {
            var events = calendar._events;
            calendar.elements.events = [];
            events.forEach(function (item) {
                calendar._drawEvent(item);
            });
        };

        this._drawEvent = function (item) {

            var cache = item.cache;
            var data = item.data;
            var target = calendar.nav.container;
            var div = createDiv();
            div.className = calendar._prefixCssClass("_event");
            div.style.height = calendar.eventHeight + "px";
            div.style.boxSizing = "border-box";
            div.style.overflow = "hidden";
            div.style.marginTop = calendar.lineSpace + "px";
            div.style.position = "relative";
            if (!calendar.eventTextWrappingEnabled) {
                div.style.whiteSpace = 'nowrap';
            }
            div.addEventListener("click", calendar._onEventClick);
            div.addEventListener("contextmenu", calendar._onContextMenu);

            if (calendar._selection._shouldBeSelected(data.id)) {
                calendar._selection._highlight(div);
            }

            var inner = createDiv();
            inner.className = calendar._prefixCssClass("_event_inner");

            if (typeof cache.html === "string") {
                inner.innerHTML = cache.html;
            } else {
                inner.innerText = cache.text;
            }


            if (cache.cssClass) {
                DayPilot.Util.addClass(div, cache.cssClass);
            }

            if (cache.backColor) {
                inner.style.background = cache.backColor;
            }
            if (cache.fontColor) {
                inner.style.color = cache.fontColor;
            }
            if (cache.borderColor === "darker" && cache.backColor) {
                inner.style.borderColor = DayPilot.ColorUtil.darker(cache.backColor, 2);
            }
            else {
                inner.style.borderColor = cache.borderColor;
            }

            if (cache.backImage) {
                inner.style.backgroundImage = "url(" + cache.backImage + ")";
                if (cache.backRepeat) {
                    inner.style.backgroundRepeat = cache.backRepeat;
                }
            }
            div.appendChild(inner);

            div.onmousemove = this._onEventMouseMove;
            div.onmouseleave = this._onEventMouseLeave;

            if (calendar.eventBarVisible && !cache.barHidden) {
                var bar = createDiv();
                bar.className = calendar._prefixCssClass("_event_bar");
                bar.style.position = "absolute";

                if (cache.barColor) {
                    bar.style.backgroundColor = cache.barColor;
                }

                div.appendChild(bar);
            }

            var options = {
                "eventDiv": div,
                "areas": cache.areas,
                "allowed": function() {
                    var dragging = calendar._draggingFromQueue || calendar._draggingFromScheduler;
                    return !dragging;
                }
            };

            var e = new DayPilot.Event(data, calendar);
            e.cache = cache;
            div.event = e;
            DayPilot.Areas.attach(div, e, options);

            calendar._makeDraggable(div, data);
            target.appendChild(div);

            calendar.elements.events.push(div);

        };

        this._onEventMouseMove = function(ev) {
            if (typeof (DayPilot.Bubble) !== 'undefined' && calendar.bubble && calendar.eventHoverHandling === 'Bubble') {
                calendar.bubble.showEvent(this.event);
            }
        };

        this._onEventMouseLeave = function(ev) {
            if (calendar.bubble) {
                calendar.bubble.hideOnMouseOut();
            }
        };

        this._onContextMenu = function(ev) {
            ev.preventDefault();

            if (calendar.eventRightClickHandling === "Disabled") {
                return;
            }

            var div = this;
            var e = div.event;
            var args = {};
            args.e = div.event;
            args.preventDefault = function() {
                args.preventDefault.value = true;
            };

            if (typeof calendar.onEventRightClick === "function") {
                calendar.onEventRightClick(args);
            }

            if (args.preventDefault.value) {
                return;
            }

            switch (calendar.eventRightClickHanding) {
                case "Enabled":
                    break;
                case "ContextMenu":
                    var menu = e.client.contextMenu();

                    if (menu) {
                        menu.show(e);
                    }
                    else {
                        if (calendar.contextMenu) {
                            calendar.contextMenu.show(e);
                        }
                    }
                    break;
            }

            if (typeof calendar.onEventRightClicked === "function") {
                calendar.onEventRightClicked(args);
            }

        };

        this._onEventClick = function(ev) {
            ev.preventDefault();
            ev.stopPropagation();

            if (typeof (DayPilot.Bubble) !== 'undefined') {
                DayPilot.Bubble.hideActive();
            }

            if (calendar.eventClickHandling  === "Disabled") {
                return;
            }
            var div = this;
            var e = div.event;

            var args = {};
            args.e = e;
            args.preventDefault = function() {
                args.preventDefault.value = true;
            };

            if (typeof calendar.onEventClick === "function") {
                calendar.onEventClick(args);
            }

            if (args.preventDefault.value) {
                return;
            }

            switch (calendar.eventClickHandling) {
                case "Select":
                    calendar._eventSelectDispatch(div, e, ev);
                    break;
                case "Enabled":
                    break;
            }

            if (typeof calendar.onEventClicked === "function") {
                calendar.onEventClicked(args);
            }

        };

        this._eventSelectDispatch = function(div, e, ev) {
            var args = {};
            args.e = e;
            args.preventDefault = function() {
                this.preventDefault.value = true;
            };

            if (typeof calendar.onEventSelect === 'function') {
                calendar.onEventSelect(args);
                if (args.preventDefault.value) {
                    return;
                }
            }

            switch (calendar.eventSelectHandling) {
                case 'Update':
                    calendar._selection._select(div);
                    break;
            }

            if (typeof calendar.onEventSelected === 'function') {
                calendar.onEventSelected(args);
            }

        };

        this._onDropFromScheduler = function (data, source) {
            // add, fire move with external flag
            var position = calendar._position;

            var args = {};
            args.e = new DayPilot.Event(data, calendar);
            args.position = position;
            args.source = source;
            args.external = true;
            args.preventDefault = function() {
                args.preventDefault.value = true;
            };

            calendar._doOnEventMove(args);
            if (args.preventDefault.value) {
                return;
            }

            calendar.events.list.splice(position, 0, data);
            calendar._update();

            calendar._doOnEventMoved(args);

            // calendar.events.list.push(data);
            // calendar._drawEvent(data);
        };

        this._onDropFromQueue = function (data) {

            var args = {};
            args.e = new DayPilot.Event(data, calendar);
            args.position = calendar._position;
            args.source = calendar;
            args.external = false;
            args.preventDefault = function() {
                args.preventDefault.value = true;
            };

            calendar._doOnEventMove(args);
            if (args.preventDefault.value) {
                return;
            }

            // reorder
            var originalPosition = calendar.events.list.indexOf(data);
            calendar._moveInArray(calendar.events.list, originalPosition, calendar._position);
            calendar._update();

            calendar._doOnEventMoved(args);
        };

        this._doOnEventMove = function(args) {
            if (typeof calendar.onEventMove === "function") {
                calendar.onEventMove(args);
            }
        };

        this._doOnEventMoved = function(args) {
            if (typeof calendar.onEventMoved === "function") {
                calendar.onEventMoved(args);
            }
        };

        this._moveInArray = function (array, src, target) {
            var item = array[src];
            array.splice(src, 1);
            array.splice(target, 0, item);
        };


        this._registerDropTarget = function () {

            DayPilot.Scheduler.registerDropTarget({
                element: calendar.nav.top,
                onDrop: function (args) {
                    calendar._draggingFromScheduler = false;
                    var e = args.e;
                    var data = e.data;
                    var source = args.e.calendar;
                    calendar._onDropFromScheduler(data, source);
                },
                onDragOver: function (args) {
                    calendar._draggingFromScheduler = true;
                },
                onDragLeave: function (args) {
                    calendar._draggingFromScheduler = false;
                }
            });

        };

        this._indicator = null;
        this._indicatorShow = function (position) {
            calendar._position = position;
            var div = calendar._indicator || createDiv();
            var target = calendar.nav.container;
            var height = 2;

            var unit = calendar.eventHeight + calendar.lineSpace;

            var top = position * unit;
            var minus = calendar.lineSpace / 2 + height / 2;
            top -= minus;

            div.style.top = top + "px";

            if (!calendar._indicator) {
                div.className = calendar._prefixCssClass("_shadow");
                div.style.position = "absolute";
                div.style.left = "0px";
                div.style.right = "0px";
                div.style.height = height + "px";

                calendar._indicator = div;
                target.appendChild(div);
            }

        };

        this._indicatorHide = function () {
            calendar._position = null;
            DayPilot.de(calendar._indicator);
            calendar._indicator = null;
        };


        this._coords = null;
        this._position = null;
        this._onContainerMouseMove = function (ev) {
            var target = calendar.nav.container;
            var coords = DayPilot.mo3(target, ev);
            calendar._coords = coords;

            var dragging = calendar._draggingFromQueue || calendar._draggingFromScheduler;
            if (dragging) {
                var unit = calendar.eventHeight + calendar.lineSpace;
                var position = Math.floor((coords.y + calendar.eventHeight / 2) / unit);
                if (position < 0) {
                    position = 0;
                }
                if (position > calendar._events.length) {
                    position = calendar._events.length;
                }

                calendar._indicatorShow(position);
            }

        };

        this._onContainerMouseLeave = function (ev) {
            calendar._indicatorHide();
        };

        this._onContainerMouseUp = function (ev) {
            if (calendar._draggingFromQueue) {
                var data = calendar._draggingFromQueueSource;
                calendar._onDropFromQueue(data);
                calendar._draggingFromQueueSource = null;
            }
        };

        this._initTop = function () {
            var container = createDiv();
            calendar.nav.container = container;
            var target = calendar.nav.top;

            calendar._initialMainCss = target.className || "";

            container.style.position = "relative";
            target.onmousemove = calendar._onContainerMouseMove;
            target.onmouseleave = calendar._onContainerMouseLeave;
            target.onmouseup = calendar._onContainerMouseUp;
            target.appendChild(container);
        };

        this._makeDraggable = function (div, data) {
            var e = div;

            // var duration = typeof data.duration === "number" ? DayPilot.Duration.ofSeconds(data.duration) : data.duration;
            // duration = duration ? duration : new DayPilot.Duration(data.start, data.end);

            var item = {
                element: e,
                data: data,
                keepElement: true,
                externalCssClass: "",
                externalHtml: "",
                onDragStart: function (args) {
                    calendar._draggingFromQueue = true;
                    calendar._draggingFromQueueSource = data;
                    e.style.opacity = "0.5";
                },
                onDrop: function (args) {
                    calendar._draggingFromQueue = false;
                    e.style.opacity = "";
                    // calendar.events.remove(data);
                    var droppedOutside = !!calendar._draggingFromQueueSource;
                },
            };
            DayPilot.Scheduler.makeDraggable(item);

        };

        this._loadOptions = function(options) {

            if (!options) {
                return;
            }

            var specialHandling = {
                "events": {
                    "preInit": function() {
                        var events = this.data;
                        if (!events) {
                            // This.cards.list = [];
                            return;
                        }
                        calendar.events.list = events;
                    }
                },
            };

            for (var name in options) {
                if (specialHandling[name]) {
                    var item = specialHandling[name];
                    item.data = options[name];
                    if (item.preInit) {
                        item.preInit();
                    }
                }
                else {
                    calendar[name] = options[name];
                }
            }
        };

        this._react = {};
        this._react.reactDOM = null;
        this._react.react = null;
        this._react._render = function(component, target) {
            var rd = calendar._react.reactDOM;
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
        this._react._unmount = function(target) {
            var rd = calendar._react.reactDOM;
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


        this._findEventDiv = function(e) {
            if (!e) {
                return null;
            }
            for (var i = 0; i < calendar.elements.events.length; i++) {
                var div = calendar.elements.events[i];
                if (DayPilot.Util.isSameEvent(div.event, e)) {
                    return div;
                }
            }
            return null;
        };

        this.multiselect = {};

        this.multiselect.add = function(data) {
            if (typeof data === "number" || typeof data === "string") {
                data = calendar.events.find(data);
            }
            if (data instanceof DayPilot.Event) {
                data = data.data;
            }
            var div = calendar._findEventDiv(data);
            if (div) {
                calendar._selection._select(div);
            }
        };

        this.multiselect.clear = function() {
            calendar._selection._deselect();
        };

        this.multiselect.get = function() {
            var list = [];
            var current = sel._list[0];
            if (current) {
                var e = current.event;
                list.push(e);
            }
            return list;
        };

        this.events.add = function (data) {
            if (data instanceof DayPilot.Event) {
                data = data.data;
            }
            calendar.events.list.push(data);
            calendar._update();
        };

        this.events.remove = function (data) {
            if (!data) {
                return;
            }
            if (typeof data === "number" || typeof data === "string") {
                data = calendar.events.find(data);
            }
            if (data instanceof DayPilot.Event) {
                data = data.data;
            }

            var i = calendar.events.list.indexOf(data);

            if (i === -1) {
                return;
            }

            if (calendar._selection._shouldBeSelected(data.id)) {
                calendar.multiselect.clear();
            }

            calendar.events.list.splice(i, 1);
            calendar._update();
        };


        this.events.update = function(data) {
            if (data instanceof DayPilot.Event) {
                data = data.data;
            }

            var inSrc = calendar.events.find(data.id);
            if (!inSrc) {
                return;
            }

            var i = calendar.events.list.indexOf(inSrc.data);
            if (i === -1) {
                return;
            }
            calendar.events.list.splice(i, 1, data);
            calendar._update();

        };

        this.events.find = function (id) {
            var data = calendar.events.list.find(function (item) {
                return item.id === id;
            });
            if (!data) {
                return null;
            }
            return new DayPilot.Event(data, calendar);
        };

        this.init = function () {
            if (this._initialized) {
                throw new DayPilot.Exception("This instance is already initialized. Use update() to change properties.");
            }
            this._loadTop();

            if (this.nav.top.dp) {
                if (this.nav.top.dp === calendar) {
                    return calendar;
                }
                throw new DayPilot.Exception("The target placeholder was already initialized by another DayPilot component instance.");
            }

            this._registerDropTarget();
            this._initTop();
            this._update();

            return this;

        };

        this.update = function (options) {
            if (calendar._disposed) {
                throw new DayPilot.Exception("You are trying to update a DayPilot.Queue object that has been disposed already. Calling .dispose() destroys the object and makes it unusable.");
            }

            calendar._loadOptions(options);
            calendar._update();
        };

        this.dispose = function() {
            calendar.nav.top.innerHTML = "";
            calendar._disposed = true;
        };

        this.internal = {};
        this.internal.loadOptions = function(options) {
            calendar._loadOptions(options);
        };
        this.internal.enableReact = function (react, reactDOM) {
            calendar._react.react = react;
            calendar._react.reactDOM = reactDOM;
        };
        this.internal.reactRefs = function() {
            return DayPilot.Util.copyProps(calendar._react, {}, ["react", "reactDOM"]);
        };
        this.internal.findEventDiv = this._findEventDiv;

        this._loadOptions(options);
    };

    DayPilot.Queue.def = {};

})(DayPilot);
