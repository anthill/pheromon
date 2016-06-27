'use strict';

var React = require('react');

module.exports = React.createClass({
    componentDidMount: function(){
        this.update();
    },
    componentDidUpdate: function(){
        this.update();
    },
    update: function () {
       
        if(!this.props.measurements) return;

        var chart =  React.findDOMNode(this.refs['chart_'+this.props.index.toString()]);
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
        // beginDay = beginDay.toISOString().replace('T',' ').replace('Z','0').split(".")[0];
        // endDay = endDay.toISOString().replace('T',' ').replace('Z','0').split(".")[0];
        // console.log(beginDay,endDay);

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
            z: yR,
            type: 'bar',
            // histfunc: 'count',
            // showscale: true,
            // zmax: 300,
            bargap: 0.15,
            marker: {
                // autocolorscale: false
                // opacity: 1,
                color: 'rgb(44, 160, 101)',
                size: 10,
                line: {
                    color: 'rgb(44, 160, 101)',
                    width: 10,
                }
            }
        }];

        Plotly.newPlot(chart, traceR, {
            xaxis:{
                type: 'date',
                range: [beginDay.valueOf(), endDay.valueOf()],
                showgrid: false
            },
            yaxis:{
                max: 100,
                showgrid: false
            },
            margin: { t: 0, b: 30, l: 30, r: 10} ,
            paper_bgcolor: 'rgba(255, 255, 255, 0)',
            plot_bgcolor: 'rgba(255, 255, 255, 0)',
        }, {displaylogo: false});
    },
    render: function(){
        return React.DOM.div({ref: 'chart_'+this.props.index.toString(), className: 'chart'});
    }
});
