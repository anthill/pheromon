'use strict';

var React = require('react');

/*

interface SelectorProps{
    onCreateSensor: function()
}
interface SelectorState{

}


*/

var CreatorSensor = React.createClass({
    displayName: 'CreatorSensor',
    
    componentDidMount: function(){
        var button = React.findDOMNode(this.refs.openButton);
        button.addEventListener('click', this.toggleOpen);
    },

    componentWillUnmount: function(){
        var button = React.findDOMNode(this.refs.openButton);
        button.addEventListener('click', this.toggleOpen);
    },

    toggleOpen: function(){
        var panel = React.findDOMNode(this);
        panel.classList.toggle('open');
    },

    clearInputs: function(){
        var nameInput = React.findDOMNode(this.refs.myNameInput);
        var simInput = React.findDOMNode(this.refs.mySimInput);
        var submitInput = React.findDOMNode(this.refs.mySubmitInput);
        
        nameInput.blur();
        simInput.blur();
        submitInput.blur();
        nameInput.value = ''; 
        simInput.value = '';
    },

    render: function() {
        var self = this;
        var props = this.props;
        // var state = this.state;

        // console.log('CreatorSensor props', props);
        // console.log('CreatorSensor state', state);

        return React.DOM.div({className: 'creator'},
            // React.DOM.div({}, 'New sensor'),
            React.DOM.form({
                onSubmit: function(e){
                    e.preventDefault();

                    console.log('Creating Sensor');

                    props.onCreateSensor({
                        'name': e.target.sensorName.value,
                        'sim': e.target.sim.value
                    });

                    self.clearInputs();
                    self.toggleOpen();
                }
            },
                React.DOM.input({
                    type: 'text',
                    ref: 'myNameInput',
                    name: 'sensorName',
                    placeholder: 'Name'//,
                }),
                React.DOM.input({
                    type: 'text',
                    ref: 'mySimInput',
                    name: 'sim',
                    placeholder: 'sim'
                }),
                React.DOM.input({
                    type: 'submit',
                    ref: 'mySubmitInput',
                    name: 'submit',
                    value: 'Add'
                })
            ),
            React.DOM.div({
                    ref: 'openButton',
                    className: 'clickable'
                },  
                'New sensor'
            )
        );
    }
});

module.exports = CreatorSensor;
