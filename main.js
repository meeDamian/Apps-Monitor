var s = {
    url:{
        main:'http://facebook.webtop.pl/templates/tests/',
        test:'db_test.php',
        ajax:'do.php',
        for:function(i) {
            return this.main+this[i];
        }
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
            return r;
        },
        _set:function(o){for(i in o)if(i in this)this[i]=o[i];}
    },
    get:function(callback){
        $.get(this.url.for("test"), this.opts._ret(), function(data){
            console.log(data);
            if( callback!==undefined) callback.call(this);
        }).error(function(e){
            console.log(e);
        });
    },
    _init:function(opts) {
        if(opts!==undefined) this.opts._set(opts);
    }
}

$(function(){
    $.get(s.url.for("test"), s.opts._ret(), function(data){
        if(data.error===undefined) {
            $('#auth').submit(function(){
                $('#loader').show();
                $.post(s.url.for("ajax"),$(this).serialize(),function(data){
                    $('#loader').hide();
                    if(!data.success) $('#quickInfo').show().children('span').text(data.cause);
                    else { }
                });
                return false;
            });
        } else {
            $('#auth,#loader').remove();
            if(data.error) {
                chrome.browserAction.setIcon({path:'error.png'});
                $('#quickInfo span').addClass('error').text('Wystąpił błąd!');
            }else {
                chrome.browserAction.setIcon({path:'icon.png'});
                $('#quickInfo span').addClass('success').text('Wszystko jest OK. ');
            }

            $('#quickInfo a').text('więcej informacji').attr('href',data.url)
                .click(function(){
                    window.open($(this).attr('href'));
                });
            $('#quickInfo').show();
        }

    });
});