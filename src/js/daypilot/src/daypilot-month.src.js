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
    

    var doNothing = function() { };

    if (typeof DayPilot.Month !== 'undefined' && DayPilot.Month.def) {
        return;
    }

    var DayPilotMonth = {};

    DayPilot.Month = function(id, options) {
        this.v = '2023.2.5592';

        this.nav = {};

        var calendar = this;

        this.id = id;
        this.isMonth = true;
        this.api = 2;
        this._initialized = false;

        this.hideUntilInit = true;

        this.startDate = new DayPilot.Date(); // today
        this.width = null; // default width is auto
        if (typeof DayPilot.Bubble === "function") { this.bubble = new DayPilot.Bubble(); } else { this.bubble = null; }
        this.cssClassPrefix = "month_default";
        this.cellHeight = 100; // default cell height is 100 pixels (it's a minCellHeight, it will be extended if needed)
        this.cellMarginBottom = 0;
        this.allowMultiSelect = true;
        this.autoRefreshCommand = 'refresh';
        this.autoRefreshEnabled = false;
        this.autoRefreshInterval = 60;
        this.autoRefreshMaxCount = 20;
        this.doubleClickTimeout = 300;
        this.eventEndSpec = "DateTime";
        this.eventTextWrappingEnabled = false;
        this.headerHeight = 30;
        this.heightSpec = "Auto";
        this.weekStarts = "Auto";
        this.eventBarVisible = true;
        this.eventHeight = 25;
        this.cellHeaderHeight = 24;
        this.clientState = {};

        this.afterRender = function() { };
        this.cssOnly = true;
        this.eventsLoadMethod = "GET";
        this.initEventEnabled = false;
        this.lineSpace = 1;
        this.loadingLabelVisible = true;
        this.loadingLabelText = "Loading...";
        this.loadingLabelHtml = null;
        this.locale = "en-us";
        this.maxEvents = "All";
        this.messageHideAfter = 5000;
        this.notifyCommit = 'Immediate'; // or 'Queue'
        this.visible = true;

        this.eventMoveToPosition = false;

        this.eventStartTime = false;
        this.eventEndTime = false;
        this.eventStartEndWidth = 45;

        this.showWeekend = true;
        this.cellMode = false;
        this.shadowType = "Fill";
        this.tapAndHoldTimeout = 300;
        this.timeFormat = "Auto";
        this.viewType = 'Month';
        this.weeks = 1;
        this.xssProtection = "Enabled"; // "Disabled"

        this.cellHeaderClickHandling = "Enabled";
        this.eventClickHandling = 'Enabled';
        this.eventDeleteHandling = "Disabled";
        this.eventDoubleClickHandling = 'Disabled';
        this.eventMoveHandling = 'Update';
        this.eventResizeHandling = 'Update';
        this.eventRightClickHandling = 'ContextMenu';
        this.eventSelectHandling = 'Update';
        this.headerClickHandling = "Enabled";
        this.timeRangeSelectedHandling = 'Enabled';
        this.timeRangeDoubleClickHandling = 'Disabled';

        this.onEventFilter = null;
        this.onBeforeEventRender = null;
        this.onBeforeCellRender = null;
        this.onBeforeHeaderRender = null;

        this.onBeforeEventDomAdd = null;
        this.onBeforeEventDomRemove = null;

        this.onBeforeEventExport = null;
        this.onBeforeCellExport = null;
        this.onBeforeHeaderExport = null;

        this.onCellHeaderClick = null;
        this.onCellHeaderClicked = null;

        this.backendUrl = null;
        this.cellEvents = [];

        this.elements = {};
        this.elements.events = [];

        this._cache = {};
        this._cache.events = {}; // register DayPilotMonth.Event objects here, key is the data event, reset during drawevents

        this.events = {};

        this._autoRefreshCount = 0;

        this.members = {};
        this.members.ignore = [
            "internal",
            "nav",
            "debug",
            "temp",
            "elements",
            "members",
            "cellProperties"
        ];

        this._productCode = 'javasc';

        this._updateView = function(result, context) {

            var result = JSON.parse(result);

            if (result.BubbleGuid) {
                var guid = result.BubbleGuid;
                var bubble = this.bubbles[guid];
                delete this.bubbles[guid];

                calendar._loadingStop();
                if (typeof result.Result.BubbleHTML !== 'undefined') {
                    bubble.updateView(result.Result.BubbleHTML, bubble);
                }
                return;
            }

            if (result.CallBackRedirect) {
                document.location.href = result.CallBackRedirect;
                return;
            }

            if (typeof result.ClientState !== 'undefined') {
                calendar.clientState = result.ClientState;
            }

            if (result.UpdateType === "None") {

                calendar._fireAfterRenderDetached(result.CallBackData, true);

                if (result.Message) {
                    calendar.message(result.Message);
                }
                calendar._loadingStop();
                return;
            }

            // config
            if (result.VsUpdate) {
                var vsph = document.createElement("input");
                vsph.type = 'hidden';
                vsph.name = calendar.id + "_vsupdate";
                vsph.id = vsph.name;
                vsph.value = result.VsUpdate;
                calendar._vsph.innerHTML = '';
                calendar._vsph.appendChild(vsph);
            }

            calendar.events.list = result.Events;

            if (typeof result.TagFields !== 'undefined') {
                calendar.tagFields = result.TagFields;
            }

            if (typeof result.SortDirections !== 'undefined') {
                calendar.sortDirections = result.SortDirections;
            }

            if (result.UpdateType === "Full") {
                // generated
                calendar.cellProperties = result.CellProperties;
                calendar.headerProperties = result.HeaderProperties;

                // properties
                calendar.startDate = result.StartDate;
                if (typeof result.ShowWeekend !== 'undefined') { calendar.showWeekend = result.ShowWeekend; } // number, can be 0
                //calendar.showWeekend = result.ShowWeekend ? result.ShowWeekend : calendar.showWeekend;
                // calendar.headerBackColor = result.HeaderBackColor ? result.HeaderBackColor : calendar.headerBackColor;
                // calendar.backColor = result.BackColor ? result.BackColor : calendar.backColor;
                // calendar.nonBusinessBackColor = result.NonBusinessBackColor ? result.NonBusinessBackColor : calendar.nonBusinessBackColor;
                calendar.locale = result.Locale ? result.Locale : calendar.locale;
                calendar.timeFormat = result.TimeFormat ? result.TimeFormat : calendar.timeFormat;
                if (typeof result.WeekStarts !== 'undefined') { calendar.weekStarts = result.WeekStarts; } // number, can be 0

                calendar.hashes = result.Hashes;
            }

            calendar.multiselect.clear(true);
            calendar.multiselect.initList = result.SelectedEvents;

            calendar._deleteEvents();
            calendar._prepareRows();
            calendar._loadEvents();

            if (result.UpdateType === "Full") {
                calendar._clearTable();
                calendar._drawTable();
            }
            calendar._updateHeight();

            calendar._show();

            calendar._drawEvents();

            calendar._fireAfterRenderDetached(result.CallBackData, true);

            calendar._startAutoRefresh();

            if (result.Message) {
                calendar.message(result.Message);
            }

            calendar._loadingStop();

        };

        this._fireAfterRenderDetached = function(data, isCallBack) {
            var afterRenderDelayed = function(data, isc) {
                return function() {
                    if (calendar._api2()) {
                        if (typeof calendar.onAfterRender === 'function') {
                            var args = {};
                            args.isCallBack = isc;
                            args.data = data;

                            calendar.onAfterRender(args);
                        }
                    }
                    else {
                        if (calendar.afterRender) {
                            calendar.afterRender(data, isc);
                        }
                    }
                };
/*
                return function() {
                    if (calendar.afterRender) {
                        calendar.afterRender(data, isc);
                    }
                };*/
            };

            window.setTimeout(afterRenderDelayed(data, isCallBack), 0);
        };

        this._api2 = function() {
            return calendar.api === 2;
        };

        this._xssTextHtml = function(text, html) {

            if (calendar._resolved._xssProtectionEnabled()) {
                return DayPilot.Util.escapeTextHtml(text, html);
            }

            if (!DayPilot.Util.isNullOrUndefined(html)) {
                return html;
            }
            if (DayPilot.Util.isNullOrUndefined(text)) {
                return "";
            }
            return text;
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

        this._loadEvents = function() {

            if (!this.events.list) {
                return;
            }

            if (typeof this.onBeforeEventRender === 'function') {
                var length = this.events.list.length;
                for (var i = 0; i < length; i++) {
                    this._doBeforeEventRender(i);
                }
            }

            if (this.cellMode) {
                this._loadEventsCells();
            }
            else {
                this._loadEventsRows();
            }

        };

        this._loadingStart = function(immediately) {

            var delay = immediately ? 0 : 100;
            if (calendar.loadingTimeout) {
                window.clearTimeout(calendar.loadingTimeout);
            }

            calendar.loadingTimeout = window.setTimeout(function() {
                if (calendar.loadingLabelVisible && calendar.nav.loading) {
                    calendar.nav.loading.style.top = (resolved.headerHeight() + 5) + "px";
                    calendar.nav.loading.innerHTML = calendar._xssTextHtml(this.loadingLabelText, this.loadingLabelHtml);
                    calendar.nav.loading.style.display = '';
                }
            }, delay);
        };

        this._loadingStop = function() {

            if (this.loadingTimeout) {
                window.clearTimeout(this.loadingTimeout);
            }

            if (calendar.nav.loading) {
                this.nav.loading.style.display = 'none';
            }
        };


        this._loadEventsRows = function() {

            if (!this.events.list) {
                return;
            }

            // prepare rows and columns
            for (var x = 0; x < this.events.list.length; x++) {
                var e = this.events.list[x];

                if (typeof e !== "object") {
                    throw new DayPilot.Exception("Event data item must be an object");
                }
                if (!e.start) {
                    throw new DayPilot.Exception("Event data item must specify 'start' property");
                }

                var cache = null;
                if (typeof calendar.onBeforeEventRender === 'function') {
                    //var index = DayPilot.indexOf(calendar.events.list, e);
                    cache = calendar._cache.events[x];
                }

                if (cache) {
                    if (cache.hidden) {
                        continue;
                    }
                }
                else if (e.hidden) {
                    continue;
                }

                var start = new DayPilot.Date(e.start);
                var end = new DayPilot.Date(e.end);

                end = calendar._adjustEndIn(end);

                if (start.getTime() > end.getTime()) { // skip invalid events, zero duration allowed
                    continue;
                }
                for (var i = 0; i < this.rows.length; i++) {
                    var row = this.rows[i];
                    if (row.belongsHere(start, end)) {
                        var ep = new DayPilot.Event(e, calendar);

                        if (typeof calendar.onEventFilter === "function" && calendar.events._filterParams) {
                            var args = {};
                            args.filter = calendar.events._filterParams;
                            args.visible = true;
                            args.e = ep;

                            calendar.onEventFilter(args);

                            if (!args.visible) {
                                break;
                            }
                        }

                        row.events.push(ep);

                        if (typeof this.onBeforeEventRender === 'function') {
                            ep.cache = this._cache.events[x];
                        }
                    }
                }
            }

            // arrange events into lines
            for (var ri = 0; ri < this.rows.length; ri++) {
                var row = this.rows[ri];
                row.events.sort(this._eventComparerCustom);

                for (var ei = 0; ei < this.rows[ri].events.length; ei++) {
                    var ev = row.events[ei];
                    var colStart = row.getStartColumn(ev);
                    var colWidth = row.getWidth(ev);
                    //var line = row.putIntoLine(ev, colStart, colWidth, ri);
                    row.putIntoLine(ev, colStart, colWidth, ri);
                }
            }

        };

        this._loadEventsCells = function() {
            this.cellEvents = [];
            for (var x = 0; x < this._getColCount(); x++) {
                this.cellEvents[x] = [];

                for (var y = 0; y < this.rows.length; y++) {
                    var cell = {};
                    var d = this.firstDate.addDays(y * 7 + x);

                    cell.start = d;
                    cell.end = d.addDays(1);
                    cell.events = [];

                    this.cellEvents[x][y] = cell;
                }
            }

            // prepare rows and columns
            for (var i = 0; i < this.events.list.length; i++) {
                var e = this.events.list[i];

                if (typeof e !== "object") {
                    throw new DayPilot.Exception("Event data item must be an object");
                }
                if (!e.start) {
                    throw new DayPilot.Exception("Event data item must specify 'start' property");
                }

                var cache = null;
                if (typeof calendar.onBeforeEventRender === 'function') {
                    //var index = DayPilot.indexOf(calendar.events.list, e);
                    cache = calendar._cache.events[i];
                }

                if (cache) {
                    if (cache.hidden) {
                        continue;
                    }
                }
                else if (e.hidden) {
                    continue;
                }

                var start = new DayPilot.Date(e.start);
                var end = new DayPilot.Date(e.start); // we ignore the end date in cellMode

                end = calendar._adjustEndIn(end);

                if (start.getTime() > end.getTime()) { // skip invalid events, zero duration allowed
                    continue;
                }

                for (var x = 0; x < this._getColCount(); x++) {
                    for (var y = 0; y < this.rows.length; y++) {
                        var cell = this.cellEvents[x][y];
                        if (start.getTime() >= cell.start.getTime() && start.getTime() < cell.end.getTime()) {
                            var ep = new DayPilot.Event(e, calendar);

                            if (typeof calendar.onEventFilter === "function" && calendar.events._filterParams) {
                                var args = {};
                                args.filter = calendar.events._filterParams;
                                args.visible = true;
                                args.e = ep;

                                calendar.onEventFilter(args);

                                if (!args.visible) {
                                    continue;
                                }
                            }

                            cell.events.push(ep);

                            if (typeof this.onBeforeEventRender === 'function') {
                                ep.cache = this._cache.events[i];
                            }
                        }
                    }
                }
            }

            for (var x = 0; x < this._getColCount(); x++) {
                for (var y = 0; y < this.rows.length; y++) {
                    var cell = this.cellEvents[x][y];
                    cell.events.sort(this._eventComparerCustom);
                }
            }
        };

        this._deleteEvents = function() {
            for (var i = 0; i < this.elements.events.length; i++) {
                var div = this.elements.events[i];

/*
                if (typeof calendar.onDomRemoveEvent === "function") {
                    var domArgs = div.domArgs;
                    div.domArgs = null;
                    calendar.onDomRemoveEvent(domArgs);
                }
*/

                (function domRemove() {
                    var domArgs = div.domArgs;
                    div.domArgs = null;

                    // legacy, to be removed
                    if (typeof calendar.onDomRemoveEvent === "function") {
                        calendar.onDomRemoveEvent(domArgs);
                    }
                    if (domArgs && typeof calendar.onBeforeEventDomRemove === "function") {
                        calendar.onBeforeEventDomRemove(domArgs);
                    }

                    if (domArgs && typeof calendar.onBeforeEventDomAdd === "function" && calendar._react.reactDOM) {
                        var target = domArgs && domArgs._targetElement;
                        if (target) {
                            var isReact = DayPilot.Util.isReactComponent(domArgs.element);
                            if (isReact) {
                                if (!calendar._react.reactDOM) {
                                    throw new DayPilot.Exception("Can't reach ReactDOM");
                                }
                                calendar._react._unmount(target);
                            }
                        }
                    }

                })();

                div.event = null;
                div.click = null;
                div.parentNode.removeChild(div);
            }

            this.elements.events = [];

        };

        this._drawEvents = function() {
            this._cache.events = {};  // reset DayPilotMonth.Event object cache

            if (this.cellMode) {
                this._drawEventsCells();
            }
            else {
                this._drawEventsRows();
            }

            this.multiselect.redraw();

        };

        this._drawEventsCells = function() {
            this.elements.events = [];

            if (this.cellEvents.length === 0) {
                return;
            }

            for (var x = 0; x < this._getColCount(); x++) {
                for (var y = 0; y < this.rows.length; y++) {
                    var cell = this.cellEvents[x][y];
                    var div = this.cells[x][y];

                    for (var i = 0; i < cell.events.length; i++) {

                        var ep = cell.events[i];

                        //var eventPart = {};
                        //eventPart.event = cell.events[i];
                        ep.part.colStart = x;
                        ep.part.colWidth = 1;
                        ep.part.row = y;
                        ep.part.line = i;
                        ep.part.startsHere = true;
                        ep.part.endsHere = true;

                        this._drawEvent(ep);

                    }
                }
            }

        };

        this._drawEventsRows = function() {
            this.elements.events = [];

            var max = typeof calendar.maxEvents === "number" ? calendar.maxEvents: 1000;

            // draw events
            for (var ri = 0; ri < this.rows.length; ri++) {
                var row = this.rows[ri];

                for (var li = 0; li < row.lines.length; li++) {
                    var line = row.lines[li];

                    if (li >= max) {
                        continue;
                    }

                    for (var pi = 0; pi < line.length; pi++) {
                        this._drawEvent(line[pi]);
                    }
                }
            }

        };

        this._eventComparer = function(a, b) {
            if (!a || !b || !a.start || !b.start) {
                return 0; // no sorting, invalid arguments
            }

            var byStart = a.start().ticks - b.start().ticks;
            if (byStart !== 0) {
                return byStart;
            }

            var byEnd = b.end().ticks - a.end().ticks; // desc
            return byEnd;
        };

        this._eventComparerCustom = function(a, b) {
            if (!a || !b) {
                //calendar.debug("no sorting, invalid arguments");
                return 0; // no sorting, invalid arguments
            }

            if (!a.data || !b.data || !a.data.sort || !b.data.sort || a.data.sort.length === 0 || b.data.sort.length === 0) { // no custom sorting, using default sorting (start asc, end asc);
                return calendar._eventComparer(a, b);
            }

            var result = 0;
            var i = 0;
            while (result === 0 && typeof a.data.sort[i] !== "undefined" && typeof b.data.sort[i] !== "undefined") {
                if (a.data.sort[i] === b.data.sort[i]) {
                    result = 0;
                }
                else if (typeof a.data.sort[i] === "number" && typeof b.data.sort[i] === "number") {
                    result = a.data.sort[i] - b.data.sort[i];
                }
                else {
                    result = calendar._stringComparer(a.data.sort[i], b.data.sort[i], calendar.sortDirections[i]);
                }
                i++;
            }

            return result;
        };

        this._stringComparer = function(a, b, direction) {
            var asc = (direction !== "desc");
            var aFirst = asc ? -1 : 1;
            var bFirst = -aFirst;

            if (a === null && b === null) {
                return 0;
            }
            // nulls first
            if (b === null) { // b is smaller
                return bFirst;
            }
            if (a === null) {
                return aFirst;
            }

            //return asc ? a.localeCompare(a, b) : -a.localeCompare(a, b);

            var ar = [];
            ar[0] = a;
            ar[1] = b;

            ar.sort();

            return a === ar[0] ? aFirst : bFirst;
        };

        this._drawShadow = function(x, y, line, width, offset, e) {

            if (!offset) {
                offset = 0;
            }


            var disabled = (function checkDisabled() {
                for (var i = 0; i < width; i++) {
                    var pos = x + 7*y + i - offset;
                    if (pos < 0) {
                        continue;
                    }

                    var cx = pos % 7;
                    var cy = Math.floor(pos / 7);

                    var maxRow = calendar.rows.length - 1;
                    if (cy > maxRow) {
                        continue;
                    }

                    var disabled = calendar.cells[cx][cy].props.disabled;
                    if (disabled) {
                        return true;
                    }
                }
            })();

            var remains = width;

            this.shadow = {};
            this.shadow.list = [];
            this.shadow.start = { x: x, y: y };
            this.shadow.width = width;
            this.shadow.disabled = disabled;

            if (this.eventMoveToPosition) {
                remains = 1;
                this.shadow.position = line;
            }

            // something before the first day
            var hidden = y * 7 + x - offset;
            if (hidden < 0) {
                remains += hidden;
                x = 0;
                y = 0;
            }

            var remainingOffset = offset;
            while (remainingOffset >= 7) {
                y--;
                remainingOffset -= 7;
            }
            if (remainingOffset > x) {
                var plus = 7 - this._getColCount();
                if (remainingOffset > (x + plus)) {
                    y--;
                    x = x + 7 - remainingOffset;
                }
                else {
                    remains = remains - remainingOffset + x;
                    x = 0;
                }
            }
            else {
                x -= remainingOffset;
            }

            if (y < 0) {
                y = 0;
                x = 0;
            }

            var cursor = null;
            if (DayPilotMonth.resizingEvent) {
                cursor = 'w-resize';
            }
            else if (DayPilotMonth.movingEvent) {
                cursor = "move";
            }

            this.nav.top.style.cursor = cursor;

            while (remains > 0 && y < this.rows.length) {
                var drawNow = Math.min(this._getColCount() - x, remains);
                var row = this.rows[y];

                /*
                if (!row) {
                return;
                }
                */

                var top = this._getRowTop(y);
                var height = row.getHeight();

                if (this.eventMoveToPosition) {
                    top = this._getEventTop(y, line);
                    height = 2;
                }

                var shadow = document.createElement("div");
                shadow.setAttribute("unselectable", "on");
                shadow.style.position = 'absolute';
                shadow.style.left = (this._getCellWidth() * x) + '%';
                shadow.style.width = (this._getCellWidth() * drawNow) + '%';
                shadow.style.top = (top) + 'px';
                shadow.style.height = (height) + 'px';
                shadow.style.cursor = cursor;

                var inside = document.createElement("div");
                inside.setAttribute("unselectable", "on");
                shadow.appendChild(inside);

                shadow.className = this._prefixCssClass("_shadow");
                inside.className = this._prefixCssClass("_shadow_inner");

                if (disabled) {
                    DayPilot.Util.addClass(shadow, this._prefixCssClass("_shadow_forbidden"));
                }

                var ref = this.nav.events;

                ref.appendChild(shadow);
                this.shadow.list.push(shadow);

                remains -= (drawNow + 7 - this._getColCount());
                x = 0;
                y++;
            }

        };

        this._clearShadow = function() {
            if (this.shadow) {
                var ref = this.nav.events;
                DayPilot.de(this.shadow.list);
                /*
                for (var i = 0; i < this.shadow.list.length; i++) {
                    ref.removeChild(this.shadow.list[i]);
                }*/
                this.shadow = null;
                this.nav.top.style.cursor = '';
            }

        };

        this._getEventTop = function(row, line) {
            //var top = this.headerHeight;
            var top = 0;
            for (var i = 0; i < row; i++) {
                top += this.rows[i].getHeight();
            }
            top += this.cellHeaderHeight; // space on top
            top += line * resolved.lineHeight();
            return top;
        };

        this._getDateFromCell = function(x, y) {
            return this.firstDate.addDays(y * 7 + x);
        };

        this._doBeforeEventRender = function(i) {
            var cache = this._cache.events;
            var data = this.events.list[i];
            var evc = {};

            // make a copy
            for (var name in data) {
                evc[name] = data[name];
            }

            if (typeof this.onBeforeEventRender === 'function') {
                var args = {};
                args.e = evc;
                args.data = evc;
                this.onBeforeEventRender(args);
            }

            cache[i] = evc;

        };

        this._drawEvent = function(ep) { // row, startCol, widthCols, text
            var cellMode = this.cellMode;

            //var ev = ep.data;
            var row = ep.part.row;
            var line = ep.part.line;
            var colStart = ep.part.colStart;
            var colWidth = ep.part.colWidth;

            var cache = ep.cache || ep.data;

            var left = cellMode ? 0 : this._getCellWidth() * (colStart);
            var width = cellMode ? 100 : this._getCellWidth() * (colWidth);
            var top = cellMode ? line * resolved.lineHeight() : this._getEventTop(row, line);

            var div = document.createElement("div");
            div.setAttribute("unselectable", "on");
            div.style.height = resolved.eventHeight() + 'px';

            div.style.position = "relative";
            div.style.overflow = "hidden";
            div.className = this._prefixCssClass("_event");

            if (cache.cssClass) {
                DayPilot.Util.addClass(div, cache.cssClass);
            }

            div.event = ep;

            if (cellMode) {
                div.style.marginRight = "2px";
                div.style.marginBottom = "2px";
                //e.style.position = 'relative';
            }
            else {
                div.style.width = width + '%';
                div.style.position = 'absolute';
                div.style.left = left + '%';
                div.style.top = top + 'px'; // plus space on top
            }

            if (this.showToolTip && cache.toolTip && !this.bubble) {
                div.title = cache.toolTip;
            }

            if (!calendar.eventTextWrappingEnabled) {
                div.style.whiteSpace = "nowrap";
            }

            div.onclick = this._onEventClick;
            div.ondblclick = this._onEventDoubleClick;
            div.oncontextmenu = this._onEventContextMenu;
            div.onmousedown = this._onEventMouseDown;
            div.onmousemove = this._onEventMouseMove;
            div.onmouseout = this._onEventMouseOut;

            DayPilot.reNonPassive(div, "touchstart", touch.onEventTouchStart);
            DayPilot.rePassive(div, "touchmove", touch.onEventTouchMove);
            DayPilot.rePassive(div, "touchend", touch.onEventTouchEnd);

            if (!ep.part.startsHere) {
                DayPilot.Util.addClass(div, this._prefixCssClass("_event_continueleft"));
            }
            if (!ep.part.endsHere) {
                DayPilot.Util.addClass(div, this._prefixCssClass("_event_continueright"));
            }

            var inner = document.createElement("div");
            inner.setAttribute("unselectable", "on");
            inner.className = this._prefixCssClass("_event_inner");
            if (cache.fontColor) {
                inner.style.color = cache.fontColor;
            }
            if (cache.borderColor) {
                if (cache.borderColor === "darker" && cache.backColor) {
                    inner.style.borderColor = DayPilot.ColorUtil.darker(cache.backColor, 2);
                }
                else {
                    inner.style.borderColor = cache.borderColor;
                }
            }

            if (cache.backColor) {
                inner.style.background = cache.backColor;
            }

            if (cache.backImage) {
                inner.style.backgroundImage = "url(" + cache.backImage + ")";
                if (cache.backRepeat) {
                    inner.style.backgroundRepeat = cache.backRepeat;
                }
            }

            div.appendChild(inner);

            if (ep.client.barVisible()) {

                var bar = document.createElement("div");
                bar.setAttribute("unselectable", "on");
                bar.className = this._prefixCssClass("_event_bar");
                bar.style.position = "absolute";

                var barInner = document.createElement("div");
                barInner.setAttribute("unselectable", "on");
                barInner.className = this._prefixCssClass("_event_bar_inner");
                barInner.style.top = "0%";
                barInner.style.height = "100%";

                if (cache.barColor) {
                    barInner.style.backgroundColor = cache.barColor;
                }

                bar.appendChild(barInner);
                div.appendChild(bar);
            }

            var locale = this._resolved.locale();
            var startEndWidth = calendar.eventStartEndWidth;
            if (this.eventStartTime || cache.htmlStart) {
                //var text = DayPilot.DateUtil.hours(ep.start(), resolved.timeFormat() === 'Clock12Hours');
                var left = 5;
                if (calendar.eventBarVisible) {
                    left += 5;
                }
                var text = (calendar._resolved.timeFormat() === 'Clock12Hours') ? ep.start().toString("h tt", locale) : ep.start().toString("H", locale);
                var area = {
                    "left": left,
                    "top":2,
                    "width": startEndWidth,
                    "bottom": 2,
                    "v": "Visible",
                    "html": cache.htmlStart || text,
                    "css": calendar._prefixCssClass("_event_timeleft")
                };
                var a = DayPilot.Areas.createArea(div, ep, area);
                div.appendChild(a);
                inner.style.paddingLeft = startEndWidth + "px";
            }

            if (this.eventEndTime || cache.htmlEnd) {
                //var text = DayPilot.DateUtil.hours(ep.end(), resolved.timeFormat() === 'Clock12Hours');
                var text = (calendar._resolved.timeFormat() === 'Clock12Hours') ? ep.end().toString("h tt", locale) : ep.end().toString("H", locale);
                var area = {
                    "right": 5,
                    "top": 2,
                    "width": startEndWidth,
                    "bottom": 2,
                    "v": "Visible",
                    "html": cache.htmlEnd || text,
                    "css": calendar._prefixCssClass("_event_timeright")
                };
                var a = DayPilot.Areas.createArea(div, ep, area);
                div.appendChild(a);
                inner.style.paddingRight = startEndWidth + "px";
            }

            if (cache.areas) {
                var areas = cache.areas;
                for (var i = 0; i < areas.length; i++) {
                    var area = areas[i];
                    if (!DayPilot.Areas.isVisible(area)) {
                        continue;
                    }
                    var a = DayPilot.Areas.createArea(div, ep, area);
                    div.appendChild(a);
                }
            }

            (function domAdd() {
                var args = {};
                args.e = ep;
                args.control = calendar;
                args.element = null;

                div.domArgs = args;

                // legacy, to be removed
                if (typeof calendar.onDomAddEvent === "function") {
                    calendar.onDomAddEvent(args);
                }

                if (typeof calendar.onBeforeEventDomAdd === "function") {
                    calendar.onBeforeEventDomAdd(args);
                }

                if (args.element) {
                    var target = inner;
                    if (target) {
                        args._targetElement = target;

                        var isReactComponent = DayPilot.Util.isReactComponent(args.element);
                        if (isReactComponent) {
                            if (!calendar._react.reactDOM) {
                                throw new DayPilot.Exception("Can't reach ReactDOM");
                            }
                            calendar._react._render(args.element, target);
                        }
                        else {
                            target.appendChild(args.element);
                        }
                    }
                }
                else {
                    inner.innerHTML = ep.client.innerHTML();
                }

            })();

            this.elements.events.push(div);

            if (cellMode) {
                this.cells[colStart][row].body.appendChild(div);
            }
            else {
                this.nav.events.appendChild(div);
            }

            if (calendar.multiselect._shouldBeSelected(div.event)) {
                calendar.multiselect.add(div.event, true);
            }

            var div = div;

            if (calendar._api2()) {
                if (typeof calendar.onAfterEventRender === 'function') {
                    var args = {};
                    args.e = div.event;
                    args.div = div;

                    calendar.onAfterEventRender(args);
                }
            }
            else {
                if (calendar.afterEventRender) {
                    calendar.afterEventRender(div.event, div);
                }
            }

            /*
            if (calendar.afterEventRender) {
                calendar.afterEventRender(e.event, e);
            }*/

        };

        this._onEventClick = function(ev) {
            if (touch.start) {
                return;
            }

            calendar._eventClickDispatch(this, ev);
        };

        this._onEventDoubleClick = function(ev) {
            ev.stopPropagation();
            calendar._eventDoubleClickDispatch(this, ev);
        };

        this._onEventMouseMove = function(ev) {
            var e = this;
            var ep = e.event;

            if (typeof (DayPilotMonth) === 'undefined') {
                return;
            }

            if (DayPilotMonth.movingEvent || DayPilotMonth.resizingEvent) {
                return;
            }

            // position
            var offset = DayPilot.mo3(e, ev);
            if (!offset) {
                return;
            }

            (function() {
                var div = e;
                if (!div.active) {
                    //var e = e.event;
                    var areas = [];

                    var data = ep.cache || ep.data;

                    if (calendar.eventDeleteHandling !== "Disabled" && !data.deleteDisabled) {
                        areas.push({"action":"JavaScript","v":"Hover","w":17,"h":17,"top": 2,"right":2, "css": calendar._prefixCssClass("_event_delete"),"js":function(e) { calendar._eventDeleteDispatch(e); } });
                    }

                    var list = div.event.cache ? div.event.cache.areas : div.event.data.areas;
                    if (list && list.length > 0) {
                        areas = areas.concat(list);
                    }
                    DayPilot.Areas.showAreas(div, div.event, null, areas);
                }
            })();

            //DayPilot.Areas.showAreas(e, e.event);

            calendar._findEventDivs(e.event).forEach(function(div) {
                DayPilot.Util.addClass(div, calendar._prefixCssClass("_event_hover"));
            });

            var resizeMargin = 6;

            if (!calendar.cellMode && offset.x <= resizeMargin && ep.client.resizeEnabled()) {
                if (ep.part.startsHere) {
                    e.style.cursor = "w-resize";
                    e.dpBorder = 'left';
                }
                else {
                    e.style.cursor = 'not-allowed';
                }
            }
            else if (!calendar.cellMode && e.clientWidth - offset.x <= resizeMargin && ep.client.resizeEnabled()) {
                if (ep.part.endsHere) {
                    e.style.cursor = "e-resize";
                    e.dpBorder = 'right';
                }
                else {
                    e.style.cursor = 'not-allowed';
                }
            }
            else if (ep.client.clickEnabled()) {
                e.style.cursor = "pointer";
            }
            else {
                e.style.cursor = 'default';
            }

            if (typeof (DayPilot.Bubble) !== 'undefined' && calendar.bubble && calendar.eventHoverHandling !== 'Disabled') {
                //if (this.style.cursor == 'default' || this.style.cursor == 'pointer') {
                if (!DayPilotMonth.movingEvent && !DayPilotMonth.resizingEvent) {
                    var notMoved = this._lastOffset && offset.x === this._lastOffset.x && offset.y === this._lastOffset.y;
                    if (!notMoved) {
                        this._lastOffset = offset;
                        calendar.bubble.showEvent(e.event);
                    }
                    //calendar.bubble.showEvent(e.event);
                }
                else {
                    DayPilot.Bubble.hideActive();
                }
            }

        };

        this._onEventMouseOut  = function(ev) {
            var e = this;

            if (typeof (DayPilot.Bubble) !== 'undefined' && calendar.bubble) {
                calendar.bubble.hideOnMouseOut();
            }
            e.style.cursor = '';

            calendar._findEventDivs(e.event).forEach(function(div) {
                DayPilot.Util.removeClass(div, calendar._prefixCssClass("_event_hover"));
            });

            DayPilot.Areas.hideAreas(e, ev);

        };

        this._onEventContextMenu  = function() {
            var e = this;
            calendar._eventRightClickDispatch(e.event);
            return false;
        };

        this._onEventMouseDown = function(ev) {
            if (touch.start) {
                return;
            }

            if (typeof (DayPilot.Bubble) !== 'undefined') {
                DayPilot.Bubble.hideActive();
                DayPilot.Bubble.cancelShowing();
            }

            var e = this;
            var ep = e.event;
            var row = ep.part.row;
            var colStart = ep.part.colStart;
            var line = ep.part.line;
            var colWidth = ep.part.colWidth;

            ev = ev || window.event;
            var button = DayPilot.Util.mouseButton(ev);

            ev.cancelBubble = true;
            if (ev.stopPropagation) {
                ev.stopPropagation();
            }

            if (button.left) {
                if (typeof (DayPilot.Bubble) !== 'undefined' && calendar.bubble) {
                    DayPilot.Bubble.hideActive();
                }

                DayPilotMonth.movingEvent = null;
                if (this.style.cursor === 'w-resize' || this.style.cursor === 'e-resize') {
                    var resizing = {};
                    resizing.start = {};
                    resizing.start.x = colStart;
                    resizing.start.y = row;
                    resizing.event = e.event;
                    resizing.width = DayPilot.DateUtil.daysSpan(resizing.event.start(), resizing.event.end()) + 1;
                    resizing.direction = this.style.cursor;
                    DayPilotMonth.resizingEvent = resizing;
                }
                else if (this.style.cursor === 'move' || ep.client.moveEnabled()) {
                    calendar._clearShadow();

                    var coords = DayPilot.mo3(calendar.nav.events, ev);
                    if (!coords) {
                        return;
                    }

                    //coords.y -= this.parentNode.parentNode.scrollTop;

                    var cell = calendar._getCellBelowPoint(coords.x, coords.y);
                    if (!cell) {
                        return;
                    }

                    var hidden = DayPilot.DateUtil.daysDiff(ep.start(), calendar.rows[row].start);
                    var offset = (cell.y * 7 + cell.x) - (row * 7 + colStart);
                    if (hidden) {
                        offset += hidden;
                    }

                    var moving = {};
                    moving.start = {};
                    moving.start.x = colStart;
                    moving.start.y = row;
                    moving.start.line = line;
                    moving.offset = calendar.eventMoveToPosition ? 0 : offset;
                    moving.colWidth = colWidth;
                    moving.event = e.event;
                    moving.coords = coords;
                    DayPilotMonth.movingEvent = moving;
                }
            }
        };

        this.temp = {};
        this.temp.getPosition = function() {
            if (!calendar.coords) {
                return null;
            }
            var cell = calendar._getCellBelowPoint(calendar.coords.x, calendar.coords.y);
            if (!cell) {
                return null;
            }

            var d = new DayPilot.Date(calendar._getDateFromCell(cell.x, cell.y));
            var cell = {};
            cell.start = d;
            cell.end = d.addDays(1);
            return cell;
        };

        this._touch = {};
        var touch = calendar._touch;

        touch.active = false;
        touch.start = false;

        touch.timeouts = [];

        touch.onEventTouchStart = function(ev) {
            // iOS
            if (touch.active || touch.start) {
                return;
            }

            touch.clearTimeouts();

            touch.start = true;
            touch.active = false;

            var div = this;

            var e = div.event;

            if (e.client.moveEnabled()) {
                var holdfor = calendar.tapAndHoldTimeout;
                touch.timeouts.push(window.setTimeout(function() {
                    touch.active = true;
                    touch.start = false;

                    var coords = touch.relativeCoords(ev);
                    touch.startMoving(div, coords);

                    ev.preventDefault();

                }, holdfor));
            }

            // prevent onMainTouchStart
            ev.stopPropagation();

        };

        touch.onEventTouchMove = function(ev) {
            touch.clearTimeouts();
            touch.start = false;
        };

        touch.onEventTouchEnd = function(ev) {
            touch.clearTimeouts();

            // quick tap
            if (touch.start) {
                calendar._eventClickSingle(this, ev);
            }

            window.setTimeout(function() {
                touch.start = false;
                touch.active = false;
            }, 500);
        };

        touch.onMainTouchStart = function(ev) {
            // prevent after-alert firing on iOS
            if (touch.active || touch.start) {
                return;
            }

            touch.clearTimeouts();

            touch.start = true;
            touch.active = false;

            var holdfor = calendar.tapAndHoldTimeout;
            touch.timeouts.push( window.setTimeout(function() {
                touch.active = true;
                touch.start = false;

                ev.preventDefault();

                var coords = touch.relativeCoords(ev);
                touch.startRange(coords);
            }, holdfor));

        };

        touch.onMainTouchMove = function(ev) {
            touch.clearTimeouts();

            touch.start = false;

            if (touch.active) {
                ev.preventDefault();

                var coords = touch.relativeCoords(ev);

                if (touch.moving) {
                    //ev.preventDefault();
                    touch.updateMoving(coords);
                    return;
                }

                if (touch.range) {
                    touch.updateRange(coords);
                }
            }
        };

        touch.onMainTouchEnd = function(ev) {
            touch.clearTimeouts();

            if (touch.active) {
                if (touch.moving) {
                    //alert("touchend, moving");
                    var src = touch.moving;

                    // load ref
                    //var calendar = DayPilotMonth.movingEvent.event.calendar;
                    var e = touch.moving.event;
                    var start = calendar.shadow.start;
                    var position = calendar.shadow.position;
                    var offset = touch.moving.offset;

                    // cleanup
                    calendar._clearShadow();
                    touch.moving = null;

                    // fire the event
                    calendar._eventMoveDispatch(e, start.x, start.y, offset, ev, position);

                }

                if (touch.range) {
                    var sel = touch.range;
                    //var calendar = sel.root;

                    var start = new DayPilot.Date(calendar._getDateFromCell(sel.from.x, sel.from.y));
                    var end = start.addDays(sel.width);
                    touch.range = null;
                    calendar._timeRangeSelectedDispatch(start, end);
                }
            }

            window.setTimeout(function() {
                touch.start = false;
                touch.active = false;
            }, 500);

        };

        touch.clearTimeouts = function() {
            for (var i = 0; i < touch.timeouts.length; i++) {
                clearTimeout(touch.timeouts[i]);
            }
            touch.timeouts = [];
        };

        touch.relativeCoords = function(ev) {
            var ref = calendar.nav.events;

            var t = ev.touches ? ev.touches[0] : ev;

            var x = t.pageX;
            var y = t.pageY;
            // var coords  = { x: x, y: y};

            var abs = DayPilot.abs(ref);
            var coords = {x: x - abs.x, y: y - abs.y, toString: function() { return "x: " + this.x + ", y:" + this.y; } };
            return coords;
        };


        touch.startMoving = function(div, coords) {
            calendar._clearShadow();

            var ep = div.event;

            var cell = calendar._getCellBelowPoint(coords.x, coords.y);
            if (!cell) {
                return;
            }

            var hidden = DayPilot.DateUtil.daysDiff(ep.start(), calendar.rows[ep.part.row].start);
            var offset = (cell.y * 7 + cell.x) - (ep.part.row * 7 + ep.part.colStart);
            if (hidden) {
                offset += hidden;
            }

            var moving = {};
            moving.start = {};
            moving.start.x = ep.part.colStart;
            moving.start.y = ep.part.row;
            moving.start.line = ep.part.line;
            moving.offset = calendar.eventMoveToPosition ? 0 : offset;
            moving.colWidth = ep.part.colWidth;
            moving.event = ep;
            moving.coords = coords;
            touch.moving = moving;

            touch.updateMoving(coords);
        };

        touch.updateMoving = function(coords) {
            var cell = calendar._getCellBelowPoint(coords.x, coords.y);
            if (!cell) {
                return;
            }

            var linepos = calendar._linePos(cell);

            calendar._clearShadow();

            var event = touch.moving.event;
            var offset = touch.moving.offset;
            var width = calendar.cellMode ? 1 : DayPilot.DateUtil.daysSpan(event.start(), event.end()) + 1;

            if (width < 1) {
                width = 1;
            }
            calendar._drawShadow(cell.x, cell.y, linepos, width, offset, event);

        };

        touch.startRange = function(coords) {
            //touch.range = { "root": calendar, "x": x, "y": y, "from": { x: x, y: y }, "width": 1 };

            var cell = calendar._getCellBelowPoint(coords.x, coords.y);
            if (!cell) {
                return;
            }

            calendar._clearShadow();

            var range = {};
            range.start = {};
            range.start.x = cell.x;
            range.start.y = cell.y;
            range.x = cell.x; // not necessary
            range.y = cell.y; // not necessary
            range.width = 1;

            touch.range = range;
            touch.updateRange(coords);

        };

        touch.updateRange = function(coords) {
            var cell = calendar._getCellBelowPoint(coords.x, coords.y);
            if (!cell) {
                return;
            }

            calendar._clearShadow();

            var start = touch.range.start;
            var startIndex = start.y * 7 + start.x;
            var cellIndex = cell.y * 7 + cell.x;

            var width = Math.abs(cellIndex - startIndex) + 1;

            if (width < 1) {
                width = 1;
            }

            var shadowStart = startIndex < cellIndex ? start : cell;

            touch.range.width = width;
            touch.range.from = { x: shadowStart.x, y: shadowStart.y };

            calendar._drawShadow(shadowStart.x, shadowStart.y, 0, width, 0, null);

        };

        // overridable
        this.isWeekend = function(date) {
            var sunday = 0;
            var saturday = 6;

            if (date.dayOfWeek() === sunday) {
                return true;
            }
            if (date.dayOfWeek() === saturday) {
                return true;
            }
            return false;
        };

        // returns DayPilot.Date object
        this._lastVisibleDayOfMonth = function() {
            var last = this.startDate.lastDayOfMonth();

            if (this.showWeekend) {
                return last;
            }

            while (this.isWeekend(last)) {
                last = last.addDays(-1);
            }
            return last;
        };

        this._prepareRows = function() {

            if (typeof this.startDate === 'string') {
                this.startDate = new DayPilot.Date(this.startDate);
            }
            if (this.viewType === 'Month') {
                this.startDate = this.startDate.firstDayOfMonth();
            }
            else {
                this.startDate = this.startDate.getDatePart();
            }


            this.firstDate = this.startDate.firstDayOfWeek(resolved.weekStarts());
            if (!this.showWeekend) {
                var previousMonth = this.startDate.addMonths(-1).getMonth();

                var lastBeforeWeekend = new DayPilot.Date(this.firstDate).addDays(6);
                while (this.isWeekend(lastBeforeWeekend)) {
                    lastBeforeWeekend = lastBeforeWeekend.addDays(-1);
                }

                if (lastBeforeWeekend.getMonth() === previousMonth) {
                    this.firstDate = this.firstDate.addDays(7);
                }
            }

            var firstDayOfMonth = this.startDate;

            var rowCount;

            if (this.viewType === 'Month') {
                var lastVisibleDayOfMonth = this._lastVisibleDayOfMonth();
                var count = DayPilot.DateUtil.daysDiff(this.firstDate, lastVisibleDayOfMonth) + 1;
                rowCount = Math.ceil(count / 7);
            }
            else {
                rowCount = this.weeks;
            }

            this.days = rowCount * 7;

            this.rows = [];
            for (var x = 0; x < rowCount; x++) {
                var r = {};
                r.start = this.firstDate.addDays(x * 7);  // start point
                r.end = r.start.addDays(this._getColCount()); // end point
                r.events = []; // collection of events
                r.lines = []; // collection of lines
                r.index = x; // row index
                r.minHeight = this.cellHeight; // default, can be extended during events loading
                r.calendar = this;

           /*     r.belongsHere = function(ev) {
                    if (ev.end().getTime() === ev.start().getTime() && ev.start().getTime() === this.start.getTime()) {
                        return true;
                    }
                    return !(ev.end().getTime() <= this.start.getTime() || ev.start().getTime() >= this.end.getTime());
                };*/

                r.belongsHere = function(start, end) {
                    if (end.getTime() === start.getTime() && start.getTime() === this.start.getTime()) {
                        return true;
                    }
                    return !(end.getTime() <= this.start.getTime() || start.getTime() >= this.end.getTime());
                };

                r.getPartStart = function(ep) {
                    return DayPilot.DateUtil.max(this.start, ep.start());
                };

                r.getPartEnd = function(ep) {
                    return DayPilot.DateUtil.min(this.end, ep.rawend());
                };

                r.getStartColumn = function(ep) {
                    var partStart = this.getPartStart(ep);
                    return DayPilot.DateUtil.daysDiff(this.start, partStart);
                };

                r.getWidth = function(ep) {
                    return DayPilot.DateUtil.daysSpan(this.getPartStart(ep), this.getPartEnd(ep)) + 1;
                };

                r.putIntoLine = function(ep, colStart, colWidth, row) {
                    var thisRow = this;

                    for (var i = 0; i < this.lines.length; i++) {
                        var line = this.lines[i];
                        if (line.isFree(colStart, colWidth)) {
                            line.addEvent(ep, colStart, colWidth, row, i);
                            return i;
                        }
                    }

                    var line = [];
                    line.isFree = function(colStart, colWidth) {
                        var free = true;

                        for (var i = 0; i < this.length; i++) {
                            var ep = this[i];
                            if (!(colStart + colWidth - 1 < ep.part.colStart || colStart > ep.part.colStart + ep.part.colWidth - 1)) {
                                free = false;
                            }
                        }

                        return free;
                    };

                    line.addEvent = function(ep, colStart, colWidth, row, index) {
                        //var eventPart = {};
                        //eventPart.event = ev;
                        ep.part.colStart = colStart;
                        ep.part.colWidth = colWidth;
                        ep.part.row = row;
                        ep.part.line = index;
                        ep.part.startsHere = thisRow.start.getTime() <= ep.start().getTime();
                        //if (confirm('r.start: ' + thisRow.start + ' ev.Start: ' + ev.Start)) thisRow = null;
                        ep.part.endsHere = thisRow.end.getTime() >= ep.end().getTime();

                        this.push(ep);
                    };

                    line.addEvent(ep, colStart, colWidth, row, this.lines.length);

                    this.lines.push(line);

                    return this.lines.length - 1;
                };

                r.getStart = function() {
                    var start = 0;
                    for (var i = 0; i < calendar.rows.length && i < this.index; i++) {
                        start += calendar.rows[i].getHeight();
                    }
                };

                r.getHeight = function() {
                    var max = typeof calendar.maxEvents === "number" ? calendar.maxEvents : 1000;
                    var lines = Math.min(max, this.lines.length);
                    return Math.max(lines * resolved.lineHeight() + calendar.cellHeaderHeight + calendar.cellMarginBottom, this.calendar.cellHeight);
                };

                this.rows.push(r);
            }

            this._endDate = this.firstDate.addDays(rowCount * 7);
        };

        this._getHeight = function() {
            switch (this.heightSpec) {
                case "Auto":
                    var height = resolved.headerHeight();
                    for (var i = 0; i < this.rows.length; i++) {
                        height += this.rows[i].getHeight();
                    }
                    return height;
                case "Fixed":
                    return this.height;
            }
        };

        this._getWidth = function(start, end) {
            var diff = (end.y * 7 + end.x) - (start.y * 7 + start.x);
            return diff + 1;
        };

/*
        this._getMinCoords = function(first, second) {
            if ((first.y * 7 + first.x) < (second.y * 7 + second.x)) {
                return first;
            }
            else {
                return second;
            }
        };
*/

        this._angular = {};
        this._angular.scope = null;
        this._angular.notify = function() {
            if (calendar._angular.scope) {
                calendar._angular.scope["$apply"]();
            }
        };

        this.debug = new DayPilot.Debug(this);

        this._drawTop = function() {
            var relative = this.nav.top;
            this.nav.top.dp = this;
            //this.nav.top = relative;
            relative.setAttribute("unselectable", "on");
            relative.style.MozUserSelect = 'none';
            relative.style.KhtmlUserSelect = 'none';
            relative.style.WebkitUserSelect = 'none';

            relative.style.WebkitTapHighlightColor = "rgba(0,0,0,0)";
            relative.style.WebkitTouchCallout = "none";

            relative.style.position = 'relative';
            if (this.width) {
                relative.style.width = this.width;
            }
            // not setting height now, will be set using _updateHeight() later
            //relative.style.height = this._getHeight() + 'px';
            relative.onselectstart = function(e) { return false; }; // prevent text cursor in Chrome during drag&drop
            relative.className = this._prefixCssClass("_main");

            if (this.hideUntilInit) {
                relative.style.visibility = 'hidden';
            }

            if (!this.visible) {
                relative.style.display = "none";
            }

            relative.onmousemove = this._onMainMouseMove;

            DayPilot.reNonPassive(relative, "touchstart", touch.onMainTouchStart);
            DayPilot.reNonPassive(relative, "touchmove", touch.onMainTouchMove);
            DayPilot.rePassive(relative, "touchend", touch.onMainTouchEnd);


            this._vsph = document.createElement("div");
            this._vsph.style.display = 'none';

            this.nav.top.appendChild(this._vsph);

            var table = document.createElement("div");
            //table.setAttribute("data-id", "header");
            table.style.position = "relative";
            table.style.height = resolved.headerHeight() + "px";
            //table.style.marginRight = "20px";
            table.oncontextmenu = function() { return false; };
            this.nav.top.appendChild(table);
            this.nav.header = table;

            var scrollable = document.createElement("div");
            scrollable.style.zoom = "1";  // ie7, makes DayPilot.sw working

            var cells = document.createElement("div");
            cells.style.position = "relative";
            cells.ondblclick = calendar._onCellDoubleClick;
            scrollable.appendChild(cells);

            this.nav.loading = document.createElement("div");
            this.nav.loading.style.position = 'absolute';
            this.nav.loading.style.top = '0px';
            this.nav.loading.style.left = (5) + "px";
            this.nav.loading.className = calendar._prefixCssClass("_loading");
            this.nav.loading.innerHTML = calendar._xssTextHtml(this.loadingLabelText, this.loadingLabelHtml);
            this.nav.loading.style.display = 'none';

            this.nav.top.appendChild(scrollable);
            this.nav.top.appendChild(this.nav.loading);

            this.nav.scrollable = scrollable;
            this.nav.events = cells;

        };

        this._onMainMouseMove = function(ev) {

            ev.insideMainD = true;
            if (window.event && window.event.srcElement) {
                window.event.srcElement.inside = true;
            }

            calendar.coords = DayPilot.mo3(calendar.nav.events, ev);
            var coords = calendar.coords;
            if (!coords) {
                return;
            }

            var cell = calendar._getCellBelowPoint(coords.x, coords.y);
            if (!cell) {
                return;
            }

            if (DayPilotMonth.resizingEvent) {
                calendar._clearShadow();
                var resizing = DayPilotMonth.resizingEvent;

                var original = resizing.start;
                var width, start;

                if (resizing.direction === 'w-resize') {
                    start = cell;

                    var endDate = resizing.event.rawend();
                    if (endDate.getDatePart().getTime() === endDate.getTime()) {
                        endDate = endDate.addDays(-1);
                    }

                    var end = calendar._getCellFromDate(endDate);
                    width = calendar._getWidth(cell, end);
                }
                else {
                    start = calendar._getCellFromDate(resizing.event.start());
                    width = calendar._getWidth(start, cell);
                }

                if (width < 1) {
                    width = 1;
                }

                calendar._drawShadow(start.x, start.y, 0, width);

            }
            else if (DayPilotMonth.movingEvent) {

                // calendar.debug.message("mousemove/moving start coords: " + DayPilotMonth.movingEvent.coords.x + " " + DayPilotMonth.movingEvent.coords.y);
                // calendar.debug.message("mousemove/current coords: " + coords.x + " " + coords.y);

                // not actually moved, Chrome bug
                if (coords.x === DayPilotMonth.movingEvent.coords.x && coords.y === DayPilotMonth.movingEvent.coords.y) {
                    return;
                }

                var linepos = calendar._linePos(cell);

                calendar._clearShadow();

                var event = DayPilotMonth.movingEvent.event;
                var offset = DayPilotMonth.movingEvent.offset;
                var width = calendar.cellMode ? 1 : DayPilot.DateUtil.daysSpan(event.start(), event.rawend()) + 1;

                if (width < 1) {
                    width = 1;
                }
                calendar._drawShadow(cell.x, cell.y, linepos, width, offset, event);
            }
            else if (DayPilotMonth.timeRangeSelecting) {
                DayPilotMonth.cancelCellClick = true;

                calendar._clearShadow();

                var start = DayPilotMonth.timeRangeSelecting;

                var startIndex = start.y * 7 + start.x;
                var cellIndex = cell.y * 7 + cell.x;

                var width = Math.abs(cellIndex - startIndex) + 1;

                if (width < 1) {
                    width = 1;
                }

                var shadowStart = startIndex < cellIndex ? start : cell;

                DayPilotMonth.timeRangeSelecting.from = { x: shadowStart.x, y: shadowStart.y };
                DayPilotMonth.timeRangeSelecting.width = width;
                DayPilotMonth.timeRangeSelecting.moved = true;

                calendar._drawShadow(shadowStart.x, shadowStart.y, 0, width, 0, null);

            }

            if (DayPilotMonth.drag) {

                // drag detected
                if (DayPilotMonth.gShadow) {
                    document.body.removeChild(DayPilotMonth.gShadow);
                }
                DayPilotMonth.gShadow = null;

                if (!DayPilotMonth.movingEvent) {

                    var now = DayPilot.Date.today();

                    var ev = {
                        'id': DayPilotMonth.drag.id,
                        'start': now,
                        'end': now.addSeconds(DayPilotMonth.drag.duration),
                        'text': DayPilotMonth.drag.text
                    };

                    var data = DayPilotMonth.drag.data;
                    if (data) {
                        var skip = ['duration', 'element', 'remove', 'id', 'text'];
                        for (var name in data) {
                            if (DayPilot.contains(skip, name)) {
                                continue;
                            }
                            ev[name] = data[name];
                        }
                    }

                    var event = new DayPilot.Event(ev, calendar);
                    //event.calendar = calendar;
                    //event.root = calendar;
                    event.external = true;

                    var me = DayPilotMonth.movingEvent = {};
                    me.event = event;
                    me.coords = coords;
                    me.position = 0;
                    me.offset = 0;
                    me.external = true;
                    me.removeElement = DayPilotMonth.drag.element;

                }

                ev.cancelBubble = true;
            }

        };

        // cell is result of _getCellBelowPoint
        this._linePos = function(cell) {
            var y = cell.relativeY;
            var row = calendar.rows[cell.y];
            //var linesCount = row.lines.length;
            var top = calendar.cellHeaderHeight;
            var lh = resolved.lineHeight();
            var max = row.lines.length;

            for (var i = 0; i < row.lines.length; i++) {
                var line = row.lines[i];
                if (line.isFree(cell.x, 1)) {
                    max = i;
                    break;
                }
            }

            var pos = Math.floor((y - top + lh / 2) / lh);  // rounded position
            var pos = Math.min(max, pos);  // no more than max
            var pos = Math.max(0, pos);  // no less then 0

            return pos;
        };

        this.message = function(text, opt) {
            if (text === null) {
                return;
            }

            if (!calendar._initialized) {
                return;
            }

            var options = {};
            var delay;
            if (typeof arguments[1] === "object") {
                options = arguments[1];
                delay = options.delay;
            }
            else {
                delay = opt;
            }

            var html = "";
            if (options.rawHtml) {
                html = text;
            }
            else {
                html = DayPilot.Util.escapeHtml(text);
            }

            delay = delay || this.messageHideAfter || 2000;

            // var opacity = 0.8;

            var top = resolved.headerHeight();

            var div;

            if (!this.nav.message) {
                div = document.createElement("div");
                div.setAttribute("unselectable", "on");
                div.style.position = "absolute";
                div.style.right = "0px";
                div.style.left = "0px";
                div.style.top = top + "px";
                div.style.display = 'none';

                div.onmousemove = function() {
                    if (div.messageTimeout && !div.status) {
                        clearTimeout(div.messageTimeout);
                    }
                };

                div.onmouseout = function() {
                    if (calendar.nav.message.style.display !== 'none') {
                        div.messageTimeout = setTimeout(calendar._hideMessage, 500);
                    }
                };

                var inner = document.createElement("div");
                inner.setAttribute("unselectable", "on");
                inner.onclick = function() {
                    calendar.nav.message.style.display = 'none';
                };
                inner.className = this._prefixCssClass("_message");
                div.appendChild(inner);

                var close = document.createElement("div");
                close.setAttribute("unselectable", "on");
                close.style.position = "absolute";
                close.className = this._prefixCssClass("_message_close");
                close.onclick = function() { calendar.nav.message.style.display = 'none'; };
                div.appendChild(close);

                this.nav.top.appendChild(div);
                this.nav.message = div;

            }
            else {
                div = calendar.nav.message;
            }

            var showNow = function() {
                // calendar.nav.message.style.opacity = opacity;

                if (!calendar.nav.message) {  // UpdatePanel refresh
                    return;
                }

                var inner = calendar.nav.message.firstChild;
                inner.className = calendar._prefixCssClass("_message"); // clear any custom css that may have been set

                if (options.cssClass) {
                    DayPilot.Util.addClass(inner, options.cssClass);
                }

                inner.innerHTML = html;

                var end = function() { div.messageTimeout = setTimeout(calendar._hideMessage, delay); };
                DayPilot.fade(calendar.nav.message, 0.2, end);
            };

            // make sure not timeout is active
            clearTimeout(div.messageTimeout);

            // another message was visible
            if (this.nav.message.style.display !== 'none') {
                DayPilot.fade(calendar.nav.message, -0.2, showNow);
            }
            else {
                showNow();
            }

        };

        this.message.show = function(html) {
            calendar.message(html);
        };

        this.message.hide = function() {
            calendar._hideMessage();
        };

        this._hideMessage = function() {
            var end = function() { calendar.nav.message.style.display = 'none'; };
            DayPilot.fade(calendar.nav.message, -0.2, end);
        };

        this._onResize = function(ev) {
            if (calendar.heightSpec === "Parent100Pct") {
                calendar._updateHeight();
            }
        };

        this._updateHeight = function() {
            var scrollable = this.nav.scrollable;
            if (this.heightSpec === "Parent100Pct" || this.heightSpec === 'Fixed') {
                //cells.style.height = (this._getHeight() - this.headerHeight) + "px";
                scrollable.style.top = this.headerHeight + "px";
                scrollable.style.bottom = "0px";
                scrollable.style.left = "0px";
                scrollable.style.right = "0px";
                scrollable.style.overflow = "auto";
                scrollable.style.position = "absolute";
            }
            else {
                scrollable.style.position = "relative";
            }

            if (this.heightSpec === 'Parent100Pct') {
                this.nav.top.style.height = "100%";
                var height = this.nav.top.clientHeight;
                //this.nav.scrollable.style.height = (height - resolved.headerHeight()) + "px";
            }
            else {
                this.nav.top.style.height = this._getHeight() + 'px';
            }

            for (var x = 0; x < this.cells.length; x++) {
                for (var y = 0; y < this.cells[x].length; y++) {
                //for (var y = 0; y < this.rows.length; y++) {
                    this.cells[x][y].style.top = this._getRowTop(y) + 'px';
                    this.cells[x][y].style.height = this.rows[y].getHeight() + 'px';
                }
            }

            this._updateScrollbarWidth();
        };

        // x, y are relative
        this._getCellBelowPoint = function(x, y) {
            x = Math.max(0, x);
            var columnWidth = Math.floor(this.nav.top.clientWidth / this._getColCount());
            var column = Math.min(Math.floor(x / columnWidth), this._getColCount() - 1);

            var row = null;

            //var height = resolved.headerHeight();
            var relativeY = 0;

            /*
            if (y < height) {
                return null;
            }

            var baseHeight = height; // coords are alway relative to nav.events
            */
           var height = 0;
           var baseHeight = 0;

            for (var i = 0; i < this.rows.length; i++) {
                height += this.rows[i].getHeight();
                if (y < height) {
                    relativeY = y - baseHeight;
                    row = i;
                    break;
                }
                baseHeight = height;
            }

            if (row === null) {
                row = this.rows.length - 1; // might be a pixel below the last line
            }

            var cell = {};
            cell.x = column;
            cell.y = row;
            cell.relativeY = relativeY;

            return cell;
        };

        this._getCellFromDate = function(date) {
            var width = DayPilot.DateUtil.daysDiff(this.firstDate, date);
            var cell = { x: 0, y: 0 };
            while (width >= 7) {
                cell.y++;
                width -= 7;
            }
            cell.x = width;
            return cell;
        };

        this._updateScrollbarWidth = function() {
            var width = DayPilot.sw(this.nav.scrollable);
            this.nav.header.style.marginRight = width + "px";
        };

        var child = null;

        this._drawTable = function() {

/*
            if (this.heightSpec === 'Parent100Pct') {
                this.nav.top.style.height = "100%";
            }
*/
            var table = this.nav.header;
            var cells = this.nav.events;
            var colCount = calendar._getColCount();

            this.cells = [];

            for (var x = 0; x < colCount; x++) {
                var isLastX = x === colCount - 1;

                this.cells[x] = [];
                var headerProperties = this.headerProperties ? this.headerProperties[x] : null;

                var dayIndex = x + resolved.weekStarts();
                if (dayIndex > 6) {
                    dayIndex -= 7;
                }

                if (!headerProperties) {
                    var headerProperties = {};
                    headerProperties.html = resolved.locale().dayNames[dayIndex];
                }

                if (typeof calendar.onBeforeHeaderRender === 'function') {
                    var args = {};
                    args.header = {};
                    args.header.dayOfWeek = dayIndex;
                    //args.header.html = html;

                    var proplist = ['html', 'backColor', 'cssClass'];
                    DayPilot.Util.copyProps(headerProperties, args.header, proplist);
                    calendar.onBeforeHeaderRender(args);
                    DayPilot.Util.copyProps(args.header, headerProperties, proplist);
                }

                var header = document.createElement("div");
                header.setAttribute("unselectable", "on");
                header.style.position = 'absolute';

                header.style.left = (this._getCellWidth() * x) + '%';
                if (isLastX) {
                    header.style.right = "0px";
                }
                else {
                    header.style.width = (this._getCellWidth()) + '%';
                }

                header.style.top = '0px';
                header.style.height = (resolved.headerHeight()) + 'px';

                (function(x) {
                    header.onclick = function() { calendar._headerClickDispatch(x); };
                })(dayIndex);

                var inner = document.createElement("div");
                inner.setAttribute("unselectable", "on");
                inner.className = this._prefixCssClass("_header_inner");
                inner.innerHTML = headerProperties.html;

                header.appendChild(inner);

                header.className = this._prefixCssClass("_header");
                if (headerProperties) {
                    if (headerProperties.cssClass) {
                        DayPilot.Util.addClass(header, headerProperties.cssClass);
                    }
                    if (headerProperties.backColor) {
                        inner.style.background = headerProperties.backColor;
                    }
                }

                table.appendChild(header);

                for (var y = 0; y < this.rows.length; y++) {
                    this._drawCell(x, y, cells);
                }

            }

            if (!DayPilot.contains(this.nav.top.childNodes, child) && DayPilot.Util.isNullOrUndefined("K5woOes")) {
                var div = document.createElement("div");
                div.style.position = 'absolute';
                div.style.padding = '2px';
                div.style.top = '0px';
                div.style.left = '0px';
                div.style.backgroundColor = "#FF6600";
                div.style.color = "white";
                div.innerHTML = "\u0044\u0045\u004D\u004F";
                child = div;
                this.nav.top.appendChild(div);
            }

            //this._updateScrollbarWidth();

        };

        this._clearTable = function() {

            // clear event handlers
            for (var x = 0; x < this.cells.length; x++) {
                for (var y = 0; y < this.cells[x].length; y++) {
                    this.cells[x][y].onclick = null;

                    (function domRemove() {
                        var div = calendar.cells[x][y];
                        var domArgs = div.domArgs;
                        div.domArgs = null;

                        if (domArgs && typeof calendar.onBeforeCellDomRemove === "function") {
                            calendar.onBeforeCellDomRemove(domArgs);
                        }

                        if (domArgs && typeof calendar.onBeforeCellDomAdd === "function" && calendar._react.reactDOM) {
                            var target = domArgs && domArgs._targetElement;
                            if (target) {
                                var isReact = DayPilot.Util.isReactComponent(domArgs.element);
                                if (isReact) {
                                    if (!calendar._react.reactDOM) {
                                        throw new DayPilot.Exception("Can't reach ReactDOM");
                                    }
                                    calendar._react._unmount(target);
                                }
                            }
                        }

                    })();

                }
            }

            this.nav.header.innerHTML = '';
            //this.nav.scrollable.innerHTML = '';
            this.nav.events.innerHTML = '';

        };

        this._drawCell = function(x, y, table) {

            var row = this.rows[y];
            var d = this.firstDate.addDays(y * 7 + x);
            var cellProperties = this.cellProperties ? this.cellProperties[y * this._getColCount() + x] : null;
            var colCount = calendar._getColCount();
            var isLastX = x === colCount - 1;

            var headerHtml = null;
            if (cellProperties) {
                headerHtml = cellProperties["headerHtml"];
            }
            else {
                var date = d.getDay();
                if (date === 1) {
                    headerHtml = resolved.locale().monthNames[d.getMonth()] + ' ' + date;
                }
                else {
                    headerHtml = date + "";
                }
            }

            if (!cellProperties) {
                var cellProperties = {};
                cellProperties.business = !calendar.isWeekend(d);
                cellProperties.headerHtml = headerHtml;
                cellProperties.disabled = false;

                cellProperties.backColor = null;
                cellProperties.backImage = null;
                cellProperties.backRepeat = null;
                cellProperties.areas = null;
                cellProperties.headerBackColor = null;
                cellProperties.cssClass = null;
                cellProperties.html = null;
            }

            if (typeof calendar.onBeforeCellRender === 'function') {

                var args = {};
                args.cell = {};
                args.cell.start = d;
                args.cell.end = args.cell.start.addDays(1);

                args.cell.properties = cellProperties;

                args.cell.events = function() {
                    return calendar.events.forRange(args.cell.start, args.cell.end);
                };

                calendar.onBeforeCellRender(args);
                DayPilot.Util.copyProps(args.cell, cellProperties, ['areas', 'backColor', 'backImage', 'backRepeat', 'business', 'disabled', 'headerHtml', 'headerBackColor', 'cssClass', 'html']);
            }

            var left = this._getCellWidth() * x;
            var width = this._getCellWidth();

            var cell = document.createElement("div");
            cell.setAttribute("unselectable", "on");
            cell.style.position = 'absolute';
            cell.style.cursor = 'default';
            cell.style.left = (left) + '%';
            if (!isLastX) {
                cell.style.width = (width) + '%';
            }
            else {
                cell.style.right = "0px";
            }

            cell.style.top = (this._getRowTop(y)) + 'px';
            cell.style.height = (row.getHeight()) + 'px';

            // TODO wrap in an object
            cell.d = d;
            cell.x = x;
            cell.y = y;
            cell.props = cellProperties;

            var previousMonth = this.startDate.addMonths(-1).getMonth();
            var nextMonth = this.startDate.addMonths(1).getMonth();

            var thisMonth = this.startDate.getMonth();

            var inner = document.createElement("div");
            inner.setAttribute("unselectable", "on");
            cell.appendChild(inner);
            inner.className = this._prefixCssClass("_cell_inner");

            inner.className = this._prefixCssClass("_cell_inner");
            if (d.getMonth() === thisMonth) {
                cell.className = this._prefixCssClass("_cell");
            }
            else if (d.getMonth() === previousMonth) {
                cell.className = this._prefixCssClass("_cell") + " " + this._prefixCssClass("_previous");
            }
            else if (d.getMonth() === nextMonth) {
                cell.className = this._prefixCssClass("_cell") + " " + this._prefixCssClass("_next");
            }
            else {
                doNothing();
            }

            if (cellProperties) {
                if (cellProperties["cssClass"]) {
                    DayPilot.Util.addClass(cell, cellProperties.cssClass);
                }

                if (cellProperties["business"]) {
                    DayPilot.Util.addClass(cell, this._prefixCssClass("_cell_business"));
                }

                if (cellProperties["backColor"]) {
                    inner.style.backgroundColor = cellProperties["backColor"];
                }

                if (cellProperties["backImage"]) {
                    inner.style.backgroundImage = "url('" + cellProperties["backImage"] + "')";
                }
                if (cellProperties["backRepeat"]) {
                    inner.style.backgroundRepeat = cellProperties["backRepeat"];
                }
            }

            cell.onmousedown = this._onCellMouseDown;
            cell.onmousemove = this._onCellMouseMove;
            cell.onmouseout = this._onCellMouseOut;
            cell.oncontextmenu = this._onCellContextMenu;
            cell.onclick = this._onCellClick;
            cell.ondblclick = this._onCellDoubleClick;

            var day = document.createElement("div");
            day.setAttribute("unselectable", "on");
            day.style.height = this.cellHeaderHeight + "px";

            if (cellProperties && cellProperties["headerBackColor"]) {
                day.style.background = cellProperties["headerBackColor"];
            }
            day.className = this._prefixCssClass("_cell_header");
            day.innerHTML = cellProperties.headerHtml;

            day.onclick = function(ev) {

                if (calendar.cellHeaderClickHandling !== "Enabled") {
                    return;
                }

                ev.stopPropagation();

                var args = {};
                args.control = calendar;
                args.start = d;
                args.end = d.addDays(1);
                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onCellHeaderClick === "function") {
                    calendar.onCellHeaderClick(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                if (typeof calendar.onCellHeaderClicked === "function") {
                    calendar.onCellHeaderClicked(args);
                }

            };

            inner.appendChild(day);

            if (cellProperties && cellProperties["html"]) {
                var html = document.createElement("div");
                html.setAttribute("unselectable", "on");
                html.style.height = (row.getHeight() - this.cellHeaderHeight) + 'px';
                html.style.overflow = 'hidden';
                html.innerHTML = cellProperties["html"];
                inner.appendChild(html);
            }

            if (this.cellMode) {
                var scrolling = document.createElement("div");
                scrolling.setAttribute("unselectable", "on");
                scrolling.style.height = (this.cellHeight - this.cellHeaderHeight) + "px";
                scrolling.style.overflow = 'auto';
                scrolling.style.position = 'relative';

                var inside = document.createElement('div');
                inside.setAttribute("unselectable", "on");
                inside.style.paddingTop = "1px";
                inside.style.paddingBottom = "1px";

                scrolling.appendChild(inside);
                inner.appendChild(scrolling);

                cell.body = inside;
                cell.scrolling = scrolling;
            }

            if (cell.props) {
                var areas = cell.props.areas || [];
                for (var i = 0; i < areas.length; i++) {
                    var area = areas[i];
                    if (!DayPilot.Areas.isVisible(area)) {
                        continue;
                    }
                    var a = DayPilot.Areas.createArea(cell, cell.props, area);
                    cell.appendChild(a);
                }
            }

            (function domAdd() {

                if (typeof calendar.onBeforeCellDomAdd !== "function" && typeof calendar.onBeforeCellDomRemove !== "function") {
                    return;
                }

                var args = {};
                args.control = calendar;
                args.cell = {};
                args.cell.start = d;
                args.cell.end = args.cell.start.addDays(1);
                args.cell.events = function() {
                    return calendar.events.forRange(args.cell.start, args.cell.end);
                };
                args.element = null;
                // args.target = "Cell";

                cell.domArgs = args;

                if (typeof calendar.onBeforeCellDomAdd === "function") {
                    calendar.onBeforeCellDomAdd(args);
                }

                if (args.element) {
                    target = inner;
/*
                    switch (args.target && args.target.toLowerCase()) {
                        case "text":
                            target = inner;
                            break;
                        case "cell":
                            target = inner;
                            break;
                    }
*/
                    if (target) {
                        args._targetElement = target;

                        var isReactComponent = DayPilot.Util.isReactComponent(args.element);
                        if (isReactComponent) {
                            if (!calendar._react.reactDOM) {
                                throw new DayPilot.Exception("Can't reach ReactDOM");
                            }
                            calendar._react._render(args.element, target);
                        }
                        else {
                            target.appendChild(args.element);
                        }
                    }
                }
            })();

            this.cells[x][y] = cell;

            table.appendChild(cell);

            if (typeof calendar.onAfterCellRender === "function") {
                args.cell.div = cell;
                args.cell.divHeader = day;
                calendar.onAfterCellRender(args);
            }
        };

        this._onCellMouseMove = function() {
            var c = this;
            if (c.props) {
                DayPilot.Areas.showAreas(c, c.props);
            }
        };

        this._onCellMouseOut = function(ev) {
            var c = this;
            if (c.props) {
                DayPilot.Areas.hideAreas(c, ev);
            }
        };

        this._onCellContextMenu = function() {
            var d = this.d;

            var go = function(d) {
                var start = new DayPilot.Date(d);
                var end = start.addDays(1);

                var selection = new DayPilot.Selection(start, end, null, calendar);
                if (calendar.contextMenuSelection) {
                    calendar.contextMenuSelection.show(selection);
                }
            };

            go(d);

            return false;

        };

        this._onCellDoubleClick = function() {
            // var d = this.d;

            var coords = calendar.coords;
            var cell = calendar._getCellBelowPoint(coords.x, coords.y);
            var d = calendar._getDateFromCell(cell.x, cell.y);

            if (calendar.timeouts) {
                for (var toid in calendar.timeouts) {
                    window.clearTimeout(calendar.timeouts[toid]);
                }
                calendar.timeouts = null;
            }

            if (calendar.timeRangeDoubleClickHandling !== 'Disabled') {
                var start = new DayPilot.Date(d);
                var end = start.addDays(1);
                calendar._timeRangeDoubleClickDispatch(start, end);
            }
        };

        this._onCellClick = function() {

            if (DayPilotMonth.cancelCellClick) {
                return;
            }

            var d = this.d;

            var props = this.props;

            if (props.disabled) {
                return;
            }

            var single = function(d) {
                var start = new DayPilot.Date(d);
                var end = start.addDays(1);
                calendar._timeRangeSelectedDispatch(start, end);
            };

            if (calendar.timeRangeSelectedHandling !== 'Disabled' && calendar.timeRangeDoubleClickHandling === 'Disabled') {
                single(d);
                return;
            }

            if (!calendar.timeouts) {
                calendar.timeouts = [];
            }

            var clickDelayed = function(d) {
                return function() {
                    single(d);
                };
            };

            calendar.timeouts.push(window.setTimeout(clickDelayed(d), calendar.doubleClickTimeout));

        };

        this._onCellMouseDown = function(e) {
            var cell = this;
            var x = cell.x;
            var y = cell.y;

            DayPilotMonth.cancelCellClick = false;

            if (cell.scrolling) {
                var offset = DayPilot.mo3(cell.scrolling, e);
                var sw = DayPilot.sw(cell.scrolling);
                var width = cell.scrolling.offsetWidth;
                if (offset.x > width - sw) {  // clicking on the vertical scrollbar
                    return;
                }
            }

            if (calendar.timeRangeSelectedHandling !== 'Disabled') {
                calendar._clearShadow();
                DayPilotMonth.timeRangeSelecting = { "root": calendar, "x": x, "y": y, "from": { x: x, y: y }, "width": 1 };
            }

            calendar._drawShadow(x, y, 0, 1);

        };

        this._getColCount = function() {
            if (this.showWeekend) {
                return 7;
            }
            else {
                return 5;
            }
        };

        this._getCellWidth = function() {
            if (this.showWeekend) {
                return 14.285;
            }
            else {
                return 20;
            }
        };

/*        this._getCellBackColor = function(d) {
            if (d.getUTCDay() === 6 || d.getUTCDay() === 0) {
                return this.nonBusinessBackColor;
            }
            return this.backColor;
        };*/

        this._getRowTop = function(index) {
            //var top = this.headerHeight;
            var top = 0;
            for (var i = 0; i < index; i++) {
                top += this.rows[i].getHeight();
            }
            return top;
        };

        this.clearSelection = function() {
            this._clearShadow();
        };

/*
        this._postBack = function(prefix) {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args.push(arguments[i]);
            }

            __doPostBack(calendar.uniqueID, prefix + DayPilot.ea(args));
        };
*/
        this._postBack2 = function(action, data, parameters) {
            var envelope = {};
            envelope.action = action;
            envelope.parameters = parameters;
            envelope.data = data;
            envelope.header = this._getCallBackHeader();

            var commandstring = "JSON" + JSON.stringify(envelope);
            __doPostBack(calendar.uniqueID, commandstring);
        };

        this._callBack2 = function(action, parameters, data, type) {

            if (!this._serverBased()) {
                calendar.debug.message("Callback invoked without the server-side backend specified. Callback canceled.", "warning");
                return;
            }

            if (typeof type === 'undefined') {
                type = "CallBack";
            }

            calendar._loadingStart();

            var envelope = {};

            envelope.action = action;
            envelope.type = type;
            envelope.parameters = parameters;
            envelope.data = data;
            envelope.header = this._getCallBackHeader();

            var commandstring = "JSON" + JSON.stringify(envelope);

            if (this.backendUrl) {
                DayPilot.request(this.backendUrl, this._callBackResponse, commandstring, this._ajaxError);
            }
            else if (typeof WebForm_DoCallback === 'function') {
                WebForm_DoCallback(this.uniqueID, commandstring, this._updateView, null, this.callbackError, true);
            }
        };

        this._serverBased = function() {
            return (calendar._productCode !== "javasc" && calendar._productCode.indexOf("DCODE") === -1) || calendar.devsb;
        };


        this._isAspnetWebForms = function() {
            if (typeof WebForm_DoCallback === 'function' && this.uniqueID) {
                return true;
            }
            return false;
        };

        this._ajaxError = function(req) {
            if (typeof calendar.onAjaxError === 'function') {
                var args = {};
                args.request = req;
                calendar.onAjaxError(args);
            }
            else if (typeof calendar.ajaxError === 'function') { // backwards compatibility
                calendar.ajaxError(req);
            }
        };

        this._callBackResponse = function(response) {
            calendar._updateView(response.responseText);
        };

        this._getCallBackHeader = function() {
            var h = {};
            h.v = this.v;
            h.control = "dpm";
            h.id = this.id;
            h.visibleStart = new DayPilot.Date(this.firstDate);
            h.visibleEnd = h.visibleStart.addDays(this.days);

            h.clientState = this.clientState;
            //h.cssOnly = calendar.cssOnly;
            h.cssClassPrefix = calendar.cssClassPrefix;

            h.startDate = calendar.startDate;
            h.showWeekend = this.showWeekend;
            // h.headerBackColor = this.headerBackColor;
            // h.backColor = this.backColor;
            // h.nonBusinessBackColor = this.nonBusinessBackColor;
            h.locale = this.locale;
            h.timeFormat = this.timeFormat;
            h.weekStarts = this.weekStarts;
            h.viewType = this.viewType;
            h.weeks = this.weeks;

            h.selected = calendar.multiselect.events();

            h.hashes = calendar.hashes;

            return h;
        };

        this.visibleStart = function() {
            return new DayPilot.Date(this.firstDate);
        };

        this.visibleEnd = function() {
            return calendar.visibleStart().addDays(calendar.days);
        };

        this._invokeEvent = function(type, action, params, data) {

            if (type === 'PostBack') {
                calendar.postBack2(action, params, data);
            }
            else if (type === 'CallBack') {
                calendar._callBack2(action, params, data, "CallBack");
            }
            else if (type === 'Immediate') {
                calendar._callBack2(action, params, data, "Notify");
            }
            else if (type === 'Queue') {
                calendar.queue.add(new DayPilot.Action(this, action, params, data));
            }
            else if (type === 'Notify') {
                if (resolved.notifyType() === 'Notify') {
                    calendar._callBack2(action, params, data, "Notify");
                }
                else {
                    calendar.queue.add(new DayPilot.Action(calendar, action, params, data));
                }
            }
            else {
                throw "Invalid event invocation type";
            }
        };
        /*
        this.queue = {};
        this.queue.list = [];
        this.queue.list.ignoreToJSON = true;

        this.queue.add = function(action) {
            if (!action) {
                return;
            }
            if (action.isAction) {
                calendar.queue.list.push(action);
            }
            else {
                throw "DayPilot.Action object required for queue.add()";
            }
        };

        this.queue.notify = function(data) {
            var params = {};
            params.actions = calendar.queue.list;
            calendar._callBack2('Notify', params, data, "Notify");

            calendar.queue.list = [];
        };

        this.queue.clear = function() {
            calendar.queue.list = [];
        };

        this.queue.pop = function() {
            return calendar.queue.list.pop();
        };
*/
        this._bubbleCallBack = function(args, bubble) {
            var guid = calendar._recordBubbleCall(bubble);

            var params = {};
            params.args = args;
            params.guid = guid;

            calendar._callBack2("Bubble", params);
        };

        this._recordBubbleCall = function(bubble) {
            var guid = DayPilot.guid();
            if (!this.bubbles) {
                this.bubbles = [];
            }

            this.bubbles[guid] = bubble;
            return guid;
        };


        this.eventClickPostBack = function(e, data) {
            this._postBack2("EventClick", data, e);
        };
        this.eventClickCallBack = function(e, data) {
            this._callBack2('EventClick', e, data);
        };

        this._eventClickDispatch = function(div, e) {

            DayPilotMonth.movingEvent = null;
            DayPilotMonth.resizingEvent = null;

            //var div = this;

            var e = e || window.event;
            var ctrlKey = e.ctrlKey;
            var metaKey = e.metaKey;

            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }

            if (typeof (DayPilot.Bubble) !== 'undefined') {
                DayPilot.Bubble.hideActive();
            }

            if (calendar.eventDoubleClickHandling === 'Disabled') {
                calendar._eventClickSingle(div, e);
                return;
            }

            if (!calendar.timeouts) {
                calendar.timeouts = [];
            }
            else {
                for (var toid in calendar.timeouts) {
                    window.clearTimeout(calendar.timeouts[toid]);
                }
                calendar.timeouts = [];
            }

            var eventClickDelayed = function(div, e) {
                return function() {
                    calendar._eventClickSingle(div, e);
                };
            };

            calendar.timeouts.push(window.setTimeout(eventClickDelayed(div, e), calendar.doubleClickTimeout));

        };


        this._eventClickSingle = function(div, ev) {

            var e = div.event;
            if (!e.client.clickEnabled()) {
                return;
            }

            var ctrlKey = ev.ctrlKey;
            var metaKey = ev.metaKey;

            if (calendar._api2()) {

                var args = {};
                args.e = e;
                args.control = calendar;
                args.div = div;
                args.originalEvent = ev;
                args.meta = ev.metaKey;
                args.ctrl = ev.ctrlKey;
                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onEventClick === 'function') {
                    calendar.onEventClick(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.eventClickHandling) {
                    case 'PostBack':
                        calendar.eventClickPostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventClickCallBack(e);
                        break;
                    case 'Select':
                        calendar._eventSelect(div, e, ctrlKey, metaKey);
                        break;
                    case 'ContextMenu':
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
                    case 'Bubble':
                        if (calendar.bubble) {
                            calendar.bubble.showEvent(e);
                        }
                        break;
                }

                if (typeof calendar.onEventClicked === 'function') {
                    calendar.onEventClicked(args);
                }

            }
            else {
                switch (calendar.eventClickHandling) {
                    case 'PostBack':
                        calendar.eventClickPostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventClickCallBack(e);
                        break;
                    case 'JavaScript':
                        calendar.onEventClick(e);
                        break;
                    case 'Select':
                        calendar._eventSelect(div, e, ctrlKey, metaKey);
                        break;
                    case 'ContextMenu':
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
                    case 'Bubble':
                        if (calendar.bubble) {
                            calendar.bubble.showEvent(e);
                        }
                        break;
                }

            }

/*
            switch (calendar.eventClickHandling) {
                case 'PostBack':
                    calendar.eventClickPostBack(e);
                    break;
                case 'CallBack':
                    calendar.eventClickCallBack(e);
                    break;
                case 'JavaScript':
                    calendar.onEventClick(e);
                    break;
                case 'Select':
                    calendar._eventSelect(div, e, ctrlKey);
                    break;
                case 'ContextMenu':
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
                case 'Bubble':
                    if (calendar.bubble) {
                        calendar.bubble.showEvent(e);
                    }
                    break;
            }
            */
        };

        this._eventDeleteDispatch = function(e) {

            if (calendar._api2()) {

                var args = {};
                args.e = e;
                args.control = calendar;

                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onEventDelete === 'function') {
                    calendar.onEventDelete(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.eventDeleteHandling) {
                    case 'PostBack':
                        calendar.eventDeletePostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventDeleteCallBack(e);
                        break;
                    case 'Update':
                        calendar.events.remove(e);
                        break;
                }

                if (typeof calendar.onEventDeleted === 'function') {
                    calendar.onEventDeleted(args);
                }
            }
            else {
                switch (calendar.eventDeleteHandling) {
                    case 'PostBack':
                        calendar.eventDeletePostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventDeleteCallBack(e);
                        break;
                    case 'JavaScript':
                        calendar.onEventDelete(e);
                        break;
                }
            }

        };

        this.eventDeletePostBack = function(e, data) {
            this._postBack2('EventDelete', e, data);
        };
        this.eventDeleteCallBack = function(e, data) {
            this._callBack2('EventDelete', e, data);
        };

        this.eventDoubleClickPostBack = function(e, data) {
            this._postBack2('EventDoubleClick', data, e);
        };
        this.eventDoubleClickCallBack = function(e, data) {
            this._callBack2('EventDoubleClick', e, data);
        };

        this._eventDoubleClickDispatch = function(div, ev) {

            if (typeof (DayPilot.Bubble) !== 'undefined') {
                DayPilot.Bubble.hideActive();
            }

            if (calendar.timeouts) {
                for (var toid in calendar.timeouts) {
                    window.clearTimeout(calendar.timeouts[toid]);
                }
                calendar.timeouts = null;
            }

            var ev = ev || window.event;
            var e = div.event;

            if (!e.client.doubleClickEnabled()) {
                return;
            }

            if (calendar._api2()) {

                var args = {};
                args.e = e;
                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onEventDoubleClick === 'function') {
                    calendar.onEventDoubleClick(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.eventDoubleClickHandling) {
                    case 'PostBack':
                        calendar.eventDoubleClickPostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventDoubleClickCallBack(e);
                        break;
                    case 'Select':
                        calendar._eventSelect(div, e, ev.ctrlKey, ev.metaKey);
                        break;
                    case 'Bubble':
                        if (calendar.bubble) {
                            calendar.bubble.showEvent(e);
                        }
                        break;
                }

                if (typeof calendar.onEventDoubleClicked === 'function') {
                    calendar.onEventDoubleClicked(args);
                }

            }
            else {
                switch (calendar.eventDoubleClickHandling) {
                    case 'PostBack':
                        calendar.eventDoubleClickPostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventDoubleClickCallBack(e);
                        break;
                    case 'JavaScript':
                        calendar.onEventDoubleClick(e);
                        break;
                    case 'Select':
                        calendar._eventSelect(div, e, ev.ctrlKey, ev.metaKey);
                        break;
                    case 'Bubble':
                        if (calendar.bubble) {
                            calendar.bubble.showEvent(e);
                        }
                        break;
                }

            }

        };

        this._eventSelect = function(div, e, ctrlKey, metaKey) {
            calendar._eventSelectDispatch(div, e, ctrlKey, metaKey);
        };

        this.eventSelectPostBack = function(e, change, data) {
            var params = {};
            params.e = e;
            params.change = change;
            this._postBack2('EventSelect', data, params);
        };
        this.eventSelectCallBack = function(e, change, data) {
            var params = {};
            params.e = e;
            params.change = change;
            this._callBack2('EventSelect', params, data);
        };

        this._eventSelectDispatch = function(div, e, ctrlKey, metaKey) {

            var m = calendar.multiselect;

            var allowDeselect = false;
            var isSelected = m.isSelected(e);
            var ctrlOrMeta = ctrlKey || metaKey;
            if (!ctrlOrMeta && isSelected && !allowDeselect && m.list.length === 1) {
                return;
            }

            if (calendar._api2()) {

                m.previous = m.events();

                var args = {};
                args.e = e;
                args.selected = m.isSelected(e);
                args.ctrl = ctrlKey;
                args.meta = metaKey;
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
                    case 'PostBack':
                        calendar.eventSelectPostBack(e, change);
                        break;
                    case 'CallBack':
                        if (typeof WebForm_InitCallback !== 'undefined') {
                            window.__theFormPostData = "";
                            window.__theFormPostCollection = [];
                            WebForm_InitCallback();
                        }
                        calendar.eventSelectCallBack(e, change);
                        break;
                    case 'Update':
                        m._toggleDiv(div, ctrlKey);
                        break;
                }

                if (typeof calendar.onEventSelected === 'function') {
                    args.change = m.isSelected(e) ? "selected" : "deselected";
                    args.selected = m.isSelected(e);
                    calendar.onEventSelected(args);
                }

            }
            else {
                m.previous = m.events();
                m._toggleDiv(div, ctrlKey);
                var change = m.isSelected(e) ? "selected" : "deselected";

                switch (calendar.eventSelectHandling) {
                    case 'PostBack':
                        calendar.eventSelectPostBack(e, change);
                        break;
                    case 'CallBack':
                        if (typeof WebForm_InitCallback !== 'undefined') {
                            window.__theFormPostData = "";
                            window.__theFormPostCollection = [];
                            WebForm_InitCallback();
                        }
                        calendar.eventSelectCallBack(e, change);
                        break;
                    case 'JavaScript':
                        calendar.onEventSelect(e, change);
                        break;
                }
            }


/*
            switch (calendar.eventSelectHandling) {
                case 'PostBack':
                    calendar.eventSelectPostBack(e, change);
                    break;
                case 'CallBack':
                    __theFormPostData = "";
                    __theFormPostCollection = [];
                    if (WebForm_InitCallback) {
                        WebForm_InitCallback();
                    }
                    calendar.eventSelectCallBack(e, change);
                    break;
                case 'JavaScript':
                    calendar.onEventSelect(e, change);
                    break;
            }
            */
        };


        this.eventRightClickPostBack = function(e, data) {
            this._postBack2("EventRightClick", data, e);
        };
        this.eventRightClickCallBack = function(e, data) {
            this._callBack2('EventRightClick', e, data);
        };

        this._eventRightClickDispatch = function(e) {

            this.event = e;

            if (!e.client.rightClickEnabled()) {
                return false;
            }

            if (calendar._api2()) {

                var args = {};
                args.e = e;
                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onEventRightClick === 'function') {
                    calendar.onEventRightClick(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.eventRightClickHandling) {
                    case 'PostBack':
                        calendar.eventRightClickPostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventRightClickCallBack(e);
                        break;
                    case 'ContextMenu':
                        var menu = e.client.contextMenu();
                        if (menu) {
                            menu.show(e);
                        }
                        else {
                            if (calendar.contextMenu) {
                                calendar.contextMenu.show(this.event);
                            }
                        }
                        break;
                    case 'Bubble':
                        if (calendar.bubble) {
                            calendar.bubble.showEvent(e);
                        }
                        break;
                }

                if (typeof calendar.onEventRightClicked === 'function') {
                    calendar.onEventRightClicked(args);
                }

            }
            else {
                switch (calendar.eventRightClickHandling) {
                    case 'PostBack':
                        calendar.eventRightClickPostBack(e);
                        break;
                    case 'CallBack':
                        calendar.eventRightClickCallBack(e);
                        break;
                    case 'JavaScript':
                        calendar.onEventRightClick(e);
                        break;
                    case 'ContextMenu':
                        var menu = e.client.contextMenu();
                        if (menu) {
                            menu.show(e);
                        }
                        else {
                            if (calendar.contextMenu) {
                                calendar.contextMenu.show(this.event);
                            }
                        }
                        break;
                    case 'Bubble':
                        if (calendar.bubble) {
                            calendar.bubble.showEvent(e);
                        }
                        break;
                }
            }

            return false;
        };

        this.eventMenuClickPostBack = function(e, command, data) {
            var params = {};
            params.e = e;
            params.command = command;

            this._postBack2('EventMenuClick', data, params);
        };
        this.eventMenuClickCallBack = function(e, command, data) {
            var params = {};
            params.e = e;
            params.command = command;

            this._callBack2('EventMenuClick', params, data);
        };

        this._eventMenuClick = function(command, e, handling) {
            switch (handling) {
                case 'PostBack':
                    calendar.eventMenuClickPostBack(e, command);
                    break;
                case 'CallBack':
                    calendar.eventMenuClickCallBack(e, command);
                    break;
            }
        };

        this.eventMovePostBack = function(e, newStart, newEnd, data, position) {
            if (!newStart)
                throw 'newStart is null';
            if (!newEnd)
                throw 'newEnd is null';

            var params = {};
            params.e = e;
            params.newStart = newStart;
            params.newEnd = newEnd;
            params.position = position;

            this._postBack2('EventMove', data, params);

        };
        this.eventMoveCallBack = function(e, newStart, newEnd, data, position) {
            if (!newStart)
                throw 'newStart is null';
            if (!newEnd)
                throw 'newEnd is null';

            var params = {};
            params.e = e;
            params.newStart = newStart;
            params.newEnd = newEnd;
            params.position = position;
            //params.newColumn = newColumn;

            this._callBack2('EventMove', params, data);
        };

        this._eventMoveDispatch = function(e, x, y, offset, ev, position, external) {

            var startOffset = e.start().getTimePart();

            var endDate = e.rawend().getDatePart();
            if (endDate.getTime() !== e.rawend().getTime()) {
                endDate = endDate.addDays(1);
            }
            var endOffset = DayPilot.DateUtil.diff(e.rawend(), endDate);

            var boxStart = this._getDateFromCell(x, y);
            boxStart = boxStart.addDays(-offset);
            var width = DayPilot.DateUtil.daysSpan(e.start(), e.rawend()) + 1;

            var boxEnd = boxStart.addDays(width);

            var newStart = boxStart.addTime(startOffset);
            var newEnd = boxEnd.addTime(endOffset);

            newEnd = calendar._adjustEndOut(newEnd);

            if (calendar._api2()) {
                // API v2
                var args = {};

                args.e = e;
                args.control = calendar;
                args.newStart = newStart;
                args.newEnd = newEnd;
                args.position = position;
                args.ctrl = false;
                args.external = external;
                if (ev) {
                    args.ctrl = ev.ctrlKey;
                }
                args.shift = false;
                if (ev) {
                    args.shift = ev.shiftKey;
                }
                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onEventMove === 'function') {
                    calendar.onEventMove(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.eventMoveHandling) {
                    case 'PostBack':
                        calendar.eventMovePostBack(e, newStart, newEnd, null, position);
                        break;
                    case 'CallBack':
                        calendar.eventMoveCallBack(e, newStart, newEnd, null, position);
                        break;
                    case 'Notify':
                        calendar.eventMoveNotify(e, newStart, newEnd, null, position);
                        break;
                    case 'Update':
                        if (args.external) {
                            e.start(newStart);
                            e.end(newEnd);
                            e.commit();
                            calendar.events.add(e);
                        }
                        else {
                            e.start(newStart);
                            e.end(newEnd);
                            calendar.events.update(e);
                        }
                        calendar._deleteDragSource();
                        break;
                }

                if (typeof calendar.onEventMoved === 'function') {
                    calendar.onEventMoved(args);
                }
            }
            else {
                switch (calendar.eventMoveHandling) {
                    case 'PostBack':
                        calendar.eventMovePostBack(e, newStart, newEnd, null, position);
                        break;
                    case 'CallBack':
                        calendar.eventMoveCallBack(e, newStart, newEnd, null, position);
                        break;
                    case 'JavaScript':
                        calendar.onEventMove(e, newStart, newEnd, ev.ctrlKey, ev.shiftKey, position);
                        break;
                    case 'Notify':
                        calendar.eventMoveNotify(e, newStart, newEnd, null, position);
                        break;
                }
            }


/*
            switch (calendar.eventMoveHandling) {
                case 'PostBack':
                    calendar.eventMovePostBack(e, newStart, newEnd, null, position);
                    break;
                case 'CallBack':
                    calendar.eventMoveCallBack(e, newStart, newEnd, null, position);
                    break;
                case 'JavaScript':
                    calendar.onEventMove(e, newStart, newEnd, ev.ctrlKey, ev.shiftKey, position);
                    break;
                case 'Notify':
                    calendar.eventMoveNotify(e, newStart, newEnd, null, position);
                    break;

            }
*/
        };

        this.eventMoveNotify = function(e, newStart, newEnd, data, line) {

            var old = new DayPilot.Event(e.copy(), this);

            e.start(newStart);
            e.end(newEnd);
            //e.resource(newResource);
            e.commit();

            calendar.update();

            this._invokeEventMove("Notify", old, newStart, newEnd, data, line);

        };

        this._invokeEventMove = function(type, e, newStart, newEnd, data, line) {
            var params = {};
            params.e = e;
            params.newStart = newStart;
            params.newEnd = newEnd;
            //params.newResource = newResource;
            params.position = line;

            this._invokeEvent(type, "EventMove", params, data);
        };

        this.eventResizePostBack = function(e, newStart, newEnd, data) {
            if (!newStart)
                throw 'newStart is null';
            if (!newEnd)
                throw 'newEnd is null';

            var params = {};
            params.e = e;
            params.newStart = newStart;
            params.newEnd = newEnd;

            this._postBack2('EventResize', data, params);
        };

        this.eventResizeCallBack = function(e, newStart, newEnd, data) {
            if (!newStart)
                throw 'newStart is null';
            if (!newEnd)
                throw 'newEnd is null';

            var params = {};
            params.e = e;
            params.newStart = newStart;
            params.newEnd = newEnd;

            this._callBack2('EventResize', params, data);
        };

        this._eventResizeDispatch = function(e, start, width) {
            var startOffset = e.start().getTimePart();

            var endDate = e.rawend().getDatePart();
            if (endDate != e.rawend()) {
                endDate = endDate.addDays(1);
            }
            var endOffset = DayPilot.DateUtil.diff(e.rawend(), endDate);

            var boxStart = this._getDateFromCell(start.x, start.y);
            var boxEnd = boxStart.addDays(width);

            var newStart = boxStart.addTime(startOffset);
            var newEnd = boxEnd.addTime(endOffset);

            newEnd = calendar._adjustEndOut(newEnd);

            if (calendar._api2()) {
                // API v2
                var args = {};

                args.e = e;
                args.control = calendar;
                args.newStart = newStart;
                args.newEnd = newEnd;
                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onEventResize === 'function') {
                    calendar.onEventResize(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.eventResizeHandling) {
                    case 'PostBack':
                        calendar.eventResizePostBack(e, newStart, newEnd);
                        break;
                    case 'CallBack':
                        calendar.eventResizeCallBack(e, newStart, newEnd);
                        break;
                    case 'Notify':
                        calendar.eventResizeNotify(e, newStart, newEnd);
                        break;
                    case 'Update':
                        e.start(newStart);
                        e.end(newEnd);
                        calendar.events.update(e);
                        break;
                }

                if (typeof calendar.onEventResized === 'function') {
                    calendar.onEventResized(args);
                }
            }
            else {
               switch (calendar.eventResizeHandling) {
                    case 'PostBack':
                        calendar.eventResizePostBack(e, newStart, newEnd);
                        break;
                    case 'CallBack':
                        calendar.eventResizeCallBack(e, newStart, newEnd);
                        break;
                    case 'JavaScript':
                        calendar.onEventResize(e, newStart, newEnd);
                        break;
                    case 'Notify':
                        calendar.eventResizeNotify(e, newStart, newEnd);
                        break;

                }
            }

/*
            switch (calendar.eventResizeHandling) {
                case 'PostBack':
                    calendar.eventResizePostBack(e, newStart, newEnd);
                    break;
                case 'CallBack':
                    calendar.eventResizeCallBack(e, newStart, newEnd);
                    break;
                case 'JavaScript':
                    calendar.onEventResize(e, newStart, newEnd);
                    break;
                case 'Notify':
                    calendar.eventResizeNotify(e, newStart, newEnd);
                    break;
            }
            */
        };

        this.eventResizeNotify = function(e, newStart, newEnd, data) {

            var old = new DayPilot.Event(e.copy(), this);

            e.start(newStart);
            e.end(newEnd);
            e.commit();

            calendar.update();

            this._invokeEventResize("Notify", old, newStart, newEnd, data);

        };

        this._invokeEventResize = function(type, e, newStart, newEnd, data) {
            var params = {};
            params.e = e;
            params.newStart = newStart;
            params.newEnd = newEnd;

            this._invokeEvent(type, "EventResize", params, data);
        };


        this.timeRangeSelectedPostBack = function(start, end, data) {
            var range = {};
            range.start = start;
            range.end = end;

            this._postBack2('TimeRangeSelected', data, range);
        };
        this.timeRangeSelectedCallBack = function(start, end, data) {

            var range = {};
            range.start = start;
            range.end = end;

            this._callBack2('TimeRangeSelected', range, data);
        };

        this._timeRangeSelectedDispatch = function(start, end) {

            end = calendar._adjustEndOut(end);

            if (calendar._api2()) {

                var args = {};
                args.start = start;
                args.end = end;
                args.control = calendar;
                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onTimeRangeSelect === 'function') {
                    calendar.onTimeRangeSelect(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                // now perform the default builtin action
                switch (calendar.timeRangeSelectedHandling) {
                    case 'PostBack':
                        calendar.timeRangeSelectedPostBack(start, end);
                        calendar.clearSelection();
                        break;
                    case 'CallBack':
                        calendar.timeRangeSelectedCallBack(start, end);
                        calendar.clearSelection();
                        break;
                }

                if (typeof calendar.onTimeRangeSelected === 'function') {
                    calendar.onTimeRangeSelected(args);
                }

            }
            else {
                switch (calendar.timeRangeSelectedHandling) {
                    case 'PostBack':
                        calendar.timeRangeSelectedPostBack(start, end);
                        calendar.clearSelection();
                        break;
                    case 'CallBack':
                        calendar.timeRangeSelectedCallBack(start, end);
                        calendar.clearSelection();
                        break;
                    case 'JavaScript':
                        calendar.onTimeRangeSelected(start, end);
                        break;
                }
            }

            /*
            switch (calendar.timeRangeSelectedHandling) {
                case 'PostBack':
                    calendar.timeRangeSelectedPostBack(start, end);
                    calendar.clearSelection();
                    break;
                case 'CallBack':
                    calendar.timeRangeSelectedCallBack(start, end);
                    calendar.clearSelection();
                    break;
                case 'JavaScript':
                    calendar.onTimeRangeSelected(start, end);
                    break;
            }
            */
        };

        this.timeRangeMenuClickPostBack = function(e, command, data) {
            var params = {};
            params.selection = e;
            params.command = command;

            this._postBack2("TimeRangeMenuClick", data, params);

        };
        this.timeRangeMenuClickCallBack = function(e, command, data) {
            var params = {};
            params.selection = e;
            params.command = command;

            this._callBack2("TimeRangeMenuClick", params, data);
        };

        this._timeRangeMenuClick = function(command, e, handling) {
            switch (handling) {
                case 'PostBack':
                    calendar.timeRangeMenuClickPostBack(e, command);
                    break;
                case 'CallBack':
                    calendar.timeRangeMenuClickCallBack(e, command);
                    break;
            }
        };

        this.headerClickPostBack = function(c, data) {
            this._postBack2('HeaderClick', data, c);
        };
        this.headerClickCallBack = function(c, data) {
            this._callBack2('HeaderClick', c, data);
        };

        this._headerClickDispatch = function(x) {

            var data = this.data;
            var c = { day: x };
            // check if allowed

            if (calendar._api2()) {

                var args = {};
                args.header = {};
                args.header.dayOfWeek = x;

                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onHeaderClick === 'function') {
                    calendar.onHeaderClick(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.headerClickHandling) {
                    case 'PostBack':
                        calendar.headerClickPostBack(c);
                        break;
                    case 'CallBack':
                        calendar.headerClickCallBack(c);
                        break;
                }

                if (typeof calendar.onHeaderClicked === 'function') {
                    calendar.onHeaderClicked(args);
                }
            }
            else {
                switch (calendar.headerClickHandling) {
                    case 'PostBack':
                        calendar.headerClickPostBack(c);
                        break;
                    case 'CallBack':
                        calendar.headerClickCallBack(c);
                        break;
                    case 'JavaScript':
                        calendar.onHeaderClick(c);
                        break;
                }
            }

        };

        this.timeRangeDoubleClickPostBack = function(start, end, data) {
            var range = {};
            range.start = start;
            range.end = end;
            //range.resource = column;

            this._postBack2('TimeRangeDoubleClick', data, range);
        };
        this.timeRangeDoubleClickCallBack = function(start, end, data) {

            var range = {};
            range.start = start;
            range.end = end;
            //range.resource = column;

            this._callBack2('TimeRangeDoubleClick', range, data);
        };

        this._timeRangeDoubleClickDispatch = function(start, end) {
            if (calendar._api2()) {

                var args = {};
                args.start = start;
                args.end = end;

                args.preventDefault = function() {
                    this.preventDefault.value = true;
                };

                if (typeof calendar.onTimeRangeDoubleClick === 'function') {
                    calendar.onTimeRangeDoubleClick(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }

                switch (calendar.timeRangeDoubleClickHandling) {
                    case 'PostBack':
                        calendar.timeRangeDoubleClickPostBack(start, end);
                        break;
                    case 'CallBack':
                        calendar.timeRangeDoubleClickCallBack(start, end);
                        break;
                }

                if (typeof calendar.onTimeRangeDoubleClicked === 'function') {
                    calendar.onTimeRangeDoubleClicked(args);
                }
            }
            else {
                switch (calendar.timeRangeDoubleClickHandling) {
                    case 'PostBack':
                        calendar.timeRangeDoubleClickPostBack(start, end);
                        break;
                    case 'CallBack':
                        calendar.timeRangeDoubleClickCallBack(start, end);
                        break;
                    case 'JavaScript':
                        calendar.onTimeRangeDoubleClick(start, end);
                        break;
                }
            }

            /*
            switch (calendar.timeRangeDoubleClickHandling) {
                case 'PostBack':
                    calendar.timeRangeDoubleClickPostBack(start, end);
                    break;
                case 'CallBack':
                    calendar.timeRangeDoubleClickCallBack(start, end);
                    break;
                case 'JavaScript':
                    calendar.onTimeRangeDoubleClick(start, end);
                    break;
            }
            */
        };

        this.commandCallBack = function(command, data) {
            this._stopAutoRefresh();

            var params = {};
            params.command = command;

            this._callBack2('Command', params, data);
        };

        this.commandPostBack = function(command, data) {
            this._stopAutoRefresh();

            var params = {};
            params.command = command;

            this._postBack2('Command', params, data);
        };

        this._findEventDiv = function(e) {
            for (var i = 0; i < calendar.elements.events.length; i++) {
                var div = calendar.elements.events[i];
                if (div.event === e || div.event.data === e.data) {
                    return div;
                }
            }
            return null;
        };

        this._findEventDivs = function(e) {
            var result = {};
            result.list = [];
            result.forEach = function(m) {
                if (!m) { return; }
                for (var i = 0; i < this.list.length; i++) {
                    m(this.list[i]);
                }
            };

            for (var i = 0; i < this.elements.events.length; i++) {
                var div = this.elements.events[i];
                if (div.event.data === e.data) {
                    result.list.push(div);
                }
            }
            return result;

        };

        this._getDimensionsFromCss = function(className) {
            var div = document.createElement("div");
            div.style.position = "absolute";
            div.style.top = "-2000px";
            div.style.left = "-2000px";
            div.className = this._prefixCssClass(className);

            document.body.appendChild(div);
            var height = div.offsetHeight;
            var width = div.offsetWidth;
            document.body.removeChild(div);

            var result = {};
            result.height = height;
            result.width = width;
            return result;
        };


        this._resolved = {};
        var resolved = this._resolved;

        resolved._xssProtectionEnabled = function() {
            return calendar.xssProtection !== "Disabled";
        };

        resolved.clearCache = function() {
            delete calendar._cache.eventHeight;
            delete calendar._cache.headerHeight;
        };

        resolved.lineHeight = function() {
            return resolved.eventHeight() + calendar.lineSpace;
        };

        resolved.rounded = function() {
            return calendar.eventCorners === "Rounded";
        };

        resolved.loadFromServer = function() {
            return !!calendar.backendUrl;

/*            // make sure it has a place to ask
            if (calendar.backendUrl) {
                return (typeof calendar.events.list === 'undefined') || (!calendar.events.list);
            }
            else {
                return false;
            }*/
        };

        resolved.locale = function() {
            return DayPilot.Locale.find(calendar.locale);
        };

        resolved.getWeekStart = function() {
            if (calendar.showWeekend) {
                return calendar.weekStarts;
            }
            else {
                return 1; // Monday
            }
        };

        resolved.weekStarts = function() {
            if (!calendar.showWeekend) {
                return 1;  // Monday
            }
            if (calendar.weekStarts === 'Auto') {
                var locale = resolved.locale();
                if (locale) {
                    return locale.weekStarts;
                }
                else {
                    return 0; // Sunday
                }
            }
            else {
                return calendar.weekStarts;
            }
        };


        resolved.notifyType = function() {
            var type;
            if (calendar.notifyCommit === 'Immediate') {
                type = "Notify";
            }
            else if (calendar.notifyCommit === 'Queue') {
                type = "Queue";
            }
            else {
                throw "Invalid notifyCommit value: " + calendar.notifyCommit;
            }

            return type;
        };

        resolved.eventHeight = function() {
            if (calendar._cache.eventHeight) {
                return calendar._cache.eventHeight;
            }
            var height = calendar._getDimensionsFromCss("_event_height").height;
            if (!height) {
                height = calendar.eventHeight;
            }
            calendar._cache.eventHeight = height;
            return height;
        };

        resolved.headerHeight = function() {
            if (calendar._cache.headerHeight) {
                return calendar._cache.headerHeight;
            }
            var height = calendar._getDimensionsFromCss("_header_height").height;
            if (!height) {
                height = calendar.headerHeight;
            }
            calendar._cache.headerHeight = height;
            return height;
        };

        resolved.timeFormat = function() {
            if (calendar.timeFormat !== 'Auto') {
                return calendar.timeFormat;
            }
            return resolved.locale().timeFormat;
        };

        this._visible = function() {
            var el = calendar.nav.top;
            if (!el) {
                return false;
            }
            return el.offsetWidth > 0 && el.offsetHeight > 0;
        };

        // export
        this.exportAs = function(format, options) {
            if (!calendar._visible()) {
                throw new DayPilot.Exception("DayPilot.Month.exportAs(): The instance must be visible during export.");
            }
            var board = img.generate(format, options);
            return new DayPilot.Export(board);
        };

        this._img = {};
        var img = this._img;

        img._options = null;
        img._mode = null;

        // ff, ch, ie 9+
        img.generate = function(format, options) {

            /*

            Supported options:
            area: "viewport" | "full" | "range"
            scale: number
            quality: number (JPEG only)
            dateFrom: DayPilot.Date | string (range only)
            dateTo: DayPilot.Date | string (range only)
            width: number
             */

            if (typeof format === "object") {
                options = format;
                format = null;
            }

            var options = options || {};
            var format = format || options.format || "svg";
            var scale = options.scale || 1;

            if (format === "config") {
                return;
            }

            // backwards compatibility
            if (format.toLowerCase() === "jpg") {
                format = "jpeg";
            }

            var mode = options.area || "viewport";
            img._options = options;
            img._mode = mode;

            // make sure event positions are calculated
            /*img.getRows().forEach(function(row) {
             calendar._updateEventPositionsInRow(row);
             });*/

            var width = img.getWidth();
            var height = img.getHeight();

            var board;
            switch (format.toLowerCase()) {
                case "svg":
                    board = new DayPilot.Svg(width, height);
                    break;
                case "png":
                    board = new DayPilot.Canvas(width, height, "image/png", scale);
                    break;
                case "jpeg":
                    board = new DayPilot.Canvas(width, height, "image/jpeg", scale, options.quality);
                    break;
                default:
                    throw "Export format not supported: " + format;
            }

            var rectangles = img.getRectangles();

            // main
            var backColor = new DayPilot.StyleReader(calendar.nav.top).get("background-color");
            var borderColor = new DayPilot.StyleReader(calendar.nav.top).get("border-top-color");
            //var cornerBackground = new DayPilot.StyleReader(calendar.nav.corner.firstChild).get("background-color");

            // day header
            var header = calendar.nav.header.firstChild.firstChild;
            var headerBackColor = new DayPilot.StyleReader(header).get("background-color");
            var headerFont = new DayPilot.StyleReader(header).getFont();
            var headerColor = new DayPilot.StyleReader(header).get("color");

            // cells
            var cell = calendar.cells[0][0].firstChild;
            var cellBackColor = new DayPilot.StyleReader(cell).get("background-color");
            var cellBorderColor = new DayPilot.StyleReader(cell).get("border-right-color");

            var cellWidth = rectangles.grid.w * calendar._getCellWidth() / 100;

            // events
            /*var eventDiv = calendar.elements.events[0].firstChild;
            var eventBackColor = new DayPilot.StyleReader(eventDiv).get("background-color");
            eventBackColor = DayPilot.Util.isTransparentColor(eventBackColor) ? "white" : eventBackColor;
            var eventBorderColor = new DayPilot.StyleReader(eventDiv).get("border-right-color");
            var eventFont = new DayPilot.StyleReader(eventDiv).getFont();
            var eventColor = new DayPilot.StyleReader(eventDiv).get("color");
            var eventPaddingTop = new DayPilot.StyleReader(eventDiv).getPx("padding-top");
            var eventPaddingLeft = new DayPilot.StyleReader(eventDiv).getPx("padding-left");
            var eventPaddingRight = new DayPilot.StyleReader(eventDiv).getPx("padding-right");
            var eventPaddingBottom = new DayPilot.StyleReader(eventDiv).getPx("padding-bottom");*/

            var left = 0;

            // background
            board.fillRect(rectangles.main, "white");
            board.fillRect(rectangles.main, backColor);

            // day headers
            DayPilot.list.for(calendar._getColCount()).forEach(function(x) {
                var headerProperties = calendar.headerProperties ? calendar.headerProperties[x] : null;

                var dayIndex = x + resolved.weekStarts();
                if (dayIndex > 6) {
                    dayIndex -= 7;
                }

                if (!headerProperties) {
                    var headerProperties = {};
                    headerProperties.html = resolved.locale().dayNames[dayIndex];
                }

                var top = 0;
                var width = cellWidth;
                var height = resolved.headerHeight();
                var text = headerProperties.html;

                var rect = {"x": left, "y": top, "w": width + 1, "h": height + 1};
                var rectText = DayPilot.Util.copyProps(rect);
                //rectText.w -= 4;


                var args = {};
                args.header = {};
                args.header.dayOfWeek = dayIndex;
                args.backColor = headerBackColor;
                args.text = text;
                args.horizontalAlignment = "center";
                args.verticalAlignment = "center";
                args.fontSize = headerFont.size;
                args.fontFamily = headerFont.family;
                args.fontStyle = headerFont.style;
                args.fontColor = headerColor;

                if (typeof calendar.onBeforeHeaderExport === "function") {
                    calendar.onBeforeHeaderExport(args);
                }

                var font = {"size": args.fontSize, "family": args.fontFamily, "style": args.fontStyle};

                board.fillRect(rect, args.backColor);
                board.rect(rect, borderColor);
                board.text(rectText, args.text, font, args.fontColor, args.horizontalAlignment, 0, args.verticalAlignment);

                left += width;

            });

            // cells
            var top = rectangles.grid.y;
            img._getRows().forEach(function(row) {
                var height = row.getHeight();
                var left = 0;
                var y = calendar.rows.indexOf(row);
                DayPilot.list.for(calendar._getColCount()).forEach(function(x) {
                    var cell = calendar.cells[x][y];
                    var props = cell.props;

                    var width = cellWidth;
                    var backColor = new DayPilot.StyleReader(calendar.cells[x][y].firstChild).get("background-color");

                    var cellHeaderDiv = calendar.cells[x][y].firstChild.firstChild;
                    var cellHeaderFont = new DayPilot.StyleReader(cellHeaderDiv).getFont();
                    var cellHeaderColor = new DayPilot.StyleReader(cellHeaderDiv).get("color");
                    var cellHeaderBackColor = new DayPilot.StyleReader(cellHeaderDiv).get("background-color");

                    var d = calendar.firstDate.addDays(y * 7 + x);

                    var args = {};
                    args.cell = {};
                    args.cell.start = d;
                    args.cell.end = d.addDays(1);
                    args.backColor = backColor;
                    args.text = props.headerHtml;
                    args.horizontalAlignment = "right";

                    if (typeof calendar.onBeforeCellExport === "function") {
                        calendar.onBeforeCellExport(args);
                    }

                    // cell
                    var rectCell = {"x": left, "y": top, "w": width + 1, "h": height + 1};
                    board.fillRect(rectCell, args.backColor);
                    board.rect(rectCell, cellBorderColor);

                    // header
                    var rectHeader = {"x": left, "y": top, "w": width - 2, "h": calendar.cellHeaderHeight};
                    // var rectText = DayPilot.Util.copyProps(rectHeader);
                    // rectText.w -= 4;
                    board.fillRect(rectCell, cellHeaderBackColor);
                    board.text(rectHeader, args.text, cellHeaderFont, cellHeaderColor, args.horizontalAlignment);

                    // body
                    left += width;
                });

                top += height;
            });

            // events
            // var top = rectangles.grid.y;;
            var rowTop = 0;
            img._getRows().forEach(function(row) {
                var height = row.getHeight();
                DayPilot.list(row.lines).forEach(function(line) {
                    DayPilot.list(line).forEach(function(ep) {

                        var cache = ep.cache || ep.data;

                        // detection
                        var eventDiv = img._fakeEvent();
                        eventDiv.className += " " + cache.cssClass;
                        var eventInnerDiv = eventDiv.firstChild;
                        var barDiv = eventDiv.querySelector("." + calendar._prefixCssClass("_event_bar"));

                        var eventBorderColor = new DayPilot.StyleReader(eventInnerDiv).get("border-right-color");
                        var eventFont = new DayPilot.StyleReader(eventInnerDiv).getFont();
                        var eventColor = new DayPilot.StyleReader(eventInnerDiv).get("color");
                        var eventBackColor = new DayPilot.StyleReader(eventInnerDiv).getBackColor();
                        var eventBarColor = new DayPilot.StyleReader(barDiv.firstChild).getBackColor();
                        var eventBarWidth = new DayPilot.StyleReader(barDiv.firstChild).getPx("width");
                        var eventPadding = {};
                        eventPadding.left = new DayPilot.StyleReader(eventInnerDiv).getPx("padding-left");
                        eventPadding.right = new DayPilot.StyleReader(eventInnerDiv).getPx("padding-right");
                        eventPadding.top = new DayPilot.StyleReader(eventInnerDiv).getPx("padding-top");
                        eventPadding.bottom = new DayPilot.StyleReader(eventInnerDiv).getPx("padding-bottom");

                        var barColor  = cache.barColor || eventBarColor;

                        DayPilot.de(eventDiv);
                        // END detection

                        var backColor = cache.backColor || eventBackColor;

                        var args = {};
                        args.e = ep;
                        args.text = ep.text ? ep.text() : ep.client.html();
                        args.fontSize = eventFont.size;
                        args.fontFamily = eventFont.family;
                        args.fontStyle = eventFont.style;
                        args.fontColor = cache.fontColor || eventColor;
                        args.backColor = cache.backColor || backColor;
                        args.borderColor = cache.borderColor || eventBorderColor;
                        args.horizontalAlignment = "left";
                        args.barWidth = eventBarWidth;
                        args.barColor = cache.barColor || eventBarColor;

                        if (typeof calendar.onBeforeEventExport === "function") {
                            calendar.onBeforeEventExport(args);
                        }

                        var left = cellWidth * ep.part.colStart ;
                        var width = cellWidth * ep.part.colWidth;
                        // var top = calendar._getEventTop(ep.part.row, ep.part.line) + rectangles.grid.y + 2;
                        var top = rowTop + calendar.cellHeaderHeight + ep.part.line * resolved.lineHeight() + rectangles.grid.y + 2;
                        var height = resolved.eventHeight();

                        var padding = 2;
                        var rect = {"x": left + padding, "y": top, "w": width + 1 - 2*padding, "h": height};

                        var rectInner = DayPilot.Util.copyProps(rect);

/*
                        if (ep.client.barVisible()) {
                            rectInner.x += eventBarWidth;
                            rectInner.w -= eventBarWidth;
                        }
*/

                        var rectText = DayPilot.Util.copyProps(rectInner);
                        rectText.x += eventPadding.left;
                        rectText.w -= eventPadding.left + eventPadding.right;
                        rectText.y += eventPadding.top;
                        rectText.h -= eventPadding.top + eventPadding.bottom;

                        board.fillRect(rect, args.backColor);

                        if (ep.client.barVisible()) {
                            // var rectBar = {"x": rect.x, "y": rect.y, "w": args.barWidth, "h": rect.h};
                            var rectBarInner = {"x": rect.x, "y": rect.y, "w": args.barWidth, "h": rect.h};

                            // board.fillRect(rectBar, args.barBackColor);
                            board.fillRect(rectBarInner, args.barColor);
                        }

                        board.text(rectText, args.text, {"size": args.fontSize, "family": args.fontFamily, "style": args.fontStyle}, args.fontColor, args.horizontalAlignment);
                        board.rect(rect, args.borderColor);


                    });
                });

                rowTop += height;
            });

            // frame
            board.rect(rectangles.main, borderColor);
            board.line(rectangles.grid.x, 0, rectangles.grid.x, rectangles.main.h, borderColor);
            board.line(0, rectangles.grid.y, rectangles.main.w, rectangles.grid.y, borderColor);

            return board;

        };

        img._fakeEvent = function() {
            var div = document.createElement("div");
            div.style.position = "absolute";
            div.style.top = "-2000px";
            div.style.left = "-2000px";
            div.style.display = "none";
            div.className = calendar._prefixCssClass("_event");

            var inner = document.createElement("div");
            inner.className = calendar._prefixCssClass("_event_inner");
            div.appendChild(inner);

            var bar = document.createElement("div");
            bar.className = calendar._prefixCssClass("_event_bar");
            var barInner = document.createElement("div");
            barInner.className = calendar._prefixCssClass("_event_bar_inner");
            bar.appendChild(barInner);
            div.appendChild(bar);

            var wrapper = calendar.nav.events;
            wrapper.appendChild(div);

            return div;
        };

        img._fakeCell = function() {
            var div = document.createElement("div");
            div.style.position = "absolute";
            div.style.top = "-2000px";
            div.style.left = "-2000px";
            div.style.display = "none";
            div.className = calendar._prefixCssClass("_cell");

            var inner = document.createElement("div");
            inner.className = calendar._prefixCssClass("_cell_inner");
            div.appendChild(inner);

            var wrapper = calendar.nav.events;
            wrapper.appendChild(div);

            return div;
        };

        img.getWidth = function() {
            var mode = img._mode;

            var clientWidth = Math.floor(calendar.nav.top.clientWidth/calendar._getColCount()) * calendar._getColCount();

            switch (mode) {
                case "viewport":
                case "full":
                case "range":
                    if (typeof img._options.width === "number") {
                        return img._options.width;
                    }
                    return clientWidth;
                default:
                    throw "Unsupported export mode: " + mode;
            }
        };

        img.getHeight = function() {
            var mode = img._mode;

            switch (mode) {
                case "viewport":
                case "full":
                    return calendar.nav.top.clientHeight;
                case "range":
                    var height = resolved.headerHeight();
                    img._getRows().forEach(function(row) {
                        height += row.getHeight();
                    });
                    return height;
                default:
                    throw "Unsupported export mode: " + mode;
            }
        };

        img._getRows = function() {
            var start = new DayPilot.Date(img._options.dateFrom || calendar.visibleStart());
            var end = new DayPilot.Date(img._options.dateTo || calendar.visibleEnd());

            var filtered = calendar.rows.filter(function(row) {
                if (img._mode === "range") {
                    return DayPilot.Util.overlaps(row.start, row.end, start, end);
                }
                return true;
            });
            return filtered;
        };

        img.getRectangles = function() {
            var headerHeight = resolved.headerHeight();

            var rectangles = {};
            rectangles.main = {"x": 0, "y": 0, "w": img.getWidth(), "h": img.getHeight()};
            rectangles.grid = {"x": 0, "y": headerHeight, "w": img.getWidth(), "h": img.getHeight() - headerHeight};

            return rectangles;
        };

        // internal methods for handling event selection
        this.multiselect = {};

        this.multiselect.initList = [];
        this.multiselect.list = [];
        this.multiselect.divs = [];
        this.multiselect.previous = [];

        this.multiselect._serialize = function() {
            var m = calendar.multiselect;
            return JSON.stringify(m.events());
        };

        this.multiselect.events = function() {
            var m = calendar.multiselect;
            var events = [];
            events.ignoreToJSON = true;
            for (var i = 0; i < m.list.length; i++) {
                events.push(m.list[i]);
            }
            return events;
        };

        this.multiselect._updateHidden = function() {
            // update the hidden field, not implemented
        };

        this.multiselect._toggleDiv = function(div, ctrl) {
            var m = calendar.multiselect;
            if (m.isSelected(div.event)) {
                if (calendar.allowMultiSelect) {
                    if (ctrl) {
                        m.remove(div.event, true);
                    }
                    else {
                        var count = m.list.length;
                        m.clear(true);
                        if (count > 1) {
                            m.add(div.event, true);
                        }

                    }
                }
                else { // clear all
                    m.clear(true);
                }
            }
            else {
                if (calendar.allowMultiSelect) {
                    if (ctrl) {
                        m.add(div.event, true);
                    }
                    else {
                        m.clear(true);
                        m.add(div.event, true);
                    }
                }
                else {
                    m.clear(true);
                    m.add(div.event, true);
                }
            }
            m.redraw();
            m._updateHidden();
        };

        // compare event with the init select list
        this.multiselect._shouldBeSelected = function(ev) {
            var m = calendar.multiselect;
            return m._isInList(ev, m.initList);
        };

        this.multiselect._alert = function() {
            var m = calendar.multiselect;
            var list = [];
            for (var i = 0; i < m.list.length; i++) {
                var event = m.list[i];
                list.push(event.value());
            }
            alert(list.join("\n"));
        };

        this.multiselect.add = function(ev, dontRedraw) {
            var m = calendar.multiselect;
            if (m._indexOf(ev) === -1) {
                m.list.push(ev);
            }
            if (dontRedraw) {
                return;
            }
            m.redraw();
        };

        this.multiselect.remove = function(ev, dontRedraw) {
            var m = calendar.multiselect;
            var i = m._indexOf(ev);
            if (i !== -1) {
                m.list.splice(i, 1);
            }
        };

        this.multiselect.clear = function(dontRedraw) {
            var m = calendar.multiselect;
            m.list = [];

            if (dontRedraw) {
                return;
            }
            m.redraw();
        };

        this.multiselect.redraw = function() {
            //alert('redrawing');
            //calendar.debug("redrawing");
            var m = calendar.multiselect;
            for (var i = 0; i < calendar.elements.events.length; i++) {
                var div = calendar.elements.events[i];
                if (m.isSelected(div.event)) {
                    m._divSelect(div);
                }
                else {
                    m._divDeselect(div);
                }
            }
        };

        this.multiselect._divSelect = function(div) {
            var m = calendar.multiselect;
            var cn = calendar._prefixCssClass("_selected");
            var div = m._findContentDiv(div);
            DayPilot.Util.addClass(div, cn);
            m.divs.push(div);
        };

        this.multiselect._findContentDiv = function(div) {
            return div;
        };

        this.multiselect._divDeselectAll = function() {
            var m = calendar.multiselect;
            for (var i = 0; i < m.divs.length; i++) {
                var div = m.divs[i];
                m._divDeselect(div, true);
            }
            m.divs = [];
        };

        this.multiselect._divDeselect = function(div, dontRemoveFromCache) {
            var m = calendar.multiselect;
            var cn = calendar._prefixCssClass("_selected");
            var c = m._findContentDiv(div);
            if (c && c.className && c.className.indexOf(cn) !== -1) {
                c.className = c.className.replace(cn, "");
            }

            if (dontRemoveFromCache) {
                return;
            }
            var i = DayPilot.indexOf(m.divs, div);
            if (i !== -1) {
                m.divs.splice(i, 1);
            }

        };

        this.multiselect.isSelected = function(ev) {
            //return calendar.multiselect.indexOf(ev) != -1;
            return calendar.multiselect._isInList(ev, calendar.multiselect.list);
        };

        this.multiselect._indexOf = function(ev) {
            var data = ev.data;
            for (var i = 0; i < calendar.multiselect.list.length; i++) {
                var item = calendar.multiselect.list[i];
                if (calendar._isSameEvent(item.data, data)) {
                    return i;
                }
            }
            return -1;
        };

        this.multiselect._isInList = function(e, list) {
            if (!list) {
                return false;
            }
            for (var i = 0; i < list.length; i++) {
                var ei = list[i];
                if (calendar._isSameEvent(e, ei)) {
                    return true;
                }
            }

            return false;
        };

        this._isSameEvent = function(data1, data2) {
            return DayPilot.Util.isSameEvent(data1, data2);
        };

        this.events.forRange = function(start, end) {
            start = new DayPilot.Date(start);
            end = new DayPilot.Date(end);

            return DayPilot.list(calendar.events.list).filter(function(item) {
                var estart = new DayPilot.Date(item.start);
                var eend = new DayPilot.Date(item.end);

                var startPointOnly = estart === eend && estart === start;
                return startPointOnly || DayPilot.Util.overlaps(start, end, estart, eend);
            }).map(function(item) {
                return new DayPilot.Event(item, calendar);
            });
        };

        this.events.find = function(id) {
            if (!calendar.events.list || typeof calendar.events.list.length === 'undefined') {
                return null;
            }

            var len = calendar.events.list.length;
            for (var i = 0; i < len; i++) {
                if (calendar.events.list[i].id === id) {
                    return new DayPilot.Event(calendar.events.list[i], calendar);
                }
            }
            return null;
        };

        this.events.findRecurrent = function(masterId, time) {
            if (!calendar.events.list || typeof calendar.events.list.length === 'undefined') {
                return null;
            }
            var len = calendar.events.list.length;
            for (var i = 0; i < len; i++) {
                if (calendar.events.list[i].recurrentMasterId === masterId && calendar.events.list[i].start.getTime() === time.getTime()) {
                    return new DayPilot.Event(calendar.events.list[i], calendar);
                }
            }
            return null;
        };

        this.events.update = function(e, data) {
            var params = {};
            params.oldEvent = new DayPilot.Event(e.copy(), calendar);
            params.newEvent = new DayPilot.Event(e.temp(), calendar);

            var action = new DayPilot.Action(calendar, "EventUpdate", params, data);

            e.commit();

            if (calendar._initialized) {
                calendar.update();
            }

            calendar._angular.notify();

            return action;
        };


        this.events.remove = function(e, data) {

            var params = {};
            params.e = new DayPilot.Event(e.data, calendar);

            var action = new DayPilot.Action(calendar, "EventRemove", params, data);

            var index = DayPilot.indexOf(calendar.events.list, e.data);
            calendar.events.list.splice(index, 1);

            if (calendar._initialized) {
                calendar.update();
            }

            calendar._angular.notify();

            return action;
        };

        this.events.add = function(e, data) {

            if (!(e instanceof DayPilot.Event)) {
                e = new DayPilot.Event(e);
            }

            e.calendar = calendar;

            if (!calendar.events.list) {
                calendar.events.list = [];
            }

            calendar.events.list.push(e.data);

            var params = {};
            params.e = e;

            var action = new DayPilot.Action(calendar, "EventAdd", params, data);

            if (calendar._initialized) {
                calendar.update();
            }

            calendar._angular.notify();

            return action;

        };

        this.events.filter = function(args) {
            calendar.events._filterParams = args;
            calendar._update();
        };

        this.events.load = function(url, success, error) {
            var onError = function (args) {
                var largs = {};
                largs.exception = args.exception;
                largs.request = args.request;

                if (typeof error === 'function') {
                    error(largs);
                }
            };

            var onSuccess = function (args) {
                var r = args.request;
                var data;

                // it's supposed to be JSON
                try {
                    data = JSON.parse(r.responseText);
                }
                catch (e) {
                    var fargs = {};
                    fargs.exception = e;
                    onError(fargs);
                    return;
                }

                if (DayPilot.isArray(data)) {
                    var sargs = {};
                    sargs.preventDefault = function () {
                        this.preventDefault.value = true;
                    };
                    sargs.data = data;
                    if (typeof success === "function") {
                        success(sargs);
                    }

                    if (sargs.preventDefault.value) {
                        return;
                    }

                    calendar.events.list = data;
                    if (calendar._initialized) {
                        calendar.update();
                    }
                }
            };

            var usePost = calendar.eventsLoadMethod && calendar.eventsLoadMethod.toUpperCase() === "POST";

            if (usePost) {
                DayPilot.ajax({
                    "method": "POST",
                    "data": {"start": calendar.visibleStart().toString(), "end": calendar.visibleEnd().toString()},
                    "url": url,
                    "success": onSuccess,
                    "error": onError
                });
            }
            else {
                var fullUrl = url;
                var queryString = "start=" + calendar.visibleStart().toString() + "&end=" + calendar.visibleEnd().toString();
                if (fullUrl.indexOf("?") > -1) {
                    fullUrl += "&" + queryString;
                }
                else {
                    fullUrl += "?" + queryString;
                }

                DayPilot.ajax({
                    "method": "GET",
                    "url": fullUrl,
                    "success": onSuccess,
                    "error": onError
                });
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

        this.queue = {};
        this.queue.list = [];
        this.queue.list.ignoreToJSON = true;

        this.queue.add = function(action) {
            if (!action) {
                return;
            }
            if (action.isAction) {
                calendar.queue.list.push(action);
            }
            else {
                throw "DayPilot.Action object required for queue.add()";
            }
        };

        this.queue.notify = function(data) {
            var params = {};
            params.actions = calendar.queue.list;
            calendar._callBack2('Notify', params, data, "Notify");

            calendar.queue.list = [];
        };


        this.queue.clear = function() {
            calendar.queue.list = [];
        };

        this.queue.pop = function() {
            return calendar.queue.list.pop();
        };

        this._adjustEndOut = function(date) {
            if (calendar.eventEndSpec === "DateTime") {
                return date;
            }
            if (date.getDatePart().ticks === date.ticks) {
                return date.addDays(-1);
            }
            return date.getDatePart();
        };

        this._adjustEndIn = function(date) {
            if (calendar.eventEndSpec === "DateTime") {
                return date;
            }
            return date.getDatePart().addDays(1);
        };

        this._adjustEndNormalize = function(date) {
            if (calendar.eventEndSpec === "DateTime") {
                return date;
            }
            return date.getDatePart();
        };

        // interval defined in seconds, minimum 30 seconds
        this._startAutoRefresh = function(forceEnabled) {

            if (forceEnabled) {
                this.autoRefreshEnabled = true;
            }

            if (!this.autoRefreshEnabled) {
                return;
            }

            if (this._autoRefreshCount >= this.autoRefreshMaxCount) {
                return;
            }

            //this.autoRefreshCount = 0; // reset
            this._stopAutoRefresh();

            var interval = this.autoRefreshInterval;
            if (!interval || interval < 10) {
                throw "The minimum autoRefreshInterval is 10 seconds";
            }

            //this.autoRefresh = interval * 1000;
            this.autoRefreshTimeout = window.setTimeout(function() { calendar._doRefresh(); }, this.autoRefreshInterval * 1000);
        };

        this._stopAutoRefresh = function() {
            if (this.autoRefreshTimeout) {
                window.clearTimeout(this.autoRefreshTimeout);
            }
        };

        this._doRefresh = function() {
            if (!DayPilotMonth.eventResizing && !DayPilotMonth.eventMoving && !DayPilotMonth.timeRangeSelecting) {
                var skip = false;
                if (typeof this.onAutoRefresh === 'function') {
                    var args = {};
                    args.i = this._autoRefreshCount;
                    args.preventDefault = function() {
                        this.preventDefault.value = true;
                    };

                    calendar.onAutoRefresh(args);
                    if (args.preventDefault.value) {
                        skip = true;
                    }
                }
                if (!skip && this._serverBased()) {
                    this.commandCallBack(this.autoRefreshCommand);
                }
                this._autoRefreshCount++;

                /*
                this.autoRefreshCount++;
                this.commandCallBack(this.autoRefreshCommand);
                */
            }
            if (this._autoRefreshCount < this.autoRefreshMaxCount) {
                this.autoRefreshTimeout = window.setTimeout(function() { calendar._doRefresh(); }, this.autoRefreshInterval * 1000);
            }
        };

        this._update = function(args) {
            if (!this.cells) {  // not initialized yet
                return;
            }

            var args = args || {};
            var full = !args.eventsOnly;

            if (!calendar.cssOnly) {
                calendar.cssOnly = true;
            }

            calendar._deleteEvents();
            calendar._prepareRows();
            calendar._loadEvents();

            if (full) {
                //calendar._updateHeight();
                calendar._resolved.clearCache();
                calendar._clearTable();
                calendar._drawTable();
            }
            calendar._updateHeight();
            calendar._show();
            calendar._drawEvents();

            if (this.visible) {
                this.show();
            }
            else {
                this.hide();
            }

        };

        this.update = function(options) {

            if (!calendar._initialized) {
                throw new DayPilot.Exception("You are trying to update a DayPilot.Month instance that hasn't been initialized yet.");
            }

            if (calendar._disposed) {
                throw new DayPilot.Exception("You are trying to update a DayPilot.Month instance that has been disposed.");
            }

            this._loadOptions(options);
            this._update();
        };

        this.dispose = function() {
            //var start = new Date();

            var c = calendar;
            if (!c.nav.top) {
                return;
            }

            c._stopAutoRefresh();
            c._deleteEvents();

            c.nav.top.removeAttribute("style");
            c.nav.top.removeAttribute("class");
            c.nav.top.innerHTML = '';
            c.nav.top.dp = null;

            c.nav.top.onmousemove = null;

            DayPilot.ue(c.nav.top, "touchstart", touch.onMainTouchStart);
            DayPilot.ue(c.nav.top, "touchmove", touch.onMainTouchMove);
            DayPilot.ue(c.nav.top, "touchend", touch.onMainTouchEnd);

            c.nav.top = null;

            DayPilot.ue(window, "resize", c._onResize);

            DayPilotMonth.unregister(c);

            if (typeof DayPilot.Bubble !== "undefined") {
                DayPilot.Bubble.cancelShowing();
                DayPilot.Bubble.hide({"calendar": c});
            }

            if (typeof DayPilot.Menu !== "undefined") {
                DayPilot.Menu.hide({"calendar": c});
            }
        };

        this._registerGlobalHandlers = function() {
            if (!DayPilotMonth.globalHandlers) {
                DayPilotMonth.globalHandlers = true;
                DayPilot.re(document, 'mousemove', DayPilotMonth.gMouseMove);
                DayPilot.re(document, 'mouseup', DayPilotMonth.gMouseUp);

                DayPilot.reNonPassive(document, "touchmove", DayPilotMonth.gMouseMove);
            }
            DayPilot.re(window, "resize", this._onResize);
        };

        this._out = function() {
            doNothing();
        };

        this._deleteDragSource = function() {
            if (calendar.todo) {
                if (calendar.todo.del) {
                    var del = calendar.todo.del;
                    del.parentNode.removeChild(del);
                    calendar.todo.del = null;
                }
            }
        };

        this._versionCheck = function() {

            // check licensing restrictions

            switch (calendar._productCode) {
                case "aspnet":
                    if (!this._isAspnetWebForms()) {
                        throw new DayPilot.Exception("ASP.NET WebForms environment required. https://doc.daypilot.org/common/asp-net-webforms-required/");
                    }
                    break;
                case "netmvc":
                    if (!this.backendUrl) {
                        throw new DayPilot.Exception("DayPilot.Scheduler.backendUrl required. https://doc.daypilot.org/common/backendurl-required-asp-net-mvc/");
                    }
                    break;
                case "javaxx":
                    if (!this.backendUrl) {
                        throw new DayPilot.Exception("DayPilot.Scheduler.backendUrl required. https://doc.daypilot.org/common/backendurl-required-java/");
                    }
                    break;
            }
        };

        this._show = function() {
            if (this.nav.top.style.visibility === 'hidden') {
                this.nav.top.style.visibility = 'visible';
            }
        };

        this.show = function() {
            calendar.visible = true;
            calendar.nav.top.style.display = '';
        };

        this.hide = function() {
            calendar.visible = false;
            calendar.nav.top.style.display = 'none';
        };

        this._loadTop = function() {
            if (this.id && this.id.tagName) {
                this.nav.top = this.id;
            }
            else if (typeof this.id === "string") {
                this.nav.top = document.getElementById(this.id);
                if (!this.nav.top) {
                    throw "DayPilot.Month: The placeholder element not found: '" + id + "'.";
                }
            }
            else {
                throw "DayPilot.Month() constructor requires the target element or its ID as a parameter";
            }
            this.nav.limit;
        };


        this._initShort = function() {

            this._loadTop();
            this._prepareRows();
            this._drawTop();
            this._drawTable();
            this._updateHeight();
            this._registerGlobalHandlers();
            this._startAutoRefresh();
            this._callBack2('Init'); // load events

            DayPilotMonth.register(this);
        };

        this.init = function() {
            if (this._initialized) {
                throw new DayPilot.Exception("This instance is already initialized. Use update() to change properties.")
            }

            this._loadTop();

            if (this.nav.top.dp) {
                if (this.nav.top.dp === calendar) {
                    return calendar;
                }
                if (this._isAspnetWebForms()) { // updatepanel
                    return calendar;
                }
                throw new DayPilot.Exception("The target placeholder was already initialized by another DayPilot component instance.");
            }

            this._versionCheck();

            var loadFromServer = resolved.loadFromServer();

            if (!calendar.cssOnly) {
                calendar.cssOnly = true;
                window.console && window.console.log && window.console.log("DayPilot: cssOnly = false mode is not supported since DayPilot Pro 8.0.");
            }

            if (loadFromServer) {
                this._initShort();
                this._initialized = true;
                return this;
            }

            this._prepareRows();
            this._loadEvents();
            this._drawTop();
            this._drawTable();
            this._show();
            this._drawEvents();
            this._updateHeight();

            this._registerGlobalHandlers();

            if (this.messageHTML) {
                window.setTimeout(function() { calendar.message(calendar.messageHTML); }, 0);
            }

            this._fireAfterRenderDetached(null, false);

            if (calendar.initEventEnabled) {
                setTimeout(function() {
                    calendar._callBack2("Init");
                });
            }


            this._startAutoRefresh();
            DayPilotMonth.register(this);

            this._initialized = true;
            this._postInit();

            return this;
        };

        this._specialHandling = null;
        this._loadOptions = function(options) {
            if (!options) {
                return;
            }
            var specialHandling = {
                "events": {
                    "preInit": function() {
                        var events = this.data;
                        if (!events) {
                            return;
                        }
                        if (DayPilot.isArray(events.list)) {
                            calendar.events.list = events.list;
                        }
                        else {
                            calendar.events.list = events;
                        }
                    }
                }
            };
            this._specialHandling = specialHandling;

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

        this._postInit = function() {
            var specialHandling = this._specialHandling;
            for (var name in specialHandling) {
                var item = specialHandling[name];
                if (item.postInit) {
                    item.postInit();
                }
            }
        };


        // communication between components
        this.internal = {};
        // ASP.NET
        this.internal.initialized = function() {
            return calendar._initialized;
        };
        // DayPilot.Action
        this.internal.invokeEvent = this._invokeEvent;
        // DayPilot.Menu
        this.internal.eventMenuClick = this._eventMenuClick;
        this.internal.timeRangeMenuClick = this._timeRangeMenuClick;
        // DayPilot.Bubble
        this.internal.bubbleCallBack = this._bubbleCallBack;
        this.internal.findEventDiv = this._findEventDiv;

        // common/DayPilot.Event
        this.internal.adjustEndIn = this._adjustEndIn;
        this.internal.xssTextHtml = calendar._xssTextHtml;

        // areas
        this.internal.touch = calendar._touch;

        // React
        this.internal.enableReact = function (react, reactDOM) {
            calendar._react.react = react;
            calendar._react.reactDOM = reactDOM;
        };
        this.internal.reactRefs = function() {
            return DayPilot.Util.copyProps(calendar._react, {}, ["react", "reactDOM"]);
        };

        // Angular
        this.internal.loadOptions = calendar._loadOptions;

        this.Init = this.init;

        // API compatibility (common)
        Object.defineProperty(this, 'durationBarVisible', { get: function() { return calendar.eventBarVisible; } });

        this._loadOptions(options);
    };


    /*
     * options: {
     *      element: dom element,
     *      duration: duration in minutes,
     *      text: event text,
     *      id: id,
     *      keepElement: whether to keep the original element
     * }
     */
    DayPilot.Month.makeDraggable = function(options) {
        var element = options.element;
        var removeElement = options.keepElement ? null : element;
        var duration = options.duration || 1;

        if (navigator.msPointerEnabled) {
            element.style.msTouchAction = "none";
            element.style.touchAction = "none";
        }

        var mousedown = function(ev) {

            startDragging();

            var element = (ev.target || ev.srcElement);
            if(element.tagName) {
                var tagname = element.tagName.toLowerCase();
                if(tagname === "textarea" || tagname === "select" || tagname === "input") {
                    return false;
                }
            }
            ev.preventDefault && ev.preventDefault();
            return false;

        };

        var touchstart = function(ev) {

            if (DayPilot.Util.isMouseEvent(ev)) {
                return;
            }

            var holdfor = 0;

            window.setTimeout(function() {
                startDragging();

                DayPilotMonth.gMouseMove(ev);

                ev.preventDefault();
            }, holdfor);

            ev.preventDefault();
        };

        function startDragging() {
            // TODO create drag.event = new DayPilot.Event() here
            // TODO merge with DayPilot.Scheduler.startDragging()

            var ds = options.duration || 60;

            if (ds instanceof DayPilot.Duration) {
                ds = ds.totalSeconds();
            }

            var drag = DayPilotMonth.drag = {};
            drag.element = removeElement;
            drag.id = options.id;
            drag.duration = ds;
            drag.text = options.text || "";
            drag.data = options;
            drag.shadowType = "Fill";
        }

        //element.addEventListener(DayPilot.touch.start, touchstart, false);
        DayPilot.us(element);  // make it unselectable
        DayPilot.re(element, "mousedown", mousedown);
        DayPilot.re(element, DayPilot.touch.start, touchstart);

        element.cancelDraggable = function() {
            DayPilot.ue(element, "mousedown", mousedown);
            DayPilot.ue(element, DayPilot.touch.start, touchstart);
            delete element.cancelDraggable;
        };

    };

    DayPilotMonth.createGShadow = function() {

        var shadow = document.createElement('div');
        shadow.setAttribute('unselectable', 'on');
        shadow.style.position = 'absolute';
        shadow.style.width = '100px';
        shadow.style.height = '20px';
        shadow.style.border = '2px dotted #666666';
        shadow.style.zIndex = 101;
        shadow.style.pointerEvents = "none";

        shadow.style.backgroundColor = "#aaaaaa";
        shadow.style.opacity = 0.5;
        shadow.style.filter = "alpha(opacity=50)";
        shadow.style.border = '2px solid #aaaaaa';

        document.body.appendChild(shadow);

        return shadow;
    };


    DayPilotMonth.gMouseMove = function(ev) {

        if (typeof (DayPilotMonth) === 'undefined') {
            return;
        }

        // quick and dirty inside detection
        // hack, but faster than recursing through the parents
        if (ev.insideMainD) {  // FF
            return;
        }
        else if (ev.srcElement) {  // IE
            if (ev.srcElement.inside) {
                return;
            }
        }

        var mousePos = DayPilot.mc(ev);

        if (DayPilotMonth.drag) {

            document.body.style.cursor = 'move';
            if (!DayPilotMonth.gShadow) {
                DayPilotMonth.gShadow = DayPilotMonth.createGShadow();
            }


            var shadow = DayPilotMonth.gShadow;
            shadow.style.left = mousePos.x + 'px';
            shadow.style.top = mousePos.y + 'px';

            // is this necessary?
            DayPilotMonth.movingEvent = null;

            DayPilot.de(DayPilotMonth.movingShadow);
            DayPilotMonth.movingShadow = null;

        }

        for (var i = 0; i < DayPilotMonth.registered.length; i++) {
            if (DayPilotMonth.registered[i]._out) {
                DayPilotMonth.registered[i]._out();
            }
        }

    };


    DayPilotMonth.register = function(calendar) {
        if (!DayPilotMonth.registered) {
            DayPilotMonth.registered = [];
        }
        for (var i = 0; i < DayPilotMonth.registered.length; i++) {
            if (DayPilotMonth.registered[i] === calendar) {
                return;
            }
        }
        DayPilotMonth.registered.push(calendar);

    };

    DayPilotMonth.unregister = function(calendar) {
        var a = DayPilotMonth.registered;
        if (a) {
            var i = DayPilot.indexOf(a, calendar);
            if (i !== -1) {
                a.splice(i, 1);
            }
            if (a.length === 0) {
                a = null;
            }
        }

        if (!a) {
            DayPilot.ue(document, 'mouseup', DayPilotMonth.gMouseUp);
            DayPilotMonth.globalHandlers = false;
        }
    };


    DayPilotMonth.gMouseUp = function(ev) {

        cleanGlobalShadow();

        if (DayPilotMonth.movingEvent) {
            var src = DayPilotMonth.movingEvent;
            DayPilotMonth.movingEvent = null;

            if (!src.event || !src.event.calendar || !src.event.calendar.shadow || !src.event.calendar.shadow.start) {
                return;
            }

            // load ref
            var calendar = src.event.calendar;
            var e = src.event;
            var start = calendar.shadow.start;
            var position = calendar.shadow.position;
            var offset = src.offset;
            var external = src.external;


            var removeElement = src.removeElement;
            if (removeElement) {
                if (!calendar.todo) {
                    calendar.todo = {};
                }
                calendar.todo.del = removeElement;
            }

            var disabled = calendar.shadow.disabled;

            // cleanup
            calendar._clearShadow();
            //DayPilotMonth.movingEvent = null;

            var ev = ev || window.event;

            // fire the event
            if (!disabled) {
                calendar._eventMoveDispatch(e, start.x, start.y, offset, ev, position, external);
            }

            ev.cancelBubble = true;
            if (ev.stopPropagation) {
                ev.stopPropagation();
            }
            return false;
        }
        else if (DayPilotMonth.resizingEvent) {
            var src = DayPilotMonth.resizingEvent;
            DayPilotMonth.resizingEvent = null;

            if (!src.event || !src.event.calendar || !src.event.calendar.shadow || !src.event.calendar.shadow.start) {
                return;
            }

            // load ref
            var calendar = src.event.calendar;

            var e = src.event;
            var start = calendar.shadow.start;
            var width = calendar.shadow.width;

            var disabled = calendar.shadow.disabled;

            // cleanup
            calendar._clearShadow();

            // fire the event
            if (!disabled) {
                calendar._eventResizeDispatch(e, start, width);
            }

            ev.cancelBubble = true;
            return false;
        }
        else if (DayPilotMonth.timeRangeSelecting) {
            //DayPilotMonth.cancelCellClick = true;

            // required for shadow displayed on mousedown (prevents oncellclick)
            // var triggerWhenNotMoved = true;
            if (DayPilotMonth.timeRangeSelecting.moved) {
                var sel = DayPilotMonth.timeRangeSelecting;
                var calendar = sel.root;

                var start = new DayPilot.Date(calendar._getDateFromCell(sel.from.x, sel.from.y));
                var end = start.addDays(sel.width);
                if (!calendar.shadow.disabled) {
                    calendar._timeRangeSelectedDispatch(start, end);
                }
                else {
                    calendar.clearSelection();
                }

            }
            else {
                var sel = DayPilotMonth.timeRangeSelecting;
                var calendar = sel.root;
                var cell = calendar.cells[sel.from.x][sel.from.y];
                calendar._onCellClick.apply(cell);
            }
            DayPilotMonth.timeRangeSelecting = null;
        }

        function cleanGlobalShadow() {
            // clean up external drag helpers
            if (DayPilotMonth.drag) {
                DayPilotMonth.drag = null;

                document.body.style.cursor = '';
            }

            if (DayPilotMonth.gShadow) {
                document.body.removeChild(DayPilotMonth.gShadow);
                DayPilotMonth.gShadow = null;
            }
        }

    };

    // experimental jQuery bindings
    if (typeof jQuery !== 'undefined') {
        (function($) {
            $.fn.daypilotMonth = function(options) {
                var first = null;
                var j = this.each(function() {
                    if (this.daypilot) { // already initialized
                        return;
                    };

                    var daypilot = new DayPilot.Month(this.id, options);
                    daypilot.init();
                    this.daypilot = daypilot;
                    /*
                    for (var name in options) {
                        daypilot[name] = options[name];
                    }*/
                    if (!first) {
                        first = daypilot;
                    }
                });
                if (this.length === 1) {
                    return first;
                }
                else {
                    return j;
                }
            };
        })(jQuery);
    }

    (function registerAngularModule() {

        var app = DayPilot.am();

        if (!app) {
            return;
        }

        app.directive("daypilotMonth", ['$parse', function($parse) {
            return {
                "restrict": "E",
                "template": "<div id='{{id}}'></div>",
                "compile": function compile(element, attrs) {
                    element.replaceWith(this["template"].replace("{{id}}", attrs["id"]));

                    return function link(scope, element, attrs) {
                        var calendar = new DayPilot.Month(element[0]);
                        calendar._angular.scope = scope;
                        calendar.init();

                        var oattr = attrs["id"];
                        if (oattr) {
                            scope[oattr] = calendar;
                        }

                        // save DayPilot.Calendar object in the specified variable
                        var pas = attrs["publishAs"];
                        if (pas) {
                            var getter = $parse(pas);
                            var setter = getter.assign;
                            setter(scope, calendar);
                        }

                        // bind event handlers from attributes starting with "on"
                        for (var name in attrs) {
                            if (name.indexOf("on") === 0) {  // event handler
                                var apply = DayPilot.Util.shouldApply(name);

                                if (apply) {
                                    (function(name) {
                                        calendar[name] = function(args) {
                                            var f = $parse(attrs[name]);
                                            scope["$apply"](function() {
                                                f(scope, {"args": args});
                                            });
                                        };
                                    })(name);
                                }
                                else {
                                    (function(name) {
                                        calendar[name] = function(args) {
                                            var f = $parse(attrs[name]);
                                            f(scope, {"args": args});
                                        };
                                    })(name);
                                }

                            }
                        }

                        var watch = scope["$watch"];
                        var config = attrs["config"] || attrs["daypilotConfig"];
                        var events = attrs["events"] || attrs["daypilotEvents"];

                        watch.call(scope, config, function (value, oldVal) {
                            for (var name in value) {
                                calendar[name] = value[name];
                            }
                            calendar.update();
                        }, true);

                        watch.call(scope, events, function(value) {
                            calendar.events.list = value;
                            calendar._update({"eventsOnly": true});
                        }, true);

                    };
                }
            };
        }]);
    })();

    DayPilot.Month.def = {};

    if (typeof Sys !== 'undefined' && Sys.Application && Sys.Application.notifyScriptLoaded) {
        Sys.Application.notifyScriptLoaded();
    }

})(DayPilot);
