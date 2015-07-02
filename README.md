# Paula.js
JavaScript emulation of the Amiga's Paula soundchip

v0.1

To add in future versions:

* Volume (everything is played at the maximum volume of 64)
* Audio Interrupts
* Interpolation

Not supported, but probably will not add:

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
  
