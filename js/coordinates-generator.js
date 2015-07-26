var X = XLSX;
var XW = {
	/* worker message */
	msg: 'xlsx',
	/* worker scripts */
	rABS: 'js/js-xlsx/xlsxworker2.js',
	norABS: 'js/js-xlsx/xlsxworker1.js',
	noxfer: 'js/js-xlsx/xlsxworker.js'
};

var rABS = typeof FileReader !== "undefined" && typeof FileReader.prototype !== "undefined" && typeof FileReader.prototype.readAsBinaryString !== "undefined";
if(!rABS) {
	document.getElementsByName("userabs")[0].disabled = true;
	document.getElementsByName("userabs")[0].checked = false;
}

// Workers can't be used when running the html locally on Chrome browser.
//var use_worker = typeof Worker !== 'undefined';
var use_worker = false;
if(!use_worker) {
	document.getElementsByName("useworker")[0].disabled = true;
	document.getElementsByName("useworker")[0].checked = false;
}

var transferable = use_worker;
if(!transferable) {
	document.getElementsByName("xferable")[0].disabled = true;
	document.getElementsByName("xferable")[0].checked = false;
}

var wtf_mode = false;

function fixdata(data) {
	var o = "", l = 0, w = 10240;
	for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
	o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(l*w)));
	return o;
}

function ab2str(data) {
	var o = "", l = 0, w = 10240;
	for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint16Array(data.slice(l*w,l*w+w)));
	o+=String.fromCharCode.apply(null, new Uint16Array(data.slice(l*w)));
	return o;
}

function s2ab(s) {
	var b = new ArrayBuffer(s.length*2), v = new Uint16Array(b);
	for (var i=0; i != s.length; ++i) v[i] = s.charCodeAt(i);
	return [v, b];
}

function xw_noxfer(data, cb) {
	var worker = new Worker(XW.noxfer);
	worker.onmessage = function(e) {
		switch(e.data.t) {
			case 'ready': break;
			case 'e': console.error(e.data.d); break;
			case XW.msg: cb(JSON.parse(e.data.d)); break;
		}
	};
	var arr = rABS ? data : btoa(fixdata(data));
	worker.postMessage({d:arr,b:rABS});
}

function xw_xfer(data, cb) {
	var worker = new Worker(rABS ? XW.rABS : XW.norABS);
	worker.onmessage = function(e) {
		switch(e.data.t) {
			case 'ready': break;
			case 'e': console.error(e.data.d); break;
			default: xx=ab2str(e.data).replace(/\n/g,"\\n").replace(/\r/g,"\\r"); cb(JSON.parse(xx)); break;
		}
	};
	if(rABS) {
		var val = s2ab(data);
		worker.postMessage(val[1], [val[1]]);
	} else {
		worker.postMessage(data, [data]);
	}
}

function xw(data, cb) {
	transferable = document.getElementsByName("xferable")[0].checked;
	if(transferable) xw_xfer(data, cb);
	else xw_noxfer(data, cb);
}

function get_radio_value( radioName ) {
	var radios = document.getElementsByName( radioName );
	for( var i = 0; i < radios.length; i++ ) {
		if( radios[i].checked || radios.length === 1 ) {
			return radios[i].value;
		}
	}
}

function reset(){
	// Reset text areas containing javascript preview and warnings.
	warnings.value = "";
	out.value="";

	// Reset preview panel
	$('#preview').hide();
	$('#preview-container').empty();
	$('#pager').empty();
}

function to_json(workbook, warnings_callback) {
    // export the content of the first worksheet to JSON
	var result = X.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]], {'raw':true});
    result.forEach(function(entry) {
    	// check if the image filename is correctly referenced in img/photos directory.
		var img = new Image();
		img.src = "img/photos/"+entry.image;
		img.onerror = function(){warnings_callback("Image '" + entry.image + "' could not be found in img/photos/ directory");}

        entry.lat = Number(entry.lat);
        if (entry.lat < -90 || entry.lat > 90) warnings_callback("Image '" + entry.image + "' has the latitude " +
        	entry.lat +" out of the interval [-90, 90]");
        entry.lng = Number(entry.lng);
        if (entry.lng < -180 || entry.lng > 180) warnings_callback("Image '" + entry.image + "' has the longitude " +
        	entry.lng +" out of the interval [-180, 180]");
    });
	return result;
}


