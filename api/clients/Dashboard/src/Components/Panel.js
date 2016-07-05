'use strict';

var React = require('react');
var Detail = React.createFactory(require('./Detail.js'));


/*

interface PanelProps{
    placeMap: Map ( id => Place ),
    day: string
}

*/

var Panel = React.createClass({

    getInitialState: function(){
        return {};
    },
    render: function() {
        //var self = this;
        var props = this.props;

        // console.log('PANEL props', props);

        var classes = '';

        var details = [];

        var closeButton = React.DOM.div({
            id: 'close-button',
            onClick: function(){
                document.getElementById('panel').classList.toggle('open');
            }}
        );

        if (props.placeMap){
            if (props.placeMap.size > 0){
                classes = 'open';
    
                details.push(React.DOM.span({id: 'span-select'}, 'Vous pouvez zoomer en sélectionnant une période sur le graphique (clic enfoncé), puis dézoomer avec un doublic-clic.'));
                props.placeMap.forEach(function (rc, index){
                    details.push(new Detail({
                        place: rc,
                        index: index,
                        day : props.day
                    }));
                });
            }
            else
            {
                details.push(React.DOM.span({id: 'span-select'}, 'Pour afficher les affluences en temps réel, vous pouvez sélectionner les sites sur la carte.'));
            }

        }
        
        return React.DOM.div({
                id: 'panel',
                className: classes
            },
            [
                React.DOM.h1({}, 'Affluence en temps réel'),
                closeButton,
                details
            ]
        );
    }
});

module.exports = Panel;
