'use strict';

var React = require('react');

/*

interface AntPickerProps{
    antFromNameMap: Map(name -> antID),
    currentSensorId: int,
    currentPlaceId, int,
    onChangeSensor: function()
}
interface AntPickerState{
}

*/

var AntPicker = React.createClass({
    displayName: 'AntPicker',

    render: function() {
        // var self = this;
        var props = this.props;
        // var state = this.state;

        // console.log('AntPicker props', props);
        // console.log('AntPicker state', state);

        var lis = [];
        props.antFromNameMap.forEach(function (antSim, antName) {
            var objDb = [{
                'field': 'installed_at',
                'sim': antSim,
                'value': props.currentPlaceId
            }];

            lis.push(React.DOM.li({
                    key: antSim,
                    className: 'clickable',
                    onClick: function(){
                        props.onChange(objDb);
                    }
                }, antName
            ));
        });

        return React.DOM.div({className: 'ant-picker selector'},
            lis
        );
    }
});

module.exports = AntPicker;
