/* global tinymce, console */

tinymce.PluginManager.add('evimage', function(editor) {
    console.log('evimage is deprecated: use evelements');
    function showDialog() {
        var dom = editor.dom;
        var node = editor.selection.getNode();
        var attributes = null;

        if (node && node.getAttribute('data-picture-id')) {
            attributes = {
                src: dom.getAttrib(node, 'src'),
                alt: dom.getAttrib(node, 'alt'),
                'class': dom.getAttrib(node, 'class'),
                'data-picture-id': dom.getAttrib(node, 'data-picture-id')
            };
        }

        editor.settings.evimage(attributes, function(attributesNew) {
            if (attributes) {
                dom.removeAllAttribs(node);
                dom.setAttribs(node, attributesNew);
            } else {
                editor.selection.setContent(editor.dom.createHTML('img', attributesNew));
            }
        });
    }

    editor.addButton('evimage', {
        icon: 'image',
        tooltip: 'Insert/edit image',
        onclick: showDialog,
        stateSelector: 'img[data-picture-id]:not([data-mce-object],[data-mce-placeholder])'
    });

    editor.addMenuItem('evimage', {
        icon: 'image',
        text: 'Insert image',
        onclick: showDialog,
        context: 'insert',
        prependToContext: true
    });

    editor.addCommand('mceImage', showDialog);
});
