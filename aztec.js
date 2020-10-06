function aztec(setCell, text, sec, lay) { 
  var enc, eb, ec, el = text.length,
    b, typ = 0;
  var mod; 
  function push(val, bits) { 
    val <<= b;
    eb += bits || (mod == 4 ? 4 : 5);
    enc[enc.length - 1] |= val >> eb; 
    while (eb >= b) { 
      var i = enc[enc.length - 1] >> 1;
      if (typ == 0 && (i == 0 || 2 * i + 2 == 1 << b)) {
        enc[enc.length - 1] = 2 * i + (1 & i ^ 1); 
        eb++;
      }
      eb -= b;
      enc.push((val >> eb) & ((1 << b) - 1));
    }
  }

  function encode(text) {
    function modeOf(ch) {
      if (ch == 32) return mod << 5; 
      var k = [0, 14, 65, 26, 32, 52, 32, 48, 69, 47, 58, 82, 57, 64, 59, 64, 91, -63, 96, 123, -63];
      for (var i = 0; i < k.length; i += 3) 
        if (ch > k[i] && ch < k[i + 1]) break;
      if (i < k.length) return ch + k[i + 2]; 
      i = [64, 92, 94, 95, 96, 124, 126, 127, 91, 93, 123, 125].indexOf(ch);
      if (i < 0) return -1;
      return (i < 8 ? 20 + 64 : 27 + 96 - 8) + i; 
    }
    enc = [0];
    mod = eb = 0; 
    for (var i = 0; i < text.length; i++) { 
      var c = text.charCodeAt(i),
        c1 = 0,
        m;
      if (i < text.length - 1) c1 = text.charCodeAt(i + 1);
      if (c == 32) { 
        if (mod == 3) {
          push(31);
          mod = 0;
        }
        c = 1;
      } else if (mod == 4 && c == 44) c = 12; 
      else if (mod == 4 && c == 46) c = 13; 
      else if (((c == 44 || c == 46 || c == 58) && c1 == 32) || (c == 13 && c1 == 10)) {
        if (mod != 3) push(0);
        push(c == 46 ? 3 : c == 44 ? 4 : c == 58 ? 5 : 2, 5);
        i++;
        continue;
      } else {
        c = c == 13 && modeOf(c1) >> 5 == mod ? 97 : modeOf(c);
        if (c < 0) { // binary
          if (mod > 2) {
            push(mod == 3 ? 31 : 14);
            mod = 0;
          } // latch to upper
          push(31); // shift to binary
          for (var l = 0, j = 0; l + i < text.length; l++) // calc binary length
            if (modeOf(text.charCodeAt(l + i)) < 0) j = 0;
            else if (j++ > 5) break; // look for at least 5 consecutive non binary chars
          if (l > 31) { // length > 31
            push(0);
            push(l - 31, 11);
          } else push(l);
          while (l--) push(text.charCodeAt(i++) & 255, 8);
          i--;
          continue;
        }
        m = c >> 5; 
        if (m == 4 && mod == 2) {
          push(29);
          mod = 0;
        }
        if (m != 3 && mod == 3) {
          push(31);
          mod = 0;
        } 
        if (m != 4 && mod == 4) { 
          if ((m == 3 || m == 0) && modeOf(c1) > 129) {
            push((3 - m) * 5);
            push(c & 31, 5);
            continue; 
          }
          push(14);
          mod = 0; 
        }
        if (mod != m) { 
          if (m == 3) { 
            if (mod != 4 && modeOf(c1) >> 5 == 3) {
              if (mod != 2) push(29); 
              push(30); 
              mod = 3; 
            } else push(0);
          } else if (mod == 1 && m == 0) { 
            if (modeOf(c1) >> 5 == 1) push(28); 
            else {
              push(30);
              push(14, 4);
              mod = 0;
            } 
          } else { 
            push([29, 28, 29, 30, 30][m]);
            mod = m;
          }
        }
      }
      push(c & 31);
    }
    if (eb > 0) push((1 << (b - eb)) - 1, b - eb); 
    enc.pop();
  }
  
  var x, y, dx, dy, ctr, c, i, j, l;
  sec = 100 / (100 - Math.min(Math.max(sec || 25, 0), 90));
  for (j = i = 4;; i = b) { 
    j = Math.max(j, (Math.floor(el * sec) + 3) * i);
    b = j <= 240 ? 6 : j <= 1920 ? 8 : j <= 10208 ? 10 : 12; 
    if (lay) b = Math.max(b, lay < 3 ? 6 : lay < 9 ? 8 : lay < 23 ? 10 : 12); 
    if (i >= b) break;
    encode(text);
    el = enc.length;
  }
  if (el > 1660) return 0; 
  typ = j > 608 || el > 64 ? 14 : 11; 
  mod = parseInt(text); 
  if (mod >= 0 && mod < 256 && mod + "" == text && !lay) lay = 0; 
  else lay = Math.max(lay || 0, Math.min(32, (Math.ceil((Math.sqrt(j + typ * typ) - typ) / 4)))); 
  ec = Math.floor((8 * lay * (typ + 2 * lay)) / b) - el; 
  typ >>= 1;
  ctr = typ + 2 * lay;
  ctr += (ctr - 1) / 15 | 0; 

  
  function rs(ec, s, p) { 
    var rc = new Array(ec + 2),
      i, j, x, el = enc.length; 
    var lg = new Array(s + 1),
      ex = new Array(s); 
    for (j = 1, i = 0; i < s; i++) {
      ex[i] = j;
      lg[j] = i;
      j += j;
      if (j > s) j ^= p; 
    }
    for (rc[ec + 1] = i = 0; i <= ec; i++) {
      for (j = ec - i, rc[j] = 1; j++ < ec;)
        rc[j] = rc[j + 1] ^ ex[(lg[rc[j]] + i) % s];
      enc.push(0);
    }
    for (i = 0; i < el; i++) 
      for (j = 0, x = enc[el] ^ enc[i]; j++ < ec;)
        enc[el + j - 1] = enc[el + j] ^ (x ? ex[(lg[rc[j]] + lg[x]) % s] : 0);
  }

  for (y = 1 - typ; y < typ; y++) 
    for (x = 1 - typ; x < typ; x++)
      if ((Math.max(Math.abs(x), Math.abs(y)) & 1) == 0)
        setCell(ctr + x, ctr + y);
  setCell(ctr - typ, ctr - typ + 1);
  setCell(ctr - typ, ctr - typ); 
  setCell(ctr - typ + 1, ctr - typ);
  setCell(ctr + typ, ctr + typ - 1);
  setCell(ctr + typ, ctr - typ + 1);
  setCell(ctr + typ, ctr - typ);

  function move(dx, dy) { 
    do x += dx;
    while (typ == 7 && (x & 15) == 0);
    do y += dy;
    while (typ == 7 && (y & 15) == 0);
  }
  if (lay > 0) { // layout the message
    rs(ec, (1 << b) - 1, [67, 301, 1033, 4201][b / 2 - 3]); // error correction, generator polynomial
    enc.pop(); // remove 0-byte
    x = -typ;
    y = x - 1; // start of layer 1 at top left
    j = l = (3 * typ + 9) / 2; // length of inner side
    dx = 1;
    dy = 0; // direction right
    while ((c = enc.pop()) != undefined) // data in reversed order inside to outside
      for (i = b / 2; i-- > 0; c >>= 2) {
        if (c & 1) setCell(ctr + x, ctr + y); // odd bit
        move(dy, -dx); // move across
        if (c & 2) setCell(ctr + x, ctr + y); // even bit
        move(dx - dy, dx + dy); // move ahead
        if (j-- == 0) { // spiral turn
          move(dy, -dx); // move across
          j = dx;
          dx = -dy;
          dy = j; // rotate clockwise
          if (dx < 1) // move to next side
            for (j = 2; j--;) move(dx - dy, dx + dy);
          else l += 4; // full turn -> next layer
          j = l; // start new side
        }
      }
    if (typ == 7) // layout reference grid
      for (x = (15 - ctr) & -16; x <= ctr; x += 16)
        for (y = (1 - ctr) & -2; y <= ctr; y += 2)
          if (Math.abs(x) > typ || Math.abs(y) > typ) {
            setCell(ctr + x, ctr + y); // down
            if (y & 15) setCell(ctr + y, ctr + x); // across
          }
    mod = (lay - 1) * (typ * 992 - 4896) + el - 1; // 2/5 + 6/11 mode bits
  }
  /** process modes message compact/full */
  for (i = typ - 3; i-- > 0; mod >>= 4) enc[i] = mod & 15; // mode to 4 bit words
  rs((typ + 5) / 2, 15, 19); // add 5/6 words error correction
  b = (typ * 3 - 1) / 2; // 7/10 bits per side
  j = lay ? 0 : 10; // XOR Aztec rune data
  for (eb = i = 0; i < b; i++) push(j ^ enc[i], 4); // 8/16 words to 4 chunks
  for (i = 2 - typ, j = 1; i < typ - 1; i++, j += j) { // layout mode data
    if (typ == 7 && i == 0) i++; // skip reference grid
    if (enc[b] & j) setCell(ctr - i, ctr - typ); // top
    if (enc[b + 1] & j) setCell(ctr + typ, ctr - i); // right
    if (enc[b + 2] & j) setCell(ctr + i, ctr + typ); // bottom
    if (enc[b + 3] & j) setCell(ctr - typ, ctr + i); // left
  }
  return 2 * ctr + 1; // matrix size Aztec bar code
}

