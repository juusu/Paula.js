var BUFFER_SIZE = 4096;

function PaulaChannel() {

	this.EN = false;
	this.LCH = 0;
	this.LCL = 0;
	this.LEN = 0;
	this.PER = 0;
	this.VOL = 0;

	this.offset = 0;
	this.exEnable = false;
	this.start = 0;
	this.length = 0;
}

function Paula(sampleRate, RAM, vBlankCallBack, audioInterruptCallBack) {

	this.NUM_CHANNELS = 4;
	this.FPS = 50;

	this.vBlankCallBack = vBlankCallBack || function() {};
	this.audioInterruptCallBack = audioInterruptCallBack || function(channel) {};

	this.sampleRate = sampleRate || 44100;
	this.clock = 3546895; // PAL; NTSC = 3579545

	this.clockAdvance = this.clock / this.sampleRate;

	this.frameCount = 0;

	this.frameAdvance = this.clockAdvance * this.FPS / this.clock;

	this.channel = [];

	this.RAM = new DataView(RAM);

	for (i=0;i<this.NUM_CHANNELS;i++) {
		this.channel.push(new PaulaChannel());
	}

}

Paula.prototype.getNextSample = function() {

	var output = 0;

	if (Math.floor(this.frameCount+this.frameAdvance) > this.frameCount) {
		this.framecount--;
		this.vBlankCallBack();
	}

	this.frameCount+=this.frameAdvance;

	var latch = function(channel) {
		channel.start = channel.LCH<<16|channel.LCL;
		channel.length = channel.LEN*2;
		channel.offset = 0;	
		paula.audioInterruptCallBack(channel);
	}.bind(this);

	for (i=0;i<this.NUM_CHANNELS;i++) {
		if (this.channel[i].EN) {

			if (!this.channel[i].exEnable) {
				latch(this.channel[i]);
				this.channel[i].exEnable = true;
			}

			this.channel[i].offset += this.clockAdvance / this.channel[i].PER;
      		
      		var intOffset = Math.floor(this.channel[i].offset);
      
			if (intOffset >= this.channel[i].length) {
				latch(this.channel[i]);
			}			
			
			var delta = this.channel[i].offset - intOffset;
      		var thisSample = this.RAM.getInt8(this.channel[i].start+intOffset);
      		var nextSample = ((intOffset + 1) < this.channel[i].length) ? this.RAM.getInt8(this.channel[i].start+intOffset+1) : this.RAM.getInt8(this.channel[i].start);
      		output += this.channel[i].VOL * (thisSample + delta * (nextSample - thisSample)); // linear interpolation

		}
		else {
			this.channel[i].exEnable = false;
		}
	}

	return output / 32768;

}