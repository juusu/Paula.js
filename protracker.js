function ProTracker(paula,buffer) {
	this.counter = 0;
	this.speed = 6;
	this.songPos = 0;
	this.patternPos = 0;

	this.SONG_LENGTH_OFFSET = 950;
	this.SONG_POS_OFFSET = 952;
	this.PATTERN_DATA_OFFSET = 1084
	this.PATTERN_DATA_OFFSET_L = this.PATTERN_DATA_OFFSET / 4;
	this.SAMPLE_INFO_OFFSET = 20;

	this.paula = paula;

	this.sampleStart = [];

	this.buffer = buffer;

	this.RAM = new DataView(buffer);

	//this.RAM_B = new Uint8Array(this.buffer,0,this.buffer.byteLength);
	//this.RAM_W = new Uint16Array(this.buffer,0,this.buffer.byteLength/2);			
	//this.RAM_L = new Uint32Array(this.buffer,0,this.buffer.byteLength/4);
}

ProTracker.prototype.mt_init = function() {
	
	var lastPattern = 0;

	for (i=0;i<128;i++) {
		var currentPattern = this.RAM.getUint8(this.SONG_POS_OFFSET + i);
		if (currentPattern > lastPattern) lastPattern = currentPattern;
	}

	var currentSampleStart = this.PATTERN_DATA_OFFSET + (lastPattern + 1) * 1024;

	for (i=0;i<31;i++) {
		this.sampleStart.push(currentSampleStart);
		currentSampleStart += this.RAM.getUint16(this.SAMPLE_INFO_OFFSET+i*30+22) * 2;
	}

}

ProTracker.prototype.mt_music = function() {

	// new row?
	if (this.counter==0) {
		for (i=0;i<this.paula.NUM_CHANNELS;i++) {
			var currentPattern = this.RAM.getUint8(this.SONG_POS_OFFSET + this.songPos);
			var currentNote = this.RAM.getUint32(this.PATTERN_DATA_OFFSET + currentPattern * 1024 + this.patternPos * 16 + i * 4);
			var sampleNumber = (currentNote & 0xf0000000) >>> 24 | (currentNote & 0x0000f000) >> 12;
			var period = (currentNote & 0x0fff0000) >>> 16;

			// set registers
			if (sampleNumber>0) {

				this.paula.channel[i].EN = false;

				var volume = this.RAM.getUint8(this.SAMPLE_INFO_OFFSET+(sampleNumber-1)*30+25);
				var length = this.RAM.getUint16(this.SAMPLE_INFO_OFFSET+(sampleNumber-1)*30+22);
				var repeat = this.RAM.getUint16(this.SAMPLE_INFO_OFFSET+(sampleNumber-1)*30+26);
				var repLen = this.RAM.getUint16(this.SAMPLE_INFO_OFFSET+(sampleNumber-1)*30+28);

				this.paula.channel[i].LCH = (this.sampleStart[sampleNumber-1] & 0xffff0000) >> 16;
				this.paula.channel[i].LCL = this.sampleStart[sampleNumber-1] & 0x0000ffff;
				this.paula.channel[i].VOL = volume;

				if (repeat == 0) {
					this.paula.channel[i].LEN = length;	
				}
				else {
					this.paula.channel[i].LEN = repeat+repLen;
				}

				this.paula.channel[i].EN = true;

				//wait DMA and set registers for loop
				setTimeout(
					function(channel, start, length) {
						return function() {

							channel.LCH = (start & 0xffff0000) >> 16;
							channel.LCL = start & 0x0000ffff;		
							channel.LEN = length;

						};
					} (this.paula.channel[i] ,this.sampleStart[sampleNumber-1] + repeat*2, repLen), 1
				);
			}

			if (period > 0) {
				this.paula.channel[i].PER = period;
			}
		}
	}

	this.counter++;

	if (this.counter>this.speed) {
		this.counter = 0;
		this.patternPos++;
		if (this.patternPos>63) {
			this.patternPos = 0;
			this.songPos++;
			if (this.songPos > this.RAM.getUint8(this.SONG_LENGTH_OFFSET)) {
				this.songPos=0;
			}
		}
	}

}