function popup() {
    s = {
        url:{
            main:'http://facebook.webtop.pl/templates/tests/',
            test:'db_test.php',
            ajax:'do.php',
            for:function(i){return this.main+this[i];}
        },
        opts: {
            level:1,    // default: 1
            sms:null,   // default: auto
            dev:null,   // default: false
            legacy:null,// default: false
            manual:null,// default: false
            days:null,  // default: 2
            params:null,// default: false
            _ret:function(){
                var r={};
                for(i in this)if(typeof this[i]!=='function'&&this[i]!==null)r[i]=this[i];
                r.plugin=1; // is added here because it cannot be differen unchangeable!!!
                return r;
            },
            _set:function(o){for(i in o)if(i in this)this[i]=o[i];} // o is settings Object vel map
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
function prep_db2(){
    window.html5rocks = {};
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

    if ('webkitIndexedDB' in window) {
        window.IDBKeyRange = window.webkitIDBKeyRange;
        window.IDBTransaction = window.webkitIDBTransaction;
        window.IDBKeyRangeeyRange = window.webkitIDBKeyRange;
    }

    html5rocks.indexedDB = {
        db: null,
        onerror: function(e) {
            console.log(e);
        },
        open: function() {
            var request = indexedDB.open("todos");

            request.upgradeneeded = function(e){
                console.log("Upgrade that shit");
            }

            request.onsuccess = function(e) {
                var v = "1.99";
                html5rocks.indexedDB.db = e.target.result;
                var db = html5rocks.indexedDB.db;
                // We can only create Object stores in a setVersion transaction;
                if (v!= db.version) {
                    var setVrequest = db.setVersion(v);

                    // onsuccess is the only place we can create Object Stores
                    setVrequest.onerror = html5rocks.indexedDB.onerror;
                    setVrequest.onsuccess = function(e) {
                        if(db.objectStoreNames.contains("todo")) {
                            db.deleteObjectStore("todo");
                        }

                        var store = db.createObjectStore("todo", {keyPath: "timeStamp"});

                        html5rocks.indexedDB.getAllTodoItems();
                    };
                }
                else {
                    html5rocks.indexedDB.getAllTodoItems();
                }
            };

            request.onerror = html5rocks.indexedDB.onerror;
        },
        addTodo: function(todoText) {
            var db = html5rocks.indexedDB.db,
                trans = db.transaction(["todo"], IDBTransaction.READ_WRITE),
                store = trans.objectStore("todo"),

                data = {
                    "text": todoText,
                    "timeStamp": new Date().getTime()
                },
                request = store.put(data);

            request.onsuccess = function(e) {
                html5rocks.indexedDB.getAllTodoItems();
            };

            request.onerror = function(e) {
                console.log("Error Adding: ", e);
            };
        },
        deleteTodo: function(id) {
            var db = html5rocks.indexedDB.db,
                trans = db.transaction(["todo"], IDBTransaction.READ_WRITE),
                store = trans.objectStore("todo"),
                request = store.delete(id);

            request.onsuccess = function(e) {
                html5rocks.indexedDB.getAllTodoItems();
            };

            request.onerror = function(e) {
                console.log("Error Adding: ", e);
            };
        },
        getAllTodoItems: function() {

            var db = html5rocks.indexedDB.db,
                trans = db.transaction(["todo"], IDBTransaction.READ_WRITE),
                store = trans.objectStore("todo");

            // Get everything in the store;
            var keyRange = IDBKeyRange.lowerBound(0),
                cursorRequest = store.openCursor(keyRange);

            cursorRequest.onsuccess = function(e) {
                var result = e.target.result;
                if(!!result == false) return;

                console.log(result.value);
                result.continue();
            };

            cursorRequest.onerror = html5rocks.indexedDB.onerror;
        }
    };

    function init() {
        html5rocks.indexedDB.open();
    }

    window.addEventListener("DOMContentLoaded", init, false);
}
function prep_db() {

    // Required by the browser
    var indexedDB = window.indexedDB || window.webkitIndexedDB;
    if ('webkitIndexedDB' in window) {
        window.IDBKeyRange = window.webkitIDBKeyRange;
        window.IDBTransaction = window.webkitIDBTransaction;
        window.IDBKeyRangeeyRange = window.webkitIDBKeyRange;
    }

    // database object
    db = {
        h:null, // Handler to the db
        open:function() {
            var r = indexedDB.open("appsMonitor",3);

            // Not yet supported by webkit ;(
            r.onupgradeneeded = function(e){
                console.log("Upgrade that shit");
            }

            r.onsuccess = function(e){
                db.h = e.target.result;

                if(chrome.app.getDetails().version !== db.h.version) {

                    var v = db.h.setVersion( chrome.app.getDetails().version );
                    v.onsuccess = function(e) {

                        if(db.h.contains("settings")) db.h.deleteObjectStore("settings");
                        db.h.createObjectStore("settings", { autoIncrement:true });
                    };
                    v.onfailure = db.onerror;
                }

                // tmp
                db.saveSettings(db.nigga);
            }
            r.onfailure = db.onerror;
        },
        saveSettings:function(options,value){

            var map = {};
            if(typeof options=="string" && typeof value=="string") map[options]=value;
            else map = options;

            console.log(map);

            var t = db.h.transaction(["settings"], IDBTransaction.READ_WRITE),
                s = t.objectStore("settings"),
                r = s.put( map );

            r.onsuccess = function(e) {
                console.log("SAVE success");
            }
            r.onerror = function(e){
                console.log("SAVE error");
            }
        },
        addSetting:function(nanana){
            var trans = db.h.transaction(["appsMonitor"], IDBTransaction.READ_WRITE);
            var store = trans.objectStore("settings");
            var request = store.put({
                "text":nanana,
                "timestamp": new Date().getTime()
            });

            request.onsuccess = function(e) {
                db.getSettings();
            };

            request.onerror = function(e){
                console.log(e.value);
            }
        },
        clear:function(){
            
        },
        getSettings:function(){
            var trans = db.h.transaction(["appsMonitor"],IDBTransaction.READ_WRITE);
            var store = trans.objectStore("settings");

            var keyRange = IDBKeyRange.lowerBound(0);
            var cursorRequest = store.openCursor(keyRange);

            cursorRequest.onsuccess = function(e) {
                var result = e.target.result;
                if(!!result==false) return;

                console.log(result.value);
                result.continue();
            }

            cursorRequest.onerror = db.onerror;
        },
        deleteSetting:function(id) {
            var trans = db.h.transaction(["appsMonitor"], IDBTransaction.READ_WRITE);
            var store = trans.objectStore("settings");

            var request = store.delete(id);

            request.onsuccess = function(e) {
                db.getSettings();
            }

            request.onerror = function(e){
                console.log(e);
            }
        },
        onerror:function(e){
            console.log("Masz blad debilu:");
            console.log(e);
        },
        _init:function(){
            db.open();
        }
    };

    window.addEventListener("DOMContentLoaded", db._init, false);
    db.nigga = {"params":"true"};
}
var db={};

$(function(){
    var s;
    prep_db();

    if( $('body#popup').length ) popup();
    else if( $('body#settings').length ) settings();
    else background();
});
