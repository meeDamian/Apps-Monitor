// implement JSON.stringify serialization
// from: http://stackoverflow.com/questions/3593046/jquery-json-to-string
JSON.stringify = JSON.stringify || function (obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
        // simple data type
        if (t == "string") obj = '"'+obj+'"';
        return String(obj);
    } else {
        // recurse array or object
        var n, v, json = [], arr = (obj && obj.constructor == Array);
        for (n in obj) {
            v = obj[n]; t = typeof(v);
            if (t == "string") v = '"'+v+'"';
            else if (t == "object" && v !== null) v = JSON.stringify(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};

$(function(){
    $('#new_trigger').click(function(){
        $('#new_form').slideToggle();
    });
    
    $('#new_form').submit(function(){
        
        // save data
        tmp = new Object();
        tmp.name = $('#new_name').val();
        tmp.type = $('#new_type').val();
        tmp.url  = $('#new_url').val();
        
        if(localStorage.getItem('apps') !== null) {
            var added = jQuery.parseJSON(localStorage.getItem('apps'));
            console.log(added);
            console.log(tmp);
            
        }

        // stringize
        var result = JSON.stringify(tmp);
        localStorage.setItem('apps',result);
        
        // add new position in apps list
        $('#t_added .app').clone().appendTo($('#apps_list'));
        $('#apps_list:last').find('.app_name').html(tmp.name);
        $('#apps_list:last').find('.app_status').html("OK");
        $('#apps_added').show();
        
        // clear and hide form
        $('#new_name,#new_url,#new_type').val('');
        $('#new_form').slideUp();
        return false;
    });
    
    
    if(localStorage.getItem('apps') !== null) {
        console.log(localStorage.getItem('apps'));
        $('#apps_added').show();
    }
});