function toMatrix() { // callback function(x,y) to array matrix
	var mat = [], func = arguments[0];
	arguments[0] = function(x,y) { mat[y] = mat[y] || []; mat[y][x] = 1; }; // setCell of array
	func.apply(func,arguments);
	return mat;
}
function datamatrix(setCell,text,rect) {
	function toAscii(text) { // ASCII mode encoding
		var enc = [];
		for (var i = 0; i < text.length; i++) {
			var c = text.charCodeAt(i), c1 = 0;
			if (i+1 < text.length) c1 = text.charCodeAt(i+1);
			if (c >= 48 && c < 58 && c1 >= 48 && c1 < 58) { // 2 digits
				enc.push((c-48)*10+c1-48+130);
				i++;
			} else if (c > 127) { // extended char
				enc.push(235);
				enc.push((c-127)&255);
			} else enc.push(c+1); // char
		}
		return enc;
	}
	function toText(text, sft) { // C40, TEXT and X12 modes encoding, sft array defines char set
		var cc = 0, cw = 0, i, j, enc = [];
		function push(val) { // pack 3 chars in 2 codes
			cw = 40*cw+val;
			if (cc++ == 2) { // full, add code
				enc.push(++cw>>8);
				enc.push(cw&255);
				cc = cw = 0;
			}
		}
		enc.push(sft[0]); // start switch
		for (i = 0; i < text.length; i++) {
			if (cc == 0 && i == text.length-1) break // last char in ASCII is shorter
			var ch = text.charCodeAt(i);
			if (ch > 127 && enc[0] != 238) { // extended char
				push(1); push(30); ch -= 128; // hi bit in C40 & TEXT
			}
			for (j = 1; ch > sft[j]; j += 3); // select char set
			var s = sft[j+1]; // shift
			if (s == 8 || (s == 9 && cc == 0 && i == text.length-1))
				return [] // char not in set or padding fails
			if (s < 5 && cc == 2 && i == text.length-1) break; // last char in ASCII
			if (s < 5) push(s); // shift
			push(ch-sft[j+2]); // char offset
		}
		if (cc == 2 && enc[0] != 238) push(0); // add pad
		enc.push(254); // return to ASCII
		if (cc > 0 || i < text.length) enc = enc.concat(toAscii(text.substr(i-cc))); // last chars
		return enc;
	}
	function toEdifact(text) { // EDIFACT encoding
		var l = (text.length+1)&-4, cw = 0, ch, enc = [];
		if (l > 0) enc.push(240); // switch to Edifact
		for (var i = 0; i < l; i++) {
			if (i < l-1) { // encode char
				ch = text.charCodeAt(i);
				if (ch < 32 || ch > 94) return []; // not in set
			} else ch = 31; // return to ASCII
			cw = cw*64+(ch&63);
			if ((i&3) == 3) {
				enc.push(cw>>16); // 4 data in 3 words
				enc.push((cw>>8)&255);
				enc.push(cw&255);
				cw = 0;
			}
		};
		return l > text.length ? enc : enc.concat(toAscii(text.substr(l == 0 ? 0 : l-1))); // last chars
	}
	function toBase(text) {  // Base256 encoding
		var i = text.length, enc = [];
		enc.push(231); // switch to Base 256
		if (i > 250) enc.push((Math.floor(i/250)+37)&255); // length high byte (in 255 state algo)
		enc.push((i%250+(149*(enc.length+1))%255+1)&255); // length low byte (in 255 state algo)
		for (i = 0; i < text.length; i++)
			enc.push((text.charCodeAt(i)+(149*(enc.length+1))%255+1)&255); // data in 255 state algo
		return enc;
	}
	var enc = toAscii(text), el = enc.length; // encode text to ASCII
	var k = toText(text, [230, 31,0,0, 32,9,32-3, 47,1,33, 57,9,48-4,
			64,1,58-15, 90,9,65-14, 95,1,91-22, 127,2,96, 255,1,0]); // C40
	var l = k.length;
	if (l > 0 && l < el) { enc = k; el = l; } // take shorter encoding
	k = toText(text, [239, 31,0,0, 32,9,32-3, 47,1,33, 57,9,48-4, 64,1,58-15,
			90,2,64, 95,1,91-22, 122,9,97-14, 127,2,123-27, 255,1,0]); // TEXT
	l = k.length;
	if (l > 0 && l < el) { enc = k; el = l; }
	k = toText(text, [238, 12,8,0, 13,9,13, 31,8,0, 32,9,32-3, 41,8,0,
			42,9,42-1, 47,8,0, 57,9,48-4, 64,8,0, 90,9,65-14, 255,8,0]); // X12
	l = k.length;
	if (l > 0 && l < el) { enc = k; el = l; }
	k = toEdifact(text); l = k.length; // Edifact
	if (l > 0 && l < el) { enc = k; el = l; }
	k = toBase(text); l = k.length; // Base 256
	if (l > 0 && l < el) { enc = k; el = l; }

	var h,w, nc = 1,nr = 1, fw,fh; // symbol size, regions, region size
	var i, j = -1, c, r, s, b = 1; // compute symbol size
	if (rect && el < 50) { // rectangular symbol possible
		k = [16,7, 28,11, 24,14, 32,18, 32,24, 44,28]; // symbol width, checkwords
		do {
			w = k[++j]; // width w/o finder pattern
			h = 6+(j&12); // height
			l = w*h/8; // # of bytes in symbol
		} while (l-k[++j] < el); // data + check fit in symbol?
		if (w > 25) nc = 2; // column regions
	} else { // square symbol
		w = h = 6;
		i = 2; // size increment
		k = [5,7,10,12,14,18,20,24,28,36,42,48,56,68,84,
				112,144,192,224,272,336,408,496,620]; // RS checkwords
		do {
			if (++j == k.length) return [0,0]; // message too long for Datamatrix
			if (w > 11*i) i = 4+i&12; // advance increment
			w = h += i;
			l = (w*h)>>3;
		} while (l-k[j] < el);
		if (w > 27) nr = nc = 2*Math.floor(w/54)+2; // regions
		if (l > 255) b = 2*(l>>9)+2; // blocks
	}
	s = k[j]; // RS checkwords
	fw = w/nc; fh = h/nr; // region size

	if (el < l-s) enc[el++] = 129; // first padding
	while (el < l-s) // add more padding
		enc[el++] = (((149*el)%253)+130)%254;

	s /= b; // compute Reed Solomon error detection and correction
	var rs = new Array(70), rc = new Array(70); // reed/solomon code
	var lg = new Array(256), ex = new Array(255); // log/exp table for multiplication
	for (j = 1, i = 0; i < 255; i++) { // compute log/exp table of Galois field
		ex[i] = j; lg[j] = i;
		j += j; if (j > 255)  j ^= 301; // GF polynomial a^8+a^5+a^3+a^2+1 = 100101101b = 301
	}
	for (rs[s] = 0, i = 1; i <= s; i++)  // compute RS generator polynomial
		for (j = s-i, rs[j] = 1; j < s; j++)
			rs[j] = rs[j+1]^ex[(lg[rs[j]]+i)%255];
	for (c = 0; c < b; c++) { // compute RS correction data for each block
		for (i = 0; i <= s; i++) rc[i] = 0;
		for (i = c; i < el; i += b)
			for (j = 0, x = rc[0]^enc[i]; j < s; j++)
				rc[j] = rc[j+1]^(x ? ex[(lg[rs[j]]+lg[x])%255] : 0);
		for (i = 0; i < s; i++) // add interleaved correction data
			enc[el+c+i*b] = rc[i];
	}

	// layout perimeter finder pattern, 0/0 = upper left corner
	for (i = 0; i < h+2*nr; i += fh+2) // horizontal
		for (j = 0; j < w+2*nc; j++) {
			setCell(j, i+fh+1);
			if ((j&1) == 0) setCell(j, i);
		}
	for (i = 0; i < w+2*nc; i += fw+2)  // vertical
		for (j = 0; j < h; j++) {
 			setCell(i, j+(j/fh|0)*2+1);
			if ((j&1) == 1) setCell(i+fw+1, j+(j/fh|0)*2);
		}
	// layout data
	s = 2; c = 0; r = 4; // step,column,row of data position
	b = [0,0, -1,0, -2,0, 0,-1, -1,-1, -2,-1, -1,-2, -2,-2]; // nominal byte layout
	for (i = 0; i < l; r -= s, c += s) { // diagonal steps
		if (r == h-3 && c == -1) // corner A layout
			k = [w,6-h, w,5-h, w,4-h, w,3-h, w-1,3-h, 3,2, 2,2, 1,2];
		else if (r == h+1 && c == 1 && (w&7) == 0 && (h&7) == 6) // corner D layout
			k = [w-2,-h, w-3,-h, w-4,-h, w-2,-1-h, w-3,-1-h, w-4,-1-h, w-2,-2, -1,-2];
		else {
			if (r == 0 && c == w-2 && (w&3)) continue; // corner B: omit upper left
			if (r < 0 || c >= w || r >= h || c < 0) {  // outside
				s = -s;	r += 2+s/2;	c += 2-s/2;        // turn around
				while (r < 0 || c >= w || r >= h || c < 0) { r -= s; c += s; }
			}
			if (r == h-2 && c == 0 && (w&3)) // corner B layout
				k = [w-1,3-h, w-1,2-h, w-2,2-h, w-3,2-h, w-4,2-h, 0,1, 0,0, 0,-1];
			else if (r == h-2 && c == 0 && (w&7) == 4) // corner C layout
				k = [w-1,5-h, w-1,4-h, w-1,3-h, w-1,2-h, w-2,2-h, 0,1, 0,0, 0,-1];
			else if (r == 1 && c == w-1 && (w&7) == 0 && (h&7) == 6) continue; // omit corner D
			else k = b; // nominal L-shape layout
		}
		for (el = enc[i++], j = 0; el > 0; j += 2, el >>= 1) { // layout each bit
			if (el&1) {
				var x = c+k[j], y = r+k[j+1];
				if (x < 0) { x += w; y += 4-((w+4)&7); } // wrap around
				if (y < 0) { y += h; x += 4-((h+4)&7); }
				setCell(x+2*(x/fw|0)+1,y+2*(y/fh|0)+1); // add region gap
			}
		}
	}
	for (i = w; i&3; i--) setCell(i,i); // unfilled corner
	return [w+2*nc,h+2*nr]; // width and height of symbol
}
