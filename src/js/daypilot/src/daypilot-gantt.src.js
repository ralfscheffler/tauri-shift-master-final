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
    

    if (typeof DayPilot.Gantt !== 'undefined' && DayPilot.Gantt.def) {
        return;
    }

    var doNothing = function() { };

    DayPilot.Gantt = function(id, options) {
        this.v = '2023.2.5592';

        var calendar = this;
        this.id = id; // referenced
        this.isGantt = true;

        var scheduler = new DayPilot.Scheduler(id);
        this.scheduler = scheduler;

        // scheduler setup
        scheduler.viewType = "Resources";
        //scheduler.taskMoveHandling = "Update";
        //scheduler.linksEnabled = true;

        scheduler.onCallBackHeader = function(args) {
            args.header.taskGroupMode = calendar.taskGroupMode;
            args.header.rowHeaderColumns = calendar.columns;
            args.header.clientState = calendar.clientState;
        };

        scheduler.onGetNodeState = function(args) {

            var getTags = function(task) {
                var result = {};
                if (task.tags) {
                    for (var name in task.tags) {
                        result[name] = "" + task.tags[name];
                    }
                }
                return result;
            };


            var getNode = function(row) {
                var task = row.task;

                var result = {};
                result.start = task.start;
                result.end = task.end;
                result.id = task.id;
                result.complete = task.complete;
                result.text = task.text;
                result.type = task.type;
                result.expanded = row.expanded;
                result.loaded = row.loaded;
                result.tags = getTags(task);
                result.versions = task.versions;

                result.children = scheduler.internal.getNodeChildren(row.children);

                return result;
            };

            args.result = getNode(args.row);
            args.preventDefault();
        };

        scheduler._taskVersionJson = function(version) {

        };

        scheduler.onCallBackResult = function(args) {
            var result = args.result;
            args.preventDefault();

            var scrollToTask = function() {
                if (result.scrollToTaskId) {
                    scheduler.scrollToResource(result.scrollToTaskId);
                }
            };

            if (result.updateType === "None") {
                scrollToTask();
                return;
            }

            var update = function(list) {
                for (var i = 0; i < list.length; i++) {
                    var name = list[i];
                    if (typeof result[name] !== "undefined") {
                        calendar[name] = result[name];
                    }
                }
            };

            // data
            calendar.links.list = result.links;
            calendar.tasks.list = result.tasks;

            // callback-changeable properties
            calendar.startDate = new DayPilot.Date(result.startDate);
            update(['days', 'cellDuration', 'cellGroupBy', 'cellWidth', 'cellWidthSpec', 'cornerHtml', 'separators', 'rowMinHeight', 'rowMarginBottom', 'taskGroupMode', 'selectedRows']);

            // server-generated properties
            update(['cellProperties', 'cellConfig', 'timeHeader', 'timeHeaders', 'timeline', 'columns']);
            /*
            calendar.cellProperties = result.cellProperties;
            calendar.cellConfig = result.cellConfig;
            calendar.timeHeader = result.timeHeader;
            calendar.timeHeaders = result.timeHeaders;
            calendar.timeline = result.timeline;
            */

            wrap.translate();
            wrap._loadTasks();
            wrap._loadLinks();
            scheduler.update();
            scheduler.show();

            scrollToTask();
        };

        // default properties
        this.taskGroupMode = "Auto"; // behavior of task groups/parent nodes

        // translated scheduler properties
        this.autoRefreshCommand = "refresh";
        this.autoRefreshEnabled = false;
        this.autoRefreshInterval = 60;
        this.autoRefreshMaxCount = 20;
        this.autoScroll = "Drag";
        if (typeof DayPilot.Bubble === "function") {
            this.bubbleTask = new DayPilot.Bubble();
            this.bubbleCell = new DayPilot.Bubble();
            this.bubbleRow = new DayPilot.Bubble();
        } else {
            this.bubbleTask = null;
            this.bubbleCell = null;
            this.bubbleRow = null;
        }
        this.cellDuration = 1440;
        this.cellGroupBy = "Month";
        this.cellWidth = 40;
        this.cellWidthSpec = "Fixed";
        this.completeBarVisible = true;
        this.completeBarHeight = 3;
        this.contextMenuTask = null;
        this.contextMenuRow = null;
        this.contextMenuLink = null;
        this.cornerText = "";
        this.cornerHtml = null;
        this.crosshairType = 'Header';
        this.doubleClickTimeout = 300;
        this.progressiveTaskRendering = 'Progressive';
        this.progressiveTaskRenderingMargin = 500;
        this.progressiveTaskRenderingCacheSweeping = false;
        this.progressiveTaskRenderingCacheSize = 200;
        this.floatingTasks = true;
        this.floatingTimeHeaders = true;
        this.headerHeight = 30;
        this.height = 300;
        this.heightSpec = "Max";
        this.hideBorderFor100PctHeight = false;
        this.hideUntilInit = false;
        this.linkBottomMargin = 17;
        this.linkPointSize = 10;
        this.loadingLabelVisible = true;
        this.loadingLabelText = "Loading...";
        this.loadingLabelHtml = null;
        this.locale = "en-us";
        this.messageBarPosition = "Top";
        this.messageHideAfter = 5000;
        this.progressiveRowRendering = true;
        this.progressiveRowRenderingPreload = 25;
        this.rowHeaderColumnsMergeParents = false;
        this.rowHeaderScrolling = false;
        this.rowHeaderSplitterWidth = 3;
        this.rowHeaderHideIconEnabled = true;
        this.rowHeaderWidth = 80;
        this.rowHeaderWidthAutoFit = true;
        this.rowMarginBottom = 4;
        this.rowMinHeight = 0;
        this.scrollDelayTasks = 200;
        this.scrollDelayCells = 20;
        this.scrollDelayFloats = 0;
        this.scale = "Day";
        this.selectedRows = [];
        this.snapToGrid = true;
        this.syncTasks = true;
        this.syncLinks = true;
        this.tapAndHoldTimeout = 300;
        this.taskHeight = 34;
        this.taskHtmlLeftMargin = 20;
        this.taskHtmlRightMargin = 20;
        this.taskResizeMargin = 5;
        this.taskMovingStartEndEnabled = false;
        this.taskMovingStartEndFormat = "MMMM d, yyyy";
        this.taskResizingStartEndEnabled = false;
        this.taskResizingStartEndFormat = "MMMM d, yyyy";
        this.theme = "gantt_default";
        this.treeAnimation = true;
        this.treeAutoExpand = true;
        this.treeIndent = 20;
        this.treeImageMarginLeft = 0;
        this.treeImageMarginTop = 3;
        this.treeImageMarginRight = 5;
        this.treeImageWidth = 10;
        this.treeImageHeight = 10;
        //this.timeHeaders = [ { "groupBy": "Default" }, {"groupBy": "Cell" }];
        this.timeline = null;
        this.timeHeaders = [ { "groupBy": "Month", "format": "MMMM yyyy"}, { "groupBy": "Day", "format": "d"}];
        this.useEventBoxes = "Never";
        this.visible = true;
        this.weekStarts = "Auto";
        this.xssProtection = "Enabled"; // "Disabled"

        // 2015-05-26
        this.taskVersionsEnabled = false;
        this.taskVersionHeight = 24;
        this.taskVersionMargin = 2;
        this.taskVersionPosition = "Above";

        // event handling
        this.taskMoveHandling = "Update";
        this.taskClickHandling = "Enabled";
        this.taskResizeHandling = "Update";
        this.linkCreateHandling = "Update";
        this.taskRightClickHandling = "ContextMenu";
        this.taskDoubleClickHandling = "Disabled";
        //this.taskDeleteHandling = "Update";
        this.tasksLoadMethod = "GET";
        this.rowCreateHandling = "Disabled";
        this.rowMoveHandling = "Update";
        this.rowClickHandling = "Disabled";
        this.rowDoubleClickHandling = "Disabled";
        this.rowEditHandling = "Update";
        this.rowSelectHandling = "Update";

        this.clientState = {};

        this.separators = [];

        this.members = {};
        this.members.obsolete = [];
        this.members.ignore = [
            "members",
            "scheduler",
            "internal",
            "cellProperties"
        ];
        this.members.noCssOnly = [];

        this.links = {};
        this.links.list = [];
        this.links.add = function(link) {
            if (!link) {
                return;
            }
            var data = link.isLink ? link.data : link;
            calendar.links.list.push(data);

            if (calendar._initialized) {
                wrap._loadLinks();
                scheduler.update();
            }

            calendar._angular.notify();

        };

        this.links.remove = function(link) {
            if (!link) {
                return;
            }

            var data;
            if (link.isLink) {
                data = link.data;
            }
            else {
                data = link;
            }

            var index = DayPilot.indexOf(calendar.links.list, data);

            if (index === -1) {
                return;
            }

            calendar.links.list.splice(index, 1);
            if (calendar._initialized) {
                wrap._loadLinks();
                scheduler.update();
            }

            calendar._angular.notify();
        };

        this.links.find = function(id) {
            if (!DayPilot.isArray(calendar.links.list)) {
                return null;
            }
            for (var i = 0; i < calendar.links.list.length; i++) {
                var link = calendar.links.list[i];
                if (link.id === id) {
                    return new DayPilot.Link(link, calendar);
                }
            }
            return null;
        };

        this.links.findByFromTo = function(from, to) {
            if (!DayPilot.isArray(calendar.links.list)) {
                return null;
            }
            for (var i = 0; i < calendar.links.list.length; i++) {
                var link = calendar.links.list[i];
                if (link.from === from && link.to === to) {
                    return new DayPilot.Link(link, calendar);
                }
            }
            return null;
        };

        this.links.load = function(url, success, error) {
            scheduler.links.load(url, function(args) {
                if (typeof success === "function") {
                    success(args);
                    if (args.preventDefault.value) {
                        return;
                    }
                }
                calendar.links.list = args.data;
            }, error, {
                "dontAddStartEnd": true
            });
        };

        this._refresh = {};
        var refresh = this._refresh;

        refresh.timeout = null;
        refresh.update = function() {
            if (!calendar._initialized) {
                return;
            }

            window.clearTimeout(refresh.timeout);

            refresh.timeout = setTimeout(function() {
                wrap._loadTasks();
                scheduler.update();
            }, 0);
        };

        this.tasks = {};
        this.tasks.list = [];
        this.tasks.add = function(task) {
            if (!task) {
                return;
            }
            if (task instanceof DayPilot.Event) {
                throw "DayPilot.Task object required. You have supplied DayPilot.Event.";
            }
            var data = task.isTask ? task.data : task;
            calendar.tasks.list.push(data);

            refresh.update();

            calendar._angular.notify();
        };

        this.tasks.find = function(id) {
            var data = tasktools.findInCache(id);
            if (!data) {
                return null;
            }
            return new DayPilot.Task(data, calendar);
        };

        this.tasks.update = function(task) {
            // commit
            if (!task) {
                return;
            }
            var data = null;
            if (task.isTask) {
                task.commit();
                data = task.data;
            }
            else if (typeof task === "object") {
                data = task;
            }
            else {
                throw "DayPilot.Task or task data object expected";
            }

            var t = calendar.tasks.find(data.id);
            if (!t) {
                return;
            }

            /*var i = calendar.tasks.list.indexOf(t.data);
            calendar.tasks.splice(i, 1, t.data);*/

            var parent = tasktools.findParentArray(t.data);
            var i = parent.indexOf(t.data);
            parent.splice(i, 1, data);

            refresh.update();

            calendar._angular.notify();

        };


        /**
         * Removes a task, including children.
         * @param task
         */
        this.tasks.remove = function(task) {
            if (!task) {
                return;
            }
            if (!task.isTask) {
                throw "DayPilot.Task object expected";
            }
            var parentArray = tasktools.findParentArray(task.data);
            if (!parentArray) {
                return;
            }

            var sourceIndex = DayPilot.indexOf(parentArray, task.data);
            parentArray.splice(sourceIndex, 1);

            refresh.update();

            calendar._angular.notify();
        };

        this.tasks.load = function(url, success, error) {

            if (!url) {
                throw new DayPilot.Exception("events.load(): 'url' parameter required");
            }
            var onError = function(args) {
                var largs = {};
                largs.exception = args.exception;
                largs.request = args.request;

                if (typeof error === 'function') {
                    error(largs);
                }
            };

            var onSuccess = function(args) {
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
                    sargs.preventDefault = function() {
                        this.preventDefault.value = true;
                    };
                    sargs.data = data;
                    if (typeof success === "function") {
                        success(sargs);
                    }

                    if (sargs.preventDefault.value) {
                        return;
                    }

                    calendar.tasks.list = data;
                    if (calendar._initialized) {
                        calendar.update();
                    }
                }
            };

            var usePost = calendar.tasksLoadMethod && calendar.tasksLoadMethod.toUpperCase() === "POST";

            if (usePost) {
                DayPilot.ajax({
                    "method": "POST",
                    "contentType": "application/json",
                    //"data": { "start": calendar.visibleStart().toString(), "end": calendar.visibleEnd().toString()},
                    "url": url,
                    "success": onSuccess,
                    "error": onError
                });
            }
            else {
                var fullUrl = url;
                /*var queryString = "start=" + calendar.visibleStart().toString() + "&end=" + calendar.visibleEnd().toString();
                if (fullUrl.indexOf("?") > -1) {
                    fullUrl += "&" + queryString;
                }
                else {
                    fullUrl += "?" + queryString;
                }*/

                DayPilot.ajax({
                    "method": "GET",
                    "url": fullUrl,
                    "success": onSuccess,
                    "error": onError
                });
            }

        };


        this.visibleStart = function() {
            return scheduler.visibleStart();
        };

        this.visibleEnd = function() {
            return scheduler.visibleEnd();
        };

        // events
        this.onAfterRender = null;
        this.onAfterUpdate = null;
        this.onBeforeRowHeaderRender = null;
        this.onBeforeRowHeaderExport = null;
        this.onBeforeTaskRender = null;
        this.onBeforeTaskExport = null;
        this.onBeforeTimeHeaderRender = null;
        this.onBeforeTimeHeaderExport = null;
        this.onBeforeCellRender = null;
        this.onBeforeCellExport = null;
        this.onBeforeCornerRender = null;
        this.onBeforeCornerExport = null;
        this.onTaskClick = null;
        this.onTaskClicked = null;
        this.onTaskDoubleClick = null;
        this.onTaskDoubleClicked = null;
        this.onTaskRightClick = null;
        this.onTaskRightClicked = null;
        this.onRowCreate = null;
        this.onRowCreated = null;
        this.onRowMove = null;
        this.onRowMoved = null;
        this.onRowMoving = null;
        this.onRowClick = null;
        this.onRowClicked = null;
        this.onRowDoubleClick = null;
        this.onRowDoubleClicked = null;
        this.onRowEdit = null;
        this.onRowEdited = null;
        this.onRowFilter = null;
        this.onRowSelect = null;
        this.onRowSelected = null;
        this.onTaskMove = null;
        this.onTaskMoved = null;
        this.onTaskMoving = null;
        this.onTaskResize = null;
        this.onTaskResized = null;
        this.onTaskResizing = null;
        this.onLinkCreate = null;
        this.onLinkCreated = null;

        this._serverBased = function() {
            if (this.backendUrl) {  // ASP.NET MVC, Java
                return true;
            }
            if (typeof WebForm_DoCallback === 'function' && this.uniqueID) {  // ASP.NET WebForms
                return true;
            }
            return false;
        };

        this._setStartDate = function() {
            if (typeof calendar.startDate === "string") {
                calendar.startDate = new DayPilot.Date(calendar.startDate);
            }

            if (calendar.startDate && calendar.days) {
                return;
            }

            var start = DayPilot.Date.today();
            var end = start.addDays(1);
            var startTicks = null;
            var endTicks = null;


            function checkTasks(tasks) {
                for (var i = 0; i < tasks.length; i++) {
                    var e = tasks[i];
                    start = new DayPilot.Date(e.start);
                    end = new DayPilot.Date(e.end);
                    if (startTicks === null || start.getTime() < startTicks) {
                        startTicks = start.getTime();
                    }
                    if (endTicks === null || end.getTime() > endTicks) {
                        endTicks = end.getTime();
                    }
                    if (e.children && e.children.length > 0) {
                        checkTasks(e.children);
                    }
                }
            }

            checkTasks(calendar.tasks.list);

            if (startTicks && endTicks) {
                start = new DayPilot.Date(startTicks).getDatePart();
                end =  new DayPilot.Date(endTicks).getDatePart().addDays(1);

                scheduler.startDate = calendar.startDate || start;
                scheduler.days = calendar.days || DayPilot.DateUtil.daysDiff(start, end);
            }
            else {
                scheduler.startDate = start;
                scheduler.days = 30;
            }
        };

        this._findStartEnd = function(tasks, startTicks, endTicks) {

        };

        this.commandCallBack = function(command, data) {
            wrap.translate();
            scheduler.commandCallBack(command, data);
        };

        this.message = function(html, delay, foreColor, backColor) {
            scheduler.message(html, delay, foreColor, backColor);
        };

        this.setHeight = function(pixels) {
            scheduler.setHeight(pixels);
        };

        this._isShortInit = function() {
            return !!this.backendUrl;

/*
            // make sure it has a place to ask
            if (this.backendUrl) {
                return !DayPilot.isArray(calendar.tasks.list) || calendar.tasks.list.length == 0;
            }
            else {
                return false;
            }
*/
        };

        this.setScrollY = function(scrollY) {
            scheduler.setScrollY(scrollY);
        };

        this.setScrollX = function(scrollX) {
            scheduler.setScrollX(scrollX);
        };

        this.getScrollY = function() {
            return scheduler.getScrollY();
        };

        this.getScrollX = function() {
            return scheduler.getScrollX();
        };

        this.scrollToRow = function(id) {
            scheduler.scrollToResource(id);
        };


        this.init = function() {
            if (this._initialized) {
                throw new DayPilot.Exception("This instance is already initialized. Use update() to change properties.")
            }
            wrap.translate();
            wrap._loadTasks();
            wrap._loadLinks();
            this._setStartDate();

            scheduler.init();
            this._initialized = true;

            this._postInit();

            return this;

            /*
            if (this._isShortInit()) {
                scheduler.internal.callback('Init');
            }*/
        };

        this._disposed = false;

        this.dispose = function() {
            scheduler.dispose();
            calendar._disposed = true;
        };

        this.update = function(options) {

            if (!calendar._initialized) {
                throw new DayPilot.Exception("You are trying to update a DayPilot.Gantt instance that hasn't been initialized yet.");
            }

            if (calendar._disposed) {
                throw new DayPilot.Exception("You are trying to update a DayPilot.Gantt instance that has been disposed.");
            }

            calendar._loadOptions(options);

            wrap.translate();
            wrap._loadTasks();
            wrap._loadLinks();
            calendar._setStartDate();
            scheduler.update();
        };

        this.scrollTo = function(target) {
            scheduler.scrollTo(target);
        };

        this.scrollToTask = function(id) {
            scheduler.scrollToResource(id);
        };

        this._tasktools = {};
        var tasktools = this._tasktools;

        tasktools.cache = {};

        tasktools.clearCache = function() {
            tasktools.cache = {};
        };

        tasktools.addToCache = function(data, parent) {
            // cache
            var key = data.id;

            if (!key) {
                return;
            }

            var wrapper = {};
            wrapper.isTaskWrapper = true;
            wrapper.data = data;
            wrapper.parent = parent;

            if (tasktools.cache[key]) {
                throw "Duplicate task id detected";
            }

            tasktools.cache[key] = wrapper;

        };

        tasktools.findInCache = function(id) {
            if (!id) {
                return null;
            }
            return tasktools.cache[id.toString()];
        };

        tasktools.getProperty = function(task, name) {
            if (task.tags && task.tags[name]) {
                return task.tags[name];
            }
            return task[name];
        };

        tasktools.findParentArray = function(res) {
            return tasktools.findInArray(calendar.tasks.list, res);
        };

        tasktools.findInArray = function(array, res) {
            if (DayPilot.indexOf(array, res) !== -1) {
                return array;
            }
            for(var i = 0; i < array.length; i++) {
                var r = array[i];
                if (r.children && r.children.length > 0) {
                    var parent = tasktools.findInArray(r.children, res);
                    if (parent) {
                        return parent;
                    }
                }
            }
            return null;
        };

        this._wrap = {};
        var wrap = this._wrap;

        var coalesce = function(p, val) {
            if (typeof p !== "undefined") {
                return p;
            }
            return val;
        };

        wrap.translate = function() {

            scheduler.internal.gantt = calendar;

            // settings
            // fixed
            scheduler.durationBarMode = "PercentComplete";
            scheduler.timeRangeSelectedHandling = "Disabled";
            scheduler.treeEnabled = true;
            scheduler.rowCreateHtml = "";
            scheduler.rowHeaderColumnsMode = "Legacy";

            // variable
            scheduler.autoRefreshCommand = calendar.autoRefreshCommand;
            scheduler.autoRefreshEnabled = calendar.autoRefreshEnabled;
            scheduler.autoRefreshInterval = calendar.autoRefreshInterval;
            scheduler.autoRefreshMaxCount = calendar.autoRefreshMaxCount;
            scheduler.autoScroll = calendar.autoScroll;
            scheduler.backendUrl = calendar.backendUrl;
            // scheduler.crosshairColor = calendar.crosshairColor;
            // scheduler.crosshairOpacity = calendar.crosshairOpacity;
            scheduler.crosshairType = calendar.crosshairType;
            scheduler.doubleClickTimeout = calendar.doubleClickTimeout;
            scheduler.durationBarVisible = calendar.completeBarVisible;
            scheduler.durationBarHeight = calendar.completeBarHeight;
            scheduler.dynamicEventRendering = calendar.progressiveTaskRendering;
            scheduler.dynamicEventRenderingMargin = calendar.progressiveTaskRenderingMargin;
            scheduler.dynamicEventRenderingCacheSweeping = calendar.progressiveTaskRenderingCacheSweeping;
            scheduler.dynamicEventRenderingCacheSize = calendar.progressiveTaskRenderingCacheSize;
            scheduler.startDate = new DayPilot.Date(calendar.startDate);
            scheduler.days = calendar.days;
            scheduler.cellDuration = calendar.cellDuration;
            scheduler.cellGroupBy = calendar.cellGroupBy;
            scheduler.cellWidth = calendar.cellWidth;
            scheduler.cellWidthSpec = calendar.cellWidthSpec;
            scheduler.cornerHtml = calendar.cornerHtml;
            scheduler.cornerText = calendar.cornerText;
            scheduler.eventHeight = calendar.taskHeight;
            scheduler.eventResizeMargin = calendar.taskResizeMargin;
            scheduler.floatingEvents = calendar.floatingTasks;
            scheduler.floatingTimeHeaders = calendar.floatingTimeHeaders;
            scheduler.headerHeight = calendar.headerHeight;
            scheduler.heightSpec = calendar.heightSpec;
            scheduler.height = calendar.height;
            scheduler.linkBottomMargin = calendar.linkBottomMargin;
            scheduler.linkPointSize = calendar.linkPointSize;
            scheduler.loadingLabelVisible = calendar.loadingLabelVisible;
            scheduler.loadingLabelText = calendar.loadingLabelText;
            scheduler.loadingLabelHtml = calendar.loadingLabelHtml;
            scheduler.locale = calendar.locale;
            scheduler.messageBarPosition = calendar.messageBarPosition;
            scheduler.messageHideAfter = calendar.messageHideAfter;
            //scheduler.milestoneWidth = calendar.milestoneWidth;
            scheduler.rowCreateHandling = calendar.rowCreateHandling;
            scheduler.progressiveRowRendering = calendar.progressiveRowRendering;
            scheduler.progressiveRowRenderingPreload = calendar.progressiveRowRenderingPreload;
            scheduler.scale = calendar.scale;
            scheduler.scrollDelayEvents = calendar.scrollDelayTasks;
            scheduler.scrollDelayCells = calendar.scrollDelayCells;
            scheduler.scrollDelayFloats = calendar.scrollDelayFloats;
            scheduler.scrollX = calendar.scrollX;
            scheduler.scrollY = calendar.scrollY;
            if (calendar.scrollToTaskId) {
                scheduler.scrollToResourceId = calendar.scrollToTaskId;
            }
            scheduler.separators = calendar.separators;
            scheduler.tapAndHoldTimeout = calendar.tapAndHoldTimeout;
            scheduler.eventHtmlLeftMargin = calendar.taskHtmlLeftMargin;
            scheduler.eventHtmlRightMargin = calendar.taskHtmlRightMargin;
            scheduler.eventMovingStartEndEnabled = calendar.taskMovingStartEndEnabled;
            scheduler.eventMovingStartEndFormat = calendar.taskMovingStartEndFormat;
            scheduler.eventResizingStartEndEnabled = calendar.taskResizingStartEndEnabled;
            scheduler.eventResizingStartEndFormat = calendar.taskResizingStartEndFormat;
            scheduler.hideBorderFor100PctHeight = calendar.hideBorderFor100PctHeight;
            scheduler.hideUntilInit = calendar.hideUntilInit;
            scheduler.treeIndent = calendar.treeIndent;
            scheduler.treeAnimation = calendar.treeAnimation;
            scheduler.treeAutoExpand = calendar.treeAutoExpand;
            scheduler.treeImageMarginLeft = calendar.treeImageMarginLeft;
            scheduler.treeImageMarginTop = calendar.treeImageMarginTop;
            scheduler.treeImageMarginRight = calendar.treeImageMarginRight;
            scheduler.treeImageWidth = calendar.treeImageWidth;
            scheduler.treeImageHeight = calendar.treeImageHeight;
            scheduler.timeHeaders = calendar.timeHeaders;
            scheduler.rowHeaderHideIconEnabled = calendar.rowHeaderHideIconEnabled;
            scheduler.rowHeaderColumnsMergeParents = calendar.rowHeaderColumnsMergeParents;
            scheduler.rowHeaderScrolling = calendar.rowHeaderScrolling;
            scheduler.rowHeaderSplitterWidth = calendar.rowHeaderSplitterWidth;
            scheduler.rowHeaderWidth = calendar.rowHeaderWidth;
            scheduler.rowHeaderWidthAutoFit = calendar.rowHeaderWidthAutoFit;
            scheduler.rowMarginBottom = calendar.rowMarginBottom;
            scheduler.rowMinHeight = calendar.rowMinHeight;
            scheduler.selectedRows = calendar.selectedRows;
            scheduler.theme = calendar.theme;
            scheduler.useEventBoxes = calendar.useEventBoxes;
            scheduler.snapToGrid = calendar.snapToGrid;
            scheduler.uniqueID = calendar.uniqueID;
            scheduler.bubble = calendar.bubbleTask;
            scheduler.cellBubble = calendar.bubbleCell;
            scheduler.resourceBubble = calendar.bubbleRow;
            scheduler.contextMenu = calendar.contextMenuTask;
            scheduler.contextMenuResource = calendar.contextMenuRow;
            scheduler.contextMenuLink = calendar.contextMenuLink;
            scheduler.syncResourceTree = calendar.syncTasks;
            scheduler.syncLinks = calendar.syncLinks;
            scheduler.timeline = calendar.timeline;
            scheduler.visible = calendar.visible;
            scheduler.devsb = calendar.devsb;
            scheduler.weekStarts = calendar.weekStarts;
            scheduler.xssProtection = calendar.xssProtection;

            scheduler.eventMoveHandling = calendar.taskMoveHandling;
            scheduler.eventClickHandling = calendar.taskClickHandling;
            scheduler.eventResizeHandling = calendar.taskResizeHandling;
            scheduler.linkCreateHandling = calendar.linkCreateHandling;
            scheduler.eventRightClickHandling = calendar.taskRightClickHandling;
            scheduler.eventDoubleClickHandling = calendar.taskDoubleClickHandling;
            scheduler.rowMoveHandling = calendar.rowMoveHandling;
            scheduler.rowClickHandling = calendar.rowClickHandling;
            scheduler.rowDoubleClickHandling = calendar.rowDoubleClickHandling;
            scheduler.rowEditHandling = calendar.rowEditHandling;
            scheduler.rowSelectHandling = calendar.rowSelectHandling;

            // test
            scheduler.eventVersionsEnabled = calendar.taskVersionsEnabled;
            scheduler.eventVersionHeight = calendar.taskVersionHeight;
            scheduler.eventVersionMargin = calendar.taskVersionMargin;
            scheduler.eventVersionPosition = calendar.taskVersionPosition;

            // temporarily disabled - will require a different mapping
            // scheduler.eventDeleteHandling = calendar.taskDeleteHandling;

            if (DayPilot.isArray(calendar.columns)) {
                scheduler.rowHeaderColumns = [];
                for (var i = 0; i < calendar.columns.length; i++) {
                    var c = calendar.columns[i];
                    var rhc = {};
                    DayPilot.Util.copyProps(c, rhc, ['html', 'text', 'name', 'title', 'width', 'hidden', 'maxAutoWidth']);
                    rhc.display = c.display || c.property;
                    scheduler.rowHeaderColumns.push(rhc);
                }
            }

            // server-based data
            if (calendar._serverBased()) {
                scheduler.timeHeader = calendar.timeHeader;

                scheduler.cellProperties = calendar.cellProperties;
                scheduler.cellConfig = calendar.cellConfig;
            }

            // event mapping

            scheduler.onRowCreate = function(args) {
                args.control = calendar;
                if (typeof calendar.onRowCreate === "function") {
                    calendar.onRowCreate(args);
                }
            };

            scheduler.onRowCreated = function(args) {
                if (typeof calendar.onRowCreated === "function") {
                    calendar.onRowCreated(args);
                }
            };

            scheduler.onAfterRender = function(args) {
                if (typeof calendar.onAfterRender === "function") {
                    calendar.onAfterRender(args);
                }
            };

            scheduler.onAfterUpdate = function(args) {
                if (typeof calendar.onAfterUpdate === "function") {
                    calendar.onAfterUpdate(args);
                }
            };

            scheduler.onRowHeaderResized = function(args) {
                calendar.rowHeaderWidth = scheduler.rowHeaderWidth;
            };

            scheduler.onRowFilter = function(args) {
                if (typeof calendar.onRowFilter !== "function") {
                    return;
                }
                args.task = new DayPilot.Task(args.row.$.row.task, calendar);
                args.control = calendar;

                calendar.onRowFilter(args);
            };

            scheduler.onAjaxError = function(args) {
                if (typeof calendar.onAjaxError === "function") {
                    calendar.onAjaxError(args);
                }
            };

            scheduler.onRowHeaderColumnResized = function(args) {
                var column = args.column;
                var index = DayPilot.indexOf(scheduler.rowHeaderColumns, column);

                for (var i = 0; i < calendar.columns.length; i++) {
                    var rhc = scheduler.rowHeaderColumns[i];
                    var c = calendar.columns[i];
                    c.width = rhc.width;
                }

                if (typeof calendar.onColumnResized === "function") {
                    var cargs = {};
                    cargs.column = calendar.columns[index];
                    calendar.onColumnResized(cargs);
                }

            };

            scheduler.internalUseStandardColumns = DayPilot.isArray(calendar.columns);

            scheduler.onBeforeRowHeaderRender = function(args) {
                args.task = new DayPilot.Task(args.row.$.row.task, calendar);

                var e = args.row.$.row.events[0];
                // var e = args.row.data;
                if (e && calendar.taskGroupMode === "Auto" && e.data.type === "Group") {
                    args.task.data.start = e.data.start;
                    args.task.data.end = e.data.end;
                }

                var columns = [];
                if (DayPilot.isArray(calendar.columns)) {
                    for (var i = 0; i < calendar.columns.length; i++) {
                        var column = calendar.columns[i];
                        var property = column.display || column.property;

                        var colargs = {};
                        colargs.value = scheduler.internal.xssTextHtml(tasktools.getProperty(args.task.data, property));

                        if (args.task.data.row && args.task.data.row.columns && args.task.data.row.columns[i]) {
                            colargs.html = args.task.data.row.columns[i].html;
                        }
                        else {
                            colargs.html = colargs.value;
                        }
                        columns.push(colargs);
                    }
                }

                args.row.columns = columns;

                if (typeof calendar.onBeforeRowHeaderRender === "function") {
                    calendar.onBeforeRowHeaderRender(args);
                }

/*
                if (DayPilot.isArray(calendar.columns)) {
                    for (var i = 0; i < calendar.columns.length; i++) {
                        var html = columns[i].html;
                        if (i === 0) {
                            args.row.html = html;
                        }
                        else {
                            args.row.columns[i - 1].html = html;
                        }
                    }
                }
*/

            };


            scheduler.onBeforeRowHeaderExport = function(args) {
                args.task = new DayPilot.Task(args.row.$.row.task, calendar);

                if (typeof calendar.onBeforeRowHeaderExport === "function") {
                    calendar.onBeforeRowHeaderExport(args);
                }

            };

            scheduler.onBeforeEventExport = function(args) {
                if (typeof calendar.onBeforeTaskExport !== "function") {
                    return;
                }

                args.task = new DayPilot.Task(args.e, calendar);

                calendar.onBeforeTaskExport(args);
            };

            scheduler.onBeforeCellRender = function(args) {
                args.task = calendar.tasks.find(args.cell.resource);

                delete args.cell.resource;
                if (typeof calendar.onBeforeCellRender === "function") {
                    args.control = calendar;
                    calendar.onBeforeCellRender(args);
                }
            };

            scheduler.onBeforeCellExport = function(args) {
                args.task = calendar.tasks.find(args.cell.resource);
                delete args.cell.resource;

                if (typeof calendar.onBeforeCellExport === "function") {
                    args.control = calendar;
                    calendar.onBeforeCellExport(args);
                }

            };

            scheduler.onBeforeCornerRender = function(args) {
                if (typeof calendar.onBeforeCornerRender === "function") {
                    args.control = calendar;
                    calendar.onBeforeCornerRender(args);
                }
            };

            scheduler.onBeforeCornerExport = function(args) {
                if (typeof calendar.onBeforeCornerExport === "function") {
                    args.control = calendar;
                    calendar.onBeforeCornerExport(args);
                }
            };

            scheduler.onBeforeTimeHeaderRender = function(args) {
                if (typeof calendar.onBeforeTimeHeaderRender === "function") {
                    args.control = calendar;
                    calendar.onBeforeTimeHeaderRender(args);
                }
            };

            scheduler.onBeforeTimeHeaderExport = function(args) {
                if (typeof calendar.onBeforeTimeHeaderExport === "function") {
                    args.control = calendar;
                    calendar.onBeforeTimeHeaderExport(args);
                }
            };

            scheduler.onEventClick = function(args) {
                args.task = new DayPilot.Task(args.e, calendar);
                args.control = calendar;
                if (typeof calendar.onTaskClick === "function") {
                    calendar.onTaskClick(args);
                }
            };

            scheduler.onEventClicked = function(args) {
                if (typeof calendar.onTaskClicked === "function") {
                    calendar.onTaskClicked(args);
                }
            };

            scheduler.onEventDelete = function(args) {
                if (typeof calendar.onTaskDelete === "function") {
                    calendar.onTaskDelete(args);
                }
            };

            scheduler.onEventDeleted = function(args) {
                if (typeof calendar.onTaskDeleted === "function") {
                    calendar.onTaskDeleted(args);
                }
            };

            scheduler.onEventDoubleClick = function(args) {
                args.task = new DayPilot.Task(args.e, calendar);
                args.control = calendar;
                if (typeof calendar.onTaskDoubleClick === "function") {
                    calendar.onTaskDoubleClick(args);
                }
            };

            scheduler.onEventDoubleClicked = function(args) {
                if (typeof calendar.onTaskDoubleClicked === "function") {
                    calendar.onTaskDoubleClicked(args);
                }
            };

            scheduler.onEventRightClick = function(args) {
                args.task = new DayPilot.Task(args.e, calendar);
                if (typeof calendar.onTaskRightClick === "function") {
                    calendar.onTaskRightClick(args);
                }
            };

            scheduler.onEventRightClicked = function(args) {
                if (typeof calendar.onTaskRightClicked === "function") {
                    calendar.onTaskRightClicked(args);
                }
            };

            scheduler.onRowMoving = function(args) {
                args._source = args.source;
                args._target = args.target;
                args.source = new DayPilot.Task(args._source.$.row.task, calendar);
                args.target = new DayPilot.Task(args._target.$.row.task, calendar);

                if (typeof calendar.onRowMoving === "function") {
                    calendar.onRowMoving(args);
                }
            };

            scheduler.onRowMove = function(args) {
                args._source = args.source;
                args._target = args.target;
                args.source = new DayPilot.Task(args._source.$.row.task, calendar);
                args.target = new DayPilot.Task(args._target.$.row.task, calendar);
                args.control = calendar;
                if (typeof calendar.onRowMove === "function") {
                    calendar.onRowMove(args);
                }
                args.source = args._source;
                args.target = args._target;
            };

            scheduler.onRowMoved = function(args) {

                var updateNow = calendar.rowMoveHandling === "Update" || calendar.rowMoveHandling === "Notify";

                if (updateNow) {
                    // update parents
                    var source = args._source.$.row.task;
                    var target = args._target.$.row.task;
                    var position = args.position;

                    // *******************

                    if (position === "forbidden") {
                        return;
                    }

                    var sourceGantt = args._source.calendar.internal.gantt;

                    // remove from source
                    var sourceParent = sourceGantt._tasktools.findParentArray(source);
                    if (!sourceParent) {
                        throw "Cannot find source node parent";
                    }
                    var sourceIndex = DayPilot.indexOf(sourceParent, source);
                    sourceParent.splice(sourceIndex, 1);

                    // move to target
                    var targetParent = tasktools.findParentArray(target);
                    if (!targetParent) {
                        throw "Cannot find target node parent";
                    }
                    var targetIndex = DayPilot.indexOf(targetParent, target);

                    switch (position) {
                        case "before":
                            targetParent.splice(targetIndex, 0, source);
                            break;
                        case "after":
                            targetParent.splice(targetIndex + 1, 0, source);
                            break;
                        case "child":
                            if (!target.children) {
                                target.children = [];
                                target.expanded = true;
                            }
                            target.children.push(source);
                            break;
                    }

                    //wrap._loadTasks();
                    calendar._angular.notify();

                    calendar.update();

                    if (sourceGantt !== calendar) {
                        sourceGantt.update();
                    }

                    // *******************
                }

                args.source = new DayPilot.Task(args._source.$.row.task, calendar);
                args.target = new DayPilot.Task(args._target.$.row.task, calendar);

                if (typeof calendar.onRowMoved === "function") {
                    calendar.onRowMoved(args);
                }
            };

            scheduler.onRowClick = function(args) {
                args.task = new DayPilot.Task(args.resource.$.row.task, calendar);
                if (typeof calendar.onRowClick === "function") {
                    calendar.onRowClick(args);
                }
            };

            scheduler.onRowClicked = function(args) {
                if (typeof calendar.onRowClicked === "function") {
                    calendar.onRowClicked(args);
                }
            };

            scheduler.onRowDoubleClick = function(args) {
                args.task = new DayPilot.Task(args.resource.$.row.task, calendar);
                if (typeof calendar.onRowDoubleClick === "function") {
                    calendar.onRowDoubleClick(args);
                }
            };

            scheduler.onRowDoubleClicked = function(args) {
                if (typeof calendar.onRowDoubleClicked === "function") {
                    calendar.onRowDoubleClicked(args);
                }
            };

            scheduler.onRowEdit = function(args) {
                args.task = new DayPilot.Task(args.resource.$.row.task, calendar);
                if (typeof calendar.onRowEdit === "function") {
                    calendar.onRowEdit(args);
                }
            };

            scheduler.onRowEdited = function(args) {
                if (typeof calendar.onRowEdited === "function") {
                    calendar.onRowEdited(args);
                }
            };

            scheduler.onRowSelect = function(args) {
                args.task = new DayPilot.Task(args.row.$.row.task, calendar);
                if (typeof calendar.onRowSelect === "function") {
                    calendar.onRowSelect(args);
                }
            };

            scheduler.onRowSelected = function(args) {
                if (typeof calendar.onRowSelected === "function") {
                    calendar.onRowSelected(args);
                }
            };

            scheduler.onEventMove = function(args) {
                args._e = args.e;
                args.task = new DayPilot.Task(args.e, calendar);
                args.control = calendar;
                //delete args.e;
                //delete args.position;
                //delete args.newResource;
                if (typeof calendar.onTaskMove === "function") {
                    calendar.onTaskMove(args);
                }
            };

            scheduler.onEventMoved = function(args) {

/*
                var updateParent = function(parent) {
                    if (!parent) {
                        return;
                    }

                    var pe = scheduler.events.find(parent.id);
                    var children = wrap.childrenStartEnd(parent);
                    pe.start(children.start);
                    pe.end(children.end);
                    scheduler.events.update(pe);
                    updateParent(pe.data.parent);
                };
*/

                if (calendar.taskGroupMode === "Auto") {
                    var e = args._e;

                    // update source
                    var task = e.data.task;
                    task.start = e.start();
                    task.end = e.end();

                    //updateParent(args.e.data.parent);

                    while (e.data.parent) {
                        var parent = scheduler.events.find(e.data.parent.id);
                        var children = wrap.childrenStartEnd(e.data.parent);
                        parent.start(children.start);
                        parent.end(children.end);
                        scheduler.events.update(parent);
                        e = parent;
                    }

                }

                calendar._angular.notify();

                if (typeof calendar.onTaskMoved === "function") {
                    calendar.onTaskMoved(args);
                }
            };

            scheduler.onEventMoving = function(args) {
                args.task = new DayPilot.Task(args.e, calendar);
                args._e = args.e;

                delete args.position;
                delete args.overlapping;
                delete args.resource;

                if (typeof calendar.onTaskMoving === "function") {
                    calendar.onTaskMoving(args);
                }
            };

            scheduler.onEventResize = function(args) {
                args._e = args.e;
                args.task = new DayPilot.Task(args.e, calendar);
                args.control = calendar;
                if (typeof calendar.onTaskResize === "function") {
                    calendar.onTaskResize(args);
                }
            };

            scheduler.onEventResized = function(args) {
                if (calendar.taskGroupMode === "Auto") {

                    var e = args._e;

                    // update source
                    var task = e.data.task;
                    task.start = e.start();
                    task.end = e.end();

                    while (e.data.parent) {
                        var parent = scheduler.events.find(e.data.parent.id);
                        var children = wrap.childrenStartEnd(e.data.parent);
                        parent.start(children.start);
                        parent.end(children.end);
                        scheduler.events.update(parent);
                        e = parent;
                    }
                }
                calendar._angular.notify();

                if (typeof calendar.onTaskResized === "function") {
                    calendar.onTaskResized(args);
                }
            };

            scheduler.onEventResizing = function(args) {
                args.task = new DayPilot.Task(args.e, calendar);
                args._e = args.e;
                args.control = calendar;

                if (typeof calendar.onTaskResizing === "function") {
                    calendar.onTaskResizing(args);
                }
            };

            scheduler.onLinkCreate = function(args) {
                args.source = calendar.tasks.find(args.from);
                args.target = calendar.tasks.find(args.to);
                args.control = calendar;
                if (typeof calendar.onLinkCreate === "function") {
                    calendar.onLinkCreate(args);
                }
            };

            scheduler.onLinkCreated = function(args) {
                if (typeof calendar.onLinkCreated === "function") {
                    calendar.onLinkCreated(args);
                }
            };

            scheduler.onResourceExpand = function(args) {
                var task = args.resource.$.row.task;
                if (!task.row) {
                    task.row = {};
                }
                task.row.collapsed = false;
            };

            scheduler.onResourceCollapse = function(args) {
                var task = args.resource.$.row.task;
                if (!task.row) {
                    task.row = {};
                }
                task.row.collapsed = true;
            };

        };

        wrap._rowObjectForTaskData = function(data) {
            for (var i = 0; i < scheduler.rowlist.length; i++) {
                var row = scheduler.rowlist[i];
                if (row.task === data) {
                    return scheduler.internal.createRowObject(row);
                }
            }
            return null;
        };

        wrap._loadLinks = function() {
            scheduler.links.list = calendar.links.list ? calendar.links.list : [];
        };

        wrap._loadTasks =  function() {
            scheduler.resources = [];
            scheduler.events.list = [];

            tasktools.clearCache();

            wrap._loadChildren(calendar.tasks.list, scheduler.resources, null);

            if (css.sheet) {
                css.sheet.commit();
                css.sheet = null;
            }
        };

        wrap._doBeforeTaskRender = function(task) {

            var type = task.type || "Task";
            if (task.children && task.children.length) {
                type = "Group";
            }

            /*
            if (typeof calendar.onBeforeTaskRender !== "function") {
                return {
                    "data": task,
                    "type": type
                };
            }
            */

            var data = {};

            // make a copy
            for (var name in task) {
                if (name === "children") {
                    continue;
                }
                data[name] = task[name];
            }

            var args = {};
            args.data = data;
            args.type = type;

            if (!data.box) {
                data.box = {};
            }

            if (typeof data.box.html === "undefined") {
                if (args.type === "Task") {
                    var complete = data.complete || 0;
                    data.box.text = complete + "%";
                }
                else {
                    data.box.text = "";
                }
            }

            if (typeof data.box.htmlRight === "undefined") {
                data.box.htmlRight = scheduler.internal.xssTextHtml(data.text);
            }

            if (typeof calendar.onBeforeTaskRender === "function") {
                calendar.onBeforeTaskRender(args);
            }

            // read-only, override the change
            args.type = type;

            return args;
        };

        var css = {};
        css.keys = {};
        css.sheet = null;

        wrap._getBackColorCss = function(args) {
            if (!args.data.box) {
                return;
            }

            if (args.data.box.cssClass) {
                return;
            }

            if (!args.data.box.backColor) {
                return;
            }

            if (args.type === "Task") {
                return;
            }

            var color = DayPilot.Util.normalizeColor(args.data.box.backColor);
            var key = args.type + "_" + color.replace("#", "");

            var t = calendar.theme;
            var cn = calendar.theme + "_" + key;  // ."+cn+"

            if (!css.keys[key]) {
                css.keys[key] = true;

                if (!css.sheet) {
                    css.sheet = DayPilot.sheet();
                }

                if (args.type === "Group") {
                    css.sheet.add("."+cn+"."+t+"_task_group ."+t+"_event_inner", "position:absolute;top:5px;left:0px;right:0px;bottom:6px;overflow:hidden; background: "+color+"; filter: none; border: 0px none;");
                    css.sheet.add("."+cn+"."+t+"_task_group."+t+"_event:before", "content:''; border-color: transparent transparent transparent "+color+"; border-style: solid; border-width: 6px; position: absolute; bottom: 0px;");
                    css.sheet.add("."+cn+"."+t+"_task_group."+t+"_event:after", "content:''; border-color: transparent "+color+" transparent transparent; border-style: solid; border-width: 6px; position: absolute; bottom: 0px; right: 0px;");
                }
                else if (args.type === "Milestone") {
                    css.sheet.add("."+cn+"."+t+"_task_milestone ."+t+"_event_inner", "position:absolute;top:16%;left:16%;right:16%;bottom:16%; background: "+color+"; border: 0px none; -webkit-transform: rotate(45deg);-moz-transform: rotate(45deg);-ms-transform: rotate(45deg);-o-transform: rotate(45deg); transform: rotate(45deg); filter: none;");
                    css.sheet.add("."+cn+"."+t+"_browser_ie8 ."+t+"_task_milestone ."+t+"_event_inner", "-ms-filter: \"progid:DXImageTransform.Microsoft.Matrix(SizingMethod='auto expand', M11=0.7071067811865476, M12=-0.7071067811865475, M21=0.7071067811865475, M22=0.7071067811865476);\"");
                }
            }

            return cn;

        };

        wrap._loadChildren = function(source, target, parent) {
            if (!DayPilot.isArray(source)) {
                return;
            }
            for (var i = 0; i < source.length; i++) {
                var original = source[i];
                tasktools.addToCache(original, parent);
                var args = wrap._doBeforeTaskRender(original);
                var task = args.data;
                var type = args.type;

                var event = {};
                DayPilot.Util.copyProps(task, event, ['id', 'start', 'end', 'text', 'complete', 'tags', 'versions']);
                DayPilot.Util.copyProps(task.box, event);
                event.parent = parent;
                event.task = original;
                event.resource = task.id;

                event.commitCallback = (function(e) {
                    return function() {
                        e.task.start = e.start;
                        e.task.end = e.end;
                    }
                })(event);

                if (type == "Group") {
                    event.type = "Group";
                    // event.html = "";
                    event.html = (task.box && task.box.html) || "";
                    //event.html = task.html;
                    //event.barHidden = true;

                    var css = wrap._getBackColorCss(args);
                    if (css) {
                        event.cssClass = (event.cssClass || "") + " " + css;
                    }

                    if (calendar.taskGroupMode === "Auto") {
                        var children = wrap.childrenStartEnd(original);
                        event.start = children.start;
                        event.end = children.end;
                        event.resizeDisabled = true;
                        event.moveDisabled = true;
                    }
                }
                else if (type === "Milestone") {
                    event.html = "";
                    // TODO modifying the original object (remove?)
                    original.end = original.start;

                    var css = wrap._getBackColorCss(args);
                    if (css) {
                        event.cssClass = (event.cssClass || "") + " " + css;
                    }

                    task.end = task.start;

                    event.end = task.start;
                    //event.html = task.html;
                    event.barHidden = true;
                    event.resizeDisabled = true;
                    event.type = "Milestone";
                    event.width = calendar.taskHeight;
                    delete event.backColor;
                }
                else if (type === "Task" ){
                    //event.html = task.box.html;
                    doNothing();
                }

                event.moveVDisabled = true;

                event.htmlRight = task.box.htmlRight;
                event.htmlLeft = task.box.htmlLeft;

                scheduler.events.list.push(event);

                var r = {};

                // source
                r.task = original;

                // server-based only
                DayPilot.Util.copyProps(task.row, r);

                r.name = task.text;
                r.id = task.id;
                r.children = [];
                r.expanded = !task.row || !task.row.collapsed;

                if (original.children && original.children.length) {
                    wrap._loadChildren(original.children, r.children, original);
                }

                target.push(r);

            }
        };

        wrap.childrenStartEnd = function(task) {
            if (!task.children || !task.children.length) {
                var start = task.start;
                var end = task.end;
                if (task.type === "Milestone") {
                    end = start;
                }
                return { "start": new DayPilot.Date(start), "end": new DayPilot.Date(end) };
            }
            var start = null;
            var end = null;
            for (var i = 0; i < task.children.length; i++) {
                var children = wrap.childrenStartEnd(task.children[i]);
                if (!start || children.start.getTime() < start.getTime()) {
                    start = children.start;
                }
                if (!end || children.end.getTime() > end.getTime()) {
                    end = children.end;
                }
            }
            return { "start": start, "end": end};
        };

        this.rows = {};

        this.rows.expand = function(levels) {
            scheduler.rows.expand(levels);
        };

        this.rows.expandAll = function() {
            scheduler.rows.expandAll();
        };

        this.rows.filter = function(param) {
            scheduler.rows.filter(param);
        };

        this.rows.selection = {};

        this.rows.selection.add = function(task) {
            var row = scheduler.rows.find(task.data.id);

        };

        this.rows.selection.clear = function() {
            scheduler.rows.selection.clear();
        };

        this.rows.selection.get = function() {
            return scheduler.rows.selection.get().map(function(row) {
                return new DayPilot.Task(row.$.row.task, calendar);
            });
        };

        this.exportAs = function(format, options) {
/*
            if (!calendar._visible()) {
                throw new DayPilot.Exception("DayPilot.Scheduler.exportAs(): The instance must be visible during export.");
            }
*/
            return scheduler.exportAs(format, options);
        };


        this._specialHandling = null;
        this._loadOptions = function(options) {
            if (!options) {
                return;
            }

            var specialHandling = {
                "tasks": {
                    "preInit": function() {
                        var tasks = this.data;
                        if (!tasks) {
                            return;
                        }
                        if (DayPilot.isArray(tasks.list)) {
                            calendar.tasks.list = tasks.list;
                        }
                        else {
                            calendar.tasks.list = tasks;
                        }
                    }
                },
                "links": {
                    "preInit": function() {

                        var links = this.data;
                        if (!links) {
                            return;
                        }
                        if (DayPilot.isArray(links.list)) {
                            calendar.links.list = links.list;
                        }
                        else {
                            calendar.links.list = links;
                        }
                    }
                },
                "scrollTo": {
                    "postInit": function() {
                        if (this.data) {
                            calendar.scrollTo(this.data);
                        }
                    }
                },
                "scrollToTask": {
                    "postInit": function() {
                        if (this.data) {
                            calendar.scrollToTask(this.data);
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

        this.internal = {};
        this.internal.initialized =  function() {
            return calendar._initialized;
        };
        // DayPilot.Task
        this.internal.rowObjectForTaskData = wrap._rowObjectForTaskData;
        // Angular 2
        this.internal.loadOptions = calendar._loadOptions;

        this._angular = {};
        this._angular.scope = null;
        this._angular.notify = function() {
            if (calendar._angular.scope) {
                calendar._angular.scope["$apply"]();
            }
        };

        this._loadOptions(options);
    };

    // experimental jQuery bindings
    if (typeof jQuery !== 'undefined') {
        (function($) {
            $.fn.daypilotGantt = function(options) {
                var first = null;
                var j = this.each(function() {
                    if (this.daypilot) { // already initialized
                        return;
                    };

                    var daypilot = new DayPilot.Gantt(this.id, options);
                    daypilot.init();

                    this.daypilot = daypilot;

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

        app.directive("daypilotGantt", ['$parse', function($parse) {
            return {
                "restrict": "E",
                "template": "<div id='{{id}}'></div>",
                "compile": function compile(element, attrs) {
                    element.replaceWith(this["template"].replace("{{id}}", attrs["id"]));

                    return function link(scope, element, attrs) {
                        var calendar = new DayPilot.Gantt(element[0]);
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
                        //var events = attrs["events"] || attrs["daypilotEvents"];

                        watch.call(scope, config, function (value, oldVal) {
                            calendar._loadOptions(value);
                            calendar.update();
                        }, true);

                    };
                }
            };
        }]);

    })();

    DayPilot.Gantt.def = {};

    if (typeof Sys !== 'undefined' && Sys.Application && Sys.Application.notifyScriptLoaded) {
        Sys.Application.notifyScriptLoaded();
    }

})(DayPilot);
