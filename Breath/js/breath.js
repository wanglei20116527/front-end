// 下面的代码是Breath的底层模块
// 主要是用来处理Dom操作、CSS操作、JavaScript事件处理、class操作、data操作、动画操作

(function(window, document){

	var guid = 1;

	var Breath = window.Breath = function( selector, context ){
		return new Breath.fn.init( selector, context || document);  
	};

	// Breath的缓存系统
	Breath.cache = {
		__event     : {}, // 这个是用来缓存用户的事件的
		__data      : {}, // 这个是用来缓存用户保存的数据的
		__animation : {}  // 这个是用来缓存用户设置的动画的
	};

	Breath.regExp = {
		isTag: /^<[\w\W]+>$/, //这个正则表达式是用来检测完整的标签的
	};

	// 下面的代码是Breath的类型判断系统
	Breath.type = function( obj ){
		return /^\[object (\w+)\]$/.exec( Object.prototype.toString.call( obj ) )[1].toLowerCase();
	};
	Breath.isType = function( type ){
		return function( obj ){
			return Breath.type( obj ) === type;
		}
	};
	Breath.isArray     = Array.isArray || Breath.isType('array');
	Breath.isString    = Breath.isType('string');
	Breath.isFunction  = Breath.isType('function');
	Breath.isObject    = Breath.isType('object');
	Breath.isRegExp    = Breath.isType('regexp');
	Breath.isNumber    = Breath.isType('number');
	Breath.isNaN       = window.isNaN;
	Breath.isDom       = function( el ){
		return !!( typeof el === 'object' && el.nodeType && ( el.nodeType === 1 || el.nodeType == 9 ) );
	};
	Breath.isWindow    = function( el ){
		var type = Breath.type( el );
		return type === 'window' || type === 'global' || type === 'domwindow';
	};
	Breath.isNodeList = function( el ){
		return Breath.type( el ) === 'nodelist';
	};
	// 判断对象是否为Breath对象
	Breath.isBreath = function( el ){
		return el instanceof Breath.prototype.init;
	};

	var __proto__ = Breath.fn = Breath.prototype = [];

	// 下面的代码是用来进行扩展的
	Breath.extend = Breath.prototype.extend = function(){
		var deep   = false;
		var target = arguments[0];
		var i = 1;

		if( arguments.length <= 1 && !Breath.isObject( arguments[0] ) && !Breath.isFunction( arguments[0] ) ){
			return this;
		}

		if( arguments.length <= 1 ){
			target = this;
			--i;
		}

		if( Breath.type( arguments[ 0 ] ) === 'boolean' ){
			deep   = arguments[0];
			target = arguments[i];

			++i;
		}

		for(; i < arguments.length; ++i){
			if( deep ){
				for( var key in arguments[i] ){
					if( Breath.isObject( arguments[i][key] ) || Breath.isArray( arguments[i][key] ) ){
						var tempTarget =  Breath.isArray( arguments[i][key] ) ? [] : {};
						target[key] = arguments.callee( true, tempTarget, arguments[i][key] );
					}else{
						target[key] = arguments[i][key];
					}
				}
			}else{
				for( var key in arguments[i] ){
					target[key] =  arguments[i][key];
				}
			}
		}
		
		return target;
	};

	// 下面的代码是用来对Breath进行扩展的
	Breath.extend({
		each: function(el, fn){
			for(var i = 0; i < el.length; ++i){
				fn.call( el[i], i, el[i], el );
			}
		},

		toArray: function( obj ){
			return Array.prototype.slice.call( obj );
		},

		eventSupport: function( eventType ){
			eventType = "on" + eventType;

			// DOM0事件检测
			var el = document.createElement('breath');

			var isSupport = eventType in el;

			if( !isSupport && el.setAttribute && el.getAttribute ){
				el.setAttribute( eventType, '' );

				isSupport = Breath.isFunction( el.getAttribute( eventType ) );
			}

			if( isSupport ){
				return true;
			}

			eventType = eventType.replace(/^on/, '');

			// fullscreeneventchange事件检测
			// if( eventType === 'fullscreeneventchange' ){
			// 	var pfx = [ '', 'webkit', 'moz', 'o', 'ms' ];

			// 	for( var i = 0; i < pfx.length; ++i ){
			// 		if( Breath.isFunction( document[ pfx[i] + 'CancelFullScreen' ] ) && document[ pfx[i] + 'FullscreenEnabled' ] === true ){
			// 			return true;
			// 		}
			// 	}

			// 	// 对于IE下的fullscreeneventchange事件检测
			// 	if( Breath.isFunction( document['msExitFullscreen' ] ) && document[ 'msFullscreenEnabled' ] === true ){
			// 		return true;
			// 	}

			// // transitionEnd事件检测
			// }else if( eventType === 'transitionEnd' ){
			// 	isSupport = {
			// 		isSupport: false
			// 	};

			// 	var obj = {
			// 		TransitionEvent       : 'transitionend'       ,
			// 		WebkitTransitionEvent : 'webkitTransitionEnd' ,
			// 		OTransitionEvent      : 'oTransitionEnd'      ,
			// 		oTransitionEvent      : 'otransitionEnd'    
			// 	};

			// 	for(var name in obj){
			// 		if( window[name] ){
			// 			isSupport.delegate = obj[name];
			// 			break;
			// 		}

			// 		try{
			// 			document.createEvent(name);
			// 			isSupport.delegate = obj[name];
			// 			break;
			// 		}catch(ex){}
			// 	}

			// 	return isSupport;
			// }

			// // DOMMouseScroll事件检测
			// isSupport = {
			// 	mousewheel: {
			// 		isSupport: false ,
			// 		delegate: 'DOMMouseScroll'
			// 	},
			// 	DOMContentLoaded: true
			// }[ eventType ] || false;

			// return isSupport;
		},

		noop: function(){
		}
	});


	// 下面的代码是用来进行对dom操作进行扩展的
	Breath.extend( true, __proto__, {
		init: function(){
			if( !arguments[0] ){
				return this;
			}

			// 下面的代码是用来处理传过来的对象是否为Breath对象
			if( Breath.isBreath( arguments[0] ) ){
				return arguments[0];
			}

			// 下面的代码是用来处理传来的参数是function的情况
			if( Breath.isFunction( arguments[0] ) ){
				return this.ready( arguments[0] );
			}

			// 选择或创建指定的元素
			if( Breath.isString( arguments[0] ) ){
				var selector = arguments[0].trim();

				var context  = null;

				if( arguments[1] && ( Breath.isDom( arguments[1] ) || Breath.isString( arguments[1] ) || Breath.isBreath( arguments[1] ) ) ){
					context =  Breath( arguments[1] );
				}
				context = context && context[0];
				context = context || document  ;
				
				var elements = this[ Breath.regExp.isTag.test( selector ) ? "createElement" : "query"]( selector, context );	

				for( var i = 0; i < elements.length; ++i ){
					this.push( elements[i] );
				}

				return this;
			}

			// 下面的代码是用来处理传来的是数组的情况
			if( Breath.isArray( arguments[0] ) || Breath.isNodeList( arguments[0] ) ){
				for( var i = 0; i < arguments[0].length; ++i ){
					this.push( arguments[0][i] ); 
				}
				return this;
			}

			this.push( arguments[0] );

			return this;			
		},

		createElement: function( elementString ){
			var docTemp = document.implementation.createHTMLDocument( null );;
			docTemp.body.innerHTML = elementString;
			return docTemp.body.childNodes;
		},

		query: function( selector, context ){
			return context.querySelectorAll( selector );
		},

		eq: function( index ){
			return Breath( this[index] );
		},

		append: function( selector ){
			this.insert( this, selector, 'beforeend' );

			return this;
		},

		appendTo: function( selector ){
			this.insert( selector, this, 'beforeend' );

			return this;
		},

		prepend: function( selector ){
			this.insert( this, selector, 'afterbegin' );

			return this;
		},

		prependTo: function( selector ){
			this.insert( selector, this, 'afterbegin' );

			return this;
		},

		insertBefore: function( selector ){
			this.insert( this, selector, 'beforebegin' );

			return this;
		},

		insertAfter: function( selector ){
			this.insert( this, selector, 'afterend' );

			return this;
		},

		insert: function( targetEl, orignEl, position ){
			// 对于Breath对象来说，我们是需要保留其先前注册的事件和数据的，所以这里我们不采用优化的方式去做
			if( Breath.isBreath( orignEl ) ){

				Breath( targetEl ).each(function( index, targetTmp ){
					for( var i = orignEl.length - 1; i >= 0; --i ){
						targetTmp.insertAdjacentElement || ( targetTmp.insertAdjacentElement = insertAdjacentElement );
						targetTmp.insertAdjacentElement( position, orignEl[ i ] );
					}
				});

			// 对于非Breath对象，我们采用，documentFragment去做，从而优化整个这个框架的性能
			}else{

				var docFragment = document.createDocumentFragment();

				Breath( orignEl ).each(function( index, elTemp ){
					docFragment.appendChild( elTemp );
				});

				var wraper = Breath('<div></div>')[0];
				wraper.appendChild( docFragment );
				var html = wraper.innerHTML;

				Breath( targetEl ).each(function( index, elTemp ){
					elTemp.insertAdjacentHTML( position, html );
				});
			}

			return this;

			function insertAdjacentElement( where, node ){
				switch (where) {
		            case "beforebegin":
		                this.parentNode.insertBefore( node, this );
		                break;

		            case "afterbegin":
		                this.insertBefore( node, this.firstChild );
		                break;

		            case "beforeend":
		                this.appendChild( node );
		                break;

		            case "afterend":
		                if ( this.nextSibling ){
		                	this.parentNode.insertBefore(node, this.nextSibling);
		                }else{
		                	this.parentNode.appendChild(node);
		                }  
		        		break;
        		}
			}
		},

		find: function( selector ){
			var result = Breath();

			if( Breath.isString( selector ) && !( Breath.regExp.isTag.test( selector ) ) ){
				this.each(function(index, elTemp){
					Breath( selector, elTemp ).each(function(index, temp ){
						result.push( temp );
					});
				});
			}

			return result;
		},

		children: function( selector ){
			var result = Breath();

			if( Breath.isString( selector ) && !( Breath.regExp.isTag.test( selector ) ) ){
				this.each(function(index, parentElement){
					Breath( selector, parentElement ).each(function(index, element ){
						element.parentNode === parentElement && result.push( element );
					});
				});
			}

			return result;
		},

		parent: function(){
			if( this.length ){
				return Breath( this[0].parentNode );
			}

			return null;
		},

		remove: function(){
			this.each(function(index, elTemp){
				elTemp.parentNode.removeChild( elTemp );
			});

			return this;
		},

		empty: function(){
			this.each(function( index, el ){
				el.innerHTML = '';
			});

			return this;
		},

		each: function( fn ){
			Breath.each( this, fn );

			return this;
		},

		clone: function(){
			if( this.length ){
				return Breath( this[0].outerHTML ) ;
			}

			return null;
		},

		count: function(){
			return this.length;
		}
	});

	// 下面的代码是用来对元素的class进行操作的
	Breath.extend( true, __proto__, {
		addClass: function( className ){
			if( !Breath.isString( className ) ){
				className = '';
			}

			className = className.trim().split(' ');

			this.each(function( index, elTemp ){
				var classOfElement = ' ' + elTemp.className.trim() + ' ';

				for(var i = 0; i < className.length; ++i ){
					var temp = className[i].trim();

					if( !!temp && classOfElement.indexOf( ' ' + temp + ' ' ) < 0 ){
						classOfElement += temp + ' ';
					}
				}

				elTemp.className = classOfElement.trim();
			});

			return this;
		},

		removeClass: function( className ){
			if( !Breath.isString( className ) ){
				className = '';
			}

			className = className.trim().split(' ');

			this.each(function( index, elTemp ){
				var classOfElement = ' ' + elTemp.className.trim() + ' ';

				for(var i = 0; i < className.length; ++i ){
					var temp = className[i].trim();
					temp && ( classOfElement = classOfElement.replace( ' ' + temp + ' ', ' ' ) );
				}

				elTemp.className = classOfElement.trim();
			});

			return this;
		},

		toggleClass: function( className ){
			if( !Breath.isString( className ) ){
				className = '';
			}

			className = className.trim().split(' ');

			this.each(function( index, elTemp ){
				var classOfElement = ' ' + elTemp.className.trim() + ' ';
				var copy = ' ' + elTemp.className.trim() + ' ';

				for(var i = 0; i < className.length; ++i ){
					var temp = className[i].trim();

					if( temp ){
						// 下面的代码是用来增加class
						if( copy.indexOf( ' ' + temp + ' ' ) < 0 && classOfElement.indexOf( ' ' + temp + ' ' ) < 0 ){
							classOfElement += temp + ' ';
						// 下面的代码是用来删除class
						}else if( copy.indexOf( ' ' + temp + ' ' ) >= 0 && classOfElement.indexOf( ' ' + temp + ' ' ) >= 0 ){
							classOfElement = classOfElement.replace( ' ' + temp + ' ', ' ' );
						}
					}
				}

				elTemp.className = classOfElement.trim();
			});

			return this;
		},

		hasClass: function( className ){
			if( !this.length || !Breath.isString( className ) || !className.trim() ){
				return false;
			}

			var classOfElement = ' ' + this[0].className + ' ';

			className = className.trim().split(' ');

			for( var i = 0; i < className.length; ++i ){
				if( classOfElement.indexOf( ' ' + className[i] + ' ' ) < 0 ){
					return false;
				}
			}
			
			return true;
		}
	});

	// 下面的代码是用来对event模块进行封装的
	(function(){
		function handleEvent( evt ){
			var returnValue = true;

			evt = fixEvent( evt );

			var eventId = Breath.isWindow( this ) ? ( this.windowData || {} )['eventId'] : this.eventId;

			var handlers = ( Breath.cache.__event[ eventId ] || {} )[ evt.type ] || {};

			for( var i in handlers ){
				if( handlers[i].call(this, evt ) === false ){
					returnValue = false;
				}
			}

			return returnValue;
		}

		function fixEvent( evt ){
			var evt = evt || window.event;

			evt.stopPropagation = evt.stopPropagation || fixEvent.stopPropagation; 
			evt.preventDefault  = evt.preventDefault  || fixEvent.preventDefault ;

			// 下面的代码是用来兼容firefox的wheelscroll事件
			if( evt.type === 'DOMMouseScroll ' ){
				evt.wheelDelta = evt.detail * - 40;
			}

			return evt;
		}

		fixEvent.stopPropagation = function(){
			this.cancelBubble = true;
		};

		fixEvent.preventDefault = function(){
			this.returnValue = false;
		};

		Breath.extend( true, __proto__, {
			on: function( eventType, fn ){
				this.each(function( index, el ){
					var eventId;

					if( Breath.isWindow( el ) ){
						el.windowData || ( el.windowData = {} );

						eventId = el.windowData.eventId;
					}else{
						eventId = el.eventId;
					}

					if( !eventId ){
						eventId = guid++;

						Breath.isWindow( el ) ? ( el.windowData.eventId = eventId ) : el.eventId = eventId;

						Breath.cache.__event[ eventId ] = {};
					}

					fn.eventId = guid++;

					var cache = Breath.cache.__event[ eventId ][ eventType ];

					// 下面的代码是用来检测当前元素是否已经设置过该类型的事件了，如果没有的话，设置缓存保存事件回调函数，并且绑定对应的事件
					if( !cache ){
						cache = {};

						// 这里的函数只能够添加一次，因为每添加一次，函数都会被调用一次
						el.addEventListener( eventType, handleEvent, false );
					}
					
					cache[ fn.eventId ] = fn;

					Breath.cache.__event[ eventId ][ eventType ] = cache;
				});

				return this;
			},

			// 对于事件的绑定off是有问题的，请在后面的进行修改
			off: function( eventType, fn ){
				this.each(function( index, el ){
					var eventId = Breath.isWindow( el ) ? ( el.windowData && el.windowData.eventId ) : el.eventId;
					var cache = Breath.cache.__event[ eventId ] || {};

					if( fn === undefined ){
						delete cache[ eventType ];

					} else {

						if( cache[ eventType ] ){
							delete cache[ eventType ][ fn.eventId ];

							for( var i in cache[ eventType ]){};
							if( i === undefined ){
								delete cache[ eventType ];
							}
						}
					}

					// 当该事件的没有对应的处理函数的时候，我们删除该元素所绑定的函数
					if( cache[ eventType ] === undefined ){
						el.removeEventListener( eventType, handleEvent, false );
					}

					for( var i in cache ){};
					if( i === undefined ){
						delete Breath.cache.__event[ el.eventId ];

						delete ( Breath.isWindow( el ) ? ( Breath.windowData || {} ) : el )["eventId"];
					}
				});

				return this;
			},

			ready: function( fn ){
				return Breath(document).on( "DOMContentLoaded", fn );
			},

			transitionEnd: function( callback ){
				this.on( transitionEndEventName(), callback );

				return this;
			},

			offTransitonEnd: function( callback ){
				this.off( transitionEndEventName(), callback );

				return this;
			},

			mouseWheel: function( callback ){
				this.on( mouseWheelEventName(), callback );

				return this;
			},

			offMouseWheel: function( callback ){
				this.off( mouseWheelEventName(), callback );

				return this;
			},

			fullScreenChange: function( callback ){
				var names = [
					'fullscreenchange'       , 
					'webkitfullscreenchange' , 
					'mozfullscreenchange'    , 
					'MSFullscreenChange'
				];

				for( var i = 0; i < names.length; ++i ){
					Breath( document ).on( names[i], callback );
				}

				return this;
			},

			offFullScreenChange: function( callback ){
				var names = [
					'fullscreenchange'       , 
					'webkitfullscreenchange' , 
					'mozfullscreenchange'    , 
					'MSFullscreenChange'
				];

				for( var i = 0; i < names.length; ++i ){
					Breath( document ).off( names[i], callback );
				}

				return this;
			},

			keyup: function( callback ){
				this.each(function( index, elTmp ){
					elTmp.tabIndex = -1;
				});

				this.on( 'keyup', callback );

				return this;
			},

			offKeyup: function( callback ){
				this.each(function( index, elTmp ){
					elTmp.removeAttribute('tabIndex');
				});

				this.off( 'keyup', callback );

				return this;
			},

			// 下面的代码是用来实现事件代理的，由于对于实现的框架而言这个功能暂且不需要，所以这个功能后期实现
			delegate: function( selector, eventType, fn ){
				return this;
			},

			trigger: function( eventType, data ){
				var evt = document.createEvent('CustomEvent');
				evt.initCustomEvent( eventType, true, true, data || null );

				this.each( function(index, elTemp){
					elTemp.dispatchEvent( evt );
				});
				return this;
			}
		});
		
		// 下面的函数是用来获取mousewheel的事件名的
		function mouseWheelEventName(){
			if( mouseWheelEventName.eventName ){
				return mouseWheelEventName.eventName;
			}

			try{
				document.createEvent('MouseScrollEvents');
				mouseWheelEventName.eventName = 'DOMMouseScroll';
			}catch(ex){
				mouseWheelEventName.eventName = 'mousewheel';
			}

			return mouseWheelEventName.eventName;

		}

		// 下面的函数是用来获取transitionEnd事件的名称的
		function transitionEndEventName(){
			// 惰性检测事件的名称，从而提高代码的效率
			if( transitionEndEventName.eventName ){
				return transitionEndEventName.eventName;
			}

			var eventName;
				
			var obj = {
				TransitionEvent       : 'transitionend'       ,
				WebkitTransitionEvent : 'webkitTransitionEnd' ,
				OTransitionEvent      : 'oTransitionEnd'      ,
				oTransitionEvent      : 'otransitionEnd'    
			};

			for( var key in obj ){
				if( window[ key ] ){
					transitionEndEventName.eventName = obj[ key ];
					break;
				}

				try{
					document.createEvent( key );
					transitionEndEventName.eventName = obj[ key ];
					break;
				}catch(ex){}
			}

			return transitionEndEventName.eventName;
		}
	})();
	

	// 下面的代码是用来处理元素的css模块
	Breath.extend( true, __proto__, {
		css: function(){
			if( !( Breath.isString( arguments[0] ) || Breath.isObject( arguments[0] ) ) ){
				return this;
			}

			// get style
			if( Breath.isString( arguments[0] ) && arguments[1] === undefined ){
				return this.getStyle( arguments[0] );
			}

			//set style
			var style = null;

			if( Breath.isObject( arguments[0] ) ){
				style = arguments[0];
			}else if( Breath.isString( arguments[0] ) && ( Breath.isString( arguments[1] ) || arguments[1] === null ) ){
				style = {};
				style[ arguments[0] ] = arguments[1];
			}

			if( style ){
				this.setStyle( style );
			}

			return this;
		},

		show: function(){
			this.css('display', 'block');

			return this;
		},

		hide: function(){
			this.css('display', 'none');

			return this;
		},

		width: function(){
			if( arguments[0] === undefined ){
				return parseFloat( $(this[0]).css('width') );
			}

			var width = parseFloat( arguments[0] );

			if( !Breath.isNaN( width ) ){
				this.css( 'width', width + 'px' );
			}

			return this;
		},

		height: function(){
			if( arguments[0] === undefined ){
				return parseFloat( $(this[0]).css('height') );
			}

			var height = parseFloat( arguments[0] );

			if( !isNaN( height ) ){
				this.css( 'height', height + 'px' );
			}

			return this;
		},

		top: function(){
			if( arguments[0] === undefined ){
				var result = $(this[0]).css('top');
				result = result === 'auto' ? 0 : parseFloat( result ) ;

				return result;
			}

			var top = parseFloat( arguments[0] );

			if( !isNaN( top ) ){
				this.css( 'top', top + 'px' );
			}

			return this;
		},

		left: function(){
			var left;

			if( arguments[0] === undefined ){	
				left = $(this[0]).css('top');
				left = left === 'auto' ? 0 : parseFloat( left ) ;

				return left;
			}

			left = parseFloat( arguments[0] );

			if( !isNaN( left ) ){
				this.css( 'left', left + 'px' );
			}

			return this;
		},

		getStyle: function( styleName ){
			if( this.length == 0 ){
				return null;
			}

			styleName = this.fixedStyleName( styleName );

			return window.getComputedStyle( this[0], null )[ styleName ] || null;
		},

		setStyle: function( style ){
			var self = this;

			this.each(function( index, elTemp ){
				for(var key in style){
					var styleName = self.fixedStyleName( key );
					if( styleName ){
						elTemp.style[ styleName ] = style[ key ];
					}
				} 
			});
		},

		fixedStyleName: function( styleName ){
			// 下面的代码是用来将css的名字转化成驼峰模式
			styleName.replace( /-(\w)/g , function(all, letter){
				return letter.toUpperCase();
			});

			var breath = document.createElement( 'breath' );
			var style  = window.getComputedStyle( breath, null );

			// 下面的代码是用来兼容float的
			var floatName = ['styleFloat', 'cssFloat', 'float'];

			if( floatName.indexOf( styleName ) >= 0 ){
				for(var i = 0; i < floatName.length; ++i ){
					if( floatName[i] in style ){
						return floatName[i];
					}
				}
			}

			// 检测不带前缀的样式名是否支持
			var tempName = styleName[0] + styleName.substr(1);
			if( tempName in breath.style ){
				return tempName;
			}

			// 检测带前缀的样式是否支持
			var pfx = [ 'webkit', 'moz', 'ms', 'o' ];
			for(var i = 0; i < pfx.length; ++i){
				var tempName = pfx[i] + styleName;
				if( tempName in style ){
					return tempName;
				}
			}

			// 无法识别的样式我们返回null
			return null;
		}
	});


	// 下面的代码是用来处理Breath的data模块的(包括html5中的以data开头自定义的数据)
	(function($, __proto__){
		$.extend( true, __proto__ , {
			data: function(){
				// get data
				if( arguments[0] === undefined || ( $.isString( arguments[0] ) && arguments[1] === undefined ) ){
					return getData.call( this[0], this[0], arguments[0] );
				}

				// set data 
				if( $.isObject( arguments[0] ) || ( $.isString( arguments[0] ) && arguments[1] !== undefined ) ){
					var tmpData = null;
					if( $.isString( arguments[0] ) ){
						tmpData = {};
						tmpData[ arguments[0] ] = arguments[1];
					}
					tmpData || ( tmpData = arguments[0] );

					this.each(function( index, elTmp ){
						setData.call( elTmp, elTmp, tmpData );
					});
				}

				return this;
			},

			removeData: function(){
			},

			// 用来设置、修改或删除key为name的值，如果value为null的话，表明删除对应的数据
			dataset: function( name, value ){
				if( this.length && $.isString( name ) && name !== "" ){
					// 获取第一个元素的数据
					if( value ===  undefined ){
						value = this[0].dataset[ name ];
						value = value === undefined ? null : value;

						// 通过正则表达式来判断当前的数据是否是object或array的json格式
						if( /^\{[\s\S]*\}$|^\[[\s\S]*\]$/.test( value ) ){
							value = JSON.parse( value );
						}
						
						return value;

					// 删除每个元素的数据
					}else if( value === null ){
						this.each(function( index, elTmp ){
							delete elTmp.dataset[ name ];
						});

					// 为每个元素添加或修改对应的数据
					}else{
						value = $.isObject( value ) || $.isArray( value ) ? JSON.stringify( value ) : value; 
						this.each(function( index, elTmp ){
							elTmp.dataset[ name ] = value;
						});
					}
				}

				return this;
			},
		});

		function setData(el, data){
			var dataId = null;

			// 防止污染全局作用域
			if( $.isWindow( el ) ){
				el.windowData || ( el.windowData = {} );
				dataId = el.windowData['dataId'];
			}else{
				dataId = el['dataId'];
			}

			if( !dataId ){
				$.isWindow( el ) ? ( el.windowData['dataId'] = guid ) : ( el['dataId'] = guid );
				dataId = guid++;
			}

			var cache = $.cache.__data[dataId] || {};

			for( var key in data ){
				cache[key] = data[key];
			}

			$.cache.__data[dataId] = cache;
		}

		function getData(el, name){
			var dataId = $.isWindow( el ) ? ( window.windowData || {} )['dataId'] : el.dataId;

			var cache = $.cache.__data[ dataId ];

			// 获取元素el所有的存储的数据
			if( !name ){
				return cache || null;
			}

			// 获取制定名称的数据

			var data = ( cache || {} )[ name ];

			return data === undefined ? null : data;
		}

	})( Breath, __proto__ );

	// 下面的代码使用处理Breath的属性模块的
	Breath.extend( true, __proto__, {
	});

	// 下面的代码是用来使元素全屏的
	Breath.extend( true, __proto__, {
		// 对于IE11的全屏的话必须通过用户启动的事件（如按钮事件）调用msRequestFullscreen才有效，不然没有任何效果
		fullScreen: function(){
			if( this[0] ){
				var pfx = [ '', 'webkit', 'moz', 'ms' ];

				for( var i = 0; i < pfx.length; ++i ){
					// chrome firefox
					var funcName = pfx[i] + 'RequestFullScreen';
					funcName = funcName[0].toLowerCase() + funcName.substr(1);
					if( funcName in this[0] ){
						this[0][ funcName ]();
						break;
					}

					// w3c 
					var funcName = pfx[i] + 'RequestFullscreen';
					funcName = funcName[0].toLowerCase() + funcName.substr(1);
					if( funcName in this[0] ){
						this[0][ funcName ]();
						break;
					}
				}
			}

			return this;
		},

		cancelFullScreen: function(){
			var pfx = [ '', 'webkit', 'moz', 'ms', 'moz' ];

			for( var i = 0; i < pfx.length; ++i ){
				// chrome firefox
				var funcName = pfx[i] + 'CancelFullScreen';
				funcName = funcName[0].toLowerCase() + funcName.substr(1);
				if( funcName in document ){
					document[ funcName ]();
					break;
				}

				// w3c
				var funcName = pfx[i] + 'ExitFullscreen';
				funcName = funcName[0].toLowerCase() + funcName.substr(1);
				if( funcName in document ){
					document[ funcName ]();
					break;
				}
			}

			return this;
		},

		// 下面的函数是用来判断当前元素是否全屏的
		isFullScreen: function(){
			var names = [
				'fullscreenElement'       , 
				'webkitFullscreenElement' , 
				'mozFullScreenElement'    , 
				'msFullscreenElement'
			];

			for( var i = 0; i < names.length; ++i ){
				if( document[ names[i] ] === this[0] ){
					return true;
				}
			}

			return false;
		}
	});

	// animation model
	(function($, __proto__){
		// 下面的代码是JavaScript的缓动公式
		var CSSCubicBezier = {
			'in':                'ease-in'                                   ,
			'out':               'ease-out'                                  ,
			'in-out':            'ease-in-out'                               ,
			'snap':              'cubic-bezier(0,1,.5,1)'                    ,
			'linear':            'cubic-bezier(0.250, 0.250, 0.750, 0.750)'  ,
			'ease-in-quad':      'cubic-bezier(0.550, 0.085, 0.680, 0.530)'  ,
			'ease-in-cubic':     'cubic-bezier(0.550, 0.055, 0.675, 0.190)'  ,
			'ease-in-quart':     'cubic-bezier(0.895, 0.030, 0.685, 0.220)'  ,
			'ease-in-quint':     'cubic-bezier(0.755, 0.050, 0.855, 0.060)'  ,
			'ease-in-sine':      'cubic-bezier(0.470, 0.000, 0.745, 0.715)'  ,
			'ease-in-expo':      'cubic-bezier(0.950, 0.050, 0.795, 0.035)'  ,
			'ease-in-circ':      'cubic-bezier(0.600, 0.040, 0.980, 0.335)'  ,
			'ease-in-back':      'cubic-bezier(0.600, -0.280, 0.735, 0.045)' ,
			'ease-out-quad':     'cubic-bezier(0.250, 0.460, 0.450, 0.940)'  ,
			'ease-out-cubic':    'cubic-bezier(0.215, 0.610, 0.355, 1.000)'  ,
			'ease-out-quart':    'cubic-bezier(0.165, 0.840, 0.440, 1.000)'  ,
			'ease-out-quint':    'cubic-bezier(0.230, 1.000, 0.320, 1.000)'  ,
			'ease-out-sine':     'cubic-bezier(0.390, 0.575, 0.565, 1.000)'  ,
			'ease-out-expo':     'cubic-bezier(0.190, 1.000, 0.220, 1.000)'  ,
			'ease-out-circ':     'cubic-bezier(0.075, 0.820, 0.165, 1.000)'  ,
			'ease-out-back':     'cubic-bezier(0.175, 0.885, 0.320, 1.275)'  ,
			'ease-out-quad':     'cubic-bezier(0.455, 0.030, 0.515, 0.955)'  ,
			'ease-out-cubic':    'cubic-bezier(0.645, 0.045, 0.355, 1.000)'  ,
			'ease-in-out-quart': 'cubic-bezier(0.770, 0.000, 0.175, 1.000)'  ,
			'ease-in-out-quint': 'cubic-bezier(0.860, 0.000, 0.070, 1.000)'  ,
			'ease-in-out-sine':  'cubic-bezier(0.445, 0.050, 0.550, 0.950)'  ,
			'ease-in-out-expo':  'cubic-bezier(1.000, 0.000, 0.000, 1.000)'  ,
			'ease-in-out-circ':  'cubic-bezier(0.785, 0.135, 0.150, 0.860)'  ,
			'ease-in-out-back':  'cubic-bezier(0.680, -0.550, 0.265, 1.550)' 
		};

		$.extend( true, __proto__, {
			animate: function(props, time, timingFunction, delay){
				if( $.isObject( props ) ){
					var options = {
						time : 500 ,
						delay: 0   ,
						timingFunction: CSSCubicBezier[ 'linear' ]
					};

					time = parseInt( time );
					$.isNaN( time ) || ( options.time = time );

					delay = parseInt( delay );
					$.isNaN( delay ) || ( options.delay = delay );

					CSSCubicBezier[timingFunction] && ( options.timingFunction = CSSCubicBezier[timingFunction] );


					// 下面的代码是用来将动画的数据缓存到队列中，从而使得动画能够顺序执行
					var cache = $.cache.__animation;

					this.each(function(index, elTmp){
						var isWindow = $.isWindow( elTmp ) ;

						var animateId = isWindow ? ( elTmp.windowData || {} )['animateId'] : elTmp.animateId ;

						if( !animateId ){
							if( isWindow ){
								elTmp.windowData || ( elTmp.windowData = {} );
								elTmp.windowData.animateId = guid;

							}else{
								elTmp.animateId = guid;
							}
							animateId = guid++;
						}

						var animateData = cache[ animateId ] || {};

						// 缓存动画是否在进行中
						animateData['animating'] === undefined && ( animateData['animating'] = false );

						// 缓存动画的配置参数
						$.isArray( animateData['options'] ) || ( animateData['options'] = [] );
						animateData['options'].push( options );

						// 缓存动画的属性
						$.isArray( animateData['props'] ) || ( animateData['props'] = [] );
						animateData['props'].push( props );

						cache[ animateId ] = animateData;


						// 如果没有开始动画的话，开始动画
						if( !animateData['animating'] ){
							animateData['animating'] = true;

							var propsTmp   = animateData['props'].shift();
							var optionsTmp = animateData['options'].shift();

							elTmp = $( elTmp );

							elTmp.css( $.extend( true, {}, propsTmp, {
								transition: 'all ' + optionsTmp.time + 'ms ' + optionsTmp.timingFunction + ' ' + optionsTmp.delay + 'ms'
							}));


							// 下面的事件名是需要改动的，请以后进行修改
							var count = 0;
							// elTmp.on('transitionEnd', function(){
							// 	// 一个动画可能会涉及到多个属性，多个熟悉会触发多次transitionEnd事件，我们只处理最后一次触发
							// 	if( Object.keys( propsTmp ).length < ++count ){
							// 		return;
							// 	}

							// 	count = 0;


							// 	if( !( animateData['props'].length && animateData['options'].length ) ){
							// 		animateData['animating'] = false;
							// 		elTmp.off( 'transitionEnd' );

							// 		console.log( 'transition end' );

							// 		return;
							// 	}

							// 	propsTmp   = animateData['props'].shift();
							// 	optionsTmp = animateData['options'].shift();

							// 	// 触发队列中的下一个动画
							// 	elTmp.css( $.extend( true, {}, propsTmp, {
							// 		transition: 'all ' + optionsTmp.time + 'ms ' + optionsTmp.timingFunction + ' ' + optionsTmp.delay + 'ms'
							// 	}));

							// });

							elTmp.transitionEnd(function(){
								// 一个动画可能会涉及到多个属性，多个熟悉会触发多次transitionEnd事件，我们只处理最后一次触发
								if( Object.keys( propsTmp ).length < ++count ){
									return;
								}

								count = 0;

								if( !( animateData['props'].length && animateData['options'].length ) ){
									animateData['animating'] = false;
									elTmp.offTransitonEnd();

									console.log( 'transition end' );

									return;
								}

								propsTmp   = animateData['props'].shift();
								optionsTmp = animateData['options'].shift();

								// 触发队列中的下一个动画
								elTmp.css( $.extend( true, {}, propsTmp, {
									transition: 'all ' + optionsTmp.time + 'ms ' + optionsTmp.timingFunction + ' ' + optionsTmp.delay + 'ms'
								}));

							});
						}
					});
				}

				return this;
			},

			fadeIn: function(time, timingFunc, delay){
				this.each(function( index, elTmp ){
					$elTmp = $(elTmp);

					if( $elTmp.css('opacity') == 1 ){
						return;	
					}

					$elTmp.animate( { opacity: 1 } , time, timingFunc, delay );
				});
				
				return this;
			},

			fadeOut: function(time, timingFunc, delay){
				this.each(function( index, elTmp ){
					$elTmp = $(elTmp);

					if( $elTmp.css('opacity') == 0 ){
						return;
					}

					$elTmp.animate( { opacity: 0 } , time, timingFunc, delay );
				});
				
				return this;
			},

			fadeTo: function( opacity, time, timingFunc, delay ){
				opacity = parseFloat( opacity );

				if( $.isNaN( opacity ) ){
					return this;
				}

				opacity > 1 && ( opacity = 1 );
				opacity < 0 && ( opacity = 0 );

				this.each(function(index, elTmp){
					$elTmp = $(elTmp);

					if( $elTmp.css('opacity') == opacity ){
						return;
					}

					$elTmp.animate( { opacity: opacity } , time, timingFunc, delay );
				});

				return this;
			},

			moveBy: function(offsetX, offsetY, time, timingFunc, delay){
				offsetX = parseInt( offsetX );
				offsetY = offsetY === undefined ? 0 : parseInt( offsetY );


				if( $.isNaN( offsetX ) || $.isNaN( offsetY ) ){
					return this;
				}

				this.each(function( index, elTmp ){
					if( !( offsetX || offsetY ) ){
						return;
					}
					var $elTmp = $(elTmp);

					elTmp.position || ( elTmp.position = {} );
					elTmp.position.top  = elTmp.position.top  ? elTmp.position.top  + offsetY : $elTmp.top()  + offsetY ;
					elTmp.position.left = elTmp.position.left ? elTmp.position.left + offsetX : $elTmp.left() + offsetX ;

					$elTmp.animate({
						top  : elTmp.position.top  + 'px' ,
						left : elTmp.position.left + 'px'
					}, time, timingFunc, delay);
				});

				return this;
			},

			xBy: function(offsetX, time, timingFunc, delay){
				this.moveBy( offsetX, 0, time, timingFunc, delay );
				return this;
			},

			yBy: function(offsetY, time, timingFunc, delay){
				this.moveBy( 0, offsetY, time, timingFunc, delay );
				return this;
			},			

			moveTo: function(posX, posY, time, timingFunc, delay){
				posX = parseInt( posX );
				posY = parseInt( posY );

				if( $.isNaN( posX ) || $.isNaN( posY ) ){
					return this;
				}

				this.each(function( index, elTmp ){
					$elTmp = $(elTmp);

					if( $elTmp.top() == posY && $elTmp.left() == posX ){
						return;
					}

					elTmp.position = {
						top : posY ,
						left: posX
					};

					$elTmp.animate({
						top : elTmp.position.top  + 'px' ,
						left: elTmp.position.left + 'px'
					}, time, timingFunc, delay );
				});

				return this;
			},

			xTo: function(posX, time, timingFunc, delay){
				posX = parseInt( posX );

				if( $.isNaN( posX ) ){
					return this;
				}

				this.each(function( index, elTmp ){
					$elTmp = $(elTmp);

					if( $elTmp.left() == posX ){
						return;
					}

					elTmp.position = {
						left: posX
					};

					$elTmp.animate({
						left: elTmp.position.left + 'px'
					}, time, timingFunc, delay );
				});

				return this;
			},

			yTo: function(posY, time, timingFunc, delay){
				posY = parseInt( posY );

				if( $.isNaN( posY ) ){
					return this;
				}

				this.each(function( index, elTmp ){
					$elTmp = $(elTmp);

					if( $elTmp.top() == posY ){
						return;
					}

					elTmp.position = {
						top : posY
					};

					$elTmp.animate({
						top : elTmp.position.top  + 'px' 
					}, time, timingFunc, delay );
				});

				return this;
			},

			scaleBy: function(scaleX, scaleY, time, timingFunc, delay){
				scaleX = parseInt( scaleX );
				scaleY = scaleY === undefined ? scaleX : parseInt( scaleY );

				if( $.isNaN( scaleX ) || $.isNaN( scaleY ) || scaleX <= 0 || scaleY <= 0 ){
					return this;
				}

				this.each(function( index, elTmp ){
					if( scaleX == 1 && scaleY == 1 ){
						return;
					}

					elTmp.scale || ( elTmp.scale = {} );
					elTmp.scale.scaleX = elTmp.scale.scaleX ? ( elTmp.scale.scaleX * scaleX ) : scaleX;
					elTmp.scale.scaleY = elTmp.scale.scaleY ? ( elTmp.scale.scaleY * scaleY ) : scaleY;

					$(elTmp).animate({
						transform: 'scale(' + elTmp.scale.scaleX + ', ' + elTmp.scale.scaleY + ')'
					}, time, timingFunc, delay);
				});

				return this;
			},

			scaleTo: function(scaleX, scaleY, time, timingFunc, delay){
				scaleX = parseInt( scaleX );
				scaleY = scaleY === undefined ? scaleX : parseInt( scaleY );

				if( $.isNaN( scaleX ) || $.isNaN( scaleY ) || scaleX <= 0 || scaleY <= 0 ){
					return this;
				}

				this.each(function( index, elTmp ){
					if( ( !elTmp.scale && scaleX == 1 && scaleY == 1 ) || ( elTmp.scale && elTmp.scale.scaleX == scaleX && elTmp.scale.scaleY == scaleY ) ){
						return;
					}

					elTmp.scale = {
						scaleX: scaleX ,
						scaleY: scaleY
					};

					$(elTmp).animate({
						transform: 'scale(' + scaleX + ', ' + scaleY + ')'
					}, time, timingFunc, delay);
				});

				return this;
			},

			rotateBy: function( offsetDegree, time, timingFunc, delay){
				offsetDegree = parseInt( offsetDegree );

				if( $.isNaN( offsetDegree ) ){
					return this;
				}

				this.each(function( index, elTmp ){
					elTmp.degree = ( elTmp.degree || 0 ) + offsetDegree;
					
					$(elTmp).animate({
						transform: 'rotate(' + elTmp.degree + 'deg)'
					}, time, timingFunc, delay);
				});

				
				
				return this;
			},

			rotateTo: function(degree, time, timingFunc, delay){
				degree = parseInt( degree );

				if( $.isNaN( degree ) ){
					return this;
				}

				this.each(function( index, elTmp ){
					// 如果状态不发生变化返回，不做任何处理
					if( !( elTmp.degree || degree ) || elTmp.degree == degree ){
						return;
					}

					elTmp.degree = degree; 

					$(elTmp).animate({
						transform: 'rotate(' + degree + 'deg)'
					}, time, timingFunc, delay);
				});

				return this;
			}
		});

	})(Breath, __proto__);
	
	Breath.fn.init.prototype = Breath.fn;

})(window, document);


