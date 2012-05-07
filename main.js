// Required by the current webkit implementation
var indexedDB = window.indexedDB || window.webkitIndexedDB;
if ('webkitIndexedDB' in window) {
    window.IDBKeyRange = window.webkitIDBKeyRange;
    window.IDBTransaction = window.webkitIDBTransaction;
    window.IDBKeyRangeeyRange = window.webkitIDBKeyRange;
}

// global objects
window.s = {}; // TODO: do something with this ugly `s` object :/
window.db = {
    name:"appsMonitor",
    _settings:"settings",
    _cache:"cache",

    h:null, // Handler to the db

    open:function(callback) { // opens db and assigns it to db.h (as in Handler); performs upgrade if needed
        var r = indexedDB.open( db.name );
        r.onupgradeneeded = function(e){ console.log(".onupgradeneeded is not yet supported by webkit"); };
        r.onsuccess = function(e){
            db.h = e.target.result;

            if(chrome.app.getDetails().version !== db.h.version) {

                var v = db.h.setVersion( chrome.app.getDetails().version );
                v.onsuccess = function(e) {
                    if(db.h.objectStoreNames.contains( db._settings )) db.h.deleteObjectStore( db._settings );
                    db.h.createObjectStore(db._settings, { keyPath:"name" });

                    if(db.h.objectStoreNames.contains( db._cache )) db.h.deleteObjectStore( db._cache );
                    db.h.createObjectStore(db._cache, { autoIncrement:true });
                };
                v.onfailure = db.onerror;
                v.onerror = db.onerror;
                v.onblocked = db.onerror;
            }
            if(typeof callback=="function") callback.call(window);
        };
        r.onfailure = db.onerror;
    },
    saveSettings:function(opts,value,arg3){ // saves settings posibilities: db.saveSettings("name","value", [callback]), db.saveSettings({name1:"val1",name2:false},[callback])
        var map = [],callback=null;
        if(typeof opts=="string"){
            map = [{name:opts, value:value}];
            if(typeof arg3=="function") callback=arg3;
        } else {
            for(i in opts) map.push({name:i,value:opts[i]});
            if(typeof value=="function") callback=value;
        }

        var t = db.h.transaction([db._settings], IDBTransaction.READ_WRITE),
            s = t.objectStore(db._settings);

        for( i in map){
            var r = s.put( map[i] );
            r.onsuccess = function(e){ console.log("SAVE success("+map[i].name+"=>"+map[i].value+")"); }
            r.onerror = function(e){ console.log("SAVE error("+map[i].name+"=>"+map[i].value+")"); }
        }
        if(callback!==null) callback.call(window);
    },
    removeSettings:function(name){ // remove object of given name
        var t = db.h.transaction([db._settings], IDBTransaction.READ_WRITE),
            s = t.objectStore(db._settings),
            r = s.delete(name);
        r.onsuccess = function(e){ console.log("DELETE success("+name+")"); }
        r.onerror = function(e){ console.log("DELETE error("+name+")"); }

    },
    getSettings:function(){ // updates options object
        var t = db.h.transaction([db._settings], IDBTransaction.READ_ONLY),
            s = t.objectStore(db._settings),
            keyRange = IDBKeyRange.lowerBound(0),
            cursorRequest = s.openCursor(keyRange),
            tmp = {};

        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if(!!result==false) {
                options.restore( tmp );
                if(window.s.get!=undefined)window.s.get();
                return;
            }
            tmp[result.value.name] = result.value.value;
            result.continue();
        }
        cursorRequest.onerror = db.onerror;
    },
    onerror:function(e){ // is called on error; TODO: improve error reporting here
        console.log("Masz blad debilu:");
        console.log(e);
    }
};
window.options = {
    level:{ v:null, d:0 },
    sms:{ v:null, d:1 }, // 1 vel auto
    dev:{ v:null, d:false },
    legacy:{ v:null, d:false },
    manual:{ v:null, d:false },
    days:{ v:null, d:2 },
    params:{ v:null, d:false },
    interval:{v:null, d:2 },
    get:function(arg0) { // if no arguments given - returns map, if valid key given returns it's value
        if(typeof arg0=="string")return(arg0 in this&&typeof this[arg0]!=="function")?(this[arg0].v!==null)?this[arg0].v:this[arg0].d:null;
        var r={};
        for(i in this)if(typeof this[i]!=='function'&&this[i].v!==null)r[i]=this[i].v;
        r.plugin=1; // is added here because it cannot be different -  unchangeable!!!
        return r;
    },
    restore:function(o){  // restores settings from db
        for(i in o)if(i in this)this[i].v=(o[i]!==this[i].d)?o[i]:null;
        if(s.restoreState!==undefined) s.restoreState.call(s,options.get()); // fired only on settings page
    },
    set:function(o,v){ // sets value in this object and saves to db
        if(o in this) {
            this[o].v =(this[o].d!==v)?v:null;
            if(this[o].v!==null) db.saveSettings(o,this[o].v);
            else db.removeSettings(o);
        }
    },
    url:{
        main:'http://facebook.webtop.pl/templates/tests/',
        test:'db_test.php',
        ajax:'do.php',
        for:function(i){return this.main+this[i];}
    }
};

