// Required by the current webkit implementation
var indexedDB = window.indexedDB || window.webkitIndexedDB;
if ('webkitIndexedDB' in window) {
    window.IDBKeyRange = window.webkitIDBKeyRange;
    window.IDBTransaction = window.webkitIDBTransaction;
    window.IDBKeyRangeeyRange = window.webkitIDBKeyRange;
}

// database object
window.db = {
    name:"appsMonitor",
    _settings:"settings",
    _cache:"cache",

    h:null, // Handler to the db

    open:function() {
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
            db.getSettings();
        };
        r.onfailure = db.onerror;
    },
    saveSettings:function(options,value,arg3){

        var map = [],callback=null;
        if(typeof options=="string"){
            map = [{name:options, value:value}];
            if(typeof arg3=="function") callback=arg3;
        } else {
            for(i in options) map.push({name:i,value:options[i]});
            if(typeof value=="function") callback=value;
        }

        var t = db.h.transaction([db._settings], IDBTransaction.READ_WRITE),
            s = t.objectStore(db._settings);

        for( i in map){
            var r = s.put( map[i] );
            r.onsuccess = function(e){ console.log("SAVE success"); }
            r.onerror = function(e){ console.log("SAVE error"); }
        }
    },
    getSettings:function(){
        var t = db.h.transaction([db._settings], IDBTransaction.READ_ONLY),
            s = t.objectStore(db._settings),
            keyRange = IDBKeyRange.lowerBound(0),
            cursorRequest = s.openCursor(keyRange),
            tmp = {};

        cursorRequest.onsuccess = function(e) {

            var result = e.target.result;
            if(!!result==false) {
                options.set(tmp);
                return;
            }

            tmp[result.value.name] = result.value.value;

            result.continue();
        }

        cursorRequest.onerror = db.onerror;
    },
    onerror:function(e){
        console.log("Masz blad debilu:");
        console.log(e);
    },
    _init:function(){
        db.open();
    }
};
window.options = {
    level:{ v:null, d:0 },
    sms:{ v:null, d:"auto" },
    dev:{ v:null, d:false },
    legacy:{ v:null, d:false },
    manual:{ v:null, d:false },
    days:{ v:null, d:2 },
    params:{ v:null, d:false },
    get:function(arg0){
        if(typeof arg0=="string")return(arg0 in this&&typeof this[arg0]!=="function")?(this[arg0].v!==null)?this[arg0].v:this[arg0].d:null;
        var r={};
        for(i in this)if(typeof this[i]!=='function'&&this[i].v!==null)r[i]=this[i].v;
        r.plugin=1; // is added here because it cannot be different -  unchangeable!!!
        return r;
    },
    _set:function(o,o2){
        if(typeof o=="string") if(o in this) this[o].v=(o2!==this[o].d)?o2:null;
        else for(i in o) if(i in this) this[i].v=(o[i]!==this[i].d)?o[i]:null;
        
    },
    set:function(o){options._set(o);},
    save:function(which){
        if(typeof which=="string") db.saveSettings(which,this.get(which));
        else db.saveSettings(this.get());
    }
};

function popup() {
    
    s = {
        url:{
            main:'http://facebook.webtop.pl/templates/tests/',
            test:'db_test.php',
            ajax:'do.php',
            for:function(i){return this.main+this[i];}
        },
        opts: {
            level:{ v:1, d:1 },
            sms:{ v:null, d:"auto" },
            dev:{ v:null, d:false },
            legacy:{ v:null, d:false },
            manual:{ v:null, d:false },
            days:{ v:null, d:2 },
            params:{ v:null, d:false },
            _ret:function(){
                var r={};
                for(i in this)if(typeof this[i]!=='function'&&this[i].v!==null)r[i]=this[i].v;
                r.plugin=1; // is added here because it cannot be different -  unchangeable!!!
                return r;
            },
            _set:function(o){
                console.log(this);
                for(i in o)if(i in this) {
                    console.log(i+": "+this[i].v+"=>"+o[i]);
                    this[i].v=(o[i]!==this[i].d)?o[i]:null;
                }
            },
            set:function(o){
                console.log("AAA");
                s.opts._set(o);
            }
        },
        get:function(callback){
            $.getJSON(this.url.for("test"), this.opts._ret(), function(data) {
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
                $.post(s.url.for("ajax"), $(this).serialize(), function(data){
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
                $('#loader').hide();
                if(data.error) {
                    chrome.browserAction.setIcon({path:'error.png'});
                    $('#quickInfo span').addClass('error').text('Wystąpił błąd!');
                } else {
                    chrome.browserAction.setIcon({path:'icon.png'});
                    $('#quickInfo span').addClass('success').text('Wszystko jest OK. ');
                }

                $('#quickInfo a')
                    .text('więcej informacji').attr('href',data.url)
                    .click(function(){
                        window.open($(this).attr('href'));
                    });
                $('#quickInfo').show();
            }

        },
        init:function(opts) {
            if(opts!==undefined) this.opts._set(opts);
            this.get();
        }
    }

    // TODO: get database settings object here
    // TODO: s.init( db.settings_object );
    s.get();
}
function settings() {
    s = {
        level:{
            val:null,
            label:[
                "Malutko",
                "Całkiem sporo",
                " + czasy wykonań"
            ],
            set:function(v){
                this.val=v;
                // TODO: save to indexed db;
            }
        },
        sms:{
            val:null,
            label:[
                "Zawsze Wyłączone",
                "Automatycznie",
                "Zawsze Włączone"
            ]
        },
        days:{
            val:null,
            label:"dni"
        },
        manual:{
            val:null,
            label:["Nie","Tak,"]
        },
        dev:{
            val:null,
            label:["Nie","Tak,"]
        },
        legacy:{
            val:null,
            label:["Nie","Tak,"]
        },
        params:{
            val:null,
            label:["Nie","Tak,"]
        },
        restoreState:function(){

        }
    }

    $('input[type=range]').change(function(){
        var label="",
            min=$(this).attr('min'),
            n=$(this).parent().attr('title'),
            i=s[n].val=parseInt($(this).val());

        if(typeof s[n].label==="object") do label=s[n].label[i-min]+label;while(label[1]==="+"&&--i>0);
        else label=i+s[n].label;

        $(this).siblings('label').text(label);
    }).change();

    $('input[type=checkbox]').change(function(){
        var n=$(this).attr('name'),
         i=s[n].val=parseInt($(this).filter(":checked").length);
         $(this).siblings('label').children('.curr').text(s[n].label[i]);
    }).change();
}
function background(){
    return false;
    var check = function(){

        },
        int = setInterval(check,10000);
}

var s;

$(function(){

    if( $('body#popup').length ) popup();
    else if( $('body#settings').length ) settings();
    else background();

    window.addEventListener("DOMContentLoaded", db._init, false);
});