// 下面的代码是用来创建PPT的框架的
(function($){
	var guid = 1;

	// 
	// 下面的代码里存在一个bug，那个bug就是不知道为什么preview_version上进行的一些列操作都没有效果，请在后面进行修复
	// 
	var PPT = function(){
		this.each(function( index, elTmp ){
			var id_PPT = guid++;

			// 下面的代码是用来保存PPT的数据的
			var data_PPT = PPT.data[ id_PPT ] = {
				PPT_playing     : null ,
				PPT_preview     : null ,
				steps_playing   : null , // PPT所有页的Breath对象
				steps_preview   : null ,
				data_steps      : []   , // 每一页PPT的数据
				index_curt_step : 0      // 当前播放的页数
			};

			// 这个是用来进行播放的
			var playing_version = data_PPT.PPT_playing = $( elTmp );

			// 这个是用来进行预览的
			var preview_version = playing_version.clone().addClass( 'preview' ).appendTo( playing_version.parent() );

			// 保存每个PPT的id
			[ playing_version, preview_version ].forEach( function( version, index ){
				version.data( 'id_PPT', id_PPT );
			});

			var steps_playing = data_PPT.steps_playing = playing_version.find( '.step' );
			var steps_preview = data_PPT.steps_preview = preview_version.find( '.step' );

			[ steps_playing, steps_preview ].forEach( function( steps, index ){
				steps.each( function( index, step ){
					step = $( step );

					// 设置每一页的背景色
					var background = step.dataset( 'background' )            ||
									 playing_version.dataset( 'background' ) ||  // 这里通过preview_version来获得也是可以的
									 PPT.config.step.background;

					step.css( 'background', background );

			 		// 设置每一页的页数（页数是从0开始的）
			 		step.data( 'pageIndex', index );
				});
			});

			steps_preview.on( 'dblclick', function(){
				steps_playing.hide();

				var index_curt_step = data_PPT.index_curt_step = $(this).data( 'pageIndex' );

				steps_playing.eq( index_curt_step ).show().css({
					width  : '100%' ,
					height : '100%' ,
					top    : 0      ,
					left   : 0
				});

				// 下面的代码是用来初始化上一页的step的
				if( index_curt_step > 0 ){
					var index_step = index_curt_step - 1;

					var	step = steps_playing.eq( index_step );

					var data_step = data_PPT.data_steps[ index_step ];

					PPT.transition.in[ data_step[ 'transitionIn' ] ].init( step );
				}

				// 下面的代码是用来初始化下一页的step的
				if( index_curt_step < steps_playing.count() - 1 ){
					var index_step = index_curt_step + 1;

					var	step = steps_playing.eq( index_step );

					var data_step = data_PPT.data_steps[ index_step ];

					PPT.transition.in[ data_step[ 'transitionIn' ] ].init( step );
				}

				playing_version.fullScreen();
			});


			playing_version.addClass( 'playing' ).keyup( function( evt ){
				switch( evt.keyCode ){
					case 37: // 左键
					case 38: // 上键
						PPT.prev( id_PPT, data_PPT.index_curt_step );
						break;

					case 39: // 右键
					case 40: // 下键
						PPT.next( id_PPT, data_PPT.index_curt_step );
						break;
				}

			}).fullScreenChange(function(){
				console.log( "wanglei is cool and kang is wanglei best friend" );
				if( playing_version.isFullScreen() ){
					playing_version.show();
					preview_version.hide();
				}else{
					playing_version.hide();
					preview_version.show();
				}
			});

			playing_version.find('.step').each( function( index, step ){
				step = $( '.step' );

				var data = {
					transitionIn      : step.dataset('transitionIn')       || 'default' ,
					transitionOut     : step.dataset('transitionOut')      || 'default' ,
					transitionInStart : step.dataset('transitionInStart')  || $.noop    ,
					transitionInEnd   : step.dataset('transitionInEnd')    || $.noop    ,
					transitionOutStart: step.dataset('transitionOutStart') || $.noop    ,
					transitionOutEnd  : step.dataset('transitionOutEnd')   || $.noop                     
				};

				PPT.data[ id_PPT ]['data_steps'].push( data );
			});


			// 开始的时候预览版本显示，播放版本隐藏
			playing_version.hide();
			preview_version.show();			
		});
	};

	PPT.config = {
		version : "0.0.1"              , // 版本号 
		name    : "Breath"             , // 名称
		step    : {                      
			background : "transparent"   // 每一页的背景颜色
		}
	};

	// 下面的代码是用来保存PPT中每一页的数据的
	PPT.data = [];

	// 下面的代码是用来扩展每一页PPT进入或出去的动画效果的
	PPT.transition = {
		in : {},
		out: {}
	};

	PPT.transition.in.default = function( step ){
		$(step).show();
	};

	PPT.transition.in.default.init = function( step ){
		$(step).hide();
	};

	PPT.transition.out.default = function( step ){
		$(step).hide();
	};

	// index表示当前播放的页面的页数
	PPT.prev = function( id_PPT, index ){	
		if( index == 0 ){
			return;
		}

		var data_PPT = PPT.data[ id_PPT ];

		var steps = data_PPT['steps_playing'];

		PPT.go( id_PPT, index - 1 );

	};

	// index表示当前播放的页面的页数
	PPT.next = function( id_PPT, index ){
		var data_PPT = PPT.data[ id_PPT ];

		var steps = data_PPT['steps_playing'];

		if( index == steps.count() -1 ){
			return;
		}

		PPT.go( id_PPT, index + 1 );
	};

	// index表示将要播放的页面的页数
	PPT.go = function( id_PPT, index ){
		var data_PPT = PPT.data[ id_PPT ];

		var steps = data_PPT['steps_playing'];

		if( index < 0 || index >= steps.count() ){
			return;
		}

		steps.hide();

		data_PPT.index_curt_step = index;

		steps.eq( index ).show();
	};

	$.fn.extend({
		PPT: PPT 
	});
	
})(Breath);

window.$ = Breath;

$('.breath').PPT();


