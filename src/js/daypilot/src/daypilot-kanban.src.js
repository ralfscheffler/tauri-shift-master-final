/* Copyright © 2005 - 2023 Annpoint, s.r.o.
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
    

    if (typeof DayPilot.Kanban !== 'undefined' && DayPilot.Kanban.def) {
        return;
    }

    // prevent unwanted effects during minification
    var doNothing = function() { };

    DayPilot.Kanban = function(id, options) {
        this.v = '2023.2.5592';
        var This = this;

        this.barWidth = 5;
        this.cardAutoHeight = true;
        this.cardHeight = 60;
        this.cardMarginLeft = 5;
        this.cardMarginRight = 5;
        this.cardMarginBottom = 5;
        this.columnHeaderHeight = 20;
        // this.crosshairColor = "gray";
        this.crosshairType = 'Disabled';
        this.height = 300;
        this.heightSpec = "Auto";
        this.theme = "kanban_default";
        this.cellMarginBottom = 4;
        this.cellMarginTop = 5;
        this.columnWidthSpec = "Auto";
        this.columnWidth = 200;
        this.cornerHtml = null;
        this.contextMenuCard = null;
        this.rowMinHeight = 0;
        this.swimlaneCollapsingEnabled = false;
        this.swimlaneHeaderWidth = 80;
        this.visible = true;

        this.swimlanes = {};
        this.swimlanes.list = [];
        this.columns = {};
        this.columns.list = [];
        this.cards = {};
        this.cards.list = [];

        this.cardDeleteHandling = "Disabled";
        this.cardMoveHandling = "Update";
        this.columnMoveHandling = "Disabled";
        this.swimlaneMoveHandling = "Disabled";
        this.cardRightClickHandling = 'ContextMenu';

        this.onBeforeCellRender = null;
        this.onCardClick = null;
        this.onCardClicked = null;
        this.onCardRightClick = null;
        this.onCardRightClicked = null;
        this.onCardDelete = null;
        this.onCardDeleted = null;
        this.onCardMove = null;
        this.onCardMoved = null;
        //this.onCardMoving = null;
        this.onColumnMove = null;
        this.onColumnMoved = null;
        this.onHeightChanged = null;
        this.onSwimlaneMove = null;
        this.onSwimlaneMoved = null;

        var scheduler = new DayPilot.Scheduler(id);
        this.scheduler = scheduler;

        var wrap = {};

        var swimlaneCollapseIconWidth = 15;
        var swimlaneCollapseIconHeight = 15;

        doNothing();

        var start = new DayPilot.Date("2000-01-01");

        wrap.translate = function() {
            var dp = scheduler;
            dp.startDate = start;
            dp.scale = "Day";
            dp.timeHeaders = [
                { groupBy: "Cell", format: "d" }
            ];
            dp.rowHeaderColumnsMode = "Legacy";

            dp.heightSpec = This.heightSpec;

            dp.cellWidthSpec = This.columnWidthSpec;
            dp.cellWidth = This.columnWidth;
            dp.cellsMarkBusiness = false;
            dp.cornerHtml = This.cornerHtml;
            dp.crosshairType = This.crosshairType;
            dp.dynamicEventRendering = "Disabled";
            dp.floatingEvents = false;
            dp.floatingTimeHeaders = false;
            dp.rowMinHeight = This.rowMinHeight;
            dp.rowMarginTop = This.cellMarginTop;
            dp.rowMarginBottom = This.cellMarginBottom;
            dp.devsb = This.devsb;

            dp.eventMoveToPosition = true;
            dp.headerHeight = This.columnHeaderHeight;
            dp.eventResizeHandling = "Disabled";
            dp.timeRangeSelectedHandling = "Disabled";

            dp.eventHeight = This.cardHeight;
            dp.eventMarginLeft = This.cardMarginLeft;
            dp.eventMarginRight = This.cardMarginRight;
            dp.eventMarginBottom = This.cardMarginBottom;
            dp.eventTextWrappingEnabled = true;
            // dp.cellStacking = true;
            // dp.cellStackingAutoHeight = This.cardAutoHeight;
            dp.durationBarVisible = false;
            dp.theme = This.theme;
            dp.visible = This.visible;
            dp.rowHeaderWidth = This.swimlaneHeaderWidth;

            dp.contextMenu = This.contextMenuCard;


            dp.eventDeleteHandling = This.cardDeleteHandling;
            dp.eventMoveHandling = This.cardMoveHandling;
            dp.rowMoveHandling = DayPilot.list(This.swimlanes.list).isEmpty() ? "Disabled" : This.swimlaneMoveHandling;
            dp.eventRightClickHandling = This.cardRightClickHandling;

            dp.onHeightChanged = This.onHeightChanged;

            dp.internal.enableCellStacking(This.cardAutoHeight);
            dp.internal.cssNames.timeheadercol = "_colheadercell";
            dp.internal.cssNames.timeheadercolInner = "_colheadercell_inner";
            dp.internal.cssNames.resourcedivider = "_rowheaderdivider";
            dp.internal.cssNames.event = "_card";
            dp.internal.cssNames.eventInner = "_card_inner";
            dp.internal.cssNames.eventDelete = "_card_delete";
            dp.internal.cssNames.eventMovingSource = "_card_moving_source";

            if (This.swimlaneCollapsingEnabled) {
                dp.rowHeaderWidthMarginRight = swimlaneCollapseIconWidth + 0;
            }

            dp.onBeforeTimeHeaderRender = function(args) {
                var column = This._findColumn(args.header.start);

                args.header.html = column.name;
                args.header.toolTip = column.toolTip || "";
                args.header.areas = DayPilot.list(column.areas).map(function(src) {
                    var area = [];
                    DayPilot.Util.copyProps(src, area);
                    return area;
                });

                DayPilot.list(args.header.areas).forEach(function(area) {
                    area.target = new DayPilot.KanbanColumn(column, This);
                });

                if (This.columnMoveHandling !== "Disabled") {
                    var css = This.theme + "_columnmove_handle";
                    args.header.areas.push(
                        { "left": 0, "top": 0, "width": 20, "height": 20, "css": css, "mousedown": This._onColumnMouseDown, "action": "None" }
                    );
                }
            };

            dp.onBeforeCellRender = function(args) {

                var wargs = {};
                wargs.cell = {};
                // read-only
                wargs.cell.column = new DayPilot.KanbanColumn(This._findColumn(args.cell.start), This);
                wargs.cell.swimlane = null;

                var swimlane = This._findSwimlane(args.cell.resource);
                if (swimlane) {
                    wargs.cell.swimlane = new DayPilot.Swimlane(swimlane, This);
                }

                // read/write
                wargs.cell.areas = [];
                wargs.cell.cssClass = null;
                wargs.cell.html = null;
                wargs.cell.backImage = null;
                wargs.cell.backRepeat = null;
                wargs.cell.backColor = null;

                if (typeof This.onBeforeCellRender === "function") {
                    This.onBeforeCellRender(wargs);
                    DayPilot.Util.copyProps(wargs.cell, args.cell, ["areas", "cssClass", "html", "backImage", "backRepeat", "backColor"]);
                    DayPilot.list(args.cell.areas).forEach(function(area) {
                        area.target = {
                            "swimlane": wargs.cell.swimlane,
                            "column": wargs.cell.column
                        };
                    })
                }

                var row = dp.rows.find(args.cell.resource);
                var res = dp.resources[row.index];
                if (res.collapsed) {
                    if (!args.cell.cssClass) {
                        args.cell.cssClass = "";
                    }
                    args.cell.cssClass += " " + This.theme + "_collapsed";
                }
            };

            dp.onEventClick = function(args) {
                var wargs = new DayPilot.Args(args);
                wargs.card = new DayPilot.Card(args.e.data.card, This);
                if (typeof This.onCardClick === "function") {
                    This.onCardClick(wargs);
                }
                args.wrapped = wargs;
            };

            dp.onEventClicked = function(args) {
                var wargs = args.wrapped;
                if (typeof This.onCardClicked === "function") {
                    This.onCardClicked(wargs);
                }
            };

            dp.onEventRightClick = function(args) {
                var wargs = new DayPilot.Args(args);
                wargs.card = new DayPilot.Card(args.e.data.card, This);
                if (typeof This.onCardRightClick === "function") {
                    This.onCardRightClick(wargs);
                }
                args.wrapped = wargs;

                if (args.preventDefault.value) {
                    return;
                }

                var e = args.e;
                var card = wargs.card;
                switch (This.cardRightClickHandling) {
                    case 'ContextMenu':
                        var menu = e.client.contextMenu();
                        if (menu) {
                            menu.show(card);
                        }
                        else {
                            if (This.contextMenuCard) {
                                This.contextMenuCard.show(card);
                            }
                        }
                        args.preventDefault();
                        break;
/*
                    case 'Bubble':
                        if (This.bubble) {
                            This.bubble.showEvent(card);
                        }
                        break;
*/

                }
            };

            dp.onEventRightClicked = function(args) {
                var wargs = args.wrapped;
                if (typeof This.onCardRightClicked === "function") {
                    This.onCardRightClicked(wargs);
                }
            };

            dp.onEventDelete = function(args) {
                var wargs = new DayPilot.Args(args);
                wargs.card = new DayPilot.Card(args.e.data.card, This);
                wargs.control = This;
                if (typeof This.onCardDelete === "function") {
                    This.onCardDelete(wargs);
                }
                args.wrapped = wargs;
            };

            dp.onEventDeleted = function(args) {
                DayPilot.rfa(This.cards.list, args.e.data.card);

                var wargs = args.wrapped;
                if (typeof This.onCardDeleted === "function") {
                    This.onCardDeleted(wargs);
                }
            };

            dp.onEventMove = function(args) {

                if (args.external) {
                    args.e.data.card = {
                        id: args.e.data.id,
                        name: args.e.data.name,
                        text: args.e.data.text,
                        barColor: args.e.data.barColor,
                        barBackColor: args.e.data.barBackColor
                    };
                }

                var wargs = new DayPilot.Args(args);
                wargs.control = This;
                wargs.card = new DayPilot.Card(args.e.data.card, This);
                wargs.column = new DayPilot.KanbanColumn(This._findColumn(args.newStart));
                wargs.position = args.position;
                wargs.external = args.external;
                if (args.newResource !== "*") {
                    wargs.swimlane = new DayPilot.Swimlane(This._findSwimlane(args.newResource), This);
                }
                else {
                    wargs.swimlane = null;
                }

                //console.log("position: " + args.position);

                // target cell
                var events = scheduler.cells.find(args.newStart, args.newResource)[0].events();

                //var previous = events[args.position - 1] ? new DayPilot.Card(events[args.position - 1], This) : null;
                var targetIndex = args.position;

                var previous = null;
                var pi = targetIndex - 1;
                while (events[pi]) {
                    if (events[pi].data !== args.e.data) {
                        previous = new DayPilot.Card(events[pi]);  // create it from DayPilot.Event
                        break;
                    }
                    pi -= 1;
                }

                var next = null;
                var ni = targetIndex;
                while (events[ni]) {
                    if (events[ni].data !== args.e.data) {
                        next = new DayPilot.Card(events[ni]);  // create it from DayPilot.Event
                        break;
                    }
                    ni += 1;
                }

                wargs.previous = previous;
                wargs.next = next;

                if (typeof This.onCardMove === "function") {
                    This.onCardMove(wargs);
                }

                args.wrapped = wargs;

                // the default moving logic disabled, replaced by column update below
                args.preventDefault();

                if (wargs.preventDefault.value) {
                    return;
                }

                switch (This.cardMoveHandling) {
                    case "Update":
                        var newIndex = 0;
                        if (next) {
                            newIndex = next.wrapped.data.sort[0];
                        }
                        else if (previous) {
                            newIndex = previous.wrapped.data.sort[0];
                        }
                        args.e.data.sort = [newIndex, new DayPilot.Date().toString()];

                        DayPilot.rfa(This.cards.list, args.e.data.card);

                        var index = 0;
                        if (next) {
                            index = DayPilot.indexOf(This.cards.list, next.data);
                        }
                        else if (previous) {
                            index = DayPilot.indexOf(This.cards.list, previous.data) + 1;
                        }

                        // update the column
                        var column = This._findColumn(args.newStart);
                        args.e.data.card.column = column.id;

                        // update the swimlane
                        args.e.data.card.swimlane = args.newResource;

                        This.cards.list.splice(index, 0, args.e.data.card);

                        wrap.updateSort();
                        scheduler.internal.deleteDragSource();
                        This.update();
                        break;
                }

                (function moved() {
                    var wargs = args.wrapped;
                    var source = DayPilot.list(This.cards.list).find(function(item) {
                        return args.e.data.card === item;
                    });



                    source.swimlane = wargs.swimlane ? wargs.swimlane.data.id : null;
                    source.column = wargs.column.data.id;

                    if (typeof This.onCardMoved === "function") {
                        This.onCardMoved(wargs);
                    }
                })();

            };

            dp.onBeforeResHeaderRender = function(args) {

                if (!This.swimlaneCollapsingEnabled) {
                    return;
                }

                var noSwimlanes = DayPilot.list(This.swimlanes.list).isEmpty();
                if (noSwimlanes) {
                    return;
                }

                var css = This.theme + "_swimlane_collapse";
                if (args.resource.collapsed) {
                    css = This.theme + "_swimlane_expand";
                }
                args.resource.areas = [
                    {"right":0, "top":0, "height": swimlaneCollapseIconHeight, "width": swimlaneCollapseIconWidth, "action":"JavaScript", "css": css, "js": function() { This._toggleSwimlane(args.resource.index); }}
                ];

            };

            dp.onRowMove = function(args) {
                var wargs = new DayPilot.Args(args);
                wargs.control = This;
                args.wrapped = wargs;
                wargs.swimlane = new DayPilot.Swimlane(args.source.$.row.swimlane);

                var targetIndex = 0;
                switch (args.position) {
                    case "before":
                        targetIndex = args.target.index;
                        break;
                    case "after":
                        targetIndex = args.target.index + 1;
                        break;
                    default:
                        throw "Unexpected target swimlane position: " + args.position;
                        break;
                }
                wargs.position = targetIndex;

                wargs.previous = null;
                var pi = targetIndex - 1;
                while (scheduler.rowlist[pi] && scheduler.rowlist[pi].swimlane !== wargs.swimlane.data) {
                    wargs.previous = new DayPilot.Swimlane(scheduler.rowlist[pi].swimlane);
                    pi -= 1;
                }

                wargs.next = null;
                var ni = targetIndex;
                while (scheduler.rowlist[ni] && scheduler.rowlist[ni].swimlane !== wargs.swimlane.data) {
                    wargs.next = new DayPilot.Swimlane(scheduler.rowlist[ni].swimlane);
                    ni += 1;
                }

                if (typeof This.onSwimlaneMove === "function") {
                    This.onSwimlaneMove(wargs);
                }
            };

            dp.onRowMoved = function(args) {

                var wargs = args.wrapped;

                DayPilot.rfa(This.swimlanes.list, wargs.swimlane.data);

                var index = 0;
                if (wargs.next) {
                    index = DayPilot.indexOf(This.swimlanes.list, wargs.next.data);
                }
                else if (wargs.previous) {
                    index = DayPilot.indexOf(This.swimlanes.list, wargs.previous.data) + 1;
                }

                This.swimlanes.list.splice(index, 0, wargs.swimlane.data);

                if (typeof This.onSwimlaneMoved === "function") {
                    This.onSwimlaneMoved(wargs);
                }
            };

            //dp.treeEnabled = true;
            dp.treePreventParentUsage = true;

        };

        wrap.loadCards = function() {
            // var start = new DayPilot.Date("2000-01-01");
            var headerCss = This.theme + "_card_header";
            var bodyCss = This.theme + "_card_body";

            var now = new DayPilot.Date().toString();

            scheduler.sortDirections = ["asc", "desc"];

            scheduler.events.list = DayPilot.list(This.cards.list).map(function(card, i) {
                var html = card.html || card.text || "";
                var name = card.name || "";

                var data = {};
                data.id = card.id;
                data.text = card.text;
                data.html = "<div class='" + headerCss + "'>" + name + "</div><div class='" + bodyCss + "'>" + html + "</div>";
                data.resource = card.swimlane;
                data.start = start.addDays(DayPilot.list(This.columns.list).findIndex(function(item) {
                    return card.column === item.id;
                }));
                data.end = data.start.addDays(1);
                //data.barColor = card.barColor;
                data.card = card;
                data.height = card.height;
                data.cssClass = card.cssClass;
                data.sort = [i , now];
                data.areas = DayPilot.list(card.areas).map(function(item) {
                    var copy = {};
                    DayPilot.Util.copyProps(item, copy);
                    if (item.js) {
                        copy.js = function(e) { item.js(new DayPilot.Card(e.data.card, This)); };
                    }
                    return copy;
                });
                data.areas.push({"left": 0, "width":5, "top": 0, "bottom":0, "backColor": card.barColor, "cssClass": This.theme + "_card_bar"});

                return data;
            });
        };

        wrap.updateSort = function() {
            var now = new DayPilot.Date().toString();
            DayPilot.list(This.cards.list).forEach(function(item, i) {
                var evdata = wrap.findSchedulerEventData(item);
                if (evdata) {
                    evdata.sort = [i, now];
                }
            });
        };

        wrap.findSchedulerEventData = function(cardData) {
            return DayPilot.list(scheduler.events.list).find(function(evdata) {
                return evdata.card === cardData;
            });
        };

        wrap.loadSwimlanes = function() {
            var collapsedHeight = 20;
            var swimlanes = DayPilot.list(This.swimlanes.list);
            scheduler.resources = swimlanes.map(function(input) {
                var item = {};
                item.name = input.name;
                item.id = input.id;
                item.swimlane = input;

                if (input.collapsed) {
                    item.collapsed = true;
                    item.eventHeight = collapsedHeight;
                    item.hideEvents = true;
                    /*
                    // prevent loading tasks, might not work in the long term
                    item.id = null;
                    */
                }

                return item;
            });

            if (swimlanes.isEmpty()) {
                scheduler.resources = [
                    {name: "", id: "*"}
                ];
            }

        };

        wrap.loadColumns = function() {
            var columns = DayPilot.list(This.columns.list);
            scheduler.days = columns.length;
        };

        var colmoving = {};
        colmoving.active = null;
        colmoving.div = null;

        colmoving.update = function() {
            colmoving.clear();

            var index = colmoving.findPosition();
            colmoving.draw(index);
        };

        colmoving.clear = function() {
            DayPilot.de(colmoving.div);
            colmoving.div = null;
        };

        colmoving.draw = function(index) {
            var left = 0;
            if (index >= scheduler.itline.length) {
                var cell = scheduler.itline[scheduler.itline.length - 1];
                left = cell.left + cell.width - 3;
            }
            else {
                left = scheduler.itline[index].left;
            }

            var div = document.createElement("div");
            div.style.position = "absolute";
            //div.style.backgroundColor = "green";
            div.style.left = left + "px";
            div.style.width = "3px";
            div.style.top = 0;
            div.style.height = scheduler.headerHeight + "px";
            div.className = This.theme + "_columnmove_position";

            colmoving.div = div;

            scheduler.nav.timeHeader.appendChild(div);
        };

        colmoving.findPosition = function() {
            if (This.coords.x < 0) {
                return 0;
            }
            var index = DayPilot.list(scheduler.itline).findIndex(function(item) {
                var left = item.left + scheduler.rowHeaderWidth;
                var width = item.width;
                return This.coords.x < (left + width/2);
            });

            if (index === -1) {
                return scheduler.itline.length;
            }
            return index;
        };

        this._onColumnMouseDown = function(args) {
            colmoving.active = args;
        };

        this._findColumn = function(date) {
            // return This.columns.list[date.getDay() - 1];
            return This.columns.list[DayPilot.DateUtil.daysDiff(start, date)];
        };

        this._findSwimlane = function(id) {
            return DayPilot.list(This.swimlanes.list).find(function(item) {
                return item.id === id;
            });
        };

        this.message = function(html, delay, foreColor, backColor) {
            scheduler.message(html, delay, foreColor, backColor);
        };

        this.show = function() {
            This.visible = true;
            scheduler.show();
        };

        this.hide = function() {
            This.visible = false;
            scheduler.hide();
        };

        this.cards.add = function(card) {
            var data = null;
            if (card && card instanceof DayPilot.Card) {
                data = card.data;
            }
            else {
                data = card;
            }
            if (!card) {
                return;
            }
            This.cards.list.push(data);
            This.update();
        };

        this.cards.remove = function(card) {
            var data = null;
            if (card && card instanceof DayPilot.Card) {
                data = card.data;
            }
            else {
                data = card;
            }
            if (!card) {
                return;
            }
            DayPilot.rfa(This.cards.list, data);
            This.update();
        };

        this.cards.update = function(card) {

            // shortcut implementation
            This.update();
        };

        this.cards.find = function(id) {
            var data = DayPilot.list(This.cards.list).find(function(item) {
                if (id === item.id) {
                    return true;
                }
                return false;
            });
            if (!data) {
                return null;
            }
            return new DayPilot.Card(data, This);
        };

        this._toggleSwimlane = function(i) {
            if (!DayPilot.list(This.swimlanes.list).isEmpty()) {
                This.swimlanes.list[i].collapsed = !This.swimlanes.list[i].collapsed;
            }
            This.update();
        };

        this.init = function() {
            if (this._initialized) {
                throw new DayPilot.Exception("This instance is already initialized. Use update() to change properties.")
            }
            wrap.translate();
            wrap.loadSwimlanes();
            wrap.loadColumns();
            wrap.loadCards();

            scheduler.init();
            This._registerGlobalHandlers();
            this._initialized = true;

            return this;
        };

        this._disposed = false;

        this.dispose = function() {
            scheduler.dispose();
            This._disposed = true;
        };

        this.update = function(options) {
            var calendar = This;
            if (!calendar._initialized) {
                throw new DayPilot.Exception("You are trying to update a DayPilot.Kanban instance that hasn't been initialized yet.");
            }

            if (calendar._disposed) {
                throw new DayPilot.Exception("You are trying to update a DayPilot.Kanban instance that has been disposed.");
            }

            This._loadOptions(options);

            wrap.translate();
            wrap.loadSwimlanes();
            wrap.loadColumns();
            wrap.loadCards();
            scheduler.update();
        };

        this._registerGlobalHandlers = function() {
            DayPilot.re(document, 'mouseup', This._gMouseUp);
            DayPilot.re(document, 'mousemove', This._gMouseMove);
        };

        this._angular = {};
        this._angular.scope = null;
        this._angular.notify = function() {
            if (This._angular.scope) {
                This._angular.scope["$apply"]();
            }
        };

        this._specialHandling = null;
        this._loadOptions = function(options) {

            if (!options) {
                return;
            }

            var specialHandling = {
                "cards": {
                    "preInit": function() {
                        var cards = this.data;
                        if (!cards) {
                            // This.cards.list = [];
                            return;
                        }
                        if (DayPilot.isArray(cards.list)) {
                            This.cards.list = cards.list;
                        }
                        else {
                            This.cards.list = cards;
                        }
                    }
                },
                "columns": {
                    "preInit": function() {

                        var columns = this.data;
                        if (!columns) {
                            // This.columns.list = [];
                            return;
                        }
                        if (DayPilot.isArray(columns.list)) {
                            This.columns.list = columns.list;
                        }
                        else {
                            This.columns.list = columns;
                        }
                    }
                },
                "swimlanes": {
                    "preInit": function() {

                        var swimlanes = this.data;
                        if (!swimlanes) {
                            // This.swimlanes.list = [];
                            return;
                        }
                        if (DayPilot.isArray(swimlanes.list)) {
                            This.swimlanes.list = swimlanes.list;
                        }
                        else {
                            This.swimlanes.list = swimlanes;
                        }
                    }
                }
            };
            this._specialHandling = specialHandling;

/*            This.columns.list = [];
            This.swimlanes.list = [];
            This.cards.list = [];*/

            for (var name in options) {
                if (specialHandling[name]) {
                    var item = specialHandling[name];
                    item.data = options[name];
                    if (item.preInit) {
                        item.preInit();
                    }
                }
                else {
                    This[name] = options[name];
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
        // Angular 2
        this.internal.loadOptions = This._loadOptions;

        this._loadOptions(options);

        this._visible = function() {
            var el = This.nav.top;
            if (!el) {
                return false;
            }
            return el.offsetWidth > 0 && el.offsetHeight > 0;
        };

        this._waitForVisibility = function() {
            var calendar = This;
            var visible = calendar._visible;

            if (!visible() && !calendar._visibilityInterval) {
                //calendar.debug.message("Not visible during init, starting visibilityInterval");
                calendar._visibilityInterval = setInterval(function() {
                    if (visible()) {
                        calendar.update();
                        clearInterval(calendar._visibilityInterval);
                    }
                }, 100);
            }
        };

        this._gMouseMove = function(ev) {
            This.coords = DayPilot.mo3(scheduler.nav.top, ev);

            if (colmoving.active) {
                colmoving.update();
            }
        };

        this._gMouseUp = function(ev) {
            if (!colmoving.active) {
                return;
            }

            var source = colmoving.active.source;
            var target = colmoving.findPosition();

            var column = This._findColumn(source.start);

            var args = new DayPilot.Args();
            args.column = new DayPilot.KanbanColumn(column, This);
            args.position = target;
            args.previous = null;
            args.next = null;

            var previous = null;
            var position = args.position;
            while (position !== 0 && !previous) {
                if (column !== This.columns.list[position - 1]) {
                    previous = This.columns.list[position - 1]
                }
                position -= 1;
            }

            if (previous) {
                args.previous = new DayPilot.KanbanColumn(previous, This);
            }

            var next = null;
            position = args.position;
            while (position < This.columns.list.length - 1 && !next) {
                if (column !== This.columns.list[position]) {
                    next = This.columns.list[position];
                }
                position += 1;
            }

            if (next) {
                args.next = new DayPilot.KanbanColumn(next, This);
            }

            if (typeof This.onColumnMove === "function") {
                This.onColumnMove(args);
            }

            if (!args.preventDefault.value) {

                if (This.columnMoveHandling === "Update") {
                    DayPilot.rfa(This.columns.list, args.column.data);

                    var index = 0;
                    if (args.next) {
                        index = DayPilot.indexOf(This.columns.list, args.next.data);
                    }
                    else if (args.previous) {
                        index = DayPilot.indexOf(This.columns.list, args.previous.data) + 1;
                    }

                    This.columns.list.splice(index, 0, args.column.data);

                    This.update();
                }

                if (typeof This.onColumnMoved === "function") {
                    This.onColumnMove(args);
                }
            }

            colmoving.active = null;
            colmoving.clear();
        };

    };

    DayPilot.Kanban.makeDraggable = function(options) {
        DayPilot.Scheduler.makeDraggable(options);
    };

	DayPilot.Card = function(data, control) {
        if (data instanceof DayPilot.Event) {
            var e = data;
            this.data = e.data.card;
            this.wrapped = data;
        }
        else {
            this.data = data;
        }

        this.control = control;
    };

    DayPilot.KanbanColumn = function(data, control) {
        this.data = data;
        this.control = control;
    };

    DayPilot.Swimlane = function(data, control) {
        this.data = data;
        this.control = control;
    };

    (function registerAngularModule() {
        var app = DayPilot.am();

        if (!app) {
            return;
        }

        app.directive("daypilotKanban", ['$parse', function($parse) {
            return {
                "restrict": "E",
                "template": "<div id='{{id}}'></div>",
                "compile": function compile(element, attrs) {
                    element.replaceWith(this["template"].replace("{{id}}", attrs["id"]));

                    return function link(scope, element, attrs) {
                        var calendar = new DayPilot.Kanban(element[0]);
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
                        //var events = attrs["cards"] || attrs["daypilotCards"];

                        watch.call(scope, config, function (value, oldVal) {
                            calendar._loadOptions(value);
                            calendar.update();
                        }, true);

                    };
                }
            };
        }]);

    })();

    DayPilot.Kanban.def = {};

})(DayPilot);
