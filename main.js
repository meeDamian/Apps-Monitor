$(function(){
    $.get('http://facebook.webtop.pl/templates/tests/db_test.php',{level:3},function(data){
        if(data.error===undefined) {
            $('#auth').submit(function(){
                $('#loader').show();
                $.post('http://facebook.webtop.pl/templates/tests/jx/do.php',$(this).serialize(),function(data){
                    $('#loader').hide();
                    if(!data.success) $('#quickInfo').show().children('span').text(data.cause);
                    else { }
                });
                return false;
            });
        } else {
            $('#loader,#auth').remove();
            if(data.error) $('#quickInfo span').addClass('error').text('Wystąpił błąd!');
            else $('#quickInfo span').addClass('success').text('Wszystko jest OK. ');

            $('#quickInfo a').text('więcej informacji').attr('href',data.url)
                .click(function(){
                    window.open($(this).attr('href'));
                });
            $('#quickInfo').show();
        }

    });
});