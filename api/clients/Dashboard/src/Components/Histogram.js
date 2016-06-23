'use strict';

var React = require('react');

var CHART_DIV_REF = 'tsNumber';

module.exports = React.createClass({
    componentDidMount: function(){
        this.update();
    },
    componentDidUpdate: function(){
        this.update();
    },
    update: function () {
       
        var chart =  React.findDOMNode(this.refs[CHART_DIV_REF]);
        var measurements = this.props.measurements;

        var beginDay;
        var endDay;

        if (this.props.day) {
            beginDay = new Date(this.props.day); // The day
            endDay = new Date(beginDay.getTime() + (1000 * 60 * 60 * 24 * 2)); // +48h
        } else {
            endDay = new Date(); // Now
            beginDay = new Date(endDay.getTime() - (1000 * 60 * 60 * 24 * 2)); // -48h
        }
        beginDay = beginDay.toISOString().replace('T',' ').replace('Z','0').split(".")[0];
        endDay = endDay.toISOString().replace('T',' ').replace('Z','0').split(".")[0];

        var xR = [], yR = [];
        measurements
        .forEach(function(measure){

            // Date format for Plotly
            var strDate = measure.date.replace('T',' ').replace('Z','0').split(".")[0];

            xR.push(strDate);
            yR.push(measure.value);
        });

        var traceR = [{
            name: 'Realtime measurements',
            x: xR,
            y: yR,
            type: 'bar',
            marker: {
                color: 'rgb(158,202,225)',
                opacity: 0.6
            }
        }];
           
        Plotly.newPlot(chart, traceR, {
            xaxis:{
                type: 'date'
            },
            yaxis:{
                max: 100
            },
            layout: {
                xaxis: {range: [beginDay, endDay]}
            }
        });
    },
    render: function(){
        return React.DOM.div({ref: CHART_DIV_REF, className: 'chart'});
    }
});
