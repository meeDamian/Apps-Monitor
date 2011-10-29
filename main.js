$(function(){
    $('#new_trigger').click(function(){
        $('#new_form').toggle();
    });
    
    $('#new_form').submit(function(){
        
        // save data
        tmp = new Array();
        tmp['name'] = $('#new_name').val();
        tmp['type'] = $('#new_type').val();
        tmp['url']  = $('#new_url').val();
        
        if(!localStorage.apps) localStorage.apps = JSON.stringify(tmp);
        else {
            tmpStorage = JSON.parse(localStorage.apps);
        }
        
        // clear form
        $('#new_name,#new_url,#new_type').val('');
        return false;
    });

    if(!localStorage.apps) localStorage.apps = Array();
    console.log(localStorage.apps);
});