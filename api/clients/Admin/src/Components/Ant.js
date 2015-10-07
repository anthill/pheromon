'use strict';

var React = require('react');
var Modifiable = React.createFactory(require('./Modifiable.js'));

var moment = require('moment');

/*

interface AntProps{
    ant: {
        create_at : string,
        id: int,
        installed_at: int,
        isUpdating: boolean,
        latest_input: string,
        latest_output: string,
        name: string,
        sim: string,
        quipu_status: string,
        signal: string,
        wifi_status: string,
        blue_status: string,
        updated_at: string,
        isSelected: bool
    },
    isSelected: boolean,
    isUpdating: boolean,
    currentPlaceId: int,
    onChangeSensor: function(),
    onSelectedAnts: function()
}
interface AntState{
    isListOpen: boolean
}

*/

var Ant = React.createClass({
    displayName: 'Ant',

    getInitialState: function(){
        return {
            isOpen: false
        };
    },

    toggleList: function(){
        this.setState(Object.assign(this.state, {
            isListOpen: !this.state.isListOpen
        }));
    },

    render: function() {
        var props = this.props;

        // console.log('ANT props', props);
        // console.log('ANT state', state);

        var classes = [
            'ant',
            props.ant.quipu_status ? props.ant.quipu_status.toLowerCase() : '',
            props.ant.wifi_status ? props.ant.wifi_status.toLowerCase() : '',
            props.isSelected ? 'selected' : '',
            props.ant.isUpdating ? 'updating' : ''
        ];

        return React.DOM.div({className: classes.join(' ')},
            React.DOM.input({
                className: 'ant-selector',
                onClick: function(){
                    props.onSelectedAnts(props.ant.id);
                },
                type: 'checkbox',
                checked: props.isSelected
            }),
            React.DOM.ul({},
                React.DOM.li({className: 'light'}, 
                    React.DOM.div({},
                        React.DOM.div({}, 'Name'),
                        new Modifiable({
                            className: 'sensorName',
                            isUpdating: false,
                            text: props.ant.name,
                            dbLink: {
                                sim: props.ant.sim,
                                field: 'name'
                            },
                            onChange: props.onChangeSensor
                        })
                    ),
                    React.DOM.div({},
                        React.DOM.div({}, 'Sim'),
                        new Modifiable({
                            className: 'sim',
                            isUpdating: false,
                            text: props.ant.sim,
                            dbLink: {
                                sim: props.ant.sim,
                                field: 'sim'
                            },
                            onChange: props.onChangeSensor
                        })
                    )
                ),
                React.DOM.li({className: 'quipu dark'},
                    React.DOM.div({},
                        React.DOM.div({}, 'Quipu Status'),
                        React.DOM.div({}, props.ant.quipu_status)
                    )
                ),
                React.DOM.li({className: 'sense light'},
                    React.DOM.div({},
                        React.DOM.div({}, 'Wifi'),
                        React.DOM.div({className: 'status'},
                            React.DOM.div({}, 'Status: '),
                            React.DOM.div({}, props.ant.wifi_status)
                        ),
                        React.DOM.div({className: 'settings'},
                            React.DOM.div({}, 'Settings: '),
                            React.DOM.div({}, props.ant.period ? props.ant.period : 'ND'),
                            React.DOM.div({}, props.ant.start_hour ? props.ant.start_hour : 'ND'),
                            React.DOM.div({}, props.ant.stop_hour ? props.ant.stop_hour : 'ND')
                        )
                    )
                ),
                React.DOM.li({className: 'command dark'},
                    React.DOM.div({},
                        React.DOM.div({}, 'Last Command'),
                        React.DOM.div({}, props.ant.latest_input),
                        React.DOM.div({}, props.ant.latest_output)
                    )
                ),
                React.DOM.li({className: 'low-importance light'}, 
                    React.DOM.div({},
                        React.DOM.div({}, 'Last Data'),
                        React.DOM.div({}, moment(props.ant.lastMeasurementDate).fromNow())
                    ),
                    React.DOM.div({},
                        React.DOM.div({}, 'Updated'),
                        React.DOM.div({}, moment(props.ant.updated_at).fromNow())
                    )
                )
            ),
            React.DOM.div({
                    className: 'uninstall clickable',
                    onClick: function(){
                        console.log('Uninstalling');
                        var dbData = {
                            'field': 'installed_at',
                            'sim': props.ant.sim,
                            'value': null
                        };
                        props.onChangeSensor([dbData]);
                    }
                },
                'Uninstall'
            )
        );
    }
});

module.exports = Ant;
