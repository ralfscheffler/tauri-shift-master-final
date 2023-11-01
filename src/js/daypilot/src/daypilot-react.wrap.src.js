/* Copyright 2005 - ${year} Annpoint, s.r.o.
   Use of this software is subject to license terms.
   https://www.daypilot.org/
*/

(function reactRegistration() {
    var React = require('react');
    var ReactDOM = require("react-dom");
    var rversion = ReactDOM.version || "0.0";
    var v = parseInt(rversion.split(".")[0]);
    if (v >= 18) {
        try {
            ReactDOM = require("react-dom/client");
        }
        catch (e) {}
    }

    var createReactClass = require('create-react-class');

    var DayPilotScheduler = createReactClass({
        getInitialState: function() {
            return {};
        },
        componentDidMount:function() {
            this.control = new DayPilot.Scheduler(this.me.ref, this.props);
            this.control.internal.enableReact(React, ReactDOM);
            this.control.init();
        },
        componentWillUnmount: function() {
            this.control && this.control.dispose();
        },
        componentDidUpdate: function(prevProps, prevState, snapshot) {
            this.control && this.control.update(this.props);
        },
        render: function(){
            if (!this.me) {
                this.me = {};
            }
            var me = this.me;
            return React.createElement("div",{
                "ref": function(r) { me.ref = r; }
            });
        }
    });

    var DayPilotMonth = createReactClass({
        componentDidMount:function() {
            this.control = new DayPilot.Month(this.me.ref, this.props);
            this.control.internal.enableReact(React, ReactDOM);
            this.control.init();
        },
        componentWillUnmount: function() {
            this.control && this.control.dispose();
        },
        componentDidUpdate: function(prevProps, prevState, snapshot) {
            this.control && this.control.update(this.props);
        },
        render: function(){
            if (!this.me) {
                this.me = {};
            }
            var me = this.me;
            return React.createElement("div",{
                "ref": function(r) { me.ref = r; }
            });
        }
    });

    var DayPilotCalendar = createReactClass({
        componentDidMount:function() {
            this.control = new DayPilot.Calendar(this.me.ref, this.props);
            this.control.internal.enableReact(React, ReactDOM);
            this.control.init();
        },
        componentWillUnmount: function() {
            this.control && this.control.dispose();
        },
        componentDidUpdate: function(prevProps, prevState, snapshot) {
            this.control && this.control.update(this.props);
        },
        render: function(){
            if (!this.me) {
                this.me = {};
            }
            var me = this.me;
            return React.createElement("div",{
                "ref": function(r) { me.ref = r; }
            });
        }
    });

    var DayPilotGantt = createReactClass({
        componentDidMount:function() {
            this.control = new DayPilot.Gantt(this.me.ref, this.props).init();
        },
        componentWillUnmount: function() {
            this.control && this.control.dispose();
        },
        componentDidUpdate: function(prevProps, prevState, snapshot) {
            this.control && this.control.update(this.props);
        },
        render: function(){
            if (!this.me) {
                this.me = {};
            }
            var me = this.me;
            return React.createElement("div",{
                "ref": function(r) { me.ref = r; }
            });
        }
    });

    var DayPilotKanban = createReactClass({
        componentDidMount:function() {
            this.control = new DayPilot.Kanban(this.me.ref, this.props).init();
        },
        componentWillUnmount: function() {
            this.control && this.control.dispose();
        },
        componentDidUpdate: function(prevProps, prevState, snapshot) {
            this.control && this.control.update(this.props);
        },
        render: function(){
            if (!this.me) {
                this.me = {};
            }
            var me = this.me;
            return React.createElement("div",{
                "ref": function(r) { me.ref = r; }
            });
        }
    });

    var DayPilotNavigator = createReactClass({
        componentDidMount:function() {
            this.control = new DayPilot.Navigator(this.me.ref, this.props).init();
        },
        componentWillUnmount: function() {
            this.control && this.control.dispose();
        },
        componentDidUpdate: function(prevProps, prevState, snapshot) {
            this.control && this.control.update(this.props);
        },
        render: function(){
            if (!this.me) {
                this.me = {};
            }
            var me = this.me;
            return React.createElement("div",{
                "ref": function(r) { me.ref = r; }
            });
        }
    });

    var DayPilotQueue = createReactClass({
        getInitialState: function() {
            return {};
        },
        componentDidMount:function() {
            this.control = new DayPilot.Queue(this.me.ref, this.props);
            this.control.internal.enableReact(React, ReactDOM);
            this.control.init();
        },
        componentWillUnmount: function() {
            this.control && this.control.dispose();
        },
        componentDidUpdate: function(prevProps, prevState, snapshot) {
            this.control && this.control.update(this.props);
        },
        render: function(){
            if (!this.me) {
                this.me = {};
            }
            var me = this.me;
            return React.createElement("div",{
                "ref": function(r) { me.ref = r; }
            });
        }
    });


    module.exports = {
        DayPilot: DayPilot,
        DayPilotScheduler: DayPilotScheduler,
        DayPilotMonth: DayPilotMonth,
        DayPilotCalendar: DayPilotCalendar,
        DayPilotGantt: DayPilotGantt,
        DayPilotKanban: DayPilotKanban,
        DayPilotNavigator: DayPilotNavigator,
        DayPilotQueue: DayPilotQueue
    };
})();
