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

function Paula(sampleRate, RAM, vBlankCallBack) {

	this.NUM_CHANNELS = 4;
	this.FPS = 50;

	this.vBlankCallBack = vBlankCallBack || function() {};

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
	}

	for (i=0;i<this.NUM_CHANNELS;i++) {
		if (this.channel[i].EN) {

			if (!this.channel[i].exEnable) {
				latch(this.channel[i]);
				this.channel[i].exEnable = true;
			}

			this.channel[i].offset += this.clockAdvance / this.channel[i].PER;
			if (Math.floor(this.channel[i].offset) >= this.channel[i].length) {
				latch(this.channel[i]);
			}		
			output += this.RAM.getInt8(this.channel[i].start+Math.floor(this.channel[i].offset));
			// TODO: add volume support!
		}
		else {
			this.channel[i].exEnable = false;
		}
	}

	return output / 512;

}