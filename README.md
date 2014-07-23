persistent-button
=================
A persistent data structure for storing the history of a toggleable (binary) button.  Events in the history are points where the button's state toggles from on to off and vice versa.  This data structure supports efficient queries for the amount of time a button is held and how frequently/or whether it is pressed at any point in history.

## Example

```javascript
//Create a button
var createButton = require('persistent-button')
var button = createButton()

//Press button at time t=0.5
button.appendEvent(0.5, true)

//Release button at time t=1
button.appendEvent(1, false)

//Press button again at time t=2
button.appendEvent(2, true)

//Test the button state at different points in history
console.log(button.down(0.75)) //Prints out: true
console.log(button.down(1.5))  //Prints out: false

//Find how many time the button was pressed up to t=3
console.log(button.press(3))  //Prints out: 2

//Print out how long the button was held from beginning of time to t=2.5
console.log(button.hold(2.5)) //Prints out: 1
```

## Install

```
npm install persistent-button
```

## API

```javascript
var createButton = require('persistent-button')
```

### Constructor

#### `var button = createButton([history])`
Creates a persistent button

* `history` is an optional history of the button (as created by button.serialize)

**Returns** A new persistent button object

### Methods

#### `button.appendEvent(t, state)`
Adds an event to the button's history

* `t` is the time of the event
* `state` is the new state of the button (must be either `true` or `false`)

#### `button.length`
The number of events in the history of the button

#### `button.event(i)`
Gives the time of the `i`th event

* `i` is the index of the event which is being queries

**Returns** The time associated to the `i`th event

#### `button.toggleCount(t)`
Counts the number of times the button has been toggled from the beginning of time up to time `t`

* `t` is the time which is being queried

**Returns** The number of times the button has been toggled

#### `button.down(t)`
Tests if the button is down at time `t`

* `t` is the time to query

**Returns** `true` if the button was held down at time `t`, otherwise `false`

#### `button.press(t)`
Counts the number of time the button has been pressed since the beginning of time.

* `t` is the query time

**Returns** The number of times the button has been pressed since the beginning of time and ending at time `t`

#### `button.release(t)`
Counts the number of times the button has been released since the beginning of time.

* `t` is the query time

**Returns** The number of times the button has been released since the beginning of time

#### `button.hold(t)`
Gives the number of time units that the button has been held since the beginning of time

* `t` is the query time

**Returns** How long the button has been held up to time `t`

#### `button.serialize()`
Saves the state of the button to an array for serialization.

**Returns** An array of times representing the points in history where the button state toggled

#### `button.deserialize(history)`
Restores the state of the button from an array of toggle events labeled by time.

* `history` is an array of toggle events

## Credits
(c) 2014 Mikola Lysenko. MIT License