function popup() {

    s = {
        get:function(callback){
            $.getJSON(options.url.for("test"), options.get(), function(data) {
                if(data.user==false) {
                    s.login.show();
                }
                if( callback!==undefined) callback.call(this);
                else s.raport.show(data);
                // TODO: check if successfully retrieved
            });
        },
        login:{
            show:function(){
                $('#loader').hide();
                $('#auth')
                    .show()
                    .unbind()
                    .submit(function(){
                        $('#loader').show();
                        s.login.auth.call(this);
                        return false;
                    });
            },
            auth:function(){
                $.post(options.url.for("ajax"), $(this).serialize(), function(data){
                    $('#loader').hide();
                    if(data.success) s.login.kill();
                    else {
                        s.login.show.call(this);
                        $('#quickInfo').show().children('span').text(data.cause);
                    }
                });
            },
            kill:function(){
                // TODO: copy cookie string to db, so that removing cookies won't really log out
                $('#auth').remove();
            }
        },
        raport:{
            show:function(data){
                // TODO: handle case where there's no data.error, but data.succes instead (?level=0&plugin=1)
                $('#loader').hide();
                if(data.error) {
                    chrome.browserAction.setIcon({path:'error.png'});
                    $('#quickInfo span').addClass('error').text('Wystąpił błąd!');
                } else {
                    chrome.browserAction.setIcon({path:'icon.png'});
                    $('#quickInfo span').addClass('success').text('Wszystko jest OK. ');
                }

                if(data.url!=undefined){
                    $('#quickInfo a')
                        .text('więcej informacji').attr('href',data.url)
                        .click(function(){
                            window.open($(this).attr('href'));
                        });
                } else $('#quickInfo a').hide();

                $('#quickInfo').show();
            }
        }
    }
}
function settings() {
    s = {
        level:[
            "Tylko stan",
            " + Podstawowe info",
            "Całkiem sporo",
            " + czasy wykonań"
        ],
        sms:[
            "Zawsze Wyłączone",
            "Automatycznie",
            "Zawsze Włączone"
        ],
        interval:[
            "Tylko na żądanie",
            "co 7 sekund",
            "co 42 sekundy",
            "co 7 minut",
            "co 42 minuty",
            "co 84 minuty"
        ],
        days:"dni",
        manual:["Nie","Tak,"],
        dev:["Nie","Tak,"],
        legacy:["Nie","Tak,"],
        params:["Nie","Tak,"],
        restoreState:function(o){
            for(i in o) {
                var $n = $("#"+i);
                if($n.attr('type')=="range") $n.val(o[i]+parseInt($n.attr("min")));
                else $n.prop("checked",o[i]);
            }
            this.fixLabels();
        },
        fixLabel:function( onchange ){
            if($(this).attr('type')=="range"){
                var label="",
                    min=$(this).attr('min'),
                    n=$(this).parent().attr('title'),
                    j=parseInt($(this).val()),
                    i=j-min; // it's a fix for when min!=0

                if(typeof s[n]==="object") do label=s[n][j-min]+label;while(label[1]==="+"&&--j>=0);
                else label=j+s[n];

                $(this).siblings('label').text(label);
            } else if($(this).attr('type')=="checkbox") {
                var n=$(this).attr('name'),
                    i=s[n].val=Boolean($(this).filter(":checked").length); // TODO: save to options instead

                $(this).siblings('label').children('.curr').text(s[n][(i)?1:0]);
            } else return false;

            if(onchange===true) options.set(n,i);
        },
        fixLabels:function(){
            for(i in this) if(typeof i !="function") this.fixLabel.call( $('#'+i),false );
        }
    }

    $('input').change(function(){ s.fixLabel.call( $(this), true ); });
}
function background(){
    var check = function(){
        $.getJSON(options.url.for("test"), $.extend(options.get(),{level:0}), function(data) { // always use lowest level for better performance
            if( data.error ) chrome.browserAction.setIcon({path:'error.png'});
            else chrome.browserAction.setIcon({path:'icon.png'});
        });
    },
    int = setInterval(check,42000);
}

function init(){
    db.getSettings();

    if( $('body#popup').length ) popup();
    else if( $('body#settings').length ) settings();
    else background();
}

$(function(){
    db.open( init ); // run init after db is available
});
