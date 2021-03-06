# Paula.js
JavaScript emulation of the Amiga's Paula soundchip

v1.1.0

Added support for callbacks triggered by the CIA timer. This doesn't properly emulate the CIA
chips, but it provides a simple way to trigger code at arbitrary intervals. This is useful for
implementing things like CIA-timed mod replays.

To use it, provide the ciaTimerCallBack (your code to be executed when the "interrupt" fires),
and set CIATA to the desired CIA delay value.

v1.0

Added volume and linear interpolation.
I consider this version feature complete now, probably won't be adding much new features. 
Maybe some better form of interpolation like BLEPs if I get around to it.

Not supported, and probably never will be:

* Channel attach mode (volume and period modulation - probably won't be adding this)

Demo:

Open index.html for a crummy demo. It's a broken ProTracker replay routine (no support for tempo or any effect commands). Load a .mod file and hear it destroyed :)

How to use it yourself:

* Include paula.js on your page

  <script src="paula.js"></script>

* Create a ArrayBuffer to hold your chip-RAM data:
  
  var RAM = new ArrayBuffer(CHIP_RAM_SIZE);

* Initialize audio playback through the Web Audio API

  var context = new AudioContext();
  var paulaNode = context.createScriptProcessor(BUFFER_SIZE,0,1);
  var paula = new Paula(context.sampleRate,RAM);
  
  paulaNode.onaudioprocess = function(e) {
	  var output = e.outputBuffer.getChannelData(0);
		for (var i=0; i<BUFFER_SIZE; i++) {
			output[i] = paula.getNextSample();
		}
	}

	paulaNode.connect(context.destination);
	
* There's a VBlank interrupt hook. If you need to trigger something every VBlank, you can do something like:

  paula.vBlankCallBack = new function() {
    // your vblank code
  }
  
* To use the CIA interrupt hook do something like this instead:

  paula.ciaTimerCallBack = new function() {
    // your cia code here
  }
  paula.CIATA = 12345; // the CIA timer delay

* There's also an audio interrupt hook. To use it:

  paula.audioInterruptCallBack = new function(channel) {
    // your audio interrupt code
    // where channel is an instance of PaulaChannel representing 
    // the audio channel which triggered the interrupt
  }