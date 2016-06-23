'use strict';

var React = require('react');
// var LineChart = React.createFactory(require('./LineChart.js'));
var Histogram = React.createFactory(require('./Histogram.js'));

/*
interface DetailProps{
    place: Place,
    day: string
}
*/

var Detail = React.createClass({

    getInitialState: function(){
        return {};
    },

    render: function() {
        //var self = this;
        var props = this.props;

        return React.DOM.div({id: 'detail'}, 
            React.DOM.h2({}, props.place.name),
            new Histogram({ measurements: props.place.measurements, day: props.day })
        );
    }

});

module.exports = Detail;
