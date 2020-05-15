var padManager = require('ep_etherpad-lite/node/db/PadManager');

var settings = require('ep_etherpad-lite/node/utils/Settings');

var padPath = "p";
if (settings.ep_simple_creator) {
    if (settings.ep_simple_creator.padPath) {
        padPath = settings.ep_simple_creator.padPath;
    }
}

exports.eejsBlock_indexWrapper = function(hook_name, args, cb)
{
    // remove input form
    args.content += '<script>' + String(removeInput) + 'removeInput();</script>';
    // replace create function
    args.content += '<script src="./static/js/jquery.js"></script>';
    args.content += '<script> const padPath = "' + padPath + '";</script>';
    args.content += '<script>' + String(go2Next) + '</script>';
    args.content = args.content.replace("go2Random()", "go2Next()");
};

function removeInput()
{
    document.getElementById("label").remove();
    document.forms[0].remove();
}

function go2Next()
{
    $.ajax({
        url: "next_id",
        dataType: 'json',
        success: function ( data ) {
            window.location = padPath + "/" + data.id;
        }
    });
}

exports.registerRoute = function(hook_name, args, cb)
{
    args.app.get("/next_id", function(req, res) {
        padManager.listAllPads(function(e, data) {
            if (e) {
                return res.send("<div> Error:" + e + "</div>");
            }
            return res.send(format(getNextId(data))); 
        }).then(function(data) {
                res.send(format(getNextId(data)));
            }).catch(function(e) {
                res.send("<div> Error:" + e + "</div>");
            }); 
    });
};

function getNextId(data)
{
    if (data && data.padIDs) {
        for (var id = 0; id < data.padIDs.length; id++) {
            var found = false;
            for (var i = 0; i < data.padIDs.length; i++) {
               if (data.padIDs[i] == id) {
                   found = true;
                   break;
               }
            }
            if (!found) {
                return id;
            }
        }
    }
}

function format(data)
{
    return "{\"id\":" + data + "}";
}
