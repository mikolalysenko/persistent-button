'use strict'

var tape = require('tape')
var createButton = require('../buttonstream')

tape('persistent-button', function(t) {

  //Create a button
  var button = createButton()

  //Fill with events
  for(var i=0; i<4e4; ++i) {
    button.appendEvent(i, (i+1)&1)
  }

  t.ok(!button.down(-1))
  t.equals(button.toggleCount(-1), 0)

  t.ok(!button.down(1e6))
  t.equals(button.toggleCount(1e6), 4e4)

  t.equals(button.press(1e6), 2e4)
  t.equals(button.release(1e6), 2e4)

  t.equals(button.hold(1e6), 2e4)

  //Query times
  for(var i=0; i<4e4; ++i) {
    t.equals(button.down(i), !!((i+1)&1))
    t.equals(button.toggleCount(i), i+1)

    if(i & 1) {
      t.equals(button.hold(i+0.25), (i+1)>>>1)
    } else {
      t.equals(button.hold(i+0.25), (i>>>1) + 0.25)
    }
  }

  t.end()
})