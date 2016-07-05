'use strict';

var React = require('react');
var Dygraph = require('dygraphs');

/*
interface LineChart Props{
    measurements: [{id: 18, value: 18, date: '2015-07-09T12:45:53.629Z'}],
    day: string
}
interface LineChart State{
}
*/

// build empty values => enable empty chart
var defaultLabels = [];
var defaultObserved = [];

for (var i = 0; i < 20; i++){
    if (i % 3 === 0)
        defaultLabels.push(6 + Math.round(i/3));
    else
        defaultLabels.push('');

    defaultObserved.push(Math.random()*4);
}

var LineChart = React.createClass({
    componentDidMount: function(){
        this.update();
    },
    componentDidUpdate: function(){
        this.update();
    },

    update: function() {
        var props = this.props;
    
        var data = props.measurements.map(function(measurement){
            var date = new Date(measurement.date);
            return [date, measurement.value];
        });

        var beginDay;
        var endDay;

        if (props.day) {
            beginDay = new Date(props.day); // The day
            endDay = new Date(beginDay.getTime() + (1000 * 60 * 60 * 24 * 2)); // +48h
        } else {
            endDay = new Date(); // Now
            beginDay = new Date(endDay.getTime() - (1000 * 60 * 60 * 24 * 2)); // -48h
        }

        // this part is super awkward, not very React-y.
        var chart = new Dygraph(
            React.findDOMNode(this.refs['chart_'+this.props.index.toString()]),
            data,
            {
                labels: [ 'heure', 'mesure'],
                fillGraph: true,
                legend: 'onmouseover',
                strokeWidth: 2,
                dateWindow: [beginDay.getTime(), endDay.getTime()]
            }
        );
        //console.log(chart);
    },

	render: function(){
        return React.DOM.div({className: 'line-chart'},
            React.DOM.div({ref: 'chart_'+this.props.index.toString(), className: 'chart'})
        );
	}

});


module.exports = LineChart;
