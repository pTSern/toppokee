(function(root){var exports=undefined,module=undefined,require=undefined;var define=undefined;(function(){(function(){/**
   * Expose `Emitter`.
   */ // module.exports = Emitter;
/**
   * Initialize a new `Emitter`.
   *
   * @api public
   */function Emitter(obj){if(obj)return mixin(obj);};/**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */function mixin(obj){for(var key in Emitter.prototype){obj[key]=Emitter.prototype[key];}return obj;}/**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */Emitter.prototype.on=Emitter.prototype.addEventListener=function(event,fn){this._callbacks=this._callbacks||{};(this._callbacks[event]=this._callbacks[event]||[]).push(fn);return this;};/**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */Emitter.prototype.once=function(event,fn){var self=this;this._callbacks=this._callbacks||{};function on(){self.off(event,on);fn.apply(this,arguments);}on.fn=fn;this.on(event,on);return this;};/**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */Emitter.prototype.off=Emitter.prototype.removeListener=Emitter.prototype.removeAllListeners=Emitter.prototype.removeEventListener=function(event,fn){this._callbacks=this._callbacks||{};// all
if(0==arguments.length){this._callbacks={};return this;}// specific event
var callbacks=this._callbacks[event];if(!callbacks)return this;// remove all handlers
if(1==arguments.length){delete this._callbacks[event];return this;}// remove specific handler
var cb;for(var i=0;i<callbacks.length;i++){cb=callbacks[i];if(cb===fn||cb.fn===fn){callbacks.splice(i,1);break;}}return this;};/**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */Emitter.prototype.emit=function(event){this._callbacks=this._callbacks||{};var args=[].slice.call(arguments,1),callbacks=this._callbacks[event];if(callbacks){callbacks=callbacks.slice(0);for(var i=0,len=callbacks.length;i<len;++i){callbacks[i].apply(this,args);}}return this;};/**
   * clear all of callbacks.
   *
   * @api public
   */Emitter.prototype.clear=function(){this._callbacks={};};/**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */Emitter.prototype.listeners=function(event){this._callbacks=this._callbacks||{};return this._callbacks[event]||[];};/**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */Emitter.prototype.hasListeners=function(event){return!!this.listeners(event).length;};if(typeof window!="undefined"){window.EventEmitter=Emitter;}})();(function(exports,ByteArray,global){var Protocol=exports;var PKG_HEAD_BYTES=4;var MSG_FLAG_BYTES=1;var MSG_ROUTE_CODE_BYTES=2;var MSG_ID_MAX_BYTES=5;var MSG_ROUTE_LEN_BYTES=1;var MSG_ROUTE_CODE_MAX=0xffff;var MSG_COMPRESS_ROUTE_MASK=0x1;var MSG_TYPE_MASK=0x7;var Package=Protocol.Package={};var Message=Protocol.Message={};Package.TYPE_HANDSHAKE=1;Package.TYPE_HANDSHAKE_ACK=2;Package.TYPE_HEARTBEAT=3;Package.TYPE_DATA=4;Package.TYPE_KICK=5;Message.TYPE_REQUEST=0;Message.TYPE_NOTIFY=1;Message.TYPE_RESPONSE=2;Message.TYPE_PUSH=3;/**
   * pomele client encode
   * id message id;
   * route message route
   * msg message body
   * socketio current support string
   */Protocol.strencode=function(str){var byteArray=new ByteArray(str.length*3);var offset=0;for(var i=0;i<str.length;i++){var charCode=str.charCodeAt(i);var codes=null;if(charCode<=0x7f){codes=[charCode];}else if(charCode<=0x7ff){codes=[0xc0|charCode>>6,0x80|charCode&0x3f];}else{codes=[0xe0|charCode>>12,0x80|(charCode&0xfc0)>>6,0x80|charCode&0x3f];}for(var j=0;j<codes.length;j++){byteArray[offset]=codes[j];++offset;}}var _buffer=new ByteArray(offset);copyArray(_buffer,0,byteArray,0,offset);return _buffer;};/**
   * client decode
   * msg String data
   * return Message Object
   */Protocol.strdecode=function(buffer){var bytes=new ByteArray(buffer);var array=[];var offset=0;var charCode=0;var end=bytes.length;while(offset<end){if(bytes[offset]<128){charCode=bytes[offset];offset+=1;}else if(bytes[offset]<224){charCode=((bytes[offset]&0x3f)<<6)+(bytes[offset+1]&0x3f);offset+=2;}else{charCode=((bytes[offset]&0x0f)<<12)+((bytes[offset+1]&0x3f)<<6)+(bytes[offset+2]&0x3f);offset+=3;}array.push(charCode);}return String.fromCharCode.apply(null,array);};/**
   * Package protocol encode.
   *
   * Toppoker package format:
   * +------+-------------+------------------+
   * | type | body length |       body       |
   * +------+-------------+------------------+
   *
   * Head: 4bytes
   *   0: package type,
   *      1 - handshake,
   *      2 - handshake ack,
   *      3 - heartbeat,
   *      4 - data
   *      5 - kick
   *   1 - 3: big-endian body length
   * Body: body length bytes
   *
   * @param  {Number}    type   package type
   * @param  {ByteArray} body   body content in bytes
   * @return {ByteArray}        new byte array that contains encode result
   */Package.encode=function(type,body){var length=body?body.length:0;var buffer=new ByteArray(PKG_HEAD_BYTES+length);var index=0;buffer[index++]=type&0xff;buffer[index++]=length>>16&0xff;buffer[index++]=length>>8&0xff;buffer[index++]=length&0xff;if(body){copyArray(buffer,index,body,0,length);}return buffer;};/**
   * Package protocol decode.
   * See encode for package format.
   *
   * @param  {ByteArray} buffer byte array containing package content
   * @return {Object}           {type: package type, buffer: body byte array}
   */Package.decode=function(buffer){var offset=0;var bytes=new ByteArray(buffer);var length=0;var rs=[];while(offset<bytes.length){var type=bytes[offset++];length=(bytes[offset++]<<16|bytes[offset++]<<8|bytes[offset++])>>>0;var body=length?new ByteArray(length):null;copyArray(body,0,bytes,offset,length);offset+=length;rs.push({'type':type,'body':body});}return rs.length===1?rs[0]:rs;};/**
   * Message protocol encode.
   *
   * @param  {Number} id            message id
   * @param  {Number} type          message type
   * @param  {Number} compressRoute whether compress route
   * @param  {Number|String} route  route code or route string
   * @param  {Buffer} msg           message body bytes
   * @return {Buffer}               encode result
   */Message.encode=function(id,type,compressRoute,route,msg){// caculate message max length
var idBytes=msgHasId(type)?caculateMsgIdBytes(id):0;var msgLen=MSG_FLAG_BYTES+idBytes;if(msgHasRoute(type)){if(compressRoute){if(typeof route!=='number'){throw new Error('error flag for number route!');}msgLen+=MSG_ROUTE_CODE_BYTES;}else{msgLen+=MSG_ROUTE_LEN_BYTES;if(route){route=Protocol.strencode(route);if(route.length>255){throw new Error('route maxlength is overflow');}msgLen+=route.length;}}}if(msg){msgLen+=msg.length;}var buffer=new ByteArray(msgLen);var offset=0;// add flag
offset=encodeMsgFlag(type,compressRoute,buffer,offset);// add message id
if(msgHasId(type)){offset=encodeMsgId(id,buffer,offset);}// add route
if(msgHasRoute(type)){offset=encodeMsgRoute(compressRoute,route,buffer,offset);}// add body
if(msg){offset=encodeMsgBody(msg,buffer,offset);}return buffer;};/**
   * Message protocol decode.
   *
   * @param  {Buffer|Uint8Array} buffer message bytes
   * @return {Object}            message object
   */Message.decode=function(buffer){var bytes=new ByteArray(buffer);var bytesLen=bytes.length||bytes.byteLength;var offset=0;var id=0;var route=null;// parse flag
var flag=bytes[offset++];var compressRoute=flag&MSG_COMPRESS_ROUTE_MASK;var type=flag>>1&MSG_TYPE_MASK;// parse id
if(msgHasId(type)){var m=parseInt(bytes[offset]);var i=0;do{var m=parseInt(bytes[offset]);id=id+(m&0x7f)*Math.pow(2,7*i);offset++;i++;}while(m>=128);}// parse route
if(msgHasRoute(type)){if(compressRoute){route=bytes[offset++]<<8|bytes[offset++];}else{var routeLen=bytes[offset++];if(routeLen){route=new ByteArray(routeLen);copyArray(route,0,bytes,offset,routeLen);route=Protocol.strdecode(route);}else{route='';}offset+=routeLen;}}// parse body
var bodyLen=bytesLen-offset;var body=new ByteArray(bodyLen);copyArray(body,0,bytes,offset,bodyLen);return{'id':id,'type':type,'compressRoute':compressRoute,'route':route,'body':body};};var copyArray=function(dest,doffset,src,soffset,length){if('function'===typeof src.copy){// Buffer
src.copy(dest,doffset,soffset,soffset+length);}else{// Uint8Array
for(var index=0;index<length;index++){dest[doffset++]=src[soffset++];}}};var msgHasId=function(type){return type===Message.TYPE_REQUEST||type===Message.TYPE_RESPONSE;};var msgHasRoute=function(type){return type===Message.TYPE_REQUEST||type===Message.TYPE_NOTIFY||type===Message.TYPE_PUSH;};var caculateMsgIdBytes=function(id){var len=0;do{len+=1;id>>=7;}while(id>0);return len;};var encodeMsgFlag=function(type,compressRoute,buffer,offset){if(type!==Message.TYPE_REQUEST&&type!==Message.TYPE_NOTIFY&&type!==Message.TYPE_RESPONSE&&type!==Message.TYPE_PUSH){throw new Error('unkonw message type: '+type);}buffer[offset]=type<<1|(compressRoute?1:0);return offset+MSG_FLAG_BYTES;};var encodeMsgId=function(id,buffer,offset){do{var tmp=id%128;var next=Math.floor(id/128);if(next!==0){tmp=tmp+128;}buffer[offset++]=tmp;id=next;}while(id!==0);return offset;};var encodeMsgRoute=function(compressRoute,route,buffer,offset){if(compressRoute){if(route>MSG_ROUTE_CODE_MAX){throw new Error('route number is overflow');}buffer[offset++]=route>>8&0xff;buffer[offset++]=route&0xff;}else{if(route){buffer[offset++]=route.length&0xff;copyArray(buffer,offset,route,0,route.length);offset+=route.length;}else{buffer[offset++]=0;}}return offset;};var encodeMsgBody=function(msg,buffer,offset){copyArray(buffer,offset,msg,0,msg.length);return offset+msg.length;};// module.exports = Protocol;
if(typeof window!="undefined"){window.Protocol=Protocol;}})(typeof window=="undefined"?module.exports:{},typeof window=="undefined"?Buffer:Uint8Array,this);/* ProtocolBuffer client 0.1.0*/ /**
 * toppoker-protobuf
 */ /**
 * Protocol buffer root
 * In browser, it will be window.protbuf
 */(function(exports,global){var Protobuf=exports;Protobuf.init=function(opts){//On the serverside, use serverProtos to encode messages send to client
Protobuf.encoder.init(opts.encoderProtos);//On the serverside, user clientProtos to decode messages receive from clients
Protobuf.decoder.init(opts.decoderProtos);};Protobuf.encode=function(key,msg){return Protobuf.encoder.encode(key,msg);};Protobuf.decode=function(key,msg){return Protobuf.decoder.decode(key,msg);};// exports to support for components
// module.exports = Protobuf;
if(typeof window!="undefined"){window.protobuf=Protobuf;}})(typeof window=="undefined"?module.exports:{},this);/**
 * constants
 */(function(exports,global){var constants=exports.constants={};constants.TYPES={uInt32:0,sInt32:0,int32:0,double:1,string:2,message:2,float:5};})('undefined'!==typeof protobuf?protobuf:module.exports,this);/**
 * util module
 */(function(exports,global){var Util=exports.util={};Util.isSimpleType=function(type){return type==='uInt32'||type==='sInt32'||type==='int32'||type==='uInt64'||type==='sInt64'||type==='float'||type==='double';};})('undefined'!==typeof protobuf?protobuf:module.exports,this);/**
 * codec module
 */(function(exports,global){var Codec=exports.codec={};var buffer=new ArrayBuffer(8);var float32Array=new Float32Array(buffer);var float64Array=new Float64Array(buffer);var uInt8Array=new Uint8Array(buffer);Codec.encodeUInt32=function(n){var n=parseInt(n);if(isNaN(n)||n<0){return null;}var result=[];do{var tmp=n%128;var next=Math.floor(n/128);if(next!==0){tmp=tmp+128;}result.push(tmp);n=next;}while(n!==0);return result;};Codec.encodeSInt32=function(n){var n=parseInt(n);if(isNaN(n)){return null;}n=n<0?Math.abs(n)*2-1:n*2;return Codec.encodeUInt32(n);};Codec.decodeUInt32=function(bytes){var n=0;for(var i=0;i<bytes.length;i++){var m=parseInt(bytes[i]);n=n+(m&0x7f)*Math.pow(2,7*i);if(m<128){return n;}}return n;};Codec.decodeSInt32=function(bytes){var n=this.decodeUInt32(bytes);var flag=n%2===1?-1:1;n=(n%2+n)/2*flag;return n;};Codec.encodeFloat=function(float){float32Array[0]=float;return uInt8Array;};Codec.decodeFloat=function(bytes,offset){if(!bytes||bytes.length<offset+4){return null;}for(var i=0;i<4;i++){uInt8Array[i]=bytes[offset+i];}return float32Array[0];};Codec.encodeDouble=function(double){float64Array[0]=double;return uInt8Array.subarray(0,8);};Codec.decodeDouble=function(bytes,offset){if(!bytes||bytes.length<offset+8){return null;}for(var i=0;i<8;i++){uInt8Array[i]=bytes[offset+i];}return float64Array[0];};Codec.encodeStr=function(bytes,offset,str){for(var i=0;i<str.length;i++){var code=str.charCodeAt(i);var codes=encode2UTF8(code);for(var j=0;j<codes.length;j++){bytes[offset]=codes[j];offset++;}}return offset;};/**
   * Decode string from utf8 bytes
   */Codec.decodeStr=function(bytes,offset,length){var array=[];var end=offset+length;while(offset<end){var code=0;if(bytes[offset]<128){code=bytes[offset];offset+=1;}else if(bytes[offset]<224){code=((bytes[offset]&0x3f)<<6)+(bytes[offset+1]&0x3f);offset+=2;}else{code=((bytes[offset]&0x0f)<<12)+((bytes[offset+1]&0x3f)<<6)+(bytes[offset+2]&0x3f);offset+=3;}array.push(code);}var str='';for(var i=0;i<array.length;){str+=String.fromCharCode.apply(null,array.slice(i,i+10000));i+=10000;}return str;};/**
   * Return the byte length of the str use utf8
   */Codec.byteLength=function(str){if(typeof str!=='string'){return-1;}var length=0;for(var i=0;i<str.length;i++){var code=str.charCodeAt(i);length+=codeLength(code);}return length;};/**
   * Encode a unicode16 char code to utf8 bytes
   */function encode2UTF8(charCode){if(charCode<=0x7f){return[charCode];}else if(charCode<=0x7ff){return[0xc0|charCode>>6,0x80|charCode&0x3f];}else{return[0xe0|charCode>>12,0x80|(charCode&0xfc0)>>6,0x80|charCode&0x3f];}}function codeLength(code){if(code<=0x7f){return 1;}else if(code<=0x7ff){return 2;}else{return 3;}}})('undefined'!==typeof protobuf?protobuf:module.exports,this);/**
 * encoder module
 */(function(exports,global){var protobuf=exports;var MsgEncoder=exports.encoder={};var codec=protobuf.codec;var constant=protobuf.constants;var util=protobuf.util;MsgEncoder.init=function(protos){this.protos=protos||{};};MsgEncoder.encode=function(route,msg){//Get protos from protos map use the route as key
var protos=this.protos[route];//Check msg
if(!checkMsg(msg,protos)){return null;}//Set the length of the buffer 2 times bigger to prevent overflow
var length=codec.byteLength(JSON.stringify(msg));//Init buffer and offset
var buffer=new ArrayBuffer(length);var uInt8Array=new Uint8Array(buffer);var offset=0;if(!!protos){offset=encodeMsg(uInt8Array,offset,protos,msg);if(offset>0){return uInt8Array.subarray(0,offset);}}return null;};/**
   * Check if the msg follow the defination in the protos
   */function checkMsg(msg,protos){if(!protos){return false;}for(var name in protos){var proto=protos[name];//All required element must exist
switch(proto.option){case'required':if(typeof msg[name]==='undefined'){console.warn('no property exist for required! name: %j, proto: %j, msg: %j',name,proto,msg);return false;}case'optional':if(typeof msg[name]!=='undefined'){var message=protos.__messages[proto.type]||MsgEncoder.protos['message '+proto.type];if(!!message&&!checkMsg(msg[name],message)){console.warn('inner proto error! name: %j, proto: %j, msg: %j',name,proto,msg);return false;}}break;case'repeated'://Check nest message in repeated elements
var message=protos.__messages[proto.type]||MsgEncoder.protos['message '+proto.type];if(!!msg[name]&&!!message){for(var i=0;i<msg[name].length;i++){if(!checkMsg(msg[name][i],message)){return false;}}}break;}}return true;}function encodeMsg(buffer,offset,protos,msg){for(var name in msg){if(!!protos[name]){var proto=protos[name];switch(proto.option){case'required':case'optional':offset=writeBytes(buffer,offset,encodeTag(proto.type,proto.tag));offset=encodeProp(msg[name],proto.type,offset,buffer,protos);break;case'repeated':if(msg[name].length>0){offset=encodeArray(msg[name],proto,offset,buffer,protos);}break;}}}return offset;}function encodeProp(value,type,offset,buffer,protos){switch(type){case'uInt32':offset=writeBytes(buffer,offset,codec.encodeUInt32(value));break;case'int32':case'sInt32':offset=writeBytes(buffer,offset,codec.encodeSInt32(value));break;case'float':writeBytes(buffer,offset,codec.encodeFloat(value));offset+=4;break;case'double':writeBytes(buffer,offset,codec.encodeDouble(value));offset+=8;break;case'string':var length=codec.byteLength(value);//Encode length
offset=writeBytes(buffer,offset,codec.encodeUInt32(length));//write string
codec.encodeStr(buffer,offset,value);offset+=length;break;default:var message=protos.__messages[type]||MsgEncoder.protos['message '+type];if(!!message){//Use a tmp buffer to build an internal msg
var tmpBuffer=new ArrayBuffer(codec.byteLength(JSON.stringify(value))*2);var length=0;length=encodeMsg(tmpBuffer,length,message,value);//Encode length
offset=writeBytes(buffer,offset,codec.encodeUInt32(length));//contact the object
for(var i=0;i<length;i++){buffer[offset]=tmpBuffer[i];offset++;}}break;}return offset;}/**
   * Encode reapeated properties, simple msg and object are decode differented
   */function encodeArray(array,proto,offset,buffer,protos){var i=0;if(util.isSimpleType(proto.type)){offset=writeBytes(buffer,offset,encodeTag(proto.type,proto.tag));offset=writeBytes(buffer,offset,codec.encodeUInt32(array.length));for(i=0;i<array.length;i++){offset=encodeProp(array[i],proto.type,offset,buffer);}}else{for(i=0;i<array.length;i++){offset=writeBytes(buffer,offset,encodeTag(proto.type,proto.tag));offset=encodeProp(array[i],proto.type,offset,buffer,protos);}}return offset;}function writeBytes(buffer,offset,bytes){for(var i=0;i<bytes.length;i++,offset++){buffer[offset]=bytes[i];}return offset;}function encodeTag(type,tag){var value=constant.TYPES[type]||2;return codec.encodeUInt32(tag<<3|value);}})('undefined'!==typeof protobuf?protobuf:module.exports,this);/**
 * decoder module
 */(function(exports,global){var protobuf=exports;var MsgDecoder=exports.decoder={};var codec=protobuf.codec;var util=protobuf.util;var buffer;var offset=0;MsgDecoder.init=function(protos){this.protos=protos||{};};MsgDecoder.setProtos=function(protos){if(!!protos){this.protos=protos;}};MsgDecoder.decode=function(route,buf){var protos=this.protos[route];buffer=buf;offset=0;if(!!protos){return decodeMsg({},protos,buffer.length);}return null;};function decodeMsg(msg,protos,length){while(offset<length){var head=getHead();var type=head.type;var tag=head.tag;var name=protos.__tags[tag];switch(protos[name].option){case'optional':case'required':msg[name]=decodeProp(protos[name].type,protos);break;case'repeated':if(!msg[name]){msg[name]=[];}decodeArray(msg[name],protos[name].type,protos);break;}}return msg;}/**
   * Test if the given msg is finished
   */function isFinish(msg,protos){return!protos.__tags[peekHead().tag];}/**
   * Get property head from protobuf
   */function getHead(){var tag=codec.decodeUInt32(getBytes());return{type:tag&0x7,tag:tag>>3};}/**
   * Get tag head without move the offset
   */function peekHead(){var tag=codec.decodeUInt32(peekBytes());return{type:tag&0x7,tag:tag>>3};}function decodeProp(type,protos){switch(type){case'uInt32':return codec.decodeUInt32(getBytes());case'int32':case'sInt32':return codec.decodeSInt32(getBytes());case'float':var float=codec.decodeFloat(buffer,offset);offset+=4;return float;case'double':var double=codec.decodeDouble(buffer,offset);offset+=8;return double;case'string':var length=codec.decodeUInt32(getBytes());var str=codec.decodeStr(buffer,offset,length);offset+=length;return str;default:var message=protos&&(protos.__messages[type]||MsgDecoder.protos['message '+type]);if(!!message){var length=codec.decodeUInt32(getBytes());var msg={};decodeMsg(msg,message,offset+length);return msg;}break;}}function decodeArray(array,type,protos){if(util.isSimpleType(type)){var length=codec.decodeUInt32(getBytes());for(var i=0;i<length;i++){array.push(decodeProp(type));}}else{array.push(decodeProp(type,protos));}}function getBytes(flag){var bytes=[];var pos=offset;flag=flag||false;var b;do{b=buffer[pos];bytes.push(b);pos++;}while(b>=128);if(!flag){offset=pos;}return bytes;}function peekBytes(){return getBytes(true);}})('undefined'!==typeof protobuf?protobuf:module.exports,this);cc.Toppoker=function(){var JS_WS_CLIENT_TYPE='js-websocket';var JS_WS_CLIENT_VERSION='0.0.1';var Protocol=window.Protocol;var protobuf=window.protobuf;var decodeIO_protobuf=window.decodeIO_protobuf;var decodeIO_encoder=null;var decodeIO_decoder=null;var Package=Protocol.Package;var Message=Protocol.Message;var EventEmitter=window.EventEmitter;var rsa=window.rsa;var disconnectCb=null;if(typeof window!="undefined"&&typeof sys!='undefined'&&sys.localStorage){window.localStorage=sys.localStorage;}var RES_OK=200;var RES_FAIL=500;var RES_OLD_CLIENT=501;if(typeof Object.create!=='function'){Object.create=function(o){function F(){}F.prototype=o;return new F();};}var root=window;var toppoker=Object.create(EventEmitter.prototype);// object extend from object
var socket=null;var reqId=0;var callbacks={};var handlers={};//Map from request id to route
var routeMap={};var dict={};// route string to code
var abbrs={};// code to route string
var serverProtos={};var clientProtos={};var protoVersion=0;var heartbeatInterval=0;var heartbeatTimeout=0;var nextHeartbeatTimeout=0;var gapThreshold=100;// heartbeat gap threashold
var heartbeatId=null;var heartbeatTimeoutId=null;var handshakeCallback=null;var decode=null;var encode=null;var reconnect=false;var reconncetTimer=null;var reconnectUrl=null;var reconnectAttempts=0;var reconnectionDelay=5000;var DEFAULT_MAX_RECONNECT_ATTEMPTS=10;var useCrypto;var handshakeBuffer={'sys':{type:JS_WS_CLIENT_TYPE,version:JS_WS_CLIENT_VERSION,rsa:{}},'user':{}};var initCallback=null;toppoker.init=function(params,cb){initCallback=cb;var host=params.host;var port=params.port;var type=params.type||'ws';encode=params.encode||defaultEncode;decode=params.decode||defaultDecode;// var url = 'wss://' + host;
var url=type+'://'+host;if(port){// url +=  ':' + port;
url+='/'+port;}handshakeBuffer.user=params.user;if(params.encrypt){useCrypto=true;rsa.generate(1024,"10001");var data={rsa_n:rsa.n.toString(16),rsa_e:rsa.e};handshakeBuffer.sys.rsa=data;}handshakeCallback=params.handshakeCallback;connect(params,url,cb);};var defaultDecode=toppoker.decode=function(data){//probuff decode
var msg=Message.decode(data);if(msg.id>0){msg.route=routeMap[msg.id];delete routeMap[msg.id];if(!msg.route){return;}}msg.body=deCompose(msg);return msg;};var defaultEncode=toppoker.encode=function(reqId,route,msg){var type=reqId?Message.TYPE_REQUEST:Message.TYPE_NOTIFY;//compress message by protobuf
if(protobuf&&clientProtos[route]){msg=protobuf.encode(route,msg);}else if(decodeIO_encoder&&decodeIO_encoder.lookup(route)){var Builder=decodeIO_encoder.build(route);msg=new Builder(msg).encodeNB();}else{msg=Protocol.strencode(JSON.stringify(msg));}var compressRoute=0;if(dict&&dict[route]){route=dict[route];compressRoute=1;}return Message.encode(reqId,type,compressRoute,route,msg);};var connect=function(params,url,cb){console.log('connect to '+url);var params=params||{};var maxReconnectAttempts=params.maxReconnectAttempts||DEFAULT_MAX_RECONNECT_ATTEMPTS;reconnectUrl=url;//Add protobuf version
if(window.localStorage&&window.localStorage.getItem('protos')&&protoVersion===0){var protos=JSON.parse(window.localStorage.getItem('protos'));protoVersion=protos.version||0;serverProtos=protos.server||{};clientProtos=protos.client||{};if(!!protobuf){protobuf.init({encoderProtos:clientProtos,decoderProtos:serverProtos});}if(!!decodeIO_protobuf){decodeIO_encoder=decodeIO_protobuf.loadJson(clientProtos);decodeIO_decoder=decodeIO_protobuf.loadJson(serverProtos);}}//Set protoversion
handshakeBuffer.sys.protoVersion=protoVersion;var onopen=function(event){if(!!reconnect){toppoker.emit('reconnect');}reset();var obj=Package.encode(Package.TYPE_HANDSHAKE,Protocol.strencode(JSON.stringify(handshakeBuffer)));send(obj);};var onmessage=function(event){processPackage(Package.decode(event.data),cb);// new package arrived, update the heartbeat timeout
if(heartbeatTimeout){nextHeartbeatTimeout=Date.now()+heartbeatTimeout;}};var onerror=function(event){toppoker.emit('io-error',event);};var onclose=function(event){toppoker.emit('close',event);toppoker.emit('disconnect',event);if(!!params.reconnect&&reconnectAttempts<maxReconnectAttempts){reconnect=true;reconnectAttempts++;reconncetTimer=setTimeout(function(){connect(params,reconnectUrl,cb);},reconnectionDelay);reconnectionDelay*=2;}socket=null;disconnectCb&&disconnectCb();disconnectCb=null;};socket=new WebSocket(url);socket.binaryType='arraybuffer';socket.onopen=onopen;socket.onmessage=onmessage;socket.onerror=onerror;socket.onclose=onclose;};toppoker.disconnect=function(cb){disconnectCb=cb;if(socket){if(socket.disconnect)socket.disconnect();if(socket.close)socket.close();console.log('disconnect');socket=null;}if(heartbeatId){clearTimeout(heartbeatId);heartbeatId=null;}if(heartbeatTimeoutId){clearTimeout(heartbeatTimeoutId);heartbeatTimeoutId=null;}};var reset=function(){reconnect=false;reconnectionDelay=1000*5;reconnectAttempts=0;clearTimeout(reconncetTimer);};toppoker.request=function(route,msg,cb){if(arguments.length===2&&typeof msg==='function'){cb=msg;msg={};}else{msg=msg||{};}route=route||msg.route;if(!route){return;}reqId++;sendMessage(reqId,route,msg);callbacks[reqId]=cb;routeMap[reqId]=route;};toppoker.notify=function(route,msg){msg=msg||{};sendMessage(0,route,msg);};var sendMessage=function(reqId,route,msg){if(useCrypto){msg=JSON.stringify(msg);var sig=rsa.signString(msg,"sha256");msg=JSON.parse(msg);msg['__crypto__']=sig;}if(encode){msg=encode(reqId,route,msg);}var packet=Package.encode(Package.TYPE_DATA,msg);send(packet);};var send=function(packet){socket?.send(packet.buffer);};var handler={};var heartbeat=function(data){if(!heartbeatInterval){// no heartbeat
return;}var obj=Package.encode(Package.TYPE_HEARTBEAT);if(heartbeatTimeoutId){clearTimeout(heartbeatTimeoutId);heartbeatTimeoutId=null;}if(heartbeatId){// already in a heartbeat interval
return;}heartbeatId=setTimeout(function(){heartbeatId=null;send(obj);nextHeartbeatTimeout=Date.now()+heartbeatTimeout;heartbeatTimeoutId=setTimeout(heartbeatTimeoutCb,heartbeatTimeout);},heartbeatInterval);};var heartbeatTimeoutCb=function(){var gap=nextHeartbeatTimeout-Date.now();if(gap>gapThreshold){heartbeatTimeoutId=setTimeout(heartbeatTimeoutCb,gap);}else{toppoker.emit('heartbeat timeout');toppoker.disconnect();}};var handshake=function(data){data=JSON.parse(Protocol.strdecode(data));if(data.code===RES_OLD_CLIENT){toppoker.emit('error','client version not fullfill');return;}if(data.code!==RES_OK){toppoker.emit('error','handshake fail');return;}handshakeInit(data);var obj=Package.encode(Package.TYPE_HANDSHAKE_ACK);send(obj);if(initCallback){initCallback(socket);}};var onData=function(data){var msg=data;if(decode){msg=decode(msg);}processMessage(toppoker,msg);};var onKick=function(data){data=JSON.parse(Protocol.strdecode(data));toppoker.emit('onKick',data);};handlers[Package.TYPE_HANDSHAKE]=handshake;handlers[Package.TYPE_HEARTBEAT]=heartbeat;handlers[Package.TYPE_DATA]=onData;handlers[Package.TYPE_KICK]=onKick;var processPackage=function(msgs){if(Array.isArray(msgs)){for(var i=0;i<msgs.length;i++){var msg=msgs[i];handlers[msg.type](msg.body);}}else{handlers[msgs.type](msgs.body);}};var processMessage=function(toppoker,msg){if(!msg.id){// server push message
toppoker.emit(msg.route,msg.body);return;}//if have a id then find the callback function with the request
var cb=callbacks[msg.id];delete callbacks[msg.id];if(typeof cb!=='function'){return;}cb(msg.body);return;};var processMessageBatch=function(toppoker,msgs){for(var i=0,l=msgs.length;i<l;i++){processMessage(toppoker,msgs[i]);}};var deCompose=function(msg){var route=msg.route;//Decompose route from dict
if(msg.compressRoute){if(!abbrs[route]){return{};}route=msg.route=abbrs[route];}if(protobuf&&serverProtos[route]){return protobuf.decode(route,msg.body);}else if(decodeIO_decoder&&decodeIO_decoder.lookup(route)){return decodeIO_decoder.build(route).decode(msg.body);}else{return JSON.parse(Protocol.strdecode(msg.body));}return msg;};var handshakeInit=function(data){if(data.sys&&data.sys.heartbeat){heartbeatInterval=data.sys.heartbeat*1000;// heartbeat interval
heartbeatTimeout=heartbeatInterval*2;// max heartbeat timeout
}else{heartbeatInterval=0;heartbeatTimeout=0;}initData(data);if(typeof handshakeCallback==='function'){handshakeCallback(data.user);}};//Initilize data used in toppoker client
var initData=function(data){if(!data||!data.sys){return;}dict=data.sys.dict;var protos=data.sys.protos;//Init compress dict
if(dict){dict=dict;abbrs={};for(var route in dict){abbrs[dict[route]]=route;}}//Init protobuf protos
if(protos){protoVersion=protos.version||0;serverProtos=protos.server||{};clientProtos=protos.client||{};//Save protobuf protos to localStorage
window.localStorage.setItem('protos',JSON.stringify(protos));if(!!protobuf){protobuf.init({encoderProtos:protos.client,decoderProtos:protos.server});}if(!!decodeIO_protobuf){decodeIO_encoder=decodeIO_protobuf.loadJson(clientProtos);decodeIO_decoder=decodeIO_protobuf.loadJson(serverProtos);}}};return toppoker;};//
window.toppoker=new cc.Toppoker();}).call(root);})(// The environment-specific global.
function(){if(typeof globalThis!=='undefined')return globalThis;if(typeof self!=='undefined')return self;if(typeof window!=='undefined')return window;if(typeof global!=='undefined')return global;if(typeof this!=='undefined')return this;return{};}.call(this));