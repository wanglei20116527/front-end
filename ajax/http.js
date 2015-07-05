define( ["type"], function( type ){

	var EventEmitter = {
		cache: {}
	};

	EventEmitter.on  = function( type, func ){
		if( !(type && func) ){
			console.log( "please input valid type and function" );
			return;
		}

		var callbacks = this.cache[ type ] || [];

		callbacks.push( func );

		this.cache[ type ] = callbacks;
	};

	EventEmitter.off = function( type, func ){
		if( !type ){
			this.cache = {};

		}else if( !func ){
			delete this.cache[ type ];
		
		}else{
			var callbacks = this.cache[ type ] || [];

			for( var i = 0; i < callbacks.length; ++i ){
				callbacks[i] === func && callbacks.splice( i, 1 );
				break;
			}

			if( !callbacks.length ){
				delete this.cache[ type ];
			}else{
				this.cache[ type ] = callbacks;
			}
		}
	};

	EventEmitter.emit = function( type, context ){
		if( !type ){
			return;
		}

		context = context || {};

		var callbacks = this.cache[ type ] || [];

		var args = [].splice.call( arguments, 2, arguments.length - 2);

		for( var i = 0; i < callbacks.length; ++i ){
			callbacks[i].apply( context, args );
		}
	};

	function serialize( data ){
		var serializedFragments = [];

		for( var key in data ){
			var fragment = type.isString( data[key] ) ? data[key] : JSON.stringify( data[ key ] );
			serializedFragments.push( key + "=" + fragment );
		}

		return serializedFragments.join( "&" );
	}

	function handleOptions( options ){
		var defaultOptions = {
			type        : "GET"      ,
			async       : true       ,
			context     : this       ,
			jsonp       : "callback" ,
			crossDomain : false 
 		};

		options.type        = options.type        ? options.type.toUpperCase() : defaultOptions.type ;
		options.async       = options.async       !== undefined ? !!options.async : defaultOptions.async ; 
		options.jsonp       = options.jsonp       ? options.jsonp   : defaultOptions.jsonp;
		options.context     = options.context     ? options.context : defaultOptions.context;
		options.crossDomain = options.crossDomain !== undefined ? !!options.crossDomain : defaultOptions.crossDomain;

		if( options.data ){
			if( type.isObject( options.data ) ){
				options.data = serialize( options.data );
			}
		}else{
			options.data = null;
		}

		if( options.type === "GET" ){
			if( options.url.indexOf( "?" ) == -1 ){
				options.url += "?" + options.data;
			}else{
				options.url += "&" + options.data;
			}

			delete options.data;
		}

		return options;
	}


	function XHRFaker( transfer ){
		this.mimeType = "";
		this.isHandled = false;

		this.jsonpName = "callback";

		this.transfer   = transfer();
		this.request    = transfer.request;
		this.respond    = transfer.respond;
		this.preprocess = transfer.preprocess;
	}

	XHRFaker.prototype.setRequestHeader = function( header, name ){
		this.transfer && this.transfer.setRequestHeader && this.transfer.setRequestHeader( header, name );
	};

	XHRFaker.prototype.getResponseHeader = function( header ){
		if( this.transfer && this.transfer.getResponseHeader ){
			return this.transfer.getResponseHeader( header ) || null;
		}
		return null;
	};

	XHRFaker.prototype.overridemimetype = function( mime ){
		this.mimeType = mime;
		this.transfer && this.transfer.overridemimetype && this.transfer.overridemimetype( mime );
	};

	XHRFaker.prototype.open = function( method, url, async, username, password ){
		this.transfer && this.transfer.open && this.transfer.open( method, url, async, username, password );
	};

	XHRFaker.prototype.send = function( data ){
		this.transfer && this.transfer.send && this.transfer.send( data );
	};

	XHRFaker.prototype.onreadystatechange = function( func, context ){
		context = context || this;

		this.transfer.onreadystatechange = function(){
			func && func.call( context );
		}
	};

	XHRFaker.prototype.getReadyState = function(){
		if( this.transfer ){
			return this.transfer.readyState || 0;
		}

		return 0;
	};

	XHRFaker.prototype.getStatus = function(){
		if( this.transfer ){
			var status = this.transfer.status;
			if( status == 1223 || status == undefined ){
				status = 204;
			}
			return status || null;
		}

		return null;
	};

	XHRFaker.prototype.getStatusText = function(){
		if( this.transfer ){
			return this.transfer.statusText || "";
		}

		return "";
	};

	XHRFaker.prototype.getResponseXML = function(){
		if( this.transfer ){
			return this.transfer.responseXML || "";
		}

		return "";
	};

	XHRFaker.prototype.getResponseText = function(){
		if( this.transfer ){
			return this.transfer.responseText || "";
		}

		return "";
	};

	XHRFaker.prototype.getResponse = function(){
		if( this.transfer ){
			return this.transfer.response || "";
		}

		return "";
	};



	var transferFactory = (function(){
		var Transfers = {};

		Transfers.xhr = function(){
			var xhrObject;

			var candidates = [
				function(){ return new XMLHttpRequest(); },
				function(){ return new ActiveXObject('MSXML2.XMLHTTP.6.0'); },
				function(){ return new ActiveXObject('MSXML2.XMLHTTP.3.0'); },
				function(){ return new ActiveXObject('Microsoft.XMLHTTP');  }
			];

			// IE7下的XMLHttpRequest访问本地文件的时候会报错
			candidates[0] = !"1"[0] && window.location.protocol == "file:" ? function(){ throw new Error(""); } : candidates[0];

			for( var i = 0; i < candidates.length; ++i ){
				try{
					xhrObject = candidates[i]();
					xhr = candidates[i];
					break;
				}catch(e){}
			}

			return xhrObject;
		};

		Transfers.xhr.preprocess = function(){};

		Transfers.xhr.request = function( options ){
			
			if( options.username ){
				this.open( options.type, options.url, options.async, options.username, options.password || "" );
			}else{
				this.open( options.type, options.url, options.async );
			}

			// 这个是用来告诉服务器，我们的请求是ajax的请求
			this.setRequestHeader( "X-Requested-With", "XMLHttpRequest" ); 
			if( options.headers ){
				for( var header in options.headers  ){
					this.setRequestHeader( header, options.headers[ header ] );
				}
			}

			this.overridemimetype( options.dataType || "text/plain" );

			// 下面的代码是用来绑定事件的
			this.onreadystatechange( this.respond );

			this.send( options.type === "POST" && options.data ? options.data : null );
			
			if( !options.async || this.getReadyState() == 4  ){
				this.respond();
			}
		};

		Transfers.xhr.respond = function(){
			if( this.isHandled || this.getReadyState() != 4 ){
				return;
			}

			var status = this.getStatus();

			if( status >= 200 && status < 300 || status == 304 ){
				EventEmitter.emit( "success"  , this, this.getResponseText() );
				EventEmitter.emit( "complete" , this, this.getResponseText() );
			}else{
				EventEmitter.emit( "error"    , this, new Error());
				EventEmitter.emit( "complete" , this, this.getResponseText() );
			}

			EventEmitter.off();

			this.isHandled = true;
		};


		Transfers.script = function(){
			return document.createElement( "script" );

		};

		Transfers.script.preprocess = function( options ){
		};

		Transfers.script.request = function( options ){
			var self   = this;
			var script = this.transfer;

			if( options.url.indexOf( "?" ) >= 0 ){
				options.url += "&" + options.jsonp + "=" + options.jsonpCallback;
			}else{
				options.url += "?" + options.jsonp + "=" + options.jsonpCallback;
			}

			script.src = options.url;
			
			if( script.readyState !== undefined && script.onerror !== null ){
				script.onreadystatechange = function(){
					if( this.readyState == "loaded" || this.readyState == "complete" ){
						self.respond();

						EventEmitter.emit( "complete", this, {} );
						EventEmitter.off();
					}	
				};
			}else{
				script.onerror = function(){
					self.respond();
					EventEmitter.emit( "error"    , this, {} );
					EventEmitter.emit( "complete" , this, {} );
					EventEmitter.off();
				};

				script.onload = function(){
					self.respond();
					EventEmitter.emit( "success"  , this, {} );
					EventEmitter.emit( "complete" , this, {} );
					EventEmitter.off();
				};
			}

			

			document.body.appendChild( script );	
		};

		Transfers.script.respond = function(){
			if( this.isHandled ){
				return;
			}
			this.transfer.onerror = this.transfer.onload = this.transfer.onreadystatechange = null;

			document.body.removeChild( this.transfer );

			this.isHandled = true;
		};

		return function( type ){
			var transfer = null;

			switch( type ){
				case "xhr" :
					transfer = Transfers.xhr;
					break;

				case "script" :
					transfer = Transfers.script;
					break;
			}

			return transfer;
		};
	})();


	var http = function( options ){
		if( !options.url ){
			console.log( "url must to be specified" );
			return;
		}

		options = handleOptions( options );

		var events = [ "success", "complete", "error" ];
		for( var i = 0; i < events.length; ++i ){
			var event = events[i];
			options[ event ] && type.isFunc( options[ event ] ) && EventEmitter.on( event, options[ event ] );
		}

		var transfer = null;
		if( options.crossDomain ){
			transfer = transferFactory( "script" ) ;
		} else {
			transfer = transferFactory( "xhr" );
		}

		var xhrFaker = new XHRFaker( transfer );

		xhrFaker.preprocess( options );

		xhrFaker.request( options );
	};

	return http;
})