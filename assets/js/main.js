function MakeUserSubmission() {
    var url = $('input').val();
    var reg = /^(http|https):\/\/itunes/;
    
    return {
        "url": url,
        "isValidItunesUrl": reg.test(url),
        "getId": (function(){
            // Looks for '/id' followed by a number
            // i.e. '/id391810?mt=8' would return '391810'
            var id = url.match(/\/id(\d+)/i);
            if(id) {
                return id[1];
            } else {
                return false;
            }
        })
    }
}

var Gimmie = {
    $content: $('.content'),
    $form: $('form'),

    toggleLoading: function(){
        // Toggle loading indicator and form
        this.$content.toggleClass('content--loading');
        this.$form.find('button').prop('disabled', function(i, v) { return !v; });
    },

    throwError: function(text){
        // Remove animation class
        this.$content.removeClass('content--error-pop');
        
        // Trigger reflow
        // https://css-tricks.com/restart-css-animation/
        this.$content[0].offsetWidth = this.$content[0].offsetWidth;

        // Add classes and content
        this.$content.html('<p>' + text + '</p>').addClass('content--error content--error-pop');

        this.toggleLoading();
    },

    render: function(response){
        var icon = new Image();
        icon.src = response.artworkUrl512;
        icon.onload = function() {
            Gimmie.$content
                .html(this)
                .append('<p><strong>' + response.trackName + '</strong> Image file dimensions: ' + this.naturalWidth + '×' + this.naturalHeight + '</p>')
                .removeClass('content--error');
            Gimmie.toggleLoading();

            // If it's an iphone icon, show the mask too
            if(response.kind != 'mac-software') {
                var mask = new Image();
                mask.src = 'img/icon-mask.png';
                mask.onload = function() {
                    Gimmie.$content.prepend(this);
                }
            } 
        }
    }
};


$(document).ready(function(){

    Gimmie.$form.on('submit', function(e){
        e.preventDefault();

        Gimmie.toggleLoading();

        var userSubmission = new MakeUserSubmission();
        
        if( userSubmission.isValidItunesUrl && userSubmission.getId() ) {

            $.ajax({
                // leave off the 'http:'
                url: "//itunes.apple.com/lookup?id=" + userSubmission.getId(),
                dataType: 'JSONP'
            })
            .done(function(response) { 
                
                // Get the first response and log it
                var response = response.results[0];
                console.log(response);

                // Check to see if request is valid & contains the info we want
                // If it does, render it. Otherwise throw an error
                if(response && response.artworkUrl512 != null){
                    Gimmie.render(response);
                } else {
                    Gimmie.throwError(
                        '<strong>Invalid Response</strong> The request you made appears to not have an associated icon. <br> Try a different URL.'
                    );
                }
            })
            .fail(function(data) { 
                Gimmie.throwError(
                    '<strong>iTunes API Error</strong> There was an error retrieving the info. Check the iTunes URL or try again later.'
                );
            });
        } else {
            Gimmie.throwError(
                '<strong>Invalid Link</strong> You must submit a standard iTunes store link with an ID, i.e. <br> https://itunes.apple.com/us/app/angry-birds/id343200656'
            );
        }
    });
});