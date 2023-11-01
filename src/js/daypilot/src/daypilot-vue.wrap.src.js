/* Copyright 2005 - ${year} Annpoint, s.r.o.
   Use of this software is subject to license terms.
   https://www.daypilot.org/
*/

(function registerVueComponents() {

    var Vue = typeof Vue !== "undefined" ? Vue : require('vue');
    var hExists = typeof Vue.h === "function";
    var vue3 = hExists && Vue.version && !Vue.version.startsWith("2");
    var c = {};
    var generateId = function () {
        var rand = function () { return ((1 + Math.random()) * 0x10000) | 0; };
        return "dp_" + new Date().getTime() + "_" + rand();
    };

    if (vue3) {
        c.DayPilotScheduler = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function () {
                return Vue.h(
                    'div',
                    {
                        id: this.cid
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Scheduler(this.cid, this.config).init();
            },
            beforeUnmount: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotCalendar = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function () {
                return Vue.h(
                    'div',
                    {
                        id: this.cid
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Calendar(this.cid, this.config).init();
            },
            beforeUnmount: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotMonth = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function () {
                return Vue.h(
                    'div',
                    {
                        id: this.cid
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Month(this.cid, this.config).init();
            },
            beforeUnmount: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotNavigator = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function () {
                return Vue.h(
                    'div',
                    {
                        id: this.cid
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Navigator(this.cid, this.config).init();
            },
            beforeUnmount: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotGantt = {
            props: ['id', 'config'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                }
            },
            render: function () {
                return Vue.h(
                    'div',
                    {
                        id: this.cid
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Gantt(this.cid, this.config).init();
            },
            beforeUnmount: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotKanban = {
            props: ['id', 'config'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                }
            },
            render: function () {
                return Vue.h(
                    'div',
                    {
                        id: this.cid
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Kanban(this.cid, this.config).init();
            },
            beforeUnmount: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotQueue = {
            props: ['id', 'config'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                }
            },
            render: function () {
                return Vue.h(
                    'div',
                    {
                        id: this.cid
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Queue(this.cid, this.config).init();
            },
            beforeUnmount: function () {
                this.control && this.control.dispose();
            }
        };
    }
    else {
        c.DayPilotScheduler = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function (createElement) {
                return createElement(
                    'div',
                    {
                        attrs: {
                            id: this.cid
                        }
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Scheduler(this.cid, this.config).init();
            },
            beforeDestroy: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotCalendar = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function (createElement) {
                return createElement(
                    'div',
                    {
                        attrs: {
                            id: this.cid
                        }
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Calendar(this.cid, this.config).init();
            },
            beforeDestroy: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotMonth = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function (createElement) {
                return createElement(
                    'div',
                    {
                        attrs: {
                            id: this.cid
                        }
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Month(this.cid, this.config).init();
            },
            beforeDestroy: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotNavigator = {
            props: ['id', 'config', 'events'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                },
                'events': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update({events: val});
                    },
                    deep: true
                }
            },
            render: function (createElement) {
                return createElement(
                    'div',
                    {
                        attrs: {
                            id: this.cid
                        }
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Navigator(this.cid, this.config).init();
            },
            beforeDestroy: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotGantt = {
            props: ['id', 'config'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                }
            },
            render: function (createElement) {
                return createElement(
                    'div',
                    {
                        attrs: {
                            id: this.cid
                        }
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Gantt(this.cid, this.config).init();
            },
            beforeDestroy: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotKanban = {
            props: ['id', 'config'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                }
            },
            render: function (createElement) {
                return createElement(
                    'div',
                    {
                        attrs: {
                            id: this.cid
                        }
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Kanban(this.cid, this.config).init();
            },
            beforeDestroy: function () {
                this.control && this.control.dispose();
            }
        };
        c.DayPilotQueue = {
            props: ['id', 'config'],
            data: function () {
                return {
                    cid: this.id || generateId(),
                };
            },
            watch: {
                'config': {
                    handler: function (val, oldVal) {
                        this.control && this.control.update(val);
                    },
                    deep: true
                }
            },
            render: function (createElement) {
                return createElement(
                    'div',
                    {
                        attrs: {
                            id: this.cid
                        }
                    }
                )
            },
            mounted: function () {
                this.control = new DayPilot.Queue(this.cid, this.config).init();
            },
            beforeDestroy: function () {
                this.control && this.control.dispose();
            }
        };
    }

    module.exports = {
        DayPilot: DayPilot,
        DayPilotCalendar: c.DayPilotCalendar,
        DayPilotScheduler: c.DayPilotScheduler,
        DayPilotMonth: c.DayPilotMonth,
        DayPilotNavigator: c.DayPilotNavigator,
        DayPilotGantt: c.DayPilotGantt,
        DayPilotKanban: c.DayPilotKanban,
        DayPilotQueue: c.DayPilotQueue
    };
})();
