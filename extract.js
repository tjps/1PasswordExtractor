/* Dump the contents of an unlocked 1PasswordAnywhere HTML locker.

   Add as a <script src="extract.js"></script> in 1Password.html or
   inject as a bookmarklet.

   Logs the final array of results to the DevTools console.  You can
   use `copy(extracted)` in the console to copy the full output to
   the system clipboard.
 */

var extracted = [];

(function(){

    function dump_entry(entry) {

        var username = null;
        var password = null;
        if ("fields" in entry.decrypted_secure_contents) {
            var fields = entry.decrypted_secure_contents.fields;
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].designation == "username") { username = fields[i].value; }
                if (fields[i].designation == "password") { password = fields[i].value; }
            }
        } else if ("password" in entry.decrypted_secure_contents) {
            password = entry.decrypted_secure_contents.password;
        }
        if (username || password) {
            extracted.push({
                title: entry.title,
                url: entry.data.location,
                username,
                password
            });
        }
    }

    function do_walk() {
        // Walk all the available entries through the dump_entry() hook.
        $("li", $("#sourcesPane")).each(function(idx) {
            $(this).click();
            $("li", $("#listPane")).each(function(idx) {
                $(this).click();
            });
        });
        console.log("Extracted entries:");
        console.log(extracted);
        console.log("Run copy(extracted) in the console to copy to clipboard");
    }

    function draw_contents() {
        // Replaces the entire body with a <pre> block containing
        // the dump for easy copy/paste.
        $("body").html("<pre>" + JSON.stringify(extracted) + "</pre>");
    }

    // Hook the profile unlock event.
    orig_profileContentsDidFinishLoading = window.profileContentsDidFinishLoading;
    window.profileContentsDidFinishLoading = function(json) {
        orig_profileContentsDidFinishLoading(json);

        // Kill auto-logout.
        for (var i = 0;i < 10000; i++) { clearInterval(i); }

        do_walk();
        //setTimeout( draw_contents, 3000);
    };

    // Hook the entry decryption function - after each call the global variable
    // will hold the decrypted entry.
    orig_showEntryDetails = window.showEntryDetails;
    window.showEntryDetails = function() {
        try {orig_showEntryDetails();} catch(e) {}
        dump_entry(selectedEntry);
    };

})();
