/* Copyright 2005 - ${year} Annpoint, s.r.o.
   Use of this software is subject to license terms.
   https://www.daypilot.org/
*/
import { NgModule, Component, Output, EventEmitter, Input, Inject, ElementRef } from "@angular/core";
import { DayPilot } from "./daypilot-core";
var rand = function () { return ((1 + Math.random()) * 0x10000) | 0; };
var optHash = function (options) { return JSON.stringify(options); };
var EventDiff = function () {
    // let orig = { "hashes": {}, "ids": [] };
    var orig = { "hashes": {} };
    this.diff = function (list) {
        var result = {};
        // new hashes, new ids
        var hashes = {};
        // let ids = [];
        list = list || [];
        for (var i = 0; i < list.length; i++) {
            var e = list[i];
            var id = e.id;
            if (!id) {
                throw "The 'id' property must be specified for event data object";
            }
            if (hashes.hasOwnProperty("" + id)) {
                throw "Duplicate event IDs are not allowed, id: " + id;
            }
            hashes["" + id] = JSON.stringify(e);
            // ids.push("" + id);
        }
        // array of new objects
        result.add = list.filter(function (item) { return !orig.hashes.hasOwnProperty(item.id); });
        // array of IDs
        result.remove = Object.getOwnPropertyNames(orig.hashes).filter(function (id) {
            return !hashes.hasOwnProperty(id);
        }).map(function (id) {
            return JSON.parse(orig.hashes[id]).id;
        }); // array of ids
        // result.remove = orig.ids.filter(function(id) { return !hashes.hasOwnProperty(id); });  // array of ids
        // array of new objects
        result.modify = list.filter(function (item) { return orig.hashes.hasOwnProperty(item.id) && orig.hashes[item.id] !== hashes[item.id]; });
        result.changeCount = result.add.length + result.modify.length + result.remove.length;
        orig.hashes = hashes;
        // orig.ids = ids;
        return result;
    };
};
var DayPilotSchedulerComponent = (function () {
    function DayPilotSchedulerComponent() {
        this._requestUpdateFull = false;
        this._requestUpdateEvents = false;
        this._requestViewChange = false;
        this._eventDiff = new EventDiff();
        this._visibleRange = { "start": null, "end": null };
        this._eventsSet = false;
        this._id = "dp_" + new Date().getTime() + rand();
        this.viewChange = new EventEmitter();
    }
    Object.defineProperty(DayPilotSchedulerComponent.prototype, "events", {
        get: function () {
            return this._events;
        },
        set: function (value) {
            this._eventsSet = true;
            this._events = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DayPilotSchedulerComponent.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    DayPilotSchedulerComponent.prototype.ngOnInit = function () { };
    DayPilotSchedulerComponent.prototype.ngOnDestroy = function () {
        this.dispose();
    };
    DayPilotSchedulerComponent.prototype.ngAfterViewInit = function () {
        // not sure why this was called here, it shouldn't be
        // this.dispose();
        this.control = new DayPilot.Scheduler(this.id);
        var control = this.control;
        control.internal.enableAngular2();
        this.updateOptions();
        this.updateEvents();
        this._requestUpdateFull = false; // config just loaded and calling init(), no need to call update again
        this._requestUpdateEvents = false; // config just loaded and calling init(), no need to call update again
        this.control.init();
    };
    DayPilotSchedulerComponent.prototype.ngDoCheck = function () {
        if (!this.control) {
            return;
        }
        this.updateOptions();
        this.updateEvents();
        var control = this.control;
        if (this._requestUpdateFull) {
            this.control.update();
            control.internal.postInit();
            this._requestUpdateFull = false;
            this._requestUpdateEvents = false;
        }
        else if (this._requestUpdateEvents) {
            this.control.update({ "events": this.events });
            this._requestUpdateEvents = false;
        }
        if (this._requestViewChange) {
            this._requestViewChange = false;
            var args = {};
            args.visibleRangeChanged = this._visibleRange.start !== this.control.visibleStart() || this._visibleRange.end !== this.control.visibleEnd();
            this._visibleRange.start = this.control.visibleStart();
            this._visibleRange.end = this.control.visibleEnd();
            this.viewChange.emit(args);
        }
    };
    DayPilotSchedulerComponent.prototype.dispose = function () {
        if (this.control) {
            this.control.dispose();
            this.control = null;
        }
    };
    DayPilotSchedulerComponent.prototype.updateOptions = function () {
        var hash = optHash(this.config);
        if (hash !== this._hashOptions) {
            var control = this.control;
            if (this.config && this.config.resources) {
                control.internal.resourcesFromAttr();
            }
            if (control.internal.skipUpdate()) {
                control.internal.skipped();
            }
            else {
                control.internal.loadOptions(this.config);
                this._requestUpdateFull = true;
                this._requestViewChange = true;
            }
        }
        this._hashOptions = hash;
    };
    DayPilotSchedulerComponent.prototype.updateEvents = function () {
        if (!this._eventsSet) {
            return;
        }
        var diff = this._eventDiff.diff(this.events);
        var control = this.control;
        control.internal.eventsFromAttr();
        if (control.internal.skipUpdate()) {
            control.internal.skipped();
            //this._hashEvents = hash;
            return;
        }
        var maxInlineChanges = 10;
        if (diff.changeCount === 0 && this.events === control.events.list) {
            return;
        }
        if (diff.changeCount < maxInlineChanges && this.events === control.events.list) {
            diff.add.forEach(function (data) {
                control.events.add(new DayPilot.Event(data), null, { "renderOnly": true });
            });
            diff.modify.forEach(function (data) {
                control.events.update(new DayPilot.Event(data));
            });
            diff.remove.forEach(function (id) {
                var e = control.events.find(id);
                if (e) {
                    control.events.remove(e);
                }
            });
            control.internal.evImmediateRefresh();
            // make sure it's synced, after inline update
            //control.events.list = this.events;
        }
        else {
            control.events.list = this.events;
            this._requestUpdateEvents = true;
        }
    };
    return DayPilotSchedulerComponent;
}());
export { DayPilotSchedulerComponent };
DayPilotSchedulerComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-scheduler',
                template: "<div id='{{id}}'></div>",
                styles: [""]
            },] },
];
/** @nocollapse */
DayPilotSchedulerComponent.ctorParameters = function () { return []; };
DayPilotSchedulerComponent.propDecorators = {
    'viewChange': [{ type: Output },],
    'config': [{ type: Input },],
    'events': [{ type: Input },],
};
var DayPilotCalendarComponent = (function () {
    function DayPilotCalendarComponent() {
        this._requestUpdateFull = false;
        this._requestUpdateEvents = false;
        this._requestViewChange = false;
        this._id = "dp_" + new Date().getTime() + rand();
        this.viewChange = new EventEmitter();
    }
    Object.defineProperty(DayPilotCalendarComponent.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    DayPilotCalendarComponent.prototype.ngOnInit = function () { };
    DayPilotCalendarComponent.prototype.ngOnDestroy = function () {
        this.dispose();
    };
    DayPilotCalendarComponent.prototype.ngAfterViewInit = function () {
        this.dispose();
        var dp = new DayPilot.Calendar(this.id);
        this.control = dp;
        this.updateOptions();
        this.updateEvents();
        this._requestUpdateFull = false; // config just loaded and calling init(), no need to call update again
        this._requestUpdateEvents = false; // config just loaded and calling init(), no need to call update again
        dp.init();
    };
    DayPilotCalendarComponent.prototype.ngDoCheck = function () {
        if (!this.control) {
            return;
        }
        this.updateOptions();
        this.updateEvents();
        if (this._requestUpdateFull) {
            this.control.update();
            this._requestUpdateFull = false;
            this._requestUpdateEvents = false;
        }
        else if (this._requestUpdateEvents) {
            this.control.update({ "events": this.events });
            this._requestUpdateEvents = false;
        }
        if (this._requestViewChange) {
            this._requestViewChange = false;
            var args = {};
            this.viewChange.emit(args);
        }
    };
    DayPilotCalendarComponent.prototype.dispose = function () {
        if (this.control) {
            this.control.dispose();
            this.control = null;
        }
    };
    DayPilotCalendarComponent.prototype.updateOptions = function () {
        var hash = optHash(this.config);
        if (hash !== this._hashOptions) {
            var dp = this.control;
            for (var name_1 in this.config) {
                dp[name_1] = this.config[name_1];
            }
            this._requestUpdateFull = true;
            this._requestViewChange = true;
        }
        this._hashOptions = hash;
    };
    DayPilotCalendarComponent.prototype.updateEvents = function () {
        var hash = optHash(this.events);
        if (hash !== this._hashEvents) {
            var dp = this.control;
            dp.events.list = this.events;
            this._requestUpdateEvents = true;
        }
        this._hashEvents = hash;
    };
    return DayPilotCalendarComponent;
}());
export { DayPilotCalendarComponent };
DayPilotCalendarComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-calendar',
                template: "<div id='{{id}}'></div>",
                styles: [""]
            },] },
];
/** @nocollapse */
DayPilotCalendarComponent.ctorParameters = function () { return []; };
DayPilotCalendarComponent.propDecorators = {
    'viewChange': [{ type: Output },],
    'events': [{ type: Input },],
    'config': [{ type: Input },],
};
var DayPilotGanttComponent = (function () {
    function DayPilotGanttComponent() {
        this._requestUpdate = false;
        this._id = "dp_" + new Date().getTime() + rand();
    }
    Object.defineProperty(DayPilotGanttComponent.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    DayPilotGanttComponent.prototype.ngOnInit = function () { };
    DayPilotGanttComponent.prototype.ngOnDestroy = function () {
        this.dispose();
    };
    DayPilotGanttComponent.prototype.ngAfterViewInit = function () {
        this.dispose();
        this.control = new DayPilot.Gantt(this.id);
        this.updateOptions();
        this._requestUpdate = false; // config just loaded and calling init(), no need to call update again
        this.control.init();
    };
    DayPilotGanttComponent.prototype.ngDoCheck = function () {
        if (!this.control) {
            return;
        }
        this.updateOptions();
        if (this._requestUpdate) {
            this.control.update();
            this._requestUpdate = false;
        }
    };
    DayPilotGanttComponent.prototype.dispose = function () {
        if (this.control) {
            this.control.dispose();
            this.control = null;
        }
    };
    DayPilotGanttComponent.prototype.updateOptions = function () {
        var hash = optHash(this.config);
        if (hash !== this._hashOptions) {
            var dp = this.control;
            dp.internal.loadOptions(this.config);
            this._requestUpdate = true;
        }
        this._hashOptions = hash;
    };
    return DayPilotGanttComponent;
}());
export { DayPilotGanttComponent };
DayPilotGanttComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-gantt',
                template: "<div id='{{id}}'></div>",
                styles: [""]
            },] },
];
/** @nocollapse */
DayPilotGanttComponent.ctorParameters = function () { return []; };
DayPilotGanttComponent.propDecorators = {
    'config': [{ type: Input },],
};
var DayPilotMonthComponent = (function () {
    function DayPilotMonthComponent() {
        this._requestUpdate = false;
        this._id = "dp_" + new Date().getTime() + rand();
    }
    Object.defineProperty(DayPilotMonthComponent.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    DayPilotMonthComponent.prototype.ngOnInit = function () { };
    DayPilotMonthComponent.prototype.ngOnDestroy = function () {
        this.dispose();
    };
    DayPilotMonthComponent.prototype.ngAfterViewInit = function () {
        this.dispose();
        this.control = new DayPilot.Month(this.id);
        this.updateOptions();
        this.updateEvents();
        this._requestUpdate = false; // config just loaded and calling init(), no need to call update again
        this.control.init();
    };
    DayPilotMonthComponent.prototype.ngDoCheck = function () {
        if (!this.control) {
            return;
        }
        this.updateOptions();
        this.updateEvents();
        if (this._requestUpdate) {
            this.control.update();
            this._requestUpdate = false;
        }
    };
    DayPilotMonthComponent.prototype.dispose = function () {
        if (this.control) {
            this.control.dispose();
            this.control = null;
        }
    };
    DayPilotMonthComponent.prototype.updateOptions = function () {
        var hash = optHash(this.config);
        if (hash !== this._hashOptions) {
            var dp = this.control;
            for (var name_2 in this.config) {
                dp[name_2] = this.config[name_2];
            }
            this._requestUpdate = true;
        }
        this._hashOptions = hash;
    };
    DayPilotMonthComponent.prototype.updateEvents = function () {
        var hash = optHash(this.events);
        if (hash !== this._hashEvents) {
            var dp = this.control;
            dp.events.list = this.events;
            this._requestUpdate = true;
        }
        this._hashEvents = hash;
    };
    return DayPilotMonthComponent;
}());
export { DayPilotMonthComponent };
DayPilotMonthComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-month',
                template: "<div id='{{id}}'></div>",
                styles: [""]
            },] },
];
/** @nocollapse */
DayPilotMonthComponent.ctorParameters = function () { return []; };
DayPilotMonthComponent.propDecorators = {
    'events': [{ type: Input },],
    'config': [{ type: Input },],
};
var DayPilotKanbanComponent = (function () {
    function DayPilotKanbanComponent() {
        this._requestUpdate = false;
        this._id = "dp_" + new Date().getTime() + rand();
    }
    Object.defineProperty(DayPilotKanbanComponent.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    DayPilotKanbanComponent.prototype.ngOnInit = function () { };
    DayPilotKanbanComponent.prototype.ngOnDestroy = function () {
        this.dispose();
    };
    DayPilotKanbanComponent.prototype.ngAfterViewInit = function () {
        this.dispose();
        this.control = new DayPilot.Kanban(this.id);
        this.updateOptions();
        this._requestUpdate = false; // config just loaded and calling init(), no need to call update again
        this.control.init();
    };
    DayPilotKanbanComponent.prototype.ngDoCheck = function () {
        if (!this.control) {
            return;
        }
        this.updateOptions();
        if (this._requestUpdate) {
            this.control.update();
            this._requestUpdate = false;
        }
    };
    DayPilotKanbanComponent.prototype.dispose = function () {
        if (this.control) {
            this.control.dispose();
            this.control = null;
        }
    };
    DayPilotKanbanComponent.prototype.updateOptions = function () {
        var hash = optHash(this.config);
        if (hash !== this._hashOptions) {
            var dp = this.control;
            dp.internal.loadOptions(this.config);
            this._requestUpdate = true;
        }
        this._hashOptions = hash;
    };
    return DayPilotKanbanComponent;
}());
export { DayPilotKanbanComponent };
DayPilotKanbanComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-kanban',
                template: "<div id='{{id}}'></div>",
                styles: [""]
            },] },
];
/** @nocollapse */
DayPilotKanbanComponent.ctorParameters = function () { return []; };
DayPilotKanbanComponent.propDecorators = {
    'config': [{ type: Input },],
};
var DayPilotNavigatorComponent = (function () {
    function DayPilotNavigatorComponent() {
        this._requestUpdate = false;
        this._onTrs = null;
        this._date = DayPilot.Date.today();
        this._dateSet = false;
        this._currentDate = null;
        this.dateChange = new EventEmitter();
        this._id = "dp_" + new Date().getTime() + rand();
    }
    Object.defineProperty(DayPilotNavigatorComponent.prototype, "date", {
        get: function () {
            return this._date;
        },
        // @Input() date: DayPilot.Date = DayPilot.Date.today();
        set: function (value) {
            this._date = value;
            this._dateSet = true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DayPilotNavigatorComponent.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    DayPilotNavigatorComponent.prototype.ngOnInit = function () { };
    DayPilotNavigatorComponent.prototype.ngOnDestroy = function () {
        this.dispose();
    };
    DayPilotNavigatorComponent.prototype.ngAfterViewInit = function () {
        this.dispose();
        this.control = new DayPilot.Navigator(this.id);
        var component = this;
        this.updateOptions();
        this.updateEvents();
        var dp = this.control;
        this.control.onTimeRangeSelected = function (args) {
            // emit event
            /*
                        let date = component._currentDate || DayPilot.Date.today();  // for safety, null would fill Ctor cache --> memory leak
                        if (args.day !== new DayPilot.Date(date)) {   // only on change (compare normalized)
                            component.dateChange.emit(args.day);
                        }
            */
            component.dateChange.emit(args.day);
            // call the original
            if (component._onTrs) {
                component._onTrs.call(dp, args);
            }
        };
        this._requestUpdate = false; // config just loaded and calling init(), no need to call update again
        this.control.init();
        if (this.control.selectionDay !== DayPilot.Date.today()) {
            component.dateChange.emit(this.control.selectionDay);
        }
    };
    DayPilotNavigatorComponent.prototype.ngDoCheck = function () {
        if (!this.control) {
            return;
        }
        this.updateOptions();
        this.updateEvents();
        if (this._requestUpdate) {
            this.control.update();
            this._requestUpdate = false;
        }
    };
    DayPilotNavigatorComponent.prototype.dispose = function () {
        if (this.control) {
            this.control.dispose();
            this.control = null;
        }
    };
    DayPilotNavigatorComponent.prototype.updateOptions = function () {
        var dp = this.control;
        var hash = optHash(this.config);
        if (hash !== this._hashOptions) {
            for (var name_3 in this.config) {
                if (name_3 === "selectionDay") {
                    continue; // ignore
                }
                if (name_3 === "onTimeRangeSelected") {
                    this._onTrs = this.config.onTimeRangeSelected;
                }
                else {
                    dp[name_3] = this.config[name_3];
                }
                this._requestUpdate = true;
            }
        }
        if (this._dateSet && this.date) {
            this._dateSet = false;
            this._currentDate = dp.selectionDay;
            dp.select(this.date);
        }
        this._hashOptions = hash;
    };
    DayPilotNavigatorComponent.prototype.updateEvents = function () {
        var hash = optHash(this.events);
        if (hash !== this._hashEvents) {
            var dp = this.control;
            dp.events.list = this.events;
            this._requestUpdate = true;
        }
        this._hashEvents = hash;
    };
    return DayPilotNavigatorComponent;
}());
export { DayPilotNavigatorComponent };
DayPilotNavigatorComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-navigator',
                template: "<div id='{{id}}'></div>",
                styles: [""]
            },] },
];
/** @nocollapse */
DayPilotNavigatorComponent.ctorParameters = function () { return []; };
DayPilotNavigatorComponent.propDecorators = {
    'date': [{ type: Input },],
    'events': [{ type: Input },],
    'config': [{ type: Input },],
    'dateChange': [{ type: Output },],
};
var DayPilotModalComponent = (function () {
    function DayPilotModalComponent(element) {
        this.element = element;
        this.autoFocus = true;
        this.close = new EventEmitter();
        this._visibility = "hidden";
    }
    Object.defineProperty(DayPilotModalComponent.prototype, "visible", {
        get: function () {
            return this._visibility === "visible";
        },
        enumerable: true,
        configurable: true
    });
    DayPilotModalComponent.prototype.ngOnInit = function () {
    };
    DayPilotModalComponent.prototype.show = function () {
        this._visibility = "visible";
        var element = this.element.nativeElement;
        if (this.autoFocus) {
            setTimeout(function () {
                var first = element.querySelector("input");
                first && first.focus();
            });
        }
    };
    DayPilotModalComponent.prototype.hide = function (result) {
        this._visibility = "hidden";
        this.close.emit({ "result": result });
    };
    return DayPilotModalComponent;
}());
export { DayPilotModalComponent };
DayPilotModalComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-modal',
                styles: ["\n  .modal {\n    position: fixed;\n    top: 0px;\n    left: 0px;\n    right: 0px;\n    max-height: 80%;\n    overflow-y: auto;\n    padding: 20px;\n    background-color: white;\n\n    transform: translateY(-100%);\n  }\n  .modal.visible {\n    transform: translateY(0);\n  }\n\n  .overlay {\n    position: fixed;\n    top: 0px;\n    left: 0px;\n    right: 0px;\n    bottom: 0px;\n    background-color: #000;\n\n    opacity: 0;\n    margin-left: 100%;\n  }\n  .overlay.visible {\n    margin-left: 0;\n    opacity: 0.3;\n  }\n  .modal {\n    transition: transform 0.3s cubic-bezier(0, 0, 0.3, 1);\n  }\n  .overlay {\n    transition: margin-left 0s linear 0.3s, opacity 0.3s;\n  }\n  .overlay.visible {\n    transition: margin-left 0s, opacity 0.3s;\n  }\n  "],
                template: "\n  <div\n      class=\"overlay\"\n      (click)=\"hide()\"\n      [class.visible]=\"visible\"\n      ></div>\n  <div\n      class=\"modal\"\n      [class.visible]=\"visible\"\n      >\n    <ng-content></ng-content>\n  </div>",
            },] },
];
/** @nocollapse */
DayPilotModalComponent.ctorParameters = function () { return [
    { type: ElementRef, decorators: [{ type: Inject, args: [ElementRef,] },] },
]; };
DayPilotModalComponent.propDecorators = {
    'autoFocus': [{ type: Input },],
    'close': [{ type: Output },],
};
var DayPilotQueueComponent = (function () {
    function DayPilotQueueComponent() {
        this._requestUpdate = false;
        this._id = "dp_" + new Date().getTime() + rand();
    }
    Object.defineProperty(DayPilotQueueComponent.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    DayPilotQueueComponent.prototype.ngOnInit = function () { };
    DayPilotQueueComponent.prototype.ngOnDestroy = function () {
        this.dispose();
    };
    DayPilotQueueComponent.prototype.ngAfterViewInit = function () {
        this.dispose();
        this.control = new DayPilot.Queue(this.id);
        this.updateOptions();
        this._requestUpdate = false; // config just loaded and calling init(), no need to call update again
        this.control.init();
    };
    DayPilotQueueComponent.prototype.ngDoCheck = function () {
        if (!this.control) {
            return;
        }
        this.updateOptions();
        if (this._requestUpdate) {
            this.control.update();
            this._requestUpdate = false;
        }
    };
    DayPilotQueueComponent.prototype.dispose = function () {
        if (this.control) {
            this.control.dispose();
            this.control = null;
        }
    };
    DayPilotQueueComponent.prototype.updateOptions = function () {
        var hash = optHash(this.config);
        if (hash !== this._hashOptions) {
            var dp = this.control;
            dp.internal.loadOptions(this.config);
            this._requestUpdate = true;
        }
        this._hashOptions = hash;
    };
    return DayPilotQueueComponent;
}());
export { DayPilotQueueComponent };
DayPilotQueueComponent.decorators = [
    { type: Component, args: [{
                selector: 'daypilot-queue',
                template: "<div id='{{id}}'></div>",
                styles: [""]
            },] },
];
/** @nocollapse */
DayPilotQueueComponent.ctorParameters = function () { return []; };
DayPilotQueueComponent.propDecorators = {
    'config': [{ type: Input },],
};
var DAYPILOT_DIRECTIVES = [
    DayPilotSchedulerComponent,
    DayPilotCalendarComponent,
    DayPilotMonthComponent,
    DayPilotNavigatorComponent,
    DayPilotGanttComponent,
    DayPilotKanbanComponent,
    DayPilotModalComponent,
    DayPilotQueueComponent
];
var DayPilotModule = (function () {
    function DayPilotModule() {
    }
    return DayPilotModule;
}());
export { DayPilotModule };
DayPilotModule.decorators = [
    { type: NgModule, args: [{
                declarations: [DAYPILOT_DIRECTIVES],
                exports: [DAYPILOT_DIRECTIVES],
            },] },
];
/** @nocollapse */
DayPilotModule.ctorParameters = function () { return []; };
export { DayPilot };
