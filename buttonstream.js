'use strict'

var bsearch     = require('binary-search-bounds')
module.exports  = createButtonStream

//Must be even
var BLOCK_SIZE = 1024

function compareBlock(block, t) {
  return block.events[0] - t
}

function compareNumber(a, b) {
  return a - b
}

function RopeBlock(hold, events) {
  this.hold   = hold
  this.events = events
}

function ButtonStream(rope, headHold, headCount, headEvents) {
  this._rope       = rope

  //Store head lazily, only initialize if necessary
  this._headHold   = headHold
  this._headCount  = headCount
  this._headEvents = headEvents

  //The number of events in the data structure
  this.length      = 0
}

var proto = ButtonStream.prototype

//Returns the time of the ith event
proto.event = function(i) {
  var blockIndex = (i / BLOCK_SIZE) | 0
  var rope       = this._rope
  var ropeLength = ropeLength
  if(i >= ropeLength) {
    return this._headEvents[i % BLOCK_SIZE]
  }
  return rope[blockIndex].events[i % BLOCK_SIZE]
}

//Save history of button into an array for serialization/playback
proto.serialize = function() {
  if(!this._headEvents) {
    return []
  }

  var rope       = this._rope
  var ropeLength = rope.length
  var headCount  = this._headCount

  //Copy rope into buffer
  var result = new Array(this.length)
  var ptr = 0
  for(var i=0; i<ropeLength; ++i) {
    var events = rope[i].events
    for(var j=0; j<BLOCK_SIZE; ++j) {
      result[ptr++] = events[j]
    }
  }

  //Copy head
  var headEvents = this._headEvents
  for(var i=0; i<hcount; ++i) {
    result[ptr++] = headEvents[i]
  }

  return result
}

//Restores saved history
proto.deserialize = function(state) {
  if(!state || state.length === 0) {
    this._rope        = []
    this._headHold    = 0.0
    this._headCount   = 0
    this._headEvents  = null
    return
  }
  var numBlocks = (state.length / BLOCK_SIZE)|0
  var rope      = new Array(numBlocks)
  var ptr       = 0
  for(var i=0; i<numBlocks; ++i) {

  }
}

//Append an event to the buffer
proto.appendEvent = function(t, state) {

  //Special case:  Handle situation where rope is empty
  if(!this._headEvents) {

    //If setting button to off, ignore it
    if(!state) {
      return
    }

    //First time button pressed, create new block
    this._headEvents    = new Float64Array(BLOCK_SIZE)
    this._headCount     = 1
    this._headEvents[0] = t
    this.length         = 1
    return
  }

  var headCount   = this._headCount
  var headEvents  = this._headEvents
  
  //Setting a button to existing state is idempotent
  if(!!state === !!(headCount&1)) {
    return
  }

  //t must be strictly increasing
  if(t <= headEvents[headCount-1]) {
    return
  }

  //If the head is full, then we need to create a new block
  if(headCount === BLOCK_SIZE) {

    //Sum up the values within the block
    var sum = 0.0
    for(var i=0; i<BLOCK_SIZE; i+=2) {
       sum += headEvents[i+1] - headEvents[i]
    }

    //Append new rope block
    this._rope.push(new RopeBlock(
      this._headHold, 
      new Float64Array(headEvents)))

    //Clear head count, increment counter
    this._headHold += sum
    this._headCount = 0
  }

  //Append event
  headEvents[this._headCount++] = t
  this.length += 1
}

//Count number of state changes up to time t
proto.toggleCount = function(t) {
  var headEvents = this._headEvents
  if(!headEvents) {
    return 0
  }

  var headCount   = this._headCount
  var rope        = this._rope
  
  //Early out case: Read head of array
  if(headEvents[headCount-1] <= t) {
    return rope.length*BLOCK_SIZE + headCount
  }

  //Early out case: t is within head
  if(headEvents[0] <= t) {
    var index = bsearch.le(headEvents, t, compareNumber, 0, headCount)
    return rope.length*BLOCK_SIZE + index + 1
  }

  //General case: need to search rope
  var blockIndex  = bsearch.le(rope, t, compareBlock)

  //If out of bounds, then terminate
  if(blockIndex < 0) {
    return 0
  }

  //Otherwise, state = parity of index
  var block  = rope[blockIndex]
  var index  = bsearch.le(block.events, t, compareNumber)
  return blockIndex*BLOCK_SIZE + index + 1
}

//Test if button is down at time t
proto.down = function(t) {
  return !!(this.toggleCount(t) & 1)
}

//Returns number of times pressed up to time t
proto.press = function(t) {
  var count = this.toggleCount(t)
  return (count >>> 1) + (count & 1)
}

//Count number of times button has been released
proto.release = function(t) {
  return this.toggleCount(t) >>> 1
}

function blockSum(block, t, count) {
  var sum = 0.0
  var i
  for(i=0; i+1<count; i+=2) {
    var a = block[i+1]
    if(t < a) {
      break
    }
    var b = block[i]
    if(t < b) {
      break
    }
    sum += a - b
  }
  if(i < count) {
    if(block[i] < t) {
      sum += t - block[i]
    }
  }
  return sum
}

//Returns the amount of time the button was in the "on" state
proto.hold = function(t) {
  var headEvents = this._headEvents
  if(!headEvents) {
    return 0.0
  }

  //Special case: check if t is within head
  if(headEvents[0] <= t) {
    return this._headHold + blockSum(headEvents, t, this._headCount)
  }

  //General case: t is within a block
  var rope       = this._rope
  var blockIndex = bsearch.le(rope, t, compareBlock)

  //If t is before any events, then return 0
  if(blockIndex < 0) {
    return 0.0
  }

  //Otherwise sum within block
  var block = rope[blockIndex]
  return blockSum(block.events, t, BLOCK_SIZE) + block.hold
}

function createButtonStream(history) {
  var result = new ButtonStream([], 0.0, 0, null)
  if(history) {
    result.deserialize(history)
  }
  return result
}