function process_wb(wb) {
    reset();

	var warnings_callback = function(warnContent){
		warnings.value += warnContent + "\n";
	};

	var coordinates = to_json(wb, warnings_callback);

	var output ='(function() {\n'+
    '    window.getCoordList = function() {\n'+
    '        return ' + JSON.stringify(coordinates, 2, 2)+ ';\n'+
    '    };\n'+
    '})();';
	out.value = output;
	var coordinatesBlob = new Blob([output], {type: "text/plain;charset=utf-8"});


	if (coordinates.length > 0) {
		$('#preview').show();
		var pageSize = 10;

		previewCoordinates(coordinates, 0, Math.min(pageSize, coordinates.length));

		if (coordinates.length > pageSize){
			// show pager only if we are dealing with a lot of elements
			$("#pager").paginate({
				count 		: Math.ceil(coordinates.length/pageSize),
				start 		: 1,
				display     : 8,
				border					: true,
				border_color			: '#fff',
				text_color  			: '#fff',
				background_color    	: 'black',
				border_hover_color		: '#ccc',
				text_hover_color  		: '#000',
				background_hover_color	: '#fff',
				images					: false,
				mouse					: 'press',
				onChange     			: function(page){
											previewCoordinates(coordinates,
											    (page-1)*pageSize, Math.min(page*pageSize, coordinates.length));
											$('#preview').focus();
										  }
				});

		}
	}

    saveAs(coordinatesBlob, "coordinates.js");
}


function previewCoordinates(coordinates,startIndex, endIndex){
    $('#preview-container').empty();
    for (var i=startIndex;i<endIndex;i++){
        var previewLine = "<div class=\"clearfix\" style=\"margin-bottom:10px;\">" +
            "   <div style=\"float:left;width:200px;\">" + coordinates[i].image + "</div>" +
            "   <div style=\"float:left\">" +
            "        <img src=\"img/photos/"+coordinates[i].image +"\" alt=\"img/photos/"+coordinates[i].image +"\" width=\"400\" height=\"400\">" +
            "   </div>" +
            "   <div id=\"map-"+i+"\" style=\"margin-left:50px;width:400px;height:400px;float:left;\"></div>" +
            "</div>";

        $('#preview-container').append(previewLine);

        var mapStartCenterLatLng = new google.maps.LatLng(coordinates[i].lat, coordinates[i].lng);
        var mapOptions = {
            zoom : 4,
            mapTypeId : google.maps.MapTypeId.ROADMAP,
            center : mapStartCenterLatLng,
            mapTypeControl : false,
            streetViewControl : false
        };
        var map = new google.maps.Map($('#map-'+i).get(0), mapOptions);
        var marker = new google.maps.Marker({
            map : map,
            draggable : false,
            animation : google.maps.Animation.DROP,
            position : mapStartCenterLatLng
        });

    }
}

var drop = document.getElementById('drop');
function handleDrop(e) {
	e.stopPropagation();
	e.preventDefault();
	rABS = document.getElementsByName("userabs")[0].checked;
	use_worker = document.getElementsByName("useworker")[0].checked;
	var files = e.dataTransfer.files;
	var f = files[0];
	{
		var reader = new FileReader();
		var name = f.name;
		reader.onload = function(e) {
			if(typeof console !== 'undefined') console.log("onload", new Date(), rABS, use_worker);
			var data = e.target.result;
			if(use_worker) {
				xw(data, process_wb);
			} else {
				var wb;
				if(rABS) {
					wb = X.read(data, {type: 'binary'});
				} else {
				var arr = fixdata(data);
					wb = X.read(btoa(arr), {type: 'base64'});
				}
				process_wb(wb);
			}
		};
		if(rABS) reader.readAsBinaryString(f);
		else reader.readAsArrayBuffer(f);
	}
}

function handleDragover(e) {
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
}

if(drop.addEventListener) {
	drop.addEventListener('dragenter', handleDragover, false);
	drop.addEventListener('dragover', handleDragover, false);
	drop.addEventListener('drop', handleDrop, false);
}


var xlf = document.getElementById('xlf');
function handleFile(e) {
	rABS = document.getElementsByName("userabs")[0].checked;
	use_worker = document.getElementsByName("useworker")[0].checked;
	var files = e.target.files;
	var f = files[0];
	{
		var reader = new FileReader();
		var name = f.name;
		reader.onload = function(e) {
			if(typeof console !== 'undefined') console.log("onload", new Date(), rABS, use_worker);
			var data = e.target.result;
			if(use_worker) {
				xw(data, process_wb);
			} else {
				var wb;
				if(rABS) {
					wb = X.read(data, {type: 'binary'});
				} else {
				var arr = fixdata(data);
					wb = X.read(btoa(arr), {type: 'base64'});
				}
				process_wb(wb);
			}
		};
		if(rABS) reader.readAsBinaryString(f);
		else reader.readAsArrayBuffer(f);
	}
	$(xlf).wrap('<form>').closest('form').get(0).reset();
    $(xlf).unwrap();
}

if(xlf.addEventListener) xlf.addEventListener('change', handleFile, false);